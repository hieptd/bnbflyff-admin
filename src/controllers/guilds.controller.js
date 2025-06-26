const { poolPromise } = require("../database/database");
const sql = require("mssql");
const { guildBankResource } = require("../resource/guildbank.resource");

const getGuilds = async (req, res) => {
  const GUILD_TBL = "CHARACTER_01_DBF.dbo.GUILD_TBL";

  const sort = req.query.sort?.toString().replace(":", " ") || "m_idGuild ASC";

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const offset = (page - 1) * limit;

  try {
    const pool = await poolPromise;
    const request = pool
      .request()
      .input("offset", sql.Int, offset)
      .input("limit", sql.Int, limit);

    // Get total count
    const countResult = await request.query(`
      SELECT COUNT(*) AS total FROM ${GUILD_TBL}
    `);

    const total = countResult.recordset[0].total;
    const totalPages = Math.ceil(total / limit);

    // Get paginated result
    const dataResult = await request.query(`
      SELECT * FROM ${GUILD_TBL}
      ORDER BY ${sort}
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    let dataRecord = dataResult.recordset;

    res.json({
      success: true,
      page,
      limit,
      total,
      totalPages,
      result: dataRecord,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

const getGuildMembers = async (req, res) => {
  const m_idGuild = req.params.m_idGuild;
  const GUILD_MEMBER_TBL = "CHARACTER_01_DBF.dbo.GUILD_MEMBER_TBL";
  const CHARACTER_TBL = "CHARACTER_01_DBF.dbo.CHARACTER_TBL";

  const sort = req.query.sort?.toString().replace(":", " ") || "m_nMemberLv";

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const pool = await poolPromise;
    const request = pool.request();

    request.input("m_idGuild", sql.VarChar, m_idGuild);
    request.input("offset", sql.Int, offset);
    request.input("limit", sql.Int, limit);

    const countQuery = `
      SELECT COUNT(*) AS total 
      FROM ${GUILD_MEMBER_TBL} as G
      WHERE m_idGuild = @m_idGuild
    `;
    const countResult = await request.query(countQuery);
    const totalCount = countResult.recordset[0].total;
    const totalPages = Math.ceil(totalCount / limit);

    const query = `
      SELECT * FROM ${GUILD_MEMBER_TBL} as G
      LEFT JOIN ${CHARACTER_TBL} as C ON G.m_idPlayer = C.m_idPlayer
      WHERE m_idGuild = @m_idGuild
      ORDER BY ${sort}
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `;
    const result = await request.query(query);

    res.json({
      success: true,
      page,
      limit,
      total: totalCount,
      totalPages,
      result: result.recordset,
    });
  } catch (err) {
    console.error("Error fetching GameMaster logs:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getGuildBank = async (req, res) => {
  const m_idGuild = req.params.m_idGuild;
  const GUILD_BANK_TBL = "CHARACTER_01_DBF.dbo.GUILD_BANK_TBL";
  const GUILD_BANK_EXT_TBL = "CHARACTER_01_DBF.dbo.GUILD_BANK_EXT_TBL";

  try {
    const pool = await poolPromise;
    const request = pool.request();

    request.input("m_idGuild", sql.VarChar, m_idGuild);

    const query = `
      SELECT GB.m_GuildBank as data, GB.m_apIndex as dataIndex, GBX.m_extGuildBank as extData FROM ${GUILD_BANK_TBL} as GB
      LEFT JOIN ${GUILD_BANK_EXT_TBL} as GBX ON GB.m_idGuild = GBX.m_idGuild
      WHERE GB.m_idGuild = @m_idGuild
    `;
    const result = await request.query(query);
    console.log(m_idGuild, result);
    res.json({
      success: true,
      result: await guildBankResource(result.recordset[0]),
    });
  } catch (err) {
    console.error("Error fetching GameMaster logs:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const renameGuild = async (req, res) => {
  const { m_szGuild } = req.body;
  const m_idGuild = parseInt(req.params.m_idGuild, 10);
  const GUILD_TBL = "CHARACTER_01_DBF.dbo.GUILD_TBL";
  const uspChangeGuildNameLog = "LOGGING_01_DBF.dbo.uspChangeGuildNameLog";

  if (!m_szGuild) {
    return res.status(400).json({ message: "New guild name is required." });
  }

  try {
    const pool = await poolPromise;

    const oldResult = await pool
      .request()
      .input("m_idGuild", sql.Int, m_idGuild)
      .query(`SELECT m_szGuild FROM ${GUILD_TBL} WHERE m_idGuild = @m_idGuild`);

    if (oldResult.recordset.length === 0) {
      return res.status(404).json({ message: "Guild not found." });
    }

    const oldName = oldResult.recordset[0].m_szGuild;

    if (oldName === m_szGuild) {
      return res
        .status(400)
        .json({ message: "New name is the same as current name." });
    }

    const duplicateCheck = await pool
      .request()
      .input("m_szGuild", sql.VarChar, m_szGuild)
      .query(
        `SELECT COUNT(*) AS count FROM ${GUILD_TBL} WHERE m_szGuild = @m_szGuild`
      );

    if (duplicateCheck.recordset[0].count > 0) {
      return res.status(409).json({ message: "Guild name is already taken." });
    }

    await pool
      .request()
      .input("m_idGuild", sql.Int, m_idGuild)
      .input("m_szGuild", sql.VarChar, m_szGuild)
      .query(
        `UPDATE ${GUILD_TBL} SET m_szGuild = @m_szGuild WHERE m_idGuild = @m_idGuild`
      );

    // Check if uspChangeGuildNameLog SP exists
    const checkProc = await pool
      .request()
      .input("procName", sql.VarChar, "uspChangeGuildNameLog")
      .query(`SELECT OBJECT_ID('LOGGING_01_DBF.dbo.' + @procName) AS ProcId`);

    const procExists = checkProc.recordset[0].ProcId !== null;

    if (procExists) {
      await pool
        .request()
        .input("pserverindex", sql.Char(2), "01")
        .input("pidGuild", sql.Int, m_idGuild)
        .input("pOldName", sql.VarChar(32), oldName)
        .input("pNewName", sql.VarChar(32), m_szGuild)
        .execute(uspChangeGuildNameLog);
    }

    res.json({
      success: true,
      message: "Guild renamed successfully.",
      oldName,
      newName: m_szGuild,
      logging: procExists,
    });
  } catch (err) {
    console.error("renameGuild error:", err);
    res
      .status(500)
      .json({ message: "Failed to rename guild.", error: err.message });
  }
};

const getGuildRenameLogs = async (req, res) => {
  const LOGGING_TBL = "LOGGING_01_DBF.dbo.tblChangeGuildNameHistoryLog";
  const { m_idGuild } = req.params;
  const sort = req.query.sort?.toString().replace(":", " ") || "ChangeDt desc";
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const pool = await poolPromise;

    // Check if table exists
    const checkTable = await pool
      .request()
      .query(`SELECT OBJECT_ID('${LOGGING_TBL}', 'U') AS TableId`);

    const tableExists = checkTable.recordset[0].TableId !== null;

    if (!tableExists) {
      return res.json({
        success: true,
        page,
        limit,
        total: 0,
        totalPages: 0,
        result: [],
        logging: false,
      });
    }

    const countResult = await pool
      .request()
      .input("m_idGuild", sql.Int, m_idGuild)
      .query(
        `SELECT COUNT(*) AS total FROM ${LOGGING_TBL} WHERE idGuild = @m_idGuild`
      );

    const totalCount = countResult.recordset[0].total;
    const totalPages = Math.ceil(totalCount / limit);

    const logsResult = await pool
      .request()
      .input("m_idGuild", sql.Int, m_idGuild)
      .input("offset", sql.Int, offset)
      .input("limit", sql.Int, limit).query(`
        SELECT * FROM ${LOGGING_TBL}
        WHERE idGuild = @m_idGuild
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
      logging: true,
    });
  } catch (err) {
    console.error("getGuildRenameLogs error:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getGuilds,
  getGuildMembers,
  getGuildBank,
  renameGuild,
  getGuildRenameLogs,
};
