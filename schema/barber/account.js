const Joi = require("joi");

const addBarberbusinessAccountSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
  }),
  body: Joi.object({
    accountNumber: Joi.string().required(),
    routingNumber: Joi.string().required(),
  }),
});

const verifyBarberbusinessAccountSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
    accountId: Joi.string().required()
  }),
  body: Joi.object({

  }),
});


module.exports = {
  addBarberbusinessAccountSchema,
  verifyBarberbusinessAccountSchema
}