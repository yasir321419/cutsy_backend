const Joi = require("joi");

const adminCreateBarberExperienceSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
  }),
});

const adminUpdateBarberExperienceSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
    experienceId: Joi.string().required(),
  }),
  body: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
  }),
});

const adminDeleteBarberExperienceSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
    experienceId: Joi.string().required(),

  }),
  body: Joi.object({

  }),
});



module.exports = {
  adminCreateBarberExperienceSchema,
  adminUpdateBarberExperienceSchema,
  adminDeleteBarberExperienceSchema

}