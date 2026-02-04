import { sequelize } from '../src/config/database.js';

async function forceReset() {
    try {
        console.log('--- Force Database Reset ---');
        await sequelize.authenticate();
        console.log('Connection established.');

        // Drop all tables with Cascade to be sure
        const tables = [
            'audit_logs', 'refresh_tokens', 'login_history', 'system_settings',
            'tickets', 'category_queues', 'workflow_steps', 'workflow_transitions',
            'queues', 'categories', 'sites', 'companies', 'users', 'kiosk_activities', 'kiosks'
        ];

        console.log('Dropping tables...');
        for (const table of tables) {
            await sequelize.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
            console.log(`Dropped ${table} (if it existed)`);
        }

        console.log('--- Database is now clean ---');
        process.exit(0);
    } catch (error) {
        console.error('--- Reset failed ---');
        console.error(error);
        process.exit(1);
    }
}

forceReset();
