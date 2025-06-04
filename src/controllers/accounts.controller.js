const { poolPromise } = require("../database/database");

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

module.exports = { getAccounts };
