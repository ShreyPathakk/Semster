// utilities/group-encryption.ts
import { Buffer } from '@craftzdog/react-native-buffer';
import { randomBytes, secretbox, box } from 'tweetnacl';
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from 'tweetnacl-util';

/**
 * Generate a new key pair for the user (public/secret keys)
 */
export const generateUserKeyPair = (): { publicKey: string; secretKey: string } => {
  const keyPair = box.keyPair();
  return {
    publicKey: encodeBase64(keyPair.publicKey),
    secretKey: encodeBase64(keyPair.secretKey),
  };
};

/**
 * Generate a new symmetric key for the group
 */
export const generateGroupKey = (): string => {
  const key = randomBytes(secretbox.keyLength);
  return encodeBase64(key);
};

/**
 * Encrypt the group key for a new member using public-key encryption
 */
export const encryptGroupKey = (
  groupKey: string,
  adminSecretKey: string,
  memberPublicKey: string
): string => {
  try {
    const adminSecretUint8 = decodeBase64(adminSecretKey);
    const memberPublicUint8 = decodeBase64(memberPublicKey);
    const groupKeyUint8 = decodeBase64(groupKey);
    
    const nonce = randomBytes(box.nonceLength);
    const encrypted = box(groupKeyUint8, nonce, memberPublicUint8, adminSecretUint8);
    
    const fullMessage = new Uint8Array(nonce.length + encrypted.length);
    fullMessage.set(nonce);
    fullMessage.set(encrypted, nonce.length);
    
    return encodeBase64(fullMessage);
  } catch (error) {
    console.error('Error encrypting group key:', error);
    throw new Error('Failed to encrypt group key');
  }
};

/**
 * Decrypt the group key using public-key decryption
 */
export const decryptGroupKey = (
  encryptedGroupKey: string,
  adminPublicKey: string,
  memberSecretKey: string
): string => {
  try {
    const adminPublicUint8 = decodeBase64(adminPublicKey);
    const memberSecretUint8 = decodeBase64(memberSecretKey);
    const encryptedUint8 = decodeBase64(encryptedGroupKey);
    
    const nonce = encryptedUint8.slice(0, box.nonceLength);
    const ciphertext = encryptedUint8.slice(box.nonceLength);
    
    const decrypted = box.open(ciphertext, nonce, adminPublicUint8, memberSecretUint8);
    if (!decrypted) {
      throw new Error('Could not decrypt group key');
    }
    
    return encodeBase64(decrypted);
  } catch (error) {
    console.error('Error decrypting group key:', error);
    throw new Error('Failed to decrypt group key');
  }
};

/**
 * Encrypt a message using the group key
 */
export const encryptGroupMessage = (
  message: string,
  groupKey: string
): { encrypted: string; nonce: string } => {
  try {
    const keyUint8 = decodeBase64(groupKey);
    const nonce = randomBytes(secretbox.nonceLength);
    const messageUint8 = decodeUTF8(message);
    const encrypted = secretbox(messageUint8, nonce, keyUint8);
    
    return {
      encrypted: encodeBase64(encrypted),
      nonce: encodeBase64(nonce)
    };
  } catch (error) {
    console.error('Error encrypting message:', error);
    throw new Error('Failed to encrypt message');
  }
};

/**
 * Decrypt a message using the group key
 */
export const decryptGroupMessage = (
  encryptedMessage: string,
  nonce: string,
  groupKey: string
): string => {
  try {
    const keyUint8 = decodeBase64(groupKey);
    const nonceUint8 = decodeBase64(nonce);
    const messageUint8 = decodeBase64(encryptedMessage);
    
    const decrypted = secretbox.open(messageUint8, nonceUint8, keyUint8);
    if (!decrypted) {
      throw new Error('Could not decrypt message');
    }
    
    return encodeUTF8(decrypted);
  } catch (error) {
    console.error('Error decrypting message:', error);
    throw new Error('Failed to decrypt message');
  }
};

/**
 * Verify if a group key is valid
 */
export const verifyGroupKey = (groupKey: string): boolean => {
  try {
    const keyUint8 = decodeBase64(groupKey);
    return keyUint8.length === secretbox.keyLength;
  } catch {
    return false;
  }
};