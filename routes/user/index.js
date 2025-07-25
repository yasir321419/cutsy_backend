const userRouter = require("express").Router();
const userAuthRouter = require("./userAuth");
const userChatRouter = require("./userChat");
const userAddressRouter = require("./userAddress");
const userHomeFeedRouter = require("./userHomeFeed");
const userBookingRouter = require("./userBooking");
const userAppoinmentHistoryRouter = require("./userAppoinmentHistory");
const userPaymentMethodRouter = require("./userPaymentMethod");
const userNotificationRouter = require("./userNotification");

userRouter.use("/auth", userAuthRouter);
userRouter.use("/chat", userChatRouter);
userRouter.use("/address", userAddressRouter);
userRouter.use("/homefeed", userHomeFeedRouter);
userRouter.use("/booking", userBookingRouter);
userRouter.use("/appoinmenthistory", userAppoinmentHistoryRouter);
userRouter.use("/paymentmethod", userPaymentMethodRouter);
userRouter.use("/notification", userNotificationRouter);








module.exports = userRouter;