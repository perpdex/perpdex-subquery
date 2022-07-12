import {
  Deposited,
  Withdrawn,
  ProtocolFeeTransferred,
  LiquidityAddedExchange,
  LiquidityRemovedExchange,
  PositionChanged,
  MaxMarketsPerAccountChanged,
  ImRatioChanged,
  MmRatioChanged,
  LiquidationRewardConfigChanged,
  ProtocolFeeRatioChanged,
  IsMarketAllowedChanged,
  createNewMarketDatasource,
} from "../types";
import { FrontierEvmEvent } from "@subql/contract-processors/dist/frontierEvm";
import { BigNumber } from "ethers";
import {
  getBlockNumberLogIndex,
  getOrCreateProtocol,
  getOrCreateMarket,
  getOrCreateTrader,
  getOrCreateTraderTakerInfo,
  getOrCreateTraderMakerInfo,
  createPositionHistory,
  createLiquidityHistory,
  createCandle,
  getOrCreateDaySummary,
} from "../utils/store";
import { negBI } from "../utils/math";
import { BI_ZERO, Q96 } from "../utils/constant";

type DepositedArgs = [string, BigNumber] & {
  trader: string;
  amount: BigNumber;
};
type WithdrawnArgs = [string, BigNumber] & {
  trader: string;
  amount: BigNumber;
};
type ProtocolFeeTransferredArgs = [string, BigNumber] & {
  trader: string;
  amount: BigNumber;
};
type LiquidityAddedExchangeArgs = [
  string,
  string,
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
  base: BigNumber;
  quote: BigNumber;
  liquidity: BigNumber;
  cumBasePerLiquidityX96: BigNumber;
  cumQuotePerLiquidityX96: BigNumber;
  baseBalancePerShareX96: BigNumber;
  sharePriceAfterX96: BigNumber;
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
  baseBalancePerShareX96: BigNumber;
  sharePriceAfterX96: BigNumber;
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
  liquidationPenalty: BigNumber;
  liquidationReward: BigNumber;
  insuranceFundReward: BigNumber;
};
type PositionChangedArgs = [
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
type MaxMarketsPerAccountChangedArgs = [number] & {
  value: number;
};
type ImRatioChangedArgs = [number] & {
  value: number;
};
type MmRatioChangedArgs = [number] & {
  value: number;
};
type LiquidationRewardConfigChangedArgs = [number, number] & {
  rewardRatio: number;
  smoothEmaTime: number;
};
type ProtocolFeeRatioChangedArgs = [number] & {
  value: number;
};
type IsMarketAllowedChangedArgs = [string, boolean] & {
  market: string;
  isMarketAllowed: boolean;
};

export async function handleDeposited(
  event: FrontierEvmEvent<DepositedArgs>
): Promise<void> {
  const deposited = new Deposited(
    `${event.transactionHash}-${event.logIndex.toString()}`
  );
  deposited.exchange = event.address;
  deposited.trader = event.args.trader;
  deposited.amount = event.args.amount.toBigInt();
  deposited.blockNumberLogIndex = getBlockNumberLogIndex(
    event.blockNumber,
    event.logIndex
  );
  deposited.timestamp = BigInt(event.blockTimestamp.getTime());

  const trader = await getOrCreateTrader(event.args.trader);
  trader.collateralBalance = trader.collateralBalance + deposited.amount;
  trader.timestamp = BigInt(event.blockTimestamp.getTime());

  const protocol = await getOrCreateProtocol();
  protocol.timestamp = BigInt(event.blockTimestamp.getTime());

  await deposited.save();
  await trader.save();
  await protocol.save();
}

export async function handleWithdrawn(
  event: FrontierEvmEvent<WithdrawnArgs>
): Promise<void> {
  const withdrawn = new Withdrawn(
    `${event.transactionHash}-${event.logIndex.toString()}`
  );
  withdrawn.exchange = event.address;
  withdrawn.trader = event.args.trader;
  withdrawn.amount = event.args.amount.toBigInt();
  withdrawn.blockNumberLogIndex = getBlockNumberLogIndex(
    event.blockNumber,
    event.logIndex
  );
  withdrawn.timestamp = BigInt(event.blockTimestamp.getTime());

  const trader = await getOrCreateTrader(event.args.trader);
  trader.collateralBalance = trader.collateralBalance - withdrawn.amount;
  trader.timestamp = BigInt(event.blockTimestamp.getTime());

  const protocol = await getOrCreateProtocol();
  protocol.timestamp = BigInt(event.blockTimestamp.getTime());

  await withdrawn.save();
  await trader.save();
  await protocol.save();
}

export async function handleProtocolFeeTransferred(
  event: FrontierEvmEvent<ProtocolFeeTransferredArgs>
): Promise<void> {
  const protocolFeeTransferred = new ProtocolFeeTransferred(
    `${event.transactionHash}-${event.logIndex.toString()}`
  );
  protocolFeeTransferred.exchange = event.address;
  protocolFeeTransferred.trader = event.args.trader;
  protocolFeeTransferred.amount = event.args.amount.toBigInt();
  protocolFeeTransferred.blockNumberLogIndex = getBlockNumberLogIndex(
    event.blockNumber,
    event.logIndex
  );
  protocolFeeTransferred.timestamp = BigInt(event.blockTimestamp.getTime());

  const trader = await getOrCreateTrader(event.args.trader);
  trader.collateralBalance =
    trader.collateralBalance + protocolFeeTransferred.amount;
  trader.timestamp = BigInt(event.blockTimestamp.getTime());

  const protocol = await getOrCreateProtocol();
  protocol.protocolFee = protocol.protocolFee - protocolFeeTransferred.amount;
  protocol.timestamp = BigInt(event.blockTimestamp.getTime());

  await protocolFeeTransferred.save();
  await trader.save();
  await protocol.save();
}

export async function handleLiquidityAddedExchange(
  event: FrontierEvmEvent<LiquidityAddedExchangeArgs>
): Promise<void> {
  const liquidityAddedExchange = new LiquidityAddedExchange(
    `${event.transactionHash}-${event.logIndex.toString()}`
  );
  liquidityAddedExchange.exchange = event.address;
  liquidityAddedExchange.trader = event.args.trader;
  liquidityAddedExchange.market = event.args.market;
  liquidityAddedExchange.base = event.args.base.toBigInt();
  liquidityAddedExchange.quote = event.args.quote.toBigInt();
  liquidityAddedExchange.liquidity = event.args.liquidity.toBigInt();
  liquidityAddedExchange.cumBasePerLiquidityX96 =
    event.args.cumBasePerLiquidityX96.toBigInt();
  liquidityAddedExchange.cumQuotePerLiquidityX96 =
    event.args.cumQuotePerLiquidityX96.toBigInt();
  liquidityAddedExchange.baseBalancePerShareX96 =
    event.args.baseBalancePerShareX96.toBigInt();
  liquidityAddedExchange.sharePriceAfterX96 =
    event.args.sharePriceAfterX96.toBigInt();
  liquidityAddedExchange.blockNumberLogIndex = getBlockNumberLogIndex(
    event.blockNumber,
    event.logIndex
  );
  liquidityAddedExchange.timestamp = BigInt(event.blockTimestamp.getTime());

  const trader = await getOrCreateTrader(liquidityAddedExchange.trader);
  trader.markets.push(liquidityAddedExchange.market);
  trader.markets = [...new Set(trader.markets)]; // duplicate deletion
  trader.timestamp = BigInt(event.blockTimestamp.getTime());

  const market = await getOrCreateMarket(liquidityAddedExchange.market);
  market.baseBalancePerShareX96 = liquidityAddedExchange.baseBalancePerShareX96;
  market.sharePriceAfterX96 = liquidityAddedExchange.sharePriceAfterX96;
  market.timestamp = BigInt(event.blockTimestamp.getTime());

  const traderMakerInfo = await getOrCreateTraderMakerInfo(
    liquidityAddedExchange.trader,
    liquidityAddedExchange.market
  );
  traderMakerInfo.liquidity =
    traderMakerInfo.liquidity + liquidityAddedExchange.liquidity;
  traderMakerInfo.cumBaseSharePerLiquidityX96 =
    liquidityAddedExchange.cumBasePerLiquidityX96;
  traderMakerInfo.cumQuotePerLiquidityX96 =
    liquidityAddedExchange.cumQuotePerLiquidityX96;
  traderMakerInfo.timestamp = BigInt(event.blockTimestamp.getTime());

  await createLiquidityHistory(
    liquidityAddedExchange.trader,
    liquidityAddedExchange.market,
    event.blockTimestamp,
    liquidityAddedExchange.base,
    liquidityAddedExchange.quote,
    liquidityAddedExchange.liquidity
  );

  await createCandle(
    liquidityAddedExchange.market,
    BigInt(event.blockTimestamp.getTime()),
    liquidityAddedExchange.sharePriceAfterX96,
    liquidityAddedExchange.baseBalancePerShareX96,
    BI_ZERO,
    BI_ZERO
  );

  await liquidityAddedExchange.save();
  await trader.save();
  await market.save();
  await traderMakerInfo.save();
}

export async function handleLiquidityRemovedExchange(
  event: FrontierEvmEvent<LiquidityRemovedExchangeArgs>
): Promise<void> {
  const liquidityRemovedExchange = new LiquidityRemovedExchange(
    `${event.transactionHash}-${event.logIndex.toString()}`
  );
  liquidityRemovedExchange.exchange = event.address;
  liquidityRemovedExchange.trader = event.args.trader;
  liquidityRemovedExchange.market = event.args.market;
  liquidityRemovedExchange.liquidator = event.args.liquidator;
  liquidityRemovedExchange.base = event.args.base.toBigInt();
  liquidityRemovedExchange.quote = event.args.quote.toBigInt();
  liquidityRemovedExchange.liquidity = event.args.liquidity.toBigInt();
  liquidityRemovedExchange.takerBase = event.args.takerBase.toBigInt();
  liquidityRemovedExchange.takerQuote = event.args.takerQuote.toBigInt();
  liquidityRemovedExchange.realizedPnl = event.args.realizedPnl.toBigInt();
  liquidityRemovedExchange.baseBalancePerShareX96 =
    event.args.baseBalancePerShareX96.toBigInt();
  liquidityRemovedExchange.sharePriceAfterX96 =
    event.args.sharePriceAfterX96.toBigInt();
  liquidityRemovedExchange.blockNumberLogIndex = getBlockNumberLogIndex(
    event.blockNumber,
    event.logIndex
  );
  liquidityRemovedExchange.timestamp = BigInt(event.blockTimestamp.getTime());

  const trader = await getOrCreateTrader(liquidityRemovedExchange.trader);
  trader.markets.push(liquidityRemovedExchange.market);
  trader.markets = [...new Set(trader.markets)]; // duplicate deletion
  trader.collateralBalance =
    trader.collateralBalance + liquidityRemovedExchange.realizedPnl;
  trader.timestamp = BigInt(event.blockTimestamp.getTime());

  const market = await getOrCreateMarket(liquidityRemovedExchange.market);
  market.baseBalancePerShareX96 =
    liquidityRemovedExchange.baseBalancePerShareX96;
  market.sharePriceAfterX96 = liquidityRemovedExchange.sharePriceAfterX96;
  market.timestamp = BigInt(event.blockTimestamp.getTime());

  const traderTakerInfo = await getOrCreateTraderTakerInfo(
    liquidityRemovedExchange.trader,
    liquidityRemovedExchange.market
  );
  traderTakerInfo.baseBalanceShare =
    traderTakerInfo.baseBalanceShare + liquidityRemovedExchange.takerBase;
  traderTakerInfo.baseBalance =
    (traderTakerInfo.baseBalanceShare *
      liquidityRemovedExchange.baseBalancePerShareX96) /
    Q96;
  traderTakerInfo.quoteBalance =
    traderTakerInfo.quoteBalance +
    liquidityRemovedExchange.takerQuote -
    liquidityRemovedExchange.realizedPnl;
  traderTakerInfo.entryPrice =
    traderTakerInfo.quoteBalance / traderTakerInfo.baseBalance;
  traderTakerInfo.timestamp = BigInt(event.blockTimestamp.getTime());

  const traderMakerInfo = await getOrCreateTraderMakerInfo(
    liquidityRemovedExchange.trader,
    liquidityRemovedExchange.market
  );
  traderMakerInfo.liquidity =
    traderMakerInfo.liquidity - liquidityRemovedExchange.liquidity;
  traderMakerInfo.timestamp = BigInt(event.blockTimestamp.getTime());

  const daySummary = await getOrCreateDaySummary(
    event.args.trader,
    event.blockTimestamp
  );
  daySummary.realizedPnl =
    daySummary.realizedPnl + liquidityRemovedExchange.realizedPnl;
  daySummary.timestamp = BigInt(event.blockTimestamp.getTime());

  await createLiquidityHistory(
    liquidityRemovedExchange.trader,
    liquidityRemovedExchange.market,
    event.blockTimestamp,
    negBI(liquidityRemovedExchange.base),
    negBI(liquidityRemovedExchange.quote),
    negBI(liquidityRemovedExchange.liquidity)
  );

  await createCandle(
    liquidityRemovedExchange.market,
    BigInt(event.blockTimestamp.getTime()),
    liquidityRemovedExchange.sharePriceAfterX96,
    liquidityRemovedExchange.baseBalancePerShareX96,
    BI_ZERO,
    BI_ZERO
  );

  await liquidityRemovedExchange.save();
  await trader.save();
  await market.save();
  await traderTakerInfo.save();
  await traderMakerInfo.save();
  await daySummary.save();
}

export async function handlePositionLiquidated(
  event: FrontierEvmEvent<PositionLiquidatedArgs>
): Promise<void> {
  const positionLiquidated = new PositionChanged(
    `${event.transactionHash}-${event.logIndex.toString()}`
  );
  positionLiquidated.exchange = event.address;
  positionLiquidated.trader = event.args.trader;
  positionLiquidated.market = event.args.market;
  positionLiquidated.liquidator = event.args.liquidator;
  positionLiquidated.base = event.args.base.toBigInt();
  positionLiquidated.quote = event.args.quote.toBigInt();
  positionLiquidated.realizedPnl = event.args.realizedPnl.toBigInt();
  positionLiquidated.protocolFee = event.args.protocolFee.toBigInt();
  positionLiquidated.baseBalancePerShareX96 =
    event.args.baseBalancePerShareX96.toBigInt();
  positionLiquidated.sharePriceAfterX96 =
    event.args.sharePriceAfterX96.toBigInt();
  positionLiquidated.liquidationPenalty =
    event.args.liquidationPenalty.toBigInt();
  positionLiquidated.insuranceFundReward =
    event.args.insuranceFundReward.toBigInt();
  positionLiquidated.liquidationReward =
    event.args.liquidationReward.toBigInt();
  positionLiquidated.blockNumberLogIndex = getBlockNumberLogIndex(
    event.blockNumber,
    event.logIndex
  );
  positionLiquidated.timestamp = BigInt(event.blockTimestamp.getTime());

  const trader = await getOrCreateTrader(positionLiquidated.trader);
  trader.markets.push(positionLiquidated.market);
  trader.markets = [...new Set(trader.markets)]; // duplicate deletion
  trader.collateralBalance =
    trader.collateralBalance +
    positionLiquidated.realizedPnl -
    positionLiquidated.liquidationPenalty;
  trader.timestamp = BigInt(event.blockTimestamp.getTime());

  const liquidator = await getOrCreateTrader(positionLiquidated.liquidator);
  liquidator.markets.push(positionLiquidated.market);
  liquidator.markets = [...new Set(liquidator.markets)]; // duplicate deletion
  liquidator.collateralBalance =
    liquidator.collateralBalance + positionLiquidated.liquidationReward;
  liquidator.timestamp = BigInt(event.blockTimestamp.getTime());

  const market = await getOrCreateMarket(positionLiquidated.market);
  market.baseBalancePerShareX96 = positionLiquidated.baseBalancePerShareX96;
  market.sharePriceAfterX96 = positionLiquidated.sharePriceAfterX96;
  market.timestamp = BigInt(event.blockTimestamp.getTime());

  const traderTakerInfo = await getOrCreateTraderTakerInfo(
    event.args.trader,
    event.args.market
  );
  traderTakerInfo.baseBalanceShare =
    traderTakerInfo.baseBalanceShare + positionLiquidated.base;
  traderTakerInfo.baseBalance =
    (traderTakerInfo.baseBalanceShare *
      positionLiquidated.baseBalancePerShareX96) /
    Q96;
  traderTakerInfo.quoteBalance =
    traderTakerInfo.quoteBalance +
    positionLiquidated.quote -
    positionLiquidated.realizedPnl;
  traderTakerInfo.entryPrice =
    traderTakerInfo.quoteBalance / traderTakerInfo.baseBalance;
  traderTakerInfo.timestamp = BigInt(event.blockTimestamp.getTime());

  const protocol = await getOrCreateProtocol();
  protocol.protocolFee = protocol.protocolFee + positionLiquidated.protocolFee;
  protocol.insuranceFundBalance =
    protocol.insuranceFundBalance + positionLiquidated.insuranceFundReward;
  protocol.timestamp = BigInt(event.blockTimestamp.getTime());

  const daySummary = await getOrCreateDaySummary(
    event.args.trader,
    event.blockTimestamp
  );
  daySummary.realizedPnl =
    daySummary.realizedPnl + positionLiquidated.realizedPnl;
  daySummary.timestamp = BigInt(event.blockTimestamp.getTime());

  await createPositionHistory(
    positionLiquidated.trader,
    positionLiquidated.market,
    event.blockTimestamp,
    positionLiquidated.base,
    positionLiquidated.baseBalancePerShareX96,
    positionLiquidated.quote,
    positionLiquidated.realizedPnl,
    positionLiquidated.protocolFee
  );

  await createCandle(
    positionLiquidated.market,
    BigInt(event.blockTimestamp.getTime()),
    positionLiquidated.sharePriceAfterX96,
    positionLiquidated.baseBalancePerShareX96,
    positionLiquidated.base,
    positionLiquidated.quote
  );

  await positionLiquidated.save();
  await trader.save();
  await liquidator.save();
  await market.save();
  await traderTakerInfo.save();
  await protocol.save();
  await daySummary.save();
}

export async function handlePositionChanged(
  event: FrontierEvmEvent<PositionChangedArgs>
): Promise<void> {
  const positionChanged = new PositionChanged(
    `${event.transactionHash}-${event.logIndex.toString()}`
  );
  positionChanged.exchange = event.address;
  positionChanged.trader = event.args.trader;
  positionChanged.market = event.args.market;
  positionChanged.base = event.args.base.toBigInt();
  positionChanged.quote = event.args.quote.toBigInt();
  positionChanged.realizedPnl = event.args.realizedPnl.toBigInt();
  positionChanged.protocolFee = event.args.protocolFee.toBigInt();
  positionChanged.baseBalancePerShareX96 =
    event.args.baseBalancePerShareX96.toBigInt();
  positionChanged.sharePriceAfterX96 = event.args.sharePriceAfterX96.toBigInt();
  positionChanged.blockNumberLogIndex = getBlockNumberLogIndex(
    event.blockNumber,
    event.logIndex
  );
  positionChanged.timestamp = BigInt(event.blockTimestamp.getTime());

  const trader = await getOrCreateTrader(positionChanged.trader);
  trader.markets.push(positionChanged.market);
  trader.markets = [...new Set(trader.markets)]; // duplicate deletion
  trader.collateralBalance =
    trader.collateralBalance + positionChanged.realizedPnl;
  trader.timestamp = BigInt(event.blockTimestamp.getTime());

  const market = await getOrCreateMarket(positionChanged.market);
  market.baseBalancePerShareX96 = positionChanged.baseBalancePerShareX96;
  market.sharePriceAfterX96 = positionChanged.sharePriceAfterX96;
  market.timestamp = BigInt(event.blockTimestamp.getTime());

  const traderTakerInfo = await getOrCreateTraderTakerInfo(
    positionChanged.trader,
    positionChanged.market
  );
  traderTakerInfo.baseBalanceShare =
    traderTakerInfo.baseBalanceShare + positionChanged.base;
  traderTakerInfo.baseBalance =
    (traderTakerInfo.baseBalanceShare *
      positionChanged.baseBalancePerShareX96) /
    Q96;
  traderTakerInfo.quoteBalance =
    traderTakerInfo.quoteBalance +
    positionChanged.quote -
    positionChanged.realizedPnl;
  traderTakerInfo.entryPrice =
    traderTakerInfo.quoteBalance / traderTakerInfo.baseBalance;
  traderTakerInfo.timestamp = BigInt(event.blockTimestamp.getTime());

  const protocol = await getOrCreateProtocol();
  protocol.protocolFee = protocol.protocolFee + positionChanged.protocolFee;
  protocol.timestamp = BigInt(event.blockTimestamp.getTime());

  const daySummary = await getOrCreateDaySummary(
    event.args.trader,
    event.blockTimestamp
  );
  daySummary.realizedPnl = daySummary.realizedPnl + positionChanged.realizedPnl;
  daySummary.timestamp = BigInt(event.blockTimestamp.getTime());

  await createPositionHistory(
    positionChanged.trader,
    positionChanged.market,
    event.blockTimestamp,
    positionChanged.base,
    positionChanged.baseBalancePerShareX96,
    positionChanged.quote,
    positionChanged.realizedPnl,
    positionChanged.protocolFee
  );

  await createCandle(
    positionChanged.market,
    BigInt(event.blockTimestamp.getTime()),
    positionChanged.sharePriceAfterX96,
    positionChanged.baseBalancePerShareX96,
    positionChanged.base,
    positionChanged.quote
  );

  await positionChanged.save();
  await trader.save();
  await market.save();
  await traderTakerInfo.save();
  await protocol.save();
  await daySummary.save();
}

export async function handleMaxMarketsPerAccountChanged(
  event: FrontierEvmEvent<MaxMarketsPerAccountChangedArgs>
): Promise<void> {
  const maxMarketsPerAccountChanged = new MaxMarketsPerAccountChanged(
    `${event.transactionHash}-${event.logIndex.toString()}`
  );
  maxMarketsPerAccountChanged.exchange = event.address;
  maxMarketsPerAccountChanged.value = event.args.value;
  maxMarketsPerAccountChanged.blockNumberLogIndex = getBlockNumberLogIndex(
    event.blockNumber,
    event.logIndex
  );
  maxMarketsPerAccountChanged.timestamp = BigInt(
    event.blockTimestamp.getTime()
  );

  const protocol = await getOrCreateProtocol();
  protocol.maxMarketsPerAccount = maxMarketsPerAccountChanged.value;
  protocol.timestamp = BigInt(event.blockTimestamp.getTime());

  await maxMarketsPerAccountChanged.save();
  await protocol.save();
}

export async function handleImRatioChanged(
  event: FrontierEvmEvent<ImRatioChangedArgs>
): Promise<void> {
  const imRatioChanged = new ImRatioChanged(
    `${event.transactionHash}-${event.logIndex.toString()}`
  );
  imRatioChanged.exchange = event.address;
  imRatioChanged.value = event.args.value;
  imRatioChanged.blockNumberLogIndex = getBlockNumberLogIndex(
    event.blockNumber,
    event.logIndex
  );
  imRatioChanged.timestamp = BigInt(event.blockTimestamp.getTime());

  const protocol = await getOrCreateProtocol();
  protocol.imRatio = imRatioChanged.value;
  protocol.timestamp = BigInt(event.blockTimestamp.getTime());

  await imRatioChanged.save();
  await protocol.save();
}

export async function handleMmRatioChanged(
  event: FrontierEvmEvent<MmRatioChangedArgs>
): Promise<void> {
  const mmRatioChanged = new MmRatioChanged(
    `${event.transactionHash}-${event.logIndex.toString()}`
  );
  mmRatioChanged.exchange = event.address;
  mmRatioChanged.value = event.args.value;
  mmRatioChanged.blockNumberLogIndex = getBlockNumberLogIndex(
    event.blockNumber,
    event.logIndex
  );
  mmRatioChanged.timestamp = BigInt(event.blockTimestamp.getTime());

  const protocol = await getOrCreateProtocol();
  protocol.mmRatio = mmRatioChanged.value;
  protocol.timestamp = BigInt(event.blockTimestamp.getTime());

  await mmRatioChanged.save();
  await protocol.save();
}

export async function handleLiquidationRewardConfigChanged(
  event: FrontierEvmEvent<LiquidationRewardConfigChangedArgs>
): Promise<void> {
  const liquidationRewardConfigChanged = new LiquidationRewardConfigChanged(
    `${event.transactionHash}-${event.logIndex.toString()}`
  );
  liquidationRewardConfigChanged.exchange = event.address;
  liquidationRewardConfigChanged.rewardRatio = event.args.rewardRatio;
  liquidationRewardConfigChanged.smoothEmaTime = event.args.smoothEmaTime;
  liquidationRewardConfigChanged.blockNumberLogIndex = getBlockNumberLogIndex(
    event.blockNumber,
    event.logIndex
  );
  liquidationRewardConfigChanged.timestamp = BigInt(
    event.blockTimestamp.getTime()
  );

  const protocol = await getOrCreateProtocol();
  protocol.rewardRatio = liquidationRewardConfigChanged.rewardRatio;
  protocol.smoothEmaTime = liquidationRewardConfigChanged.smoothEmaTime;
  protocol.timestamp = BigInt(event.blockTimestamp.getTime());

  await liquidationRewardConfigChanged.save();
  await protocol.save();
}

export async function handleProtocolFeeRatioChanged(
  event: FrontierEvmEvent<ProtocolFeeRatioChangedArgs>
): Promise<void> {
  const protocolFeeRatioChanged = new ProtocolFeeRatioChanged(
    `${event.transactionHash}-${event.logIndex.toString()}`
  );
  protocolFeeRatioChanged.exchange = event.address;
  protocolFeeRatioChanged.value = event.args.value;
  protocolFeeRatioChanged.blockNumberLogIndex = getBlockNumberLogIndex(
    event.blockNumber,
    event.logIndex
  );
  protocolFeeRatioChanged.timestamp = BigInt(event.blockTimestamp.getTime());

  const protocol = await getOrCreateProtocol();
  protocol.protocolFeeRatio = protocolFeeRatioChanged.value;
  protocol.timestamp = BigInt(event.blockTimestamp.getTime());

  await protocolFeeRatioChanged.save();
  await protocol.save();
}

export async function handleIsMarketAllowedChanged(
  event: FrontierEvmEvent<IsMarketAllowedChangedArgs>
): Promise<void> {
  const isMarketAllowedChanged = new IsMarketAllowedChanged(
    `${event.transactionHash}-${event.logIndex.toString()}`
  );
  isMarketAllowedChanged.exchange = event.address;
  isMarketAllowedChanged.market = event.args.market;
  isMarketAllowedChanged.isMarketAllowed = event.args.isMarketAllowed;
  isMarketAllowedChanged.blockNumberLogIndex = getBlockNumberLogIndex(
    event.blockNumber,
    event.logIndex
  );
  isMarketAllowedChanged.timestamp = BigInt(event.blockTimestamp.getTime());

  const market = await getOrCreateMarket(isMarketAllowedChanged.market);
  market.timestamp = BigInt(event.blockTimestamp.getTime());

  // TODO: check if already exists
  await createNewMarketDatasource({ address: isMarketAllowedChanged.market });
  await isMarketAllowedChanged.save();
  await market.save();
}
