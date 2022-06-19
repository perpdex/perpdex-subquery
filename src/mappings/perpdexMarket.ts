import {
  FundingPaid,
  LiquidityAddedMarket,
  LiquidityRemovedMarket,
  Swapped,
  PoolFeeRatioChanged,
  FundingMaxPremiumRatioChanged,
  FundingMaxElapsedSecChanged,
  FundingRolloverSecChanged,
  PriceLimitConfigChanged,
} from '../types';
import { FrontierEvmEvent } from '@subql/contract-processors/dist/frontierEvm';
import { BigNumber } from 'ethers';
import { getOrCreateMarket } from '../utils/store';

type FundingPaidArgs = [BigNumber] & { fundingRateX96: BigNumber };
type LiquidityAddedMarketArgs = [BigNumber, BigNumber, BigNumber] & {
  base: BigNumber;
  quote: BigNumber;
  liquidity: BigNumber;
};
type LiquidityRemovedMarketArgs = [BigNumber, BigNumber, BigNumber] & {
  base: BigNumber;
  quote: BigNumber;
  liquidity: BigNumber;
};
type SwappedArgs = [boolean, boolean, BigNumber, BigNumber] & {
  isBaseToQuote: boolean;
  isExactInput: boolean;
  amount: BigNumber;
  oppositeAmount: BigNumber;
};
type PoolFeeRatioChangedArgs = [number] & {
  value: number;
};
type FundingMaxPremiumRatioChangedArgs = [number] & {
  value: number;
};
type FundingMaxElapsedSecChangedArgs = [number] & {
  value: number;
};
type FundingRolloverSecChangedArgs = [number] & {
  value: number;
};
type PriceLimitConfigChangedArgs = [number, number, number, number, number] & {
  normalOrderRatio: number;
  liquidationRatio: number;
  emaNormalOrderRatio: number;
  emaLiquidationRatio: number;
  emaSec: number;
};

export async function handleFundingPaid(event: FrontierEvmEvent<FundingPaidArgs>): Promise<void> {
  const fundingPaid = new FundingPaid(`${event.transactionHash}-${event.logIndex.toString()}`);
  fundingPaid.txHash = event.transactionHash;
  fundingPaid.fundingRateX96 = event.args.fundingRateX96.toBigInt();
  fundingPaid.blockNumberLogIndex = BigInt(event.blockNumber) * BigInt(1000) + BigInt(event.logIndex);
  fundingPaid.blockNumber = BigInt(event.blockNumber);
  fundingPaid.timestamp = BigInt(event.blockTimestamp.getTime());

  await fundingPaid.save();
}

export async function handleLiquidityAddedMarket(event: FrontierEvmEvent<LiquidityAddedMarketArgs>): Promise<void> {
  const liquidityAddedMarket = new LiquidityAddedMarket(`${event.transactionHash}-${event.logIndex.toString()}`);
  liquidityAddedMarket.txHash = event.transactionHash;
  liquidityAddedMarket.base = event.args.base.toBigInt();
  liquidityAddedMarket.quote = event.args.quote.toBigInt();
  liquidityAddedMarket.liquidity = event.args.liquidity.toBigInt();
  liquidityAddedMarket.blockNumberLogIndex = BigInt(event.blockNumber) * BigInt(1000) + BigInt(event.logIndex);
  liquidityAddedMarket.blockNumber = BigInt(event.blockNumber);
  liquidityAddedMarket.timestamp = BigInt(event.blockTimestamp.getTime());

  const market = await getOrCreateMarket(event.address);
  market.baseAmount = market.baseAmount + event.args.base.toBigInt();
  market.quoteAmount = market.quoteAmount + event.args.quote.toBigInt();
  market.liquidity = market.liquidity + event.args.liquidity.toBigInt();
  market.blockNumberAdded = BigInt(event.blockNumber);
  market.timestampAdded = BigInt(event.blockTimestamp.getTime());
  market.blockNumber = BigInt(event.blockNumber);
  market.timestamp = BigInt(event.blockTimestamp.getTime());

  await liquidityAddedMarket.save();
  await market.save();
}

export async function handleLiquidityRemovedMarket(event: FrontierEvmEvent<LiquidityRemovedMarketArgs>): Promise<void> {
  const liquidityRemovedMarket = new LiquidityRemovedMarket(`${event.transactionHash}-${event.logIndex.toString()}`);
  liquidityRemovedMarket.txHash = event.transactionHash;
  liquidityRemovedMarket.base = event.args.base.toBigInt();
  liquidityRemovedMarket.quote = event.args.quote.toBigInt();
  liquidityRemovedMarket.liquidity = event.args.liquidity.toBigInt();
  liquidityRemovedMarket.blockNumberLogIndex = BigInt(event.blockNumber) * BigInt(1000) + BigInt(event.logIndex);
  liquidityRemovedMarket.blockNumber = BigInt(event.blockNumber);
  liquidityRemovedMarket.timestamp = BigInt(event.blockTimestamp.getTime());

  const market = await getOrCreateMarket(event.address);
  market.baseAmount = market.baseAmount - event.args.base.toBigInt();
  market.quoteAmount = market.quoteAmount - event.args.quote.toBigInt();
  market.liquidity = market.liquidity - event.args.liquidity.toBigInt();
  market.blockNumber = BigInt(event.blockNumber);
  market.timestamp = BigInt(event.blockTimestamp.getTime());

  await liquidityRemovedMarket.save();
  await market.save();
}

export async function handleSwapped(event: FrontierEvmEvent<SwappedArgs>): Promise<void> {
  const swapped = new Swapped(`${event.transactionHash}-${event.logIndex.toString()}`);
  swapped.txHash = event.transactionHash;
  swapped.isBaseToQuote = event.args.isBaseToQuote;
  swapped.isExactInput = event.args.isBaseToQuote;
  swapped.amount = event.args.amount.toBigInt();
  swapped.oppositeAmount = event.args.oppositeAmount.toBigInt();
  swapped.blockNumberLogIndex = BigInt(event.blockNumber) * BigInt(1000) + BigInt(event.logIndex);
  swapped.blockNumber = BigInt(event.blockNumber);
  swapped.timestamp = BigInt(event.blockTimestamp.getTime());

  const market = await getOrCreateMarket(event.address);
  if (event.args.isExactInput) {
    if (event.args.isBaseToQuote) {
      market.baseAmount = market.baseAmount + event.args.amount.toBigInt();
      market.quoteAmount = market.quoteAmount - event.args.oppositeAmount.toBigInt();
    } else {
      market.baseAmount = market.baseAmount - event.args.oppositeAmount.toBigInt();
      market.quoteAmount = market.quoteAmount + event.args.amount.toBigInt();
    }
  } else {
    if (event.args.isBaseToQuote) {
      market.baseAmount = market.baseAmount + event.args.oppositeAmount.toBigInt();
      market.quoteAmount = market.quoteAmount - event.args.amount.toBigInt();
    } else {
      market.baseAmount = market.baseAmount - event.args.amount.toBigInt();
      market.quoteAmount = market.quoteAmount + event.args.oppositeAmount.toBigInt();
    }
  }
  market.blockNumber = BigInt(event.blockNumber);
  market.timestamp = BigInt(event.blockTimestamp.getTime());

  await swapped.save();
  await market.save();
}

export async function handlePoolFeeRatioChanged(event: FrontierEvmEvent<PoolFeeRatioChangedArgs>): Promise<void> {
  const poolFeeRatioChanged = new PoolFeeRatioChanged(`${event.transactionHash}-${event.logIndex.toString()}`);
  poolFeeRatioChanged.txHash = event.transactionHash;
  poolFeeRatioChanged.value = event.args.value;
  poolFeeRatioChanged.blockNumberLogIndex = BigInt(event.blockNumber) * BigInt(1000) + BigInt(event.logIndex);
  poolFeeRatioChanged.blockNumber = BigInt(event.blockNumber);
  poolFeeRatioChanged.timestamp = BigInt(event.blockTimestamp.getTime());

  const market = await getOrCreateMarket(event.address);
  market.poolFeeRatio = poolFeeRatioChanged.value;
  market.blockNumber = BigInt(event.blockNumber);
  market.timestamp = BigInt(event.blockTimestamp.getTime());

  await poolFeeRatioChanged.save();
  await market.save();
}

export async function handleFundingMaxPremiumRatioChanged(
  event: FrontierEvmEvent<FundingMaxPremiumRatioChangedArgs>
): Promise<void> {
  const fundingMaxPremiumRatioChanged = new FundingMaxPremiumRatioChanged(
    `${event.transactionHash}-${event.logIndex.toString()}`
  );
  fundingMaxPremiumRatioChanged.txHash = event.transactionHash;
  fundingMaxPremiumRatioChanged.value = event.args.value;
  fundingMaxPremiumRatioChanged.blockNumberLogIndex = BigInt(event.blockNumber) * BigInt(1000) + BigInt(event.logIndex);
  fundingMaxPremiumRatioChanged.blockNumber = BigInt(event.blockNumber);
  fundingMaxPremiumRatioChanged.timestamp = BigInt(event.blockTimestamp.getTime());

  const market = await getOrCreateMarket(event.address);
  market.maxPremiumRatio = fundingMaxPremiumRatioChanged.value;
  market.blockNumber = BigInt(event.blockNumber);
  market.timestamp = BigInt(event.blockTimestamp.getTime());

  await fundingMaxPremiumRatioChanged.save();
  await market.save();
}

export async function handleFundingMaxElapsedSecChanged(
  event: FrontierEvmEvent<FundingMaxElapsedSecChangedArgs>
): Promise<void> {
  const fundingMaxElapsedSecChanged = new FundingMaxElapsedSecChanged(
    `${event.transactionHash}-${event.logIndex.toString()}`
  );
  fundingMaxElapsedSecChanged.txHash = event.transactionHash;
  fundingMaxElapsedSecChanged.value = event.args.value;
  fundingMaxElapsedSecChanged.blockNumberLogIndex = BigInt(event.blockNumber) * BigInt(1000) + BigInt(event.logIndex);
  fundingMaxElapsedSecChanged.blockNumber = BigInt(event.blockNumber);
  fundingMaxElapsedSecChanged.timestamp = BigInt(event.blockTimestamp.getTime());

  const market = await getOrCreateMarket(event.address);
  market.fundingMaxElapsedSec = fundingMaxElapsedSecChanged.value;
  market.blockNumber = BigInt(event.blockNumber);
  market.timestamp = BigInt(event.blockTimestamp.getTime());

  await fundingMaxElapsedSecChanged.save();
  await market.save();
}

export async function handleFundingRolloverSecChanged(
  event: FrontierEvmEvent<FundingRolloverSecChangedArgs>
): Promise<void> {
  const fundingRolloverSecChanged = new FundingRolloverSecChanged(
    `${event.transactionHash}-${event.logIndex.toString()}`
  );
  fundingRolloverSecChanged.txHash = event.transactionHash;
  fundingRolloverSecChanged.value = event.args.value;
  fundingRolloverSecChanged.blockNumberLogIndex = BigInt(event.blockNumber) * BigInt(1000) + BigInt(event.logIndex);
  fundingRolloverSecChanged.blockNumber = BigInt(event.blockNumber);
  fundingRolloverSecChanged.timestamp = BigInt(event.blockTimestamp.getTime());

  const market = await getOrCreateMarket(event.address);
  market.fundingRolloverSec = fundingRolloverSecChanged.value;
  market.blockNumber = BigInt(event.blockNumber);
  market.timestamp = BigInt(event.blockTimestamp.getTime());

  await fundingRolloverSecChanged.save();
  await market.save();
}

export async function handlePriceLimitConfigChanged(
  event: FrontierEvmEvent<PriceLimitConfigChangedArgs>
): Promise<void> {
  const priceLimitConfigChanged = new PriceLimitConfigChanged(`${event.transactionHash}-${event.logIndex.toString()}`);
  priceLimitConfigChanged.txHash = event.transactionHash;
  priceLimitConfigChanged.normalOrderRatio = event.args.normalOrderRatio;
  priceLimitConfigChanged.liquidationRatio = event.args.liquidationRatio;
  priceLimitConfigChanged.emaNormalOrderRatio = event.args.emaNormalOrderRatio;
  priceLimitConfigChanged.emaLiquidationRatio = event.args.emaLiquidationRatio;
  priceLimitConfigChanged.emaSec = event.args.emaSec;
  priceLimitConfigChanged.blockNumberLogIndex = BigInt(event.blockNumber) * BigInt(1000) + BigInt(event.logIndex);
  priceLimitConfigChanged.blockNumber = BigInt(event.blockNumber);
  priceLimitConfigChanged.timestamp = BigInt(event.blockTimestamp.getTime());

  const market = await getOrCreateMarket(event.address);
  market.normalOrderRatio = priceLimitConfigChanged.normalOrderRatio;
  market.liquidationRatio = priceLimitConfigChanged.liquidationRatio;
  market.emaNormalOrderRatio = priceLimitConfigChanged.emaNormalOrderRatio;
  market.emaLiquidationRatio = priceLimitConfigChanged.emaLiquidationRatio;
  market.emaSec = priceLimitConfigChanged.emaSec;
  market.blockNumber = BigInt(event.blockNumber);
  market.timestamp = BigInt(event.blockTimestamp.getTime());

  await priceLimitConfigChanged.save();
  await market.save();
}
