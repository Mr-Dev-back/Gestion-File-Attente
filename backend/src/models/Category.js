import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Category extends Model { }

Category.init({
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
        type: DataTypes.TEXT,
        allowNull: true
    },
    color: {
        type: DataTypes.STRING,
        defaultValue: '#3b82f6',
        allowNull: false
    },
    prefix: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Préfixe pour les numéros de ticket (ex: BAT, INF)'
    },
    estimatedDuration: {
        type: DataTypes.INTEGER,
        defaultValue: 30,
        comment: 'Durée estimée en minutes',
        field: 'estimated_duration'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    }
}, {
    sequelize,
    modelName: 'Category',
    tableName: 'categories',
    timestamps: true,
    underscored: true
});

export default Category;
