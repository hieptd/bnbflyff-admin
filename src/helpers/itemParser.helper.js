const attributesData = require("../data/attributes.json");
const RandomOptionDecoder = require("./RandomOptionDecoder");

const parseItemStat = (stat, statNum = 1) => {
  const statProp = stat[`stat${statNum}Prop`]?.trim();
  const statVal = stat[`stat${statNum}Val`];
  const attributeInfo = attributesData[statProp] || { name: statProp };

  const isSpecialAdj = statProp === "DST_ATTACKSPEED";
  const value = isSpecialAdj ? Math.floor(statVal / 20) : statVal;

  return {
    label: attributeInfo.name,
    value: `${value}${attributeInfo.isPercentage ? "%" : ""}`,
  };
};

const itemParse = (fetchedItem, randomOpt, enhancement) => {
  let itemInfo = {};
  const {
    itemKind1,
    abilityMin,
    abilityMax,
    stat1,
    stat2,
    stat3,
    accessoryBonuses,
  } = fetchedItem;

  if (accessoryBonuses) {
    itemInfo.accessoryBonus = accessoryBonuses
      .find(({ level }) => level == enhancement)
      ?.bonuses.map(
        (stat) =>
          `${attributesData[stat.prop]?.name || stat.prop} +${stat.value}`
      );
  }

  if (itemKind1 === "IK1_WEAPON") {
    itemInfo = {
      ...itemInfo,
      abilityDisplay: `Attack: ${abilityMin} ~ ${abilityMax} `,
    };
  } else if (itemKind1 === "IK1_ARMOR") {
    itemInfo = {
      ...itemInfo,
      abilityDisplay: `DEF: ${abilityMin} ~ ${abilityMax} `,
    };
  }

  if (randomOpt) {
    itemInfo = {
      ...itemInfo,
      ...RandomOptionDecoder.decode(randomOpt),
    };
  }

  if (stat1?.stat1Prop) itemInfo.stat1 = parseItemStat(stat1, 1);
  if (stat2?.stat2Prop) itemInfo.stat2 = parseItemStat(stat2, 2);
  if (stat3?.stat3Prop) itemInfo.stat3 = parseItemStat(stat3, 3);

  return itemInfo;
};

module.exports = itemParse;
