const { poolPromise } = require("../database/database");
const sql = require("mssql");
const { guildBankCollection, guildBankResource } = require("../resource/guildbank.resource");

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

  const sort =
    req.query.sort?.toString().replace(":", " ") || "m_nMemberLv";

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

module.exports = { getGuilds, getGuildMembers, getGuildBank };
