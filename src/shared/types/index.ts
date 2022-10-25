import { SignedTransaction, AggregateTransactionCosignature } from 'symbol-sdk';
type SignedAndCosig = {
  signedTransaction: SignedTransaction;
  aggregateTransactionCosignatures: AggregateTransactionCosignature[];
};
type UserData = {
  name: string;
  address: string;
  publicKey: string;
};

type QuestData = {
  id: string;
  requesterPubKey: string;
  workerPubKey: string;
  title: string;
  details: string;
  reward: number;
  status: number;
};

type AggregateBonded = {
  signedAggTransaction: SignedTransaction;
  signedHashLockTransaction: SignedTransaction;
};
export type { SignedAndCosig, UserData, QuestData, AggregateBonded };
