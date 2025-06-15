const { getItemById, formatItemData } = require("../helpers/itemData.helper");
const RandomOptionDecoder = require("../helpers/RandomOptionDecoder");

async function formatTradeLog(trade) {
  const items = await Promise.all(
    (trade.items || []).map(async (item) => {
      let itemData = {};
      const getItemData = await getItemById(item.ItemIndex);

      if (getItemData) {
        itemData = formatItemData(getItemData);
      }

      return {
        idPlayer: item.idPlayer,
        itemId: item.ItemIndex,
        itemData: {
          ...itemData,
          ...RandomOptionDecoder.decode(item.RandomOpt),
        },
      };
    })
  );

  return {
    TradeID: trade.TradeID,
    TradeDt: trade.TradeDt,
    ...trade,
    details:
      trade.details?.map((detail) => ({
        idPlayer: detail.idPlayer,
        penya: detail.TradeGold,
        CharacterName: detail.CharacterName,
        PlayerIP: detail.PlayerIP,
      })) || [],
    items,
  };
}

async function tradeLogCollection(trades) {
  return await Promise.all(trades.map(formatTradeLog));
}

module.exports = {
  tradeLogCollection,
  tradeLogResource: formatTradeLog,
};
