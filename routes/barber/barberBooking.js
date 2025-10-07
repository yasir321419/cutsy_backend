const limiter = require("../../middleware/limiter");
const validateRequest = require("../../middleware/validateRequest");


const barberBookingRouter = require("express").Router();
const barberBookingController = require("../../controllers/barber/barberBookingController");
const { verifyBarberToken } = require("../../middleware/auth");
const { completedBookingSchema } = require("../../schema/barber/booking");
const { barberAcceptRejectSchema } = require("../../schema/barber/notification");


barberBookingRouter.post(
  "/acceptBooking/:bookingId",
  // limiter, 
  verifyBarberToken,
  validateRequest(barberAcceptRejectSchema),
  barberBookingController.acceptBooking
);

barberBookingRouter.post(
  "/rejectBooking/:bookingId",
  // limiter,
  verifyBarberToken,
  validateRequest(barberAcceptRejectSchema),
  barberBookingController.rejectBooking
);


barberBookingRouter.post(
  "/completedBooking/:bookingId",
  limiter,
  verifyBarberToken,
  validateRequest(completedBookingSchema),
  barberBookingController.completedBooking
);



module.exports = barberBookingRouter;