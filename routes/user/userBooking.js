const limiter = require("../../middleware/limiter");
const validateRequest = require("../../middleware/validateRequest");


const userBookingRouter = require("express").Router();
const userBookingController = require("../../controllers/user/userBookingController");
const { verifyUserToken } = require("../../middleware/auth");



userBookingRouter.post(
  "/createBooking",
  // limiter,
  verifyUserToken,
  userBookingController.createBooking
);

userBookingRouter.get(
  "/showAppoinmentDetail/:bookingId",
  // limiter,
  verifyUserToken,
  userBookingController.showAppoinmentDetail
);

userBookingRouter.post(
  "/cancelAppointment/:bookingId",
  // limiter,
  verifyUserToken,
  userBookingController.cancelAppointment
);

userBookingRouter.get(
  "/trackBarber/:bookingId",
  // limiter,
  verifyUserToken,
  userBookingController.trackBarber
);

userBookingRouter.get(
  "/showInvoiceDetail/:bookingId",
  // limiter,
  verifyUserToken,
  userBookingController.showInvoiceDetail
);

userBookingRouter.get(
  "/showPaymentReceipt/:paymentIntentId",
  // limiter,
  verifyUserToken,
  userBookingController.showPaymentReceipt
);

userBookingRouter.post(
  "/submitReview",
  // limiter,
  verifyUserToken,
  userBookingController.submitReview
);

userBookingRouter.post(
  "/makePayment/:bookingId",
  // limiter,
  verifyUserToken,
  userBookingController.makePayment
);

module.exports = userBookingRouter