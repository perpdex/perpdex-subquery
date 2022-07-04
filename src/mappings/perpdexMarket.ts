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
} from "../types";
import { FrontierEvmEvent } from "@subql/contract-processors/dist/frontierEvm";
import { BigNumber } from "ethers";
import { getBlockNumberLogIndex, getOrCreateMarket } from "../utils/store";
import { mulDiv } from "../utils/math";
import { Q96 } from "../utils/constant";

type FundingPaidArgs = [
  BigNumber,
  number,
  BigNumber,
  BigNumber,
  BigNumber,
  BigNumber
] & {
  fundingRateX96: BigNumber;
  elapsedSec: number;
  premiumX96: BigNumber;
  markPriceX96: BigNumber;
  cumBasePerLiquidityX96: BigNumber;
  cumQuotePerLiquidityX96: BigNumber;
};
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

export async function handleFundingPaid(
  event: FrontierEvmEvent<FundingPaidArgs>
): Promise<void> {
  const fundingPaid = new FundingPaid(
    `${event.transactionHash}-${event.logIndex.toString()}`
  );
  fundingPaid.market = event.address;
  fundingPaid.fundingRateX96 = event.args.fundingRateX96.toBigInt();
  fundingPaid.elapsedSec = event.args.elapsedSec;
  fundingPaid.premiumX96 = event.args.premiumX96.toBigInt();
  fundingPaid.markPriceX96 = event.args.markPriceX96.toBigInt();
  fundingPaid.cumBasePerLiquidityX96 =
    event.args.cumBasePerLiquidityX96.toBigInt();
  fundingPaid.cumQuotePerLiquidityX96 =
    event.args.cumQuotePerLiquidityX96.toBigInt();
  fundingPaid.blockNumberLogIndex = getBlockNumberLogIndex(
    event.blockNumber,
    event.logIndex
  );
  fundingPaid.timestamp = BigInt(event.blockTimestamp.getTime());

  const market = await getOrCreateMarket(event.address);
  market.baseBalancePerShareX96 = mulDiv(
    market.baseBalancePerShareX96,
    Q96 - fundingPaid.fundingRateX96,
    Q96
  );
  if (fundingPaid.fundingRateX96 > 0) {
    const deleveratedQuote = mulDiv(
      market.quoteAmount,
      fundingPaid.fundingRateX96,
      Q96
    );
    market.quoteAmount = market.quoteAmount - deleveratedQuote;
    market.cumQuotePerLiquidityX96 =
      market.cumQuotePerLiquidityX96 +
      mulDiv(deleveratedQuote, Q96, market.liquidity);
  } else {
    const deleveratedBase = mulDiv(
      market.baseAmount,
      fundingPaid.fundingRateX96 * BigInt(-1),
      Q96 + fundingPaid.fundingRateX96 * BigInt(-1)
    );
    market.baseAmount = market.baseAmount - deleveratedBase;
    market.cumBasePerLiquidityX96 =
      market.cumBasePerLiquidityX96 +
      mulDiv(deleveratedBase, Q96, market.liquidity);
  }
  market.markPriceX96 = fundingPaid.markPriceX96;
  market.cumBasePerLiquidityX96 = fundingPaid.cumBasePerLiquidityX96;
  market.cumQuotePerLiquidityX96 = fundingPaid.cumQuotePerLiquidityX96;
  market.timestamp = BigInt(event.blockTimestamp.getTime());

  await fundingPaid.save();
}

export async function handleLiquidityAddedMarket(
  event: FrontierEvmEvent<LiquidityAddedMarketArgs>
): Promise<void> {
  const liquidityAddedMarket = new LiquidityAddedMarket(
    `${event.transactionHash}-${event.logIndex.toString()}`
  );
  liquidityAddedMarket.market = event.address;
  liquidityAddedMarket.base = event.args.base.toBigInt();
  liquidityAddedMarket.quote = event.args.quote.toBigInt();
  liquidityAddedMarket.liquidity = event.args.liquidity.toBigInt();
  liquidityAddedMarket.blockNumberLogIndex = getBlockNumberLogIndex(
    event.blockNumber,
    event.logIndex
  );
  liquidityAddedMarket.timestamp = BigInt(event.blockTimestamp.getTime());

  const market = await getOrCreateMarket(event.address);
  market.baseAmount = market.baseAmount + liquidityAddedMarket.base;
  market.quoteAmount = market.quoteAmount + liquidityAddedMarket.quote;
  market.liquidity = market.liquidity + liquidityAddedMarket.liquidity;
  market.blockNumberAdded = BigInt(event.blockNumber);
  market.timestampAdded = BigInt(event.blockTimestamp.getTime());
  market.timestamp = BigInt(event.blockTimestamp.getTime());

  await liquidityAddedMarket.save();
  await market.save();
}

export async function handleLiquidityRemovedMarket(
  event: FrontierEvmEvent<LiquidityRemovedMarketArgs>
): Promise<void> {
  const liquidityRemovedMarket = new LiquidityRemovedMarket(
    `${event.transactionHash}-${event.logIndex.toString()}`
  );
  liquidityRemovedMarket.market = event.address;
  liquidityRemovedMarket.base = event.args.base.toBigInt();
  liquidityRemovedMarket.quote = event.args.quote.toBigInt();
  liquidityRemovedMarket.liquidity = event.args.liquidity.toBigInt();
  liquidityRemovedMarket.blockNumberLogIndex = getBlockNumberLogIndex(
    event.blockNumber,
    event.logIndex
  );
  liquidityRemovedMarket.timestamp = BigInt(event.blockTimestamp.getTime());

  const market = await getOrCreateMarket(event.address);
  market.baseAmount = market.baseAmount - liquidityRemovedMarket.base;
  market.quoteAmount = market.quoteAmount - liquidityRemovedMarket.quote;
  market.liquidity = market.liquidity - liquidityRemovedMarket.liquidity;
  market.timestamp = BigInt(event.blockTimestamp.getTime());

  await liquidityRemovedMarket.save();
  await market.save();
}

export async function handleSwapped(
  event: FrontierEvmEvent<SwappedArgs>
): Promise<void> {
  const swapped = new Swapped(
    `${event.transactionHash}-${event.logIndex.toString()}`
  );
  swapped.market = event.address;
  swapped.isBaseToQuote = event.args.isBaseToQuote;
  swapped.isExactInput = event.args.isExactInput;
  swapped.amount = event.args.amount.toBigInt();
  swapped.oppositeAmount = event.args.oppositeAmount.toBigInt();
  swapped.blockNumberLogIndex = getBlockNumberLogIndex(
    event.blockNumber,
    event.logIndex
  );
  swapped.timestamp = BigInt(event.blockTimestamp.getTime());

  const market = await getOrCreateMarket(event.address);
  if (swapped.isExactInput) {
    if (swapped.isBaseToQuote) {
      market.baseAmount = market.baseAmount + swapped.amount;
      market.quoteAmount = market.quoteAmount - swapped.oppositeAmount;
    } else {
      market.baseAmount = market.baseAmount - swapped.oppositeAmount;
      market.quoteAmount = market.quoteAmount + swapped.amount;
    }
  } else {
    if (swapped.isBaseToQuote) {
      market.baseAmount = market.baseAmount + swapped.oppositeAmount;
      market.quoteAmount = market.quoteAmount - swapped.amount;
    } else {
      market.baseAmount = market.baseAmount - swapped.amount;
      market.quoteAmount = market.quoteAmount + swapped.oppositeAmount;
    }
  }
  market.timestamp = BigInt(event.blockTimestamp.getTime());

  await swapped.save();
  await market.save();
}

export async function handlePoolFeeRatioChanged(
  event: FrontierEvmEvent<PoolFeeRatioChangedArgs>
): Promise<void> {
  const poolFeeRatioChanged = new PoolFeeRatioChanged(
    `${event.transactionHash}-${event.logIndex.toString()}`
  );
  poolFeeRatioChanged.market = event.address;
  poolFeeRatioChanged.value = event.args.value;
  poolFeeRatioChanged.blockNumberLogIndex = getBlockNumberLogIndex(
    event.blockNumber,
    event.logIndex
  );
  poolFeeRatioChanged.timestamp = BigInt(event.blockTimestamp.getTime());

  const market = await getOrCreateMarket(event.address);
  market.poolFeeRatio = poolFeeRatioChanged.value;
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
  fundingMaxPremiumRatioChanged.market = event.address;
  fundingMaxPremiumRatioChanged.value = event.args.value;
  fundingMaxPremiumRatioChanged.blockNumberLogIndex = getBlockNumberLogIndex(
    event.blockNumber,
    event.logIndex
  );
  fundingMaxPremiumRatioChanged.timestamp = BigInt(
    event.blockTimestamp.getTime()
  );

  const market = await getOrCreateMarket(event.address);
  market.maxPremiumRatio = fundingMaxPremiumRatioChanged.value;
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
  fundingMaxElapsedSecChanged.market = event.address;
  fundingMaxElapsedSecChanged.value = event.args.value;
  fundingMaxElapsedSecChanged.blockNumberLogIndex = getBlockNumberLogIndex(
    event.blockNumber,
    event.logIndex
  );
  fundingMaxElapsedSecChanged.timestamp = BigInt(
    event.blockTimestamp.getTime()
  );

  const market = await getOrCreateMarket(event.address);
  market.fundingMaxElapsedSec = fundingMaxElapsedSecChanged.value;
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
  fundingRolloverSecChanged.market = event.address;
  fundingRolloverSecChanged.value = event.args.value;
  fundingRolloverSecChanged.blockNumberLogIndex = getBlockNumberLogIndex(
    event.blockNumber,
    event.logIndex
  );
  fundingRolloverSecChanged.timestamp = BigInt(event.blockTimestamp.getTime());

  const market = await getOrCreateMarket(event.address);
  market.fundingRolloverSec = fundingRolloverSecChanged.value;
  market.timestamp = BigInt(event.blockTimestamp.getTime());

  await fundingRolloverSecChanged.save();
  await market.save();
}

export async function handlePriceLimitConfigChanged(
  event: FrontierEvmEvent<PriceLimitConfigChangedArgs>
): Promise<void> {
  const priceLimitConfigChanged = new PriceLimitConfigChanged(
    `${event.transactionHash}-${event.logIndex.toString()}`
  );
  priceLimitConfigChanged.market = event.address;
  priceLimitConfigChanged.normalOrderRatio = event.args.normalOrderRatio;
  priceLimitConfigChanged.liquidationRatio = event.args.liquidationRatio;
  priceLimitConfigChanged.emaNormalOrderRatio = event.args.emaNormalOrderRatio;
  priceLimitConfigChanged.emaLiquidationRatio = event.args.emaLiquidationRatio;
  priceLimitConfigChanged.emaSec = event.args.emaSec;
  priceLimitConfigChanged.blockNumberLogIndex = getBlockNumberLogIndex(
    event.blockNumber,
    event.logIndex
  );
  priceLimitConfigChanged.timestamp = BigInt(event.blockTimestamp.getTime());

  const market = await getOrCreateMarket(event.address);
  market.normalOrderRatio = priceLimitConfigChanged.normalOrderRatio;
  market.liquidationRatio = priceLimitConfigChanged.liquidationRatio;
  market.emaNormalOrderRatio = priceLimitConfigChanged.emaNormalOrderRatio;
  market.emaLiquidationRatio = priceLimitConfigChanged.emaLiquidationRatio;
  market.emaSec = priceLimitConfigChanged.emaSec;
  market.timestamp = BigInt(event.blockTimestamp.getTime());

  await priceLimitConfigChanged.save();
  await market.save();
}
