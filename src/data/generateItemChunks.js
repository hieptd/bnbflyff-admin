const fs = require("fs/promises");
const path = require("path");

async function generateItemChunks() {
  const definePath = path.resolve("./defineItem.h");
  const displayNamePath = path.resolve("./propItem.txt.txt");
  const mainItemPath = path.resolve("./propItem.txt");
  const accessoryPath = path.resolve("./accessory.inc");
  const outputDir = path.resolve("./output_items");

  try {
    await fs.mkdir(outputDir, { recursive: true });

    // Load item IDs from defineItem.h
    const defineContent = await fs.readFile(definePath, "utf-8");
    const itemIds = {};
    for (const line of defineContent.split(/\r?\n/)) {
      const match = line.trim().match(/^#define\s+(\S+)\s+(\d+)/);
      if (match) {
        const [, name, id] = match;
        itemIds[name] = parseInt(id, 10);
      }
    }

    // Load display names
    const displayContent = await fs.readFile(displayNamePath, "utf16le");
    const displayNames = {};
    for (const line of displayContent.split(/\r?\n/)) {
      const tabIndex = line.indexOf("\t");
      if (tabIndex > -1) {
        const key = line.slice(0, tabIndex).trim();
        const value = line.slice(tabIndex + 1).trim();
        displayNames[key] = value;
      }
    }

    // Parse accessory bonuses
    const accessoryText = await fs.readFile(accessoryPath, "utf-8");
    const accessoryData = {};
    let currentItem = null;
    let inside = false;

    for (const rawLine of accessoryText.split(/\r?\n/)) {
      const line = rawLine.replace(/\/\/.*$/, "").trim();
      if (!line) continue;

      if (line.startsWith("II_")) {
        currentItem = line;
        accessoryData[currentItem] = [];
      } else if (line === "{") {
        inside = true;
      } else if (line === "}") {
        inside = false;
      } else if (inside && currentItem) {
        const match = line.match(/^(\d+)\s*{\s*(.*?)\s*}$/);
        if (match) {
          const level = parseInt(match[1], 10);
          const bonusPairs = match[2].trim().split(/\s+/);
          const bonuses = [];
          for (let i = 0; i < bonusPairs.length; i += 2) {
            bonuses.push({
              prop: bonusPairs[i],
              value: parseInt(bonusPairs[i + 1], 10),
            });
          }
          accessoryData[currentItem].push({ level, bonuses });
        }
      }
    }

    // Parse main item data
    const mainContent = await fs.readFile(mainItemPath, "utf-8");
    const items = [];

    for (const line of mainContent.split(/\r?\n/)) {
      if (!line.trim() || line.startsWith("/")) continue;

      const fields = line.split("\t");
      if (fields.length < 3) continue;

      const dwID = fields[1].trim();
      const szName = fields[2].trim();
      const itemKind1 = fields[5]?.trim();
      const abilityMin = fields[30]?.trim();
      const abilityMax = fields[31]?.trim();
      const stat1Prop = fields[53]?.trim() || "";
      const stat2Prop = fields[54]?.trim() || "";
      const stat3Prop = fields[55]?.trim() || "";
      const stat1Val = fields[56]?.trim() || "";
      const stat2Val = fields[57]?.trim() || "";
      const stat3Val = fields[58]?.trim() || "";
      const weaponType = fields[91]?.trim() || "";

      let image = fields.find((f) => f.toLowerCase().includes(".dds")) || "";
      image = image.replace(/^["']+|["']+$/g, "").replace(/\.dds$/i, ".jpg");

      const szDescription = fields
        .find((f, i) => f.startsWith("IDS_PROPITEM_TXT") && i !== 2)
        ?.trim();

      const type = fields.find((f) => f.startsWith("IK3_")) || null;
      const job = fields.find((f) => f.startsWith("JOB_")) || null;

      const displayName = displayNames[szName] || null;
      const description = szDescription
        ? displayNames[szDescription] || null
        : null;

      const id = itemIds[dwID] ?? null;
      const accessoryBonuses = accessoryData[dwID] || null;

      if (id !== null) {
        items.push({
          id,
          dwID,
          itemKind1,
          weaponType,
          abilityMin,
          abilityMax,
          displayName,
          description,
          image,
          type,
          job,
          stat1: {
            stat1Prop: stat1Prop !== "=" ? stat1Prop : null,
            stat1Val: stat1Val !== "=" ? stat1Val : null,
          },
          stat2: {
            stat2Prop: stat2Prop !== "=" ? stat2Prop : null,
            stat2Val: stat2Val !== "=" ? stat2Val : null,
          },
          stat3: {
            stat3Prop: stat3Prop !== "=" ? stat3Prop : null,
            stat3Val: stat3Val !== "=" ? stat3Val : null,
          },
          accessoryBonuses,
        });
      }
    }

    // Save JSON files in chunks
    const sortedItems = items.sort((a, b) => a.id - b.id);
    const chunkSize = 1000;
    const totalChunks = Math.ceil(sortedItems.length / chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const chunk = sortedItems.slice(i * chunkSize, (i + 1) * chunkSize);
      const start = chunk[0]?.id ?? 0;
      const end = chunk[chunk.length - 1]?.id ?? 0;
      const fileName = `items${start}_${end}.json`;
      const outputPath = path.join(outputDir, fileName);

      await fs.writeFile(outputPath, JSON.stringify(chunk, null, 2), "utf-8");
      console.log(`Saved ${chunk.length} items to ${fileName}`);
    }

    console.log(`All done. ${totalChunks} files saved in ${outputDir}`);
  } catch (err) {
    console.error("Error generating item JSON files:", err);
  }
}

generateItemChunks();
