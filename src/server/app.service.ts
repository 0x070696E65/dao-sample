import { Injectable } from '@nestjs/common';
import { AggregateBonded } from '../shared/types/';
import {
  Account,
  RepositoryFactoryHttp,
  PublicAccount,
  EncryptedMessage,
} from 'symbol-sdk';
import { node, networkType } from '../shared/lib/config';
import * as fs from 'fs';
const repositoryFactory = new RepositoryFactoryHttp(node);
const listener = repositoryFactory.createListener();
const transactionHttp = repositoryFactory.createTransactionRepository();

import { filter, delay, mergeMap } from 'rxjs';
import { QuestData } from '../shared/types';
import datas from 'public/tempData/data.json';

@Injectable()
export class AppService {
  async signUp(aggregateBonded: AggregateBonded) {
    const signer = PublicAccount.createFromPublicKey(
      aggregateBonded.signedHashLockTransaction.signerPublicKey,
      networkType,
    );
    transactionHttp
      .announce(aggregateBonded.signedHashLockTransaction)
      .subscribe(
        (x) => {
          console.log(x);
        },
        (err) => console.error(err),
      );

    listener.open().then(() => {
      console.log('listener open');
      listener.newBlock();
      listener
        .confirmed(signer.address)
        .pipe(
          filter((tx) => {
            console.log(tx);
            return (
              tx.transactionInfo !== undefined &&
              tx.transactionInfo.hash ===
                aggregateBonded.signedHashLockTransaction.hash
            );
          }),
          delay(5000),
          mergeMap((_) => {
            return transactionHttp.announceAggregateBonded(
              aggregateBonded.signedAggTransaction,
            );
          }),
        )
        .subscribe(
          (x) => {
            console.log('tx Ok!!!', x);
            listener.close();
          },
          (err) => {
            console.error(err);
            listener.close();
          },
        );
    });
  }

  createQuest(questData: QuestData) {
    datas.datas.push(questData);
    console.log(datas);
    fs.writeFileSync('public/tempData/data.json', JSON.stringify(datas));
  }

  overrideQuest(questDatas: any) {
    console.log(questDatas);
    fs.writeFileSync('public/tempData/data.json', JSON.stringify(questDatas));
  }

  verifyToken(arr: string[]): string {
    const userPublicKey = PublicAccount.createFromPublicKey(
      arr[0],
      networkType,
    );
    const msg = new EncryptedMessage(arr[1], userPublicKey);
    const admin = Account.createFromPrivateKey(
      process.env.ADMIN_PRIVATE_KEY!,
      networkType,
    );
    const token = admin.decryptMessage(msg, userPublicKey).payload;
    return token;
  }
}
