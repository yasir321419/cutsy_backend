const limiter = require("../../middleware/limiter");
const validateRequest = require("../../middleware/validateRequest");


const userNotificationRouter = require("express").Router();
const userNotificationController = require("../../controllers/user/userNotificationsController");
const { verifyUserToken } = require("../../middleware/auth");
const { userNotificationReadSchema, userAllNotificationSchema } = require("../../schema/user/notification");



userNotificationRouter.get(
  "/showAllUserNotification",
  // limiter,
  verifyUserToken,
  validateRequest(userAllNotificationSchema),
  userNotificationController.showAllUserNotification
);

userNotificationRouter.put(
  "/readUserNotification/:notificationId",
  // limiter,
  verifyUserToken,
  validateRequest(userNotificationReadSchema),
  userNotificationController.readUserNotification
);

userNotificationRouter.put(
  "/onAndOffUserNotification",
  // limiter,
  verifyUserToken,
  userNotificationController.onAndOffUserNotification
);

module.exports = userNotificationRouter;