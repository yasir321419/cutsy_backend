const Joi = require("joi");

const adminCreatePrivacyPolicySchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    text: Joi.string().required(),
  }),
});

const adminUpdatePrivacyPolicySchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
    privacyId: Joi.string().required(),
  }),
  body: Joi.object({
    text: Joi.string().required(),
  }),
});




const adminCreateTermsConditionSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    text: Joi.string().required(),
  }),
});

const adminUpdateTermsConditionSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
    termsId: Joi.string().required(),
  }),
  body: Joi.object({
    text: Joi.string().required(),
  }),
});




module.exports = {
  adminCreatePrivacyPolicySchema,
  adminUpdatePrivacyPolicySchema,
  adminCreateTermsConditionSchema,
  adminUpdateTermsConditionSchema,
}