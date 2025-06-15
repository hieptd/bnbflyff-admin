const { poolPromise } = require("../database/database");
const sql = require("mssql");
const { tradeLogCollection } = require("../resource/tradeLog.resource");

const getTradeLogs = async (req, res) => {
  const searchKey = req.query.search;
  const idPlayer1 = req.query.idPlayer1;
  const idPlayer2 = req.query.idPlayer2;
  const itemIndex = req.query.ItemIndex;
  const sort = req.query.sort?.toString().replace(":", " ") || "TradeDt desc";
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const TRADE_LOG = "LOGGING_01_DBF.dbo.tblTradeLog";
  const TRADE_DETAIL_LOG = "LOGGING_01_DBF.dbo.tblTradeDetailLog";
  const TRADE_ITEM_LOG = "LOGGING_01_DBF.dbo.tblTradeItemLog";
  const CHARACTER_TBL = "CHARACTER_01_DBF.dbo.CHARACTER_TBL";

  try {
    const pool = await poolPromise;

    let filterTradeIds = null;

    if (idPlayer1 || idPlayer2 || itemIndex) {
      const filterRequest = pool.request();
      const subqueries = [];

      if (idPlayer1) {
        filterRequest.input("idPlayer1", sql.VarChar, idPlayer1);
        subqueries.push(`
      SELECT DISTINCT TradeID FROM ${TRADE_DETAIL_LOG} WHERE idPlayer = @idPlayer1
    `);
      }

      if (idPlayer2) {
        filterRequest.input("idPlayer2", sql.VarChar, idPlayer2);
        subqueries.push(`
      SELECT DISTINCT TradeID FROM ${TRADE_DETAIL_LOG} WHERE idPlayer = @idPlayer2
    `);
      }

      if (itemIndex) {
        filterRequest.input("ItemIndex", sql.Int, itemIndex);
        subqueries.push(`
      SELECT DISTINCT TradeID FROM ${TRADE_ITEM_LOG} WHERE ItemIndex = @ItemIndex
    `);
      }

      const intersectQuery = subqueries.join(" INTERSECT ");

      const tradeIdResult = await filterRequest.query(intersectQuery);
      filterTradeIds = tradeIdResult.recordset.map((row) => row.TradeID);

      if (filterTradeIds.length === 0) {
        return res.json({
          success: true,
          page,
          limit,
          total: 0,
          totalPages: 0,
          result: [],
        });
      }
    }

    const countRequest = pool.request();
    let whereClauses = [];

    if (searchKey) {
      countRequest.input("search", sql.VarChar, `%${searchKey}%`);
      whereClauses.push("CAST(TradeID AS VARCHAR) LIKE @search");
    }

    if (filterTradeIds) {
      filterTradeIds.forEach((id, i) => {
        countRequest.input(`fid${i}`, sql.BigInt, id);
      });
      const idConditions = filterTradeIds.map((_, i) => `@fid${i}`).join(",");
      whereClauses.push(`TradeID IN (${idConditions})`);
    }

    const whereString = whereClauses.length
      ? `WHERE ${whereClauses.join(" AND ")}`
      : "";

    const countResult = await countRequest.query(`
      SELECT COUNT(*) as total FROM ${TRADE_LOG} ${whereString}
    `);

    const total = countResult.recordset[0].total;
    const totalPages = Math.ceil(total / limit);

    const mainRequest = pool
      .request()
      .input("offset", sql.Int, offset)
      .input("limit", sql.Int, limit);

    if (searchKey) {
      mainRequest.input("search", sql.VarChar, `%${searchKey}%`);
    }

    if (filterTradeIds) {
      filterTradeIds.forEach((id, i) => {
        mainRequest.input(`fid${i}`, sql.BigInt, id);
      });
    }

    const pagedTrades = await mainRequest.query(`
      SELECT * FROM ${TRADE_LOG}
      ${whereString}
      ORDER BY ${sort}
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    const tradeIds = pagedTrades.recordset.map((row) => row.TradeID);

    if (tradeIds.length === 0) {
      return res.json({
        success: true,
        page,
        limit,
        total,
        totalPages,
        result: [],
      });
    }

    const detailRequest = pool.request();
    tradeIds.forEach((id, i) => detailRequest.input(`id${i}`, sql.BigInt, id));
    const detailQuery = `
  SELECT 
    d.*,
    c.m_szName AS CharacterName,
    c.m_idPlayer AS CharacterId
  FROM ${TRADE_DETAIL_LOG} d
  LEFT JOIN ${CHARACTER_TBL} c ON d.idPlayer = c.m_idPlayer
  WHERE d.TradeID IN (${tradeIds.map((_, i) => `@id${i}`).join(",")})
`;
    const detailResult = await detailRequest.query(detailQuery);

    const itemRequest = pool.request();
    tradeIds.forEach((id, i) => itemRequest.input(`id${i}`, sql.BigInt, id));
    const itemQuery = `
      SELECT * FROM ${TRADE_ITEM_LOG}
      WHERE TradeID IN (${tradeIds.map((_, i) => `@id${i}`).join(",")})
    `;
    const itemResult = await itemRequest.query(itemQuery);

    // Step 6: Merge data
    const tradeMap = pagedTrades.recordset.map((trade) => {
      const details = detailResult.recordset.filter(
        (d) => d.TradeID === trade.TradeID
      );
      const items = itemResult.recordset.filter(
        (i) => i.TradeID === trade.TradeID
      );
      return {
        ...trade,
        details,
        items,
      };
    });

    res.json({
      success: true,
      page,
      limit,
      total,
      totalPages,
      result: await tradeLogCollection(tradeMap),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getTradeLogs };
