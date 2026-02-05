import { sequelize } from './src/config/database.js';
import logger from './src/config/logger.js';
import './src/models/index.js';

async function inspectSchema() {
    try {
        const tableInfo = await sequelize.getQueryInterface().describeTable('tickets');
        console.log('--- TICKETS TABLE STRUCTURE ---');
        console.log(JSON.stringify(tableInfo, null, 2));
        console.log('-------------------------------');
        process.exit(0);
    } catch (error) {
        console.error('Error inspecting schema:', error);
        process.exit(1);
    }
}

inspectSchema();
