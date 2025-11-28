// Generate NEXTAUTH_SECRET
const crypto = require('crypto');
const secret = crypto.randomBytes(32).toString('base64');
console.log('\n=== NEXTAUTH_SECRET ===');
console.log(secret);
console.log('\nAdd this to your .env.local:');
console.log(`NEXTAUTH_SECRET=${secret}`);
console.log('\n');
