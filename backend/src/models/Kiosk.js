import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Kiosk = sequelize.define('Kiosk', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('ENTRANCE', 'INFO', 'WEIGHING_BRIDGE'),
        allowNull: false,
        defaultValue: 'ENTRANCE'
    },
    status: {
        type: DataTypes.ENUM('ONLINE', 'OFFLINE', 'MAINTENANCE', 'PAPER_EMPTY', 'ERROR'),
        allowNull: false,
        defaultValue: 'OFFLINE'
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isIP: true
        },
        field: 'ip_address'
    },
    macAddress: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        field: 'mac_address'
    },
    siteId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'site_id'
    },
    // Optional: a kiosk might be dedicated to a specific queue (e.g., Weighing Bridge 1)
    queueId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'queue_id'
    },
    capabilities: {
        type: DataTypes.JSON,
        defaultValue: {},
        comment: 'Hardware capabilities: hasPrinter, hasCamera, etc.'
    }
}, {
    timestamps: true,
    tableName: 'kiosks',
    underscored: true
});

export default Kiosk;
