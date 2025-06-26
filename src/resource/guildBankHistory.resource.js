const { getItemById } = require("../helpers/itemData.helper");
const itemParse = require("../helpers/itemParser.helper");

async function guildBankHistoryResource(itemData) {
  const { m_Item, m_nRandomOptItemId, m_nAbilityOption } = itemData;
  let itemDetails = {};

  if (m_Item && !isNaN(m_Item)) {
    const item = await getItemById(Number(m_Item));
    if (item) {
      itemDetails = {
        ...item,
        ...itemParse(item, m_nRandomOptItemId, m_nAbilityOption),
      };
    }
  }

  return { ...itemData, itemDetails };
}

async function guildBankHistoryCollection(items) {
  return await Promise.all(items.map(guildBankHistoryResource));
}

module.exports = {
  guildBankHistoryResource,
  guildBankHistoryCollection,
};
