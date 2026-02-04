import { v4: uuidv4 } from 'uuid';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('categories', [
      {
        id: uuidv4(),
        name: 'Béton',
        description: 'Béton prêt à l\'emploi - toutes qualités',
        color: '#3B82F6',
        icon: 'truck',
        is_active: true,
        max_queue_capacity: 20,
        average_service_time: 30,
        order: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Agrégats',
        description: 'Sable, graviers, pierres concassées',
        color: '#F59E0B',
        icon: 'package',
        is_active: true,
        max_queue_capacity: 15,
        average_service_time: 25,
        order: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Ciment',
        description: 'Ciment en sacs ou en vrac',
        color: '#8B5CF6',
        icon: 'box',
        is_active: true,
        max_queue_capacity: 10,
        average_service_time: 20,
        order: 3,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Fer à béton',
        description: 'Barres de fer, treillis soudés',
        color: '#EF4444',
        icon: 'shield',
        is_active: true,
        max_queue_capacity: 12,
        average_service_time: 35,
        order: 4,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Matériaux divers',
        description: 'Autres matériaux de construction',
        color: '#10B981',
        icon: 'layers',
        is_active: true,
        max_queue_capacity: null,
        average_service_time: 20,
        order: 5,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('categories', null, {});
  }
};