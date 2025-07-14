const limiter = require("../../middleware/limiter");
const validateRequest = require("../../middleware/validateRequest");


const adminExperienceRouter = require("express").Router();
const adminExperienceController = require("../../controllers/admin/adminBarberExperienceController");
const { verifyAdminToken, optionalAdminAuth } = require("../../middleware/auth");
const { adminCreateBarberExperienceSchema, adminUpdateBarberExperienceSchema, adminDeleteBarberExperienceSchema } = require("../../schema/admin/barberexperience");



adminExperienceRouter.post(
  "/adminCreateBarberExperience",
  limiter,
  verifyAdminToken,
  validateRequest(adminCreateBarberExperienceSchema),
  adminExperienceController.adminCreateBarberExperience
);

adminExperienceRouter.get(
  "/adminShowBarberExperience",
  limiter,
  optionalAdminAuth,
  adminExperienceController.adminShowBarberExperience
);

adminExperienceRouter.put(
  "/adminUpdateBarberExperience/:experienceId",
  limiter,
  verifyAdminToken,
  validateRequest(adminUpdateBarberExperienceSchema),
  adminExperienceController.adminUpdateBarberExperience
);

adminExperienceRouter.delete(
  "/adminDeleteBarberExperience/:experienceId",
  limiter,
  verifyAdminToken,
  validateRequest(adminDeleteBarberExperienceSchema),
  adminExperienceController.adminDeleteBarberExperience
);


module.exports = adminExperienceRouter;