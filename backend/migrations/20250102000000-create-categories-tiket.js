'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Table Categories
    await queryInterface.createTable('categories', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT
      },
      color: {
        type: Sequelize.STRING(7),
        defaultValue: '#3B82F6'
      },
      icon: {
        type: Sequelize.STRING
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      max_queue_capacity: {
        type: Sequelize.INTEGER
      },
      average_service_time: {
        type: Sequelize.INTEGER
      },
      order: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.addIndex('categories', ['name']);
    await queryInterface.addIndex('categories', ['is_active']);
    await queryInterface.addIndex('categories', ['order']);

    // Table Tickets
    await queryInterface.createTable('tickets', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      ticket_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      qr_code: {
        type: Sequelize.TEXT
      },
      license_plate: {
        type: Sequelize.STRING,
        allowNull: false
      },
      driver_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      driver_phone: {
        type: Sequelize.STRING
      },
      company_name: {
        type: Sequelize.STRING
      },
      sales_representative: {
        type: Sequelize.STRING
      },
      order_number: {
        type: Sequelize.STRING
      },
      category_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      status: {
        type: Sequelize.ENUM(
          'EN_ATTENTE',
          'APPELÉ',
          'EN_VENTE',
          'PESÉ_ENTRÉE',
          'EN_CHARGEMENT',
          'CHARGEMENT_TERMINÉ',
          'PESÉ_SORTIE',
          'ANOMALIE_PESÉE',
          'BL_GÉNÉRÉ',
          'TERMINÉ',
          'ANNULÉ'
        ),
        defaultValue: 'EN_ATTENTE',
        allowNull: false
      },
      priority: {
        type: Sequelize.ENUM('NORMAL', 'URGENT', 'CRITIQUE'),
        defaultValue: 'NORMAL',
        allowNull: false
      },
      priority_reason: {
        type: Sequelize.TEXT
      },
      arrived_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      called_at: {
        type: Sequelize.DATE
      },
      weighed_in_at: {
        type: Sequelize.DATE
      },
      loading_started_at: {
        type: Sequelize.DATE
      },
      loading_finished_at: {
        type: Sequelize.DATE
      },
      weighed_out_at: {
        type: Sequelize.DATE
      },
      completed_at: {
        type: Sequelize.DATE
      },
      weight_in: {
        type: Sequelize.DECIMAL(10, 2)
      },
      weight_out: {
        type: Sequelize.DECIMAL(10, 2)
      },
      net_weight: {
        type: Sequelize.DECIMAL(10, 2)
      },
      queue_position: {
        type: Sequelize.INTEGER
      },
      created_by_id: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      called_by_id: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      notes: {
        type: Sequelize.TEXT
      },
      is_manual_weight_in: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_manual_weight_out: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Index pour les tickets
    await queryInterface.addIndex('tickets', ['ticket_number']);
    await queryInterface.addIndex('tickets', ['license_plate']);
    await queryInterface.addIndex('tickets', ['status']);
    await queryInterface.addIndex('tickets', ['category_id']);
    await queryInterface.addIndex('tickets', ['priority']);
    await queryInterface.addIndex('tickets', ['arrived_at']);
    await queryInterface.addIndex('tickets', ['created_at']);
    await queryInterface.addIndex('tickets', ['created_by_id']);
    
    // Index composite pour les files d'attente
    await queryInterface.addIndex('tickets', ['category_id', 'status', 'priority', 'arrived_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tickets');
    await queryInterface.dropTable('categories');
    
    // Supprimer les ENUMs
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tickets_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tickets_priority";');
  }
};