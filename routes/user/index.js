const userRouter = require("express").Router();
const userAuthRouter = require("./userAuth");
const userChatRouter = require("./userChat");
const userAddressRouter = require("./userAddress");
const userHomeFeedRouter = require("./userHomeFeed");
const userBookingRouter = require("./userBooking");
const userAppoinmentHistoryRouter = require("./userAppoinmentHistory");

userRouter.use("/auth", userAuthRouter);
userRouter.use("/chat", userChatRouter);
userRouter.use("/address", userAddressRouter);
userRouter.use("/homefeed", userHomeFeedRouter);
userRouter.use("/booking", userBookingRouter);
userRouter.use("/appoinmenthistory", userAppoinmentHistoryRouter);






module.exports = userRouter;