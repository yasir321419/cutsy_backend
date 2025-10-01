// const limiter = require("../../middleware/limiter");
// const validateRequest = require("../../middleware/validateRequest");


// const barberBookingRouter = require("express").Router();
// const barberBookingController = require("../../controllers/barber/barberBookingController");
// const { verifyBarberToken } = require("../../middleware/auth");
// const handleMultiPartData = require("../../middleware/handleMultiPartData");
// const { trackUserSchema } = require("../../schema/barber/booking");


// barberBookingRouter.post(
//   "/trackUser/:bookingId",
//   limiter,
//   verifyBarberToken,
//   validateRequest(trackUserSchema),
//   barberBookingController.trackUser
// );

// module.exports = barberBookingRouter;