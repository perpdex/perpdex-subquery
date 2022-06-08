import { Deposited } from '../types';
import { FrontierEvmEvent } from '@subql/contract-processors/dist/frontierEvm';
import { BigNumber } from 'ethers';
import { getOrCreateTrader, getOrCreateProtocol } from '../utils/store';
import { getBadDebt } from '../utils/model';
import { str_plus, str_minus } from '../utils/number';

type DepositedArgs = [string, BigNumber] & { trader: string; amount: BigNumber };

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
