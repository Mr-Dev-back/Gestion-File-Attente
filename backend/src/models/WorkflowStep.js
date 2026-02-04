import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class WorkflowStep extends Model { }

WorkflowStep.init({
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
    queueId: {
        type: DataTypes.UUID,
        allowNull: true, // A step might not be in a specific queue (global steps)
        field: 'queue_id',
        comment: 'File d\'attente associée à cette étape'
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    code: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Code normalisé (ex: WAITING, LOADING)'
    },
    order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    color: {
        type: DataTypes.STRING,
        defaultValue: '#808080'
    },
    isInitial: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_initial'
    },
    isFinal: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_final'
    }
}, {
    sequelize,
    modelName: 'WorkflowStep',
    tableName: 'workflow_steps',
    timestamps: true,
    underscored: true
});

export default WorkflowStep;
