const prisma = require("../../config/prismaConfig");
const { bookingConstants } = require("../../constant/constant");
const { ValidationError, NotFoundError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");

const createBooking = async (req, res, next) => {

  try {
    const { barberId, scheduledTime, amount, locationName, locationLat, locationLng, services } = req.body;
    const { id } = req.user;

    const findbarber = await prisma.barber.findUnique({
      where: {
        id: barberId,
      }
    });

    if (!findbarber) {
      throw new NotFoundError("barber not found")
    }

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
      throw new ValidationError("booking failed")
    }

    handlerOk(res, 200, booking, "booking created successfully")

  } catch (error) {
    next(error)
  }

}

const showBooking = async (req, res, next) => {

  try {
    const { id } = req.user;

    const bookings = await prisma.booking.findMany({
      where: { userId: id },
      include: {
        services: true,
        barber: true,
      },
    });

    if (!bookings.length === 0) {
      throw new NotFoundError("no bookings found")
    }

    handlerOk(res, 200, bookings, "booking found successfully");

  } catch (error) {
    next(error)
  }
}

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

const cancelAppoinment = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const cancelled = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: bookingConstants.CANCELLED }
    });

    if (!cancelled) {
      throw new ValidationError("Booking not cancel")
    }

    handlerOk(res, 200, cancelled, "Booking cancelled successfully")

  } catch (error) {
    next(error)
  }
}

const trackBarber = async (req, res, next) => {
  try {
    const { barberId } = req.params;
    const { latitude, longitude } = req.user;
    const { bookingId } = req.body;

    const barber = await prisma.barber.findUnique({
      where: {
        id: barberId,
      },
    });

    if (!barber) {
      throw new NotFoundError("Barber not found");
    }

    // Check if a tracking record already exists for this booking
    let existingTracking = await prisma.bookingTracking.findFirst({
      where: {
        bookingId: bookingId,
      },
    });

    // If no tracking record exists, create a new one
    if (!existingTracking) {
      await prisma.bookingTracking.create({
        data: {
          bookingId: bookingId,
          lat: latitude,
          lng: longitude,
          barberLat: barber.latitude,
          barberLng: barber.longitude,
          timestamp: new Date(),
        },
      });

      return handlerOk(res, 200, {
        status: "Tracking started",
        userLat: latitude,
        userLng: longitude,
        barberLat: barber.latitude,
        barberLng: barber.longitude,
      }, "Tracking created successfully");
    }

    // If a tracking record exists, update the tracking information
    const updatedTracking = await prisma.bookingTracking.update({
      where: {
        id: existingTracking.id,
      },
      data: {
        lat: latitude,
        lng: longitude,
        barberLat: barber.latitude,
        barberLng: barber.longitude,
        timestamp: new Date(),
      },
    });

    // Return the updated locations
    handlerOk(res, 200, {
      status: "Tracking updated",
      userLat: latitude,
      userLng: longitude,
      barberLat: barber.latitude,
      barberLng: barber.longitude,
    }, "Tracking updated successfully");

  } catch (error) {
    next(error);
  }
};


const makePayment = async (req, res, next) => {


  try {

    const { bookingId, amount, discount, platformFee, tip, paymentMethod } = req.body;

    const findbooking = await prisma.booking.findUnique({
      where: {
        id: bookingId,
      }
    });

    if (!findbooking) {
      throw new NotFoundError("booking not found")
    }

    // Create payment intent (e.g., using Stripe or other payment providers)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Amount in cents
      currency: 'usd',
      payment_method: paymentMethod,
      confirm: true,
    });

    const payment = await prisma.payment.create({
      data: {
        bookingId: findbooking.id,
        amount,
        discount,
        platformFee,
        tip,
        paymentMethod,
      },
    });

    if (payment) {
      throw new ValidationError("error in payment")
    }

    handlerOk(res, 200, payment, "payment successfully")
  } catch (error) {
    next(error)
  }
}

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
  createBooking,
  showBooking,
  showAppoinmentDetail,
  cancelAppoinment,
  trackBarber,
  makePayment,
  submitReview
}