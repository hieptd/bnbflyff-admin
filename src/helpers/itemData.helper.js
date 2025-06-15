const fs = require("fs/promises");
const path = require("path");
const RandomOptionDecoder = require("./RandomOptionDecoder");
const attributesData = require("../data/attributes.json");

const CHUNKS_DIR = path.resolve(__dirname, "../data/chunks");

const chunkCache = {}; // Cache contents
let chunkIndex = []; // Array of { file, minId, maxId }
const IMAGE_SERVER = process.env.IMG_SERVER || "http://localhost:5173/";

async function initializeChunks() {
  try {
    const files = await fs.readdir(CHUNKS_DIR);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    chunkIndex = [];

    for (const file of jsonFiles) {
      const filePath = path.join(CHUNKS_DIR, file);
      const content = await fs.readFile(filePath, "utf8");
      const data = JSON.parse(content);

      const ids = data.map((item) => item.id).filter((id) => id != null);
      const minId = Math.min(...ids);
      const maxId = Math.max(...ids);

      chunkIndex.push({ file, minId, maxId });
    }

    // console.log(`✅ Indexed ${chunkIndex.length} chunks`);
  } catch (err) {
    console.error("❌ Error initializing chunks:", err.message);
  }
}

async function getItemById(itemId) {
  if (!chunkIndex.length) {
    await initializeChunks();
  }

  const chunkMeta = chunkIndex.find(
    (chunk) => itemId >= chunk.minId && itemId <= chunk.maxId
  );

  if (!chunkMeta) {
    return null;
  }

  if (!chunkCache[chunkMeta.file]) {
    try {
      const filePath = path.join(CHUNKS_DIR, chunkMeta.file);
      const content = await fs.readFile(filePath, "utf8");
      chunkCache[chunkMeta.file] = JSON.parse(content);
    } catch (err) {
      console.error(`❌ Failed to load chunk ${chunkMeta.file}`, err.message);
      return null;
    }
  }

  const chunk = chunkCache[chunkMeta.file];
  const item = chunk.find((item) => item.id == itemId);
  return item
    ? { ...item, imageFullPath: `${IMAGE_SERVER + item.image.toLowerCase()}` }
    : null;
}

function parseStat(stat, statNum = 1) {
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

const formatItemData = (item) => {
  let formattedItem = {};
  if (item) {
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
    } = item;

    if (accessoryBonuses) {
      formattedItem.accessoryBonus = accessoryBonuses
        .find(({ level }) => level == item?.enhancement)
        ?.bonuses.map(
          (stat) =>
            `${attributesData[stat.prop]?.name || stat.prop} +${stat.value}`
        );
    }

    if (itemKind1 === "IK1_WEAPON") {
      formattedItem = {
        ...formattedItem,
        abilityDisplay: `Attack: ${abilityMin} ~ ${abilityMax} `,
      };
    } else if (itemKind1 === "IK1_ARMOR") {
      formattedItem = {
        ...formattedItem,
        abilityDisplay: `DEF: ${abilityMin} ~ ${abilityMax} `,
      };
    }

    if (item.randomOpt) {
      formattedItem = {
        ...formattedItem,
        ...RandomOptionDecoder.decode(item.randomOpt),
      };
    }

    if (stat1?.stat1Prop) formattedItem.stat1 = parseStat(stat1, 1);
    if (stat2?.stat2Prop) formattedItem.stat2 = parseStat(stat2, 2);
    if (stat3?.stat3Prop) formattedItem.stat3 = parseStat(stat3, 3);

    formattedItem = {
      ...formattedItem,
      displayName,
      description,
      type,
      image: image ? IMAGE_SERVER + image.toLowerCase() : "",
    };
  }

  return formattedItem;
};

module.exports = {
  getItemById,
  initializeChunks,
  formatItemData,
};
