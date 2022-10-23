import { SignedTransaction, AggregateTransactionCosignature } from 'symbol-sdk';
type SignedAndCosig = {
  signedTransaction: SignedTransaction;
  aggregateTransactionCosignatures: AggregateTransactionCosignature[];
};

export type { SignedAndCosig };
