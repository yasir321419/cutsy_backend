const prisma = require("../../config/prismaConfig");
const { ValidationError, ConflictError, NotFoundError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");

const addAvailableHour = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { starttime, endtime, day } = req.body;

    const existAvailableHour = await prisma.barberAvailableHour.findFirst({
      where: {
        day,
        startTime: {
          lt: endtime
        },
        endTime: {
          gt: starttime
        },
        createdById: id
      }
    });

    if (existAvailableHour) {
      throw new ConflictError("available hour already exist");
    }

    const createAvailableHour = await prisma.barberAvailableHour.create({
      data: {
        day,
        startTime: starttime,
        endTime: endtime,
        createdById: id
      }
    });

    if (!createAvailableHour) {
      throw new ValidationError("available hour not created");
    }

    handlerOk(res, 200, createAvailableHour, "available hour created successfully");


  } catch (error) {
    next(error)
  }
}

const showAvailableHour = async (req, res, next) => {
  try {
    const { id } = req.user;

    const findavailablehour = await prisma.barberAvailableHour.findMany({
      where: {
        createdById: id
      }
    });

    if (findavailablehour.length === 0) {
      throw new NotFoundError("available hour not found");
    }

    handlerOk(res, 200, findavailablehour, "available hour found successfully")
  } catch (error) {
    next(error)
  }
}

const barberSubmitDocument = async (req, res, next) => {
  try {
    const file = req.file;
    const { id } = req.user;
    console.log(file, 'file');


    const filePath = file.filename; // use filename instead of path
    const basePath = `http://${req.get("host")}/public/uploads/`;
    const document = `${basePath}${filePath}`;

    const submitdocument = await prisma.barberDocument.create({
      data: {
        document,
        createdById: id
      }
    });

    if (!submitdocument) {
      throw new ValidationError("document not submit");
    }

    handlerOk(res, 200, submitdocument, "document submitted successfully")

  } catch (error) {
    next(error)
  }
}

module.exports = {
  addAvailableHour,
  showAvailableHour,
  barberSubmitDocument
}