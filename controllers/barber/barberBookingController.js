

const prisma = require("../../config/prismaConfig");
const { NotFoundError, ValidationError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");


const acceptBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { id, name } = req.user;
    const findbooking = await prisma.booking.findUnique({
      where: {
        id: bookingId
      }
    });

    if (!findbooking) {
      throw new NotFoundError("booking not found")
    }

    await prisma.booking.update({
      where: {
        id: findbooking.id
      },
      data: {
        isAccepted: true,
        status: "ACCEPTED"
      }
    });

    await prisma.userNotification.create({
      data: {
        userId: findbooking.userId,
        bookingId: findbooking.id,       // link to booking
        title: "🎉 Accept Booking",
        description: `${name} accept an appointment with you on ${findbooking.day} at ${findbooking.startTime} - ${findbooking.endTime}.`,
      },
    });


    handlerOk(res, 200, null, "booking accepted successfully")


  } catch (error) {
    next(error)
  }
}


const rejectBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { name } = req.user || {};

    // 1) Ensure booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        userId: true,
        barberId: true,
        day: true,
        startTime: true,
        endTime: true,
      },
    });
    if (!booking) throw new NotFoundError("booking not found");

    // 2) Do everything atomically in the correct order
    await prisma.$transaction(async (tx) => {
      // 2a) Create notification FIRST (while booking still exists)
      await tx.userNotification.create({
        data: {
          userId: booking.userId,
          bookingId: booking.id, // FK OK because booking still exists
          title: "❌ Booking Rejected",
          description: `${name || "Barber"} rejected your appointment on ${booking.day} at ${booking.startTime} – ${booking.endTime}.`,
        },
      });

      // 2b) Delete children
      await tx.bookingService.deleteMany({ where: { bookingId } });

      // 2c) Delete parent booking
      await tx.booking.delete({ where: { id: bookingId } });
    });

    handlerOk(res, 200, null, "booking rejected successfully");
  } catch (error) {
    next(error);
  }
};



const completedBooking = async (req, res, next) => {
  try {

    const { bookingId } = req.params;
    const { name } = req.user;
    const findbooking = await prisma.booking.findUnique({
      where: {
        id: bookingId
      }
    });

    if (!findbooking) {
      throw new NotFoundError("booking not found")
    }

    const complete = await prisma.booking.update({
      where: {
        id: findbooking.id
      },
      data: {
        status: "COMPLETED"
      }
    });

    if (!complete) {
      throw new ValidationError("booking not complete")
    }

    await prisma.userNotification.create({
      data: {
        userId: findbooking.userId,
        bookingId: findbooking.id,       // link to booking
        title: "🎉 Completed Booking",
        description: `${name} has completed your appointment on ${findbooking.day} from ${findbooking.startTime}–${findbooking.endTime}. Please make the payment for this booking.`,
      },
    });


    handlerOk(res, 200, complete, "booking completed successully");

  } catch (error) {
    next(error)
  }
}


module.exports = {
  completedBooking,
  acceptBooking,
  rejectBooking
}