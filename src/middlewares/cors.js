const cors = require("cors");

module.exports = function createCorsMiddleware() {
  const allowedOrigins = process.env.ALLOWED_ORIGINS.split(",").map((o) =>
    o.trim()
  );

  return cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Cookie",
    ],
    exposedHeaders: ["Set-Cookie"],
  });
};
