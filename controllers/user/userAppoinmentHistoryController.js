const prisma = require("../../config/prismaConfig");
const { NotFoundError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");

const showUpComingAppoinment = async (req, res, next) => {
  try {
    const { id } = req.user;

    const upcomingappoinment = await prisma.booking.findMany({
      where: {
        userId: id,
        status: "PENDING",
        scheduledTime: {
          gt: new Date()
        }
      },
      include: {
        barber: true,
        services: true
      }
    });

    if (upcomingappoinment.length === 0) {
      throw new NotFoundError("No upcoming appoinment found")
    }

    handlerOk(res, 200, upcomingappoinment, "upcoming appoinment found successfully")

  } catch (error) {
    next(error)
  }
}

const showOngoingAppoinment = async (req, res, next) => {
  try {
    const { id } = req.user;

    const ongoingappoinment = await prisma.booking.findMany({
      where: {
        userId: id,
        status: {
          in: ["ACCEPTED", "ARRIVED"]
        },
        scheduledTime: {
          lte: new Date()
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

const showPastAppoinment = async (req, res, next) => {
  try {
    const { id } = req.user;

    const pastappoinment = await prisma.booking.findMany({
      where: {
        userId: id,
        status: {
          in: ["CANCELLED", "COMPLETED", "PAID"]
        },
        scheduledTime: {
          lt: new Date()
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
  showUpComingAppoinment,
  showOngoingAppoinment,
  showPastAppoinment
}