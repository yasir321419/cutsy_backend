const limiter = require("../../middleware/limiter");
const validateRequest = require("../../middleware/validateRequest");


const barberAvailableHourRouter = require("express").Router();
const barberAvilableHourController = require("../../controllers/barber/barberAvailableHourAndSubmitDocumentController");
const { verifyBarberToken } = require("../../middleware/auth");
const { addBarberAvailableHourSchema } = require("../../schema/barber/availblehour");
const handleMultiPartData = require("../../middleware/handleMultiPartData");
const isFileExists = require("../../middleware/isFileExist");



barberAvailableHourRouter.post(
  "/addAvailableHour",
  limiter,
  verifyBarberToken,
  validateRequest(addBarberAvailableHourSchema),
  barberAvilableHourController.addAvailableHour
);

barberAvailableHourRouter.get(
  "/showAvailableHour",
  limiter,
  verifyBarberToken,
  barberAvilableHourController.showAvailableHour
);

barberAvailableHourRouter.post(
  "/barberSubmitDocument",
  limiter,
  verifyBarberToken,
  handleMultiPartData.fields([
    { name: "drivingLicence", maxCount: 1 },
    { name: "certificate", maxCount: 1 },
  ]),
  isFileExists(["drivingLicence", "certificate"], "Documents are required"),

  barberAvilableHourController.barberSubmitDocument
);

module.exports = barberAvailableHourRouter;