const Joi = require("joi");

const renameGuildSchema = Joi.object({
  m_szGuild: Joi.string().max(32).required(),
});

module.exports = renameGuildSchema;
