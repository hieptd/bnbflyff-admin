const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { poolPromise } = require("../database/database");
const sql = require("mssql");

const hashPassword = (password) => {
  const hash = crypto.createHash("md5");
  hash.update("kikugalanet" + password);
  return hash.digest("hex");
};

const login = async (req, res) => {
  const { account, password } = req.body;
  const ACCOUNT_TBL = "ACCOUNT_DBF.dbo.ACCOUNT_TBL";
  const ACCOUNT_TBL_DETAIL = "ACCOUNT_DBF.dbo.ACCOUNT_TBL_DETAIL";

  try {
    const pool = await poolPromise;
    const accountDetailResult = await pool
      .request()
      .input("account", sql.VarChar, account)
      .query(
        `SELECT * FROM ${ACCOUNT_TBL_DETAIL} WHERE account = @account AND m_chLoginAuthority = 'P'`
      );

    if (accountDetailResult.recordset.length === 0) {
      return res
        .status(400)
        .json({ message: "User not found 1", accountDetailResult });
    }

    const user = accountDetailResult.recordset[0];

    const hashedPassword = hashPassword(password);
    const accountResult = await pool
      .request()
      .input("account", sql.VarChar, user.account)
      .query(
        `SELECT * FROM ${ACCOUNT_TBL} WHERE account = @account AND password = '${hashedPassword}'`
      );

    if (accountResult.recordset.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const token = jwt.sign(
      { account: accountResult.recordset[0].account },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development", // false for local dev without HTTPS
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { login };
