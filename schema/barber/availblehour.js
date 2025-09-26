const Joi = require("joi");

const addBarberAvailableHourSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
  }),
  body: Joi.object({
    day: Joi.string().valid("SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT").required(),
    starttime: Joi.string().required(),
    endtime: Joi.string().required()
  }),
});

const editBarberAvailableHourSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
    availableHoursId: Joi.string().required()
  }),
  body: Joi.object({
    day: Joi.string().valid("SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT").required(),
    starttime: Joi.string().required(),
    endtime: Joi.string().required()
  }),
});

const deleteBarberAvailableHourSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
    availableHoursId: Joi.string().required()

  }),
  body: Joi.object({
  }),
});

module.exports = {
  addBarberAvailableHourSchema,
  editBarberAvailableHourSchema,
  deleteBarberAvailableHourSchema
}