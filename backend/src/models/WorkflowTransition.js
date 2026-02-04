import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class WorkflowTransition extends Model { }

WorkflowTransition.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    workflowId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'workflow_id'
    },
    fromStepId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'from_step_id'
    },
    toStepId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'to_step_id'
    },
    allowedRoles: {
        type: DataTypes.JSON,
        defaultValue: [],
        comment: 'Roles autorisés à effectuer cette transition',
        field: 'allowed_roles'
    }
}, {
    sequelize,
    modelName: 'WorkflowTransition',
    tableName: 'workflow_transitions',
    timestamps: true,
    underscored: true
});

export default WorkflowTransition;
