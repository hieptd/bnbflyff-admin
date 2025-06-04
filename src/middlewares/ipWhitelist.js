module.exports = function ipWhitelist(req, res, next) {
  const whitelist = process.env.WHITELISTED_IPS.split(",").map((ip) =>
    ip.trim()
  );
  const clientIp = req.ip.replace("::ffff:", "");
  const isLocal = clientIp === "127.0.0.1" || clientIp === "::1";

  if (!isLocal && !whitelist.includes(clientIp)) {
    return res
      .status(403)
      .json({ message: "Access denied from this IP address." });
  }
  next();
};
