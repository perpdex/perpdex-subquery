import * as bn from 'bignumber.js';

export const BI_ZERO = BigInt(0);
export const BI_ONE = BigInt(1);
export const STR_ZERO = '0';
export const DATE_ZERO = new Date(0);

export function str_plus(a: string, b: string): string {
  const bn_a = new bn.BigNumber(a);
  const bn_b = new bn.BigNumber(b);
  return bn_a.plus(bn_b).toString();
}

export function str_minus(a: string, b: string): string {
  const bn_a = new bn.BigNumber(a);
  const bn_b = new bn.BigNumber(b);
  return bn_a.minus(bn_b).toString();
}
