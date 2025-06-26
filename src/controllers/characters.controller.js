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

const renameCharacter = async (req, res) => {
  const { m_szName } = req.body;
  const m_idPlayer = req.params.m_idPlayer;
  const CHARACTER_TBL = "CHARACTER_01_DBF.dbo.CHARACTER_TBL";
  const uspChangeNameLog = "LOGGING_01_DBF.dbo.uspChangeNameLog";

  if (!m_szName) {
    return res.status(400).json({ message: "New name is required." });
  }

  try {
    const pool = await poolPromise;

    const getOldRequest = pool
      .request()
      .input("m_idPlayer", sql.VarChar, m_idPlayer);
    const oldResult = await getOldRequest.query(`
      SELECT m_szName FROM ${CHARACTER_TBL} WHERE m_idPlayer = @m_idPlayer
    `);

    if (oldResult.recordset.length === 0) {
      return res.status(404).json({ message: "Character not found." });
    }

    const oldName = oldResult.recordset[0].m_szName;

    if (oldName === m_szName) {
      return res
        .status(400)
        .json({ message: "New name is the same as current name." });
    }

    const duplicateCheck = await pool
      .request()
      .input("m_szName", sql.VarChar, m_szName)
      .query(
        `SELECT COUNT(*) AS count FROM ${CHARACTER_TBL} WHERE m_szName = @m_szName`
      );

    if (duplicateCheck.recordset[0].count > 0) {
      return res
        .status(409)
        .json({ message: "Character name is already taken." });
    }

    const updateRequest = pool
      .request()
      .input("m_idPlayer", sql.VarChar, m_idPlayer)
      .input("m_szName", sql.VarChar, m_szName);

    await updateRequest.query(`
      UPDATE ${CHARACTER_TBL}
      SET m_szName = @m_szName
      WHERE m_idPlayer = @m_idPlayer
    `);

    const logRequest = pool
      .request()
      .input("pserverindex", sql.Char(2), "01")
      .input("pidPlayer", sql.Char(7), m_idPlayer)
      .input("pOldName", sql.VarChar(32), oldName)
      .input("pNewName", sql.VarChar(32), m_szName);

    await logRequest.execute(uspChangeNameLog);

    res.json({
      success: true,
      message: "Character renamed successfully.",
      oldName,
      newName: m_szName,
    });
  } catch (err) {
    console.error("Rename Error:", err);
    res
      .status(500)
      .json({ message: "Failed to rename character.", error: err.message });
  }
};

const getChangeNameLogs = async (req, res) => {
  const LOGGING_TBL = "LOGGING_01_DBF.dbo.tblChangeNameHistoryLog";

  const { idPlayer } = req.params;
  const sort = req.query.sort?.toString().replace(":", " ") || "ChangeDt desc";
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const pool = await poolPromise;

    const countRequest = pool
      .request()
      .input("idPlayer", sql.Char(7), idPlayer);
    const countResult = await countRequest.query(`
      SELECT COUNT(*) AS total FROM ${LOGGING_TBL} WHERE idPlayer = @idPlayer
    `);
    const totalCount = countResult.recordset[0].total;
    const totalPages = Math.ceil(totalCount / limit);

    const request = pool
      .request()
      .input("idPlayer", sql.Char(7), idPlayer)
      .input("offset", sql.Int, offset)
      .input("limit", sql.Int, limit);

    const logsResult = await request.query(`
      SELECT * FROM ${LOGGING_TBL}
      WHERE idPlayer = @idPlayer
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
      result: logsResult.recordset,
    });
  } catch (err) {
    console.error("getChangeNameLogs error:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getCharacters,
  getCharacter,
  renameCharacter,
  getChangeNameLogs,
};
