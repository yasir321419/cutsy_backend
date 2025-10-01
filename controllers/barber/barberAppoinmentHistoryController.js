const prisma = require("../../config/prismaConfig");
const { NotFoundError, ValidationError, ConflictError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");

const showBarberUpComingAppoinment = async (req, res, next) => {
  try {
    const { id } = req.user;

    const nowUtc = new Date();

    console.log(nowUtc);

    const upcomingappoinment = await prisma.booking.findMany({
      where: {
        barberId: id,
        status: "PENDING",
        startTime: {
          gt: nowUtc
        }
      },
      include: {
        user: true,
        services: true
      }
    });

    if (upcomingappoinment.length === 0) {
      throw new NotFoundError("no upcoming appoinment found")
    }

    handlerOk(res, 200, upcomingappoinment, "upcoming appoinment found successfully")

  } catch (error) {
    next(error)
  }
}

const showBarberOnGoingAppoinment = async (req, res, next) => {
  try {
    const { id } = req.user;

    const nowUtc = new Date();


    const ongoingappoinment = await prisma.booking.findMany({
      where: {
        barberId: id,
        status: {
          in: ["ACCEPTED", "ARRIVED"]
        },
        startTime: { lte: nowUtc },     // started
        // endTime: { gt: nowUtc },
      },
      include: {
        user: true,
        services: true
      }
    });

    if (ongoingappoinment.length === 0) {
      throw new NotFoundError("ongoing appoinment not found")
    }

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
        status: {
          in: ["CANCELLED", "COMPLETED", "PAID"]
        },
        endTime: { lt: nowUtc },

      },
      include: {
        user: true,
        services: true
      }

    });

    if (pastappoinment.length === 0) {
      throw new NotFoundError("past appoinment not found")
    }

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
        await tx.bookingTracking.create({
          data: {
            booking: { connect: { id: bookingId } }, // ← use connect to satisfy FK
            lat: userLatitude,
            lng: userLongitude,
            barberLat: barberLatitude,
            barberLng: barberLongitude,
            status: status || "On the way",
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
            status: status || "On the way",
            timestamp: new Date(),
          },
        });
      }

      // 2B) If you DID add @unique on bookingId (1:1), replace the block above with upsert:
      // await tx.bookingTracking.upsert({
      //   where: { bookingId }, // requires @unique on bookingId
      //   create: {
      //     booking: { connect: { id: bookingId } },
      //     lat: uLat, lng: uLng, barberLat: bLat, barberLng: bLng,
      //     status: status || "On the way",
      //     timestamp: new Date(),
      //   },
      //   update: {
      //     lat: uLat, lng: uLng, barberLat: bLat, barberLng: bLng,
      //     status: status || "On the way",
      //     timestamp: new Date(),
      //   },
      // });

      // 3) Booking.status is an ENUM — don’t write free text here unless it matches the enum.
      // If your enum is BookingStatus (PENDING, IN_PROGRESS, COMPLETED, etc.),
      // map the frontend string to a valid enum before updating.
      // Example mapping:
      // const enumMap = { "On the way": "IN_PROGRESS", "Arrived": "IN_PROGRESS", "Completed": "COMPLETED" };
      // const mapped = enumMap[status] ?? undefined;
      // if (mapped) {
      //   await tx.booking.update({ where: { id: bookingId }, data: { status: mapped } });
      // }
    });

    return handlerOk(res, 200, {
      status: "Tracking saved",
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
        status: "STARTED"
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
        status: "STARTED"
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