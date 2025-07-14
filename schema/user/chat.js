const Joi = require("joi");

const userCreateChatRoomSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({
    otherUserId: Joi.string().required()
  }),
});

module.exports=userCreateChatRoomSchema;