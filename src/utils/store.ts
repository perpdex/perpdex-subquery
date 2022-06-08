import { Trader, Protocol } from '../types';
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
