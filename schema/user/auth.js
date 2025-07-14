const Joi = require("joi");

const userRegisterSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    email: Joi.string().required()
  }),
});

const userverifyOtpSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    email: Joi.string().email().required(),
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    password: Joi.string()
      .min(8)
      .max(30)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{8,}$'))
      .optional()
      .messages({
        'string.pattern.base': 'Password must include uppercase, lowercase, and a number.',
      }),
    confirmPassword: Joi.any()
      .valid(Joi.ref('password'))
      .optional()
      .messages({ 'any.only': 'Confirm password must match password' }),
    otp: Joi.string().required(),
    phoneNumber: Joi.string().optional(),
    gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER').optional(),
    hairTypeId: Joi.string().optional(),
    hairLengthId: Joi.string().optional(),
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional(),
    address: Joi.string().optional(),
    addressLine1: Joi.string().optional(),
    addressLine2: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    country: Joi.string().optional(),
    postalcode: Joi.string().optional(),
    deviceToken: Joi.string().optional(),
    deviceType: Joi.string().valid('ANDROID', 'IOS').optional(),
    userType: Joi.string().valid('ADMIN', 'USER', 'BARBER').optional(),
  }),
});

const userLoginSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
  }),
});

const userForgetPasswordSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    email: Joi.string().required()
  }),
});

const userResetPasswordSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    password: Joi.string().required()
  }),
});

const userEditProfileSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    phoneNumber: Joi.string().optional(),
    gender: Joi.string().optional(),
  }),
});


const userChangePasswordSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    currentpassword: Joi.string()
      .min(8)
      .max(30)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{8,}$'))
      .required()
      .messages({
        'string.pattern.base': 'Password must include uppercase, lowercase, and a number.',
      }),
    newpassword: Joi.string()
      .min(8)
      .max(30)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{8,}$'))
      .required()
      .messages({
        'string.pattern.base': 'Password must include uppercase, lowercase, and a number.',
      }),
    confirmPassword: Joi.any()
      .valid(Joi.ref('newpassword'))
      .optional()
      .messages({ 'any.only': 'Confirm password must match password' }),
  }),
});

const userSocailLoginSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    email: Joi.string().email().required(),
    accessToken: Joi.string().required(),
    socialType: Joi.string()
      .valid('GOOGLE', 'APPLE')
      .required()
      .messages({
        'any.only': 'socialType must be either GOOGLE or APPLE',
      }),
    deviceType: Joi.string()
      .valid('ANDROID', 'IOS')
      .optional()
      .messages({
        'any.only': 'deviceType must be either ANDROID or IOS',
      }),
    deviceToken: Joi.string().optional(),
  }),
});


module.exports = {
  userRegisterSchema,
  userverifyOtpSchema,
  userLoginSchema,
  userForgetPasswordSchema,
  userResetPasswordSchema,
  userEditProfileSchema,
  userChangePasswordSchema,
  userSocailLoginSchema
}