import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Users, FolderTree, Plus, Trash2,
    ChevronRight, ChevronDown, X, Lock, User as UserIcon,
    Shield, Edit, ArrowLeft, ArrowRight, Eye, CheckCircle,
    Smartphone, Settings, Activity, BarChart3, TrendingUp,
    Search, Filter, Calendar, Download, Bell, Menu, LogOut,
    Phone, PhoneCall, Clock, MoreVertical, Star, Award, PieChart,
    Target, MessageSquare, BookOpen, HelpCircle, MapPin, List, FileText,
    FileSpreadsheet, File as FilePdf, CheckSquare, Square, Filter as FilterIcon, Map as MapIcon,
    Layers, Zap, Headset
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

import { ReportGenerator } from '../../../shared/utils/ReportGenerator';
import { DataManager } from '../../../shared/utils/DataManager';
import Modal from '../../../shared/components/Modal';
import SidebarItem from '../../../shared/components/SidebarItem';
import StatsCard from '../../../shared/components/StatsCard';
import UserAvatar from '../../../shared/components/UserAvatar';
import ThemeToggle from '../../../shared/components/ThemeToggle';
import LanguageToggle from '../../../shared/components/LanguageToggle';
import { useTheme } from '../../../shared/context/ThemeContext';
import { useLanguage } from '../../../shared/context/LanguageContext';

import CategoryNode from '../components/CategoryNode';
import AgentCard from '../components/AgentCard';
import UserRow from '../components/UserRow';
import UserForm from '../components/UserForm';
import CallDetailsModal from '../components/CallDetailsModal';
import AgentDetailsView from '../components/AgentDetailsView';
import ReportsView from '../components/ReportsView';
import AgentPerformanceView from '../components/AgentPerformanceView';
import CustomerTrackingView from '../components/CustomerTrackingView';
import KnowledgeBaseManager from '../components/KnowledgeBaseManager';
import ComplaintTypeConfig from '../components/ComplaintTypeConfig';
import ServicePointsManager from '../components/ServicePointsManager';
// Import Agent Components for Admin usage
import ComplaintSubmission from '../../agent/components/ComplaintSubmission';
import ReminderView from '../../agent/components/ReminderView';
import ComplaintList from '../components/ComplaintList';
import PermissionsManager from '../components/PermissionsManager';
import { NAVIGATION_CONFIG, getDefaultModulesForRole } from '../constants/navigationConfig';
import { PERMISSIONS } from '../../../shared/constants/permissions';

import { useToast } from '../../../shared/components/Toast';
import styles from './AdminDashboardPage.module.css';

const AdminDashboardPage = ({ user, onLogout }) => {
    const { theme } = useTheme();
    const { t } = useLanguage();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [currentUser, setCurrentUser] = useState(user); // Local user state for live updates
    const [stats, setStats] = useState({
        totalCalls: 0,
        topCategory: '-',
        avgCallDuration: '0:00',
        resolutionRate: '0%'
    });
    const [categories, setCategories] = useState([]);
    const [users, setUsers] = useState([]);
    const [calls, setCalls] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [categoryType, setCategoryType] = useState('classification'); // classification, location, procedure, action

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [selectedUser, setSelectedUser] = useState(null);
    const [userForm, setUserForm] = useState({ name: '', username: '', password: '', role: 'AGENT' });

    // Category Modal State
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [categoryForm, setCategoryForm] = useState({ id: null, name: '', isRequired: false, parentId: null });
    const [categoryModalMode, setCategoryModalMode] = useState('add');

    // Agent Stats Logic
    const [viewMode, setViewMode] = useState('dashboard');
    const [selectedAgentForStats, setSelectedAgentForStats] = useState(null);
    const [statsDateFilter, setStatsDateFilter] = useState('');
    const [viewCallDetails, setViewCallDetails] = useState(null);
    const [selectedTimeRange, setSelectedTimeRange] = useState('today');

    useEffect(() => {
        refreshData();

        // 1. Request Notification Permission
        if (Notification.permission !== 'granted') {
            Notification.requestPermission();
        }

        // 2. Realtime Listener for New Complaints (Admin/Supervisor Only)
        // Check if user is Admin or Supervisor
        if (['ADMIN', 'SUPERVISOR', 'MANAGER'].includes(user.role)) {
            const subscription = supabase
                .channel('admin-complaints-channel')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'complaints' }, (payload) => {
                    console.log('New Complaint Received:', payload);

                    // Trigger Browser Notification
                    if (Notification.permission === 'granted') {
                        const newComplaint = payload.new;
                        new Notification('شكوى جديدة', {
                            body: `تم رفع شكوى من قبل الموظف للعميل: ${newComplaint.customer_name || 'غير معروف'}\nرقم الهاتف: ${newComplaint.customer_number || '-'}`,
                            icon: '/favicons/favicon-192x192.png', // Fallback or use a valid path if known
                            tag: 'new-complaint' // Prevents duplicate notifications stacking too much
                        });
                    }

                    // Refresh Dashboard Data
                    refreshData();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(subscription);
            };
        }
    }, [user.role]); // Re-run if role changes (unlikely but safe)

    useEffect(() => {
        const loadCategories = async () => {
            setCategories(await DataManager.getCategoriesByType(categoryType));
        };
        loadCategories();
    }, [categoryType]);

    const refreshData = async () => {
        const _calls = await DataManager.getCalls();
        setCalls(_calls);
        // Note: categories loaded via effect on categoryType change
        setCategories(await DataManager.getCategoriesByType(categoryType));

        const _users = await DataManager.getUsers();
        setUsers(_users);

        // Refresh Current User Data (Permissions)
        // We find the user by ID from the fresh list
        if (user && user.id) {
            const freshUserData = _users.find(u => u.id === user.id);
            if (freshUserData) {
                console.log("Refreshed Permissions:", freshUserData.permissions);
                setCurrentUser(freshUserData);
            }
        }

        // Calculate Stats
        const totalDuration = _calls.reduce((sum, call) => sum + (call.duration || 0), 0);
        const successfulCalls = _calls.filter(call => call.status === 'Successful').length;

        setStats({
            totalCalls: _calls.length,
            topCategory: _calls.length > 0 && _calls[0].classificationPath ? _calls[0].classificationPath[0] : '-',
            avgCallDuration: _calls.length > 0 ?
                `${Math.floor(totalDuration / _calls.length / 60)}:${(Math.floor(totalDuration / _calls.length) % 60).toString().padStart(2, '0')}` : '0:00',
            resolutionRate: _calls.length > 0 ? `${Math.round((successfulCalls / _calls.length) * 100)}%` : '0%'
        });
    };

    // Category Handlers
    const handleAddChild = (parentId) => {
        setCategoryForm({ name: '', isRequired: false, parentId });
        setCategoryModalMode('add');
        setIsCategoryModalOpen(true);
    };

    const handleAddRoot = () => {
        setCategoryForm({ name: '', isRequired: false, parentId: null });
        setCategoryModalMode('add');
        setIsCategoryModalOpen(true);
    };

    const handleEditCategory = (category) => {
        // We expect the full category object now, or we construct it
        // If passed as (id, name), we need to adapt. 
        // Adapting for current CategoryNode which passes (id, name)
        // Ideally we pass the node object from CategoryNode.
        // For now, let's assume we update CategoryNode to pass the node, or we handle it here.
        if (category && typeof category === 'object') {
            setCategoryForm({
                id: category.id,
                name: category.name,
                isRequired: category.is_required || false,
                parentId: category.parent_id
            });
            setCategoryModalMode('edit');
            setIsCategoryModalOpen(true);
        }
    };

    const handleSaveCategory = async () => {
        if (!categoryForm.name) return;

        try {
            if (categoryModalMode === 'add') {
                await DataManager.addCategory(
                    categoryForm.name,
                    categoryForm.parentId,
                    categoryType,
                    { isRequired: categoryForm.isRequired }
                );
                toast.success('تمت الإضافة', 'تمت إضافة التصنيف بنجاح');
            } else {
                await DataManager.updateCategory(
                    categoryForm.id,
                    categoryForm.name,
                    categoryType,
                    { isRequired: categoryForm.isRequired }
                );
                toast.success('تم الحفظ', 'تم تحديث التصنيف بنجاح');
            }

            setIsCategoryModalOpen(false);
            // Refresh categories
            setCategories(await DataManager.getCategoriesByType(categoryType));
        } catch (e) {
            console.error(e);
            toast.error('خطأ', 'حدثت مشكلة أثناء الحفظ. تأكد من قاعدة البيانات.');
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm('هل أنت متأكد من الحذف؟')) return;

        const { error } = await DataManager.deleteCategory(id, categoryType);
        if (error) {
            toast.error('خطأ', `فشل الحذف: ${error.message}`);
            return;
        }

        toast.success('تم الحذف', 'تم حذف التصنيف بنجاح');
        const _categories = await DataManager.getCategoriesByType(categoryType);
        setCategories(_categories);
    };

    // DnD State
    const [draggedNode, setDraggedNode] = useState(null);

    const handleMoveCategory = async (e, targetNode, action) => {
        if (action === 'start') {
            setDraggedNode(targetNode);
            e.dataTransfer.effectAllowed = 'move';
            // e.dataTransfer.setDragImage(img, 0, 0); // Optional
        } else if (action === 'over') {
            // Add visual feedback if needed
        } else if (action === 'drop') {
            if (!draggedNode) return;
            if (draggedNode.id === targetNode.id) return; // Dropped on self

            // Handle Reorder Logic
            // 1. Find siblings of dragged node
            // 2. Find siblings of target node
            // 3. IF they are same parent, proceed. ELSE forbid (for simplicity now).

            // Helper to find parent array
            const findParentArray = (nodes, id) => {
                for (let i = 0; i < nodes.length; i++) {
                    if (nodes[i].id === id) return nodes;
                    if (nodes[i].children) {
                        const res = findParentArray(nodes[i].children, id);
                        if (res) return res;
                    }
                }
                return null;
            };

            const draggedSiblings = findParentArray(categories, draggedNode.id);
            const targetSiblings = findParentArray(categories, targetNode.id);

            // Strict Reordering: Only allowing reorder within same list for now
            if (draggedSiblings !== targetSiblings) {
                toast.error('غير مسموح', 'يمكنك اعادة الترتيب في نفس المستوى فقط');
                setDraggedNode(null);
                return;
            }

            const siblings = [...draggedSiblings];
            const oldIndex = siblings.findIndex(n => n.id === draggedNode.id);
            const newIndex = siblings.findIndex(n => n.id === targetNode.id);

            // Move in array
            const [movedItem] = siblings.splice(oldIndex, 1);
            siblings.splice(newIndex, 0, movedItem);

            // Prepare Updates
            const updates = siblings.map((item, idx) => ({
                id: item.id,
                name: item.name, // CRITCHAL FIX: Passing name correctly
                sort_order: idx
            }));

            // Optimistic Update?
            // Since it's reference in 'categories', modifying 'siblings' might not trigger re-render if it's deep.
            // Better to fetch fresh.

            try {
                await Promise.all(updates.map(u =>
                    DataManager.updateCategory(u.id, u.name, categoryType, { sort_order: u.sort_order })
                ));

                setCategories(await DataManager.getCategoriesByType(categoryType));
                toast.success('تم', 'تم تحديث الترتيب');
            } catch (err) {
                console.error(err);
                toast.error('خطأ', 'فشل الحفظ');
            }

            setDraggedNode(null);
        }
    };

    // User Management Handlers
    const openAddUserModal = () => {
        setModalMode('add');
        setUserForm({ name: '', username: '', password: '', role: 'AGENT', permissions: ['HANDLE_CALLS'] });
        setIsModalOpen(true);
    };

    const openEditUserModal = (user) => {
        setModalMode('edit');
        setSelectedUser(user);
        setUserForm({
            name: user.name,
            username: user.username,
            password: user.password,
            role: user.role,
            permissions: user.permissions || []
        });
        setIsModalOpen(true);
    };

    const handleSaveUser = async (userData) => {
        // e.preventDefault(); - UserForm handles preventDefault and passes form data directy
        try {
            if (modalMode === 'add') {
                await DataManager.addUser(userData);
            } else {
                await DataManager.updateUser(selectedUser.id, userData);
            }
            setIsModalOpen(false);
            refreshData();
        } catch (error) {
            console.error(error);
            alert('حدث خطأ أثناء الحفظ');
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
        await DataManager.deleteUser(id);
        refreshData();
    };


    // Agent Stats Helpers
    const getAgentStats = () => {
        return users
            .filter(u => u.role !== 'ADMIN')
            .map(agent => {
                const agentCalls = calls.filter(c => c.agentId === agent.id || c.agent_id === agent.id);
                const successfulCalls = agentCalls.filter(call => call.status === 'Successful').length;

                return {
                    ...agent,
                    totalCalls: agentCalls.length,
                    successfulCalls: successfulCalls,
                    resolutionRate: agentCalls.length > 0 ? `${Math.round((successfulCalls / agentCalls.length) * 100)}%` : '0%',
                    avgDuration: agentCalls.length > 0 ?
                        `${Math.floor(agentCalls.reduce((sum, call) => sum + (call.duration || 0), 0) / agentCalls.length / 60)}:${(Math.floor(agentCalls.reduce((sum, call) => sum + (call.duration || 0), 0) / agentCalls.length) % 60).toString().padStart(2, '0')}` : '0:00',
                    lastCall: agentCalls.length > 0 ? agentCalls[0].timestamp : null
                };
            });
    };

    const getFilteredAgentCalls = () => {
        if (!selectedAgentForStats) return [];
        let agentCalls = calls.filter(c => (c.agentId === selectedAgentForStats.id || c.agent_id === selectedAgentForStats.id));

        if (statsDateFilter) {
            agentCalls = agentCalls.filter(c => {
                const callDate = new Date(c.timestamp).toISOString().split('T')[0];
                return callDate === statsDateFilter;
            });
        }
        return agentCalls;
    };

    const handleAgentClick = (agent) => {
        setSelectedAgentForStats(agent);
        setViewMode('agent_details');
    };

    // Report Helpers moved to ReportsView

    // Computed
    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
        const rolePriority = {
            'ADMIN': 1,
            'SUPERVISOR': 2,
            'COMPLAINT_OFFICER': 3,
            'AGENT': 4
        };
        const p1 = rolePriority[a.role] || 99;
        const p2 = rolePriority[b.role] || 99;
        return p1 - p2;
    });

    // Chart Data Preparation
    const prepareChartData = () => {
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split('T')[0];
        });

        const activityData = last7Days.map(date => {
            const dayCalls = calls.filter(c => c.timestamp && c.timestamp.startsWith(date));

            let successful = 0;
            let disconnected = 0;
            let annoying = 0;

            dayCalls.forEach(call => {
                const statusText = (call.form_data && call.form_data.terminationProcedure) ||
                    (call.formData && call.formData.terminationProcedure) ||
                    (call.status === 'Successful' ? 'ناجحة' : call.status);

                if (statusText.includes('ناجحة') || statusText === 'Successful') successful++;
                else if (statusText.includes('مقطوعة')) disconnected++;
                else if (statusText.includes('مزعج') || statusText.includes('فاشلة')) annoying++;
            });

            return {
                name: date.slice(5),
                calls: dayCalls.length,
                successful,
                disconnected,
                annoying
            };
        });

        const statusCounts = calls.reduce((acc, call) => {
            const statusText = (call.form_data && call.form_data.terminationProcedure) ||
                (call.formData && call.formData.terminationProcedure) ||
                (call.status === 'Successful' ? 'ناجحة' :
                    (call.status === 'Active' ? 'جارية' : 'أخرى'));

            acc[statusText] = (acc[statusText] || 0) + 1;
            return acc;
        }, {});

        const outcomeData = Object.keys(statusCounts).map(status => {
            let color = '#3b82f6'; // Default Blue
            if (status.includes('ناجحة') || status === 'Successful') color = '#10b981'; // Green
            else if (status.includes('مقطوعة')) color = '#f97316'; // Orange
            else if (status.includes('مزعج') || status.includes('فاشلة')) color = '#ef4444'; // Red
            else if (status.includes('جارية')) color = '#f59e0b'; // Amber

            return { name: status, value: statusCounts[status], color };
        }).sort((a, b) => b.value - a.value);

        return { activityData, outcomeData };
    };
    const { activityData, outcomeData } = prepareChartData();

    return (
        <div className={styles.container}>
            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.sidebarCollapsed : styles.sidebarExpanded}`}>
                <div className={styles.logoSection} style={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className={styles.menuBtn}
                        style={{ marginRight: sidebarCollapsed ? 0 : 'auto' }}
                    >
                        <Menu size={20} />
                    </button>

                    {!sidebarCollapsed ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Headset size={32} color="#3b82f6" />
                            <span style={{ fontWeight: '700', fontSize: '1.2rem', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Tawasul</span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                            <Headset size={28} color="#3b82f6" />
                        </div>
                    )}
                </div>

                <nav className={styles.nav}>
                    {NAVIGATION_CONFIG.filter(module => {
                        // Admin NO LONGER gets everything automatically. 
                        // We rely on defaultAllowed or specific user permissions.

                        // Safest logic:
                        const userPerms = currentUser.permissions || [];
                        const defaultPerms = getDefaultModulesForRole(currentUser.role);

                        // If user has NO permissions array, use defaults
                        if (!currentUser.permissions || currentUser.permissions.length === 0) {
                            return defaultPerms.includes(module.id);
                        }

                        // Check match
                        if (Array.isArray(userPerms)) {
                            return userPerms.includes(module.id);
                        }
                        return false;
                    }).map(module => (
                        <SidebarItem
                            key={module.id}
                            icon={module.icon}
                            label={t(module.label) === module.label ? module.fallbackLabel : t(module.label)} // Fallback if translation missing
                            active={activeTab === module.id}
                            onClick={() => setActiveTab(module.id)}
                            collapsed={sidebarCollapsed}
                            // Special badge logic or generic?
                            badge={module.id === 'categories' ? categories.length :
                                module.id === 'users' ? users.length : null}
                        />
                    ))}


                </nav>

                <div className={styles.userSection} style={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
                    <UserAvatar user={currentUser} size={sidebarCollapsed ? 40 : 44} />

                    {!sidebarCollapsed && (
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{currentUser.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)' }}>مدير النظام</div>
                        </div>
                    )}


                    <button
                        onClick={onLogout}
                        className={styles.menuBtn}
                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', marginLeft: sidebarCollapsed ? 0 : 'auto' }}
                        title="تسجيل الخروج"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.main}>
                <header className={styles.header}>
                    <div>
                        <h1 className={styles.pageTitle}>
                            {activeTab === 'dashboard' && t('sidebar.dashboard')}
                            {activeTab === 'categories' && t('sidebar.categories')}
                            {activeTab === 'users' && t('sidebar.users')}
                            {activeTab === 'performance' && t('sidebar.performance')}
                            {activeTab === 'reports' && t('sidebar.reports')}
                            {activeTab === 'tracking' && t('sidebar.tracking')}
                            {activeTab === 'complaints_config' && t('sidebar.complaintsConfig')}
                            {activeTab === 'complaints_manage' && t('sidebar.complaintsManage')}
                            {activeTab === 'settings' && t('sidebar.settings')}
                            {activeTab === 'guide' && t('sidebar.guide')}
                        </h1>
                        {/* Subtitle logic can be added later or simplified */}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <LanguageToggle />
                        <ThemeToggle />
                    </div>


                </header>

                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && viewMode === 'dashboard' && (
                    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                        <div className={styles.statsGrid}>
                            <StatsCard
                                title="إجمالي المكالمات"
                                value={stats.totalCalls}
                                icon={PhoneCall}
                                color="#3b82f6"
                                change="+12%"
                                trend="من الأسبوع الماضي"
                            />
                            <StatsCard
                                title="معدل الحل"
                                value={stats.resolutionRate}
                                icon={CheckCircle}
                                color="#10b981"
                                change="+5%"
                                trend="تحسن"
                            />
                            <StatsCard
                                title="مدة المكالمة المتوسطة"
                                value={stats.avgCallDuration}
                                icon={Clock}
                                color="#f59e0b"
                                change="-0:15"
                                trend="من الشهر الماضي"
                            />
                            <StatsCard
                                title="التصنيف الأكثر شيوعاً"
                                value={stats.topCategory}
                                icon={Award}
                                color="#8b5cf6"
                                change="مستقر"
                            />
                        </div>

                        {/* Charts Section */}
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div className={styles.glassPanel} style={{ marginBottom: 0, height: '350px', display: 'flex', flexDirection: 'column' }}>
                                <h2 className={styles.sectionTitle} style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                                    اتجاهات حجم المكالمات
                                </h2>
                                <div style={{ flex: 1, marginRight: '-20px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={activityData}>
                                            <defs>
                                                <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorDisconnected" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorAnnoying" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} vertical={false} />
                                            <XAxis dataKey="name" stroke={theme === 'dark' ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"} tick={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }} />
                                            <YAxis stroke={theme === 'dark' ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"} tick={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                                                    border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                                                    borderRadius: '8px',
                                                    color: theme === 'dark' ? '#fff' : '#000'
                                                }}
                                                itemStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                                            />
                                            <Area type="monotone" dataKey="calls" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCalls)" name="المكالمات" />
                                            <Area type="monotone" dataKey="successful" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSuccess)" name="الناجحة" />
                                            <Area type="monotone" dataKey="disconnected" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorDisconnected)" name="مقطوعة" />
                                            <Area type="monotone" dataKey="annoying" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorAnnoying)" name="مزعجة" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className={styles.glassPanel} style={{ marginBottom: 0, height: '350px', display: 'flex', flexDirection: 'column' }}>
                                <h2 className={styles.sectionTitle}>توزيع الحالات</h2>
                                <div style={{ flex: 1, position: 'relative' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsPieChart>
                                            <Pie
                                                data={outcomeData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >

                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                                                        border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                                                        borderRadius: '8px',
                                                        color: theme === 'dark' ? '#fff' : '#000'
                                                    }}
                                                    itemStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                                                />
                                                {outcomeData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                                ))}
                                            </Pie>
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{calls.length}</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>الإجمالي</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
                                    {outcomeData.map(d => (
                                        <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }}></div>
                                            <span>{d.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>



                        <div className={styles.glassPanel}>
                            <h2 className={styles.sectionTitle} style={{ marginBottom: '1.5rem' }}>آخر المكالمات</h2>
                            <div className={styles.activityList}>
                                {calls.slice(0, 5).map(call => {
                                    const statusText = (call.form_data && call.form_data.terminationProcedure) ||
                                        (call.formData && call.formData.terminationProcedure) ||
                                        (call.status === 'Successful' ? 'ناجحة' : call.status);

                                    let statusColor = '#3b82f6';
                                    let statusBg = 'rgba(59, 130, 246, 0.1)';
                                    let statusBorder = 'rgba(59, 130, 246, 0.2)';

                                    if (statusText.includes('ناجحة') || statusText === 'Successful') {
                                        statusColor = '#10b981';
                                        statusBg = 'rgba(16, 185, 129, 0.1)';
                                        statusBorder = 'rgba(16, 185, 129, 0.2)';
                                    } else if (statusText.includes('مقطوعة')) {
                                        statusColor = '#f97316'; // Orange
                                        statusBg = 'rgba(249, 115, 22, 0.1)';
                                        statusBorder = 'rgba(249, 115, 22, 0.2)';
                                    } else if (statusText.includes('مزعج') || statusText.includes('فاشلة')) {
                                        statusColor = '#ef4444'; // Red
                                        statusBg = 'rgba(239, 68, 68, 0.1)';
                                        statusBorder = 'rgba(239, 68, 68, 0.2)';
                                    }

                                    return (
                                        <div key={call.id} className={styles.activityItem}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{
                                                    width: '40px', height: '40px', borderRadius: '10px',
                                                    background: statusBg,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    border: `1px solid ${statusBorder}`
                                                }}>
                                                    <Phone size={18} color={statusColor} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '600' }}>{call.callerNumber || call.caller_number}</div>
                                                    <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                                                        {new Date(call.timestamp).toLocaleString('en-US')}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <span
                                                    className={styles.callStatus}
                                                    style={{
                                                        backgroundColor: statusBg,
                                                        color: statusColor,
                                                        border: `1px solid ${statusBorder}`
                                                    }}
                                                >
                                                    {statusText}
                                                </span>
                                                <button
                                                    onClick={() => setViewCallDetails(call)}
                                                    className={styles.iconButton}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )
                }


                {/* Agent Details View */}
                {activeTab === 'dashboard' && viewMode === 'agent_details' && selectedAgentForStats && (
                    <AgentDetailsView
                        agent={selectedAgentForStats}
                        calls={getFilteredAgentCalls()}
                        onBack={() => { setViewMode('dashboard'); setSelectedAgentForStats(null); }}
                        dateFilter={statsDateFilter}
                        onDateFilterChange={setStatsDateFilter}
                        onViewCallDetails={setViewCallDetails}
                    />
                )}

                {/* Reports Tab */}
                {activeTab === 'reports' && (
                    <ReportsView calls={calls} users={users} />
                )}

                {/* Categories Tab */}
                {activeTab === 'categories' && (
                    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                        <div className={styles.glassPanel}>
                            <div className={styles.sectionHeader}>
                                <div>
                                    <h2 className={styles.sectionTitle}>إدارة الهيكل التنظيمي</h2>
                                    <p className={styles.pageSubtitle}>
                                        {categoryType === 'classification' && 'تصنيف المكالمات والاستفسارات'}
                                        {categoryType === 'location' && 'المحافظات والمديريات'}
                                        {categoryType === 'procedure' && 'إجراءات إنهاء المكالمات'}
                                        {categoryType === 'action' && 'الإجراءات المتبعة أثناء المكالمة'}
                                        {categoryType === 'account_type' && 'أنواع حسابات العملاء (شخصي، تجاري، ...)'}
                                    </p>
                                </div>
                                <div className={styles.actions}>
                                    <button className={`${styles.actionBtn} ${styles.btnPrimary}`} onClick={handleAddRoot}>
                                        <Plus size={18} /> إضافة رئيسي
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '4px' }}>
                                <div className={styles.tabs} style={{ width: 'fit-content' }}>
                                    <button
                                        className={`${styles.tab} ${categoryType === 'classification' ? styles.active : ''}`}
                                        onClick={() => setCategoryType('classification')}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                    >
                                        <Layers size={18} />
                                        <span>التصنيفات</span>
                                    </button>
                                    <button
                                        className={`${styles.tab} ${categoryType === 'location' ? styles.active : ''}`}
                                        onClick={() => setCategoryType('location')}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                    >
                                        <MapPin size={18} />
                                        <span>المواقع</span>
                                    </button>
                                    <button
                                        className={`${styles.tab} ${categoryType === 'procedure' ? styles.active : ''}`}
                                        onClick={() => setCategoryType('procedure')}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                    >
                                        <CheckSquare size={18} />
                                        <span>الإجراءات</span>
                                    </button>
                                    <button
                                        className={`${styles.tab} ${categoryType === 'action' ? styles.active : ''}`}
                                        onClick={() => setCategoryType('action')}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                    >
                                        <Zap size={18} />
                                        <span>أفعال</span>
                                    </button>
                                    <button
                                        className={`${styles.tab} ${categoryType === 'account_type' ? styles.active : ''}`}
                                        onClick={() => setCategoryType('account_type')}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                    >
                                        <UserIcon size={18} />
                                        <span>أنواع الحسابات</span>
                                    </button>
                                </div>
                            </div>

                            <div className={styles.treeContainer}>
                                {categories.length === 0 ? (
                                    <div className={styles.emptyState}>
                                        <FolderTree size={48} />
                                        <h3>لا توجد تصنيفات</h3>
                                        <p>ابدأ بإضافة تصنيف رئيسي جديد</p>
                                    </div>
                                ) : (
                                    categories.map(cat => (
                                        <CategoryNode
                                            key={cat.id}
                                            node={cat}
                                            depth={0}
                                            onAddChild={handleAddChild}
                                            onEdit={handleEditCategory}
                                            onDelete={handleDeleteCategory}
                                            onMove={handleMoveCategory}
                                            allowChildren={categoryType !== 'procedure' && categoryType !== 'action' && categoryType !== 'account_type'}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Customer Tracking Tab */}
                {activeTab === 'tracking' && (
                    <div style={{ animation: 'fadeIn 0.5s ease-out', height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
                        <CustomerTrackingView calls={calls} users={users} />
                    </div>
                )}

                {/* Complaint Config Tab */}
                {activeTab === 'complaints_config' && (
                    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                        <ComplaintTypeConfig />
                    </div>
                )}

                {/* Complaint Management Tab */}
                {activeTab === 'complaints_manage' && (
                    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                        <ComplaintList user={user} />
                    </div>
                )}

                {/* Agent Performance Tab */}
                {activeTab === 'performance' && (
                    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                        <AgentPerformanceView users={users.filter(u => u.role === 'AGENT')} calls={calls} />
                    </div>
                )}

                {/* Knowledge Base Tab */}
                {activeTab === 'guide' && (
                    <div style={{ animation: 'fadeIn 0.5s ease-out', height: 'calc(100vh - 140px)' }}>
                        <KnowledgeBaseManager />
                    </div>
                )}


                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                        <div className={styles.glassPanel} style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{
                                padding: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <div className={`${styles.callStatus} ${styles.statusOther}`}>
                                        {filteredUsers.length} الكلي
                                    </div>
                                    {Object.entries(filteredUsers.reduce((acc, user) => {
                                        const roleName = user.role === 'ADMIN' ? 'مدير' :
                                            user.role === 'AGENT' ? 'خدمة عملاء' :
                                                user.role === 'SUPERVISOR' ? 'مشرف' :
                                                    user.role === 'EVALUATOR' ? 'مقيم' :
                                                        user.role === 'COMPLAINT_OFFICER' ? 'موظف شكاوى' : user.role;
                                        acc[roleName] = (acc[roleName] || 0) + 1;
                                        return acc;
                                    }, {})).map(([role, count]) => (
                                        <div key={role} className={`${styles.callStatus} ${styles.statusSuccess}`} style={{ background: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#cbd5e1' }}>
                                            {count} {role}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    className={`${styles.actionBtn} ${styles.btnGreen}`}
                                    onClick={openAddUserModal}
                                >
                                    <Plus size={18} /> إضافة موظف جديد
                                </button>
                            </div>

                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th className={styles.th}>الموظف</th>
                                            <th className={styles.th}>اسم المستخدم</th>
                                            <th className={styles.th}>الدور</th>
                                            <th className={styles.th}>الصلاحيات</th>
                                            <th className={styles.th}>الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map(u => (
                                            <UserRow
                                                key={u.id}
                                                user={u}
                                                onEdit={openEditUserModal}
                                                onDelete={handleDeleteUser}
                                                calls={calls}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Permissions Tab */}
                {activeTab === 'permissions' && currentUser.role === 'ADMIN' && (
                    <div style={{ animation: 'fadeIn 0.5s ease-out', height: 'calc(100vh - 140px)' }}>
                        <PermissionsManager />
                    </div>
                )}

                {/* Service Points */}
                {activeTab === 'service_points' && (
                    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                        <ServicePointsManager />
                    </div>
                )}

                {/* Complaint Submission Tab (For Admin/Agent) */}
                {activeTab === 'complaint_submission' && (
                    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                        <ComplaintSubmission user={currentUser} />
                    </div>
                )}

                {/* Reminders Tab (For Admin/Agent) */}
                {activeTab === 'reminders' && (
                    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                        <ReminderView user={currentUser} onReminderAdded={() => { }} />
                    </div>
                )}

            </main>

            {/* Modals */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={modalMode === 'add' ? 'إضافة موظف جديد' : 'تعديل بيانات الموظف'}
            >
                <UserForm
                    initialData={userForm}
                    onChange={setUserForm}
                    onSubmit={handleSaveUser}
                    mode={modalMode}
                />
            </Modal>

            {/* Category Modal */}
            <Modal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                title={categoryModalMode === 'add' ? 'إضافة تصنيف جديد' : 'تعديل تصنيف'}
            >
                <div style={{ padding: '0.5rem' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.75rem',
                            color: '#94a3b8',
                            fontSize: '0.9rem',
                            fontWeight: '600'
                        }}>اسم التصنيف</label>
                        <input
                            type="text"
                            value={categoryForm.name}
                            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                            className={styles.glassInput}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                background: 'rgba(30, 41, 59, 0.5)',
                                border: '1px solid rgba(148, 163, 184, 0.2)',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '1rem'
                            }}
                            autoFocus
                            placeholder="أدخل اسم التصنيف..."
                        />
                    </div>

                    <div style={{
                        padding: '1.25rem',
                        background: 'rgba(30, 41, 59, 0.4)',
                        borderRadius: '16px',
                        border: '1px solid rgba(148, 163, 184, 0.1)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '1rem'
                    }}>
                        <div style={{ paddingTop: '2px' }}>
                            <input
                                type="checkbox"
                                id="isRequiredCheckbox"
                                checked={categoryForm.isRequired}
                                onChange={(e) => setCategoryForm({ ...categoryForm, isRequired: e.target.checked })}
                                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#10b981' }}
                            />
                        </div>
                        <label htmlFor="isRequiredCheckbox" style={{ cursor: 'pointer', flex: 1 }}>
                            <div style={{ fontWeight: '700', color: categoryForm.isRequired ? '#34d399' : '#e2e8f0', marginBottom: '0.5rem' }}>
                                حقل إلزامي
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.5' }}>
                                عند تفعيل هذا الخيار، سيتم إلزام الموظف باختيار قيمة من هذا التصنيف ولن يتمكن من حفظ المكالمة بدونه.
                            </div>
                        </label>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                        <button
                            onClick={() => setIsCategoryModalOpen(false)}
                            style={{
                                padding: '0.75rem 2rem',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(255,255,255,0.05)',
                                color: '#e2e8f0',
                                cursor: 'pointer',
                                fontWeight: '600',
                                transition: 'all 0.2s'
                            }}
                        >
                            إلغاء
                        </button>
                        <button
                            onClick={handleSaveCategory}
                            style={{
                                padding: '0.75rem 2.5rem',
                                borderRadius: '12px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                color: 'white',
                                cursor: 'pointer',
                                fontWeight: '700',
                                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.4)',
                                transition: 'all 0.2s'
                            }}
                        >
                            حفظ
                        </button>
                    </div>
                </div>
            </Modal>

            {viewCallDetails && (
                <CallDetailsModal
                    call={viewCallDetails}
                    onClose={() => setViewCallDetails(null)}
                />
            )}
        </div>
    );
};

export default AdminDashboardPage;
