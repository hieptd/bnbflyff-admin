const { poolPromise } = require("../database/database");
const sql = require("mssql");

const getCharacters = async (req, res) => {
  const account = req.params.account;
  const CHARACTER_TBL = "CHARACTER_01_DBF.dbo.CHARACTER_TBL";
  const searchKey = req.query.search;
  const sort = req.query.sort?.toString().replace(":", " ") || "m_idPlayer asc";
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const pool = await poolPromise;

    let countWhereClause = "";

    const countRequest = pool.request();
    if (account) {
      countWhereClause = "WHERE account = @account";
      countRequest.input("account", sql.VarChar, account);
    }

    if (searchKey) {
      countWhereClause = "WHERE m_szName LIKE @m_szName";
      countRequest.input("m_szName", sql.VarChar, `%${searchKey}%`);
    }

    const countResult = await countRequest.query(`
      SELECT COUNT(*) AS total FROM ${CHARACTER_TBL} ${countWhereClause}
    `);
    const totalCount = countResult.recordset[0].total;
    const totalPages = Math.ceil(totalCount / limit);

    const request = pool
      .request()
      .input("offset", sql.Int, offset)
      .input("limit", sql.Int, limit);

    let whereClause = "";

    if (account) {
      whereClause = "WHERE account = @account";
      request.input("account", sql.VarChar, account);
    }

    if (searchKey) {
      whereClause = "WHERE m_szName LIKE @m_szName";
      request.input("m_szName", sql.VarChar, `%${searchKey}%`);
    }

    const charactersResult = await request.query(`
        SELECT * FROM ${CHARACTER_TBL}
        ${whereClause}
        ORDER BY ${sort}
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY;
      `);

    res.json({
      success: true,
      page,
      limit,
      total: totalCount,
      totalPages,
      result: charactersResult.recordset,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getCharacter = async (req, res) => {
  const m_idPlayer = req.params.m_idPlayer;
  const CHARACTER_TBL = "CHARACTER_01_DBF.dbo.CHARACTER_TBL";

  try {
    const pool = await poolPromise;

    let whereClause = "";
    const request = pool.request();

    whereClause += "WHERE m_idPlayer = @m_idPlayer";
    request.input("m_idPlayer", sql.VarChar, m_idPlayer);

    const characterResult = await request.query(`
        SELECT * FROM ${CHARACTER_TBL}
        ${whereClause}`);

    res.json({
      success: true,
      result: characterResult.recordset[0],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getCharacters, getCharacter };
