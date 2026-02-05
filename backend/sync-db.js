import { sequelize } from './src/config/database.js';
import logger from './src/config/logger.js';
import './src/models/index.js';

async function syncDB() {
    try {
        await sequelize.authenticate();
        console.log('✓ Connection established.');
        await sequelize.sync({ alter: true });
        console.log('✓ Database schema synchronized (alter: true).');
        process.exit(0);
    } catch (error) {
        console.error('Error synchronizing database:', error.message);
        if (error.original) {
            console.error('Original error:', error.original.message);
            console.error('SQL:', error.sql);
        }
        process.exit(1);
    }
}

syncDB();
