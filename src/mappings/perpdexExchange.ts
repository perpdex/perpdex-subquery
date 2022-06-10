import {
  Deposited,
  Withdrawn,
  InsuranceFundTransferred,
  ProtocolFeeTransferred,
  LiquidityAddedExchange,
  LiquidityRemovedExchange,
  PositionLiquidated,
  PositionChanged,
} from '../types';
import { FrontierEvmEvent } from '@subql/contract-processors/dist/frontierEvm';
import { BigNumber } from 'ethers';
import {
  getOrCreateTrader,
  getOrCreateProtocol,
  getOrCreateTraderTakerInfo,
  getOrCreateTraderMakerInfo,
  getOrCreatePosition,
  getOrCreateOpenOrder,
  getOrCreateMarket,
  getOrCreateCandle,
} from '../utils/store';

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
type LiquidityRemovedExchangeArgs = [
  string,
  string,
  string,
  BigNumber,
  BigNumber,
  BigNumber,
  BigNumber,
  BigNumber,
  BigNumber,
  BigNumber,
  BigNumber
] & {
  trader: string;
  market: string;
  liquidator: string;
  base: BigNumber;
  quote: BigNumber;
  liquidity: BigNumber;
  takerBase: BigNumber;
  takerQuote: BigNumber;
  realizedPnl: BigNumber;
  baseBalancePerShare: BigNumber;
  priceAfterX96: BigNumber;
};
type PositionLiquidatedArgs = [
  string,
  string,
  string,
  BigNumber,
  BigNumber,
  BigNumber,
  BigNumber,
  BigNumber,
  BigNumber,
  BigNumber,
  BigNumber
] & {
  trader: string;
  market: string;
  liquidator: string;
  base: BigNumber;
  quote: BigNumber;
  realizedPnl: BigNumber;
  protocolFee: BigNumber;
  baseBalancePerShareX96: BigNumber;
  sharePriceAfterX96: BigNumber;
  liquidationReward: BigNumber;
  insuranceFundReward: BigNumber;
};
type PositionChangedArgs = [
  string,
  string,
  string,
  BigNumber,
  BigNumber,
  BigNumber,
  BigNumber,
  BigNumber,
  BigNumber
] & {
  trader: string;
  market: string;
  base: BigNumber;
  quote: BigNumber;
  realizedPnl: BigNumber;
  protocolFee: BigNumber;
  baseBalancePerShareX96: BigNumber;
  sharePriceAfterX96: BigNumber;
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
  protocol.protocolFee = protocol.protocolFee - protocolFeeTransferred.amount;
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
  liquidityAddedExchange.baseBalancePerShareX96 = event.args.baseBalancePerShare.toBigInt();
  liquidityAddedExchange.sharePriceAfterX96 = event.args.priceAfterX96.toBigInt();
  liquidityAddedExchange.blockNumberLogIndex = BigInt(event.blockNumber) * BigInt(1000) + BigInt(event.logIndex);
  liquidityAddedExchange.blockNumber = BigInt(event.blockNumber);
  liquidityAddedExchange.timestamp = BigInt(event.blockTimestamp.getTime());

  const trader = await getOrCreateTrader(event.args.trader);
  trader.markets.push(liquidityAddedExchange.market);
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
  market.priceAfterX96 = event.args.priceAfterX96.toBigInt();
  market.blockNumber = BigInt(event.blockNumber);
  market.timestamp = BigInt(event.blockTimestamp.getTime());

  await getOrCreateCandle(
    event.args.market,
    event.blockTimestamp,
    event.args.priceAfterX96.toBigInt(),
    BigInt(event.blockNumber)
  );

  await liquidityAddedExchange.save();
  await trader.save();
  await traderMakerInfo.save();
  await openOrder.save();
  await market.save();
}

export async function handleLiquidityRemovedExchange(
  event: FrontierEvmEvent<LiquidityRemovedExchangeArgs>
): Promise<void> {
  const liquidityRemovedExchange = new LiquidityRemovedExchange(
    `${event.transactionHash}-${event.logIndex.toString()}`
  );
  liquidityRemovedExchange.txHash = event.transactionHash;
  liquidityRemovedExchange.trader = event.args.trader;
  liquidityRemovedExchange.market = event.args.market;
  liquidityRemovedExchange.liquidator = event.args.liquidator;
  liquidityRemovedExchange.base = event.args.base.toBigInt();
  liquidityRemovedExchange.quote = event.args.quote.toBigInt();
  liquidityRemovedExchange.liquidity = event.args.liquidity.toBigInt();
  liquidityRemovedExchange.takerBase = event.args.takerBase.toBigInt();
  liquidityRemovedExchange.takerQuote = event.args.takerQuote.toBigInt();
  liquidityRemovedExchange.realizedPnl = event.args.realizedPnl.toBigInt();
  liquidityRemovedExchange.baseBalancePerShareX96 = event.args.baseBalancePerShare.toBigInt();
  liquidityRemovedExchange.sharePriceAfterX96 = event.args.priceAfterX96.toBigInt();
  liquidityRemovedExchange.blockNumberLogIndex = BigInt(event.blockNumber) * BigInt(1000) + BigInt(event.logIndex);
  liquidityRemovedExchange.blockNumber = BigInt(event.blockNumber);
  liquidityRemovedExchange.timestamp = BigInt(event.blockTimestamp.getTime());

  const trader = await getOrCreateTrader(event.args.trader);
  trader.markets.push(liquidityRemovedExchange.trader);
  trader.markets = [...new Set(trader.markets)]; // duplicate deletion
  trader.collateralBalance = trader.collateralBalance + event.args.realizedPnl.toBigInt();
  trader.blockNumber = BigInt(event.blockNumber);
  trader.timestamp = BigInt(event.blockTimestamp.getTime());

  const traderTakerInfo = await getOrCreateTraderTakerInfo(event.args.trader, event.args.market);
  traderTakerInfo.baseBalanceShare = traderTakerInfo.baseBalanceShare + event.args.takerBase.toBigInt();
  traderTakerInfo.baseBalance = traderTakerInfo.baseBalanceShare * event.args.baseBalancePerShare.toBigInt();
  traderTakerInfo.quoteBalance =
    traderTakerInfo.quoteBalance + event.args.takerQuote.toBigInt() - event.args.realizedPnl.toBigInt();
  traderTakerInfo.blockNumber = BigInt(event.blockNumber);
  traderTakerInfo.timestamp = BigInt(event.blockTimestamp.getTime());

  const traderMakerInfo = await getOrCreateTraderMakerInfo(event.args.trader, event.args.market);
  traderMakerInfo.baseDebtShare =
    traderMakerInfo.baseDebtShare - event.args.base.toBigInt() + event.args.takerBase.toBigInt();
  traderMakerInfo.baseDebtBalance = traderMakerInfo.baseDebtShare * event.args.baseBalancePerShare.toBigInt();
  traderMakerInfo.quoteDebt =
    traderMakerInfo.quoteDebt - event.args.quote.toBigInt() + event.args.takerQuote.toBigInt();
  traderMakerInfo.liquidity = traderMakerInfo.liquidity - event.args.liquidity.toBigInt();
  traderMakerInfo.blockNumber = BigInt(event.blockNumber);
  traderMakerInfo.timestamp = BigInt(event.blockTimestamp.getTime());

  const openOrder = await getOrCreateOpenOrder(event.args.trader, event.args.market);
  openOrder.baseShare = openOrder.baseShare - event.args.base.toBigInt() + event.args.takerBase.toBigInt();
  openOrder.quote = openOrder.quote - event.args.quote.toBigInt() + event.args.takerQuote.toBigInt();
  openOrder.liquidity = openOrder.liquidity - event.args.liquidity.toBigInt();
  openOrder.blockNumber = BigInt(event.blockNumber);
  openOrder.timestamp = BigInt(event.blockTimestamp.getTime());

  const market = await getOrCreateMarket(event.args.market);
  market.priceAfterX96 = event.args.priceAfterX96.toBigInt();
  market.blockNumber = BigInt(event.blockNumber);
  market.timestamp = BigInt(event.blockTimestamp.getTime());

  await getOrCreateCandle(
    event.args.market,
    event.blockTimestamp,
    event.args.priceAfterX96.toBigInt(),
    BigInt(event.blockNumber)
  );

  await liquidityRemovedExchange.save();
  await trader.save();
  await traderTakerInfo.save();
  await traderMakerInfo.save();
  await openOrder.save();
  await market.save();
}

export async function handlePositionLiquidated(event: FrontierEvmEvent<PositionLiquidatedArgs>): Promise<void> {
  const positionLiquidated = new PositionLiquidated(`${event.transactionHash}-${event.logIndex.toString()}`);
  positionLiquidated.txHash = event.transactionHash;
  positionLiquidated.trader = event.args.trader;
  positionLiquidated.market = event.args.market;
  positionLiquidated.liquidator = event.args.liquidator;
  positionLiquidated.base = event.args.base.toBigInt();
  positionLiquidated.quote = event.args.quote.toBigInt();
  positionLiquidated.realizedPnl = event.args.realizedPnl.toBigInt();
  positionLiquidated.protocolFee = event.args.protocolFee.toBigInt();
  positionLiquidated.baseBalancePerShareX96 = event.args.baseBalancePerShareX96.toBigInt();
  positionLiquidated.sharePriceAfterX96 = event.args.sharePriceAfterX96.toBigInt();
  positionLiquidated.insuranceFundReward = event.args.insuranceFundReward.toBigInt();
  positionLiquidated.liquidationReward = event.args.liquidationReward.toBigInt();
  positionLiquidated.blockNumberLogIndex = BigInt(event.blockNumber) * BigInt(1000) + BigInt(event.logIndex);
  positionLiquidated.blockNumber = BigInt(event.blockNumber);
  positionLiquidated.timestamp = BigInt(event.blockTimestamp.getTime());

  const protocol = await getOrCreateProtocol();
  protocol.protocolFee = protocol.protocolFee + event.args.protocolFee.toBigInt();
  protocol.insuranceFundBalance = protocol.insuranceFundBalance + event.args.insuranceFundReward.toBigInt();
  protocol.blockNumber = BigInt(event.blockNumber);
  protocol.timestamp = BigInt(event.blockTimestamp.getTime());

  const trader = await getOrCreateTrader(event.args.trader);
  trader.markets.push(positionLiquidated.market);
  trader.markets = [...new Set(trader.markets)]; // duplicate deletion
  trader.collateralBalance = trader.collateralBalance + event.args.realizedPnl.toBigInt();
  trader.blockNumber = BigInt(event.blockNumber);
  trader.timestamp = BigInt(event.blockTimestamp.getTime());

  const liquidator = await getOrCreateTrader(event.args.liquidator);
  liquidator.markets.push(positionLiquidated.market);
  liquidator.markets = [...new Set(liquidator.markets)]; // duplicate deletion
  liquidator.collateralBalance = liquidator.collateralBalance + event.args.liquidationReward.toBigInt();
  liquidator.blockNumber = BigInt(event.blockNumber);
  liquidator.timestamp = BigInt(event.blockTimestamp.getTime());

  const position = await getOrCreatePosition(event.args.trader, event.args.market);
  position.baseShare = position.baseShare + event.args.base.toBigInt();
  position.baseBalance = position.baseBalance * event.args.baseBalancePerShareX96.toBigInt();
  position.openNotional = position.openNotional + event.args.quote.toBigInt() - event.args.realizedPnl.toBigInt();
  position.entryPrice = position.openNotional / position.baseBalance;
  position.blockNumber = BigInt(event.blockNumber);
  position.timestamp = BigInt(event.blockTimestamp.getTime());

  const traderTakerInfo = await getOrCreateTraderTakerInfo(event.args.trader, event.args.market);
  traderTakerInfo.baseBalanceShare = traderTakerInfo.baseBalanceShare + event.args.base.toBigInt();
  traderTakerInfo.baseBalance = traderTakerInfo.baseBalanceShare * event.args.baseBalancePerShareX96.toBigInt();
  traderTakerInfo.quoteBalance =
    traderTakerInfo.quoteBalance + event.args.quote.toBigInt() - event.args.realizedPnl.toBigInt();
  traderTakerInfo.blockNumber = BigInt(event.blockNumber);
  traderTakerInfo.timestamp = BigInt(event.blockTimestamp.getTime());

  await getOrCreateCandle(
    event.args.market,
    event.blockTimestamp,
    event.args.sharePriceAfterX96.toBigInt(),
    BigInt(event.blockNumber)
  );

  await positionLiquidated.save();
  await protocol.save();
  await trader.save();
  await liquidator.save();
  await position.save();
  await traderTakerInfo.save();
}

export async function handlePositionChanged(event: FrontierEvmEvent<PositionChangedArgs>): Promise<void> {
  const positionChanged = new PositionChanged(`${event.transactionHash}-${event.logIndex.toString()}`);
  positionChanged.txHash = event.transactionHash;
  positionChanged.trader = event.args.trader;
  positionChanged.market = event.args.market;
  positionChanged.base = event.args.base.toBigInt();
  positionChanged.quote = event.args.quote.toBigInt();
  positionChanged.realizedPnl = event.args.realizedPnl.toBigInt();
  positionChanged.protocolFee = event.args.protocolFee.toBigInt();
  positionChanged.baseBalancePerShareX96 = event.args.baseBalancePerShareX96.toBigInt();
  positionChanged.sharePriceAfterX96 = event.args.sharePriceAfterX96.toBigInt();
  positionChanged.blockNumberLogIndex = BigInt(event.blockNumber) * BigInt(1000) + BigInt(event.logIndex);
  positionChanged.blockNumber = BigInt(event.blockNumber);
  positionChanged.timestamp = BigInt(event.blockTimestamp.getTime());

  const trader = await getOrCreateTrader(event.args.trader);
  trader.markets.push(positionChanged.market);
  trader.markets = [...new Set(trader.markets)]; // duplicate deletion
  trader.collateralBalance = trader.collateralBalance + event.args.realizedPnl.toBigInt();
  trader.blockNumber = BigInt(event.blockNumber);
  trader.timestamp = BigInt(event.blockTimestamp.getTime());

  const position = await getOrCreatePosition(event.args.trader, event.args.market);
  position.baseShare = position.baseShare + event.args.base.toBigInt();
  position.baseBalance = position.baseBalance * event.args.baseBalancePerShareX96.toBigInt();
  position.openNotional = position.openNotional + event.args.quote.toBigInt() - event.args.realizedPnl.toBigInt();
  position.entryPrice = position.openNotional / position.baseBalance;
  position.blockNumber = BigInt(event.blockNumber);
  position.timestamp = BigInt(event.blockTimestamp.getTime());

  const traderTakerInfo = await getOrCreateTraderTakerInfo(event.args.trader, event.args.market);
  traderTakerInfo.baseBalanceShare = traderTakerInfo.baseBalanceShare + event.args.base.toBigInt();
  traderTakerInfo.baseBalance = traderTakerInfo.baseBalanceShare * event.args.baseBalancePerShareX96.toBigInt();
  traderTakerInfo.quoteBalance =
    traderTakerInfo.quoteBalance + event.args.quote.toBigInt() - event.args.realizedPnl.toBigInt();
  traderTakerInfo.blockNumber = BigInt(event.blockNumber);
  traderTakerInfo.timestamp = BigInt(event.blockTimestamp.getTime());

  await getOrCreateCandle(
    event.args.market,
    event.blockTimestamp,
    event.args.sharePriceAfterX96.toBigInt(),
    BigInt(event.blockNumber)
  );

  await positionChanged.save();
  await trader.save();
  await position.save();
  await traderTakerInfo.save();
}
