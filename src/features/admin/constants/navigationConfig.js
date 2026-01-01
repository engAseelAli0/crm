import {
    LayoutDashboard,
    FolderTree,
    Users,
    Map as MapIcon,
    Map,
    HelpCircle,
    Settings,
    BarChart2,
    FileText,
    Bell,
    BookOpen,
    ShieldCheck,
    MapPin,
    PhoneCall,
    Clock,
    Activity,
    Shield,
    TrendingUp,
    BarChart3
} from 'lucide-react';

export const NAVIGATION_CONFIG = [
    {
        id: 'dashboard',
        label: 'sidebar.dashboard',
        fallbackLabel: 'لوحة القيادة',
        icon: LayoutDashboard,
        defaultAllowed: ['ADMIN', 'SUPERVISOR', 'EVALUATOR', 'AGENT']
    },
    {
        id: 'categories',
        label: 'sidebar.categories',
        fallbackLabel: 'التصنيفات', // Renamed from Structure Management as per request "التصنيفات" match
        icon: FolderTree,
        defaultAllowed: ['ADMIN']
    },
    {
        id: 'users',
        label: 'sidebar.users',
        fallbackLabel: 'إدارة الموظفين',
        icon: Users,
        defaultAllowed: ['ADMIN']
    },
    {
        id: 'permissions',
        label: 'sidebar.permissions',
        fallbackLabel: 'الصلاحيات',
        icon: Shield,
        defaultAllowed: ['ADMIN']
    },
    {
        id: 'complaints_config',
        label: 'sidebar.complaintsConfig',
        fallbackLabel: 'إعدادات الشكاوي',
        icon: HelpCircle,
        defaultAllowed: ['ADMIN']
    },
    {
        id: 'complaints_manage',
        label: 'sidebar.complaintsManage',
        fallbackLabel: 'الشكاوي الواردة',
        icon: FileText,
        defaultAllowed: ['ADMIN', 'SUPERVISOR']
    },
    {
        id: 'guide',
        label: 'sidebar.guide',
        fallbackLabel: 'الدليل الشامل',
        icon: BookOpen,
        defaultAllowed: ['ADMIN', 'AGENT', 'COMPLAINT_OFFICER']
    },
    {
        id: 'performance',
        label: 'sidebar.performance',
        fallbackLabel: 'أداء الموظفين',
        icon: TrendingUp,
        defaultAllowed: ['ADMIN', 'EVALUATOR', 'SUPERVISOR']
    },
    {
        id: 'tracking',
        label: 'sidebar.tracking',
        fallbackLabel: 'تتبع العملاء',
        icon: MapIcon,
        defaultAllowed: ['ADMIN']
    },
    {
        id: 'reports',
        label: 'sidebar.reports',
        fallbackLabel: 'التقارير',
        icon: BarChart3,
        defaultAllowed: ['ADMIN', 'EVALUATOR', 'SUPERVISOR']
    },
    {
        id: 'complaint_submission',
        label: 'sidebar.complaintSubmission',
        fallbackLabel: 'رفع شكوى',
        icon: FileText,
        defaultAllowed: ['AGENT', 'COMPLAINT_OFFICER', 'ADMIN']
    },
    {
        id: 'reminders',
        label: 'sidebar.reminders',
        fallbackLabel: 'التذكيرات',
        icon: Bell, // Assuming Bell is the intended icon as 'Clock' is not imported
        defaultAllowed: ['AGENT', 'COMPLAINT_OFFICER', 'ADMIN', 'SUPERVISOR', 'service_points']
    },
    {
        id: 'settings',
        label: 'sidebar.settings',
        fallbackLabel: 'الإعدادات',
        icon: Settings,
        defaultAllowed: ['ADMIN']
    },
    {
        id: 'service_points',
        label: 'sidebar.service_points',
        fallbackLabel: 'نقاط الخدمة',
        icon: MapPin,
        defaultAllowed: ['ADMIN', 'SUPERVISOR', 'AGENT']
    },
    // Agent Specific (Keep at end or interleave if user wants?)
    // User didn't specify order for these, so end is safe.
    {
        id: 'calls',
        label: 'sidebar.calls',
        fallbackLabel: 'سجل المكالمات',
        icon: PhoneCall,
        defaultAllowed: ['AGENT']
    },
    {
        id: 'customers',
        label: 'sidebar.customers',
        fallbackLabel: 'العملاء',
        icon: Users,
        defaultAllowed: []
    },
    {
        id: 'agent_stats',
        label: 'sidebar.stats',
        fallbackLabel: 'إحصائياتي',
        icon: BarChart3,
        defaultAllowed: []
    }
];

// Helper to get allowed modules for a user if they have NO explicit permissions set (Backward Compatibility)
export const getDefaultModulesForRole = (role) => {
    // If Admin, strictly respect the config (exclude Agent stuff unless ADMIN is added there)
    return NAVIGATION_CONFIG.filter(m => m.defaultAllowed.includes(role)).map(m => m.id);
};
