const Joi = require("joi");

const renameCharacterSchema = Joi.object({
  m_szName: Joi.string().max(32).required(),
});

module.exports = renameCharacterSchema;
