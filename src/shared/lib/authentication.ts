import { firstValueFrom } from 'rxjs';
import { getActiveAccountToken, getActivePublicKey } from 'sss-module';
import { Address, RepositoryFactoryHttp, KeyGenerator } from 'symbol-sdk';
import { apiClient } from 'src/shared/lib/apiClient';
import { adminPublic, node, guildUserMetadataKey } from './config';
const repositoryFactory = new RepositoryFactoryHttp(node);
const metaHttp = repositoryFactory.createMetadataRepository();

export const auth = async function () {
  try {
    const token = await getActiveAccountToken(adminPublic.publicKey);
    const publicKey = getActivePublicKey();
    const result = await apiClient.post('/api/verifyToken', [publicKey, token]);

    const userAddress = Address.createFromRawAddress(result.data.signerAddress);
    const metadata = await firstValueFrom(
      metaHttp.search({
        targetAddress: userAddress,
        sourceAddress: adminPublic.address,
        scopedMetadataKey:
          KeyGenerator.generateUInt64Key(guildUserMetadataKey).toHex(),
      }),
    );
    if (metadata?.data[0].metadataEntry.value != undefined)
      return JSON.parse(metadata?.data[0].metadataEntry.value);
  } catch {
    throw new Error('アカウントが存在しません');
  }
};
