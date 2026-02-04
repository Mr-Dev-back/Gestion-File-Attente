import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Workflow extends Model { }

Workflow.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    description: {
        type: DataTypes.TEXT
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    }
}, {
    sequelize,
    modelName: 'Workflow',
    tableName: 'workflows',
    timestamps: true,
    underscored: true
});

export default Workflow;
