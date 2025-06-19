require("dotenv").config();
const { swaggerUi, specs } = require("./swagger");
const cookieParser = require("cookie-parser");
const express = require("express");
const morgan = require("morgan");

const applySecurityHeaders = require("./middlewares/security");
const rateLimiter = require("./middlewares/rateLimiter");
const createCorsMiddleware = require("./middlewares/cors");
const enforceHttps = require("./middlewares/enforceHttps");
const ipWhitelist = require("./middlewares/ipWhitelist");

const routes = require("./routes");
const checkDisabledRoutes = require("./middlewares/checkDisabledRoutes");

const app = express();

// Basic setup
app.use(morgan("tiny"));
app.use(express.json());

// Middleware
applySecurityHeaders(app);
app.use(cookieParser());
app.use(rateLimiter);
app.use(createCorsMiddleware());
app.use(enforceHttps);
app.use(ipWhitelist);
app.use(checkDisabledRoutes);
// Documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    swaggerOptions: {
      withCredentials: true,
    },
  })
);

// Routes
app.use("/api", routes);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${NODE_ENV}]`);
  });
} else {
  module.exports = app;
}
