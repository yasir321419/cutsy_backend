const Joi = require("joi");

const userRegisterSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    email: Joi.string().required()
  }),
});

const userResendOtpSchema = Joi.object({
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
    otp: Joi.string().required()
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


const userCreateProfileSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    phoneNumber: Joi.string().required(),
    gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER').required(),
    hairTypeId: Joi.string().required(),
    hairLengthId: Joi.string().required(),
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    address: Joi.string().required(),
    addressLine1: Joi.string().required(),
    addressLine2: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    country: Joi.string().required(),
    postalcode: Joi.string().required(),
    deviceToken: Joi.string().required(),
    deviceType: Joi.string().valid('ANDROID', 'IOS').required(),
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
  userSocailLoginSchema,
  userCreateProfileSchema,
  userResendOtpSchema
}