import type { UserData, AggregateBonded, QuestData } from '../types/index';
import {
  PublicAccount,
  AccountMetadataTransaction,
  Deadline,
  KeyGenerator,
  Convert,
  TransferTransaction,
  AggregateTransaction,
  UInt64,
  Mosaic,
  PlainMessage,
  HashLockTransaction,
  RepositoryFactoryHttp,
} from 'symbol-sdk';
import { setTransaction, requestSign } from 'sss-module';
import { apiClient } from 'src/shared/lib/apiClient';
import {
  epochAdjustment,
  networkCurrencyMosaicId,
  networkCurrencyDivisibility,
  createAccountTaxMessage,
  adminPublic,
  guildUserMetadataKey,
  createAccountTaxFee,
  networkType,
  createQuestTaxMessage,
  createQuestTaxFee,
  acceptQuestTaxFee,
  node,
} from './config';
const repositoryFactory = new RepositoryFactoryHttp(node);
const transactionHttp = repositoryFactory.createTransactionRepository();

export const approveRequestContract = async function (questData: QuestData) {
  const worker = PublicAccount.createFromPublicKey(
    questData.workerPubKey,
    networkType,
  );
  const tx = TransferTransaction.create(
    Deadline.create(epochAdjustment),
    worker.address,
    [new Mosaic(networkCurrencyMosaicId, UInt64.fromUint(questData.reward))],
    PlainMessage.create(questData.id),
    networkType,
  ).setMaxFee(100);
  setTransaction(tx);
  const signed = await requestSign();
  transactionHttp.announce(signed).subscribe((x) => {
    console.log(x);
  });
  return signed.hash;
};

export const acceptRequestContract = async function (id: string) {
  const taxTx = TransferTransaction.create(
    Deadline.create(epochAdjustment),
    adminPublic.address,
    [new Mosaic(networkCurrencyMosaicId, UInt64.fromUint(acceptQuestTaxFee))],
    PlainMessage.create(id),
    networkType,
  ).setMaxFee(100);
  setTransaction(taxTx);
  const signed = await requestSign();
  transactionHttp.announce(signed).subscribe((x) => {
    console.log(x);
  });
  return signed.hash;
};

export const createQuestContract = async function () {
  const taxTx = TransferTransaction.create(
    Deadline.create(epochAdjustment),
    adminPublic.address,
    [new Mosaic(networkCurrencyMosaicId, UInt64.fromUint(createQuestTaxFee))],
    PlainMessage.create(createQuestTaxMessage),
    networkType,
  ).setMaxFee(100);
  setTransaction(taxTx);
  const signed = await requestSign();
  transactionHttp.announce(signed).subscribe((x) => {
    console.log(x);
  });
  return signed.hash;
};

export const signUpContract = async function (formData: UserData) {
  const json = JSON.stringify(formData);
  const userPublic = PublicAccount.createFromPublicKey(
    formData.publicKey,
    networkType,
  );
  const metaTx = AccountMetadataTransaction.create(
    Deadline.createEmtpy(),
    userPublic.address,
    KeyGenerator.generateUInt64Key(guildUserMetadataKey),
    json.length,
    Convert.utf8ToUint8(json),
    networkType,
  );

  let aggTx = AggregateTransaction.createBonded(
    Deadline.create(epochAdjustment),
    [metaTx.toAggregate(adminPublic)],
    networkType,
    [],
  ).setMaxFeeForAggregate(100, 1);

  if (createAccountTaxFee != 0) {
    const taxTx = TransferTransaction.create(
      Deadline.createEmtpy(),
      adminPublic.address,
      [
        new Mosaic(
          networkCurrencyMosaicId,
          UInt64.fromUint(createAccountTaxFee),
        ),
      ],
      PlainMessage.create(createAccountTaxMessage),
      networkType,
    );
    aggTx.innerTransactions.push(taxTx.toAggregate(userPublic));
    aggTx = aggTx.setMaxFeeForAggregate(100, 1);
  }

  setTransaction(aggTx);
  const signedAggTransaction = await requestSign();

  const hashLockTransaction = HashLockTransaction.create(
    Deadline.create(epochAdjustment),
    new Mosaic(
      networkCurrencyMosaicId,
      UInt64.fromUint(10 * Math.pow(10, networkCurrencyDivisibility)),
    ),
    UInt64.fromUint(5760),
    signedAggTransaction,
    networkType,
  ).setMaxFee(100);

  setTimeout(async () => {
    setTransaction(hashLockTransaction);
    const signedHashLockTransaction = await requestSign();
    const aggregateBonded: AggregateBonded = {
      signedAggTransaction,
      signedHashLockTransaction,
    };
    const aggregateTransactionData = await apiClient.post(
      '/api/signUp',
      aggregateBonded,
    );
    console.log(aggregateTransactionData);

    return aggTx;
  }, 1000);
};
