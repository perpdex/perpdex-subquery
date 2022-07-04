import {
  Trader,
  Protocol,
  TraderTakerInfo,
  TraderMakerInfo,
  Position,
  PositionHistory,
  PHistory,
  LiquidityHistory,
  LHistory,
  OpenOrder,
  Market,
  Candle,
  DaySummary,
} from "../types";
import {
  BI_ZERO,
  STR_ZERO,
  m5,
  m15,
  h1,
  d1,
  MAX_LOG_COUNT,
  Q96,
} from "./constant";
import { ChainId, Network, Version } from "../constants/index";
import { mulDiv } from "./math";

export function getBlockNumberLogIndex(
  blockNumber: number,
  logIndex: number
): bigint {
  return BigInt(blockNumber) * BigInt(MAX_LOG_COUNT) + BigInt(logIndex);
}

export async function getOrCreateTrader(traderAddr: string): Promise<Trader> {
  let trader = await Trader.get(traderAddr);
  if (typeof trader === "undefined") {
    trader = new Trader(traderAddr);
    trader.collateralBalance = BI_ZERO;
    trader.markets = [];
    trader.timestamp = BI_ZERO;
    await trader.save();
  }
  return trader;
}

const protocolId = "perpdex";

export async function getOrCreateProtocol(): Promise<Protocol> {
  let protocol = await Protocol.get(protocolId);
  if (typeof protocol === "undefined") {
    protocol = new Protocol(protocolId);
    protocol.network = Network;
    protocol.chainId = ChainId;
    protocol.contractVersion = Version;
    protocol.publicMarketCount = BI_ZERO;
    protocol.totalValueLocked = BI_ZERO;
    protocol.protocolFee = BI_ZERO;
    protocol.insuranceFundBalance = BI_ZERO;
    protocol.maxMarketsPerAccount = 0;
    protocol.imRatio = 0;
    protocol.mmRatio = 0;
    protocol.rewardRatio = 0;
    protocol.smoothEmaTime = 0;
    protocol.protocolFeeRatio = 0;
    protocol.timestamp = BI_ZERO;
    await protocol.save();
  }
  return protocol;
}

export async function getOrCreateTraderTakerInfo(
  traderAddr: string,
  marketAddr: string
): Promise<TraderTakerInfo> {
  let traderTakerInfo = await TraderTakerInfo.get(
    `${traderAddr}-${marketAddr}`
  );
  if (typeof traderTakerInfo === "undefined") {
    traderTakerInfo = new TraderTakerInfo(`${traderAddr}-${marketAddr}`);
    traderTakerInfo.trader = traderAddr;
    traderTakerInfo.market = marketAddr;
    traderTakerInfo.baseBalanceShare = BI_ZERO;
    traderTakerInfo.baseBalance = BI_ZERO;
    traderTakerInfo.quoteBalance = BI_ZERO;
    traderTakerInfo.timestamp = BI_ZERO;
    await traderTakerInfo.save();
  }
  return traderTakerInfo;
}

export async function getOrCreateTraderMakerInfo(
  traderAddr: string,
  marketAddr: string
): Promise<TraderMakerInfo> {
  let traderMakerInfo = await TraderMakerInfo.get(
    `${traderAddr}-${marketAddr}`
  );
  if (typeof traderMakerInfo === "undefined") {
    traderMakerInfo = new TraderMakerInfo(`${traderAddr}-${marketAddr}`);
    traderMakerInfo.trader = traderAddr;
    traderMakerInfo.market = marketAddr;
    traderMakerInfo.liquidity = BI_ZERO;
    traderMakerInfo.cumBaseSharePerLiquidityX96 = BI_ZERO;
    traderMakerInfo.cumQuotePerLiquidityX96 = BI_ZERO;
    traderMakerInfo.timestamp = BI_ZERO;
    await traderMakerInfo.save();
  }
  return traderMakerInfo;
}

export async function getOrCreateMarket(marketAddr: string): Promise<Market> {
  let market = await Market.get(marketAddr);
  if (typeof market === "undefined") {
    market = new Market(marketAddr);
    market.baseToken = STR_ZERO;
    market.quoteToken = STR_ZERO;
    market.baseAmount = BI_ZERO;
    market.quoteAmount = BI_ZERO;
    market.liquidity = BI_ZERO;
    market.baseBalancePerShareX96 = BI_ZERO;
    market.sharePriceAfterX96 = BI_ZERO;
    market.markPriceX96 = BI_ZERO;
    market.cumBasePerLiquidityX96 = BI_ZERO;
    market.cumQuotePerLiquidityX96 = BI_ZERO;
    market.poolFeeRatio = 0;
    market.maxPremiumRatio = 0;
    market.fundingMaxElapsedSec = 0;
    market.fundingRolloverSec = 0;
    market.normalOrderRatio = 0;
    market.liquidationRatio = 0;
    market.emaNormalOrderRatio = 0;
    market.emaLiquidationRatio = 0;
    market.emaSec = 0;

    market.blockNumberAdded = BI_ZERO;
    market.timestampAdded = BI_ZERO;
    market.timestamp = BI_ZERO;
    await market.save();
  }
  return market;
}

async function doCreateCandle(
  marketAddr: string,
  time: Date,
  timeFormat: number,
  priceX96: bigint,
  baseAmount: bigint,
  quoteAmount: bigint
): Promise<void> {
  let ohlc = await Candle.get(`${marketAddr}-${timeFormat}-${time}`);
  if (typeof ohlc === "undefined") {
    ohlc = new Candle(`${marketAddr}-${timeFormat}-${time}`);
    ohlc.market = marketAddr;
    ohlc.timeFormat = timeFormat;
    ohlc.time = time;
    ohlc.openX96 = priceX96;
    ohlc.highX96 = priceX96;
    ohlc.lowX96 = priceX96;
    ohlc.timestamp = BI_ZERO;
    ohlc.baseAmount = BI_ZERO;
    ohlc.quoteAmount = BI_ZERO;
  }
  if (ohlc.highX96 < priceX96) {
    ohlc.highX96 = priceX96;
  } else if (ohlc.lowX96 > priceX96) {
    ohlc.lowX96 = priceX96;
  }
  ohlc.closeX96 = priceX96;
  ohlc.baseAmount += baseAmount;
  ohlc.quoteAmount += quoteAmount;
  ohlc.timestamp = BigInt(time.getTime());
  await ohlc.save();
}

const roundTime = (time: Date, interval: number) => {
  return new Date(Math.floor(time.getTime() / interval) * interval);
};

export async function createCandle(
  marketAddr: string,
  time: Date,
  sharePriceX96: bigint,
  baseBalancePerShareX96: bigint,
  baseShare: bigint,
  quoteAmount: bigint
): Promise<void> {
  const intervals = [m5, m15, h1, d1];
  const priceX96 = mulDiv(sharePriceX96, Q96, baseBalancePerShareX96);

  for (let i = 0; i < intervals.length; i++) {
    const interval = intervals[i];
    await doCreateCandle(
      marketAddr,
      roundTime(time, interval),
      interval,
      priceX96,
      mulDiv(baseShare, baseBalancePerShareX96, Q96),
      quoteAmount
    );
  }
}

export async function createPositionHistory(
  traderAddr: string,
  marketAddr: string,
  time: Date,
  base: bigint,
  quote: bigint,
  realizesPnl: bigint,
  protocolFee: bigint
): Promise<void> {
  let positionHistory = await PositionHistory.get(
    `${traderAddr}-${marketAddr}`
  );
  if (typeof positionHistory === "undefined") {
    positionHistory = new PositionHistory(`${traderAddr}-${marketAddr}`);
    positionHistory.trader = traderAddr;
    positionHistory.market = marketAddr;
    positionHistory.timestamp = BI_ZERO;
  }
  positionHistory.timestamp = BigInt(time.getTime());
  await positionHistory.save();
  await createPHistory(
    traderAddr,
    marketAddr,
    time,
    base,
    quote,
    realizesPnl,
    protocolFee,
    positionHistory.id
  );
}

async function createPHistory(
  traderAddr: string,
  marketAddr: string,
  time: Date,
  base: bigint,
  quote: bigint,
  realizedPnl: bigint,
  protocolFee: bigint,
  positionHistoryId: string
): Promise<void> {
  let pHistory = await PHistory.get(
    `${traderAddr}-${marketAddr}-` // TODO: fix id
  );
  if (typeof pHistory === "undefined") {
    pHistory = new PHistory(`${traderAddr}-${marketAddr}-`); // TODO: fix id
    pHistory.trader = traderAddr;
    pHistory.market = marketAddr;
    pHistory.time = time;
    pHistory.base = base;
    pHistory.quote = quote;
    pHistory.realizedPnl = realizedPnl;
    pHistory.protocolFee = protocolFee;
    pHistory.positionHistoryId = positionHistoryId;
    pHistory.timestamp = BigInt(time.getTime());
  }
  pHistory.base += base;
  pHistory.quote += quote;
  pHistory.realizedPnl += realizedPnl;
  pHistory.protocolFee += protocolFee;
  await pHistory.save();
}

export async function createLiquidityHistory(
  traderAddr: string,
  marketAddr: string,
  time: Date,
  base: bigint,
  quote: bigint,
  liquidity: bigint
): Promise<void> {
  let liquidityHistory = await LiquidityHistory.get(
    `${traderAddr}-${marketAddr}`
  );
  if (typeof liquidityHistory === "undefined") {
    liquidityHistory = new LiquidityHistory(`${traderAddr}-${marketAddr}`);
    liquidityHistory.trader = traderAddr;
    liquidityHistory.market = marketAddr;
    liquidityHistory.timestamp = BI_ZERO;
  }
  liquidityHistory.timestamp = BigInt(time.getTime());
  await liquidityHistory.save();
  await createLHistory(
    traderAddr,
    marketAddr,
    time,
    base,
    quote,
    liquidity,
    liquidityHistory.id
  );
}

async function createLHistory(
  traderAddr: string,
  marketAddr: string,
  time: Date,
  base: bigint,
  quote: bigint,
  liquidity: bigint,
  liquidityHistoryId: string
): Promise<void> {
  let lHistory = await LHistory.get(
    `${traderAddr}-${marketAddr}-` // TODO: fix id
  );
  if (typeof lHistory === "undefined") {
    lHistory = new LHistory(`${traderAddr}-${marketAddr}-`); // TODO: fix id
    lHistory.trader = traderAddr;
    lHistory.market = marketAddr;
    lHistory.time = time;
    lHistory.base = base;
    lHistory.quote = quote;
    lHistory.liquidity = liquidity;
    lHistory.liquidityHistoryId = liquidityHistoryId;
    lHistory.timestamp = BigInt(time.getTime());
  }
  lHistory.base += base;
  lHistory.quote += quote;
  lHistory.liquidity += liquidity;
  await lHistory.save();
}

export async function getOrCreateDaySummary(
  traderAddr: string,
  time: Date
): Promise<DaySummary> {
  const dayID = Math.floor(time.getTime() / 8640000);
  let daySummary = await DaySummary.get(`${traderAddr}-${dayID}`);
  if (typeof daySummary === "undefined") {
    daySummary = new DaySummary(`${traderAddr}-${dayID}`);
    daySummary.trader = traderAddr;
    daySummary.dayID = dayID;
    daySummary.time = time;
    daySummary.realizedPnl = BI_ZERO;
    daySummary.timestamp = BI_ZERO;
  }
  return daySummary;
}
