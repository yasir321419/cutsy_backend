const Joi = require("joi");

const adminCreateBarberServiceSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    service: Joi.string().required(),
    role: Joi.string().valid("MALE", "FEMALE", "UNISEX").required()
  }),
});

const adminShowBarberServiceSchema = Joi.object({
  query: Joi.object({
    role: Joi.string().valid("MALE", "FEMALE", "UNISEX").optional()
  }),
  params: Joi.object({

  }),
  body: Joi.object({

  }),
});

const adminUpdateBarberServiceSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
    serviceId: Joi.string().required(),
  }),
  body: Joi.object({
    service: Joi.string().required(),
  }),
});

const adminDeleteBarberServiceSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
    serviceId: Joi.string().required(),

  }),
  body: Joi.object({

  }),
});



module.exports = {
  adminCreateBarberServiceSchema,
  adminUpdateBarberServiceSchema,
  adminDeleteBarberServiceSchema,
  adminShowBarberServiceSchema

}