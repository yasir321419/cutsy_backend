const prisma = require("../../config/prismaConfig");
const { ValidationError, ConflictError, NotFoundError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");
const sendNotification = require("../../utils/notification");
const uploadFileWithFolder = require("../../utils/s3Upload");
const { v4: uuidv4 } = require('uuid');
const path = require("path");

const addAvailableHour = async (req, res, next) => {
  try {
    const { id, deviceToken, name } = req.user;
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

    // await sendNotification(
    //   id,
    //   deviceToken,
    //   `Hi ${name}, your available hours have been successfully added to your profile.`
    // );


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

const editAvailableHour = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { availableHoursId } = req.params;
    const { starttime, endtime, day } = req.body;

    const findavailablehours = await prisma.barberAvailableHour.findUnique({
      where: {
        id: availableHoursId
      }
    });

    if (!findavailablehours) {
      throw new NotFoundError("available hours not found")
    }

    const updateavailableHours = await prisma.barberAvailableHour.update({
      where: {
        id: findavailablehours.id,
        createdById: id
      },
      data: {
        startTime: starttime,
        endTime: endtime,
        day: day
      }
    });

    if (!updateavailableHours) {
      throw new ValidationError("available hours not update")
    }

    handlerOk(res, 200, updateavailableHours, "available hours updated successfully");

  } catch (error) {
    next(error)
  }
}

const deleteAvailableHour = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { availableHoursId } = req.params;

    const findavailablehours = await prisma.barberAvailableHour.findUnique({
      where: {
        id: availableHoursId
      }
    });

    if (!findavailablehours) {
      throw new NotFoundError("available hours not found")
    }

    const deleteavailableHours = await prisma.barberAvailableHour.delete({
      where: {
        id: findavailablehours.id,
        createdById: id
      }
    });

    if (!deleteavailableHours) {
      throw new ValidationError("available hours not delete")
    }

    handlerOk(res, 200, null, "available hours deleted successfully");

  } catch (error) {
    next(error)
  }
}

const barberSubmitDocument = async (req, res, next) => {
  try {
    const { id, name, deviceToken } = req.user;

    // Multer .fields() → files are in req.files
    const dlFile = req.files?.drivingLicence?.[0];
    const certFile = req.files?.certificate?.[0];

    let dlUrl = null;
    let certUrl = null;
    const folder = "uploads";

    if (dlFile) {
      const filename = `${uuidv4()}-${Date.now()}${path.extname(dlFile.originalname)}`;
      dlUrl = await uploadFileWithFolder(
        dlFile.buffer,
        filename,
        dlFile.mimetype || "application/octet-stream",
        folder
      );
    }

    if (certFile) {
      const filename = `${uuidv4()}-${Date.now()}${path.extname(certFile.originalname)}`;
      certUrl = await uploadFileWithFolder(
        certFile.buffer,
        filename,
        certFile.mimetype || "application/octet-stream",
        folder
      );
    }

    if (!dlUrl && !certUrl) {
      throw new ValidationError("At least one document must be uploaded");
    }

    const submitdocument = await prisma.barberDocument.create({
      data: {
        drivingLicence: dlUrl,
        certificate: certUrl,
        createdById: id,
      },
    });

    handlerOk(res, 200, submitdocument, "document submitted successfully");

    // Optional: notification
    // await sendNotification(
    //   id,
    //   deviceToken,
    //   `Hi ${name}, your documents have been successfully added to your profile.`
    // );

  } catch (error) {
    next(error);
  }
};


module.exports = {
  addAvailableHour,
  showAvailableHour,
  barberSubmitDocument,
  editAvailableHour,
  deleteAvailableHour
}