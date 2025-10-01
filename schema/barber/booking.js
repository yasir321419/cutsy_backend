const Joi = require("joi");

const trackUserSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
    bookingId: Joi.string().required(),
  }),
  body: Joi.object({

    status: Joi.string().valid('ARRIVED', 'COMPLETED').optional(),
    userLatitude: Joi.number().min(-90).max(90).optional(),
    userLongitude: Joi.number().min(-180).max(180).optional(),
    barberLatitude: Joi.number().min(-90).max(90).optional(),
    barberLongitude: Joi.number().min(-180).max(180).optional(),

  }),
});

const startAppoinmentSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
    bookingId: Joi.string().required(),
  }),
  body: Joi.object({

  }),
});

module.exports = {
  trackUserSchema,
  startAppoinmentSchema
}