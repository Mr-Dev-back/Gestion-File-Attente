import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';
import bcrypt from 'bcrypt';

class User extends Model {
    async validatePassword(password) {
        return await bcrypt.compare(password, this.password);
    }
}

User.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    roleId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'role_id',
        references: {
            model: 'roles',
            key: 'id'
        }
    },
    role: {
        type: DataTypes.ENUM('ADMINISTRATOR', 'SUPERVISOR', 'MANAGER', 'AGENT_QUAI', 'AGENT_GUERITE'),
        defaultValue: 'MANAGER'
    },

    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    },
    siteId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'site_id'
    },
    failedLoginAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'failed_login_attempts'
    },
    lockUntil: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'lock_until'
    },
    lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_login_at'
    },
    resetPasswordToken: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'reset_password_token'
    },
    resetPasswordExpires: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'reset_password_expires'
    }
}, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                user.password = await bcrypt.hash(user.password, 10);
            }
            // Auto-assign roleId based on role ENUM if not present
            if (user.role && !user.roleId) {
                const Role = sequelize.models.Role;
                if (Role) {
                    const roleRecord = await Role.findOne({ where: { name: user.role } });
                    if (roleRecord) user.roleId = roleRecord.id;
                }
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                user.password = await bcrypt.hash(user.password, 10);
            }
            // Sync roleId if role ENUM changes
            if (user.changed('role')) {
                const Role = sequelize.models.Role;
                if (Role) {
                    const roleRecord = await Role.findOne({ where: { name: user.role } });
                    if (roleRecord) user.roleId = roleRecord.id;
                }
            }
        }
    }
});

export default User;
