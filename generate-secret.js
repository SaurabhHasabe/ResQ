#!/usr/bin/env node

/**
 * Generate Strong Session Secret
 * Run this to create a cryptographically secure session secret
 */

const crypto = require('crypto');

console.log('\n🔐 Generating Strong Session Secret...\n');
console.log('─'.repeat(70));

const secret = crypto.randomBytes(64).toString('hex');

console.log('\nYour new SESSION_SECRET:\n');
console.log(`  ${secret}`);
console.log('\n');
console.log('─'.repeat(70));
console.log('\n📝 Update your .env file:\n');
console.log('1. Open .env in your editor');
console.log('2. Find the line: SESSION_SECRET=replace-with-a-long-random-string');
console.log('3. Replace it with:\n');
console.log(`   SESSION_SECRET=${secret}`);
console.log('\n4. Save the file');
console.log('5. Restart your server\n');
console.log('─'.repeat(70));
console.log('\n⚠️  IMPORTANT: Keep this secret safe!');
console.log('   - Never commit it to Git');
console.log('   - Never share it publicly');
console.log('   - Use different secrets for dev/staging/production\n');
