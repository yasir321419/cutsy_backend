const limiter = require("../../middleware/limiter");


const barberDashboardRouter = require("express").Router();
const barberDashboardController = require("../../controllers/barber/barberDashboardController");
const { verifyBarberToken } = require("../../middleware/auth");



barberDashboardRouter.get(
  "/showLatestUpcomingAppoinment",
  limiter,
  verifyBarberToken,
  barberDashboardController.showLatestUpcomingAppoinment
);

barberDashboardRouter.get(
  "/showAllUpcomingAppoinments",
  limiter,
  verifyBarberToken,
  barberDashboardController.showAllUpcomingAppoinments
);

barberDashboardRouter.get(
  "/showAllStats",
  limiter,
  verifyBarberToken,
  barberDashboardController.showAllStats
);

barberDashboardRouter.patch(
  "/onAndOffAvailableStatus",
  limiter,
  verifyBarberToken,
  barberDashboardController.onAndOffAvailableStatus
);



module.exports = barberDashboardRouter