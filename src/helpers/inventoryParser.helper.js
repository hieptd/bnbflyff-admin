const RandomOptionDecoder = require("./RandomOptionDecoder.js");
const itemData = require("../data/items.json");
const attributesData = require("../data/attributes.json");

const IMAGE_SERVER = process.env.IMG_SERVER || "http://localhost:5173/";

// Parses raw item and extension data into structured objects
function parseItems(rawItems, rawItemExtensions, partsCount = 4) {
  const extData = parseItemExtensions(rawItemExtensions, partsCount);
  return rawItems.split("/").map((entry, index) => {
    if (!entry) return null;

    const [
      slotIndex,
      itemId,
      ,
      ,
      ,
      quantity,
      ,
      ,
      ,
      ,
      ,
      serialNumber = 1,
      enhancement,
      ,
      elementEnhancement,
    ] = entry.split(",");

    return {
      slotIndex,
      itemId,
      quantity,
      serialNumber,
      randomOpt: extData[index]?.randomOpt,
      randomOptParts: extData[index]?.parts,
      enhancement,
      elementEnhancement,
    };
  });
}

// Parses random option parts from item extensions
function parseItemExtensions(data, expectedParts) {
  return data
    ?.split("/")
    .map((entry) => {
      const parts = entry.split(",");
      return { randomOpt: parts[2], parts: parts.length };
    })
    .filter((entry) => entry.parts === expectedParts);
}

// Returns a slice of slots between two indexes
function sliceSlots(data, start, end) {
  return data.split("/").slice(start, end);
}

// Retrieves item metadata by ID
function fetchItemData(itemId) {
  const item = itemData.find((item) => item.id == itemId);

  if (!item) {
    console.warn(`Item ID ${itemId} not found in mergedItems.json`);
    return { image: "", displayName: "Item not found!" };
  }

  return item;
}

// Parses a single stat into readable format
function parseAwake(stat, statNum = 1) {
  const statProp = stat[`stat${statNum}Prop`]?.trim();
  const statVal = stat[`stat${statNum}Val`];
  const attributeInfo = attributesData[statProp] || { name: statProp };

  const isSpecialAdj = statProp === "DST_ATTACKSPEED";
  const value = isSpecialAdj ? Math.floor(statVal / 20) : statVal;

  return {
    label: attributeInfo.name,
    value: `${value}${attributeInfo.isPercentage ? "%" : ""}`,
  };
}

// Builds slot item data using item and slot information
function parseSlotDetails(slots, inventory) {
  return slots.map((slot, index) => {
    const item = inventory.find((i) => i?.slotIndex === slot?.toString());
    const itemId = item?.itemId ? parseInt(item.itemId) : null;

    let slotInfo = {
      slotIndex: index,
      itemId,
      quantity: item?.quantity ? parseInt(item.quantity) : 0,
      serialNumber: item?.serialNumber,
      enhancement: item?.enhancement,
      elementEnhancement: item?.elementEnhancement,
    };

    if (itemId) {
      const {
        image,
        displayName,
        description,
        itemKind1,
        abilityMin,
        abilityMax,
        type,
        stat1,
        stat2,
        stat3,
      } = fetchItemData(itemId);

      if (itemKind1 === "IK1_WEAPON") {
        slotInfo = {
          ...slotInfo,
          abilityDisplay: `Attack: ${abilityMin} ~ ${abilityMax} `,
        };
      } else if (itemKind1 === "IK1_ARMOR") {
        slotInfo = {
          ...slotInfo,
          abilityDisplay: `DEF: ${abilityMin} ~ ${abilityMax} `,
        };
      }

      if (item.randomOpt) {
        slotInfo = {
          ...slotInfo,
          ...RandomOptionDecoder.decode(item.randomOpt),
        };
      }

      if (stat1?.stat1Prop) slotInfo.stat1 = parseAwake(stat1, 1);
      if (stat2?.stat2Prop) slotInfo.stat2 = parseAwake(stat2, 2);
      if (stat3?.stat3Prop) slotInfo.stat3 = parseAwake(stat3, 3);

      slotInfo = {
        ...slotInfo,
        displayName,
        description,
        type,
        image: image ? IMAGE_SERVER + image.toLowerCase() : "",
      };
    }

    return slotInfo;
  });
}

// Main parser entry point
const parse = ({ items, indexes, itemExtensions, startIndex, endIndex }) => {
  // console.log('test', { items, indexes, itemExtensions, startIndex, endIndex })
  const slots = sliceSlots(indexes, startIndex, endIndex);
  const inventory = parseItems(items, itemExtensions);
  const slotItems = parseSlotDetails(slots, inventory);

  return slotItems.filter((item) => item.itemId !== null);
};

module.exports = parse;
