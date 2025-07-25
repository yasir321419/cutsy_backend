const Joi = require("joi");

const barberNotificationReadSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({
    notificationId: Joi.string().required(),
  }),
  body: Joi.object({
    isRead: Joi.boolean().required(),
  }),
});

const barberAllNotificationSchema = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),
  params: Joi.object({
  }),
  body: Joi.object({
  }),
});

module.exports = {
  barberNotificationReadSchema,
  barberAllNotificationSchema
}