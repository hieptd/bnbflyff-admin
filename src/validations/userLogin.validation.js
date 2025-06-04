const Joi = require("joi");

const userLoginSchema = Joi.object({
  account: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")).required(),
});

module.exports = userLoginSchema;
