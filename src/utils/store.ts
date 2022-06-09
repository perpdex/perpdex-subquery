import { Trader, Protocol, TraderTakerInfo, TraderMakerInfo, OpenOrder, Market, Candle } from '../types';
import { BI_ZERO, STR_ZERO, DATE_ZERO } from './number';
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
    traderMakerInfo.quoteDebt = BI_ZERO;
    traderMakerInfo.liquidity = BI_ZERO;
    traderMakerInfo.blockNumber = BI_ZERO;
    traderMakerInfo.timestamp = BI_ZERO;
    await traderMakerInfo.save();
  }
  return traderMakerInfo;
}

export async function getOrCreateOpenOrder(traderAddr: string, marketAddr: string): Promise<OpenOrder> {
  let openOrder = await OpenOrder.get(`${traderAddr}-${marketAddr}`);
  if (typeof openOrder === 'undefined') {
    openOrder = new OpenOrder(`${traderAddr}-${marketAddr}`);
    openOrder.maker = traderAddr;
    openOrder.market = marketAddr;
    openOrder.baseShare = BI_ZERO;
    openOrder.quote = BI_ZERO;
    openOrder.liquidity = BI_ZERO;
    openOrder.realizedPnl = BI_ZERO;
    openOrder.blockNumber = BI_ZERO;
    openOrder.timestamp = BI_ZERO;
    await openOrder.save();
  }
  return openOrder;
}

export async function getOrCreateMarket(marketAddr: string): Promise<Market> {
  let market = await Market.get(marketAddr);
  if (typeof market === 'undefined') {
    market = new Market(marketAddr);
    market.baseToken = STR_ZERO;
    market.quoteToken = STR_ZERO;
    market.pool = STR_ZERO;
    market.tradingVolume = BI_ZERO;
    market.baseAmount = BI_ZERO;
    market.quoteAmount = BI_ZERO;
    market.liquidity = BI_ZERO;
    market.priceAfterX96 = BI_ZERO;
    market.blockNumberAdded = BI_ZERO;
    market.timestampAdded = BI_ZERO;
    market.blockNumber = BI_ZERO;
    market.timestamp = BI_ZERO;
    await market.save();
  }
  return market;
}

export async function getOrCreateCandle5m(marketAddr: string, time: Date, price: bigint): Promise<Candle> {
  time.setMinutes(Math.floor(time.getMinutes() / 5) * 5);
  time.setSeconds(0);
  let candle = await Candle.get(`${marketAddr}-${300}-${time}`);
  if (typeof candle === 'undefined') {
    candle = new Candle(marketAddr);
    candle.market = marketAddr;
    candle.timeSecond = 300;
    candle.time = time;
    candle.open = price;
    candle.high = price;
    candle.low = price;
    candle.close = price;
    candle.blockNumber = BI_ZERO;
    candle.timestamp = BI_ZERO;
    await candle.save();
    return candle;
  }
  if (candle.high <= price) {
    candle.high = price;
  } else if (candle.low >= price) {
    candle.low = price;
  }
  candle.close = price;
  return candle;
}

export async function getOrCreateCandle15m(marketAddr: string, time: Date, price: bigint): Promise<Candle> {
  time.setMinutes(Math.floor(time.getMinutes() / 15) * 15);
  time.setSeconds(0);
  let candle = await Candle.get(`${marketAddr}-${900}-${time}`);
  if (typeof candle === 'undefined') {
    candle = new Candle(marketAddr);
    candle.market = marketAddr;
    candle.timeSecond = 900;
    candle.time = time;
    candle.open = price;
    candle.high = price;
    candle.low = price;
    candle.close = price;
    candle.blockNumber = BI_ZERO;
    candle.timestamp = BI_ZERO;
    await candle.save();
    return candle;
  }
  if (candle.high <= price) {
    candle.high = price;
  } else if (candle.low >= price) {
    candle.low = price;
  }
  candle.close = price;
  return candle;
}

export async function getOrCreateCandle1h(marketAddr: string, time: Date, price: bigint): Promise<Candle> {
  time.setMinutes(0);
  time.setSeconds(0);
  let candle = await Candle.get(`${marketAddr}-${3600}-${time}`);
  if (typeof candle === 'undefined') {
    candle = new Candle(marketAddr);
    candle.market = marketAddr;
    candle.timeSecond = 3600;
    candle.time = time;
    candle.open = price;
    candle.high = price;
    candle.low = price;
    candle.close = price;
    candle.blockNumber = BI_ZERO;
    candle.timestamp = BI_ZERO;
    await candle.save();
    return candle;
  }
  if (candle.high <= price) {
    candle.high = price;
  } else if (candle.low >= price) {
    candle.low = price;
  }
  candle.close = price;
  return candle;
}

export async function getOrCreateCandle1d(marketAddr: string, time: Date, price: bigint): Promise<Candle> {
  time.setHours(0);
  time.setMinutes(0);
  time.setSeconds(0);
  let candle = await Candle.get(`${marketAddr}-${86400}-${time}`);
  if (typeof candle === 'undefined') {
    candle = new Candle(marketAddr);
    candle.market = marketAddr;
    candle.timeSecond = 86400;
    candle.time = time;
    candle.open = price;
    candle.high = price;
    candle.low = price;
    candle.close = price;
    candle.blockNumber = BI_ZERO;
    candle.timestamp = BI_ZERO;
    await candle.save();
    return candle;
  }
  if (candle.high <= price) {
    candle.high = price;
  } else if (candle.low >= price) {
    candle.low = price;
  }
  candle.close = price;
  return candle;
}