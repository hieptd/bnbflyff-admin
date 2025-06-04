const { poolPromise } = require("../database/database");
const sql = require("mssql");
const hashPassword = require("../helpers/hashPassword.helper");

const getAccounts = async (req, res) => {
  const ACCOUNT_TBL_DETAIL = "ACCOUNT_DBF.dbo.ACCOUNT_TBL_DETAIL";

  try {
    const pool = await poolPromise;
    const accountsResult = await pool
      .request()
      .query(`SELECT * FROM ${ACCOUNT_TBL_DETAIL}`);

    const accounts = accountsResult.recordset.reduce((newAccounts, account) => {
      if (newAccounts[account.m_chLoginAuthority]) {
        return {
          ...newAccounts,
          [account.m_chLoginAuthority]: [
            ...newAccounts[account.m_chLoginAuthority],
            account,
          ],
        };
      } else {
        return {
          ...newAccounts,
          [account.m_chLoginAuthority]: [account],
        };
      }
    }, {});

    res.json({ success: true, result: accounts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAccount = async (req, res) => {
  const account = req.params.account;
  const ACCOUNT_TBL = "ACCOUNT_DBF.dbo.ACCOUNT_TBL";
  const ACCOUNT_TBL_DETAIL = "ACCOUNT_DBF.dbo.ACCOUNT_TBL_DETAIL";

  try {
    const pool = await poolPromise;
    const accountResult = await pool
      .request()
      .input("account", sql.VarChar, account)
      .query(
        `SELECT A.*, B.m_chLoginAuthority, B.email
        FROM ${ACCOUNT_TBL} as A 
        LEFT JOIN ${ACCOUNT_TBL_DETAIL} as B ON A.account = B.account
        WHERE A.account = @account`
      );

    if (accountResult.recordset.length === 0) {
      return res.status(400).json({ message: "User not found", account });
    }

    res.json({ success: true, result: accountResult.recordset[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createAccount = async (req, res) => {
  const { account, password, cash = 0, email = "" } = req.body;
  const CREATE_NEW_ACCOUNT = "ACCOUNT_DBF.dbo.usp_CreateNewAccount";
  const CREATE_SHOP_ACCOUNT = "SHOP_DBF.dbo.usp_CreateShopAccount";

  try {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
      const request = new sql.Request(transaction);

      const accountResult = await request
        .input("account", sql.VarChar, account)
        .input("pw", sql.VarChar, hashPassword(password))
        .input("cash", sql.Int, cash)
        .input("email", sql.VarChar, email)
        .query(`EXEC ${CREATE_NEW_ACCOUNT} @account, @pw, @cash, @email`);

      if (accountResult.recordset.length === 0) {
        await transaction.rollback();
        return res.status(400).json({ message: "User not found", account });
      }

      await new sql.Request(transaction)
        .input("account", sql.VarChar, account)
        .query(`EXEC ${CREATE_SHOP_ACCOUNT} @account`);

      await transaction.commit();

      return res
        .status(201)
        .json({ success: true, message: "Account created successfully." });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAccounts, getAccount, createAccount };
