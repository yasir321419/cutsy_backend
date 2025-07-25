const limiter = require("../../middleware/limiter");
const validateRequest = require("../../middleware/validateRequest");


const adminHandlerAccountRouter = require("express").Router();
const adminHandleAccountController = require("../../controllers/admin/adminHandleAccountController");
const { verifyAdminToken } = require("../../middleware/auth");
const { adminTransferToBarberSchema } = require("../../schema/admin/handleaccount");



adminHandlerAccountRouter.get(
  "/showAllPaymentRecieved",
  limiter,
  verifyAdminToken,
  adminHandleAccountController.showAllPaymentRecieved
);

adminHandlerAccountRouter.post(
  "/transerAmountToBarberAccount",
  limiter,
  verifyAdminToken,
  validateRequest(adminTransferToBarberSchema),
  adminHandleAccountController.transerAmountToBarberAccount
);


module.exports = adminHandlerAccountRouter;