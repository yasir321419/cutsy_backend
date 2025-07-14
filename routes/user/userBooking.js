const limiter = require("../../middleware/limiter");
const validateRequest = require("../../middleware/validateRequest");


const userBookingRouter = require("express").Router();
const userBookingController = require("../../controllers/user/userBookingController");
const { verifyUserToken } = require("../../middleware/auth");



userBookingRouter.post(
  "/createBooking",
  limiter,
  verifyUserToken,
  userBookingController.createBooking
);

userBookingRouter.get(
  "/showBooking",
  limiter,
  verifyUserToken,
  userBookingController.showBooking
);

userBookingRouter.get(
  "/showAppoinmentDetail/:bookingId",
  limiter,
  verifyUserToken,
  userBookingController.showAppoinmentDetail
);

userBookingRouter.post(
  "/cancelAppoinment/:bookingId",
  limiter,
  verifyUserToken,
  userBookingController.cancelAppoinment
);

userBookingRouter.post(
  "/trackBarber/:barberId",
  limiter,
  verifyUserToken,
  userBookingController.trackBarber
);

userBookingRouter.post(
  "/makePayment/:bookingId",
  limiter,
  verifyUserToken,
  userBookingController.makePayment
);

module.exports = userBookingRouter