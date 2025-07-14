const showBarberBooking = async (req, res, next) => {
  const { barberId } = req.params;

  try {
    const bookings = await prisma.booking.findMany({
      where: { barberId },
      include: {
        services: true,
        user: true,
      },
    });
    return res.status(200).json(bookings);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error fetching bookings' });
  }
}