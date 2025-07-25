const Joi = require("joi");

const adminTransferToBarberSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    barberAccountId: Joi.string().required(),
    amount: Joi.string().required(),
  }),
});

module.exports = {
  adminTransferToBarberSchema

}