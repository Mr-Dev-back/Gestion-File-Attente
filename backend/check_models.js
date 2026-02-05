import {
    Ticket,
    User,
    Company,
    Site,
    Category,
    AuditLog,
    LoginHistory,
    SystemSetting,
    Workflow,
    WorkflowStep,
    WorkflowTransition,
    Queue
} from './src/models/index.js';

console.log('Ticket:', !!Ticket);
console.log('User:', !!User);
console.log('Company:', !!Company);
console.log('Site:', !!Site);
console.log('Category:', !!Category);
console.log('AuditLog:', !!AuditLog);
console.log('LoginHistory:', !!LoginHistory);
console.log('SystemSetting:', !!SystemSetting);
console.log('Workflow:', !!Workflow);
console.log('WorkflowStep:', !!WorkflowStep);
console.log('WorkflowTransition:', !!WorkflowTransition);
console.log('Queue:', !!Queue);

try {
    console.log("Associations defined successfully if we reached here?");
} catch (e) {
    console.error("Error:", e);
}
