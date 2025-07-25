const limiter = require("../../middleware/limiter");
const validateRequest = require("../../middleware/validateRequest");


const barberNotificationRouter = require("express").Router();
const barberNotificationController = require("../../controllers/barber/barberNotificationsController");
const { verifyBarberToken } = require("../../middleware/auth");
const { barberNotificationReadSchema, barberAllNotificationSchema } = require("../../schema/barber/notification");



barberNotificationRouter.get(
  "/showAllNotification",
  limiter,
  verifyBarberToken,
  validateRequest(barberNotificationReadSchema),
  barberNotificationController.showAllNotification
);

barberNotificationRouter.put(
  "/readNotification/:notificationId",
  limiter,
  verifyBarberToken,
  validateRequest(barberAllNotificationSchema),
  barberNotificationController.readNotification
);

barberNotificationRouter.put(
  "/onAndOffNotification",
  limiter,
  verifyBarberToken,
  barberNotificationController.onAndOffNotification
);

module.exports = barberNotificationRouter;