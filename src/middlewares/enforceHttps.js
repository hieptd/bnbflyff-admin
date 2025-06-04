module.exports = function enforceHttps(req, res, next) {
  const isLocal =
    req.hostname === "localhost" || req.ip === "127.0.0.1" || req.ip === "::1";

  if (
    process.env.NODE_ENV === "production" &&
    !isLocal &&
    req.headers["x-forwarded-proto"] !== "https"
  ) {
    return res.status(403).send("HTTPS required.");
  }
  next();
};
