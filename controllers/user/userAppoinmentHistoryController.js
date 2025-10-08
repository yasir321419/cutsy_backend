const prisma = require("../../config/prismaConfig");
const { NotFoundError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");


const UPCOMING_STATUSES = ["PENDING", "ACCEPTED"];
const ONGOING_STATUSES = ["ACCEPTED", "ARRIVED", "STARTED"];
const TERMINAL_STATUSES = ["CANCELLED", "COMPLETED", "PAID"];

const showUserUpComingAppoinment = async (req, res, next) => {
  try {
    const { id } = req.user;

    const nowUtc = new Date();

    console.log(nowUtc, 'nowUtc');

    const upcomingAppointment = await prisma.booking.findMany({
      where: {
        userId: id,
        status: { in: UPCOMING_STATUSES },
        startTime: { gt: nowUtc },
      },
      include: {
        barber: true,
        services: true,
      },
      orderBy: {
        startTime: "asc"
      },
    });

    if (upcomingAppointment.length === 0) {
      throw new NotFoundError("No upcoming appointment found");
    }

    handlerOk(res, 200, upcomingAppointment, "Upcoming appointment found successfully");

  } catch (error) {
    next(error);
  }
};

const showUserOngoingAppoinment = async (req, res, next) => {
  try {
    const { id } = req.user;

    const nowUtc = new Date();


    const ongoingappoinment = await prisma.booking.findMany({
      where: {
        userId: id,
        status: { in: ONGOING_STATUSES },
        startTime: { lte: nowUtc },
        endTime: { gte: nowUtc },
      },
      include: {
        barber: true,
        services: true
      },
      orderBy: {
        startTime: "asc"
      }
    });

    if (ongoingappoinment.length === 0) {
      throw new NotFoundError("No ongoing appoinment found")
    }

    handlerOk(res, 200, ongoingappoinment, "ongoing appoinment found successfully")

  } catch (error) {
    next(error)
  }
}

const showUserPastAppoinment = async (req, res, next) => {
  try {
    const { id } = req.user;

    const nowUtc = new Date();


    const pastappoinment = await prisma.booking.findMany({
      where: {
        userId: id,
        OR: [
          { status: { in: TERMINAL_STATUSES } },
          { endTime: { lt: nowUtc } }
        ],
      },
      include: {
        barber: true,
        services: true
      },
      orderBy: {
        startTime: "desc"
      }
    });

    if (pastappoinment.length === 0) {
      throw new NotFoundError("No past appoinment found")
    }

    handlerOk(res, 200, pastappoinment, "past appoinment found successfully");

  } catch (error) {
    next(error)
  }
}

module.exports = {
  showUserUpComingAppoinment,
  showUserOngoingAppoinment,
  showUserPastAppoinment
}
