const limiter = require("../../middleware/limiter");
const validateRequest = require("../../middleware/validateRequest");


const barberNotificationRouter = require("express").Router();
const barberNotificationController = require("../../controllers/barber/barberNotificationsController");
const { verifyBarberToken } = require("../../middleware/auth");
const { barberNotificationReadSchema, barberAllNotificationSchema, barberAcceptRejectSchema } = require("../../schema/barber/notification");



barberNotificationRouter.get(
  "/showAllBarberNotification",
  limiter,
  verifyBarberToken,
  validateRequest(barberAllNotificationSchema),
  barberNotificationController.showAllBarberNotification
);

barberNotificationRouter.put(
  "/readBarberNotification/:notificationId",
  limiter,
  verifyBarberToken,
  validateRequest(barberNotificationReadSchema),
  barberNotificationController.readBarberNotification
);

barberNotificationRouter.put(
  "/onAndOffBarberNotification",
  limiter,
  verifyBarberToken,
  barberNotificationController.onAndOffBarberNotification
);

barberNotificationRouter.post(
  "/acceptBooking/:bookingId",
  limiter,
  verifyBarberToken,
  validateRequest(barberAcceptRejectSchema),
  barberNotificationController.acceptBooking
);

barberNotificationRouter.post(
  "/rejectBooking/:bookingId",
  limiter,
  verifyBarberToken,
  validateRequest(barberAcceptRejectSchema),
  barberNotificationController.rejectBooking
);

module.exports = barberNotificationRouter;