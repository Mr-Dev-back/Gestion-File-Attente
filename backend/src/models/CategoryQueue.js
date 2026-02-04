import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const CategoryQueue = sequelize.define('CategoryQueue', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    categoryId: {
        type: DataTypes.UUID,
        references: {
            model: 'categories',
            key: 'id'
        }
    },
    queueId: {
        type: DataTypes.UUID,
        references: {
            model: 'queues',
            key: 'id'
        }
    },
    maxCapacity: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Capacité maximale pour cette catégorie dans cette file (optionnel)'
    }
}, {
    timestamps: true,
    tableName: 'category_queues'
});

export default CategoryQueue;
