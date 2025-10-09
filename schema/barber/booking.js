const Joi = require("joi");


const trackUserSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
    bookingId: Joi.string().required(),
  }),
  body: Joi.object({
    userLatitude: Joi.number().required(),
    userLongitude: Joi.number().required(),
    barberLatitude: Joi.number().required(),
    barberLongitude: Joi.number().required(),
    status: Joi.string().optional(),
  }),
});
const completedBookingSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
    bookingId: Joi.string().required(),
  }),
  body: Joi.object({

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
  completedBookingSchema,
  startAppoinmentSchema,
  trackUserSchema
}