const { poolPromise } = require("../database/database");
const sql = require("mssql");
const inventoryResource = require("../resource/inventory.resource");

const getInventory = async (req, res) => {
  const { m_idPlayer } = req.params;
  const { showBackpack, showBank } = req.query;

  const TABLES = {
    CHARACTER: "CHARACTER_01_DBF.dbo.CHARACTER_TBL",
    INVENTORY: "CHARACTER_01_DBF.dbo.INVENTORY_TBL",
    INVENTORY_EXT: "CHARACTER_01_DBF.dbo.INVENTORY_EXT_TBL",
    BANK: "CHARACTER_01_DBF.dbo.BANK_TBL",
    BANK_EXT: "CHARACTER_01_DBF.dbo.BANK_EXT_TBL",
    POCKET: "CHARACTER_01_DBF.dbo.tblPocket",
    POCKET_EXT: "CHARACTER_01_DBF.dbo.tblPocketExt",
  };

  try {
    const pool = await poolPromise;

    // Character + Inventory + Inventory Extension
    const characterQuery = `
      SELECT 
        C.*, 
        I.*, 
        IE.*
      FROM ${TABLES.CHARACTER} AS C
      LEFT JOIN ${TABLES.INVENTORY} AS I ON C.m_idPlayer = I.m_idPlayer
      LEFT JOIN ${TABLES.INVENTORY_EXT} AS IE ON C.m_idPlayer = IE.m_idPlayer
      WHERE C.m_idPlayer = @m_idPlayer
    `;

    const characterResult = await pool
      .request()
      .input("m_idPlayer", sql.VarChar, m_idPlayer)
      .query(characterQuery);

    const character = characterResult.recordset[0];
    if (!character) {
      return res.status(404).json({ message: "Character not found." });
    }

    // Optional Bank data
    let bank = null;
    if (showBank) {
      const bankQuery = `
        SELECT 
          B.*, 
          BE.*
        FROM ${TABLES.BANK} AS B
        LEFT JOIN ${TABLES.BANK_EXT} AS BE ON B.m_idPlayer = BE.m_idPlayer
        WHERE B.m_idPlayer = @m_idPlayer
      `;

      const bankResult = await pool
        .request()
        .input("m_idPlayer", sql.VarChar, m_idPlayer)
        .query(bankQuery);

      bank = bankResult.recordset[0];
    }

    // Optional Backpack data
    let backpacks = null;
    if (showBackpack) {
      const backpackQuery = `
        SELECT 
          P.*, 
          P.nPocket AS pocketNum, 
          PE.*
        FROM ${TABLES.POCKET} AS P
        LEFT JOIN ${TABLES.POCKET_EXT} AS PE 
          ON P.idPlayer = PE.idPlayer AND P.nPocket = PE.nPocket
        WHERE P.idPlayer = @m_idPlayer
      `;

      const backpackResult = await pool
        .request()
        .input("m_idPlayer", sql.VarChar, m_idPlayer)
        .query(backpackQuery);

      backpacks = backpackResult.recordsets[0];
    }

    const inventoryResourceObj = await inventoryResource(
      character,
      backpacks,
      bank
    );

    // Return structured response
    return res.json({
      success: true,
      result: {
        m_szName: character.m_szName,
        ...inventoryResourceObj,
      },
    });
  } catch (error) {
    console.error("Inventory fetch error:", error);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { getInventory };
