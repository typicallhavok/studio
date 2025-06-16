/**
 * Encrypts a file using AES-GCM encryption
 * @param file The file to encrypt
 * @param key Hex string SHA-256 key (64 characters)
 * @returns An encrypted Blob
 */
export async function encryptFile(file: File, key: string): Promise<Blob> {
  // Validate the key format (should be a 64-character hex string for SHA-256)
  if (!/^[0-9a-f]{64}$/i.test(key)) {
    throw new Error("Invalid encryption key format. Expected a 64-character hex string.");
  }
  
  // Convert hex key to Uint8Array
  const keyData = new Uint8Array(key.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  
  // Import the key
  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );
  
  // Generate a random IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  // Read the file as an ArrayBuffer
  const fileArrayBuffer = await file.arrayBuffer();
  
  // Encrypt the file
  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv
    },
    cryptoKey,
    fileArrayBuffer
  );
  
  // Create metadata object with original filename and type
  const metadata = {
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: file.lastModified
  };
  
  // Convert metadata to string and then to Uint8Array
  const metadataString = JSON.stringify(metadata);
  const encoder = new TextEncoder();
  const metadataBytes = encoder.encode(metadataString);
  
  // Create a header with metadata length (4 bytes) + metadata + IV (12 bytes)
  const metadataLength = new Uint32Array([metadataBytes.length]);
  const header = new Uint8Array([
    ...new Uint8Array(metadataLength.buffer),
    ...metadataBytes,
    ...iv
  ]);
  
  // Create a new Blob that contains the header followed by the encrypted data
  const encryptedBlob = new Blob([
    header,
    new Uint8Array(encryptedData)
  ], { type: "application/octet-stream" });
  
  return encryptedBlob;
}

/**
 * Decrypts a file using AES-GCM encryption
 * @param encryptedBlob The encrypted blob
 * @param key Hex string SHA-256 key (64 characters)
 * @returns A decrypted Blob with original type
 */
export async function decryptFile(encryptedBlob: Blob, key: string): Promise<{blob: Blob, metadata: any}> {
  // Validate the key format (should be a 64-character hex string for SHA-256)
  if (!/^[0-9a-f]{64}$/i.test(key)) {
    throw new Error("Invalid encryption key format. Expected a 64-character hex string.");
  }
  
  // Convert hex key to Uint8Array
  const keyData = new Uint8Array(key.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  
  // Import the key
  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );
  
  // Read the encrypted blob
  const encryptedArrayBuffer = await encryptedBlob.arrayBuffer();
  const encryptedUint8 = new Uint8Array(encryptedArrayBuffer);
  
  // Extract the metadata length (first 4 bytes)
  const metadataLengthArray = new Uint32Array(encryptedUint8.buffer.slice(0, 4));
  const metadataLength = metadataLengthArray[0];
  
  // Extract the metadata
  const metadataBytes = encryptedUint8.slice(4, 4 + metadataLength);
  const decoder = new TextDecoder();
  const metadataString = decoder.decode(metadataBytes);
  const metadata = JSON.parse(metadataString);
  
  // Extract the IV (12 bytes after metadata)
  const iv = encryptedUint8.slice(4 + metadataLength, 4 + metadataLength + 12);
  
  // Extract the encrypted data (everything after the header)
  const encryptedData = encryptedUint8.buffer.slice(4 + metadataLength + 12);
  
  // Decrypt the data
  const decryptedData = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv
    },
    cryptoKey,
    encryptedData
  );
  
  // Return a new Blob with the decrypted data and the original type
  return {
    blob: new Blob([decryptedData], { type: metadata.type }),
    metadata
  };
}

/**
 * Generate a SHA-256 hash from a password
 * @param password The password to hash
 * @returns A Promise resolving to a hex string SHA-256 hash
 */
export async function generateKeyFromPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  // Hash the password using SHA-256
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  
  // Convert hash to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Verifies if a given string is a valid SHA-256 hash format
 * @param key The string to check
 * @returns boolean indicating if the string is a valid SHA-256 hash format
 */
export function isValidSHA256(key: string): boolean {
  return /^[0-9a-f]{64}$/i.test(key);
}