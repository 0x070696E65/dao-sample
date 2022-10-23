import type { NextPage } from 'next';
import { useState, useEffect, ChangeEvent } from 'react';
import {
  getActiveAddress,
  getActivePublicKey,
  isAllowedSSS,
  setTransaction,
  requestSign,
  getActiveAccountToken,
} from 'sss-module';
import {
  Deadline,
  NetworkType,
  PublicAccount,
  AccountMetadataTransaction,
  KeyGenerator,
  Convert,
  TransferTransaction,
  Mosaic,
  MosaicId,
  PlainMessage,
  UInt64,
  AggregateTransaction,
  RepositoryFactoryHttp,
  Address,
  Account,
  MultisigAccountModificationTransaction,
  CosignatureTransaction,
  AggregateTransactionCosignature,
  MultisigAccountInfo,
} from 'symbol-sdk';
import { apiClient } from 'src/shared/lib/apiClient';
import { SignedAndCosig } from '../shared/types';

type FormData = {
  name: string;
  address: string;
  publicKey: string;
};

type QuestData = {
  publicKey: string;
  ownerPubKey: string;
  title: string;
  details: string;
  reward: number;
  status: number;
};

const Home: NextPage = () => {
  const repositoryFactoryHttp = new RepositoryFactoryHttp(
    process.env.NEXT_PUBLIC_NODE_URL!,
  );
  const metaRepo = repositoryFactoryHttp.createMetadataRepository();
  const multisigRepo = repositoryFactoryHttp.createMultisigRepository();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    address: '',
    publicKey: '',
  });
  const [error, setError] = useState<string>();
  const [userData, setUserData] = useState<FormData>({
    name: '',
    address: '',
    publicKey: '',
  });
  const [questData, setQuestData] = useState<QuestData>({
    publicKey: '',
    ownerPubKey: '',
    title: '',
    details: '',
    reward: 0,
    status: 0,
  });
  const [questDatas, setQuestDatas] = useState<QuestData[]>([]);
  const [userRequestDatas, setUserRequestDatas] = useState<QuestData[]>([]);
  const [userWorksDatas, setuserWorksDatas] = useState<QuestData[]>([]);
  const [login, setLogin] = useState<boolean>(false);

  const networkType =
    Number(process.env.NEXT_PUBLIC_NETWORK_TYPE) == 152
      ? NetworkType.TEST_NET
      : NetworkType.MAIN_NET;
  const adminPublic = PublicAccount.createFromPublicKey(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    process.env.NEXT_PUBLIC_ADMIN_PUBLIC_KEY!,
    networkType,
  );

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  const handleQuestChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setQuestData({ ...questData, [name]: value });
  };
  const filterUserWorks = async function (
    quests: QuestData[],
    publicKey: string,
  ) {
    const userAddress = Address.createFromPublicKey(publicKey, networkType);

    const result: QuestData[] = [];
    for (let i = 0; i < quests.length; i++) {
      const multisigDatas = await multisigRepo
        .getMultisigAccountInfo(
          PublicAccount.createFromPublicKey(quests[i].publicKey, networkType)
            .address,
        )
        .toPromise();
      const b = multisigDatas?.cosignatoryAddresses.some((a) => {
        return a.plain() == userAddress.plain();
      });
      if (b) {
        result.push(quests[i]);
      }
    }
    return result.filter((val) => {
      return val.ownerPubKey != publicKey;
    });
  };
  const filterUserRequests = async function (
    quests: QuestData[],
    publicKey: string,
  ) {
    const userAddress = Address.createFromPublicKey(publicKey, networkType);
    const result: QuestData[] = [];
    for (let i = 0; i < quests.length; i++) {
      const multisigDatas = await multisigRepo
        .getMultisigAccountInfo(
          PublicAccount.createFromPublicKey(quests[i].publicKey, networkType)
            .address,
        )
        .toPromise();
      const b = multisigDatas?.cosignatoryAddresses.some((a) => {
        return a.plain() == userAddress.plain();
      });
      if (b) {
        result.push(quests[i]);
      }
    }
    return result.filter((val) => {
      return val.ownerPubKey == publicKey;
    });
  };
  const getQuests = async function () {
    try {
      const multisigDatas = await multisigRepo
        .getMultisigAccountInfo(adminPublic.address)
        .toPromise();
      if (multisigDatas == undefined) return;
      const quests: QuestData[] = [];
      for (let i = 0; i < multisigDatas.multisigAddresses.length; i++) {
        const add = Address.createFromRawAddress(
          multisigDatas?.multisigAddresses[i].plain(),
        );
        const meta = await metaRepo
          .search({
            sourceAddress: adminPublic.address,
            targetAddress: add,
            //scopedMetadataKey: process.env.NEXT_PUBLIC_QUEST_METADATA_KEY,
          })
          .toPromise();
        const value = meta?.data[0].metadataEntry.value;
        if (value == undefined) continue;
        const questData: QuestData = JSON.parse(value);
        const multisigQuest = await multisigRepo
          .getMultisigAccountInfo(add)
          .toPromise();
        if (multisigQuest == undefined) continue;
        if (multisigQuest?.cosignatoryAddresses.length > 2) {
          questData.status = 1;
        }
        quests.push(questData);
      }
      return quests;
    } catch {
      //
    }
  };
  const signUp = async function () {
    const json = JSON.stringify(formData);
    const userPublic = PublicAccount.createFromPublicKey(
      formData.publicKey,
      networkType,
    );
    const metaTx = AccountMetadataTransaction.create(
      Deadline.createEmtpy(),
      userPublic.address,
      KeyGenerator.generateUInt64Key(
        process.env.NEXT_PUBLIC_USER_METADATA_KEY!,
      ),
      json.length,
      Convert.utf8ToUint8(json),
      networkType,
    );
    const taxTx = TransferTransaction.create(
      Deadline.createEmtpy(),
      adminPublic.address,
      [new Mosaic(new MosaicId('3A8416DB2D53B6C8'), UInt64.fromUint(1000000))],
      PlainMessage.create('Create Account Fee'),
      networkType,
    );
    const aggTx = AggregateTransaction.createComplete(
      Deadline.create(1637848847),
      [metaTx.toAggregate(adminPublic), taxTx.toAggregate(userPublic)],
      networkType,
      [],
    ).setMaxFeeForAggregate(100, 1);
    setTransaction(aggTx);
    const signed = await requestSign();
    const signedAndCosig: SignedAndCosig = {
      signedTransaction: signed,
      aggregateTransactionCosignatures: [],
    };
    const aggregateTransactionData = await apiClient.post(
      '/api/cosignWithAdmin',
      signedAndCosig,
    );
    console.log(aggregateTransactionData);
  };
  const signIn = async function () {
    try {
      console.log(process.env.NEXT_PUBLIC_ADMIN_PUBLIC_KEY!);
      const token = await getActiveAccountToken(
        process.env.NEXT_PUBLIC_ADMIN_PUBLIC_KEY!,
      );
      const result = await apiClient.post('/api/verifyToken', [
        formData.publicKey,
        token,
      ]);
      if (formData.address != result.data.signerAddress) {
        throw new Error('署名者が違います');
      }
      const userAddress = Address.createFromRawAddress(
        result.data.signerAddress,
      );
      const metadata = await metaRepo
        .search({
          targetAddress: userAddress,
          sourceAddress: Address.createFromPublicKey(
            process.env.NEXT_PUBLIC_ADMIN_PUBLIC_KEY!,
            networkType,
          ),
          scopedMetadataKey: KeyGenerator.generateUInt64Key(
            process.env.NEXT_PUBLIC_USER_METADATA_KEY!,
          ).toHex(),
        })
        .toPromise();
      if (metadata?.data[0].metadataEntry.value == undefined)
        throw new Error('アカウントが存在しません');
      const json = JSON.parse(metadata?.data[0].metadataEntry.value);
      if (json.address == userAddress.plain()) {
        setUserData({
          name: json.name,
          address: json.address,
          publicKey: json.publicKey,
        });
        setLogin(true);
      }
    } catch {
      setError('アカウントが存在しません');
    }
  };
  const approveRequest = async (publicKey: string) => {
    const treasureAccount = PublicAccount.createFromPublicKey(
      publicKey,
      networkType,
    );
    const userPublic = PublicAccount.createFromPublicKey(
      formData.publicKey,
      networkType,
    );
    const multisig1 = MultisigAccountModificationTransaction.create(
      Deadline.createEmtpy(),
      -1,
      -1,
      [],
      [userPublic.address],
      networkType,
    );
    const multisig2 = MultisigAccountModificationTransaction.create(
      Deadline.createEmtpy(),
      0,
      0,
      [],
      [adminPublic.address],
      networkType,
    );
    const taxTx = TransferTransaction.create(
      Deadline.createEmtpy(),
      adminPublic.address,
      [new Mosaic(new MosaicId('3A8416DB2D53B6C8'), UInt64.fromUint(1000000))],
      PlainMessage.create('Approve Quest Fee'),
      networkType,
    );
    const aggTx = AggregateTransaction.createComplete(
      Deadline.create(1637848847),
      [
        multisig1.toAggregate(treasureAccount),
        multisig2.toAggregate(treasureAccount),
        taxTx.toAggregate(userPublic),
      ],
      networkType,
      [],
    ).setMaxFeeForAggregate(100, 2);
    setTransaction(aggTx);
    const signed = await requestSign();
    const signedAndCosig: SignedAndCosig = {
      signedTransaction: signed,
      aggregateTransactionCosignatures: [],
    };
    const aggregateTransactionData = await apiClient.post(
      '/api/cosignWithAdmin',
      signedAndCosig,
    );
    console.log(aggregateTransactionData);
  };
  const createQuest = async () => {
    const treasureAccount = Account.generateNewAccount(networkType);
    const userPublic = PublicAccount.createFromPublicKey(
      formData.publicKey,
      networkType,
    );
    questData.publicKey = treasureAccount.publicKey;
    questData.ownerPubKey = formData.publicKey;
    const json = JSON.stringify(questData);
    const multisig = MultisigAccountModificationTransaction.create(
      Deadline.createEmtpy(),
      1,
      1,
      [adminPublic.address, userPublic.address],
      [],
      networkType,
    );
    const transferRewardTx = TransferTransaction.create(
      Deadline.createEmtpy(),
      treasureAccount.address,
      [
        new Mosaic(
          new MosaicId('3A8416DB2D53B6C8'),
          UInt64.fromUint(Number(questData.reward)),
        ),
      ],
      PlainMessage.create('Order Quest Fee'),
      networkType,
    );
    const metaTx = AccountMetadataTransaction.create(
      Deadline.createEmtpy(),
      treasureAccount.address,
      KeyGenerator.generateUInt64Key(
        process.env.NEXT_PUBLIC_QUEST_METADATA_KEY!,
      ),
      json.length,
      Convert.utf8ToUint8(json),
      networkType,
    );
    const taxTx = TransferTransaction.create(
      Deadline.createEmtpy(),
      adminPublic.address,
      [new Mosaic(new MosaicId('3A8416DB2D53B6C8'), UInt64.fromUint(1000000))],
      PlainMessage.create('Order Quest Fee'),
      networkType,
    );
    const aggTx = AggregateTransaction.createComplete(
      Deadline.create(1637848847),
      [
        transferRewardTx.toAggregate(userPublic),
        multisig.toAggregate(treasureAccount.publicAccount),
        metaTx.toAggregate(adminPublic),
        taxTx.toAggregate(userPublic),
      ],
      networkType,
      [],
    ).setMaxFeeForAggregate(100, 2);
    setTransaction(aggTx);
    const signed = await requestSign();
    const cosignedTransaction = CosignatureTransaction.signTransactionPayload(
      treasureAccount,
      signed.payload,
      process.env.NEXT_PUBLIC_GENERATION_HASH!,
    );
    const cosignature = new AggregateTransactionCosignature(
      cosignedTransaction.signature,
      treasureAccount.publicAccount,
    );
    const signedAndCosig: SignedAndCosig = {
      signedTransaction: signed,
      aggregateTransactionCosignatures: [cosignature],
    };
    const aggregateTransactionData = await apiClient.post(
      '/api/cosignWithAdmin',
      signedAndCosig,
    );
    console.log(aggregateTransactionData);
  };
  const acceptRequest = async (publicKey: string) => {
    const userPublic = PublicAccount.createFromPublicKey(
      formData.publicKey,
      networkType,
    );
    const multisigTx = MultisigAccountModificationTransaction.create(
      Deadline.createEmtpy(),
      1,
      1,
      [userPublic.address],
      [],
      networkType,
    );
    const taxTx = TransferTransaction.create(
      Deadline.createEmtpy(),
      adminPublic.address,
      [new Mosaic(new MosaicId('3A8416DB2D53B6C8'), UInt64.fromUint(1000000))],
      PlainMessage.create('Accept Quest Fee'),
      networkType,
    );
    const aggTx = AggregateTransaction.createComplete(
      Deadline.create(1637848847),
      [
        multisigTx.toAggregate(
          PublicAccount.createFromPublicKey(publicKey, networkType),
        ),
        taxTx.toAggregate(userPublic),
      ],
      networkType,
      [],
    ).setMaxFeeForAggregate(100, 1);
    setTransaction(aggTx);
    const signed = await requestSign();
    const signedAndCosig: SignedAndCosig = {
      signedTransaction: signed,
      aggregateTransactionCosignatures: [],
    };
    const aggregateTransactionData = await apiClient.post(
      '/api/cosignWithAdmin',
      signedAndCosig,
    );
    console.log(aggregateTransactionData);
  };
  useEffect(() => {
    const init = async () => {
      setTimeout(async () => {
        if (!isAllowedSSS()) {
          alert('SSS Extensionをインストールし有効化してください');
        } else {
          const user: FormData = {
            name: '',
            address: getActiveAddress(),
            publicKey: getActivePublicKey(),
          };
          setFormData(user);
          const quests = await getQuests();
          if (quests == undefined) return;
          setQuestDatas(quests);

          setUserRequestDatas(await filterUserRequests(quests, user.publicKey));
          setuserWorksDatas(await filterUserWorks(quests, user.publicKey));
        }
      }, 500);
    };
    init();
  }, []);
  return (
    <div>
      {!login ? (
        <>
          <h2>Sign Up</h2>
          <div>
            <label>user name</label>
            <input
              type="text"
              name="name"
              onChange={handleChange}
              style={{ marginLeft: '10px', width: '200px' }}
              value={formData.name}
            ></input>
            <br />
            <label>address</label>
            <input
              type="text"
              name="address"
              onChange={handleChange}
              style={{ marginLeft: '10px', width: '350px' }}
              value={formData.address}
            ></input>
            <br />
            <label>public key</label>
            <input
              type="text"
              name="publicKey"
              onChange={handleChange}
              style={{ marginLeft: '10px', width: '510px' }}
              value={formData.publicKey}
            ></input>
            <br />
            <input type="button" value="sign up" onClick={signUp}></input>
          </div>
          <div>
            <h2>Sign In</h2>
            <label>address</label>
            <input
              type="text"
              name="address"
              style={{ marginLeft: '10px', width: '350px' }}
              onChange={handleChange}
              value={formData.address}
            ></input>
            <br />
            <br />
            <input type="button" value="sign in" onClick={signIn}></input>
            <p style={{ color: '#FF0000' }}>{error}</p>
          </div>
        </>
      ) : (
        <>
          <div>
            <label>name: </label>
            {userData.name}
          </div>
          <div>
            <label>address: </label>
            {userData.address}
          </div>
          <div>
            <label>publicKey: </label>
            {userData.publicKey}
          </div>
          <div>
            <h2>Quests</h2>
            <div>
              <h3>Request</h3>
              <label>title</label>
              <input
                type="text"
                name="title"
                style={{ marginLeft: '10px', width: '350px' }}
                onChange={handleQuestChange}
                value={questData.title}
              ></input>
              <br />
              <label>details</label>
              <input
                type="text"
                name="details"
                style={{ marginLeft: '10px', width: '350px' }}
                onChange={handleQuestChange}
                value={questData.details}
              ></input>
              <br />
              <label>reward</label>
              <input
                type="number"
                name="reward"
                style={{ marginLeft: '10px', width: '100px' }}
                onChange={handleQuestChange}
                value={questData.reward}
              ></input>
              <br />
              <br />
              <input
                type="button"
                value="request"
                onClick={createQuest}
              ></input>
            </div>
            <div>
              <h3>List</h3>
              {questDatas.map((val) => (
                <div
                  style={{
                    width: '450px',
                    border: '1px solid #000',
                    padding: '10px',
                    float: 'left',
                  }}
                >
                  <div>
                    <label style={{ marginRight: '10px' }}>id</label>
                    <span style={{ fontSize: '1px' }}>{val.publicKey}</span>
                  </div>
                  <div>
                    <label style={{ marginRight: '10px' }}>title</label>
                    {val.title}
                  </div>
                  <div>
                    <label style={{ marginRight: '10px' }}>details</label>
                    {val.details}
                  </div>
                  <div>
                    <label style={{ marginRight: '10px' }}>reward</label>
                    {val.reward}
                  </div>
                  {val.status == 0 ? (
                    <button onClick={() => acceptRequest(val.publicKey)}>
                      work
                    </button>
                  ) : (
                    ''
                  )}
                </div>
              ))}
            </div>
            <br style={{ clear: 'both' }} />
            <div style={{ marginTop: '10px' }}>
              <h3>Your Requests</h3>
              {userRequestDatas.map((val) => (
                <div
                  style={{
                    width: '450px',
                    border: '1px solid #000',
                    padding: '10px',
                    float: 'left',
                  }}
                >
                  <div>
                    <label style={{ marginRight: '10px' }}>id</label>
                    <span style={{ fontSize: '1px' }}>{val.publicKey}</span>
                  </div>
                  <div>
                    <label style={{ marginRight: '10px' }}>title</label>
                    {val.title}
                  </div>
                  <div>
                    <label style={{ marginRight: '10px' }}>details</label>
                    {val.details}
                  </div>
                  <div>
                    <label style={{ marginRight: '10px' }}>reward</label>
                    {val.reward}
                  </div>
                  <button onClick={() => approveRequest(val.publicKey)}>
                    approve
                  </button>
                </div>
              ))}
            </div>
            <br style={{ clear: 'both' }} />
            <div style={{ marginTop: '10px' }}>
              <h3>Your Works</h3>
              {userWorksDatas.map((val) => (
                <div
                  style={{
                    width: '450px',
                    border: '1px solid #000',
                    padding: '10px',
                    float: 'left',
                  }}
                >
                  <div>
                    <label style={{ marginRight: '10px' }}>id</label>
                    <span style={{ fontSize: '1px' }}>{val.publicKey}</span>
                  </div>
                  <div>
                    <label style={{ marginRight: '10px' }}>title</label>
                    {val.title}
                  </div>
                  <div>
                    <label style={{ marginRight: '10px' }}>details</label>
                    {val.details}
                  </div>
                  <div>
                    <label style={{ marginRight: '10px' }}>reward</label>
                    {val.reward}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div></div>
        </>
      )}
    </div>
  );
};

export default Home;
