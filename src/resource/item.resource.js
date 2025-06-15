const parse = require("../helpers/inventoryParser.helper");
const INVENTORY_SIZE = parseInt(process.env.INVENTORY_SIZE, 10) || 42;

async function itemResource(itemData, itemId) {
  const { data, dataIndex, extData, ...props } = itemData;

  const items = await parse({
    items: data,
    indexes: dataIndex,
    itemExtensions: extData,
    startIndex: 0,
    endIndex: INVENTORY_SIZE + 38,
    findId: itemId,
  });

  return { ...props, items: items.filter((item) => item.itemId == itemId) };
}

async function itemCollection(items, itemId) {
  return await Promise.all(items.map((item) => itemResource(item, itemId)));
}

module.exports = { itemResource, itemCollection };
