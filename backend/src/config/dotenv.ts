import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the centralized root-level .env file
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
