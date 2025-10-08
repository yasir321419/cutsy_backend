const prisma = require("../../config/prismaConfig");
const { BadRequestError, ValidationError, ConflictError, NotFoundError } = require("../../handler/CustomError");
const { handlerOk } = require("../../handler/resHandler");
const sendNotification = require("../../utils/notification");
const uploadFileWithFolder = require("../../utils/s3Upload");
const { v4: uuidv4 } = require('uuid');
const path = require("path");
const {
  parseTimeInputToMinutes,
  minutesToUtcDate,
  extractMinutesFromStoredValue,
  serializeAvailabilitySlot,
} = require("../../utils/timeSlot");

const addAvailableHour = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { starttime, endtime, day } = req.body;

    const startMinutes = parseTimeInputToMinutes(starttime, "startTime");
    const endMinutes = parseTimeInputToMinutes(endtime, "endTime");

    if (endMinutes <= startMinutes) {
      throw new BadRequestError("endTime must be after startTime");
    }

    const existingSlots = await prisma.barberAvailableHour.findMany({
      where: {
        day,
        createdById: id,
      },
    });

    const overlaps = existingSlots.some((slot) => {
      const slotStart = extractMinutesFromStoredValue(slot.startTime);
      const slotEnd = extractMinutesFromStoredValue(slot.endTime);
      if (slotStart === null || slotEnd === null) {
        return false;
      }
      return slotStart < endMinutes && slotEnd > startMinutes;
    });

    if (overlaps) {
      throw new ConflictError("Available hour overlaps with an existing slot");
    }

    const created = await prisma.barberAvailableHour.create({
      data: {
        day,
        startTime: minutesToUtcDate(startMinutes),
        endTime: minutesToUtcDate(endMinutes),
        createdById: id,
      },
    });

    handlerOk(res, 200, serializeAvailabilitySlot(created), "available hour created successfully");
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

    const formatted = findavailablehour.map(serializeAvailabilitySlot);

    handlerOk(res, 200, formatted, "available hour found successfully")
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

    if (findavailablehours.createdById !== id) {
      throw new NotFoundError("available hours not found")
    }

    const startMinutes = parseTimeInputToMinutes(starttime, "startTime");
    const endMinutes = parseTimeInputToMinutes(endtime, "endTime");

    if (endMinutes <= startMinutes) {
      throw new BadRequestError("endTime must be after startTime");
    }

    const clashSlots = await prisma.barberAvailableHour.findMany({
      where: {
        createdById: id,
        day,
        NOT: {
          id: availableHoursId
        }
      }
    });

    const overlaps = clashSlots.some((slot) => {
      const slotStart = extractMinutesFromStoredValue(slot.startTime);
      const slotEnd = extractMinutesFromStoredValue(slot.endTime);
      if (slotStart === null || slotEnd === null) {
        return false;
      }
      return slotStart < endMinutes && slotEnd > startMinutes;
    });

    if (overlaps) {
      throw new ConflictError("Available hour overlaps with an existing slot");
    }

    const updateavailableHours = await prisma.barberAvailableHour.update({
      where: {
        id: findavailablehours.id
      },
      data: {
        startTime: minutesToUtcDate(startMinutes),
        endTime: minutesToUtcDate(endMinutes),
        day: day
      }
    });

    handlerOk(res, 200, serializeAvailabilitySlot(updateavailableHours), "available hours updated successfully");

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

    if (!findavailablehours || findavailablehours.createdById !== id) {
      throw new NotFoundError("available hours not found")
    }

    await prisma.barberAvailableHour.delete({
      where: {
        id: findavailablehours.id
      }
    });

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
