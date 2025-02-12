const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const stripe = require("stripe")(
  "sk_test_51Qp5LOPs8mVJ1TARHLe2BwHxb4lP9rDLqJqKbZzdSNXsXsz1UjqpwlwCtY8G419upYMaCdn8b8Dgr3BRllDmOAa1008KFuRdrT",
  {
    apiVersion: "2023-10-16", // Or the latest version
  }
);
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;
app.use(cors({
    origin: ['https://f0db-182-252-68-225.ngrok-free.app', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Define Schemas
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  stripeCustomerId: String, // Store Stripe Customer ID
});

const serviceSchema = new mongoose.Schema({
  name: String,
  price: Number,
  description: String,
});

const reservationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    required: true,
  },
  depositPaymentIntentId: String,
  remainingAmount: Number, //save Remaining Amount
  status: {
    type: String,
    enum: ["pending deposit", "in progress", "completed", "cancelled"],
    default: "pending deposit",
  },
  paymentMethodId: String,
  customerId: String,
  refundId: String,
  refundStatus: String,
});

const User = mongoose.model("User", userSchema);
const Service = mongoose.model("Service", serviceSchema);
const Reservation = mongoose.model("Reservation", reservationSchema);

// Routes

// User Registration
app.post("/api/users", async (req, res) => {
  try {
    const { name, email } = req.body;

    // Create a Stripe customer
    const customer = await stripe.customers.create({
      email: email,
      name: name,
    });

    const newUser = new User({ name, email, stripeCustomerId: customer.id });
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
});

// Create Service
app.post("/api/services", async (req, res) => {
  try {
    const newService = new Service(req.body);
    const savedService = await newService.save();
    res.status(201).json(savedService);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
});

// Create Reservation and process deposit
app.post("/api/reservations", async (req, res) => {
  try {
    const { userId, serviceId } = req.body;

    const user = await User.findById(userId);
    const service = await Service.findById(serviceId);

    if (!user || !service) {
      return res.status(400).json({ message: "Invalid user or service ID" });
    }

    const depositAmount = service.price * 0.5;
    const remainingAmount = service.price * 0.5;

    // 1. Create a Setup Intent to save the card for future use
    const setupIntent = await stripe.setupIntents.create({
      customer: user.stripeCustomerId,
      payment_method_types: ['card'],
      usage: 'off_session', // This allows the card to be used for future payments
    });

    // 2. Create a Payment Intent for the deposit
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(depositAmount * 100),
      currency: "usd",
      customer: user.stripeCustomerId,
      setup_future_usage: 'off_session', // This tells Stripe to save the card
      automatic_payment_methods: {
        enabled: true,
      },
    });

    const newReservation = new Reservation({
      userId,
      serviceId,
      depositPaymentIntentId: paymentIntent.id,
      remainingAmount: remainingAmount,
      customerId: user.stripeCustomerId,
      // We'll update the paymentMethodId after successful payment
    });
    const savedReservation = await newReservation.save();

    res.status(201).json({
      ...savedReservation.toObject(),
      clientSecret: paymentIntent.client_secret,
      setupIntentSecret: setupIntent.client_secret,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
});

// Add a new endpoint to update payment method ID
app.post("/api/reservations/:id/payment-method", async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethodId } = req.body;

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    // Save the payment method ID
    reservation.paymentMethodId = paymentMethodId;
    await reservation.save();

    // Attach the payment method to the customer for future use
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: reservation.customerId,
    });

    // Set as default payment method
    await stripe.customers.update(reservation.customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    return res.json({
      success: true,
      message: "Payment method saved successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: error.message });
  }
});

// Update Reservation Status and Handle Payments
app.put("/api/reservations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const reservation = await Reservation.findById(id)
      .populate("userId")
      .populate("serviceId");

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    // Store the old status before updating
    const oldStatus = reservation.status;
    reservation.status = status;

    // Handle different status transitions
    if (status === "cancelled" && oldStatus !== "cancelled") {
      try {
        // Get the payment intent to check if it's refundable
        const paymentIntent = await stripe.paymentIntents.retrieve(
          reservation.depositPaymentIntentId
        );

        if (paymentIntent.status === "succeeded") {
          // Create a refund
          const refund = await stripe.refunds.create({
            payment_intent: reservation.depositPaymentIntentId,
            reason: 'requested_by_customer',
          });

          // Save refund information to reservation
          reservation.refundId = refund.id;
          reservation.refundStatus = refund.status;
          reservation.remainingAmount = 0; // Reset remaining amount since we're refunding
          
          await reservation.save();

          return res.json({
            success: true,
            message: "Reservation cancelled and deposit refunded",
            refund: refund,
          });
        } else {
          return res.status(400).json({
            success: false,
            message: "Cannot refund payment that hasn't been completed",
          });
        }
      } catch (error) {
        console.error("Error processing refund:", error);
        return res.status(400).json({
          success: false,
          message: "Failed to process refund",
          error: error.message,
        });
      }
    } else if (status === "completed") {
      const remainingAmount = reservation.remainingAmount;

      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(remainingAmount * 100),
          currency: "usd",
          customer: reservation.customerId,
          payment_method: reservation.paymentMethodId, // Use saved payment method
          off_session: true,
          confirm: true,
        });
        
        reservation.remainingAmount = 0;
        await reservation.save();
        
        return res.json({
          success: true,
          message: "Remaining balance charged successfully.",
          paymentIntentId: paymentIntent.id,
        });
      } catch (error) {
        console.error("Error charging remaining balance:", error);
        return res.status(400).json({ 
          success: false, 
          error: error.message 
        });
      }
    }
    
    // For other status changes, just save and return
    await reservation.save();
    return res.json({ 
      success: true,
      message: "Reservation status updated successfully" 
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
