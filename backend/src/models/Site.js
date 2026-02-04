import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Site extends Model { }

Site.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    companyId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'company_id'
    },
    workflowId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'workflow_id',
        comment: 'Workflow associé à ce site (US-008)'
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    code: {
        type: DataTypes.STRING,
        unique: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    },
    isMonoUserProcess: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_mono_user_process'
    },
    alertThreshold: {
        type: DataTypes.INTEGER,
        defaultValue: 45,
        field: 'alert_threshold'
    },
    establishmentName: {
        type: DataTypes.STRING,
        defaultValue: 'SIBM GESTION FLUX',
        field: 'establishment_name'
    }
}, {
    sequelize,
    modelName: 'Site',
    tableName: 'sites',
    timestamps: true,
    underscored: true
});

export default Site;
