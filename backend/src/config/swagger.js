import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'SIGFA API Documentation',
            version: '1.0.0',
            description: 'Documentation de l\'API pour le Système Intégré de Gestion de File d\'Attente (SIGFA)',
            contact: {
                name: 'Equipe SIBM',
            },
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Serveur de Développement',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/*.js', './src/models/*.js'], // Chemins vers les fichiers contenant les annotations
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
