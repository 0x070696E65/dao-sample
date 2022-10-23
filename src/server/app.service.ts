import { Injectable } from '@nestjs/common';
import {
  AggregateTransactionCosignature,
  SignedTransaction,
  CosignatureTransaction,
  Account,
  NetworkType,
  AggregateTransaction,
  RepositoryFactoryHttp,
  Transaction,
  PublicAccount,
  EncryptedMessage,
} from 'symbol-sdk';
@Injectable()
export class AppService {
  async cosignWithAdmin(
    signedTransaction: SignedTransaction,
    aggregateTransactionCosignature: AggregateTransactionCosignature[],
  ): Promise<string | undefined> {
    const networkType =
      Number(process.env.NETWORK_TYPE) == 152
        ? NetworkType.TEST_NET
        : NetworkType.MAIN_NET;
    const admin = Account.createFromPrivateKey(
      process.env.ADMIN_PRIVATE_KEY!,
      networkType,
    );
    const cosignedTransaction = CosignatureTransaction.signTransactionPayload(
      admin,
      signedTransaction.payload,
      process.env.GENERATION_HASH!,
    );
    const cosignature = new AggregateTransactionCosignature(
      cosignedTransaction.signature,
      admin.publicAccount,
    );
    const agg = AggregateTransaction.createFromPayload(
      signedTransaction.payload,
    );
    agg.cosignatures.push(cosignature);
    if (aggregateTransactionCosignature.length != 0) {
      for (let i = 0; i < aggregateTransactionCosignature.length; i++) {
        const cosignature = new AggregateTransactionCosignature(
          aggregateTransactionCosignature[i].signature,
          PublicAccount.createFromPublicKey(
            aggregateTransactionCosignature[i].signer.publicKey,
            networkType,
          ),
        );
        console.log(cosignature);
        agg.cosignatures.push(cosignature);
      }
    }
    const signedHash = Transaction.createTransactionHash(
      signedTransaction.payload,
      [...Buffer.from(process.env.GENERATION_HASH!, 'hex')],
    );
    const repositoryFactoryHttp = new RepositoryFactoryHttp(
      process.env.NODE_URL!,
    );
    if (agg.signer?.publicKey == undefined)
      throw new Error('no signer public key');
    console.log(agg);
    const signed = new SignedTransaction(
      agg.serialize(),
      signedHash,
      agg.signer?.publicKey,
      agg.type,
      networkType,
    );
    const txRepo = repositoryFactoryHttp.createTransactionRepository();
    const result = await txRepo.announce(signed).toPromise();
    return result?.message;
  }
  verifyToken(arr: string[]): string {
    const networkType =
      Number(process.env.NETWORK_TYPE) == 152
        ? NetworkType.TEST_NET
        : NetworkType.MAIN_NET;
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
  getHello(): string {
    return 'Hello World!';
  }
}
