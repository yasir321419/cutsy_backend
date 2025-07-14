const limiter = require("../../middleware/limiter");
const validateRequest = require("../../middleware/validateRequest");


const barberAuthRouter = require("express").Router();
const barberAuthController = require("../../controllers/barber/barberAuthController");
const { verifyBarberToken } = require("../../middleware/auth");
const handleMultiPartData = require("../../middleware/handleMultiPartData");
const { barberRegisterSchema, barberverifyOtpSchema, barberLoginSchema, barberForgetPasswordSchema, barberResetPasswordSchema, barberEditProfileSchema, barberChangePasswordSchema, barberSocailLoginSchema } = require("../../schema/barber/auth");



barberAuthRouter.post(
  "/singUp",
  limiter,
  validateRequest(barberRegisterSchema),
  barberAuthController.singUp
);

barberAuthRouter.post(
  "/verifyOtp",
  limiter,
  validateRequest(barberverifyOtpSchema),
  barberAuthController.verifyOtp
);

barberAuthRouter.post(
  "/login",
  limiter,
  validateRequest(barberLoginSchema),
  barberAuthController.login
);


barberAuthRouter.post(
  "/forgetPassword",
  limiter,
  validateRequest(barberForgetPasswordSchema),
  barberAuthController.forgetPassword
);

barberAuthRouter.put(
  "/resetPassword",
  limiter,
  verifyBarberToken,
  validateRequest(barberResetPasswordSchema),
  barberAuthController.resetPassword
);

barberAuthRouter.patch(
  "/editProfile",
  limiter,
  verifyBarberToken,
  validateRequest(barberEditProfileSchema),
  handleMultiPartData.single("image"),
  barberAuthController.editProfile
);


barberAuthRouter.post(
  "/logOut",
  limiter,
  verifyBarberToken,
  barberAuthController.logOut
);

barberAuthRouter.put(
  "/changePassword",
  limiter,
  verifyBarberToken,
  validateRequest(barberChangePasswordSchema),
  barberAuthController.changePassword
);

barberAuthRouter.delete(
  "/deleteAccount",
  limiter,
  verifyBarberToken,
  barberAuthController.deleteAccount
);

barberAuthRouter.post(
  "/socialLogin",
  limiter,
  validateRequest(barberSocailLoginSchema),
  barberAuthController.socailLogin
);





module.exports = barberAuthRouter;