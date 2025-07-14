const limiter = require("../../middleware/limiter");
const validateRequest = require("../../middleware/validateRequest");


const adminBarberServiceRouter = require("express").Router();
const adminBarberServiceController = require("../../controllers/admin/adminBarberServiceController");
const { verifyAdminToken, optionalAdminAuth } = require("../../middleware/auth");
const { adminCreateBarberServiceSchema, adminUpdateBarberServiceSchema, adminDeleteBarberServiceSchema, adminShowBarberServiceSchema } = require("../../schema/admin/barberservice");



adminBarberServiceRouter.post(
  "/adminCreateBarberService",
  limiter,
  verifyAdminToken,
  validateRequest(adminCreateBarberServiceSchema),
  adminBarberServiceController.adminCreateBarberService
);

adminBarberServiceRouter.get(
  "/adminShowBarberService",
  limiter,
  optionalAdminAuth,
  validateRequest(adminShowBarberServiceSchema),
  adminBarberServiceController.adminShowBarberService
);

adminBarberServiceRouter.put(
  "/adminUpdateBarberService/:serviceId",
  limiter,
  verifyAdminToken,
  validateRequest(adminUpdateBarberServiceSchema),
  adminBarberServiceController.adminUpdateBarberService
);

adminBarberServiceRouter.delete(
  "/adminDeleteBarberService/:serviceId",
  limiter,
  verifyAdminToken,
  validateRequest(adminDeleteBarberServiceSchema),
  adminBarberServiceController.adminDeleteBarberService
);


module.exports = adminBarberServiceRouter;