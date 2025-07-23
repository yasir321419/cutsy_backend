const limiter = require("../../middleware/limiter");
const validateRequest = require("../../middleware/validateRequest");


const userAuthRouter = require("express").Router();
const userAuthController = require("../../controllers/user/userAuthController");
const { userRegisterSchema, userverifyOtpSchema, userLoginSchema, userForgetPasswordSchema, userResetPasswordSchema, userEditProfileSchema, userChangePasswordSchema, userSocailLoginSchema, userCreateProfileSchema, userResendOtpSchema } = require("../../schema/user/auth");
const { verifyUserToken } = require("../../middleware/auth");
const handleMultiPartData = require("../../middleware/handleMultiPartData");



userAuthRouter.post(
  "/signUp",
  limiter,
  validateRequest(userRegisterSchema),
  userAuthController.signUp
);

userAuthRouter.post(
  "/verifyOtp",
  limiter,
  validateRequest(userverifyOtpSchema),
  userAuthController.verifyOtp
);

userAuthRouter.post(
  "/login",
  limiter,
  validateRequest(userLoginSchema),
  userAuthController.login
);


userAuthRouter.post(
  "/forgetPassword",
  limiter,
  validateRequest(userForgetPasswordSchema),
  userAuthController.forgetPassword
);

userAuthRouter.put(
  "/resetPassword",
  limiter,
  verifyUserToken,
  validateRequest(userResetPasswordSchema),
  userAuthController.resetPassword
);

userAuthRouter.patch(
  "/editProfile",
  limiter,
  verifyUserToken,
  validateRequest(userEditProfileSchema),
  handleMultiPartData.single("image"),
  userAuthController.editProfile
);


userAuthRouter.post(
  "/logOut",
  limiter,
  verifyUserToken,
  userAuthController.logOut
);

userAuthRouter.put(
  "/changePassword",
  limiter,
  verifyUserToken,
  validateRequest(userChangePasswordSchema),
  userAuthController.changePassword
);

userAuthRouter.delete(
  "/deleteAccount",
  limiter,
  verifyUserToken,
  userAuthController.deleteAccount
);

userAuthRouter.post(
  "/socialLogin",
  limiter,
  validateRequest(userSocailLoginSchema),
  userAuthController.socialLogin
);

userAuthRouter.post(
  "/userCreateProfile",
  limiter,
  verifyUserToken,
  validateRequest(userCreateProfileSchema),
  userAuthController.userCreateProfile
);

userAuthRouter.post(
  "/resendOtp",
  limiter,
  validateRequest(userResendOtpSchema),
  userAuthController.resendOtp
);






module.exports = userAuthRouter;