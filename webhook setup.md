
Okay, let's outline how to set up a Stripe webhook to handle payment success, cancellation, and failure events, and then send emails to customers from your backend.

**1. Stripe Webhook Setup in Your Stripe Dashboard**

*   **Log in to Your Stripe Dashboard:**  Go to https://dashboard.stripe.com/.
*   **Developers > Webhooks:** Navigate to the "Developers" section and then click on "Webhooks."
*   **Add Endpoint:** Click the "+ Add endpoint" button.
*   **Endpoint URL:** Enter the URL of the endpoint in your backend that will handle the webhook events (e.g., `https://yourdomain.com/api/stripe-webhook`).  During local development, you can use a tool like `stripe listen --forward-to localhost:5000/api/stripe-webhook` (Stripe CLI) or `ngrok` to expose your local server to Stripe.
*   **Events to Send:**  Choose the specific events you want to receive.  At a minimum, you'll need:
    *   `payment_intent.succeeded`:  For successful payments.
    *   `payment_intent.payment_failed`:  For failed payments.
    *   `payment_intent.canceled`: For cancelled payments.
*   **Add Endpoint:** Click the "Add endpoint" button to save the webhook configuration.
*   **Signing Secret:** After creating the webhook endpoint, Stripe will generate a signing secret. **Copy this secret!** You'll need it in your backend to verify that the webhook events are actually coming from Stripe and haven't been tampered with.

**2. Backend (Node.js/Express) - Webhook Endpoint**

*   **Install `body-parser`:**

    ```bash
    npm install body-parser
    ```

*   **`/api/stripe-webhook` Route:**

    ```javascript
    const express = require('express');
    const router = express.Router();
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const bodyParser = require('body-parser');

    // Use raw body parsing for the webhook route
    router.post(
        '/stripe-webhook',
        bodyParser.raw({ type: 'application/json' }),
        async (req, res) => {
            const sig = req.headers['stripe-signature'];
            const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET; // Store this in your .env file

            let event;

            try {
                event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
            } catch (err) {
                console.error(`Webhook signature verification failed: ${err.message}`);
                return res.status(400).send(`Webhook Error: ${err.message}`);
            }

            try {
                switch (event.type) {
                    case 'payment_intent.succeeded':
                        const paymentIntentSucceeded = event.data.object;
                        // Handle successful payment
                        await handlePaymentIntentSucceeded(paymentIntentSucceeded);
                        break;
                    case 'payment_intent.payment_failed':
                        const paymentIntentPaymentFailed = event.data.object;
                        // Handle failed payment
                        await handlePaymentIntentFailed(paymentIntentPaymentFailed);
                        break;
                    case 'payment_intent.canceled':
                        const paymentIntentCanceled = event.data.object;
                        // Handle canceled payment
                        await handlePaymentIntentCanceled(paymentIntentCanceled);
                        break;
                    default:
                        console.log(`Unhandled event type ${event.type}`);
                }
            } catch (error) {
                console.error('Error handling webhook event:', error);
                return res.status(500).send('Webhook processing error');
            }

            res.json({ received: true });
        }
    );

    // Helper Functions (Implement these based on your application)
    async function handlePaymentIntentSucceeded(paymentIntent) {
        console.log('PaymentIntent Succeeded:', paymentIntent);

        // Extract information from the payment intent
        const customerId = paymentIntent.customer;
        const amount = paymentIntent.amount / 100; // Convert from cents/pennies to dollars/euros
        const currency = paymentIntent.currency;
        const paymentIntentId = paymentIntent.id;

        // Find the user in your database based on the Stripe customer ID
        const user = await User.findOne({ stripeCustomerId: customerId });

        if (user) {
            // Send a success email to the customer
            await sendEmail(
                user.email,
                'Payment Successful',
                `Your payment of ${amount} ${currency} has been processed successfully. Payment Intent ID: ${paymentIntentId}`
            );

            // Optionally, update your database to reflect the successful payment (e.g., update order status)
            // await updateOrderStatus(paymentIntentId, 'paid');
        } else {
            console.warn(`User not found for Stripe customer ID: ${customerId}`);
        }
    }

    async function handlePaymentIntentFailed(paymentIntent) {
        console.log('PaymentIntent Failed:', paymentIntent);

        // Extract information from the payment intent
        const customerId = paymentIntent.customer;
        const lastPaymentError = paymentIntent.last_payment_error; // Get the error details

        // Find the user in your database based on the Stripe customer ID
        const user = await User.findOne({ stripeCustomerId: customerId });

        if (user) {
            // Send a failure email to the customer
            await sendEmail(
                user.email,
                'Payment Failed',
                `Your payment has failed. Please update your payment information. Error: ${lastPaymentError?.message || 'Unknown error'}`
            );

            // Optionally, update your database to reflect the failed payment (e.g., update order status)
            // await updateOrderStatus(paymentIntent.id, 'payment_failed');
        } else {
            console.warn(`User not found for Stripe customer ID: ${customerId}`);
        }
    }

    async function handlePaymentIntentCanceled(paymentIntent) {
        console.log('PaymentIntent Canceled:', paymentIntent);

        // Extract information from the payment intent
        const customerId = paymentIntent.customer;

        // Find the user in your database based on the Stripe customer ID
        const user = await User.findOne({ stripeCustomerId: customerId });

        if (user) {
            // Send a cancellation email to the customer
            await sendEmail(
                user.email,
                'Payment Canceled',
                `Your payment has been canceled.`
            );

            // Optionally, update your database to reflect the canceled payment (e.g., update order status)
            // await updateOrderStatus(paymentIntent.id, 'canceled');
        } else {
            console.warn(`User not found for Stripe customer ID: ${customerId}`);
        }
    }

    // Email Sending Function (Implement this using a library like Nodemailer)
    async function sendEmail(to, subject, body) {
        console.log(`Sending email to ${to} with subject "${subject}"`);
        // Implement your email sending logic here using Nodemailer or a similar library
        // Example using Nodemailer (install Nodemailer: npm install nodemailer):

        const nodemailer = require('nodemailer');

        // Create a transporter object using your email service credentials
        const transporter = nodemailer.createTransport({
            service: 'Gmail', // or your email service
            auth: {
                user: 'your_email@gmail.com', // Your email address
                pass: 'your_email_password', // Your email password or an app password
            },
        });

        // Define the email options
        const mailOptions = {
            from: 'your_email@gmail.com',
            to: to,
            subject: subject,
            text: body,
        };

        // Send the email
        try {
            await transporter.sendMail(mailOptions);
            console.log('Email sent successfully');
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }

    module.exports = router;
    ```

    *   **`STRIPE_WEBHOOK_SECRET`:**  Store your Stripe webhook signing secret in your `.env` file.  **Never hardcode this value.**
    *   **`body-parser.raw({ type: 'application/json' })`:**  This is crucial.  Stripe sends the webhook event payload as raw JSON.  You need to use `body-parser.raw` to access the raw JSON body for signature verification.  Otherwise, the signature verification will fail.
    *   **`stripe.webhooks.constructEvent()`:**  This function verifies that the webhook event is actually coming from Stripe and hasn't been tampered with.  It uses the signing secret to calculate a signature and compares it to the signature in the `stripe-signature` header.  If the signatures don't match, it throws an error.
    *   **Event Handling:**  The `switch` statement handles different Stripe event types.  Implement the `handlePaymentIntentSucceeded`, `handlePaymentIntentFailed`, and `handlePaymentIntentCanceled` functions to process the events.
    *   **Email Sending (`sendEmail`):** The `sendEmail` function is a placeholder.  You'll need to implement it using a library like Nodemailer (https://nodemailer.com/) or SendGrid to send emails.
    *   **Error Handling:**  Implement robust error handling to catch any errors that occur during webhook processing.  Log errors and send appropriate error responses.
    *   **Database Updates:**  Optionally, update your database to reflect the payment status (e.g., update the order status to "paid," "payment_failed," or "canceled").
    *   **Idempotency:** Ideally, webhook handlers should be idempotent. That means if the same event is sent multiple times (which can happen), your system should only process it once. This is to prevent duplicate emails or database updates. You can achieve this by tracking processed event IDs in your database.

**3. Email Sending (Nodemailer Example)**

*   **Install Nodemailer:**

    ```bash
    npm install nodemailer
    ```

*   **Implement `sendEmail` Function (as shown above):**

    ```javascript
    const nodemailer = require('nodemailer');

    async function sendEmail(to, subject, body) {
        // Create a transporter object using your email service credentials
        const transporter = nodemailer.createTransport({
            service: 'Gmail', // or your email service
            auth: {
                user: 'your_email@gmail.com', // Your email address
                pass: 'your_email_password', // Your email password or an app password
            },
        });

        // Define the email options
        const mailOptions = {
            from: 'your_email@gmail.com',
            to: to,
            subject: subject,
            text: body,
        };

        // Send the email
        try {
            await transporter.sendMail(mailOptions);
            console.log('Email sent successfully');
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }
    ```

    *   **Replace Placeholders:**  Replace `'your_email@gmail.com'` and `'your_email_password'` with your actual email credentials. **Important:** For Gmail, you may need to enable "Less secure app access" or use an "App Password" (recommended).
    *   **Email Service:** You can use other email services like SendGrid, Mailgun, or AWS SES.  The configuration will vary depending on the service.

**4. Testing Your Webhook**

*   **Stripe CLI:**  The Stripe CLI is the easiest way to test webhooks locally.

    ```bash
    stripe listen --forward-to localhost:5000/api/stripe-webhook
    ```

*   **Trigger Events:**  Use the Stripe CLI to trigger test events:

    ```bash
    stripe trigger payment_intent.succeeded
    stripe trigger payment_intent.payment_failed
    stripe trigger payment_intent.canceled
    ```

*   **Verify:**  Check your backend logs to ensure that the webhook events are being received and processed correctly.  Verify that emails are being sent.

**5. Security Considerations**

*   **HTTPS:** Ensure that your webhook endpoint is served over HTTPS.
*   **Signature Verification:**  Always verify the webhook signature to prevent malicious actors from sending fake events to your endpoint.
*   **Rate Limiting:**  Implement rate limiting on your webhook endpoint to prevent abuse.
*   **Error Handling:**  Handle errors gracefully and log them for debugging.
*   **Idempotency:** Implement idempotent handling of webhook events.

**Example `.env` File:**

```
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret
MONGODB_URI=mongodb://localhost:27017/stripe-deposit-app
```

**Postman (Example for Testing Webhook)**

```json
{
    "info": {
        "_postman_id": "YOUR_POSTMAN_ID",
        "name": "Stripe Webhook",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "item": [
        {
            "name": "Stripe Webhook",
            "request": {
                "method": "POST",
                "header": [
                    {
                        "key": "Content-Type",
                        "value": "application/json",
                        "type": "text"
                    },
                     {
                        "key": "stripe-signature",
                        "value": "t=1678880000,v1=YOUR_STRIPE_SIGNATURE", // Replace with a valid signature
                        "type": "text"
                    }
                ],
                "body": {
                    "mode": "raw",
                    "raw": "{ \"type\": \"payment_intent.succeeded\", \"data\": { \"object\": { \"id\": \"pi_test123\", \"customer\": \"cus_test456\", \"amount\": 1000, \"currency\": \"usd\" } } }"
                },
                "url": {
                    "raw": "https://yourdomain.com/api/stripe-webhook",
                    "protocol": "https",
                    "host": [
                        "yourdomain",
                        "com"
                    ],
                    "path": [
                        "api",
                        "stripe-webhook"
                    ]
                },
                "description": "Simulates a Stripe webhook event.  Requires a valid Stripe signature in the `stripe-signature` header. You can only test to check the code. Otherwise signature verification will fail."
            },
            "response": []
        }
    ]
}
```

Remember to:
*replace `YOUR_STRIPE_SIGNATURE` with a real signature.
*To test the signature, you'd need the raw request body and webhook secret to generate a signature, and then include it in the postman request.
* This example is a dummy example to test whether your code works. Without a real signature verification won't work and you will get a signature verification error.

This provides a comprehensive guide to setting up Stripe webhooks for sending emails. Remember to adapt the code to your specific application requirements and test thoroughly.
