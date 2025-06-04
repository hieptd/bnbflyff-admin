const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "FlyFF Admin Server API",
      version: "1.0.0",
      description: "API documentation for my FlyFF Admin Server API",
    },
    servers: [{ url: "http://localhost:3000" }],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
        },
      },
    },
    security: [{ cookieAuth: [] }],
  },
  apis: ["./src/routes/*.js"],
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs,
};
