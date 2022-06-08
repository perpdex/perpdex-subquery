import { Deposited, Withdrawn } from '../types';
import { FrontierEvmEvent } from '@subql/contract-processors/dist/frontierEvm';
import { BigNumber } from 'ethers';
import { getOrCreateTrader, getOrCreateProtocol } from '../utils/store';
import { getBadDebt } from '../utils/model';
import { str_plus, str_minus } from '../utils/number';

type DepositedArgs = [string, BigNumber] & { trader: string; amount: BigNumber };
type WithdrawnArgs = [string, BigNumber] & { trader: string; amount: BigNumber };

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
