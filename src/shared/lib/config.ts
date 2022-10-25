import { MosaicId, NetworkType, PublicAccount } from 'symbol-sdk';

export const networkType = NetworkType.TEST_NET;
export const node = 'https://mikun-testnet.tk:3001';
export const generationHash =
  '7FCCD304802016BEBBCD342A332F91FF1F3BB5E902988B352697BE245F48E836';
export const adminPublic = PublicAccount.createFromPublicKey(
  'CD5BBD868762461096AAEFF3ECC4254099F9B60F538CF3EB47359F27A9185060',
  networkType,
);
export const guildUserMetadataKey = 'GuildUser';
export const epochAdjustment = 1637848847;
export const networkCurrencyMosaicId = new MosaicId('3A8416DB2D53B6C8');
export const networkCurrencyDivisibility = 6;
export const createAccountTaxFee = 0;
export const createQuestTaxFee = 0;
export const acceptQuestTaxFee = 0;
export const questMetadataKey = 'QuestDetails';
export const createAccountTaxMessage = 'Create Account Fee';
export const createQuestTaxMessage = 'Create Quest Fee';
