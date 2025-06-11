const fs = require("fs/promises");
const path = require("path");

const CHUNKS_DIR = path.resolve(__dirname, "../data/chunks");

const chunkCache = {}; // Cache contents
let chunkIndex = []; // Array of { file, minId, maxId }

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

    console.log(`✅ Indexed ${chunkIndex.length} chunks`);
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
  return chunk.find((item) => item.id == itemId) || null;
}

module.exports = {
  getItemById,
  initializeChunks,
};
