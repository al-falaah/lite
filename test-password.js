import bcrypt from 'bcryptjs';

const plainPassword = 'U7BCDFKY';
const hashedPassword = '$2b$10$U8yiiyiqiEp8uMqId4in7uQoo/DjYyK4FqtXbCcZg9bMtJM4uf/PG';

console.log('Testing password comparison...\n');
console.log('Plain text password:', plainPassword);
console.log('Hashed password:', hashedPassword);
console.log('\nTesting bcrypt.compare()...');

bcrypt.compare(plainPassword, hashedPassword).then(result => {
  console.log('Result:', result);
  console.log(result ? '✅ Passwords match!' : '❌ Passwords do NOT match');
}).catch(err => {
  console.error('Error:', err);
});
