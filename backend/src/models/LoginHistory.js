import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class LoginHistory extends Model { }

LoginHistory.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id'
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'ip_address'
    },
    userAgent: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'user_agent'
    },
    status: {
        type: DataTypes.ENUM('SUCCESS', 'FAILED'),
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'LoginHistory',
    tableName: 'login_history',
    timestamps: true,
    updatedAt: false, // Only need createdAt for history
    underscored: true
});

export default LoginHistory;
