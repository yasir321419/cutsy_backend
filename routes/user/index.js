const userRouter = require("express").Router();
const userAuthRouter = require("./userAuth");
const userChatRouter = require("./userChat");
const userAddressRouter = require("./userAddress");
const userHomeFeedRouter = require("./userHomeFeed");

userRouter.use("/auth", userAuthRouter);
userRouter.use("/chat", userChatRouter);
userRouter.use("/address", userAddressRouter);
userRouter.use("/homefeed", userHomeFeedRouter);




module.exports = userRouter;