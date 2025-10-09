require("dotenv").config();

const { service } = require("../../config/emailConfig");
const prisma = require("../../config/prismaConfig");
const { bookingConstants } = require("../../constant/constant");
const { ValidationError, NotFoundError, BadRequestError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");
const sendNotification = require("../../utils/notification");
const { createPaymentIntent } = require("../../utils/stripeApis");
const { extractMinutesFromStoredValue } = require("../../utils/timeSlot");
const { DateTime } = require("luxon");
const tzLookup = require("tz-lookup");





const createBooking = async (req, res, next) => {
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
    if (!day) throw new BadRequestError("day is required");
    if (!Array.isArray(services) || services.length === 0) {
      throw new BadRequestError("At least one service is required");
    }

    // Coerce and validate lat/lng as numbers
    const latNum = locationLat !== undefined ? Number(locationLat) : undefined;
    const lngNum = locationLng !== undefined ? Number(locationLng) : undefined;
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      throw new BadRequestError("locationLat and locationLng must be valid numbers");
    }

    let appointmentZone;
    try {
      appointmentZone = tzLookup(latNum, lngNum);
    } catch (err) {
      appointmentZone = null;
    }

    const parseDateTimes = (value, label) => {
      const isoString = typeof value === "string" ? value : null;
      const hasExplicitOffset = isoString ? /([+-]\d{2}:?\d{2}|Z)$/i.test(isoString) : false;

      let localDateTime;

      if (hasExplicitOffset) {
        localDateTime = DateTime.fromISO(value, { setZone: true });
      } else if (appointmentZone) {
        localDateTime = DateTime.fromISO(value, { zone: appointmentZone });
      } else {
        localDateTime = DateTime.fromISO(value, { setZone: true });
      }

      if (!localDateTime.isValid) {
        const fallbackNative = new Date(value);
        if (!Number.isNaN(fallbackNative.getTime())) {
          localDateTime = DateTime.fromJSDate(fallbackNative);
          if (appointmentZone) {
            localDateTime = localDateTime.setZone(appointmentZone);
          }
        }
      }

      if (!localDateTime || !localDateTime.isValid) {
        throw new BadRequestError(`Invalid ${label}`);
      }

      return {
        local: localDateTime,
        utc: localDateTime.toUTC().toJSDate(),
      };
    };

    const { local: startLocal, utc: startUTC } = parseDateTimes(startTime, "startTime");
    const { local: endLocal, utc: endUTC } = parseDateTimes(endTime, "endTime");

    if (endUTC <= startUTC) {
      throw new BadRequestError("endTime must be after startTime");
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

    const normalizedDay = typeof day === "string" ? day.toUpperCase() : day;
    const allowedDays = new Set(["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]);
    if (!allowedDays.has(normalizedDay)) {
      throw new BadRequestError("day must be a valid weekday code");
    }

    const startMinutesOfDay = startLocal.hour * 60 + startLocal.minute;
    const endMinutesOfDay = endLocal.hour * 60 + endLocal.minute;

    if (startMinutesOfDay === null || endMinutesOfDay === null) {
      throw new BadRequestError("Unable to derive appointment time");
    }

    // ---------- 3) Ensure availability window exists ----------
    const availabilityWindows = await prisma.barberAvailableHour.findMany({
      where: {
        createdById: findbarber.id,
        day: normalizedDay,
      },
    });

    if (availabilityWindows.length === 0) {
      throw new BadRequestError("Barber is not available on the selected day");
    }

    const withinAvailability = availabilityWindows.some((slot) => {
      const slotStart = extractMinutesFromStoredValue(slot.startTime);
      const slotEnd = extractMinutesFromStoredValue(slot.endTime);
      if (slotStart === null || slotEnd === null) {
        return false;
      }
      return slotStart <= startMinutesOfDay && slotEnd >= endMinutesOfDay;
    });

    if (!withinAvailability) {
      throw new BadRequestError("Selected time is outside the barber's available hours");
    }

    // ---------- 4) Overlap check ----------
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

    // ---------- 5) Create booking ----------
    const booking = await prisma.booking.create({
      data: {
        userId,
        barberId: findbarber.id,
        day: normalizedDay,
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

    // ---------- 6) Create barber notification ----------
    await prisma.barberNotification.create({
      data: {
        barberId: findbarber.id,
        bookingId: booking.id,
        title: "🎉 New Booking",
        description: `${firstName} booked an appointment with you from ${startLocal.toFormat("yyyy-LL-dd HH:mm")} to ${endLocal.toFormat("yyyy-LL-dd HH:mm")}.`,
      },
    });

    // ---------- 7) Return ----------
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
          in: ['PENDING', 'ACCEPTED', 'STARTED']
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

// assumes: const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const makePayment = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const { amount } = req.body;

    const parsedAmount = amount !== undefined ? Number(amount) : undefined;
    if (parsedAmount !== undefined && (!Number.isFinite(parsedAmount) || parsedAmount <= 0)) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount provided. Amount must be a positive number.",
      });
    }
    const amountCents =
      parsedAmount !== undefined ? Math.round(parsedAmount * 100) : null;

    const findbooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        services: true,
        barber: { select: { id: true, name: true } },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            customerId: true,
          },
        },
      },
    });

    if (!findbooking) {
      throw new NotFoundError("booking not found");
    }

    // ---- 1) Subtotal from services (in cents) ----
    const subtotalCents = (findbooking.services || []).reduce((sum, s) => {
      const price = Number(s.price || 0);
      return sum + Math.round(price * 100);
    }, 0);

    if (subtotalCents <= 0) {
      return res.status(400).json({
        success: false,
        message: "No billable services found for this booking.",
      });
    }

    // ---- 2) Stripe fee model ----
    const feePercent = 0.029;       // 2.9%
    const feeFixedCents = 30;       // $0.30

    // Minimal gross needed so that (gross - fees) >= subtotal
    const grossUpToNet = (netCents) => {
      // initial guess
      let gross = Math.ceil((netCents + feeFixedCents) / (1 - feePercent));
      // bump until net >= target (handles rounding)
      const netFrom = (g) => g - (Math.round(g * feePercent) + feeFixedCents);
      while (netFrom(gross) < netCents) gross++;
      return gross;
    };

    const requiredChargeCents = grossUpToNet(subtotalCents);

    // If client sent a custom amount, validate it. Otherwise use requiredChargeCents
    const chargeCents =
      amountCents !== null && Number.isInteger(amountCents)
        ? amountCents
        : requiredChargeCents;

    const calcStripeFees = (amtCents) =>
      Math.round(amtCents * feePercent) + feeFixedCents;

    const stripeFeesCents = calcStripeFees(chargeCents);
    const netAfterFeesCents = chargeCents - stripeFeesCents;

    if (netAfterFeesCents < subtotalCents) {
      return res.status(400).json({
        success: false,
        message: `Insufficient amount. To net $${(subtotalCents / 100).toFixed(2)} after Stripe fees, charge at least $${(requiredChargeCents / 100).toFixed(2)}.`,
        expectedChargeCents: requiredChargeCents,
        breakdown: {
          subtotalCents,
          attemptedChargeCents: chargeCents,
          stripeFeesCents,
          netAfterFeesCents,
        },
      });
    }

    // ---- 3) Create the PaymentIntent ----
    const paymentIntent = await createPaymentIntent({
      amount: chargeCents,
      customer: findbooking.user?.customerId,
      metadata: {
        bookingId: findbooking.id,
        userId: findbooking.userId,
        subtotalCents: String(subtotalCents),
        stripeFeesCents: String(stripeFeesCents),
        netAfterFeesCents: String(netAfterFeesCents),
      },
      description: `Booking ${findbooking.id} — net to merchant $${(netAfterFeesCents / 100).toFixed(2)} on subtotal $${(subtotalCents / 100).toFixed(2)}`,
    });

    await prisma.payment.upsert({
      where: { bookingId: findbooking.id },
      update: {
        amount: Number((netAfterFeesCents / 100).toFixed(2)),
        totalAmount: Number((chargeCents / 100).toFixed(2)),
        platformFee: Number((stripeFeesCents / 100).toFixed(2)),
        status: "PENDING",
        paymentMethod: "CARD",
        paymentIntentId: paymentIntent.id,
      },
      create: {
        bookingId: findbooking.id,
        amount: Number((netAfterFeesCents / 100).toFixed(2)),
        totalAmount: Number((chargeCents / 100).toFixed(2)),
        platformFee: Number((stripeFeesCents / 100).toFixed(2)),
        status: "PENDING",
        paymentMethod: "CARD",
        paymentIntentId: paymentIntent.id,
      },
    });

    // (Optional) persist totals on booking for reporting
    await prisma.booking.update({
      where: { id: findbooking.id },
      data: {
        totalAmount: Number((chargeCents / 100).toFixed(2)),
        amount: Number((netAfterFeesCents / 100).toFixed(2)),
      },
    });

    const payerName = findbooking.user?.firstName

    const chargeDisplay = (chargeCents / 100).toFixed(2);

    await prisma.barberNotification.create({
      data: {
        barberId: findbooking.barberId,
        bookingId: findbooking.id,
        title: "💵 Payment received",
        description: `${payerName} has completed a payment of $${chargeDisplay} for booking ${findbooking.id}. Please allow 7–8 business days to receive the payout after the owner’s commission is processed.`
      },
    });




    return res.status(200).json({
      success: true,
      message: "Payment intent created",
      clientSecret: paymentIntent.client_secret,
      charge: {
        currency: paymentIntent.currency,
        chargeCents,
        stripeFeesCents,
        netAfterFeesCents,
        subtotalCents,
        // For UI display
        charge: (chargeCents / 100).toFixed(2),
        fees: (stripeFeesCents / 100).toFixed(2),
        netAfterFees: (netAfterFeesCents / 100).toFixed(2),
        subtotal: (subtotalCents / 100).toFixed(2),
      },
    });
  } catch (error) {
    next(error);
  }
};




module.exports = {
  createBooking,
  showAppoinmentDetail,
  cancelAppointment,
  trackBarber,
  submitReview,
  showInvoiceDetail,
  showPaymentReceipt,
  makePayment
}
