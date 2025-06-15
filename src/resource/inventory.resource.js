const parse = require("../helpers/inventoryParser.helper");
const INVENTORY_SIZE = parseInt(process.env.INVENTORY_SIZE || 42);

const getInventorySize = () => {
  return {
    inventory: { startIndex: 0, endIndex: INVENTORY_SIZE },
    equipment: { startIndex: INVENTORY_SIZE, endIndex: INVENTORY_SIZE + 38 },
  };
};

async function inventoryResource(
  characterData,
  backpackData = null,
  bankData = null
) {
  const { m_szName, m_Inventory, m_apIndex, m_extInventory } = characterData;
  const inventorySize = getInventorySize();

  const inventory = await parse({
    items: m_Inventory,
    indexes: m_apIndex,
    itemExtensions: m_extInventory,
    startIndex: inventorySize.inventory.startIndex,
    endIndex: inventorySize.inventory.endIndex,
  });

  const equipment = await parse({
    items: m_Inventory,
    indexes: m_apIndex,
    itemExtensions: m_extInventory,
    startIndex: inventorySize.equipment.startIndex,
    endIndex: inventorySize.equipment.endIndex,
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
