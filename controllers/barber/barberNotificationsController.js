const prisma = require("../../config/prismaConfig");
const { NotFoundError, ValidationError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");




const showAllBarberNotification = async (req, res, next) => {
  try {

    const { id } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    console.log(id);


    const notifications = await Promise.all([
      prisma.barberNotification.findMany({
        where: { barberId: id },
        orderBy: { createdAt: "desc" },
        include: { barber: { select: { name: true, image: true } } },
        skip,
        take: limit,
      })
    ])

    if (notifications.length === 0) {
      throw new NotFoundError("notifications not found")
    }


    handlerOk(res, 200, ...notifications, 'notifications found successfully')



  } catch (error) {
    next(error)
  }
}

const readBarberNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    const notification = await prisma.barberNotification.findUnique({
      where: {
        id: notificationId
      }
    });

    if (!notification) {
      throw new NotFoundError("notification id not found")
    }

    const readnotification = await prisma.barberNotification.update({
      where: {
        id: notification.id
      },
      data: {
        isRead: true
      }
    });

    if (!readnotification) {
      throw new ValidationError("notification is not read")
    }

    handlerOk(res, 200, readnotification, 'notification read successfully')


  } catch (error) {
    next(error)
  }
}

const onAndOffBarberNotification = async (req, res, next) => {
  try {
    let { notificationOnAndOff, id } = req.user;

    notificationOnAndOff = !notificationOnAndOff;

    let message = notificationOnAndOff
      ? "Notification On Successfully"
      : "Notification Off Successfully";

    await prisma.barber.update({
      where: {
        id: id
      },
      data: {
        notificationOnAndOff: notificationOnAndOff
      }
    })

    handlerOk(res, 200, null, message)

  } catch (error) {
    next(error)
  }
}

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

module.exports = {
  showAllBarberNotification,
  readBarberNotification,
  onAndOffBarberNotification,
  acceptBooking,
  rejectBooking
}