const prisma = require("../../config/prismaConfig");
const { NotFoundError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");

const onAndOffAvailableStatus = async (req, res, next) => {
  try {
    let { availableStatus, id } = req.user;

    availableStatus = !availableStatus;

    let message = availableStatus
      ? "availableStatus On Successfully"
      : "availableStatus Off Successfully";

    await prisma.barber.update({
      where: {
        id: id
      },
      data: {
        availableStatus: availableStatus
      }
    })

    handlerOk(res, 200, null, message)

  } catch (error) {
    next(error)
  }
}

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
      // Use Date object methods to get the hours and minutes
      const start = new Date(booking.startTime);
      const end = new Date(booking.endTime);

      // Extract hours and minutes for start and end times
      const startHours = start.getUTCHours();
      const startMinutes = start.getUTCMinutes();
      const endHours = end.getUTCHours();
      const endMinutes = end.getUTCMinutes();

      console.log(startHours, startMinutes, 'start');  // Logs start time in hours and minutes
      console.log(endHours, endMinutes, 'end');        // Logs end time in hours and minutes

      // Create Date objects by using a fixed date and the extracted time values
      const startDate = new Date(Date.UTC(1970, 0, 1, startHours, startMinutes)); // Using start hours and minutes
      const endDate = new Date(Date.UTC(1970, 0, 1, endHours, endMinutes)); // Using end hours and minutes

      // Calculate the difference in milliseconds
      const diffInMilliseconds = endDate - startDate;

      // Calculate the difference in hours
      const diffInHours = diffInMilliseconds / 1000 / 60 / 60; // Convert ms to hours

      // Add to the total
      return total + diffInHours;
    }, 0);

    console.log(totalHours, 'total hours worked');

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
  showAllStats,
  onAndOffAvailableStatus
}