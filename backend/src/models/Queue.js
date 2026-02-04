import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Queue = sequelize.define('Queue', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    siteId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'site_id'
    },
    workflowId: {
        type: DataTypes.UUID,
        allowNull: true, // Optional initially
        field: 'workflow_id'
    },
    priority: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Priorité de la file (plus haut = plus prioritaire)'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    }
}, {
    timestamps: true,
    tableName: 'queues',
    underscored: true
});

export default Queue;
