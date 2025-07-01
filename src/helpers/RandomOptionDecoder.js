const defAttrJsonContent = require("../data/attributes.json");

class RandomOptionDecoder {
  static MAX_RANDOM_OPTION = 3;
  static AWAKE_SAFE_FLAG = 0x2000000000000000n;
  static OPTION_MASK = 0x3ffffn;
  static DST_MAP = this.loadDstMap();
  static MAX_AWAKE_VALUE = 512;

  /**
   * Loads dst ID to name mappings from defineAttribute.h.
   * Only includes lines starting with `#define DST_`.
   */
  static loadDstMap() {
    const dstMap = new Map();
    for (const line of Object.keys(defAttrJsonContent)) {
      const id = parseInt(defAttrJsonContent[line].id, 10);
      const key = defAttrJsonContent[line].key;
      const name = defAttrJsonContent[line].name || null;
      const isPercentage = defAttrJsonContent[line].isPercentage || null;
      dstMap.set(id, { key, name, isPercentage });
    }

    return dstMap;
  }

  /**
   * Checks if the safe flag is set in the 64-bit random option ID.
   * @param {number | bigint} randomOptionId
   * @returns {boolean}
   */
  static isCheckedSafeFlag(randomOptionId) {
    const id = BigInt(randomOptionId);
    return (id & this.AWAKE_SAFE_FLAG) !== 0n;
  }

  /**
   * Decodes an option ID into dst, adj, and adjRaw.
   * Adds `dstKey` from defineAttribute.h if available.
   * @param {number} optionId
   * @returns {{ dst: number, dstKey?: string, adj: number, adjRaw: number }}
   */
  static decodeOptionId(optionId) {
    const dst = optionId >> 10;
    const adjRaw = optionId & 0x3ff;
    const adj = this.MAX_AWAKE_VALUE - adjRaw;
    const dstMapped = this.DST_MAP.get(dst);
    const dstKey = dstMapped.key;
    const dstName = dstMapped.name;
    const dstIsPercentage = dstMapped.isPercentage;

    return { dst, dstKey, dstName, dstIsPercentage, adj, adjRaw };
  }

  /**
   * Converts raw adjustment values (`adj`, `adjRaw`) into a formatted readable value,
   * optionally applying special handling for certain dstKeys (like attack speed).
   *
   * - If the `dstKey` is not in the special exceptions list, it will return a string
   *   prefixed with "+" unless the adjustment is negative or zero.
   * - For specific keys like `DST_ATTACKSPEED`, the value is recalculated using a
   *   custom formula and returned as a number or formatted string.
   *
   * @param {number} adj - Adjusted value (typically MAX_AWAKE_VALUE - adjRaw).
   * @param {number} adjRaw - Raw adjustment value from the encoded option ID.
   * @param {string} dstKey - Attribute key (e.g., "DST_STR", "DST_ATTACKSPEED").
   * @returns {string | number} - Formatted value, like "+5", "-3", or numeric value for special cases.
   */
  static decodeProperValue(adj, adjRaw, dstKey) {
    const incorrectAdjDstKeys = ["DST_ATTACKSPEED"];
    let value = adj < 1 ? adj : adjRaw;

    if (!incorrectAdjDstKeys.includes(dstKey)) {
      return `${adj < 1 ? "" : "+"}${value}`;
    } else {
      if (adj < 1) {
        return -1 * Math.floor((adjRaw - this.MAX_AWAKE_VALUE) / 20);
      } else {
        return `+${Math.floor(adjRaw / 20)}`;
      }
    }
  }

  /**
   * Builds a 64-bit randomOptionId from dst and adjRaw (or adj).
   * Accepts up to 3 awake objects: { dst: number, adjRaw?: number, adj?: number }
   * @param {Array<{ dst: number, adjRaw?: number, adj?: number }>} options
   * @param {boolean} [safeFlag=false]
   * @returns {bigint}
   */
  static build(options, safeFlag = false) {
    let result = BigInt(0);

    let shift = 8n;

    for (let i = 0; i < this.MAX_RANDOM_OPTION && i < options.length; i++) {
      const { dst, adjRaw, adj } = options[i];
      const adjToUse = adj >= 1 ? 512 - adj : adj;
      if (dst == null || (adjRaw == null && adj == null)) continue;

      const raw = adjRaw != null ? adjRaw : 512 - adjToUse;
      const encoded = (dst << 10) | (raw & 0x3ff);

      result |= BigInt(encoded) << shift;
      shift += 18n;
    }

    if (safeFlag) {
      result |= this.AWAKE_SAFE_FLAG;
    }

    return result;
  }

  /**
   * Decodes up to 3 random options from the 64-bit ID.
   * @param {number | bigint} randomOptionId
   * @returns {{
   *   safeFlag: boolean,
   *   options: number[],
   *   decodedOptions: { dst: number, dstKey?: string, adj: number, adjRaw: number }[]
   * }}
   */
  static decode(randomOptionId) {
    const id = BigInt(randomOptionId);
    const safeFlag = this.isCheckedSafeFlag(id);

    if (safeFlag) {
      return {
        safeFlag,
        options: [],
        decodedOptions: [],
      };
    }

    const options = [];
    let shift = 8n;

    for (let i = 0; i < this.MAX_RANDOM_OPTION; i++) {
      const value = Number((id >> shift) & this.OPTION_MASK);
      if (value === 0) break;
      options.push(value);
      shift += 18n;
    }

    return options.reduce((awakes, awake, awakeIndex) => {
      const decodedAwake = this.decodeOptionId(awake);
      const label = decodedAwake.dstName || decodedAwake.dstKey;
      let value = this.decodeProperValue(
        decodedAwake.adj,
        decodedAwake.adjRaw,
        decodedAwake.dstKey
      );

      if (decodedAwake.dstIsPercentage) {
        value = `${value}%`;
      }

      return {
        ...awakes,
        [`awake${awakeIndex + 1}`]: { label, value },
      };
    }, {});
  }
}

module.exports = RandomOptionDecoder;
