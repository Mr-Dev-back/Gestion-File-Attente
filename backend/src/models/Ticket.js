import { DataTypes, Model, Op } from 'sequelize';
import { sequelize } from '../config/database.js';

class Ticket extends Model {
  static async generateTicketNumber(categoriesData) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    let prefix = 'TK';
    if (categoriesData && categoriesData.length > 0) {
      if (typeof categoriesData[0] === 'object' && categoriesData[0].code) {
        prefix = categoriesData[0].code;
      } else if (typeof categoriesData[0] === 'string') {
        prefix = categoriesData[0].substring(0, 3).toUpperCase();
      }
    }

    // Format: TKSITECATEGORIE-YYYYMMDD-XXX
    // We'll simplify for now as SITECAT-YYYYMMDD-XXX if we can get site info

    const lastTicket = await this.findOne({
      where: { ticketNumber: { [Op.like]: `${prefix}-${dateStr}-%` } },
      order: [['createdAt', 'DESC']]
    });
    let sequence = 1;
    if (lastTicket) {
      const parts = lastTicket.ticketNumber.split('-');
      const lastSequence = parseInt(parts[parts.length - 1]);
      if (!isNaN(lastSequence)) sequence = lastSequence + 1;
    }
    return `${prefix}-${dateStr}-${sequence.toString().padStart(3, '0')}`;
  }

  getWaitingTime() {
    if (!this.arrivedAt) return 0;
    const endTime = this.calledAt || new Date();
    return Math.floor((endTime - this.arrivedAt) / 1000 / 60);
  }

  getTotalDuration() {
    if (!this.arrivedAt || !this.completedAt) return null;
    return Math.floor((this.completedAt - this.arrivedAt) / 1000 / 60);
  }
}

Ticket.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  ticketNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'ticket_number'
  },
  licensePlate: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'license_plate'
  },
  driverName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'driver_name'
  },
  companyName: {
    type: DataTypes.STRING,
    field: 'company_name'
  },
  driverPhone: {
    type: DataTypes.STRING,
    field: 'driver_phone'
  },
  salesPerson: {
    type: DataTypes.STRING,
    field: 'sales_person'
  },
  orderNumber: {
    type: DataTypes.STRING,
    field: 'order_number'
  },
  qrCode: {
    type: DataTypes.TEXT,
    field: 'qr_code'
  },
  printedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'printed_count'
  },
  siteId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'site_id'
  },
  queueId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'queue_id',
    comment: 'File d\'attente actuelle du ticket'
  },
  stepId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'step_id',
    comment: 'Étape actuelle du workflow'
  },
  companyId: {
    type: DataTypes.UUID,
    field: 'company_id'
  },
  categories: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  currentCategoryIndex: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'current_category_index'
  },
  status: {
    type: DataTypes.ENUM(
      'EN_ATTENTE', 'APPELÉ', 'EN_COURS', 'TERMINÉ', 'ANNULÉ'
    ),
    defaultValue: 'EN_ATTENTE',
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('NORMAL', 'URGENT', 'CRITIQUE'),
    defaultValue: 'NORMAL',
    allowNull: false
  },
  priorityReason: {
    type: DataTypes.STRING,
    field: 'priority_reason'
  },
  arrivedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'arrived_at',
    defaultValue: DataTypes.NOW
  },
  calledAt: { type: DataTypes.DATE, field: 'called_at' },
  completedAt: { type: DataTypes.DATE, field: 'completed_at' },
  queuePosition: { type: DataTypes.INTEGER, field: 'queue_position' },
  createdById: { type: DataTypes.UUID, field: 'created_by_id' },
  calledById: { type: DataTypes.UUID, field: 'called_by_id' }
}, {
  sequelize,
  modelName: 'Ticket',
  tableName: 'tickets',
  timestamps: true,
  underscored: true
});

export default Ticket;