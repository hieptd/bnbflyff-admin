const { match } = require("path-to-regexp");
const config = require("../configs/disabled_routes.config.json");

function checkDisabledRoutes(req, res, next) {
  const currentEnv = process.env.NODE_ENV || "development";
  const reqMethod = req.method.toUpperCase();
  const reqPath = req.path;

  if (!config.globalEnvs.includes(currentEnv)) return next();

  for (const route of config.routes) {
    const matcher = match(route.path, { decode: decodeURIComponent });

    if (matcher(reqPath) && route.methods.includes(reqMethod)) {
      return res.status(503).json({
        message: `The ${reqMethod} ${route.path} route is temporarily disabled.`,
      });
    }
  }

  next();
}

module.exports = checkDisabledRoutes;
