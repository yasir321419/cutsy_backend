const prisma = require("../../config/prismaConfig");
const { NotFoundError, ValidationError, ConflictError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");
const sendNotification = require("../../utils/notification");

const addServices = async (req, res, next) => {
  try {
    const { id, deviceToken, name } = req.user;
    const { serviceId } = req.params;
    const { price } = req.body;

    const findservice = await prisma.barberServiceCategory.findUnique({
      where: {
        id: serviceId,
      }
    });

    if (!findservice) {
      throw new NotFoundError("service category not found")
    }

    const existservice = await prisma.barberService.findFirst({
      where: {
        serviceCategoryId: serviceId,
        price,
        createdById: id
      }
    });

    if (existservice) {
      throw new ConflictError("service already exists")
    }

    const createservice = await prisma.barberService.create({
      data: {
        serviceCategoryId: serviceId,
        price,
        createdById: id
      },
      include: {
        serviceCategory: true
      }
    });

    if (!createservice) {
      throw new ValidationError("service not created")
    }

    // await sendNotification(
    //   id,
    //   deviceToken,
    //   `Hi ${name}, you've successfully added your services to the list.`
    // );

    handlerOk(res, 200, createservice, "service created successfully")


  } catch (error) {
    next(error)
  }
}

const showServices = async (req, res, next) => {
  try {
    const { id } = req.user;

    const findbarberservices = await prisma.barberService.findMany({
      where: {
        createdById: id
      },
      include: {
        serviceCategory: true
      }
    });

    if (findbarberservices.length === 0) {
      throw new NotFoundError("no services found")
    }

    handlerOk(res, 200, findbarberservices, "services found successfully")

  } catch (error) {
    next(error)
  }
}

const editService = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const { id, deviceToken, name } = req.user;
    const { price } = req.body;

    const findservice = await prisma.barberService.findUnique({
      where: {
        id: serviceId,
        createdById: id
      }
    });

    if (!findservice) {
      throw new NotFoundError("service not found")
    }

    const updateservice = await prisma.barberService.update({
      where: {
        id: findservice.id,
      },
      data: {
        price
      }
    });

    if (!updateservice) {
      throw new ValidationError("service not update")
    }

    // await sendNotification(
    //   id,
    //   deviceToken,
    //   `Hi ${name}, you've successfully edit your service`
    // );

    handlerOk(res, 200, updateservice, "service updated successfully")

  } catch (error) {
    next(error)
  }
}

module.exports = {
  addServices,
  showServices,
  editService
}