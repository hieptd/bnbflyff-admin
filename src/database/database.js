const sql = require("mssql");
require("dotenv").config();

const config = {
  user: process.env.DB_USER, // e.g. 'sa'
  password: process.env.DB_PASSWORD, // your password
  server: process.env.DB_SERVER, // e.g. 'localhost' or IP
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    return pool;
  })
  .catch((err) => {
    console.error("Database Connection Failed: ", err);
    throw err;
  });

module.exports = {
  sql,
  poolPromise,
};
