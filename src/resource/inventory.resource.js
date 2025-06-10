const parse = require("../helpers/inventoryParser.helper");

function inventoryResource(characterData, backpackData, bankData) {
  const { m_szName, m_Inventory, m_apIndex, m_extInventory } = characterData;
  let { m_Bank, m_apIndex_Bank, m_extBank } = {};

  let bank = [];
  
  if (bankData) {
    m_Bank = bankData.m_Bank;
    m_apIndex_Bank = bankData.m_Bank;
    m_extBank = bankData.m_Bank;
  }

  let { backpack1, backpack2, backpack3 } = {
    backpack1: [],
    backpack2: [],
    backpack3: [],
  };

  if (backpackData && backpackData.length >= 1) {
    // Backpack 8 slots
    backpack1 = parse({
      items: backpackData[0].szItem,
      indexes: backpackData[0].szIndex,
      itemExtensions: backpackData[0].szExt,
      startIndex: 0,
      endIndex: 8,
    });

    // Backpack 1 - 24 slots
    backpack2 = parse({
      items: backpackData[1].szItem,
      indexes: backpackData[1].szIndex,
      itemExtensions: backpackData[1].szExt,
      startIndex: 0,
      endIndex: 24,
    });

    // Backpack 2 - 24 slots
    backpack3 = parse({
      items: backpackData[2].szItem,
      indexes: backpackData[2].szIndex,
      itemExtensions: backpackData[2].szExt,
      startIndex: 0,
      endIndex: 24,
    });
  }

  const inventory = parse({
    items: m_Inventory,
    indexes: m_apIndex,
    itemExtensions: m_extInventory,
    startIndex: 0,
    endIndex: 42,
  });

  const equipment = parse({
    items: m_Inventory,
    indexes: m_apIndex,
    itemExtensions: m_extInventory,
    startIndex: 42,
    endIndex: 80,
  });

  if (bankData) {
    bank = parse({
      items: m_Bank,
      indexes: m_apIndex_Bank,
      itemExtensions: m_extBank,
      startIndex: 0,
      endIndex: 42,
    });
  }
  return {
    m_szName,
    inventory,
    equipment,
    bank,
    backpack1,
    backpack2,
    backpack3,
  };
}

module.exports = inventoryResource;
