const prisma = require("../../config/prismaConfig");
const { NotFoundError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");

const showBarberUpComingAppoinment = async (req, res, next) => {
  try {
    const { id } = req.user;

    const upcomingappoinment = await prisma.booking.findMany({
      where: {
        barberId: id,
        status: "PENDING",
        scheduledTime: {
          gt: new Date()
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

    const ongoingappoinment = await prisma.booking.findMany({
      where: {
        barberId: id,
        status: {
          in: ["ACCEPTED", "ARRIVED"]
        },
        scheduledTime: {
          lte: new Date()
        }
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

    const pastappoinment = await prisma.booking.findMany({
      where: {
        barberId: id,
        status: {
          in: ["CANCELLED", "COMPLETED", "PAID"]
        },
        scheduledTime: {
          lt: new Date()
        }
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

module.exports = {
  showBarberUpComingAppoinment,
  showBarberOnGoingAppoinment,
  showBarberPastAppoinment
}