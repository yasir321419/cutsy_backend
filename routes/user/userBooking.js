const limiter = require("../../middleware/limiter");
const validateRequest = require("../../middleware/validateRequest");


const userBookingRouter = require("express").Router();
const userBookingController = require("../../controllers/user/userBookingController");
const { verifyUserToken } = require("../../middleware/auth");



userBookingRouter.post(
  "/createBookingAndPayment",
  limiter,
  verifyUserToken,
  userBookingController.createBookingAndPayment
);

userBookingRouter.get(
  "/showAppoinmentDetail/:bookingId",
  limiter,
  verifyUserToken,
  userBookingController.showAppoinmentDetail
);

userBookingRouter.post(
  "/cancelAppointment/:bookingId",
  limiter,
  verifyUserToken,
  userBookingController.cancelAppointment
);

userBookingRouter.post(
  "/trackBarber/:barberId",
  limiter,
  verifyUserToken,
  userBookingController.trackBarber
);

userBookingRouter.get(
  "/showInvoice/:bookingId",
  limiter,
  verifyUserToken,
  userBookingController.showInvoice
);

userBookingRouter.get(
  "/showPaymentReceipt/:bookingId",
  limiter,
  verifyUserToken,
  userBookingController.showPaymentReceipt
);

module.exports = userBookingRouter