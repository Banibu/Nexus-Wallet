const path = require('path');
const dotenv = require('dotenv');
const { execSync } = require('child_process');

// Load environment variables from root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const args = process.argv.slice(2).join(' ');
try {
  execSync(`npx prisma ${args}`, { stdio: 'inherit' });
} catch (error) {
  process.exit(1);
}
