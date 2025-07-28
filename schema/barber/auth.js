const Joi = require("joi");

const barberRegisterSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    email: Joi.string().required()
  }),
});

const barberverifyOtpSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().optional(),
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
    experienceId: Joi.string().optional(),
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

const barberLoginSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
  }),
});

const barberForgetPasswordSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    email: Joi.string().required()
  }),
});

const barberResetPasswordSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    password: Joi.string().required()
  }),
});

const barberEditProfileSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    name: Joi.string().optional(),
    address: Joi.string().optional(),
    experience: Joi.string().optional(),
    gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER').optional(),
  }),
});


const barberChangePasswordSchema = Joi.object({
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

const barberSocailLoginSchema = Joi.object({
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

const barberCreateProfileSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    name: Joi.string().required(),
    phoneNumber: Joi.string().required(),
    gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER').required(),
    experienceId: Joi.string().required(),
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

const barberResendOtpSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    email: Joi.string().email().required(),
  }),
});


module.exports = {
  barberRegisterSchema,
  barberverifyOtpSchema,
  barberLoginSchema,
  barberForgetPasswordSchema,
  barberResetPasswordSchema,
  barberEditProfileSchema,
  barberChangePasswordSchema,
  barberSocailLoginSchema,
  barberCreateProfileSchema,
  barberResendOtpSchema
}