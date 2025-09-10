const prisma = require("../../config/prismaConfig");
const { NotFoundError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");

const showLatestUpcomingAppoinment = async (req, res, next) => {
  try {
    const { id } = req.user;
    const nowUtc = new Date();

    console.log(nowUtc, 'time');

    const latestupcomingappoinment = await prisma.booking.findFirst({
      where: {
        barberId: id,
        status: "PENDING",
        startTime: {
          gt: nowUtc,  // Compare the start time stored in the DB with the current time
        },
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
      startTime: latestupcomingappoinment.startTime,
      endTime: latestupcomingappoinment.endTime,
      userName: latestupcomingappoinment.user.firstName,
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
    const nowUtc = new Date();


    const upcomingappoinments = await prisma.booking.findMany({
      where: {
        barberId: id,
        status: "PENDING",
        startTime: {
          gt: nowUtc,  // Compare the start time stored in the DB with the current time
        },
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
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      userName: appointment.user.firstName,
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

    // Calculate total hours worked
    const totalHoursWorked = await prisma.booking.findMany({
      where: {
        barberId: id,
        status: "COMPLETED"
      },
      select: {
        startTime: true,
        endTime: true,
      }
    });


    // Sum the hours worked based on start and end time
    const totalHours = totalHoursWorked.reduce((total, booking) => {
      // Ensure the start and end times are in "HH:mm" format
      const start = booking.startTime.split(':');
      const end = booking.endTime.split(':');

      console.log(start, 'start');


      // Create Date objects by using a fixed date and the extracted time values
      const startDate = new Date(Date.UTC(1970, 0, 1, start[0], start[1])); // "1970-01-01T{startTime}:00Z"
      const endDate = new Date(Date.UTC(1970, 0, 1, end[0], end[1])); // "1970-01-01T{endTime}:00Z"

      // Calculate the difference in milliseconds
      const diffInMilliseconds = endDate - startDate;

      // Calculate the difference in hours
      const diffInHours = diffInMilliseconds / 1000 / 60 / 60; // Convert ms to hours

      // Add to the total
      return total + diffInHours;
    }, 0);

    console.log(totalHours, 'total hours worked');

    // console.log(totalHours, 'hours');


    // Calculate the average rating for the barber
    const averageRating = await prisma.review.aggregate({
      where: {
        barberId: id
      },
      _avg: {
        rating: true
      }
    });

    // Calculate the total number of bookings for the barber
    const totalBookings = await prisma.booking.count({
      where: {
        barberId: id,
        status: {
          not: "CANCELLED",  // Use `not` to exclude the "CANCELLED" status
        }
      }
    });

    // Calculate the total earnings for the barber
    const totalEarnings = await prisma.payment.aggregate({
      where: {
        booking: {
          barberId: id,  // Use the barber's ID from the related booking
        },
        status: "COMPLETED"
      },
      _sum: {
        amount: true  // Sum up the payment amounts
      }
    });

    // Calculate the monthly earnings for the barber
    const monthlyEarnings = await prisma.payment.aggregate({
      where: {
        booking: {
          barberId: id,
        },
        createdAt: {
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
      totalHours: totalHours.toFixed(2), // Rounded to 2 decimal places
      averageRating: averageRating._avg.rating || 0,
      totalBookings,
      totalEarnings: totalEarnings._sum.amount || 0,
      monthlyEarnings: monthlyEarnings._sum.amount || 0,
    };

    handlerOk(res, 200, statsData, "Overall stats retrieved successfully");

  } catch (error) {
    next(error);
  }
};



module.exports = {
  showLatestUpcomingAppoinment,
  showAllUpcomingAppoinments,
  showAllStats
}