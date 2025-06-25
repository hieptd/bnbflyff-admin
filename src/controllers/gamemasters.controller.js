const { poolPromise } = require("../database/database");
const sql = require("mssql");

const GAME_MASTER = process.env.GAME_MASTER || "Z";

const GM_COMMANDS = [
  { name: "ResistItem", prefix: "/ritem" },
  { name: "getgold", prefix: "/gg" },
  { name: "createitem", prefix: "/ci" },
  { name: "createitem2", prefix: "/ci2" },
  { name: "createnpc", prefix: "/cn" },
  { name: "SetRandomOption", prefix: "/sro" },
];

const getGameMasters = async (req, res) => {
  const CHARACTER_TBL = "CHARACTER_01_DBF.dbo.CHARACTER_TBL";
  const LOG_GAMEMASTER_TBL = "LOGGING_01_DBF.dbo.LOG_GAMEMASTER_TBL";

  const sort = req.query.sort?.toString().replace(":", " ") || "m_idPlayer ASC";

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const offset = (page - 1) * limit;

  try {
    const pool = await poolPromise;
    const request = pool
      .request()
      .input("authCodes", sql.VarChar, GAME_MASTER)
      .input("offset", sql.Int, offset)
      .input("limit", sql.Int, limit);

    // Get total count
    const countResult = await request.query(`
      SELECT COUNT(*) AS total FROM ${CHARACTER_TBL}
      WHERE m_chAuthority IN (SELECT value FROM STRING_SPLIT(@authCodes, ','))
    `);

    const total = countResult.recordset[0].total;
    const totalPages = Math.ceil(total / limit);

    // Get paginated result
    const dataResult = await request.query(`
      SELECT C.m_idPlayer, C.m_szName as CharacterName, C.CreateTime, C.account, C.m_chAuthority FROM ${CHARACTER_TBL} as C
      WHERE m_chAuthority IN (SELECT value FROM STRING_SPLIT(@authCodes, ','))
      ORDER BY ${sort}
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    let dataRecord = dataResult.recordset;

    if (dataRecord.length >= 1) {
      dataRecord = await Promise.all(
        dataRecord.map(async (record) => {
          const logResults = {};

          for (const cmd of GM_COMMANDS) {
            const result = await pool
              .request()
              .input("cmdPrefix", sql.VarChar, `${cmd.prefix}%`)
              .input("cmdName", sql.VarChar, `/${cmd.name}%`)
              .input("m_idPlayer", sql.Int, record.m_idPlayer).query(`
            SELECT TOP 1 m_szWords, s_date FROM ${LOG_GAMEMASTER_TBL}
            WHERE m_idPlayer = @m_idPlayer AND (m_szWords LIKE @cmdPrefix OR m_szWords LIKE @cmdName)
            ORDER BY s_date DESC
          `);
            logResults[cmd.name] = result.recordset[0] || null;
          }

          return {
            ...record,
            logs: logResults,
          };
        })
      );

      dataRecord = await Promise.all(
        dataRecord.map(async (record) => {
          const logResults = {};

          for (const cmd of GM_COMMANDS) {
            const result = await pool
              .request()
              .input("cmdPrefix", sql.VarChar, `${cmd.prefix}%`)
              .input("cmdName", sql.VarChar, `/${cmd.name}%`)
              .input("m_idPlayer", sql.Int, record.m_idPlayer).query(`
            SELECT TOP 1 m_szWords, s_date FROM ${LOG_GAMEMASTER_TBL}
            WHERE m_idPlayer = @m_idPlayer AND (m_szWords LIKE @cmdPrefix OR m_szWords LIKE @cmdName)
            ORDER BY s_date DESC
          `);
            logResults[cmd.name] = result.recordset[0] || null;
          }

          return {
            ...record,
            logs: logResults,
          };
        })
      );
    }

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

const getGameMasterLogs = async (req, res) => {
  const m_idPlayer = req.params.m_idPlayer;
  const LOG_GAMEMASTER_TBL = "LOGGING_01_DBF.dbo.LOG_GAMEMASTER_TBL";

  const searchKey = req.query.search || "";
  const searchMode = req.query.mode || "like"; // 'startsWith' or 'like'
  const sort = req.query.sort?.toString().replace(":", " ") || "s_date DESC";

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const pool = await poolPromise;
    const request = pool.request();

    request.input("m_idPlayer", sql.VarChar, m_idPlayer);
    request.input("offset", sql.Int, offset);
    request.input("limit", sql.Int, limit);

    let searchCondition = "m_szWords LIKE '/%' AND m_szWords NOT LIKE '/say%'";
    if (searchKey) {
      const keyword =
        searchMode === "startsWith" ? `${searchKey}%` : `%${searchKey}%`;
      searchCondition += ` AND m_szWords LIKE '${keyword.replace(/'/g, "''")}'`;
    }

    const countQuery = `
      SELECT COUNT(*) AS total 
      FROM ${LOG_GAMEMASTER_TBL} 
      WHERE m_idPlayer = @m_idPlayer AND ${searchCondition}
    `;
    const countResult = await request.query(countQuery);
    const totalCount = countResult.recordset[0].total;
    const totalPages = Math.ceil(totalCount / limit);

    const logsQuery = `
      SELECT * FROM ${LOG_GAMEMASTER_TBL}
      WHERE m_idPlayer = @m_idPlayer AND ${searchCondition}
      ORDER BY ${sort}
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `;
    const logsResult = await request.query(logsQuery);

    res.json({
      success: true,
      page,
      limit,
      total: totalCount,
      totalPages,
      result: logsResult.recordset,
    });
  } catch (err) {
    console.error("Error fetching GameMaster logs:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { getGameMasters, getGameMasterLogs };
