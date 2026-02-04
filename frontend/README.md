# SIGFA - Système Intégré de Gestion de File d'Attente

SIGFA est une solution moderne de gestion de flux logistique et de file d'attente pour les sites de chargement industriels.

## Fonctionnalités Clés

- **Gestion des Entrées** : Enregistrement des camions avec génération de tickets et QR codes.
- **File d'Attente Intelligente** : Gestion des priorités et appels en temps réel.
- **Suivi du Chargement** : Poste de commande pour les agents de parc avec suivi des produits.
- **Double Pesée** : Intégration du processus de pesée entrée/sortie.
- **Tableau de Bord TV** : Affichage public des appels pour les chauffeurs.
- **Administration & Statistiques** : Suivi des performances et gestion des données de base.

## Technologies Utilisées

- **Frontend** : React 19, TypeScript, Vite, Tailwind CSS, TanStack Query.
- **Backend** : Node.js, Express, Sequelize, PostgreSQL, Redis, Socket.io.
- **Infrastructure** : Docker, Docker Compose.

## Installation & Lancement

1. Clonez le dépôt.
2. Configurez les variables d'environnement dans les dossiers `backend` et `frontend`.
3. Lancez l'infrastructure avec Docker :
   ```bash
   docker-compose up -d
   ```
4. Accédez à l'application :
   - Frontend : `http://localhost:5173`
   - Backend API : `http://localhost:3000`
