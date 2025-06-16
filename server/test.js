const argon2 = require("argon2");
const { generateEncryptionKey } = require("./utils");

async function test() {
    generateEncryptionKey('user1', 'mypassword', '')
    .then(key => console.log('Generated Encryption Key:', key));
}

test();
