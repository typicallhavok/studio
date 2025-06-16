

async function generateEncryptionKey(username, password, externalPassword = '') {
    // Combine inputs into one string
    const combined = `${username}:${password}:${externalPassword}`;

    // Encode the combined string as Uint8Array
    const encoder = new TextEncoder();
    const data = encoder.encode(combined);

    // Hash the data using SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    // Convert hash buffer to hex string (optional, depends how you want to use it)
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex; // 64 hex chars = 256-bit key
}

module.exports = {
    generateEncryptionKey,
};