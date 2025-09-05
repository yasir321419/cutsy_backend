const prisma = require("../../config/prismaConfig");
const { NotFoundError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");


const showUserUpComingAppoinment = async (req, res, next) => {
  try {
    const { id } = req.user;

    const nowUtc = new Date();

    console.log(nowUtc);


    const upcomingAppointment = await prisma.booking.findMany({
      where: {
        userId: id,
        status: "PENDING",
        startTime: { gt: nowUtc },
      },
      include: {
        barber: true,
        services: true,
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
        status: {
          in: ["ACCEPTED", "ARRIVED"]
        },
        startTime: { lte: nowUtc },     // started
        endTime: { gt: nowUtc },
      },
      include: {
        barber: true,
        services: true
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

    console.log(nowUtc);


    const pastappoinment = await prisma.booking.findMany({
      where: {
        userId: id,
        status: {
          in: ["CANCELLED", "COMPLETED", "PAID"]
        },
        endTime: { lt: nowUtc },
      },
      include: {
        barber: true,
        services: true
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