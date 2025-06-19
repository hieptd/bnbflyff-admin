const parse = require("../helpers/inventoryParser.helper");
const GUILD_BANK_SIZE = parseInt(process.env.GUILD_BANK_SIZE, 10) || 120;

async function guildBankResource(itemData) {
  const { data, dataIndex, extData } = itemData;

  const items = await parse({
    items: data,
    indexes: dataIndex,
    itemExtensions: extData,
    startIndex: 0,
    endIndex: GUILD_BANK_SIZE,
  });

  return items.filter((item) => item.itemId);
}

async function guildBankCollection(items) {
  console.log(items);
  return await Promise.all(items.map((item) => guildBankResource(item)));
}

module.exports = { guildBankResource, guildBankCollection };
