const limiter = require("../../middleware/limiter");
const validateRequest = require("../../middleware/validateRequest");


const barberServiceRouter = require("express").Router();
const barberServiceController = require("../../controllers/barber/barberServiceController");
const { verifyBarberToken } = require("../../middleware/auth");
const { addBarberServiceSchema } = require("../../schema/barber/service");



barberServiceRouter.post(
  "/addServices/:serviceId",
  limiter,
  verifyBarberToken,
  validateRequest(addBarberServiceSchema),
  barberServiceController.addServices
);

barberServiceRouter.get(
  "/showServices",
  limiter,
  verifyBarberToken,
  barberServiceController.showServices
);

barberServiceRouter.put(
  "/editService/:serviceId",
  limiter,
  verifyBarberToken,
  validateRequest(addBarberServiceSchema),
  barberServiceController.editService
);

module.exports = barberServiceRouter;