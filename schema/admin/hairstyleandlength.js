const Joi = require("joi");

const adminCreateHairTypeSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    name: Joi.string().required()
  }),
});

const adminUpdateHairTypeSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
    hairTypeId: Joi.string().required(),
  }),
  body: Joi.object({
    name: Joi.string().required()

  }),
});

const adminDeleteHairTypeSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
    hairTypeId: Joi.string().required(),

  }),
  body: Joi.object({

  }),
});

const adminCreateHairLengthSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    name: Joi.string().required()

  }),
});

const adminUpdateHairLengthSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
    hairLengthId: Joi.string().required(),

  }),
  body: Joi.object({
    name: Joi.string().required()

  }),
});

const adminDeleteHairLengthSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
    hairLengthId: Joi.string().required(),

  }),
  body: Joi.object({

  }),
});

module.exports = {
  adminCreateHairTypeSchema,
  adminUpdateHairTypeSchema,
  adminDeleteHairTypeSchema,
  adminCreateHairLengthSchema,
  adminUpdateHairLengthSchema,
  adminDeleteHairLengthSchema,

}