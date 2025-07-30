const prisma = require("../../config/prismaConfig");
const { NotFoundError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");


const showUserUpComingAppoinment = async (req, res, next) => {
  try {
    const { id } = req.user;

    // Extract the current time in "HH:mm" format
    const currentTime = new Date().toISOString().slice(11, 16); // "HH:mm" format

    console.log(currentTime, 'current time');  // Logs current time for debugging

    const upcomingAppointment = await prisma.booking.findMany({
      where: {
        userId: id,
        status: "PENDING",
        startTime: {
          gt: currentTime,  // Compare the start time stored in the DB with the current time
        },
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

    const currentTime = new Date().toISOString().slice(11, 16); // "HH:mm" format


    const ongoingappoinment = await prisma.booking.findMany({
      where: {
        userId: id,
        status: {
          in: ["ACCEPTED", "ARRIVED"]
        },
        startTime: {
          lte: currentTime
        }
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

    const currentTime = new Date().toISOString().slice(11, 16); // "HH:mm" format


    const pastappoinment = await prisma.booking.findMany({
      where: {
        userId: id,
        status: {
          in: ["CANCELLED", "COMPLETED", "PAID"]
        },
        startTime: {
          lt: currentTime
        }
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