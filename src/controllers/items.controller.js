const { poolPromise } = require("../database/database");
const sql = require("mssql");
const { itemCollection } = require("../resource/item.resource");

const TABLES = {
  CHARACTER: "CHARACTER_01_DBF.dbo.CHARACTER_TBL",
  INVENTORY: "CHARACTER_01_DBF.dbo.INVENTORY_TBL",
  INVENTORY_EXT: "CHARACTER_01_DBF.dbo.INVENTORY_EXT_TBL",
  BANK: "CHARACTER_01_DBF.dbo.BANK_TBL",
  BANK_EXT: "CHARACTER_01_DBF.dbo.BANK_EXT_TBL",
  POCKET: "CHARACTER_01_DBF.dbo.tblPocket",
  POCKET_EXT: "CHARACTER_01_DBF.dbo.tblPocketExt",
};

const FUNCTIONS = {
  ContainsItemId: "CHARACTER_01_DBF.dbo.ContainsItemId",
};
const getItems = async (req, res) => {
  const itemId = req.query.itemId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  if (!itemId) {
    return res.status(400).json({ message: "Missing itemId query parameter." });
  }

  try {
    const pool = await poolPromise;
    const searchPattern = `%,${itemId},%`;

    // === COUNT ===
    const countRequest = pool.request().input("itemId", sql.Int, itemId);

    const countResult = await countRequest.query(`
  SELECT COUNT(*) AS total FROM (
    SELECT 'INVENTORY' AS source FROM ${TABLES.INVENTORY} i
    WHERE ${FUNCTIONS.ContainsItemId}(i.m_Inventory, @itemId) = 1
    UNION ALL
    SELECT 'BANK' AS source FROM ${TABLES.BANK} b
    WHERE ${FUNCTIONS.ContainsItemId}(b.m_Bank, @itemId) = 1
    UNION ALL
    SELECT 'POCKET0' FROM ${TABLES.POCKET} p WHERE p.nPocket = 0 AND ${FUNCTIONS.ContainsItemId}(p.szItem, @itemId) = 1
    UNION ALL
    SELECT 'POCKET1' FROM ${TABLES.POCKET} p WHERE p.nPocket = 1 AND ${FUNCTIONS.ContainsItemId}(p.szItem, @itemId) = 1
    UNION ALL
    SELECT 'POCKET2' FROM ${TABLES.POCKET} p WHERE p.nPocket = 2 AND ${FUNCTIONS.ContainsItemId}(p.szItem, @itemId) = 1
  ) AS counts
`);

    const totalCount = countResult.recordset[0].total;
    const totalPages = Math.ceil(totalCount / limit);

    // === FETCH DATA ===
    const dataRequest = pool
      .request()
      .input("itemId", sql.Int, itemId)
      .input("offset", sql.Int, offset)
      .input("limit", sql.Int, limit);

    const dataResult = await dataRequest.query(`
  SELECT * FROM (
    SELECT 
      'INVENTORY' AS source,
      i.m_idPlayer,
      c.m_szName AS CharacterName,
      i.m_Inventory AS data,
      i.m_apIndex AS dataIndex,
      ie.m_extInventory AS extData,
      'inventory' AS ContainerID
    FROM ${TABLES.INVENTORY} i
    JOIN ${TABLES.CHARACTER} c ON i.m_idPlayer = c.m_idPlayer
    LEFT JOIN ${TABLES.INVENTORY_EXT} ie ON i.m_idPlayer = ie.m_idPlayer
    WHERE ${FUNCTIONS.ContainsItemId}(i.m_Inventory, @itemId) = 1

    UNION ALL

    SELECT 
      'BANK' AS source,
      b.m_idPlayer,
      c.m_szName AS CharacterName,
      b.m_Bank AS data,
      b.m_apIndex_Bank AS dataIndex,
      be.m_extBank AS extData,
      'bank' AS ContainerID
    FROM ${TABLES.BANK} b
    JOIN ${TABLES.CHARACTER} c ON b.m_idPlayer = c.m_idPlayer
    LEFT JOIN ${TABLES.BANK_EXT} be ON b.m_idPlayer = be.m_idPlayer
    WHERE ${FUNCTIONS.ContainsItemId}(b.m_Bank, @itemId) = 1

    UNION ALL

    SELECT 
      'POCKET0' AS source,
      p.idPlayer AS m_idPlayer,
      c.m_szName AS CharacterName,
      p.szItem AS data,
      p.szIndex AS dataIndex,
      pe.szExt AS extData,
      'pocket0' AS ContainerID
    FROM ${TABLES.POCKET} p
    JOIN ${TABLES.CHARACTER} c ON p.idPlayer = c.m_idPlayer
    LEFT JOIN ${TABLES.POCKET_EXT} pe ON p.idPlayer = pe.idPlayer AND p.nPocket = 0
    WHERE p.nPocket = 0 AND ${FUNCTIONS.ContainsItemId}(p.szItem, @itemId) = 1

    UNION ALL

    SELECT 
      'POCKET1' AS source,
      p.idPlayer AS m_idPlayer,
      c.m_szName AS CharacterName,
      p.szItem AS data,
      p.szIndex AS dataIndex,
      pe.szExt AS extData,
      'pocket1' AS ContainerID
    FROM ${TABLES.POCKET} p
    JOIN ${TABLES.CHARACTER} c ON p.idPlayer = c.m_idPlayer
    LEFT JOIN ${TABLES.POCKET_EXT} pe ON p.idPlayer = pe.idPlayer AND p.nPocket = 1
    WHERE p.nPocket = 1 AND ${FUNCTIONS.ContainsItemId}(p.szItem, @itemId) = 1

    UNION ALL

    SELECT 
      'POCKET2' AS source,
      p.idPlayer AS m_idPlayer,
      c.m_szName AS CharacterName,
      p.szItem AS data,
      p.szIndex AS dataIndex,
      pe.szExt AS extData,
      'pocket2' AS ContainerID
    FROM ${TABLES.POCKET} p
    JOIN ${TABLES.CHARACTER} c ON p.idPlayer = c.m_idPlayer
    LEFT JOIN ${TABLES.POCKET_EXT} pe ON p.idPlayer = pe.idPlayer AND p.nPocket = 2
    WHERE p.nPocket = 2 AND ${FUNCTIONS.ContainsItemId}(p.szItem, @itemId) = 1
  ) AS combined
  ORDER BY source, m_idPlayer
  OFFSET @offset ROWS
  FETCH NEXT @limit ROWS ONLY
`);

    res.json({
      success: true,
      page,
      limit,
      total: totalCount,
      totalPages,
      result: await itemCollection(dataResult.recordset, itemId).catch(
        (err) => {
          console.error("Error in itemCollection:", err);
          return dataResult.recordset;
        }
      ),
    });
  } catch (err) {
    console.error("Error fetching item occurrences:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = { getItems };
