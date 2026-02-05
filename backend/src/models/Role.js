import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Role extends Model { }

Role.init({
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
        type: DataTypes.STRING,
        allowNull: true
    },
    scope: {
        type: DataTypes.ENUM('GLOBAL', 'COMPANY', 'SITE'),
        defaultValue: 'SITE',
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'Role',
    tableName: 'roles',
    timestamps: true,
    underscored: true
});

export default Role;
