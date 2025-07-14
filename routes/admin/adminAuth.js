const limiter = require("../../middleware/limiter");
const validateRequest = require("../../middleware/validateRequest");


const adminAuthRouter = require("express").Router();
const adminAuthController = require("../../controllers/admin/adminAuthController");
const { adminLoginSchema } = require("../../schema/admin/auth");



adminAuthRouter.post(
  "/adminLogin",
  limiter,
  validateRequest(adminLoginSchema),
  adminAuthController.adminLogin
);


module.exports = adminAuthRouter;