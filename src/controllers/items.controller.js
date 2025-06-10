const { poolPromise } = require("../database/database");
const sql = require("mssql");

const getItems = async (req, res) => {
  const SHOP_TBL = "SHOP_DBF.dbo.SHOP_TBL";
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const pool = await poolPromise;

    const countResult = await pool.request().query(`
      SELECT COUNT(*) AS total FROM ${SHOP_TBL}
    `);
    const totalCount = countResult.recordset[0].total;
    const totalPages = Math.ceil(totalCount / limit);

    const itemsResult = await pool
      .request()
      .input("offset", sql.Int, offset)
      .input("limit", sql.Int, limit).query(`
        SELECT * FROM ${SHOP_TBL}
        ORDER BY id
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY;
      `);

    res.json({
      success: true,
      page,
      limit,
      total: totalCount,
      totalPages,
      result: itemsResult.recordset,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getCurrency = async (req, res) => {
  const currencyId = req.params.currencyId;
  const SHOP_TBL = "SHOP_DBF.dbo.SHOP_TBL";

  try {
    const pool = await poolPromise;

    const currencyResult = await pool
      .request()
      .input("currencyId", sql.Int, currencyId).query(`
        SELECT * FROM ${SHOP_TBL} WHERE id = @currencyId`);

    res.json({
      success: true,
      result: currencyResult.recordset[0],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createCurrency = async (req, res) => {
  const { name, display_name } = req.body;
  const CREATE_NEW_CURRENCY = "SHOP_DBF.dbo.sp_CreateCurrencyAndWallets";

  try {
    const pool = await poolPromise;

    try {
      await pool
        .request()
        .input("name", sql.VarChar, name)
        .input("display_name", sql.VarChar, display_name)
        .query(`EXEC ${CREATE_NEW_CURRENCY} @name, @display_name`);

      return res
        .status(201)
        .json({ success: true, message: "Currency created successfully." });
    } catch (err) {
      throw err;
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getItems, getCurrency, createCurrency };
