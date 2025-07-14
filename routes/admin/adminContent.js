const limiter = require("../../middleware/limiter");
const validateRequest = require("../../middleware/validateRequest");


const adminContentRouter = require("express").Router();
const adminContentController = require("../../controllers/admin/adminContentController");
const { verifyAdminToken, optionalAdminAuth } = require("../../middleware/auth");
const { adminCreatePrivacyPolicySchema, adminUpdatePrivacyPolicySchema, adminUpdateTermsConditionSchema, adminCreateTermsConditionSchema } = require("../../schema/admin/content");


adminContentRouter.get(
  "/showAllUsers",
  limiter,
  verifyAdminToken,
  adminContentController.showAllUsers
);

adminContentRouter.get(
  "/showAllBarbers",
  limiter,
  verifyAdminToken,
  adminContentController.showAllBarbers
);

adminContentRouter.get(
  "/countUsers",
  limiter,
  verifyAdminToken,
  adminContentController.countUsers
);

adminContentRouter.get(
  "/iosUsers",
  limiter,
  verifyAdminToken,
  adminContentController.iosUsers
);

adminContentRouter.get(
  "/androidUsers",
  limiter,
  verifyAdminToken,
  adminContentController.androidUsers
);

adminContentRouter.post(
  "/createPrivacyPolicy",
  limiter,
  verifyAdminToken,
  validateRequest(adminCreatePrivacyPolicySchema),
  adminContentController.createPrivacyPolicy
);

adminContentRouter.get(
  "/showPrivacyPolicy",
  limiter,
  optionalAdminAuth,
  adminContentController.showPrivacyPolicy
);

adminContentRouter.put(
  "/updatePrivacyPolicy/:privacyId",
  limiter,
  verifyAdminToken,
  validateRequest(adminUpdatePrivacyPolicySchema),
  adminContentController.updatePrivacyPolicy
);

adminContentRouter.post(
  "/createTermsCondition",
  limiter,
  verifyAdminToken,
  validateRequest(adminCreateTermsConditionSchema),
  adminContentController.createTermsCondition
);

adminContentRouter.get(
  "/showTermsCondtion",
  limiter,
  optionalAdminAuth,
  adminContentController.showTermsCondtion
);

adminContentRouter.put(
  "/updateTermsCondition/:termsId",
  limiter,
  verifyAdminToken,
  validateRequest(adminUpdateTermsConditionSchema),
  adminContentController.updateTermsCondition
);



module.exports = adminContentRouter;