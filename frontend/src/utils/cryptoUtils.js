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

export async function exportKey(key, isPublicKey = false) {
  const format = isPublicKey ? "spki" : "pkcs8"; //format is needed because we need to export the key in a specific format

  const exported = await window.crypto.subtle.exportKey(format, key);

  const exportedAsString = window.btoa(
    String.fromCharCode(...new Uint8Array(exported))
  );

  return exportedAsString;
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

  return decryptedPrivateKeyString; // this is your original private key string (PEM/Base64)
}
