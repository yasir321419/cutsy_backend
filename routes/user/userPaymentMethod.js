const limiter = require("../../middleware/limiter");
const validateRequest = require("../../middleware/validateRequest");


const userPaymentMethodRouter = require("express").Router();
const userPaymentMethodController = require("../../controllers/user/userPaymentMethodController");
const { verifyUserToken } = require("../../middleware/auth");
const { userAddPaymentMethodSchema } = require("../../schema/user/payment");



userPaymentMethodRouter.post(
  "/addPaymentMethod",
  limiter,
  verifyUserToken,
  validateRequest(userAddPaymentMethodSchema),
  userPaymentMethodController.addPaymentMethod
);

userPaymentMethodRouter.get(
  "/showPaymentMethods",
  limiter,
  verifyUserToken,
  userPaymentMethodController.showPaymentMethods
);



module.exports = userPaymentMethodRouter;