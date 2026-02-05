import Ticket from './Ticket.js';
import User from './User.js';
import RefreshToken from './RefreshToken.js';
import Company from './Company.js';
import Site from './Site.js';
import Category from './Category.js';
import AuditLog from './AuditLog.js';
import LoginHistory from './LoginHistory.js';
import SystemSetting from './SystemSetting.js';
import Workflow from './Workflow.js';
import WorkflowStep from './WorkflowStep.js';
import WorkflowTransition from './WorkflowTransition.js';
import Queue from './Queue.js';
import Kiosk from './Kiosk.js';
import KioskActivity from './KioskActivity.js';
import CategoryQueue from './CategoryQueue.js';
import Role from './Role.js';
import Permission from './Permission.js';
import RolePermission from './RolePermission.js';

// --- Relations Company <-> Site ---
Company.hasMany(Site, { foreignKey: 'companyId', as: 'sites' });
Site.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// --- RBAC Relations (US-005 Refinement) ---
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
User.belongsTo(Role, { foreignKey: 'roleId', as: 'assignedRole' });

Role.belongsToMany(Permission, { through: RolePermission, as: 'permissions', foreignKey: 'roleId' });
Permission.belongsToMany(Role, { through: RolePermission, as: 'roles', foreignKey: 'permissionId' });

// --- Relations Site <-> Workflow (US-008: Un site possède un seul workflow) ---
Workflow.hasMany(Site, { foreignKey: 'workflowId', as: 'sites' });
Site.belongsTo(Workflow, { foreignKey: 'workflowId', as: 'workflow' });

// --- Relations Site <-> Queue ---
Site.hasMany(Queue, { foreignKey: 'siteId', as: 'queues' });
Queue.belongsTo(Site, { foreignKey: 'siteId', as: 'site' });

// --- Relations Site <-> User ---
Site.hasMany(User, { foreignKey: 'siteId', as: 'users' });
User.belongsTo(Site, { foreignKey: 'siteId', as: 'site' });

// --- Relations Site <-> Ticket ---
Site.hasMany(Ticket, { foreignKey: 'siteId', as: 'tickets' });
Ticket.belongsTo(Site, { foreignKey: 'siteId', as: 'site' });

// --- Relations Company <-> Ticket ---
Company.hasMany(Ticket, { foreignKey: 'companyId', as: 'tickets' });
Ticket.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// --- Relations Ticket <-> Queue ---
Queue.hasMany(Ticket, { foreignKey: 'queueId', as: 'tickets' });
Ticket.belongsTo(Queue, { foreignKey: 'queueId', as: 'queue' });

// --- Relations Ticket <-> WorkflowStep ---
WorkflowStep.hasMany(Ticket, { foreignKey: 'stepId', as: 'tickets' });
Ticket.belongsTo(WorkflowStep, { foreignKey: 'stepId', as: 'currentStep' });

// --- Workflow Relations ---
Workflow.hasMany(WorkflowStep, { foreignKey: 'workflowId', as: 'steps', onDelete: 'CASCADE' });
WorkflowStep.belongsTo(Workflow, { foreignKey: 'workflowId', as: 'workflow' });

// --- Queue Relations (US-008: Un workflow contient plusieurs files d'attentes) ---
Workflow.hasMany(Queue, { foreignKey: 'workflowId', as: 'queues', onDelete: 'CASCADE' });
Queue.belongsTo(Workflow, { foreignKey: 'workflowId', as: 'workflow' });

// --- WorkflowStep <-> Queue (US-008: Une file d'attente compte plusieurs étapes) ---
Queue.hasMany(WorkflowStep, { foreignKey: 'queueId', as: 'steps' });
WorkflowStep.belongsTo(Queue, { foreignKey: 'queueId', as: 'queue' });

// --- Workflow Transitions ---
Workflow.hasMany(WorkflowTransition, { foreignKey: 'workflowId', as: 'transitions', onDelete: 'CASCADE' });
WorkflowTransition.belongsTo(Workflow, { foreignKey: 'workflowId', as: 'workflow' });

WorkflowStep.hasMany(WorkflowTransition, { foreignKey: 'fromStepId', as: 'nextTransitions' });
WorkflowTransition.belongsTo(WorkflowStep, { foreignKey: 'fromStepId', as: 'fromStep' });

WorkflowStep.hasMany(WorkflowTransition, { foreignKey: 'toStepId', as: 'prevTransitions' });
WorkflowTransition.belongsTo(WorkflowStep, { foreignKey: 'toStepId', as: 'toStep' });

// --- Category <-> Queue ---
Category.belongsToMany(Queue, { through: CategoryQueue, as: 'queues', foreignKey: 'categoryId' });
Queue.belongsToMany(Category, { through: CategoryQueue, as: 'categories', foreignKey: 'queueId' });

// --- Kiosk Relations ---
Kiosk.belongsTo(Site, { foreignKey: 'siteId', as: 'site' });
Site.hasMany(Kiosk, { foreignKey: 'siteId', as: 'kiosks' });

Kiosk.belongsTo(Queue, { foreignKey: 'queueId', as: 'queue' });
Queue.hasMany(Kiosk, { foreignKey: 'queueId', as: 'kiosks' });

Kiosk.hasMany(KioskActivity, { foreignKey: 'kioskId', as: 'activities', onDelete: 'CASCADE' });
KioskActivity.belongsTo(Kiosk, { foreignKey: 'kioskId', as: 'kiosk' });

// --- User <-> Ticket (Ownership) ---
User.hasMany(Ticket, { foreignKey: 'createdById', as: 'createdTickets' });
Ticket.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

User.hasMany(Ticket, { foreignKey: 'calledById', as: 'calledTickets' });
Ticket.belongsTo(User, { foreignKey: 'calledById', as: 'calledBy' });

// --- User <-> LoginHistory ---
User.hasMany(LoginHistory, { foreignKey: 'userId', as: 'loginHistory' });
LoginHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// --- User <-> RefreshToken ---
User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// --- AuditLog Relations ---
User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export {
  Ticket,
  User,
  RefreshToken,
  Company,
  Site,
  Category,
  AuditLog,
  LoginHistory,
  SystemSetting,
  Workflow,
  WorkflowStep,
  WorkflowTransition,
  Queue,
  Kiosk,
  KioskActivity,
  CategoryQueue,
  Role,
  Permission,
  RolePermission
};