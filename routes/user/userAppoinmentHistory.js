const limiter = require("../../middleware/limiter");


const userAppoinmentHistoryRouter = require("express").Router();
const userAppoinmentHistoryController = require("../../controllers/user/userAppoinmentHistoryController");
const { verifyUserToken } = require("../../middleware/auth");



userAppoinmentHistoryRouter.get(
  "/showUserUpComingAppoinment",
  // limiter,
  verifyUserToken,
  userAppoinmentHistoryController.showUserUpComingAppoinment
);

userAppoinmentHistoryRouter.get(
  "/showUserOngoingAppoinment",
  // limiter,
  verifyUserToken,
  userAppoinmentHistoryController.showUserOngoingAppoinment
);

userAppoinmentHistoryRouter.get(
  "/showUserPastAppoinment",
  // limiter,
  verifyUserToken,
  userAppoinmentHistoryController.showUserPastAppoinment
);



module.exports = userAppoinmentHistoryRouter