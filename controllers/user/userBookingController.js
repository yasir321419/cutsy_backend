const prisma = require("../../config/prismaConfig");
const { bookingConstants } = require("../../constant/constant");
const { ValidationError, NotFoundError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");

const createBookingAndPayment = async (req, res, next) => {
  try {
    const { barberId, scheduledTime, amount, locationName, locationLat, locationLng, services, paymentMethod } = req.body;
    const { id } = req.user;

    // Find the barber
    const findbarber = await prisma.barber.findUnique({
      where: {
        id: barberId,
      },
    });

    if (!findbarber) {
      throw new NotFoundError("Barber not found");
    }

    // Create payment intent for the booking (using Stripe or other payment provider)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      payment_method: paymentMethod,
      confirm: true,
    });

    // Check if payment was successful
    if (paymentIntent.status !== 'succeeded') {
      throw new ValidationError("Payment failed. Please try again.");
    }


    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        userId: id,
        barberId: findbarber.id,
        scheduledTime,
        amount,
        locationName,
        locationLat,
        locationLng,
        services: {
          create: services.map(service => ({
            serviceCategoryId: service.serviceCategoryId,
            price: service.price,
          })),
        },
      },
    });

    if (!booking) {
      throw new ValidationError("Booking creation failed");
    }


    // Create a payment record in the database
    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount,
        discount: req.body.discount || 0,
        platformFee: req.body.platformFee || 0,
        tip: req.body.tip || 0,
        paymentMethod,
        paymentIntentId: paymentIntent.id,  // Store the Stripe payment intent ID
      },
    });

    if (!payment) {
      throw new ValidationError("Payment creation failed");
    }

    // Send response with booking and payment details
    handlerOk(res, 200, { booking, payment, paymentIntentId: paymentIntent.id }, "Booking and payment created successfully");

  } catch (error) {
    next(error);
  }
};

const showAppoinmentDetail = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        barber: true,
        services: true
      }
    });

    if (!booking) {
      throw new NotFoundError("appoinment detail not found")
    }

    handlerOk(res, 200, booking, "appoinment detail found");
  } catch (error) {
    next(error)
  }
}

const cancelAppointment = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;
    // Cancel the booking status
    const cancelledBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: bookingConstants.CANCELLED, cancellationReason: reason },
    });

    if (!cancelledBooking) {
      throw new ValidationError("Booking not found or already cancelled");
    }

    // Cancel the payment associated with this booking
    const cancelledPayment = await prisma.payment.update({
      where: { bookingId: bookingId },
      data: { status: 'CANCELLED', cancellationReason: reason }, // assuming you have a `status` field in Payment model
    });

    if (!cancelledPayment) {
      throw new ValidationError("Payment cancellation failed");
    }

    handlerOk(res, 200, { cancelledBooking, cancelledPayment }, "Booking and payment cancelled successfully");
  } catch (error) {
    next(error);
  }
};

const trackBarber = async (req, res, next) => {
  try {
    const { barberId } = req.params;
    const { latitude, longitude, barberLatitude, barberLongitude, status, bookingId } = req.body; // Data from frontend

    // Fetch the barber details
    const barber = await prisma.barber.findUnique({
      where: {
        id: barberId,
      },
    });

    if (!barber) {
      throw new NotFoundError("Barber not found");
    }

    // First check if tracking already exists
    let existingTracking = await prisma.bookingTracking.findFirst({
      where: {
        bookingId: bookingId,
      },
    });

    // If no tracking record exists, create a new one
    if (!existingTracking) {
      const createdTracking = await prisma.bookingTracking.create({
        data: {
          bookingId: bookingId,
          lat: latitude, // User's latitude
          lng: longitude, // User's longitude
          barberLat: barberLatitude, // Barber's latitude (sent from frontend)
          barberLng: barberLongitude, // Barber's longitude (sent from frontend)
          status: status, // Status from frontend (e.g., "On the way")
          timestamp: new Date(),
        },
      });

      return handlerOk(res, 200, {
        status: "Tracking started",
        userLat: latitude,
        userLng: longitude,
        barberLat: barberLatitude,
        barberLng: barberLongitude,
        status: status,
      }, "Tracking created successfully");
    }

    // If tracking record exists, update it with new information
    const updatedTracking = await prisma.bookingTracking.update({
      where: {
        id: existingTracking.id,
      },
      data: {
        lat: latitude, // Updated user latitude
        lng: longitude, // Updated user longitude
        barberLat: barberLatitude, // Updated barber latitude
        barberLng: barberLongitude, // Updated barber longitude
        status: status, // Updated status
        timestamp: new Date(),
      },
    });

    // Optionally update the booking status with the status from frontend
    const updatedBooking = await prisma.booking.update({
      where: {
        id: bookingId,
      },
      data: {
        status: status, // Update booking status with status from frontend
      },
    });

    // Update payment status if needed
    const updatedPayment = await prisma.payment.update({
      where: {
        bookingId: bookingId,
      },
      data: {
        status: status, // Update payment status based on booking status
      },
    });

    handlerOk(res, 200, {
      status: "Tracking updated successfully",
      userLat: latitude,
      userLng: longitude,
      barberLat: barberLatitude,
      barberLng: barberLongitude,
      status: status,
    }, "Tracking updated successfully");

  } catch (error) {
    next(error);
  }
};

const showInvoice = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    // Fetch the booking and payment details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        barber: true,
        services: true,
        payment: true,  // Include payment details
      }
    });

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    const { payment } = booking;

    if (!payment) {
      throw new NotFoundError("Payment details not found");
    }

    // Return the invoice details
    handlerOk(res, 200, {
      bookingId: booking.id,
      barber: booking.barber.name,
      services: booking.services,
      totalAmount: payment.totalAmount,
      discount: payment.discount,
      platformFee: payment.platformFee,
      amountPaid: payment.amount,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      paymentIntentId: payment.paymentIntentId,
      createdAt: payment.createdAt,
    }, "Invoice details found successfully");
  } catch (error) {
    next(error);
  }
};

const showPaymentReceipt = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    // Fetch the payment receipt details
    const payment = await prisma.payment.findUnique({
      where: { bookingId: bookingId },
      include: {
        booking: true, // Include booking details to show the barber, amount, etc.
      },
    });

    if (!payment) {
      throw new NotFoundError("Payment receipt not found");
    }

    // Return the payment receipt details
    handlerOk(res, 200, {
      bookingId: payment.bookingId,
      barber: payment.booking.barber.name,
      amountPaid: payment.amount,
      totalAmount: payment.totalAmount,
      paymentMethod: payment.paymentMethod,
      paymentIntentId: payment.paymentIntentId,
      status: payment.status,
      createdAt: payment.createdAt,
    }, "Payment receipt found successfully");
  } catch (error) {
    next(error);
  }
};

const submitReview = async (req, res, next) => {
  try {
    const { bookingId, rating, comment } = req.body;
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    const review = await prisma.review.create({
      data: {
        bookingId,
        rating,
        comment,
        userId: req.user.id,
        barberId: booking.barberId,
      },
    });

    handlerOk(res, 200, review, "Review submitted successfully");
  } catch (error) {
    next(error);
  }
};


module.exports = {
  createBookingAndPayment,
  showAppoinmentDetail,
  cancelAppointment,
  trackBarber,
  submitReview,
  showInvoice,
  showPaymentReceipt,
}