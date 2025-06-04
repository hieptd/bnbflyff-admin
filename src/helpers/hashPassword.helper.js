const crypto = require("crypto");

const hashPassword = (password) => {
  const hash = crypto.createHash("md5");
  hash.update("kikugalanet" + password);
  return hash.digest("hex");
};

module.exports = hashPassword;
