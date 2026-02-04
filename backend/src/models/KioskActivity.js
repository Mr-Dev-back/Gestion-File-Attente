import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const KioskActivity = sequelize.define('KioskActivity', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    kioskId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'kiosk_id'
    },
    event: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'e.g., STATUS_CHANGE, ERROR, PAPER_LOW'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    severity: {
        type: DataTypes.ENUM('INFO', 'WARNING', 'ERROR', 'CRITICAL'),
        defaultValue: 'INFO'
    }
}, {
    timestamps: true,
    updatedAt: false, // Activity logs are immutable usually
    tableName: 'kiosk_activities',
    underscored: true
});

export default KioskActivity;
