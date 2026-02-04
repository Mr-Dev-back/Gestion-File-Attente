import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class SystemSetting extends Model { }

SystemSetting.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    key: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    value: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    type: {
        type: DataTypes.ENUM('STRING', 'INTEGER', 'FLOAT', 'BOOLEAN', 'JSON', 'ENUM'),
        defaultValue: 'STRING',
    },
    scope: {
        type: DataTypes.ENUM('GLOBAL', 'COMPANY', 'SITE'),
        allowNull: false,
        defaultValue: 'GLOBAL',
    },
    scopeId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'scope_id'
    },
    category: {
        type: DataTypes.STRING,
        defaultValue: 'GENERAL',
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    sequelize,
    modelName: 'SystemSetting',
    tableName: 'system_settings',
    timestamps: true,
    underscored: true
});

export default SystemSetting;
