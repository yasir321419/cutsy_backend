const limiter = require("../../middleware/limiter");


const barberAppoinmentHistoryRouter = require("express").Router();
const barberAppoinmentHistoryController = require("../../controllers/barber/barberAppoinmentHistoryController");
const { verifyBarberToken } = require("../../middleware/auth");
const validateRequest = require("../../middleware/validateRequest");
const { trackUserSchema, startAppoinmentSchema } = require("../../schema/barber/booking");



barberAppoinmentHistoryRouter.get(
  "/showBarberUpComingAppoinment",
  // limiter,
  verifyBarberToken,
  barberAppoinmentHistoryController.showBarberUpComingAppoinment
);

barberAppoinmentHistoryRouter.get(
  "/showBarberOnGoingAppoinment",
  // limiter,
  verifyBarberToken,
  barberAppoinmentHistoryController.showBarberOnGoingAppoinment
);

barberAppoinmentHistoryRouter.get(
  "/showBarberPastAppoinment",
  // limiter,
  verifyBarberToken,
  barberAppoinmentHistoryController.showBarberPastAppoinment
);

barberAppoinmentHistoryRouter.post(
  "/trackUser/:bookingId",
  // limiter,
  verifyBarberToken,
  validateRequest(trackUserSchema),
  barberAppoinmentHistoryController.trackUser
);

barberAppoinmentHistoryRouter.post(
  "/StartAppoinment/:bookingId",
  // limiter,
  verifyBarberToken,
  validateRequest(startAppoinmentSchema),
  barberAppoinmentHistoryController.StartAppoinment
);



module.exports = barberAppoinmentHistoryRouter