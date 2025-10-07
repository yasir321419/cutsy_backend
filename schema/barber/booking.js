const Joi = require("joi");

const completedBookingSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
    bookingId: Joi.string().required(),
  }),
  body: Joi.object({

  }),
});



module.exports = {
  completedBookingSchema
}