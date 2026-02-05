import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class RolePermission extends Model { }

RolePermission.init({
    roleId: {
        type: DataTypes.UUID,
        field: 'role_id',
        references: {
            model: 'roles',
            key: 'id'
        },
        primaryKey: true
    },
    permissionId: {
        type: DataTypes.UUID,
        field: 'permission_id',
        references: {
            model: 'permissions',
            key: 'id'
        },
        primaryKey: true
    }
}, {
    sequelize,
    modelName: 'RolePermission',
    tableName: 'role_permissions',
    timestamps: false,
    underscored: true
});

export default RolePermission;
