const Joi = require("joi");

const addBarberServiceSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
    serviceId: Joi.string().required(),
  }),
  body: Joi.object({
    price: Joi.string().required()
  }),
});



module.exports = {
  addBarberServiceSchema,
}