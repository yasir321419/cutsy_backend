const prisma = require("../../config/prismaConfig");
const { handlerOk } = require("../../handler/resHandler");


const UPCOMING_STATUSES = ["PENDING", "ACCEPTED"];
const ONGOING_STATUSES = ["ACCEPTED", "ARRIVED", "STARTED"];
const TERMINAL_STATUSES = ["CANCELLED", "COMPLETED", "PAID"];

const showUserUpComingAppoinment = async (req, res, next) => {
  try {
    const { id } = req.user;

    const nowUtc = new Date();

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

    handlerOk(res, 200, upcomingAppointment, "Upcoming appointment found successfully");

  } catch (error) {
    next(error);
  }
};

const showUserOngoingAppoinment = async (req, res, next) => {
  try {
    const { id } = req.user;

    const nowUtc = new Date();

    console.log(nowUtc, 'now')
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
          {
            status: { in: TERMINAL_STATUSES },
            startTime: { lte: nowUtc }
          },
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
