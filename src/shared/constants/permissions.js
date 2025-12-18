export const PERMISSIONS = {
    VIEW_REPORTS: 'VIEW_REPORTS',
    MANAGE_CATEGORIES: 'MANAGE_CATEGORIES',
    MANAGE_USERS: 'MANAGE_USERS',
    DELETE_CALL_LOGS: 'DELETE_CALL_LOGS',
    HANDLE_CALLS: 'HANDLE_CALLS',
    MANAGE_COMPLAINTS: 'MANAGE_COMPLAINTS'
};

export const PERMISSION_LABELS = {
    [PERMISSIONS.VIEW_REPORTS]: 'واجهة التقارير واستخراج البيانات',
    [PERMISSIONS.MANAGE_CATEGORIES]: 'إدارة التصنيفات',
    [PERMISSIONS.MANAGE_USERS]: 'إدارة الموظفين',
    [PERMISSIONS.DELETE_CALL_LOGS]: 'حذف سجلات المكالمات',
    [PERMISSIONS.HANDLE_CALLS]: 'استقبال وإجراء المكالمات',
    [PERMISSIONS.MANAGE_COMPLAINTS]: 'إدارة الشكاوى الواردة'
};

export const ROLES = {
    ADMIN: {
        label: 'مدير النظام',
        permissions: Object.values(PERMISSIONS)
    },
    AGENT: {
        label: 'موظف خدمة العملاء',
        permissions: [PERMISSIONS.HANDLE_CALLS]
    },
    EVALUATOR: {
        label: 'موظف التقييم',
        permissions: [PERMISSIONS.VIEW_REPORTS] // "View Reports" probably covers "Agent Performance" too? Let's check logic. Usually AgentPerformanceView is under VIEW_REPORTS? No, AdminDashboard checks VIEW_REPORTS for sidebar. Wait.
        // Dashboard logical checks:
        // ReportsView: activeTab 'reports' -> sidebar checks VIEW_REPORTS (line 500)
        // AgentPerformanceView: activeTab 'performance' -> sidebar checks VIEW_REPORTS (implied by grouping or separate?)
        // Let's re-read AdminDashboard sidebar logic for 'performance'.
    },
    SUPERVISOR: {
        label: 'مشرف مركز التواصل',
        permissions: [PERMISSIONS.VIEW_REPORTS, PERMISSIONS.MANAGE_COMPLAINTS]
    }
};

export const DEFAULT_AGENT_PERMISSIONS = ROLES.AGENT.permissions;
export const DEFAULT_ADMIN_PERMISSIONS = ROLES.ADMIN.permissions;
