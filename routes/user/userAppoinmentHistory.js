const limiter = require("../../middleware/limiter");
const validateRequest = require("../../middleware/validateRequest");


const userAppoinmentHistoryRouter = require("express").Router();
const userAppoinmentHistoryController = require("../../controllers/user/userAppoinmentHistoryController");
const { verifyUserToken } = require("../../middleware/auth");



userAppoinmentHistoryRouter.get(
  "/showUpComingAppoinment",
  limiter,
  verifyUserToken,
  userAppoinmentHistoryController.showUpComingAppoinment
);

userAppoinmentHistoryRouter.get(
  "/showOngoingAppoinment",
  limiter,
  verifyUserToken,
  userAppoinmentHistoryController.showOngoingAppoinment
);

userAppoinmentHistoryRouter.get(
  "/showPastAppoinment",
  limiter,
  verifyUserToken,
  userAppoinmentHistoryController.showPastAppoinment
);



module.exports = userAppoinmentHistoryRouter