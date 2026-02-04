// Dashboard Type Definitions

/**
 * Pending ticket for control dashboard
 */
export interface PendingTicket {
    id: string;
    category: string;
    priority: 'high' | 'medium' | 'low';
    time: string;
}

/**
 * Control dashboard pending response
 */
export interface ControlPendingResponse {
    tickets: PendingTicket[];
}

/**
 * Control dashboard stats
 */
export interface ControlStatsResponse {
    toControl: number;
    approved: number;
    rejected: number;
    complianceRate: number;
}

/**
 * Admin dashboard stats
 */
export interface AdminStatsResponse {
    totalTickets: number;
    activeTickets: number;
    resolvedTickets: number;
    avgResolutionTime: string;
    activeUsers: number;
    todayEntries: number;
}

/**
 * Recent activity item
 */
export interface RecentActivity {
    id: string;
    type: string;
    description: string;
    timestamp: string;
    user: string;
}

/**
 * Admin recent activity response
 */
export interface AdminRecentActivityResponse {
    activities: RecentActivity[];
}

/**
 * Supervisor stats response
 */
export interface SupervisorStatsResponse {
    totalTickets: number;
    activeTickets: number;
    departments: number;
    alerts: number;
    pendingAssignment: number;
    inProgress: number;
    avgResponseTime: string;
}

/**
 * Department performance
 */
export interface DepartmentPerformance {
    name: string;
    activeTickets: number;
    avgResolutionTime: string;
    tickets: number;
    pending: number;
    completed: number;
    color: string;
}

/**
 * Supervisor departments response
 */
export interface SupervisorDepartmentsResponse {
    departments: DepartmentPerformance[];
}

/**
 * Manager stats response
 */
export interface ManagerStatsResponse {
    myTickets: number;
    pending: number;
    resolved: number;
    avgResolutionTime: string;
}

/**
 * Performance metric
 */
export interface PerformanceMetric {
    metric: string;
    value: string | number;
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

/**
 * Manager performance response
 */
export interface ManagerPerformanceResponse {
    metrics: PerformanceMetric[];
}

/**
 * Sales stats response
 */
export interface SalesStatsResponse {
    todaySales: number;
    pendingInvoices: number;
    completedToday: number;
    avgTicketValue: number;
}

/**
 * Sales summary item
 */
export interface SalesSummaryItem {
    id: string;
    customer: string;
    amount: number;
    status: string;
    date: string;
}

/**
 * Sales summary response
 */
export interface SalesSummaryResponse {
    today: number;
    week: number;
    month: number;
    monthlyGoal: number;
    goalProgress: number;
}
