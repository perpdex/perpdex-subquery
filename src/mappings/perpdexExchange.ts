import { Deposited } from '../types';
import { FrontierEvmEvent } from '@subql/contract-processors/dist/frontierEvm';
import { BigNumber } from 'ethers';

type DepositedArgs = [string, BigNumber] & { trader: string; amount: BigNumber };

export async function handleDeposited(event: FrontierEvmEvent<DepositedArgs>): Promise<void> {
  const deposited = new Deposited(`${event.transactionHash}-${event.logIndex.toString()}`);
  deposited.txHash = event.transactionHash;
  deposited.trader = event.args.trader;
  deposited.amount = event.args.amount.toString();
  deposited.blockNumberLogIndex = BigInt(event.blockNumber) * BigInt(1000) + BigInt(event.logIndex);
  deposited.blockNumber = BigInt(event.blockNumber);
  deposited.timestamp = event.blockTimestamp;
  await deposited.save();
}
