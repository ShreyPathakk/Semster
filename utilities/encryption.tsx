// utils/encryption.ts
import { Buffer } from 'buffer';
import { randomBytes, secretbox, box } from 'tweetnacl';  // Changed from getRandomBytes to randomBytes
import { encodeBase64, decodeBase64 } from 'tweetnacl-util';

// Generate a new key pair for the user
export const generateKeyPair = () => {
  const keyPair = box.keyPair();
  return {
    publicKey: encodeBase64(keyPair.publicKey),
    secretKey: encodeBase64(keyPair.secretKey)
  };
};

// Encrypt a message
export const encryptMessage = (message: string, senderSecretKey: string, receiverPublicKey: string) => {
  // Convert keys from base64
  const secretKeyUint8 = decodeBase64(senderSecretKey);
  const publicKeyUint8 = decodeBase64(receiverPublicKey);
  
  // Generate one-time nonce using randomBytes instead of getRandomBytes
  const nonce = randomBytes(box.nonceLength);
  
  // Convert message to Uint8Array
  const messageUint8 = new TextEncoder().encode(message);
  
  // Encrypt
  const encrypted = box(
    messageUint8,
    nonce,
    publicKeyUint8,
    secretKeyUint8
  );
  
  // Combine nonce and encrypted message
  const fullMessage = new Uint8Array(nonce.length + encrypted.length);
  fullMessage.set(nonce);
  fullMessage.set(encrypted, nonce.length);
  
  // Convert to base64 for storage
  return encodeBase64(fullMessage);
};

// Decrypt a message
export const decryptMessage = (encryptedMessage: string, receiverSecretKey: string, senderPublicKey: string) => {
  // Convert keys from base64
  const secretKeyUint8 = decodeBase64(receiverSecretKey);
  const publicKeyUint8 = decodeBase64(senderPublicKey);
  
  // Convert encrypted message from base64
  const messageWithNonceAsUint8 = decodeBase64(encryptedMessage);
  
  // Extract nonce
  const nonce = messageWithNonceAsUint8.slice(0, box.nonceLength);
  const message = messageWithNonceAsUint8.slice(box.nonceLength);
  
  // Decrypt
  const decrypted = box.open(
    message,
    nonce,
    publicKeyUint8,
    secretKeyUint8
  );
  
  if (!decrypted) {
    throw new Error('Could not decrypt message');
  }
  
  // Convert to string
  return new TextDecoder().decode(decrypted);
};