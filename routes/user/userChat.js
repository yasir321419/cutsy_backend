const limiter = require("../../middleware/limiter");
const validateRequest = require("../../middleware/validateRequest");


const userChatRouter = require("express").Router();
const userChatController = require("../../controllers/user/userChatController");
const { verifyMultiRoleToken } = require("../../middleware/auth");
const userCreateChatRoomSchema = require("../../schema/user/chat");



userChatRouter.post(
  "/createChatRoom",
  limiter,
  verifyMultiRoleToken,
  validateRequest(userCreateChatRoomSchema),
  userChatController.createChatRoom
);

userChatRouter.get(
  "/getChatRoom",
  limiter,
  verifyMultiRoleToken,
  userChatController.getChatRoom
);

module.exports = userChatRouter;