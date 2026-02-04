import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.join(__dirname, '..');

dotenv.config({ path: path.join(backendRoot, '.env') });

async function seed() {
    try {
        const { sequelize } = await import('../src/config/database.js');
        const {
            User, Company, Site, Category, Ticket,
            Workflow, WorkflowStep, WorkflowTransition,
            Queue, Kiosk, CategoryQueue, SystemSetting
        } = await import('../src/models/index.js');

        console.log('--- Database Reset & Seeding (New Architecture) ---');
        await sequelize.authenticate();
        console.log('Connection established.');

        await sequelize.sync({ force: true });
        console.log('Database schema reset.');

        // 1. Workflow
        console.log('Seeding Workflow...');
        const workflow = await Workflow.create({
            name: 'Workflow Standard SIBM',
            description: 'Flux complet: Accueil -> Vente -> Pesée -> Chargement -> Sortie',
            isActive: true
        });

        // 2. Company & Site
        console.log('Seeding Company & Site...');
        const company = await Company.create({ name: 'SIBM CI', code: 'SIBM', isActive: true });
        const site = await Site.create({
            companyId: company.id,
            workflowId: workflow.id, // Site linked to workflow
            name: 'Site de Yopougon',
            code: 'YOP-01',
            isActive: true
        });

        // 3. Queues (Linked to Workflow and Site)
        console.log('Seeding Queues...');
        const qAccueil = await Queue.create({ name: 'File Accueil', siteId: site.id, workflowId: workflow.id, priority: 1 });
        const qVente = await Queue.create({ name: 'File Bureau Vente', siteId: site.id, workflowId: workflow.id, priority: 2 });
        const qPesee = await Queue.create({ name: 'File Pont Bascule', siteId: site.id, workflowId: workflow.id, priority: 3 });

        // 4. Workflow Steps (Linked to Workflow AND specific Queues)
        console.log('Seeding Workflow Steps...');
        const steps = await WorkflowStep.bulkCreate([
            { workflowId: workflow.id, queueId: qAccueil.id, name: 'Enregistrement', order: 1, isInitial: true, code: 'WAITING' },
            { workflowId: workflow.id, queueId: qVente.id, name: 'Vente', order: 2, code: 'SALES' },
            { workflowId: workflow.id, queueId: qPesee.id, name: 'Pesée Entrée', order: 3, code: 'WEIGH_IN' },
            { workflowId: workflow.id, queueId: null, name: 'Chargement', order: 4, code: 'LOADING' }, // Indirect step
            { workflowId: workflow.id, queueId: qPesee.id, name: 'Pesée Sortie', order: 5, code: 'WEIGH_OUT' },
            { workflowId: workflow.id, queueId: null, name: 'Terminé', order: 6, isFinal: true, code: 'DONE' }
        ]);

        // 5. Users
        console.log('Seeding Users...');
        await User.bulkCreate([
            { username: 'admin', email: 'admin@sigfa.com', password: 'password123', role: 'ADMINISTRATOR' },
            { username: 'supervisor', email: 'supervisor@sigfa.com', password: 'password123', role: 'SUPERVISOR', siteId: site.id }
        ], { individualHooks: true });

        // 6. Categories
        console.log('Seeding Categories...');
        const catInfra = await Category.create({ name: 'INFRASTRUCTURE', prefix: 'INF', color: '#3b82f6' });
        await CategoryQueue.create({ categoryId: catInfra.id, queueId: qAccueil.id });

        // 7. System Settings
        console.log('Seeding Settings...');
        await SystemSetting.create({ key: 'site_title', value: 'SIGFA - SIBM', type: 'STRING' });

        // 8. Tickets
        console.log('Seeding Tickets...');
        const ticketNumber = await Ticket.generateTicketNumber([{ prefix: 'INF' }]);
        await Ticket.create({
            ticketNumber,
            licensePlate: 'ABC-123-XY',
            driverName: 'Bakayoko',
            siteId: site.id,
            queueId: qAccueil.id,
            stepId: steps[0].id,
            status: 'EN_ATTENTE',
            categories: ['INFRASTRUCTURE']
        });

        console.log('--- Seeding completed successfully ---');
        process.exit(0);
    } catch (error) {
        console.error('--- Seeding failed ---');
        console.error(error);
        process.exit(1);
    }
}

seed();
