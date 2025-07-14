const Joi = require("joi");

const userSearchBarberSchema = Joi.object({
  query: Joi.object({
    search: Joi.string().required()
  }),
  params: Joi.object({}),
  body: Joi.object({
  }),
});

const userSaveBarberInFavoriteSchema = Joi.object({
  query: Joi.object({
  }),
  params: Joi.object({
    barberId: Joi.string().required()

  }),
  body: Joi.object({

  }),
});

module.exports = { userSearchBarberSchema, userSaveBarberInFavoriteSchema };