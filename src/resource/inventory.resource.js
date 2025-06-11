const parse = require("../helpers/inventoryParser.helper");

async function inventoryResource(
  characterData,
  backpackData = null,
  bankData = null
) {
  const { m_szName, m_Inventory, m_apIndex, m_extInventory } = characterData;

  const inventory = await parse({
    items: m_Inventory,
    indexes: m_apIndex,
    itemExtensions: m_extInventory,
    startIndex: 0,
    endIndex: 42,
  });

  const equipment = await parse({
    items: m_Inventory,
    indexes: m_apIndex,
    itemExtensions: m_extInventory,
    startIndex: 42,
    endIndex: 80,
  });

  const bank = bankData
    ? await parse({
        items: bankData.m_Bank,
        indexes: bankData.m_apIndex_Bank,
        itemExtensions: bankData.m_extBank,
        startIndex: 0,
        endIndex: 42,
      })
    : [];

  const [backpack1, backpack2, backpack3] = await Promise.all(
    [0, 1, 2].map(async (index) => {
      if (!backpackData) return [];
      const pack = backpackData[index];
      if (!pack) return [];
      const slotCount = index === 0 ? 8 : 24;
      return await parse({
        items: pack.szItem,
        indexes: pack.szIndex,
        itemExtensions: pack.szExt,
        startIndex: 0,
        endIndex: slotCount,
      });
    })
  );

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
