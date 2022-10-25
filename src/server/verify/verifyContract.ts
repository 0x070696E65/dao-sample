import {
  SignedTransaction,
  AggregateTransaction,
  TransferTransaction,
} from 'symbol-sdk';
import { adminPublic } from '../../shared/lib/config';

export const verifyCreateQuestContract = function (
  signedTransaction: SignedTransaction,
) {
  const agg = AggregateTransaction.createFromPayload(signedTransaction.payload);
  const filtered = agg.innerTransactions.filter((tx) => {
    return (
      tx.type == 16724 &&
      (tx as TransferTransaction).recipientAddress != adminPublic.address
    );
  });
  if (filtered.length != 0) return false;
  return true;
};
