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

const withDrawAmountBarberSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
  }),
  body: Joi.object({
    amount: Joi.number().required(),
    destination: Joi.string().required(),

  }),
})


module.exports = {
  addBarberbusinessAccountSchema,
  verifyBarberbusinessAccountSchema,
  withDrawAmountBarberSchema
}