const jwt = require("jsonwebtoken");

const allowedAccounts = (process.env.ALLOWED_ACCOUNTS || "")
  .split(",")
  .map((acc) => acc.trim().toLowerCase())
  .filter(Boolean); // Removes empty strings

const authenticate = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res
      .status(401)
      .json({ error: "Authentication token missing in cookies" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const userAccount = decoded?.account?.toLowerCase();

    if (!allowedAccounts.includes(userAccount)) {
      return res.status(403).json({ error: "Access denied for this account" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = authenticate;
