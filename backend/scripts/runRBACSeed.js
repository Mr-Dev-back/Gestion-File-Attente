import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.join(__dirname, '..');

dotenv.config({ path: path.join(backendRoot, '.env') });

async function runSeed() {
    try {
        const { sequelize } = await import('../src/config/database.js');
        // Import models to ensure they are registered
        await import('../src/models/index.js');
        const { seedRBAC } = await import('../src/seeders/rbacSeeder.js');

        console.log('--- Connecting to Database ---');
        await sequelize.authenticate();
        console.log('Connection established.');

        // Update schema (create new tables, add columns) without losing data
        console.log('--- Syncing Schema (Alter) ---');
        await sequelize.sync({ alter: true });
        console.log('Schema synced.');

        console.log('--- Running RBAC Seeder ---');
        await seedRBAC();

        console.log('--- Done ---');
        process.exit(0);
    } catch (error) {
        console.error('--- RBAC Seeding Failed ---');
        if (error.original) {
            console.error('Original SQL Error:', error.original);
        }
        if (error.parent) {
            console.error('Parent Error:', error.parent);
        }
        console.error('Full Error:', JSON.stringify(error, null, 2));
        process.exit(1);
    }
}

runSeed();
