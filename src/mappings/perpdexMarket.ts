import { FundingPaid, LiquidityAddedMarket, LiquidityRemovedMarket, Swapped } from '../types';
import { FrontierEvmEvent } from '@subql/contract-processors/dist/frontierEvm';
import { BigNumber } from 'ethers';

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

  // (Todo): Market Save

  await liquidityAddedMarket.save();
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

  // (Todo): Market Save

  await liquidityRemovedMarket.save();
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

  // (Todo): Market Save

  await swapped.save();
}
