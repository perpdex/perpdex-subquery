import * as bn from 'bignumber.js';
import { STR_ZERO } from './number';

export function getBadDebt(collateral: string): string {
  const c = new bn.BigNumber(collateral);
  return c.isNegative() ? c.negated().toString() : STR_ZERO;
}
