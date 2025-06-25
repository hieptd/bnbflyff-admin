const RandomOptionDecoder = require("./RandomOptionDecoder.js");
const attributesData = require("../data/attributes.json");
const { getItemById } = require("./itemData.helper.js");

const IMAGE_SERVER = process.env.IMG_SERVER || "http://localhost:5173/";
const FLYFF_MODEL_CHANGE = parseInt(process.env.FLYFF_MODEL_CHANGE, 10) || 0;

function parseItems(rawItems, rawItemExtensions, partsCount = 4, findId = 0) {
  const extData = parseItemExtensions(rawItemExtensions, partsCount);
  return rawItems.split("/").map((entry, index) => {
    if (!entry) return null;
    const entryArr = entry.split(",");
    let itemId = entryArr[1];
    const slotIndex = entryArr[0];
    const quantity = entryArr[5];
    const serialNumber = entryArr[11];
    const enhancement = entryArr[12];
    const elementEnhancement = entryArr[14];
    const originalItemId = entryArr[17];

    const extObj = { slotIndex, serialNumber };

    if (findId > 0 && findId != itemId) {
      return extObj;
    }

    return {
      ...extObj,
      itemId,
      quantity,
      randomOpt: extData[index]?.randomOpt,
      randomOptParts: extData[index]?.parts,
      enhancement,
      elementEnhancement,
      originalItemId: originalItemId ? parseInt(originalItemId) : null,
      raw: entry,
    };
  });
}

function parseItemExtensions(data, expectedParts) {
  return data
    ?.split("/")
    .map((entry) => {
      const parts = entry.split(",");
      return { randomOpt: parts[2], parts: parts.length };
    })
    .filter((entry) => entry.parts === expectedParts);
}

function sliceSlots(data, start, end) {
  return data.split("/").slice(start, end);
}

async function fetchItemData(itemId) {
  const item = await getItemById(itemId);
  if (!item) {
    // console.warn(`Item ID ${itemId} not found in mergedItems.json`);
    return {
      image: `icon_default.jpg`,
      displayName: "Item not found!",
      description: "Please update your data/chunks/items*.json",
    };
  }

  return item;
}

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

async function parseSlotDetails(slots, inventory) {
  return await Promise.all(
    slots.map(async (slot, index) => {
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

      // FLYFF_MODEL_CHANGE === 1
      if (FLYFF_MODEL_CHANGE === 1 && parseInt(item?.originalItemId) >= 10) {
        const { image: ogImage, displayName: ogDisplayName } =
          await fetchItemData(item?.originalItemId);

        slotInfo.originalModel = {
          image: ogImage ? IMAGE_SERVER + ogImage.toLowerCase() : "",
          displayName: ogDisplayName,
          itemId: item?.originalItemId,
        };
      }

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
          accessoryBonuses,
        } = await fetchItemData(itemId);

        if (accessoryBonuses) {
          slotInfo.accessoryBonus = accessoryBonuses
            .find(({ level }) => level == item?.enhancement)
            ?.bonuses.map(
              (stat) =>
                `${attributesData[stat.prop]?.name || stat.prop} +${stat.value}`
            );
        }

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

        if (item?.randomOpt) {
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
          raw: item?.raw,
          image: image ? IMAGE_SERVER + image.toLowerCase() : "",
        };
      }

      return slotInfo;
    })
  );
}

const parse = async ({
  items,
  indexes,
  itemExtensions,
  startIndex,
  endIndex,
  findId = 0,
}) => {
  if (!items || !indexes || !itemExtensions) return [];
  const slots = sliceSlots(indexes, startIndex, endIndex);
  const inventory = parseItems(items, itemExtensions, 4, findId);
  const slotItems = await parseSlotDetails(slots, inventory);
  return slotItems.filter((item) => item.itemId !== null);
};

module.exports = parse;
