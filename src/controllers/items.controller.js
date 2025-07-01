const { poolPromise } = require("../database/database");
const sql = require("mssql");
const { itemCollection } = require("../resource/item.resource");
const itemParse = require("../helpers/itemParser.helper");
const fs = require("fs");
const path = require("path");
const RandomOptionDecoder = require("../helpers/RandomOptionDecoder");

const chunkDir = path.join(__dirname, "../data/chunks");
const attributesPath = path.join(__dirname, "../data/attributes.json");

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

const generateRandomOptionID = async (req, res) => {
  try {
    const { options = [], safeFlag = false } = req.body;

    if (!Array.isArray(options) || options.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing 'options' array.",
      });
    }

    const formattedOptions = options
      .filter((opt) => opt.dst != null)
      .map((opt) => {
        const dst = Number(opt.dst);
        const adj = opt.adj !== undefined ? Number(opt.adj) : undefined;
        const adjRaw =
          opt.adjRaw !== undefined ? Number(opt.adjRaw) : undefined;
        return { dst, adj, adjRaw };
      });

    if (formattedOptions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid awake options provided.",
      });
    }

    const randomOptionId = RandomOptionDecoder.build(
      formattedOptions,
      safeFlag
    );

    return res.json({
      success: true,
      randomOptionId: randomOptionId.toString(),
    });
  } catch (err) {
    console.error("Error in generateRandomOptionID:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

const getItemData = async (req, res) => {
  const query = req.query.query;
  if (!query || query.trim() === "") {
    return res.status(400).json({ message: "Missing or empty query." });
  }

  const isNumeric = /^\d+$/.test(query);
  const lowercaseQuery = query.toLowerCase();

  try {
    const files = fs
      .readdirSync(chunkDir)
      .filter((file) => file.endsWith(".json"));
    const matches = [];

    for (const file of files) {
      const filePath = path.join(chunkDir, file);
      const items = JSON.parse(fs.readFileSync(filePath, "utf-8"));

      for (const item of items) {
        if (isNumeric) {
          if (item.id.toString().includes(query)) {
            matches.push(itemParse(item));
          }
        } else {
          const nameMatch = (item.displayName || "")
            .toLowerCase()
            .includes(lowercaseQuery);
          const codeMatch = (item.dwID || "")
            .toLowerCase()
            .includes(lowercaseQuery);
          if (nameMatch || codeMatch) {
            matches.push(itemParse(item));
          }
        }

        if (matches.length >= 5) break;
      }

      if (matches.length >= 5) break;
    }

    if (matches.length === 0) {
      return res.status(404).json({ message: "No matching items found." });
    }

    res.json({
      success: true,
      result: matches,
    });
  } catch (err) {
    console.error("Error in getItemData:", err);
    res.status(500).json({ message: "Internal server error." });
  }
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

const getItemAttributes = (req, res) => {
  try {
    const raw = fs.readFileSync(attributesPath, "utf-8");
    const data = JSON.parse(raw);

    return res.json({
      success: true,
      result: data,
    });
  } catch (err) {
    console.error("Failed to load attributes.json:", err);
    return res.status(500).json({
      success: false,
      message: "Unable to load attribute data.",
    });
  }
};

module.exports = {
  getItems,
  getItemData,
  generateRandomOptionID,
  getItemAttributes,
};
