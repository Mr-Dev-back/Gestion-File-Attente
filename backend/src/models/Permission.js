import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Permission extends Model { }

Permission.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    },
    resource: {
        type: DataTypes.STRING,
        allowNull: false
    },
    action: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'Permission',
    tableName: 'permissions',
    timestamps: true,
    underscored: true
});

export default Permission;
