require("dotenv").config();

const { service } = require("../../config/emailConfig");
const prisma = require("../../config/prismaConfig");
const { bookingConstants } = require("../../constant/constant");
const { ValidationError, NotFoundError, BadRequestError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");
const computeStartEndUTC = require("../../utils/getnextdateforday");
const sendNotification = require("../../utils/notification");
const { createPaymentIntent } = require("../../utils/stripeApis");
const stripe = require("stripe")(process.env.STRIPE_KEY);


// ==== Helpers ====
function normalizeDay(d) {
  const map = {
    sun: "SUN", sunday: "SUN",
    mon: "MON", monday: "MON",
    tue: "TUE", tuesday: "TUE",
    wed: "WED", wednesday: "WED",
    thu: "THU", thursday: "THU",
    fri: "FRI", friday: "FRI",
    sat: "SAT", saturday: "SAT",
  };
  const key = String(d || "").trim().toLowerCase();
  return map[key] || key.toUpperCase();
}

// Parse "hh:mm am/pm" OR "HH:mm" -> minutes since midnight (0..1439)
function parseTimeToMinutes(str) {
  if (!str) throw new BadRequestError("Time string is required");
  const s = String(str).trim().toLowerCase();

  let m = s.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (m) {
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const period = m[3];
    if (Number.isNaN(h) || Number.isNaN(min)) {
      throw new BadRequestError(`Invalid time numbers: ${str}`);
    }
    if (h === 12) h = 0;        // 12:xx am => 00:xx
    if (period === "pm") h += 12;
    return h * 60 + min;
  }

  m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (m) {
    const h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (Number.isNaN(h) || Number.isNaN(min)) {
      throw new BadRequestError(`Invalid time numbers: ${str}`);
    }
    return h * 60 + min;
  }

  throw new BadRequestError(`Invalid time format: ${str}`);
}

// Convert minutes (0..1439) -> "HH:mm" 24h string
function minutesToHHmm(mins) {
  if (!Number.isFinite(mins)) throw new BadRequestError("Time minutes must be a finite number");
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const HH = String(h).padStart(2, "0");
  const MM = String(m).padStart(2, "0");
  return `${HH}:${MM}`;
}

// const createBookingAndPayment = async (req, res, next) => {
//   try {
//     const {
//       barberId,
//       day,
//       startTime, // e.g. "04:00 am"
//       endTime,   // e.g. "02:00 pm"
//       locationName,
//       locationLat,
//       locationLng,
//       services = [],
//     } = req.body;

//     const { id: userId, firstName } = req.user || {};

//     // ---------- Validation ----------
//     if (!barberId) throw new BadRequestError("barberId is required");
//     if (!day) throw new BadRequestError("day is required");
//     if (!startTime || !endTime) throw new BadRequestError("startTime and endTime are required");
//     if (!Array.isArray(services) || services.length === 0) {
//       throw new BadRequestError("At least one service is required");
//     }

//     // Coerce and validate lat/lng as numbers
//     const latNum = locationLat !== undefined ? Number(locationLat) : undefined;
//     const lngNum = locationLng !== undefined ? Number(locationLng) : undefined;
//     if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
//       throw new BadRequestError("locationLat and locationLng must be valid numbers");
//     }

//     const normalizedDay = normalizeDay(day);
//     const requestedStartMins = parseTimeToMinutes(startTime); // handles am/pm
//     const requestedEndMins = parseTimeToMinutes(endTime);
//     if (requestedEndMins <= requestedStartMins) {
//       // (If you need overnight support, we can extend logic here.)
//       throw new BadRequestError("End time must be after start time.");
//     }

//     // ---------- 1) Find barber ----------
//     const findbarber = await prisma.barber.findUnique({
//       where: { id: barberId },
//       include: {
//         BarberAvailableHour: true,
//         BarberService: true,
//       },
//     });
//     if (!findbarber) throw new NotFoundError("Barber not found");

//     // ---------- 2) Availability check ----------
//     const isAvailable = findbarber.BarberAvailableHour.some((slot) => {
//       if (normalizeDay(slot.day) !== normalizedDay) return false;
//       const slotStart = parseTimeToMinutes(slot.startTime);
//       const slotEnd = parseTimeToMinutes(slot.endTime);
//       return slotStart <= requestedStartMins && requestedEndMins <= slotEnd;
//     });
//     if (!isAvailable) {
//       throw new BadRequestError("Barber is not available at the selected time.");
//     }

//     // ---------- 3) Services check ----------
//     const serviceIndex = new Map(findbarber.BarberService.map((s) => [s.id, s]));
//     const selectedService = services
//       .map((sid) => serviceIndex.get(sid))
//       .filter(Boolean);
//     // If you want to enforce strict matching:
//     // if (selectedService.length !== services.length) {
//     //   throw new NotFoundError("One or more selected services are not offered by this barber.");
//     // }

//     // ---------- 4) Compute UTC times ----------
//     // IMPORTANT: convert to "HH:mm" 24h BEFORE calling your helper
//     const startHHmm24 = minutesToHHmm(requestedStartMins); // e.g., 240 -> "04:00"
//     const endHHmm24 = minutesToHHmm(requestedEndMins);   // e.g., 840 -> "14:00"

//     let startUTC, endUTC;
//     try {
//       ({ startUTC, endUTC } = computeStartEndUTC({
//         dayStr: normalizedDay,
//         startHHmm: startHHmm24,   // now 24h string your helper likely expects
//         endHHmm: endHHmm24,
//         lat: latNum,
//         lng: lngNum,
//       }));
//     } catch (e) {
//       // Many timezone/date libraries throw vague errors when they get NaN.
//       throw new ValidationError(`Failed to compute UTC times: ${e?.message || e}`);
//     }
//     if (!startUTC || !endUTC) {
//       throw new ValidationError("Failed to compute UTC times (empty result).");
//     }

//     // ---------- 5) Overlap check ----------
//     const existing = await prisma.booking.findFirst({
//       where: {
//         barberId: findbarber.id,
//         day: normalizedDay,
//         startTime: { lt: endUTC },
//         endTime: { gt: startUTC },
//       },
//       select: { id: true },
//     });
//     if (existing) {
//       throw new BadRequestError("Selected time conflicts with another booking.");
//     }

//     // ---------- 6) Create booking ----------
//     const booking = await prisma.booking.create({
//       data: {
//         userId,
//         barberId: findbarber.id,
//         day: normalizedDay,
//         startTime: startUTC, // store as UTC datetime
//         endTime: endUTC,
//         // amount: 0, // keep commented if schema allows null; or set a default
//         locationName,
//         locationLat: latNum,
//         locationLng: lngNum,
//         services: {
//           create: selectedService.map((s) => ({
//             serviceCategory: { connect: { id: s.serviceCategoryId } },
//             price: parseFloat(s.price), // Uncomment to persist price
//           })),
//         },
//       },
//       include: { services: true },
//     });

//     if (!booking) throw new ValidationError("Booking creation failed");


//     await prisma.barberNotification.create({
//       data: {
//         barberId: findbarber.id,       // the barber who should receive it
//         bookingId: booking.id,       // link to booking
//         title: "🎉 New Booking",
//         description: `${firstName} booked an appointment with you on ${day} at ${startTime} - ${endTime}.`,
//       },
//     });



//     // ---------- 7) Return ----------
//     return handlerOk(res, 200, { booking }, "Booking created successfully");

//   } catch (error) {
//     // Optional: quick diagnostics (comment in dev)
//     // console.error("createBookingAndPayment error:", {
//     //   message: error?.message, stack: error?.stack
//     // });
//     next(error);
//   }
// };


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
      where: { id: bookingId, status: 'PENDING' },
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