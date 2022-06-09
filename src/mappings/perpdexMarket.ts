import { FundingPaid } from '../types';
import { FrontierEvmEvent } from '@subql/contract-processors/dist/frontierEvm';
import { BigNumber } from 'ethers';

type FundingPaidArgs = [BigNumber] & { fundingRateX96: BigNumber };

export async function handleFundingPaid(event: FrontierEvmEvent<FundingPaidArgs>): Promise<void> {
  const fundingPaid = new FundingPaid(`${event.transactionHash}-${event.logIndex.toString()}`);
  fundingPaid.txHash = event.transactionHash;
  fundingPaid.fundingRateX96 = event.args.fundingRateX96.toBigInt();
  fundingPaid.blockNumberLogIndex = BigInt(event.blockNumber) * BigInt(1000) + BigInt(event.logIndex);
  fundingPaid.blockNumber = BigInt(event.blockNumber);
  fundingPaid.timestamp = BigInt(event.blockTimestamp.getTime());

  await fundingPaid.save();
}
