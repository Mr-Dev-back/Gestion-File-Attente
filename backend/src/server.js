import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import http from 'http';
import cookieParser from 'cookie-parser';
import { Server } from 'socket.io';
import { sequelize } from './config/database.js';
import { redisClient } from './config/redis.js';
import logger from './config/logger.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import ticketRoutes from './routes/ticket.routes.js';
import companyRoutes from './routes/companyRoutes.js';
import siteRoutes from './routes/siteRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import systemSettingRoutes from './routes/systemSettingRoutes.js';
import workflowRoutes from './routes/workflowRoutes.js';
import queueRoutes from './routes/queueRoutes.js';
import kioskRoutes from './routes/kioskRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Configuration Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased limit for development/testing
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Trop de requêtes, veuillez réessayer plus tard.'
});

// Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(limiter); // Appliquer le rate limiting à toutes les requêtes

// Rendre io accessible dans les routes
app.set('io', io);

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      database: 'checking...',
      redis: redisClient.isOpen ? 'connected' : 'disconnected'
    }
  });
});

// Documentation Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', systemSettingRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/kiosks', kioskRoutes);

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Erreur serveur interne',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Socket.io events
io.on('connection', (socket) => {
  logger.info(`Client connecté: ${socket.id}`);

  socket.on('join-room', (room) => {
    socket.join(room);
    logger.info(`Client ${socket.id} a rejoint la room: ${room}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client déconnecté: ${socket.id}`);
  });
});

// Démarrage du serveur
const PORT = process.env.BACKEND_PORT || 3000;

async function startServer() {
  try {
    // Test connexion DB
    await sequelize.authenticate();
    logger.info('Connexion PostgreSQL établie');

    // Sync des models (en dev uniquement)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('Models synchronisés (alter: true)');
    }

    // Test connexion Redis
    try {
      await redisClient.connect();
      logger.info('Connexion Redis établie');
    } catch (redisError) {
      logger.warn('Impossible de se connecter à Redis. Le serveur continuera sans cache.');
      logger.error(redisError.message);
    }

    // Démarrage du serveur
    server.listen(PORT, () => {
      logger.info(`Serveur démarré sur le port ${PORT}`);
      logger.info(`Environnement: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Erreur de démarrage:', error);
    process.exit(1);
  }
}

startServer();

// Gestion de l'arrêt gracieux
process.on('SIGTERM', async () => {
  logger.info('SIGTERM reçu, arrêt gracieux...');
  await sequelize.close();
  await redisClient.quit();
  server.close(() => {
    logger.info('Serveur arrêté');
    process.exit(0);
  });
});

export { app, io };