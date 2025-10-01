// const showBarberBooking = async (req, res, next) => {
//   const { barberId } = req.params;

//   try {
//     const bookings = await prisma.booking.findMany({
//       where: { barberId },
//       include: {
//         services: true,
//         user: true,
//       },
//     });
//     return res.status(200).json(bookings);
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: 'Error fetching bookings' });
//   }
// }

// const trackUser = async (req, res, next) => {
//   try {
//     const { bookingId } = req.params;
//     const { userLatitude, userLongitude, barberLatitude, barberLongitude, status } = req.body; // Data from frontend


//     // First check if tracking already exists
//     let existingTracking = await prisma.bookingTracking.findFirst({
//       where: {
//         bookingId: bookingId,
//       },
//     });

//     // If no tracking record exists, create a new one
//     if (!existingTracking) {
//       const createdTracking = await prisma.bookingTracking.create({
//         data: {
//           bookingId: bookingId,
//           lat: userLatitude, // User's latitude
//           lng: userLongitude, // User's longitude
//           barberLat: barberLatitude, // Barber's latitude (sent from frontend)
//           barberLng: barberLongitude, // Barber's longitude (sent from frontend)
//           status: status, // Status from frontend (e.g., "On the way")
//           timestamp: new Date(),
//         },
//       });

//       return handlerOk(res, 200, {
//         status: "Tracking started",
//         userLat: userLatitude,
//         userLng: userLongitude,
//         barberLat: barberLatitude,
//         barberLng: barberLongitude,
//         status: status,
//       }, "Tracking created successfully");
//     }

//     // If tracking record exists, update it with new information
//     const updatedTracking = await prisma.bookingTracking.update({
//       where: {
//         id: existingTracking.id,
//       },
//       data: {
//         lat: userLatitude, // Updated user latitude
//         lng: userLongitude, // Updated user longitude
//         barberLat: barberLatitude, // Updated barber latitude
//         barberLng: barberLongitude, // Updated barber longitude
//         status: status, // Updated status
//         timestamp: new Date(),
//       },
//     });

//     // Optionally update the booking status with the status from frontend
//     const updatedBooking = await prisma.booking.update({
//       where: {
//         id: bookingId,
//       },
//       data: {
//         status: status, // Update booking status with status from frontend
//       },
//     });

//     // Update payment status if needed
//     // const updatedPayment = await prisma.payment.update({
//     //   where: {
//     //     bookingId: bookingId,
//     //   },
//     //   data: {
//     //     status: status, // Update payment status based on booking status
//     //   },
//     // });

//     handlerOk(res, 200, {
//       status: "Tracking updated successfully",
//       userLat: userLatitude,
//       userLng: userLongitude,
//       barberLat: barberLatitude,
//       barberLng: barberLongitude,
//       status: status,
//     }, "Tracking updated successfully");

//   } catch (error) {
//     next(error);
//   }
// };

module.exports = {
  // trackUser
}