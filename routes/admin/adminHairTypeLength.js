const limiter = require("../../middleware/limiter");
const validateRequest = require("../../middleware/validateRequest");


const adminHairRouter = require("express").Router();
const adminHairController = require("../../controllers/admin/adminHairTypeLengthController");
const { adminCreateHairLengthSchema, adminUpdateHairLengthSchema, adminDeleteHairLengthSchema, adminCreateHairTypeSchema, adminUpdateHairTypeSchema, adminDeleteHairTypeSchema } = require("../../schema/admin/hairstyleandlength");
const { verifyAdminToken, optionalAdminAuth } = require("../../middleware/auth");


adminHairRouter.post(
  "/adminCreateHairType",
  limiter,
  verifyAdminToken,
  validateRequest(adminCreateHairTypeSchema),
  adminHairController.adminCreateHairType
);

adminHairRouter.get(
  "/adminShowHairType",
  limiter,
  optionalAdminAuth,
  adminHairController.adminShowHairType
);


adminHairRouter.put(
  "/adminUpdateHairType/:hairTypeId",
  limiter,
  verifyAdminToken,
  validateRequest(adminUpdateHairTypeSchema),
  adminHairController.adminUpdateHairType
);


adminHairRouter.delete(
  "/adminDeleteHairType/:hairTypeId",
  limiter,
  verifyAdminToken,
  validateRequest(adminDeleteHairTypeSchema),
  adminHairController.adminDeleteHairType
);


adminHairRouter.post(
  "/adminCreateHairLength",
  limiter,
  verifyAdminToken,
  validateRequest(adminCreateHairLengthSchema),
  adminHairController.adminCreateHairLength
);

adminHairRouter.get(
  "/adminShowHairLength",
  limiter,
  optionalAdminAuth,
  adminHairController.adminShowHairLength
);


adminHairRouter.put(
  "/adminUpdateHairLength/:hairLengthId",
  limiter,
  verifyAdminToken,
  validateRequest(adminUpdateHairLengthSchema),
  adminHairController.adminUpdateHairLength
);


adminHairRouter.delete(
  "/adminDeleteHairLength/:hairLengthId",
  limiter,
  verifyAdminToken,
  validateRequest(adminDeleteHairLengthSchema),
  adminHairController.adminDeleteHairLength
);

module.exports = adminHairRouter;