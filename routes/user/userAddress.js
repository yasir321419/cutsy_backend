const limiter = require("../../middleware/limiter");
const validateRequest = require("../../middleware/validateRequest");


const userAddressRouter = require("express").Router();
const userAddressController = require("../../controllers/user/userSaveAddressController");
const { verifyUserToken } = require("../../middleware/auth");
const { userCreateAddressSchema, userDeleteAddressSchema } = require("../../schema/user/address");



userAddressRouter.post(
  "/saveUserAddress",
  // limiter,
  verifyUserToken,
  validateRequest(userCreateAddressSchema),
  userAddressController.saveUserAddress
);

userAddressRouter.get(
  "/showUserSaveAddress",
  // limiter,
  verifyUserToken,
  userAddressController.showUserSaveAddress
);

userAddressRouter.delete(
  "/deleteUserAddress/:addressId",
  // limiter,
  verifyUserToken,
  validateRequest(userDeleteAddressSchema),
  userAddressController.deleteUserAddress
);



module.exports = userAddressRouter;