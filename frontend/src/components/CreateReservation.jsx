import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

// Initialize Stripe outside of component
const stripePromise = loadStripe(
  "pk_test_51Qp5LOPs8mVJ1TARXPGnFhtXqSGxyInN2qfw2Suc8Uc9UT4iDcYC90XHcCWjViiqsIidXKA1sSoHEE68SdBXvR8000d6SXeuJa"
);

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "16px",
      color: "#424770",
      "::placeholder": {
        color: "#aab7c4",
      },
    },
    invalid: {
      color: "#9e2146",
    },
  },
  hidePostalCode: true,
};

const CheckoutForm = ({
  userId,
  serviceId,
  setReservationSuccess,
  setReservationError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!stripe || !elements) {
      setError("Stripe has not been initialized");
      setIsLoading(false);
      return;
    }

    try {
      // Create the reservation first
      const response = await fetch("http://localhost:5000/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, serviceId }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create reservation");
      }

      const data = await response.json();
      console.log("Reservation created:", data);

      if (!data.clientSecret) {
        throw new Error("No client secret received from server");
      }

      // Confirm the card payment
      const { error: paymentError, paymentIntent } =
        await stripe.confirmCardPayment(data.clientSecret, {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: "Jenny Rosen",
            },
          },
          setup_future_usage: 'off_session', // This tells Stripe to save the card
        });

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      // Save the payment method ID
      if (paymentIntent.payment_method) {
        const saveMethodResponse = await fetch(
          `http://localhost:5000/api/reservations/${data._id}/payment-method`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              paymentMethodId: paymentIntent.payment_method,
            }),
            credentials: "include",
          }
        );

        if (!saveMethodResponse.ok) {
          console.error("Failed to save payment method");
        }
      }

      // Payment successful
      console.log("Payment successful:", paymentIntent);
      setReservationSuccess(true);
      navigate("/success");
    } catch (error) {
      console.error("Payment failed:", error);
      setError(error.message);
      setReservationError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ maxWidth: "500px", margin: "0 auto" }}
    >
      <div style={{ marginBottom: "20px" }}>
        <CardElement options={CARD_ELEMENT_OPTIONS} />
      </div>
      {error && (
        <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>
      )}
      <button
        type="submit"
        disabled={!stripe || isLoading}
        style={{
          backgroundColor: "#5469d4",
          color: "white",
          padding: "10px 20px",
          borderRadius: "4px",
          border: "none",
          cursor: isLoading ? "not-allowed" : "pointer",
          opacity: isLoading ? 0.7 : 1,
        }}
      >
        {isLoading ? "Processing..." : "Pay Deposit"}
      </button>
    </form>
  );
};

function CreateReservation() {
  const [userId, setUserId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [reservationSuccess, setReservationSuccess] = useState(false);
  const [reservationError, setReservationError] = useState(null);
  const [showPayment, setShowPayment] = useState(false);

  const handleProceed = (e) => {
    e.preventDefault();
    if (userId && serviceId) {
      setShowPayment(true);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2>Create Reservation</h2>
      {!showPayment ? (
        <form onSubmit={handleProceed}>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>
              User ID:
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ddd",
              }}
            />
          </div>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>
              Service ID:
            </label>
            <input
              type="text"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ddd",
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              backgroundColor: "#5469d4",
              color: "white",
              padding: "10px 20px",
              borderRadius: "4px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Proceed to Payment
          </button>
        </form>
      ) : (
        <Elements stripe={stripePromise}>
          <CheckoutForm
            userId={userId}
            serviceId={serviceId}
            setReservationSuccess={setReservationSuccess}
            setReservationError={setReservationError}
          />
        </Elements>
      )}
      {reservationError && (
        <p style={{ color: "red", marginTop: "10px" }}>
          Error: {reservationError}
        </p>
      )}
    </div>
  );
}

export default CreateReservation;
