require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_KEY);
// Function to handle successful payment intent

const prisma = require("../config/prismaConfig");



const handlePaymentIntentSucceeded = async (paymentIntent) => {
  const paymentId = paymentIntent.id;
  const amountReceived = paymentIntent.amount_received;
  const bookingId = paymentIntent.metadata.bookingId; // Assuming you pass booking ID in metadata

  try {
    // Update Payment table with the successful payment
    await prisma.payment.update({
      where: { paymentIntentId: paymentId },
      data: {
        paymentStatus: 'PAID',
        totalAmount: amountReceived,
      }
    });

    // Update Booking table as well
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'COMPLETED',  // Mark the booking as completed
      },
    });

    console.log("Payment and booking details saved successfully");
  } catch (error) {
    console.error("Error occurred while handling payment intent:", error);
  }
};

// Function to handle failed payment intent
const handlePaymentIntentPaymentFailed = async (paymentIntent) => {
  const paymentId = paymentIntent.id;
  const bookingId = paymentIntent.metadata.bookingId; // Assuming you pass booking ID in metadata

  try {
    // Update Payment table with failed payment status
    await prisma.payment.update({
      where: { paymentIntentId: paymentId },
      data: {
        paymentStatus: 'FAILED',
      }
    });

    // Update Booking table as well (e.g., mark it as cancelled)
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',  // Mark the booking as cancelled
        cancellationReason: "Payment failed",  // Optionally store the reason
      },
    });

    console.log(`Payment ${paymentId} updated to failed`);
  } catch (error) {
    console.error(`Error updating payment ${paymentId}:`, error);
  }
};

// Uses the same stripeInstance you used in the webhook route
const handleSetupIntentPaymentSucceeded = async (setupIntent) => {
  // IDs can be strings or objects depending on expansion
  const customerId =
    typeof setupIntent.customer === 'string'
      ? setupIntent.customer
      : setupIntent.customer?.id;

  const paymentMethodId =
    typeof setupIntent.payment_method === 'string'
      ? setupIntent.payment_method
      : setupIntent.payment_method?.id;

  if (!customerId || !paymentMethodId) {
    console.warn('setup_intent.succeeded missing customer or payment_method');
    return;
  }

  // 1) Retrieve PM and attach if not already attached
  let pm = await stripe.paymentMethods.retrieve(paymentMethodId);

  if (!pm.customer) {
    pm = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
  }

  // 2) Optionally set default:
  //    - if client asked via metadata.make_default === 'true'
  //    - or if the customer currently has no default PM
  const makeDefault = setupIntent.metadata?.make_default === 'true';
  const customer = await stripe.customers.retrieve(customerId);
  const hasDefault = !!customer.invoice_settings?.default_payment_method;

  if (makeDefault || !hasDefault) {
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
  }

  // Done. Nothing to return to Stripe—just keep webhook fast.
};


module.exports = {
  handlePaymentIntentPaymentFailed,
  handlePaymentIntentSucceeded,
  handleSetupIntentPaymentSucceeded
}
