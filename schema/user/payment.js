const Joi = require("joi");

const userAddPaymentMethodSchema = Joi.object({
  query: Joi.object({
  }),
  params: Joi.object({}),
  body: Joi.object({
    paymentMethodId: Joi.string().required()
  }),
});


module.exports = {
  userAddPaymentMethodSchema
}