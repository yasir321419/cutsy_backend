const prisma = require("../../config/prismaConfig");
const { NotFoundError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");

const showLatestUpcomingAppoinment = async (req, res, next) => {
  try {
    const { id } = req.user;

    const latestupcomingappoinment = await prisma.booking.findFirst({
      where: {
        barberId: id,
        status: "PENDING"
      },
      include: {
        user: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    if (!latestupcomingappoinment) {
      throw new NotFoundError("Upcoming appointment not found")
    }

    // Prepare the response data
    const appointmentData = {
      date: latestupcomingappoinment.scheduledTime,
      userName: latestupcomingappoinment.user.name,
      userImage: latestupcomingappoinment.user.image, // Assuming barber has an image field
      location: latestupcomingappoinment.locationName,
    };

    handlerOk(res, 200, appointmentData, "Upcoming appoinment found successfully");

  } catch (error) {
    next(error)
  }
}

const showAllUpcomingAppoinments = async (req, res, next) => {

  try {
    const { id } = req.user;

    const upcomingappoinments = await prisma.booking.findMany({
      where: {
        barberId: id,
        status: "PENDING"
      },
      include: {
        user: true
      }
    });

    if (upcomingappoinments.length === 0) {
      throw new NotFoundError("Upcoming appoinments not found")
    }

    // Prepare the response data
    const appointmentsData = upcomingappoinments.map(appointment => ({
      id: appointment.id,
      scheduledTime: appointment.scheduledTime,
      userName: appointment.user.name,
      userImage: appointment.user.image, // Assuming barber has an image field
      location: appointment.locationName,
      status: appointment.status,
    }));

    handlerOk(res, 200, appointmentsData, "Upcoming appoinments found successfully");

  } catch (error) {
    next(error)
  }
}

const showAllStats = async (req, res, next) => {
  try {

    const { id } = req.user;

    // Total hours worked (this can be based on the scheduled time of the bookings)

    const totalHours = await prisma.booking.aggregate({
      where: {
        barberId: id,
        status: "COMPLETED"
      },
      _sum: {
        scheduledTime: true
      }
    });

    const averageRating = await prisma.review.aggregate({
      where: {
        barberId: true
      },
      _avg: {
        rating: true
      }
    });

    const totalBookings = await prisma.booking.count({
      where: {
        barberId: id
      }
    });

    const totalEarnings = await prisma.payment.aggregate({
      where: {
        barberId: id,
        status: "COMPLETED"
      },
      _sum: {
        amount: true
      }
    });

    const monthlyEarnings = await prisma.payment.aggregate({
      where: {
        barberId: id,
        scheduledTime: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First day of the current month
          lte: new Date(), // Today's date
        },
        status: "COMPLETED"
      },
      _sum: {
        amount: true
      }
    });

    // Prepare the response data
    const statsData = {
      totalHours: totalHours._sum.scheduledTime,
      averageRating: averageRating._avg.rating || 0,
      totalBookings,
      totalEarnings: totalEarnings._sum.amount || 0,
      monthlyEarnings: monthlyEarnings._sum.amount || 0,
    };

    handlerOk(res, 200, statsData, "Overall stats retrieved successfully")

  } catch (error) {
    next(error)
  }
}

module.exports = {
  showLatestUpcomingAppoinment,
  showAllUpcomingAppoinments,
  showAllStats
}