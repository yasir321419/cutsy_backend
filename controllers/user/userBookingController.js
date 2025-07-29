const prisma = require("../../config/prismaConfig");
const { bookingConstants } = require("../../constant/constant");
const { ValidationError, NotFoundError, BadRequestError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");
const { createPaymentIntent } = require("../../utils/stripeApis");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_KEY);


// const createBookingAndPayment = async (req, res, next) => {
//   try {
//     const { barberId, scheduledTime, amount, locationName, locationLat, locationLng, services, paymentMethod } = req.body;
//     const { id, customerId } = req.user;

//     // Find the barber
//     const findbarber = await prisma.barber.findUnique({
//       where: {
//         id: barberId,
//       },
//       include: {
//         BarberAvailableHour: true
//       }
//     });

//     console.log(findbarber, 'barber');


//     if (!findbarber) {
//       throw new NotFoundError("Barber not found");
//     }

//     // Constants for Stripe fees
//     // const stripeFeePercentage = 0.029; // 2.9%
//     // const stripeFeeFixed = 0.3; // $0.30

//     // // Calculate the total amount after adding Stripe fees
//     // const totalAmountWithFees =
//     //   amount + amount * stripeFeePercentage + stripeFeeFixed;

//     // // Calculate the total Stripe fees
//     // const stripeFees = amount * stripeFeePercentage + stripeFeeFixed;

//     // const fixedFees = stripeFees.toFixed(2);

//     // // Message for the customer
//     // const message = `To pay for your purchase with Stripe fees included, please pay $${totalAmountWithFees.toFixed(
//     //   2
//     // )}. This includes a Stripe fee of $${stripeFees.toFixed(2)}.`;

//     // // Validate amount
//     // if (amount < totalAmountWithFees) {
//     //   return res.status(400).json({
//     //     success: false,
//     //     message: message,
//     //   });
//     // }

//     // const amountInCents = Math.round(amount * 100); // Convert dollars to cents

//     // Use the createPaymentIntent function to create the payment intent
//     // const paymentIntent = await createPaymentIntent({
//     //   amount: amountInCents,
//     //   customer: customerId, // Assuming the user ID is the customer ID
//     //   paymentMethodId: paymentMethod,
//     //   returnUrl: `${process.env.FRONTEND_URL}/payment/success`, // Replace with your actual return URL
//     // });

//     // const paymentIntentRes = {
//     //   paymentIntentId: paymentIntent.id,
//     //   clientSecret: paymentIntent.client_secret,
//     // };

//     // Create the booking
//     const booking = await prisma.booking.create({
//       data: {
//         userId: id,
//         barberId: findbarber.id,
//         scheduledTime,
//         amount,
//         locationName,
//         locationLat,
//         locationLng,
//         services: {
//           create: services.map(service => ({
//             serviceCategoryId: service.serviceCategoryId,
//             price: service.price,
//           })),
//         },
//       },
//     });

//     if (!booking) {
//       throw new ValidationError("Booking creation failed");
//     }

//     // Create a payment record in the database
//     const payment = await prisma.payment.create({
//       data: {
//         bookingId: booking.id,
//         amount,
//         // discount: req.body.discount || 0,
//         platformFee: stripeFees,
//         // tip: req.body.tip || 0,
//         // paymentMethod,
//         // paymentIntentId: paymentIntent.id,  // Store the Stripe payment intent ID
//         status: 'PENDING', // Set the initial payment status to PENDING
//       },
//     });

//     if (!payment) {
//       throw new ValidationError("Payment creation failed");
//     }

//     // Set a timeout to check for payment expiration

//     // const handleExpiration = async () => {
//     //   try {
//     //     // Fetch the payment record using the payment ID
//     //     const paymentRecord = await prisma.payment.findUnique({
//     //       where: { id: payment.id },
//     //       include: { booking: true },
//     //     });

//     //     // If the payment status is still pending, handle expiration
//     //     if (paymentRecord && paymentRecord.status === 'PENDING') {
//     //       console.log("Payment expired, handling expiration.");

//     //       // Expire the payment (mark as cancelled)
//     //       await prisma.payment.update({
//     //         where: { id: paymentRecord.id },
//     //         data: { status: 'CANCELLED' },  // Update payment status to CANCELLED
//     //       });

//     //       // Update the booking status to cancelled
//     //       await prisma.booking.update({
//     //         where: { id: paymentRecord.booking.id },
//     //         data: { status: 'CANCELLED' }, // Mark booking as cancelled
//     //       });

//     //       // Optionally, cancel the Stripe payment intent
//     //       await stripe.paymentIntents.cancel(paymentIntent.id);

//     //       console.log("Payment and associated booking cancelled successfully.");
//     //     }
//     //   } catch (error) {
//     //     console.error("Error handling payment expiration:", error);
//     //   }
//     // };

//     // Set the expiration time (e.g., 5 minutes)
//     // setTimeout(handleExpiration, 5 * 60 * 1000); // 5 minutes timeout

//     // Send response with booking and payment details
//     handlerOk(res, 200, {
//       booking, payment,
//       // paymentIntentRes
//     }, "Booking and payment created successfully");

//   } catch (error) {
//     next(error);
//   }
// };

const createBookingAndPayment = async (req, res, next) => {
  try {
    const { barberId, day, startTime, endTime, amount, locationName, locationLat, locationLng, services } = req.body;
    const { id } = req.user;

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
    const selectedService = findbarber.BarberService.find(service => service.id === services);
    if (!selectedService) {
      throw new NotFoundError("Service not found or does not exist for this barber.");
    }

    // Ensure price is a float and matches the selected service's price
    const servicePrice = parseFloat(selectedService.price);
    if (isNaN(servicePrice)) {
      throw new BadRequestError(`Invalid price for the selected service.`);
    }

    if (amountAsFloat !== servicePrice) {
      throw new BadRequestError(`Invalid amount. The price for the selected service is $${servicePrice}`);
    }

    // Check if the service category exists
    const serviceCategory = await prisma.barberServiceCategory.findUnique({
      where: { id: selectedService.serviceCategoryId },
    });

    if (!serviceCategory) {
      throw new NotFoundError("Service category does not exist.");
    }

    // 5. Create the booking
    const booking = await prisma.booking.create({
      data: {
        userId: id,
        barberId: findbarber.id,
        day,
        startTime,
        endTime,
        amount: amountAsFloat,
        locationName,
        locationLat,
        locationLng,
        services: {
          create: [{
            serviceCategoryId: selectedService.serviceCategoryId, // Reference the existing service category
            price: servicePrice, // Store the price for the service
          }],
        },
      },
    });

    if (!booking) {
      throw new ValidationError("Booking creation failed");
    }

    // 6. Create the payment record in the database
    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: amountAsFloat,
        status: 'PENDING', // Set the initial payment status to PENDING
      },
    });

    if (!payment) {
      throw new ValidationError("Payment creation failed");
    }

    // 7. Return the response with booking and payment details
    handlerOk(res, 200, { booking, payment }, "Booking and payment created successfully");

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

    // Fetch the booking to ensure it exists
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId, status: "PENDING" },
      include: { payment: true },  // Include payment details with booking
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
    const { id } = req.user;
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId, status: "COMPLETED" },
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