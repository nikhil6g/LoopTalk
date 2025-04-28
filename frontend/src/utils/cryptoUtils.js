export async function generateKeyPair() {
  //used SubtleCrypto API (built-in in browser).
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP", // Asymmetric encryption algorithm
      modulusLength: 2048, // this is the key size in bits
      publicExponent: new Uint8Array([1, 0, 1]), // 65537 . publicExponent is a prime number used in RSA
      hash: "SHA-256", // hash function to use.
    },
    true, // whether the key is extractable (i.e. can be used in exportKey)
    ["encrypt", "decrypt"] // what this key can be used for
  );

  return keyPair;
}

export async function generateAESKey() {
  const key = await crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );

  const rawKey = await crypto.subtle.exportKey("raw", key);
  return rawKey; // ArrayBuffer
}

export async function exportKey(key, isPublicKey = false) {
  const format = isPublicKey ? "spki" : "pkcs8"; //format is needed because we need to export the key in a specific format

  const exported = await window.crypto.subtle.exportKey(format, key);

  const exportedAsString = window.btoa(
    String.fromCharCode(...new Uint8Array(exported))
  );

  return exportedAsString;
}

export async function importPublicKey(publicKeyString) {
  const binaryDerString = atob(publicKeyString); // base64 decode
  const binaryDer = new Uint8Array(
    [...binaryDerString].map((c) => c.charCodeAt(0))
  );

  const publicKey = crypto.subtle.importKey(
    "spki", // because public key
    binaryDer.buffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );

  return publicKey;
}

export async function importPrivateKey(privateKeyString) {
  const binaryDerString = atob(privateKeyString); // base64 decode
  const binaryDer = new Uint8Array(
    [...binaryDerString].map((c) => c.charCodeAt(0))
  );

  const privateKey = await crypto.subtle.importKey(
    "pkcs8", // because private key
    binaryDer.buffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["decrypt"]
  );

  return privateKey;
}

export async function importAESKey(aesKeyString) {
  const aesKey = await crypto.subtle.importKey(
    "raw",
    aesKeyString,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  return aesKey;
}

export async function encryptPrivateKey(privateKeyString, password) {
  // 1. Derive key from password using PBKDF2
  const encoder = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16)); // random salt
  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const aesKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt"]
  );

  // 2. Encrypt the private key
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // random IV
  const encryptedContent = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    aesKey,
    encoder.encode(privateKeyString)
  );

  // 3. Return salt, iv, and encrypted data (all base64)
  return {
    salt: window.btoa(String.fromCharCode(...salt)),
    iv: window.btoa(String.fromCharCode(...iv)),
    encryptedPrivateKey: window.btoa(
      String.fromCharCode(...new Uint8Array(encryptedContent))
    ),
  };
}

export async function decryptPrivateKey(
  encryptedPrivateKey,
  password,
  salt,
  iv
) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // 1. Convert base64 strings back to Uint8Arrays
  const saltBytes = Uint8Array.from(atob(salt), (c) => c.charCodeAt(0));
  const ivBytes = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));
  const encryptedPrivateKeyBytes = Uint8Array.from(
    atob(encryptedPrivateKey),
    (c) => c.charCodeAt(0)
  );

  // 2. Derive AES key again from password and salt
  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const aesKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 100000,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["decrypt"]
  );

  // 3. Decrypt private key
  const decryptedContent = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: ivBytes,
    },
    aesKey,
    encryptedPrivateKeyBytes
  );

  const decryptedPrivateKeyString = decoder.decode(decryptedContent);

  return decryptedPrivateKeyString; // this is original private key string (PEM/Base64)
}

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return window.btoa(binary);
}

function base64ToBuffer(base64) {
  const binary = window.atob(base64);
  const len = binary.length;
  const buffer = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer;
}

export async function encryptAESKeyForUsers(rawAESKey, userPublicKeys) {
  // rawAESKey: ArrayBuffer
  // userPublicKeys: { userId: publicKeyCryptoKey } map

  const encryptedKeys = [];

  for (const [userId, publicKey] of Object.entries(userPublicKeys)) {
    const encryptedAESKey = await crypto.subtle.encrypt(
      {
        name: "RSA-OAEP",
      },
      publicKey, // publicKey should be CryptoKey object
      rawAESKey
    );

    encryptedKeys.push({
      user: userId,
      encryptedAESKey: bufferToBase64(encryptedAESKey), // encode to string
    });
  }

  return encryptedKeys; // Array of { userId, encryptedAESKey }
}

export async function decryptOwnAESKey(encryptedAESKeyBase64, privateKey) {
  const encryptedAESKeyBuffer = base64ToBuffer(encryptedAESKeyBase64);

  const decryptedAESKey = await crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    privateKey, // your privateKey (CryptoKey object)
    encryptedAESKeyBuffer
  );

  return decryptedAESKey; // ArrayBuffer (raw AES key)
}

export async function encryptMessage(messageText, aesKey) {
  // Generate random 12-byte IV (Initialization Vector)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encode message to ArrayBuffer
  const encoder = new TextEncoder();
  const encodedMessage = encoder.encode(messageText);

  // Encrypt the message
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    aesKey,
    encodedMessage
  );

  // Return Base64 encoded ciphertext and IV
  return {
    ciphertext: bufferToBase64(ciphertext),
    iv: bufferToBase64(iv),
  };
}

export async function decryptMessage(ciphertextBase64, ivBase64, aesKey) {
  // Decode ciphertext and IV
  const ciphertextBuffer = base64ToBuffer(ciphertextBase64);
  const ivBuffer = base64ToBuffer(ivBase64);

  // Decrypt
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: ivBuffer,
    },
    aesKey,
    ciphertextBuffer
  );

  // Convert back to string
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}
