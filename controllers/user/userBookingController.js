require("dotenv").config();

const { service } = require("../../config/emailConfig");
const prisma = require("../../config/prismaConfig");
const { bookingConstants } = require("../../constant/constant");
const { ValidationError, NotFoundError, BadRequestError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");
const sendNotification = require("../../utils/notification");
const { createPaymentIntent } = require("../../utils/stripeApis");
const stripe = require("stripe")(process.env.STRIPE_KEY);





const createBookingAndPayment = async (req, res, next) => {
  try {
    const {
      barberId,
      startTime,   // now direct ISO datetime string
      endTime,     // now direct ISO datetime string
      locationName,
      locationLat,
      locationLng,
      day,
      services = [],
    } = req.body;

    const { id: userId, firstName } = req.user || {};

    // ---------- Validation ----------
    if (!barberId) throw new BadRequestError("barberId is required");
    if (!startTime || !endTime) throw new BadRequestError("startTime and endTime are required");
    if (!Array.isArray(services) || services.length === 0) {
      throw new BadRequestError("At least one service is required");
    }

    // Parse into Date objects
    const startUTC = new Date(startTime);
    const endUTC = new Date(endTime);

    if (!(startUTC instanceof Date) || isNaN(startUTC)) {
      throw new BadRequestError("Invalid startTime");
    }
    if (!(endUTC instanceof Date) || isNaN(endUTC)) {
      throw new BadRequestError("Invalid endTime");
    }
    if (endUTC <= startUTC) {
      throw new BadRequestError("endTime must be after startTime");
    }

    // Coerce and validate lat/lng as numbers
    const latNum = locationLat !== undefined ? Number(locationLat) : undefined;
    const lngNum = locationLng !== undefined ? Number(locationLng) : undefined;
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      throw new BadRequestError("locationLat and locationLng must be valid numbers");
    }

    // ---------- 1) Find barber ----------
    const findbarber = await prisma.barber.findUnique({
      where: { id: barberId },
      include: {
        BarberService: true,
      },
    });
    if (!findbarber) throw new NotFoundError("Barber not found");

    // ---------- 2) Services check ----------
    const serviceIndex = new Map(findbarber.BarberService.map((s) => [s.id, s]));
    const selectedService = services
      .map((sid) => serviceIndex.get(sid))
      .filter(Boolean);

    // ---------- 3) Overlap check ----------
    const existing = await prisma.booking.findFirst({
      where: {
        barberId: findbarber.id,
        startTime: { lt: endUTC },
        endTime: { gt: startUTC },
      },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestError("Selected time conflicts with another booking.");
    }

    // ---------- 4) Create booking ----------
    const booking = await prisma.booking.create({
      data: {
        userId,
        barberId: findbarber.id,
        day,
        startTime: startUTC, // direct UTC datetime
        endTime: endUTC,
        locationName,
        locationLat: latNum,
        locationLng: lngNum,
        services: {
          create: selectedService.map((s) => ({
            serviceCategory: { connect: { id: s.serviceCategoryId } },
            price: parseFloat(s.price),
          })),
        },
      },
      include: { services: true },
    });

    if (!booking) throw new ValidationError("Booking creation failed");

    // ---------- 5) Create barber notification ----------
    await prisma.barberNotification.create({
      data: {
        barberId: findbarber.id,
        bookingId: booking.id,
        title: "🎉 New Booking",
        description: `${firstName} booked an appointment with you from ${startUTC.toISOString()} to ${endUTC.toISOString()}.`,
      },
    });

    // ---------- 6) Return ----------
    return handlerOk(res, 200, { booking }, "Booking created successfully");
  } catch (error) {
    next(error);
  }
};

const showAppoinmentDetail = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const booking = await prisma.booking.findUnique({
      where: {
        id: bookingId,
        status: {
          in: ['PENDING', 'ACCEPTED']
        }
      },
      include: {
        user: true,
        barber: true,
        services: {
          include: {
            serviceCategory: { select: { service: true } }
          }
        }

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
    const { id, deviceToken, firstName } = req.user;
    // Fetch the booking to ensure it exists
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId, status: "PENDING" },
      include: { payment: true, barber: true },  // Include payment details with booking
    });

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    // Cancel the booking status
    const cancelledBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: bookingConstants.CANCELLED,
        cancellationReason: reason,
      },
    });

    if (!cancelledBooking) {
      throw new ValidationError("Booking not cancelled");
    }

    // Cancel the payment associated with this booking if it exists
    if (booking.payment) {
      const cancelledPayment = await prisma.payment.update({
        where: { bookingId: bookingId },
        data: {
          status: 'CANCELLED',
          cancellationReason: reason, // Store the cancellation reason
        },
      });

      if (!cancelledPayment) {
        throw new ValidationError("Payment cancellation failed");
      }

      // Cancel the Stripe payment intent if payment exists
      // if (booking.payment.paymentIntentId) {
      //   await stripeInstance.paymentIntents.cancel(booking.payment.paymentIntentId);
      // }
    }

    // await sendNotification(
    //   id,
    //   deviceToken,
    //   `Hi ${firstName}, you've successfully cancelled your appointment with "${booking.barber.name}".`
    // );

    // await sendNotification(
    //   id,
    //   booking.barber.deviceToken,
    //   `Hi ${booking.barber.name}, the appointment with "${firstName}" has been cancelled.`
    // );


    handlerOk(res, 200, {
      cancelledBooking,
      // cancelledPayment: booking.payment
    }, "Booking and payment cancelled successfully");

  } catch (error) {
    next(error);
  }
};

const trackBarber = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const findbooking = await prisma.booking.findUnique({
      where: {
        id: bookingId
      }
    });

    if (!findbooking) {
      throw new NotFoundError("booking not found")
    }
    const bookingtracking = await prisma.bookingTracking.findFirst({
      where: {
        bookingId: bookingId
      }
    });

    if (!bookingtracking) {
      throw new NotFoundError("booking track not found")
    }

    handlerOk(res, 200, bookingtracking, "track barber successully");
  } catch (error) {
    next(error);
  }
};

// Fetch the invoice for a specific booking
const showInvoiceDetail = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    // Find the booking and associated payment information
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        services: true,
        payment: true, // Include payment details
      },
    });

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    console.log(booking, 'booking');

    // return ''

    const {
      amount,
      // discount,
      platformFee,
      // tip
    } = booking.payment;

    // Calculate the total amount based on services, discount, platform fee, and tip
    const totalAmount = amount
    // discount +
    // platformFee
    // tip;

    const invoiceData = {
      bookingId: booking.id,
      customerName: booking.user.firstName,
      services: booking.services.map(service => ({
        // name: service.serviceCategory.firstName,
        price: service.price,
      })),
      subtotal: amount,
      // discount,
      // platformFee,
      // tip,
      // totalAmount,
    };

    handlerOk(res, 200, invoiceData, "Invoice retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// Fetch the payment receipt for a specific booking
const showPaymentReceipt = async (req, res, next) => {
  try {
    const { paymentIntentId } = req.params;

    // Fetch the payment details using the payment intent ID
    const payment = await prisma.payment.findUnique({
      where: { paymentIntentId },
      include: {
        booking: true,
      },
    });

    if (!payment) {
      throw new NotFoundError("Payment not found");
    }

    // Prepare the payment receipt data
    const receiptData = {
      bookingId: payment.bookingId,
      amountPaid: payment.totalAmount,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      amount: payment.amount,
      discount: payment.discount,
      platformFee: payment.platformFee,
      tip: payment.tip,
    };

    handlerOk(res, 200, receiptData, "Payment receipt retrieved successfully");
  } catch (error) {
    next(error);
  }
};

const submitReview = async (req, res, next) => {
  try {
    const { bookingId, rating, review } = req.body;
    const { id, deviceToken, firstName } = req.user;
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId, status: "COMPLETED" },
      include: { barber: true }
    });

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    const createreview = await prisma.review.create({
      data: {
        bookingId,
        rating,
        review,
        userId: id,
        barberId: booking.barberId,
      },
    });

    // await sendNotification(
    //   id,
    //   deviceToken,
    //   `Hi ${firstName}, you've successfully submitted your review for "${booking.barber.name}".`
    // );


    // await sendNotification(
    //   id,
    //   booking.barber.deviceToken,
    //   `Hi ${booking.barber.name}, you've received a review from "${firstName}".`
    // );


    handlerOk(res, 200, createreview, "Review submitted successfully");
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
  showInvoiceDetail,
  showPaymentReceipt,
}