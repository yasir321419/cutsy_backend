
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

module.exports = {
  handlePaymentIntentPaymentFailed,
  handlePaymentIntentSucceeded
}
