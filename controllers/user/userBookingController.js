const prisma = require("../../config/prismaConfig");
const { bookingConstants } = require("../../constant/constant");
const { ValidationError, NotFoundError, BadRequestError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");
const computeStartEndUTC = require("../../utils/getnextdateforday");
const sendNotification = require("../../utils/notification");
const { createPaymentIntent } = require("../../utils/stripeApis");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_KEY);


const createBookingAndPayment = async (req, res, next) => {
  try {
    const { barberId, day, startTime, endTime, amount, locationName, locationLat, locationLng, services,
    } = req.body;
    const { id, deviceToken, firstName, customerId } = req.user;


    // Ensure amount is a number (Float)

    const amountAsFloat = parseFloat(amount);
    if (isNaN(amountAsFloat)) {
      throw new BadRequestError("Invalid amount provided");
    }

    // 1. Find the barber

    const findbarber = await prisma.barber.findUnique({
      where: {
        id: barberId,
      },
      include: {
        BarberAvailableHour: true, // Barber's available hours
        BarberService: true, // Barber's services
      }
    });

    if (!findbarber) {
      throw new NotFoundError("Barber not found");
    }

    // 2. Normalize the times for comparison

    const normalizeTime = (timeString) => {
      const [hour, minute] = timeString.split(':');
      return parseInt(hour) * 60 + parseInt(minute); // Convert to minutes
    };

    const normalizedStartTime = normalizeTime(startTime);
    const normalizedEndTime = normalizeTime(endTime);

    // 3. Check if the barber is available at the selected time (startTime, endTime, and day)

    const isAvailable = findbarber.BarberAvailableHour.some(hour => {
      const normalizedBarberStartTime = normalizeTime(hour.startTime);
      const normalizedBarberEndTime = normalizeTime(hour.endTime);
      return hour.day.toLowerCase() === day.toLowerCase() &&
        normalizedBarberStartTime <= normalizedStartTime &&
        normalizedBarberEndTime >= normalizedEndTime;
    });

    if (!isAvailable) {
      throw new BadRequestError("Barber is not available at the selected time.");
    }

    // 4. Check if the selected service exists in BarberService

    const selectedService = findbarber.BarberService.filter(service => services.includes(service.id));

    if (!selectedService) {
      throw new NotFoundError("Service does not exist for this barber.");
    }

    // Parse & total prices
    const servicePrices = selectedService.map(s => {
      const n = parseFloat(s.price);
      if (Number.isNaN(n)) throw new BadRequestError(`Invalid price on service ${s.id}`);
      return n;
    });
    const totalPrice = parseFloat(servicePrices.reduce((a, b) => a + b, 0).toFixed(2));

    // Compare client amount vs computed total (use cents to avoid float issues)
    const toCents = n => Math.round(n * 100);

    // --- NEW: Fees check & early return if user sent subtotal (no fees) ---
    const feePct = 0.029;
    const feeFixed = 0.30;

    const subtotal = totalPrice; // services sum
    const fees = parseFloat((subtotal * feePct + feeFixed).toFixed(2));
    const totalAmountWithFees = parseFloat((subtotal + fees).toFixed(2));

    // If user sent only subtotal (e.g., 200) and not total with fees (e.g., 206.10)
    const userProvidedSubtotalOnly = toCents(amountAsFloat) === toCents(subtotal);


    if (userProvidedSubtotalOnly && fees > 0) {
      return handlerOk(
        res,
        422,
        {
          code: "AMOUNT_EXCLUDES_FEES",
          feeNotice: {
            message: `Heads up: a processing fee of $${fees.toFixed(2)} will be added. Your total is $${totalAmountWithFees.toFixed(2)}.`,
            breakdown: {
              subtotal: subtotal.toFixed(2),
              fees: fees.toFixed(2),
              total: totalAmountWithFees.toFixed(2),
            },
            suggestedAmount: totalAmountWithFees.toFixed(2),
          }
        },
        "Amount excludes processing fees"
      );
    }

    // 6. Create the payment intent with the fee adjustments

    const metadata = {
      barberId: findbarber.id,
      serviceId: selectedService.map(s => s.id).join(','),
      userId: id,
      startTime: startTime,
      endTime: endTime,
      amount: amountAsFloat,
      totalAmount: totalAmountWithFees
    };

    const paymentIntent = await createPaymentIntent({
      amount: Math.round(totalAmountWithFees * 100),  // Convert to cents
      customer: customerId,  // Assuming user ID is the customer ID
      metadata: metadata,  // Pass the metadata here
    });

    const paymentIntentRes = {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
    };



    const { startUTC, endUTC } = computeStartEndUTC({
      dayStr: day,
      startHHmm: startTime,
      endHHmm: endTime,
      lat: locationLat,
      lng: locationLng,
    });




    // 7. Create the booking

    const booking = await prisma.booking.create({
      data: {
        userId: id,
        barberId: findbarber.id,
        day,
        startTime: startUTC,
        endTime: endUTC,
        amount: amountAsFloat,
        locationName,
        locationLat,
        locationLng,
        services: {
          create: selectedService.map(s => ({
            serviceCategory: { connect: { id: s.serviceCategoryId } },
            price: parseFloat(s.price),
          })),
        },
      },
      include: { services: true },

    });

    if (!booking) {
      throw new ValidationError("Booking creation failed");
    }

    // 8. Create the payment record in the database with the Stripe fees added

    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: amountAsFloat,
        totalAmount: totalAmountWithFees, // Store the total amount with fees
        status: 'PENDING', // Set the initial payment status to PENDING
        paymentIntentId: paymentIntent.id,
      },
    });

    if (!payment) {
      throw new ValidationError("Payment creation failed");
    }

    // Send notifications
    // await sendNotification(
    //   id,
    //   deviceToken,
    //   `Hi ${firstName}, you've successfully booked an appointment with "${findbarber.name}"!`
    // );

    // await sendNotification(
    //   id,
    //   findbarber.deviceToken,
    //   `Hi ${findbarber.name}, you have a new appointment booked with "${firstName}".`
    // );

    //     // Set a timeout to check for payment expiration

    const handleExpiration = async () => {
      try {
        // Fetch the payment record using the payment ID
        const paymentRecord = await prisma.payment.findUnique({
          where: { id: payment.id },
          include: { booking: true },
        });

        // If the payment status is still pending, handle expiration
        if (paymentRecord && paymentRecord.status === 'PENDING') {
          console.log("Payment expired, handling expiration.");

          // Expire the payment (mark as cancelled)
          await prisma.payment.update({
            where: { id: paymentRecord.id },
            data: { status: 'CANCELLED' },  // Update payment status to CANCELLED
          });

          // Update the booking status to cancelled
          await prisma.booking.update({
            where: { id: paymentRecord.booking.id },
            data: { status: 'CANCELLED' }, // Mark booking as cancelled
          });

          // Optionally, cancel the Stripe payment intent
          await stripe.paymentIntents.cancel(paymentIntent.id);

          console.log("Payment and associated booking cancelled successfully.");
        }
      } catch (error) {
        console.error("Error handling payment expiration:", error);
      }
    };

    // Set the expiration time(e.g., 5 minutes)
    setTimeout(handleExpiration, 5 * 60 * 1000); // 5 minutes timeout


    // Return the response with booking and payment details

    handlerOk(res, 200, { booking, payment, paymentIntentRes }, "Booking and payment created successfully");

  } catch (error) {
    next(error);
  }
};

const showAppoinmentDetail = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId, status: 'PENDING' },
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