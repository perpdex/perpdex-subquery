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
  OHLC,
  DaySummary,
} from '../types';
import { BI_ZERO, STR_ZERO, m5, m15, h1, d1 } from './constant';
import { ChainId, Network, Version } from '../constants/index';

export function getBlockNumberLogIndex(blockNumber: number, logIndex: number): bigint {
  return BigInt(blockNumber) * BigInt(1000) + BigInt(logIndex);
}

export async function getOrCreateTrader(traderAddr: string): Promise<Trader> {
  let trader = await Trader.get(traderAddr);
  if (typeof trader === 'undefined') {
    trader = new Trader(traderAddr);
    trader.collateralBalance = BI_ZERO;
    trader.markets = [];
    trader.blockNumber = BI_ZERO;
    trader.timestamp = BI_ZERO;
    await trader.save();
  }
  return trader;
}

const protocolId = 'perpdex';

export async function getOrCreateProtocol(): Promise<Protocol> {
  let protocol = await Protocol.get(protocolId);
  if (typeof protocol === 'undefined') {
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
    protocol.blockNumber = BI_ZERO;
    protocol.timestamp = BI_ZERO;
    await protocol.save();
  }
  return protocol;
}

export async function getOrCreateTraderTakerInfo(traderAddr: string, marketAddr: string): Promise<TraderTakerInfo> {
  let traderTakerInfo = await TraderTakerInfo.get(`${traderAddr}-${marketAddr}`);
  if (typeof traderTakerInfo === 'undefined') {
    traderTakerInfo = new TraderTakerInfo(`${traderAddr}-${marketAddr}`);
    traderTakerInfo.trader = traderAddr;
    traderTakerInfo.market = marketAddr;
    traderTakerInfo.baseBalanceShare = BI_ZERO;
    traderTakerInfo.baseBalance = BI_ZERO;
    traderTakerInfo.quoteBalance = BI_ZERO;
    traderTakerInfo.blockNumber = BI_ZERO;
    traderTakerInfo.timestamp = BI_ZERO;
    await traderTakerInfo.save();
  }
  return traderTakerInfo;
}

export async function getOrCreateTraderMakerInfo(traderAddr: string, marketAddr: string): Promise<TraderMakerInfo> {
  let traderMakerInfo = await TraderMakerInfo.get(`${traderAddr}-${marketAddr}`);
  if (typeof traderMakerInfo === 'undefined') {
    traderMakerInfo = new TraderMakerInfo(`${traderAddr}-${marketAddr}`);
    traderMakerInfo.trader = traderAddr;
    traderMakerInfo.market = marketAddr;
    traderMakerInfo.liquidity = BI_ZERO;
    traderMakerInfo.cumBaseSharePerLiquidityX96 = BI_ZERO;
    traderMakerInfo.cumQuotePerLiquidityX96 = BI_ZERO;
    traderMakerInfo.blockNumber = BI_ZERO;
    traderMakerInfo.timestamp = BI_ZERO;
    await traderMakerInfo.save();
  }
  return traderMakerInfo;
}

export async function getOrCreateMarket(marketAddr: string): Promise<Market> {
  let market = await Market.get(marketAddr);
  if (typeof market === 'undefined') {
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
    market.blockNumber = BI_ZERO;
    market.timestamp = BI_ZERO;
    await market.save();
  }
  return market;
}

export async function createOHLC(
  marketAddr: string,
  time: Date,
  timeFormat: number,
  price: bigint,
  candleID: string,
  blockNumber: bigint
): Promise<void> {
  let ohlc = await OHLC.get(`${marketAddr}-${timeFormat}-${time}`);
  if (typeof ohlc === 'undefined') {
    ohlc = new OHLC(`${marketAddr}-${timeFormat}-${time}`);
    ohlc.market = marketAddr;
    ohlc.time = time;
    ohlc.open = price;
    ohlc.high = price;
    ohlc.low = price;
    ohlc.close = price;
    ohlc.blockNumber = BI_ZERO;
    ohlc.timestamp = BI_ZERO;
  }
  if (ohlc.high < price) {
    ohlc.high = price;
  } else if (ohlc.low > price) {
    ohlc.low = price;
  }
  ohlc.close = price;
  ohlc.candleId = candleID;
  ohlc.blockNumber = blockNumber;
  ohlc.timestamp = BigInt(time.getTime());
  await ohlc.save();
}

export async function getOrCreateCandle5m(
  marketAddr: string,
  time: Date,
  price: bigint,
  blockNumber: bigint
): Promise<void> {
  let candle = await Candle.get(`${marketAddr}-${m5}`);
  if (typeof candle === 'undefined') {
    candle = new Candle(`${marketAddr}-${m5}`);
    candle.market = marketAddr;
    candle.timeFormat = m5;
    candle.blockNumber = BI_ZERO;
    candle.timestamp = BI_ZERO;
  }
  candle.blockNumber = blockNumber;
  candle.timestamp = BigInt(time.getTime());
  await candle.save();
  time.setMinutes(Math.floor(time.getMinutes() / 5) * 5);
  time.setSeconds(0);
  time.setMilliseconds(0);
  await createOHLC(marketAddr, time, m5, price, candle.id, blockNumber);
}

export async function getOrCreateCandle15m(
  marketAddr: string,
  time: Date,
  price: bigint,
  blockNumber: bigint
): Promise<void> {
  let candle = await Candle.get(`${marketAddr}-${m15}`);
  if (typeof candle === 'undefined') {
    candle = new Candle(`${marketAddr}-${m15}`);
    candle.market = marketAddr;
    candle.timeFormat = m15;
    candle.blockNumber = BI_ZERO;
    candle.timestamp = BI_ZERO;
  }
  candle.blockNumber = blockNumber;
  candle.timestamp = BigInt(time.getTime());
  await candle.save();
  time.setMinutes(Math.floor(time.getMinutes() / 15) * 15);
  time.setSeconds(0);
  time.setMilliseconds(0);
  await createOHLC(marketAddr, time, m15, price, candle.id, blockNumber);
}

export async function getOrCreateCandle1h(
  marketAddr: string,
  time: Date,
  price: bigint,
  blockNumber: bigint
): Promise<void> {
  time.setMinutes(0);
  time.setSeconds(0);
  let candle = await Candle.get(`${marketAddr}-${h1}`);
  if (typeof candle === 'undefined') {
    candle = new Candle(`${marketAddr}-${h1}`);
    candle.market = marketAddr;
    candle.timeFormat = h1;
    candle.blockNumber = BI_ZERO;
    candle.timestamp = BI_ZERO;
  }
  candle.blockNumber = blockNumber;
  candle.timestamp = BigInt(time.getTime());
  await candle.save();
  time.setMinutes(0);
  time.setSeconds(0);
  time.setMilliseconds(0);
  await createOHLC(marketAddr, time, h1, price, candle.id, blockNumber);
}

export async function getOrCreateCandle1d(
  marketAddr: string,
  time: Date,
  price: bigint,
  blockNumber: bigint
): Promise<void> {
  let candle = await Candle.get(`${marketAddr}-${d1}`);
  if (typeof candle === 'undefined') {
    candle = new Candle(`${marketAddr}-${d1}`);
    candle.market = marketAddr;
    candle.timeFormat = d1;
    candle.blockNumber = BI_ZERO;
    candle.timestamp = BI_ZERO;
  }
  candle.blockNumber = blockNumber;
  candle.timestamp = BigInt(time.getTime());
  await candle.save();
  time.setHours(0);
  time.setMinutes(0);
  time.setSeconds(0);
  time.setMilliseconds(0);
  await createOHLC(marketAddr, time, d1, price, candle.id, blockNumber);
}

export async function getOrCreateCandle(
  marketAddr: string,
  time: Date,
  price: bigint,
  blockNumber: bigint
): Promise<void> {
  await getOrCreateCandle5m(marketAddr, time, price, blockNumber);
  await getOrCreateCandle15m(marketAddr, time, price, blockNumber);
  await getOrCreateCandle1h(marketAddr, time, price, blockNumber);
  await getOrCreateCandle1d(marketAddr, time, price, blockNumber);
}

export async function createPositionHistory(
  traderAddr: string,
  marketAddr: string,
  time: Date,
  base: bigint,
  quote: bigint,
  realizesPnl: bigint,
  protocolFee: bigint,
  blockNumber: bigint
): Promise<void> {
  let positionHistory = await PositionHistory.get(`${traderAddr}-${marketAddr}`);
  if (typeof positionHistory === 'undefined') {
    positionHistory = new PositionHistory(`${traderAddr}-${marketAddr}`);
    positionHistory.trader = traderAddr;
    positionHistory.market = marketAddr;
    positionHistory.blockNumber = BI_ZERO;
    positionHistory.timestamp = BI_ZERO;
  }
  positionHistory.blockNumber = blockNumber;
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
    positionHistory.id,
    blockNumber
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
  positionHistoryId: string,
  blockNumber: bigint
): Promise<void> {
  let pHistory = await PHistory.get(`${traderAddr}-${marketAddr}-${blockNumber}`);
  if (typeof pHistory === 'undefined') {
    pHistory = new PHistory(`${traderAddr}-${marketAddr}-${blockNumber}`);
    pHistory.trader = traderAddr;
    pHistory.market = marketAddr;
    pHistory.time = time;
    pHistory.base = base;
    pHistory.quote = quote;
    pHistory.realizedPnl = realizedPnl;
    pHistory.protocolFee = protocolFee;
    pHistory.positionHistoryId = positionHistoryId;
    pHistory.blockNumber = blockNumber;
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
  liquidity: bigint,
  blockNumber: bigint
): Promise<void> {
  let liquidityHistory = await LiquidityHistory.get(`${traderAddr}-${marketAddr}`);
  if (typeof liquidityHistory === 'undefined') {
    liquidityHistory = new LiquidityHistory(`${traderAddr}-${marketAddr}`);
    liquidityHistory.trader = traderAddr;
    liquidityHistory.market = marketAddr;
    liquidityHistory.blockNumber = BI_ZERO;
    liquidityHistory.timestamp = BI_ZERO;
  }
  liquidityHistory.blockNumber = blockNumber;
  liquidityHistory.timestamp = BigInt(time.getTime());
  await liquidityHistory.save();
  await createLHistory(traderAddr, marketAddr, time, base, quote, liquidity, liquidityHistory.id, blockNumber);
}

async function createLHistory(
  traderAddr: string,
  marketAddr: string,
  time: Date,
  base: bigint,
  quote: bigint,
  liquidity: bigint,
  liquidityHistoryId: string,
  blockNumber: bigint
): Promise<void> {
  let lHistory = await LHistory.get(`${traderAddr}-${marketAddr}-${blockNumber}`);
  if (typeof lHistory === 'undefined') {
    lHistory = new LHistory(`${traderAddr}-${marketAddr}-${blockNumber}`);
    lHistory.trader = traderAddr;
    lHistory.market = marketAddr;
    lHistory.time = time;
    lHistory.base = base;
    lHistory.quote = quote;
    lHistory.liquidity = liquidity;
    lHistory.liquidityHistoryId = liquidityHistoryId;
    lHistory.blockNumber = blockNumber;
    lHistory.timestamp = BigInt(time.getTime());
  }
  lHistory.base += base;
  lHistory.quote += quote;
  lHistory.liquidity += liquidity;
  await lHistory.save();
}

export async function getOrCreateDaySummary(traderAddr: string, time: Date): Promise<DaySummary> {
  const dayID = Math.floor(time.getTime() / 8640000);
  let daySummary = await DaySummary.get(`${traderAddr}-${dayID}`);
  if (typeof daySummary === 'undefined') {
    daySummary = new DaySummary(`${traderAddr}-${dayID}`);
    daySummary.trader = traderAddr;
    daySummary.dayID = dayID;
    daySummary.time = time;
    daySummary.realizedPnl = BI_ZERO;
    daySummary.blockNumber = BI_ZERO;
    daySummary.timestamp = BI_ZERO;
  }
  return daySummary;
}
