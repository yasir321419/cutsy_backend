const prisma = require("../../config/prismaConfig");
const { NotFoundError, ConflictError, ValidationError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");

const showNearestBarbers = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.user;

    const nearestBarbers = await prisma.$queryRawUnsafe(`
      SELECT *, (
        6371 * ACOS(
          COS(RADIANS(?)) * COS(RADIANS(latitude)) *
          COS(RADIANS(longitude) - RADIANS(?)) +
          SIN(RADIANS(?)) * SIN(RADIANS(latitude))
        )
      ) AS distance
      FROM Barber
      HAVING distance <= 10
      ORDER BY distance ASC
      LIMIT 50
    `, latitude, longitude, latitude);

    if (!nearestBarbers || nearestBarbers.length === 0) {
      throw new NotFoundError("No barbers found within a 10 km radius.");
    }

    const barberIds = nearestBarbers.map(b => b.id);

    const barbers = await prisma.barber.findMany({
      where: {
        id: {
          in: barberIds
        }
      },

      include: {
        BarberService: {
          include: {
            serviceCategory: true
          }
        },
        selectedHairType: true,
        selectedHairLength: true,
        barberExperience: true,
        BarberAvailableHour: true
      }
    });



    handlerOk(res, 200, barbers, "nearest barbers found successfully")
  } catch (error) {
    next(error)
  }
}


const showBarbersBySearchService = async (req, res, next) => {
  try {
    const { search } = req.query;

    const barbers = await prisma.barber.findMany({
      where: {
        BarberService: {
          some: {
            serviceCategory: {
              service: {
                contains: search,
                // mode: "insensitive"
              }
            }
          }
        }
      },
      include: {
        BarberService: {
          include: {
            serviceCategory: true,

          }
        },
        selectedHairType: true,
        selectedHairLength: true,
        barberExperience: true,
        BarberAvailableHour: true
      }
    });

    if (barbers.length === 0) {
      throw new NotFoundError("No barbers found with the given search.");
    }

    handlerOk(res, 200, barbers, "barbers found successfully");

  } catch (error) {
    next(error)
  }
}

const saveBarberInFavoriteList = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { barberId } = req.params;

    const findbarber = await prisma.barber.findUnique({
      where: {
        id: barberId
      }
    });

    if (!findbarber) {
      throw new NotFoundError("Barber not found.");
    }

    const alreadysave = await prisma.barberFavourite.findFirst({
      where: {
        userId: id,
        barberId: barberId
      }
    });

    if (alreadysave) {
      throw new ConflictError("barber already save in favorite list")
    }

    const savebarberinfavoritelist = await prisma.barberFavourite.create({
      data: {
        userId: id,
        barberId: barberId
      }
    });

    if (!savebarberinfavoritelist) {
      throw new ValidationError("barber not save in favorite list")
    }

    handlerOk(res, 200, savebarberinfavoritelist, "barber save in favorite list")
  } catch (error) {
    next(error)
  }
}

const showBarberFavouriteList = async (req, res, next) => {
  try {
    const { id } = req.user;

    const showfavoritelist = await prisma.barberFavourite.findMany({
      where: {
        userId: id
      },
      include: {
        barber: {
          include: {
            BarberService: {
              include: {
                serviceCategory: true,
              }
            },
            selectedHairType: true,
            selectedHairLength: true,
            barberExperience: true,
            BarberAvailableHour: true
          }
        }
      }
    });

    if (showfavoritelist.length === 0) {
      throw new NotFoundError("favorite list is empty")
    }

    handlerOk(res, 200, showfavoritelist, "favorite list found successfully")
  } catch (error) {
    next(error)
  }
}

const showTrendingBarbers = async (req, res, next) => {
  try {
    const trendingBarberRatings = await prisma.review.groupBy({
      by: ['barberId'],
      _avg: { rating: true },
      _count: { rating: true },
      orderBy: {
        _avg: { rating: 'desc' }
      },
      take: 20
    });

    const barberIds = trendingBarberRatings.map(r => r.barberId);

    const barbers = await prisma.barber.findMany({
      where: {
        id: { in: barberIds }
      },
      include: {
        BarberService: {
          include: {
            serviceCategory: true
          }
        },
        selectedHairType: true,
        selectedHairLength: true,
        barberExperience: true,
        BarberAvailableHour: true

      }
    });

    const barbersWithRatings = barbers.map(barber => {
      const ratingInfo = trendingBarberRatings.find(r => r.barberId === barber.id);
      return {
        ...barber,
        averageRating: ratingInfo?._avg?.rating || 0,
        totalReviews: ratingInfo?._count?.rating || 0
      };
    });

    handlerOk(res, 200, barbersWithRatings, "trending barbers fetched successfully");
  } catch (error) {
    next(error);
  }
}


module.exports = {

  showNearestBarbers,
  showTrendingBarbers,
  showBarbersBySearchService,
  saveBarberInFavoriteList,
  showBarberFavouriteList

}