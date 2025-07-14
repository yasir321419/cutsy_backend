const prisma = require("../../config/prismaConfig");
const { bookingConstants } = require("../../constant/constant");
const { ValidationError, NotFoundError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");

const createBooking = async (req, res, next) => {
  const { userId, barberId, scheduledTime, amount, locationName, locationLat, locationLng, services } = req.body;

  try {
    const booking = await prisma.booking.create({
      data: {
        userId,
        barberId,
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

    return res.status(201).json({ booking });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error creating booking' });
  }

}

const showBooking = async (req, res, next) => {
  const { userId } = req.params;

  try {
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        services: true,
        barber: true,
      },
    });
    return res.status(200).json(bookings);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error fetching bookings' });
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
      throw new NotFoundError("booking not found")
    }

    handlerOk(res, 200, booking, "Booking found");
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

const makePayment = async (req, res, next) => {
  const { bookingId, amount, discount, platformFee, tip, paymentMethod } = req.body;

  try {
    // Create payment intent (e.g., using Stripe or other payment providers)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Amount in cents
      currency: 'usd',
      payment_method: paymentMethod,
      confirm: true,
    });

    const payment = await prisma.payment.create({
      data: {
        bookingId,
        amount,
        discount,
        platformFee,
        tip,
        paymentMethod,
      },
    });

    return res.status(201).json({ payment });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error processing payment' });
  }
}


module.exports = {
  createBooking,
  showBooking,
  showAppoinmentDetail,
  cancelAppoinment,
  makePayment
}