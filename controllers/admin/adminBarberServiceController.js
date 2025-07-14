const prisma = require("../../config/prismaConfig");
const { ConflictError, ValidationError, NotFoundError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");

const adminCreateBarberService = async (req, res, next) => {
  try {
    const { service, role } = req.body;
    const { id } = req.user;


    const existservice = await prisma.barberServiceCategory.findFirst({
      where: {
        service,
        genderCategory: role
      }
    });

    if (existservice) {
      throw new ConflictError("barber service already exist")
    }

    const createbarberservice = await prisma.barberServiceCategory.create({
      data: {
        service,
        genderCategory: role,
        createdById: id
      }
    });

    if (!createbarberservice) {
      throw new ValidationError("barber service not created")
    }

    handlerOk(res, 200, createbarberservice, "barber service created successfully");

  } catch (error) {
    next(error)
  }
}

const adminShowBarberService = async (req, res, next) => {
  try {

    let barberService;
    const { role } = req.query;
    if (req.user && req.user.id) {
      const { id } = req.user;

      barberService = await prisma.barberServiceCategory.findMany({
        where: {
          createdById: id
        }
      })

    } else {
      barberService = await prisma.barberServiceCategory.findMany({
        where: {
          genderCategory: role
        }
      })
    }

    if (barberService.length === 0) {
      throw new NotFoundError("barber service not found")
    }

    handlerOk(res, 200, barberService, "barber service found successfully")
  } catch (error) {
    next(error)
  }
}

const adminUpdateBarberService = async (req, res, next) => {
  try {
    const { service } = req.body;
    const { id } = req.user;
    const { serviceId } = req.params;

    const findservice = await prisma.barberServiceCategory.findUnique({
      where: {
        id: serviceId,
        createdById: id
      }
    });

    if (!findservice) {
      throw new NotFoundError("barber service not found")
    }

    const updateservice = await prisma.barberServiceCategory.update({
      where: {
        id: findservice.id
      },
      data: {
        service,
      }
    });

    if (!updateservice) {
      throw new ValidationError("barber service not update")
    }

    handlerOk(res, 200, updateservice, "barber service updated successfully")

  } catch (error) {
    next(error)
  }
}

const adminDeleteBarberService = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { serviceId } = req.params;

    const findservice = await prisma.barberServiceCategory.findUnique({
      where: {
        id: serviceId,
        createdById: id
      }
    });

    if (!findservice) {
      throw new NotFoundError("barber service not found")
    }

    const deleteservice = await prisma.barberServiceCategory.delete({
      where: {
        id: findservice.id
      }
    });

    if (!deleteservice) {
      throw new ValidationError("barber service not delete")
    }

    handlerOk(res, 200, null, "barber service deleted successfully")
  } catch (error) {
    next(error)
  }
}


module.exports = {
  adminCreateBarberService,
  adminShowBarberService,
  adminUpdateBarberService,
  adminDeleteBarberService
}