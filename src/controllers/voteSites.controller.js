const { poolPromise } = require("../database/database");
const sql = require("mssql");

const getVoteSites = async (req, res) => {
  const VOTE_SITE_TBL = "SHOP_DBF.dbo.VOTE_SITE_TBL";
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const pool = await poolPromise;

    const countResult = await pool.request().query(`
      SELECT COUNT(*) AS total FROM ${VOTE_SITE_TBL}
    `);
    const totalCount = countResult.recordset[0].total;
    const totalPages = Math.ceil(totalCount / limit);

    const voteSitesResult = await pool
      .request()
      .input("offset", sql.Int, offset)
      .input("limit", sql.Int, limit).query(`
        SELECT * FROM ${VOTE_SITE_TBL}
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
      result: voteSitesResult.recordset,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getVoteSite = async (req, res) => {
  const id = req.params.id;
  const VOTE_SITE_TBL = "SHOP_DBF.dbo.VOTE_SITE_TBL";

  try {
    const pool = await poolPromise;

    const voteSiteResult = await pool.request().input("id", sql.Int, id).query(`
        SELECT * FROM ${VOTE_SITE_TBL} WHERE id = @id`);

    res.json({
      success: true,
      result: voteSiteResult.recordset[0],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createVoteSite = async (req, res) => {
  const { name, link, image, type, points = 0, is_active = "0" } = req.body;
  const VOTE_SITE_TBL = "SHOP_DBF.dbo.VOTE_SITE_TBL";

  try {
    const pool = await poolPromise;

    await pool
      .request()
      .input("name", sql.VarChar, name)
      .input("link", sql.VarChar, link)
      .input("image", sql.VarChar, image || null)
      .input("type", sql.VarChar, type)
      .input("points", sql.Int, points)
      .input("is_active", sql.Char, is_active).query(`
        INSERT INTO ${VOTE_SITE_TBL} (name, link, image, type, points, is_active)
        VALUES (@name, @link, @image, @type, @points, @is_active)
      `);

    res
      .status(201)
      .json({ success: true, message: "Vote site created successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getVoteSites, getVoteSite, createVoteSite };
