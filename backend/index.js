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

// Configure CORS
app.use(
  cors({
    origin: [
      " https://e228-182-252-68-225.ngrok-free.app",
      "http://localhost:5174",
      "http://localhost:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Webhook endpoint - must be before express.json() middleware
app.post(
  "/webhooks",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = "whsec_1gN9gHa24qx3naMdBfODqEfLjsDidkCR";
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case "account.updated":
          const account = event.data.object;
          // Find user with this Stripe account ID
          const user = await User.findOne({ stripeAccountId: account.id });
          
          if (user) {
            // Check if account is now complete
            const isComplete = account.charges_enabled && 
                            account.details_submitted &&
                            account.payouts_enabled &&
                            account.capabilities.card_payments === "active" &&
                            account.capabilities.transfers === "active";
            
            if (isComplete && !user.accountSetupComplete) {
              user.accountSetupComplete = true;
              await user.save();
              console.log(`Employee account setup completed for user: ${user._id}`);
            }
          }
          break;

        case "payment_intent.succeeded":
          const paymentIntent = event.data.object;
          const reservation = await Reservation.findOne({ paymentIntentId: paymentIntent.id });
          
          if (reservation) {
            reservation.status = "completed";
            await reservation.save();
          }
          break;

        case "payment_intent.payment_failed":
          const paymentFailed = await handlePaymentIntent(event.data.object);
          console.log("❌ Payment Failed");
          console.log("Customer Email:", paymentFailed?.userEmail);
          console.log("Reservation ID:", paymentFailed?.reservationId);
          console.log("Status: Failed");
          console.log(
            "Failure Message:",
            event.data.object.last_payment_error?.message
          );
          break;

        case "payment_intent.canceled":
          const paymentCanceled = await handlePaymentIntent(event.data.object);
          console.log("🚫 Payment Canceled");
          console.log("Customer Email:", paymentCanceled?.userEmail);
          console.log("Reservation ID:", paymentCanceled?.reservationId);
          console.log("Status: Canceled");
          break;

        case "refund.created":
          const paymentIntentRefund = await stripe.paymentIntents.retrieve(
            event.data.object.payment_intent
          );
          const refundCreated = await handlePaymentIntent(paymentIntentRefund);
          console.log("♻️ Refund Created");
          console.log("Customer Email:", refundCreated?.userEmail);
          console.log("Reservation ID:", refundCreated?.reservationId);
          console.log("Refund ID:", event.data.object.id);
          console.log("Amount Refunded:", event.data.object.amount / 100);
          console.log("Status: Refund Initiated");
          break;

        case "refund.succeeded":
          const successPaymentIntentRefund = await stripe.paymentIntents.retrieve(
            event.data.object.payment_intent
          );
          const refundSuccess = await handlePaymentIntent(successPaymentIntentRefund);
          console.log("✅ Refund Succeeded");
          console.log("Customer Email:", refundSuccess?.userEmail);
          console.log("Reservation ID:", refundSuccess?.reservationId);
          console.log("Refund ID:", event.data.object.id);
          console.log("Status: Refund Completed");
          break;

        case "refund.failed":
          const failedPaymentIntentRefund = await stripe.paymentIntents.retrieve(
            event.data.object.payment_intent
          );
          const refundFailed = await handlePaymentIntent(failedPaymentIntentRefund);
          console.log("❌ Refund Failed");
          console.log("Customer Email:", refundFailed?.userEmail);
          console.log("Reservation ID:", refundFailed?.reservationId);
          console.log("Refund ID:", event.data.object.id);
          console.log("Status: Refund Failed");
          console.log("Failure Reason:", event.data.object.failure_reason);
          break;

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (err) {
      console.error("Error processing webhook:", err);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  }
);

// JSON parsing middleware for all other routes
app.use(express.json());

// Create Stripe Connect account for employee
app.post("/api/employees/create-account", async (req, res) => {
  try {
    const { userId } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "employee") {
      return res.status(400).json({ message: "User is not an employee" });
    }

    // Create a Stripe Connect account
    const account = await stripe.accounts.create({
      type: "express",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // Update user with Stripe Connect account ID
    user.stripeAccountId = account.id;
    await user.save();

    // Create account links for onboarding
    const accountLinks = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: "http://localhost:5173/employee-onboarding/refresh",
      return_url: "http://localhost:5173/employee-onboarding/complete",
      type: "account_onboarding",
    });

    res.json({ url: accountLinks.url });
  } catch (error) {
    console.error("Error creating Connect account:", error);
    res.status(500).json({ message: "Error creating Connect account" });
  }
});

const handlePaymentIntent = async (paymentIntent) => {
  try {
    const reservation = await Reservation.findOne({
      $or: [
        { depositPaymentIntentId: paymentIntent.id },
        { "remainingPayments.paymentIntentId": paymentIntent.id },
      ],
    });

    if (!reservation) {
      console.log(
        `No reservation found for payment intent: ${paymentIntent.id}`
      );
      return;
    }

    return {
      userEmail: reservation.customerEmail,
      reservationId: reservation._id,
    };
  } catch (error) {
    console.error("Error fetching reservation:", error);
  }
};

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI_SPLIT_PAYMENTS, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Define Schemas
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: { type: String, enum: ["employee", "user"], default: "user" },
  stripeCustomerId: String,
  stripeAccountId: String, // For employees' Stripe Connect accounts
  accountSetupComplete: { type: Boolean, default: false }, // Track if employee has completed Stripe onboarding
});

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: String,
  createdAt: { type: Date, default: Date.now },
});

const reservationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: "pending" },
  paymentIntentId: String,
  amount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
const Service = mongoose.model("Service", serviceSchema);
const Reservation = mongoose.model("Reservation", reservationSchema);

// Routes

// User Registration
app.post("/api/users", async (req, res) => {
  try {
    const { name, email, role } = req.body;

    // Create a Stripe customer
    const customer = await stripe.customers.create({
      email: email,
      name: name,
    });

    const newUser = new User({
      name,
      email,
      role: role || "user",
      stripeCustomerId: customer.id,
    });

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

// Check employee account status
app.get("/api/employees/:userId/account-status", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user || !user.stripeAccountId) {
      return res
        .status(404)
        .json({ message: "Employee or Stripe account not found" });
    }

    const account = await stripe.accounts.retrieve(user.stripeAccountId);
    const isComplete = account.charges_enabled && 
                      account.details_submitted &&
                      account.payouts_enabled &&
                      account.capabilities.card_payments === "active" &&
                      account.capabilities.transfers === "active";

    if (isComplete && !user.accountSetupComplete) {
      user.accountSetupComplete = true;
      await user.save();
    }

    res.json({
      accountSetupComplete: isComplete,
      accountLink: !isComplete
        ? await stripe.accountLinks.create({
            account: user.stripeAccountId,
            refresh_url: "http://localhost:5173/employee-onboarding/refresh",
            return_url: "http://localhost:5173/employee-onboarding/complete",
            type: "account_onboarding",
          })
        : null,
    });
  } catch (error) {
    console.error("Error checking account status:", error);
    res.status(500).json({ message: "Error checking account status" });
  }
});

// Get available employees
app.get("/api/employees", async (req, res) => {
  try {
    const employees = await User.find({
      role: "employee",
      accountSetupComplete: true,
    }).select("name email");
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: "Error fetching employees" });
  }
});

// Create reservation with payment
app.post("/api/reservations", async (req, res) => {
  try {
    const { userId, serviceId, employeeId, paymentMethodId } = req.body;

    // Validate employee
    const employee = await User.findById(employeeId);
    if (!employee || employee.role !== "employee" || !employee.accountSetupComplete) {
      return res.status(400).json({ message: "Invalid or incomplete employee account" });
    }

    const service = await Service.findById(serviceId);
    const user = await User.findById(userId);

    if (!service || !user) {
      return res.status(404).json({ message: "Service or user not found" });
    }

    // Calculate the split amounts (80% platform, 20% employee)
    const totalAmount = Math.round(service.price * 100); // Convert to cents
    const employeeAmount = Math.round(totalAmount * 0.2);

    // Attach payment method if provided
    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: user.stripeCustomerId,
      });
      
      await stripe.customers.update(user.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    // Get customer's default payment method
    const customer = await stripe.customers.retrieve(user.stripeCustomerId);
    const defaultPaymentMethod = customer.invoice_settings.default_payment_method;

    if (!defaultPaymentMethod) {
      return res.status(400).json({
        success: false,
        error: "No payment method available. Please add a payment method.",
      });
    }

    // Create payment intent with immediate capture
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: "usd",
      customer: user.stripeCustomerId,
      payment_method: defaultPaymentMethod,
      off_session: true,
      confirm: true,
      transfer_data: {
        destination: employee.stripeAccountId,
        amount: employeeAmount,
      },
    });

    // Create the reservation
    const reservation = new Reservation({
      userId: user._id,
      serviceId: service._id,
      employeeId: employee._id,
      paymentIntentId: paymentIntent.id,
      amount: service.price,
      status: "confirmed", // Set to confirmed since payment is immediate
    });

    await reservation.save();

    res.json({
      success: true,
      message: "Reservation created and payment processed successfully",
      reservation,
      paymentIntent,
    });
  } catch (error) {
    console.error("Error creating reservation:", error);
    res.status(500).json({ message: "Error creating reservation", error: error.message });
  }
});

// Update reservation status
app.put("/api/reservations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ success: false, message: "Reservation not found" });
    }

    reservation.status = status;
    await reservation.save();

    return res.json({
      success: true,
      message: "Reservation status updated successfully",
      reservation,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
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
      customer: reservation.userId.stripeCustomerId,
    });

    // Set as default payment method
    await stripe.customers.update(reservation.userId.stripeCustomerId, {
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

// Get available employees
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find().select("-stripeCustomerId");
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/services", async (req, res) => {
  try {
    const services = await Service.find();
    res.json(services);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/reservations", async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate("userId", "name email role")
      .populate("serviceId", "name price");
    res.json(reservations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
