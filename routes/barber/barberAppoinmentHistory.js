const limiter = require("../../middleware/limiter");


const barberAppoinmentHistoryRouter = require("express").Router();
const barberAppoinmentHistoryController = require("../../controllers/barber/barberAppoinmentHistoryController");
const { verifyBarberToken } = require("../../middleware/auth");



barberAppoinmentHistoryRouter.get(
  "/showBarberUpComingAppoinment",
  limiter,
  verifyBarberToken,
  barberAppoinmentHistoryController.showBarberUpComingAppoinment
);

barberAppoinmentHistoryRouter.get(
  "/showBarberOnGoingAppoinment",
  limiter,
  verifyBarberToken,
  barberAppoinmentHistoryController.showBarberOnGoingAppoinment
);

barberAppoinmentHistoryRouter.get(
  "/showBarberPastAppoinment",
  limiter,
  verifyBarberToken,
  barberAppoinmentHistoryController.showBarberPastAppoinment
);



module.exports = barberAppoinmentHistoryRouter