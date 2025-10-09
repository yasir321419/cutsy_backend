const prisma = require("../../config/prismaConfig");
const { NotFoundError, ValidationError, ConflictError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");

const UPCOMING_STATUSES = ["PENDING", "ACCEPTED"];
const ONGOING_STATUSES = ["ACCEPTED", "ARRIVED", "STARTED"];
const TERMINAL_STATUSES = ["CANCELLED", "COMPLETED", "PAID"];

const showBarberUpComingAppoinment = async (req, res, next) => {
  try {
    const { id } = req.user;

    const nowUtc = new Date();

    console.log(nowUtc, 'now')

    const upcomingappoinment = await prisma.booking.findMany({
      where: {
        barberId: id,
        status: { in: UPCOMING_STATUSES },
        startTime: { gt: nowUtc }
      },
      include: {
        user: true,
        services: true
      },
      orderBy: {
        startTime: "asc"
      }
    });

    handlerOk(res, 200, upcomingappoinment, "upcoming appoinment found successfully")

  } catch (error) {
    next(error)
  }
}

const showBarberOnGoingAppoinment = async (req, res, next) => {
  try {
    const { id } = req.user;



    const nowUtc = new Date();

    console.log(nowUtc, 'now')

    const ongoingappoinment = await prisma.booking.findMany({
      where: {
        barberId: id,
        status: { in: ONGOING_STATUSES },
        startTime: { lte: nowUtc },
        endTime: { gte: nowUtc }
      },
      include: {
        user: true,
        services: true
      },
      orderBy: {
        startTime: "asc"
      }
    });

    handlerOk(res, 200, ongoingappoinment, "ongoing appoinment found successfully");

  } catch (error) {
    next(error)
  }
}

const showBarberPastAppoinment = async (req, res, next) => {
  try {
    const { id } = req.user;

    const nowUtc = new Date();

    const pastappoinment = await prisma.booking.findMany({
      where: {
        barberId: id,
        OR: [
          {
            status: { in: TERMINAL_STATUSES },
            startTime: { lte: nowUtc }
          },
          { endTime: { lt: nowUtc } }
        ],
      },
      include: {
        user: true,
        services: true
      },
      orderBy: {
        startTime: "desc"
      }

    });

    handlerOk(res, 200, pastappoinment, "past appoinement found successfully");
  } catch (error) {
    next(error)
  }
}

const trackUser = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const {
      userLatitude, userLongitude,
      barberLatitude, barberLongitude,
      status // free-text from frontend, e.g. "On the way"
    } = req.body;

    console.log(status, 'status');


    await prisma.$transaction(async (tx) => {
      // 1) Ensure booking exists
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
      });
      if (!booking) throw new NotFoundError("Booking not found for given bookingId");

      // 2A) If you DID NOT add @unique on bookingId (many track rows allowed):
      // Create or update latest row manually
      let existing = await tx.bookingTracking.findFirst({ where: { bookingId } });

      if (!existing) {

        await tx.booking.update({
          where: {
            id: bookingId
          },
          data: {
            status: status
          }
        })
        await tx.bookingTracking.create({
          data: {
            booking: { connect: { id: bookingId } }, // ← use connect to satisfy FK
            lat: userLatitude,
            lng: userLongitude,
            barberLat: barberLatitude,
            barberLng: barberLongitude,
            status: status,
            timestamp: new Date(),
          },
        });
      } else {
        await tx.bookingTracking.update({
          where: { id: existing.id },
          data: {
            lat: userLatitude,
            lng: userLongitude,
            barberLat: barberLatitude,
            barberLng: barberLongitude,
            status: status,
            timestamp: new Date(),
          },
        });

        await tx.booking.update({
          where: {
            id: bookingId
          },
          data: {
            status: status
          }
        })
      }

    });

    return handlerOk(res, 200, {
      status: status,
      userLat: userLatitude,
      userLng: userLongitude,
      barberLat: barberLatitude,
      barberLng: barberLongitude,
      note: "FK satisfied via connect; booking existence checked.",
    }, "Tracking upserted successfully");
  } catch (error) {
    next(error);
  }
};


const StartAppoinment = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { name } = req.user;
    const alreadyStart = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        status: "STARTED" // Ensure we don't re-trigger the start flow once it's already marked started
      }
    });

    if (alreadyStart) {
      throw new ConflictError("appoinment already start")
    }

    const findbooking = await prisma.booking.update({
      where: {
        id: bookingId
      },
      data: {
        status: "STARTED" // Persist the in-progress state while the appointment is taking place
      }
    });

    if (!findbooking) {
      throw new ValidationError("booking not update")
    }

    await prisma.userNotification.create({
      data: {
        title: "Appoinment Start",
        description: `${name} has started your appoinment`,
        userId: findbooking.userId
      }
    });

    handlerOk(res, 200, null, "booking started successfully");

  } catch (error) {
    next(error)
  }
}

module.exports = {
  showBarberUpComingAppoinment,
  showBarberOnGoingAppoinment,
  showBarberPastAppoinment,
  trackUser,
  StartAppoinment
}
