import {
  Deposited,
  Withdrawn,
  InsuranceFundTransferred,
  ProtocolFeeTransferred,
  LiquidityAddedExchange,
} from '../types';
import { FrontierEvmEvent } from '@subql/contract-processors/dist/frontierEvm';
import { BigNumber } from 'ethers';
import {
  getOrCreateTrader,
  getOrCreateProtocol,
  getOrCreateTraderMakerInfo,
  getOrCreateOpenOrder,
  getOrCreateMarket,
  getOrCreateCandle5m,
  getOrCreateCandle15m,
  getOrCreateCandle1h,
  getOrCreateCandle1d,
} from '../utils/store';
import { getBadDebt } from '../utils/model';
import { str_plus, str_minus } from '../utils/number';

type DepositedArgs = [string, BigNumber] & { trader: string; amount: BigNumber };
type WithdrawnArgs = [string, BigNumber] & { trader: string; amount: BigNumber };
type InsuranceFundTransferredArgs = [string, BigNumber] & { trader: string; amount: BigNumber };
type ProtocolFeeTransferredArgs = [string, BigNumber] & { trader: string; amount: BigNumber };
type LiquidityAddedExchangeArgs = [string, string, BigNumber, BigNumber, BigNumber, BigNumber, BigNumber] & {
  trader: string;
  market: string;
  base: BigNumber;
  quote: BigNumber;
  liquidity: BigNumber;
  baseBalancePerShare: BigNumber;
  priceAfterX96: BigNumber;
};

export async function handleDeposited(event: FrontierEvmEvent<DepositedArgs>): Promise<void> {
  const deposited = new Deposited(`${event.transactionHash}-${event.logIndex.toString()}`);
  deposited.txHash = event.transactionHash;
  deposited.trader = event.args.trader;
  deposited.amount = event.args.amount.toBigInt();
  deposited.blockNumberLogIndex = BigInt(event.blockNumber) * BigInt(1000) + BigInt(event.logIndex);
  deposited.blockNumber = BigInt(event.blockNumber);
  deposited.timestamp = BigInt(event.blockTimestamp.getTime());

  const trader = await getOrCreateTrader(event.args.trader);
  trader.collateralBalance = trader.collateralBalance + deposited.amount;
  trader.blockNumber = BigInt(event.blockNumber);
  trader.timestamp = BigInt(event.blockTimestamp.getTime());

  const protocol = await getOrCreateProtocol();
  protocol.blockNumber = BigInt(event.blockNumber);
  protocol.timestamp = BigInt(event.blockTimestamp.getTime());

  await deposited.save();
  await trader.save();
  await protocol.save();
}

export async function handleWithdrawn(event: FrontierEvmEvent<WithdrawnArgs>): Promise<void> {
  const withdrawn = new Withdrawn(`${event.transactionHash}-${event.logIndex.toString()}`);
  withdrawn.txHash = event.transactionHash;
  withdrawn.trader = event.args.trader;
  withdrawn.amount = event.args.amount.toBigInt();
  withdrawn.blockNumberLogIndex = BigInt(event.blockNumber) * BigInt(1000) + BigInt(event.logIndex);
  withdrawn.blockNumber = BigInt(event.blockNumber);
  withdrawn.timestamp = BigInt(event.blockTimestamp.getTime());

  const trader = await getOrCreateTrader(event.args.trader);
  trader.collateralBalance = trader.collateralBalance - withdrawn.amount;
  trader.blockNumber = BigInt(event.blockNumber);
  trader.timestamp = BigInt(event.blockTimestamp.getTime());

  const protocol = await getOrCreateProtocol();
  protocol.blockNumber = BigInt(event.blockNumber);
  protocol.timestamp = BigInt(event.blockTimestamp.getTime());

  await withdrawn.save();
  await trader.save();
  await protocol.save();
}

export async function handleInsuranceFundTransferred(
  event: FrontierEvmEvent<InsuranceFundTransferredArgs>
): Promise<void> {
  const insuranceFundTransferred = new InsuranceFundTransferred(
    `${event.transactionHash}-${event.logIndex.toString()}`
  );
  insuranceFundTransferred.txHash = event.transactionHash;
  insuranceFundTransferred.trader = event.args.trader;
  insuranceFundTransferred.amount = event.args.amount.toBigInt();
  insuranceFundTransferred.blockNumberLogIndex = BigInt(event.blockNumber) * BigInt(1000) + BigInt(event.logIndex);
  insuranceFundTransferred.blockNumber = BigInt(event.blockNumber);
  insuranceFundTransferred.timestamp = BigInt(event.blockTimestamp.getTime());

  const trader = await getOrCreateTrader(event.args.trader);
  trader.collateralBalance = trader.collateralBalance + insuranceFundTransferred.amount;
  trader.blockNumber = BigInt(event.blockNumber);
  trader.timestamp = BigInt(event.blockTimestamp.getTime());

  const protocol = await getOrCreateProtocol();
  protocol.insuranceFundBalance = protocol.insuranceFundBalance - insuranceFundTransferred.amount;
  protocol.blockNumber = BigInt(event.blockNumber);
  protocol.timestamp = BigInt(event.blockTimestamp.getTime());

  await insuranceFundTransferred.save();
  await trader.save();
  await protocol.save();
}

export async function handleProtocolFeeTransferred(event: FrontierEvmEvent<ProtocolFeeTransferredArgs>): Promise<void> {
  const protocolFeeTransferred = new ProtocolFeeTransferred(`${event.transactionHash}-${event.logIndex.toString()}`);
  protocolFeeTransferred.txHash = event.transactionHash;
  protocolFeeTransferred.trader = event.args.trader;
  protocolFeeTransferred.amount = event.args.amount.toBigInt();
  protocolFeeTransferred.blockNumberLogIndex = BigInt(event.blockNumber) * BigInt(1000) + BigInt(event.logIndex);
  protocolFeeTransferred.blockNumber = BigInt(event.blockNumber);
  protocolFeeTransferred.timestamp = BigInt(event.blockTimestamp.getTime());

  const trader = await getOrCreateTrader(event.args.trader);
  trader.collateralBalance = trader.collateralBalance + protocolFeeTransferred.amount;
  trader.blockNumber = BigInt(event.blockNumber);
  trader.timestamp = BigInt(event.blockTimestamp.getTime());

  const protocol = await getOrCreateProtocol();
  protocol.insuranceFundBalance = protocol.insuranceFundBalance - protocolFeeTransferred.amount;
  protocol.blockNumber = BigInt(event.blockNumber);
  protocol.timestamp = BigInt(event.blockTimestamp.getTime());

  await protocolFeeTransferred.save();
  await trader.save();
  await protocol.save();
}

export async function handleLiquidityAddedExchange(event: FrontierEvmEvent<LiquidityAddedExchangeArgs>): Promise<void> {
  const liquidityAddedExchange = new LiquidityAddedExchange(`${event.transactionHash}-${event.logIndex.toString()}`);
  liquidityAddedExchange.txHash = event.transactionHash;
  liquidityAddedExchange.trader = event.args.trader;
  liquidityAddedExchange.market = event.args.market;
  liquidityAddedExchange.base = event.args.base.toBigInt();
  liquidityAddedExchange.quote = event.args.quote.toBigInt();
  liquidityAddedExchange.liquidity = event.args.liquidity.toBigInt();
  liquidityAddedExchange.baseBalancePerShare = event.args.baseBalancePerShare.toBigInt();
  liquidityAddedExchange.priceAfterX96 = event.args.priceAfterX96.toBigInt();
  liquidityAddedExchange.blockNumberLogIndex = BigInt(event.blockNumber) * BigInt(1000) + BigInt(event.logIndex);
  liquidityAddedExchange.blockNumber = BigInt(event.blockNumber);
  liquidityAddedExchange.timestamp = BigInt(event.blockTimestamp.getTime());

  const trader = await getOrCreateTrader(event.args.trader);
  trader.markets.push(liquidityAddedExchange.trader);
  trader.markets = [...new Set(trader.markets)]; // duplicate deletion
  trader.blockNumber = BigInt(event.blockNumber);
  trader.timestamp = BigInt(event.blockTimestamp.getTime());

  const traderMakerInfo = await getOrCreateTraderMakerInfo(event.args.trader, event.args.market);
  traderMakerInfo.baseDebtShare = traderMakerInfo.baseDebtShare + event.args.base.toBigInt();
  traderMakerInfo.baseDebtBalance = traderMakerInfo.baseDebtShare * event.args.baseBalancePerShare.toBigInt();
  traderMakerInfo.quoteDebt = traderMakerInfo.quoteDebt + event.args.quote.toBigInt();
  traderMakerInfo.liquidity = traderMakerInfo.liquidity + event.args.liquidity.toBigInt();
  traderMakerInfo.blockNumber = BigInt(event.blockNumber);
  traderMakerInfo.timestamp = BigInt(event.blockTimestamp.getTime());

  const openOrder = await getOrCreateOpenOrder(event.args.trader, event.args.market);
  openOrder.baseShare = openOrder.baseShare + event.args.base.toBigInt();
  openOrder.quote = openOrder.quote + event.args.quote.toBigInt();
  openOrder.liquidity = openOrder.liquidity + event.args.liquidity.toBigInt();
  openOrder.blockNumber = BigInt(event.blockNumber);
  openOrder.timestamp = BigInt(event.blockTimestamp.getTime());

  const market = await getOrCreateMarket(event.args.market);
  market.baseAmount = market.baseAmount + event.args.base.toBigInt();
  market.quoteAmount = market.quoteAmount + event.args.quote.toBigInt();
  market.liquidity = market.liquidity + event.args.liquidity.toBigInt();
  market.priceAfterX96 = event.args.priceAfterX96.toBigInt();
  market.blockNumberAdded = BigInt(event.blockNumber);
  market.timestampAdded = BigInt(event.blockTimestamp.getTime());
  market.blockNumber = BigInt(event.blockNumber);
  market.timestamp = BigInt(event.blockTimestamp.getTime());

  const candle5m = await getOrCreateCandle5m(
    event.args.market,
    event.blockTimestamp,
    event.args.priceAfterX96.toBigInt()
  );
  candle5m.blockNumber = BigInt(event.blockNumber);
  candle5m.timestamp = BigInt(event.blockTimestamp.getTime());
  const candle15m = await getOrCreateCandle15m(
    event.args.market,
    event.blockTimestamp,
    event.args.priceAfterX96.toBigInt()
  );
  candle15m.blockNumber = BigInt(event.blockNumber);
  candle15m.timestamp = BigInt(event.blockTimestamp.getTime());
  const candle1h = await getOrCreateCandle1h(
    event.args.market,
    event.blockTimestamp,
    event.args.priceAfterX96.toBigInt()
  );
  candle1h.blockNumber = BigInt(event.blockNumber);
  candle1h.timestamp = BigInt(event.blockTimestamp.getTime());
  const candle1d = await getOrCreateCandle1d(
    event.args.market,
    event.blockTimestamp,
    event.args.priceAfterX96.toBigInt()
  );
  candle1d.blockNumber = BigInt(event.blockNumber);
  candle1d.timestamp = BigInt(event.blockTimestamp.getTime());

  await liquidityAddedExchange.save();
  await trader.save();
  await traderMakerInfo.save();
  await openOrder.save();
  await market.save();
  await candle5m.save();
  await candle15m.save();
  await candle1h.save();
  await candle1d.save();
}
