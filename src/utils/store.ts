import {
  Trader,
  Protocol,
  TraderTakerInfo,
  TraderMakerInfo,
  Position,
  OpenOrder,
  Market,
  Candle,
  OHLC,
} from '../types';
import { BI_ZERO, STR_ZERO, m5, m15, h1, d1 } from './constant';
import { ChainId, Network, Version } from '../constants/index';

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
    protocol.tradingVolume = BI_ZERO;
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
    traderMakerInfo.baseDebtShare = BI_ZERO;
    traderMakerInfo.baseDebtBalance = BI_ZERO;
    traderMakerInfo.quoteDebt = BI_ZERO;
    traderMakerInfo.liquidity = BI_ZERO;
    traderMakerInfo.cumBaseSharePerLiquidityX96 = BI_ZERO;
    traderMakerInfo.cumQuotePerLiquidityX96 = BI_ZERO;
    traderMakerInfo.blockNumber = BI_ZERO;
    traderMakerInfo.timestamp = BI_ZERO;
    await traderMakerInfo.save();
  }
  return traderMakerInfo;
}

export async function getOrCreatePosition(traderAddr: string, marketAddr: string): Promise<Position> {
  let position = await Position.get(`${traderAddr}-${marketAddr}`);
  if (typeof position === 'undefined') {
    position = new Position(`${traderAddr}-${marketAddr}`);
    position.trader = traderAddr;
    position.market = marketAddr;
    position.baseShare = BI_ZERO;
    position.baseBalance = BI_ZERO;
    position.openNotional = BI_ZERO;
    position.entryPrice = BI_ZERO;
    position.realizedPnl = BI_ZERO;
    position.tradingVolume = BI_ZERO;
    position.blockNumber = BI_ZERO;
    position.timestamp = BI_ZERO;
    await position.save();
  }
  return position;
}

export async function getOrCreateOpenOrder(traderAddr: string, marketAddr: string): Promise<OpenOrder> {
  let openOrder = await OpenOrder.get(`${traderAddr}-${marketAddr}`);
  if (typeof openOrder === 'undefined') {
    openOrder = new OpenOrder(`${traderAddr}-${marketAddr}`);
    openOrder.maker = traderAddr;
    openOrder.market = marketAddr;
    openOrder.base = BI_ZERO;
    openOrder.quote = BI_ZERO;
    openOrder.liquidity = BI_ZERO;
    openOrder.realizedPnl = BI_ZERO;
    openOrder.blockNumber = BI_ZERO;
    openOrder.timestamp = BI_ZERO;
    openOrder.traderMakerInfoRefId = STR_ZERO;
    openOrder.marketRefId = STR_ZERO;
  }
  return openOrder;
}

export async function getOrCreateMarket(marketAddr: string): Promise<Market> {
  let market = await Market.get(marketAddr);
  if (typeof market === 'undefined') {
    market = new Market(marketAddr);
    market.baseToken = STR_ZERO;
    market.quoteToken = STR_ZERO;
    market.tradingVolume = BI_ZERO;
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
