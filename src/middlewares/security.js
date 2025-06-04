const helmet = require("helmet");
const xssClean = require("xss-clean");
const mongoSanitize = require("express-mongo-sanitize");

module.exports = function applySecurityHeaders(app) {
  app.use(helmet());
  app.use(xssClean());
  app.use(mongoSanitize());
};
