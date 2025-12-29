import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, PhoneCall, Users, BarChart3, FileText, Settings,
    LogOut, UserCheck, HelpCircle, Bell, Clock, Activity, CheckCircle,
    Smartphone, Phone, ShieldCheck, ArrowLeft
} from 'lucide-react';

import { DataManager } from '../../../shared/utils/DataManager';
import SidebarItem from '../../../shared/components/SidebarItem';
import StatsCard from '../../../shared/components/StatsCard';
import UserAvatar from '../../../shared/components/UserAvatar';
import Modal from '../../../shared/components/Modal';
import ThemeToggle from '../../../shared/components/ThemeToggle';
import LanguageToggle from '../../../shared/components/LanguageToggle';
import { useLanguage } from '../../../shared/context/LanguageContext';

import FaceWidget from '../components/FaceWidget';
import IncomingCallModal from '../components/IncomingCallModal';
import ActiveCallView from '../components/ActiveCallView';
import CallHistoryList from '../components/CallHistoryList';
import CallDetailsModal from '../../admin/components/CallDetailsModal';
import ComplaintSubmission from '../components/ComplaintSubmission';
import KnowledgeBaseView from '../components/KnowledgeBaseView';
import ReminderView from '../components/ReminderView';
import { BookOpen } from 'lucide-react';

import ReportsView from '../../admin/components/ReportsView';
import AgentPerformanceView from '../../admin/components/AgentPerformanceView';
import { PERMISSIONS } from '../../../shared/constants/permissions';
import { NAVIGATION_CONFIG, getDefaultModulesForRole } from '../../admin/constants/navigationConfig';

import { useToast } from '../../../shared/components/Toast';
import styles from './AgentDashboardPage.module.css';

const AgentDashboardPage = ({ user, onLogout }) => {
    const toast = useToast();
    const { t } = useLanguage();
    // Permissions Logic
    const canHandleCalls = user.permissions?.includes(PERMISSIONS.HANDLE_CALLS);
    const canViewReports = user.permissions?.includes(PERMISSIONS.VIEW_REPORTS);
    const canSubmitComplaints = user.permissions?.includes(PERMISSIONS.SUBMIT_COMPLAINTS);
    const hasCallPermission = !user.permissions || canHandleCalls;

    // Dynamic Default Tab Logic
    const [activeTab, setActiveTab] = useState(() => {
        const userPerms = user.permissions || [];
        const defaultPerms = getDefaultModulesForRole(user.role);

        let allowed = [];
        if (!user.permissions || user.permissions.length === 0) {
            allowed = defaultPerms;
        } else if (Array.isArray(userPerms)) {
            allowed = userPerms;
        }

        // Find matches in config to preserve order
        const firstAllowed = NAVIGATION_CONFIG.find(m => allowed.includes(m.id));
        return firstAllowed ? firstAllowed.id : 'dashboard';
    });
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Sidebar Toggle
    const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

    // Data
    const [categories, setCategories] = useState([]);
    const [locations, setLocations] = useState([]);
    const [procedures, setProcedures] = useState([]);
    const [actions, setActions] = useState([]);
    const [accountTypes, setAccountTypes] = useState([]);
    const [calls, setCalls] = useState([]);
    const [usersForReports, setUsersForReports] = useState([]);

    // Call State
    const [activeCall, setActiveCall] = useState(() => {
        try {
            const saved = localStorage.getItem('agent_active_call');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.startTime) {
                    parsed.startTime = new Date(parsed.startTime);
                }
                return parsed;
            }
        } catch (e) {
            console.error("Failed to load active call from local storage", e);
        }
        return null;
    });

    // Persist active call logic
    useEffect(() => {
        if (activeCall) {
            localStorage.setItem('agent_active_call', JSON.stringify(activeCall));
        } else {
            localStorage.removeItem('agent_active_call');
        }
    }, [activeCall]);

    const [incomingCall, setIncomingCall] = useState(null);
    const [stats, setStats] = useState({ totalCalls: 0, todayCalls: 0, resolutionRate: '0%', avgDuration: '0:00' });

    const [viewCallDetails, setViewCallDetails] = useState(null);

    // Reminder State
    const [pendingReminders, setPendingReminders] = useState([]);
    const [expiredReminders, setExpiredReminders] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifiedIds, setNotifiedIds] = useState(new Set());

    // Request Notification Permission
    useEffect(() => {
        if ("Notification" in window) {
            Notification.requestPermission();
        }
    }, []);

    // 1. Poll database for ALL pending reminders (sync with server)
    const syncReminders = async () => {
        // Get both pending and already expired but unread
        const pending = await DataManager.getReminders(user.id, 'pending');
        setPendingReminders(pending);
    };

    useEffect(() => {
        syncReminders();
        const interval = setInterval(syncReminders, 30000); // Sync every 30s
        return () => clearInterval(interval);
    }, [user.id]);

    // 2. Client-side Real-Time Monitor (Every Second)
    useEffect(() => {
        const monitorExpiry = () => {
            const now = new Date();
            const nowExpired = [];
            const stillPending = [];

            pendingReminders.forEach(rem => {
                const expiryDate = new Date(rem.expires_at);
                if (expiryDate <= now) {
                    nowExpired.push(rem);
                } else {
                    stillPending.push(rem);
                }
            });

            if (nowExpired.length > 0) {
                // Update local lists
                setExpiredReminders(prev => {
                    // Combine and avoid duplicates
                    const combined = [...prev, ...nowExpired];
                    return Array.from(new Map(combined.map(item => [item.id, item])).values());
                });

                setPendingReminders(stillPending);

                // Trigger Browser Notifications
                if ("Notification" in window && Notification.permission === "granted") {
                    nowExpired.forEach(rem => {
                        if (!notifiedIds.has(rem.id)) {
                            new Notification("🔔 انتهى وقت الحظر", {
                                body: `انتهت مدة حظر الرقم ${rem.phone_number}. السبب: ${rem.reason}`,
                                icon: '/favicon.ico'
                            });
                            setNotifiedIds(prev => new Set(prev).add(rem.id));
                        }
                    });
                }
            }
        };

        const timer = setInterval(monitorExpiry, 1000);
        return () => clearInterval(timer);
    }, [pendingReminders, notifiedIds]);

    const handleMarkReminderRead = async (id) => {
        await DataManager.markReminderRead(id);
        setExpiredReminders(prev => prev.filter(r => r.id !== id));
        setNotifiedIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    };

    // UI State



    // UI State
    useEffect(() => {
        loadData();
    }, [user.id]);

    const [currentUser, setCurrentUser] = useState(user);

    const loadData = async () => {
        try {
            const [cats, locs, procs, acts, accTypes, _calls, _users] = await Promise.all([
                DataManager.getCategoriesByType('classification'),
                DataManager.getCategoriesByType('location'),
                DataManager.getCategoriesByType('procedure'),
                DataManager.getCategoriesByType('action'),
                DataManager.getCategoriesByType('account_type'),
                DataManager.getCalls(),
                DataManager.getUsers()
            ]);

            setCategories(cats || []);
            setLocations(locs || []);
            setProcedures(procs || []);
            setActions(acts || []);
            setAccountTypes(accTypes || []);
            setUsersForReports(_users || []);

            // Refresh Permissions
            const freshUser = _users.find(u => u.id === user.id);
            if (freshUser) setCurrentUser(freshUser);

            // Filter for current user
            const userCalls = _calls.filter(c => c.agentId === user.id || c.agent_id === user.id);
            // CRITICAL: Restrict 'calls' state to only this user's calls as requested
            setCalls(userCalls);

            userCalls.sort((a, b) => new Date(b.startTime || b.timestamp) - new Date(a.startTime || a.timestamp)); // Sort by date desc
            // setRecentCalls(userCalls.slice(0, 5)); // Latest 5 calls - Assuming setRecentCalls state exists if this line is uncommented

            // Stats Calculations
            const today = new Date().toDateString();
            const todayCalls = userCalls.filter(c => new Date(c.timestamp || c.startTime).toDateString() === today);
            const successfulCalls = userCalls.filter(c =>
                c.status === 'Successful' ||
                (c.formData?.terminationProcedure && (
                    c.formData.terminationProcedure.includes('ناجح') ||
                    c.formData.terminationProcedure.toLowerCase().includes('success')
                ))
            ).length;
            const totalDuration = userCalls.reduce((sum, call) => sum + (call.duration || 0), 0);

            setStats({
                totalCalls: userCalls.length,
                todayCalls: todayCalls.length,
                resolutionRate: userCalls.length > 0 ? `${Math.round((successfulCalls / userCalls.length) * 100)}%` : '0%',
                avgDuration: userCalls.length > 0 ?
                    `${Math.floor(totalDuration / userCalls.length / 60)}:${(Math.floor(totalDuration / userCalls.length) % 60).toString().padStart(2, '0')}` : '0:00'
            });

        } catch (error) {
            console.error(error);
        }
    };

    // Call Handlers
    const handleSimulateCall = () => {
        setTimeout(() => {
            const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            setIncomingCall({
                number: `050123${randomSuffix}`,
                time: new Date()
            });
        }, 1000);
    };

    const handleManualCall = async () => {
        const number = prompt("أدخل رقم العميل:");
        if (number) {
            const startTime = new Date();
            const newCall = {
                agentId: user.id,
                callerNumber: number,
                startTime: startTime,
                status: 'Active',
                classificationPath: [],
                formData: {}
            };

            try {
                // Return to direct async call
                const result = await DataManager.addCall(newCall);
                if (result) {
                    // CRITICAL FIX: Normalize DB result (snake_case) to App State (camelCase)
                    // Supabase returns { caller_number, agent_id, timestamp ... }
                    // App expects { callerNumber, agentId, startTime ... }
                    const normalizedCall = {
                        ...result,
                        callerNumber: result.caller_number || result.callerNumber,
                        agentId: result.agent_id || result.agentId,
                        // Ensure startTime is a Date object. DB 'timestamp' is ISO string.
                        startTime: result.timestamp ? new Date(result.timestamp) : new Date(),
                        status: result.status,
                        classificationPath: result.classification_path || [],
                        formData: result.form_data || {}
                    };
                    setActiveCall(normalizedCall);
                } else {
                    toast.error('خطأ', 'فشل في إنشاء المكالمة. تأكد من الاتصال.');
                }
            } catch (e) {
                console.error(e);
                toast.error('خطأ', 'حدث خطأ أثناء إنشاء المكالمة');
            }
        }
    };

    const handleAcceptCall = () => {
        if (!incomingCall) return;
        setActiveCall({
            number: incomingCall.number,
            callerNumber: incomingCall.number,
            startTime: new Date(),
            status: 'Active',
            classificationPath: [],
            formData: {}
        });
        setIncomingCall(null);
    };

    const handleRejectCall = () => {
        setIncomingCall(null);
    };

    const handleTerminateCall = async (classificationPath, formData, customerInfo) => {
        if (!activeCall) return;

        try {
            let finalProcedure = '';
            if (formData.procedure) {
                const selectedProcedure = actions.find(a => a.id == formData.procedure);
                finalProcedure = selectedProcedure ? selectedProcedure.name : formData.procedure;
            } else {
                finalProcedure = 'إنهاء عادي';
            }

            let finalTerminationProcedure = '';
            if (formData.terminationProcedure) {
                const selectedTermProc = procedures.find(p => p.id == formData.terminationProcedure);
                finalTerminationProcedure = selectedTermProc ? selectedTermProc.name : formData.terminationProcedure;
            }

            const callUpdates = {
                classificationPath: classificationPath.map(c => c.name),
                notes: formData.notes,
                formData: {
                    ...formData,
                    procedure: finalProcedure,
                    terminationProcedure: finalTerminationProcedure, // This saves the NAME of the procedure
                    accountType: formData.accountType === 'business' ? 'حساب تاجر' :
                        formData.accountType === 'personal' ? 'حساب شخصي' : '',
                    customerSnapshot: customerInfo
                },
                // Determine Status based on Termination Procedure
                // If procedure name contains "ناجح" or "success", it's Successful. Otherwise Unsuccessful.
                status: (finalTerminationProcedure.includes('ناجح') || finalTerminationProcedure.toLowerCase().includes('success'))
                    ? 'Successful'
                    : 'Unsuccessful',
                duration: Math.round((new Date() - activeCall.startTime) / 1000)
            };

            let callId = activeCall.id;
            if (!callId) {
                const recentCalls = await DataManager.getCalls();
                const potentialMatch = recentCalls.find(c =>
                    c.agentId === user.id &&
                    c.status === 'Active' &&
                    new Date(c.startTime).getTime() > new Date().getTime() - 24 * 60 * 60 * 1000
                );
                if (potentialMatch) {
                    callId = potentialMatch.id;
                }
            }

            if (callId) {
                await DataManager.updateCall(callId, callUpdates);
            } else {
                await DataManager.addCall({
                    ...callUpdates,
                    agentId: user.id,
                    callerNumber: activeCall.callerNumber || activeCall.number,
                    startTime: activeCall.startTime,
                    status: 'Successful'
                });
            }

            setActiveCall(null);
            loadData();
            toast.success('تم الإنهاء', 'تم حفظ بيانات المكالمة بنجاح');

        } catch (error) {
            console.error('Termination error', error);
            toast.error('خطأ', 'حدث خطأ أثناء حفظ المكالمة');
        }
    };

    const greeting = new Date().getHours() < 12 ? 'morning' : 'evening';

    return (
        <div className={styles.container}>
            <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
                <div style={{
                    marginTop: '2rem', marginBottom: '2rem', padding: '0 1rem',
                    color: '#818cf8', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.2rem'
                }}>

                    {!sidebarCollapsed ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src="/src/assets/icon.png" alt="Tawasul" style={{ height: '35px', width: 'auto' }} />
                            <span>{sidebarCollapsed ? 'TW' : 'Tawasul'}</span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                            <img src="/src/assets/icon.png" alt="Tawasul Icon" style={{ height: '30px', width: 'auto', borderRadius: '50%' }} />
                        </div>
                    )}

                    <button
                        onClick={toggleSidebar}
                        style={{
                            marginLeft: 'auto',
                            background: 'transparent',
                            border: 'none',
                            color: '#818cf8',
                            cursor: 'pointer',
                            display: sidebarCollapsed ? 'none' : 'block'
                        }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                </div>

                {sidebarCollapsed && (
                    <button
                        onClick={toggleSidebar}
                        style={{
                            margin: '0 auto 1rem',
                            background: 'rgba(99, 102, 241, 0.1)',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            borderRadius: '8px',
                            width: '32px', height: '32px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#818cf8', cursor: 'pointer'
                        }}
                    >
                        <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
                    </button>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0 1rem' }}>
                    {NAVIGATION_CONFIG.filter(module => {
                        const userPerms = currentUser.permissions || [];
                        const defaultPerms = getDefaultModulesForRole(currentUser.role);

                        if (!currentUser.permissions || currentUser.permissions.length === 0) {
                            return defaultPerms.includes(module.id);
                        }

                        return Array.isArray(userPerms) && userPerms.includes(module.id);
                    }).map(module => (
                        <SidebarItem
                            key={module.id}
                            icon={module.icon}
                            label={t(module.label) === module.label ? module.fallbackLabel : t(module.label)}
                            active={activeTab === module.id}
                            onClick={() => setActiveTab(module.id)}
                            collapsed={sidebarCollapsed}
                        />
                    ))}
                </div>

                {!sidebarCollapsed && hasCallPermission && (
                    <div style={{
                        marginTop: '2rem',
                        padding: '1rem',
                        background: 'rgba(30, 41, 59, 0.5)',
                        borderRadius: '12px',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        width: 'calc(100% - 2rem)',
                        alignSelf: 'center'
                    }}>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.75rem', fontWeight: '600' }}>
                            {t('sidebar.quickActions')}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <button
                                onClick={handleSimulateCall}
                                style={{ padding: '0.6rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', color: '#34d399', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}
                            >
                                <Smartphone size={16} /> {t('sidebar.simulateCall')}
                            </button>
                            <button
                                onClick={handleManualCall}
                                style={{ padding: '0.6rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px', color: '#60a5fa', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}
                            >
                                <Phone size={16} /> {t('sidebar.manualCall')}
                            </button>
                        </div>
                    </div>
                )}

                <div style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <SidebarItem icon={LogOut} label={t('common.logout')} onClick={onLogout} collapsed={sidebarCollapsed} />
                </div>
            </aside>

            {/* Main */}
            < main className={styles.main} >
                <header className={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.1rem' }}>
                        <span style={{ fontWeight: 'bold', color: '#e2e8f0' }}>{t(`common.${greeting}`)}،</span>
                        <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{currentUser.name}</span>
                        <div style={{
                            padding: '4px 12px', background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '20px',
                            fontSize: '0.85rem', color: '#34d399', fontWeight: '600', display: 'flex', gap: '4px', alignItems: 'center'
                        }}>
                            <UserCheck size={14} /> {t('roles.agent')}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <LanguageToggle />
                        <ThemeToggle />

                        <button className={styles.iconBtn}><HelpCircle size={20} color="#94a3b8" /></button>

                        {/* Notification Bell */}
                        <div style={{ position: 'relative' }}>
                            <button
                                className={styles.iconBtn}
                                onClick={() => setShowNotifications(!showNotifications)}
                            >
                                <Bell size={20} color={expiredReminders.length > 0 ? "#ef4444" : "#94a3b8"} />
                                {expiredReminders.length > 0 && (
                                    <span style={{
                                        position: 'absolute', top: -2, right: -2,
                                        width: '10px', height: '10px',
                                        background: '#ef4444', borderRadius: '50%',
                                        border: '2px solid #0f172a'
                                    }} />
                                )}
                            </button>

                            {/* Dropdown */}
                            {showNotifications && (
                                <div style={{
                                    position: 'absolute', top: '140%', left: 0,
                                    width: '350px',
                                    background: 'rgba(30, 41, 59, 0.7)',
                                    backdropFilter: 'blur(16px)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '24px',
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                    zIndex: 1000,
                                    overflow: 'hidden',
                                    animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                                }}>
                                    <div style={{
                                        padding: '1.25rem',
                                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        background: 'rgba(15, 23, 42, 0.3)'
                                    }}>
                                        <span style={{ fontWeight: '800', color: '#f8fafc', fontSize: '1.1rem' }}>الإشعارات</span>
                                        {expiredReminders.length > 0 && (
                                            <span style={{
                                                background: '#ef4444', color: 'white',
                                                padding: '2px 8px', borderRadius: '12px',
                                                fontSize: '0.75rem', fontWeight: 'bold'
                                            }}>
                                                {expiredReminders.length} جديد
                                            </span>
                                        )}
                                    </div>
                                    <div className="custom-scrollbar" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                        {expiredReminders.length === 0 ? (
                                            <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
                                                <div style={{
                                                    width: '64px', height: '64px', background: 'rgba(148, 163, 184, 0.1)',
                                                    borderRadius: '50%', display: 'flex', alignItems: 'center',
                                                    justifyContent: 'center', margin: '0 auto 1rem'
                                                }}>
                                                    <Bell size={32} color="#64748b" style={{ opacity: 0.5 }} />
                                                </div>
                                                <p style={{ color: '#64748b', fontSize: '0.95rem' }}>لا توجد إشعارات حالياً</p>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                {expiredReminders.map(rem => (
                                                    <div key={rem.id} style={{
                                                        padding: '1.25rem',
                                                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                                        background: 'rgba(239, 68, 68, 0.03)',
                                                        transition: 'background 0.2s',
                                                        cursor: 'default',
                                                        position: 'relative',
                                                        display: 'flex',
                                                        gap: '12px'
                                                    }}>
                                                        <div style={{
                                                            width: '40px', height: '40px', background: 'rgba(239, 68, 68, 0.1)',
                                                            borderRadius: '12px', display: 'flex', alignItems: 'center',
                                                            justifyContent: 'center', flexShrink: 0
                                                        }}>
                                                            <Clock size={20} color="#ef4444" />
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                                <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.9rem' }}>انتهى وقت الحظر</span>
                                                                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                                                                    {new Date(rem.expires_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                            <div style={{ color: '#e2e8f0', marginBottom: '0.75rem', fontSize: '0.95rem', lineHeight: '1.4' }}>
                                                                انتهى حظر الرقم <span style={{ fontFamily: 'monospace', color: '#60a5fa' }}>{rem.phone_number}</span>
                                                                <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '4px', fontStyle: 'italic' }}>
                                                                    السبب: {rem.reason}
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleMarkReminderRead(rem.id)}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '8px',
                                                                    borderRadius: '10px',
                                                                    border: '1px solid rgba(148, 163, 184, 0.2)',
                                                                    background: 'rgba(148, 163, 184, 0.05)',
                                                                    color: '#cbd5e1',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.85rem',
                                                                    fontWeight: 'bold',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                                onMouseOver={(e) => {
                                                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                                                }}
                                                                onMouseOut={(e) => {
                                                                    e.currentTarget.style.background = 'rgba(148, 163, 184, 0.05)';
                                                                    e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                                                                }}
                                                            >
                                                                تمت المراجعة
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {expiredReminders.length > 0 && (
                                        <div style={{
                                            padding: '0.75rem', background: 'rgba(15, 23, 42, 0.4)',
                                            textAlign: 'center', fontSize: '0.8rem', color: '#64748b'
                                        }}>
                                            سيتم حذف الإشعارات المقروءة تلقائياً
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <button className={styles.iconBtn}><Settings size={20} color="#94a3b8" /></button>
                    </div>
                </header>

                <div className={styles.content}>
                    {activeTab === 'reports' ? (
                        <ReportsView calls={calls} users={usersForReports} />
                    ) : activeTab === 'performance' ? (
                        <AgentPerformanceView users={usersForReports} calls={calls} />
                    ) : activeCall ? (
                        <ActiveCallView
                            call={activeCall}
                            categories={categories}
                            locations={locations}
                            procedures={procedures}
                            actions={actions}
                            accountTypes={accountTypes}
                            calls={calls}
                            onTerminate={handleTerminateCall}
                            onViewDetails={setViewCallDetails}
                            onCallUpdate={(updates) => setActiveCall(prev => ({ ...prev, ...updates }))}
                            user={currentUser}
                        />
                    ) : (
                        activeTab === 'dashboard' ? (
                            <>
                                <div className={styles.statsGrid}>
                                    <StatsCard title={t('dashboard.totalCalls')} value={stats.totalCalls} icon={PhoneCall} color="#3b82f6" trend="+12%" />
                                    <StatsCard title={t('dashboard.todayCalls')} value={stats.todayCalls} icon={Activity} color="#10b981" trend="+5%" />
                                    <StatsCard title={t('dashboard.resolutionRate')} value={stats.resolutionRate} icon={CheckCircle} color="#f59e0b" subtitle={t('dashboard.statusDist')} />
                                    <StatsCard title={t('dashboard.avgDuration')} value={stats.avgDuration} icon={Clock} color="#8b5cf6" trend="-0:15" />
                                </div>

                                <FaceWidget
                                    title={t('sidebar.readyForCalls')}
                                    subtitle={t('sidebar.readySubtitle')}
                                    showActions={false}
                                    onSimulateCall={handleSimulateCall}
                                    onManualCall={handleManualCall}
                                />
                            </>
                        ) : activeTab === 'calls' ? (
                            <>
                                <FaceWidget
                                    title={t('sidebar.callHistory')}
                                    subtitle={t('sidebar.callHistorySubtitle')}
                                    showActions={false}
                                />
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <CallHistoryList calls={calls} onViewDetails={setViewCallDetails} />
                                </div>
                            </>
                        ) : activeTab === 'customers' ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                صفحة العملاء - قريباً
                            </div>
                        ) : activeTab === 'complaint_submission' ? (
                            <ComplaintSubmission user={currentUser} />
                        ) : activeTab === 'guide' ? (
                            <KnowledgeBaseView onClose={() => setActiveTab('dashboard')} />
                        ) : activeTab === 'reminders' ? (
                            <ReminderView user={currentUser} onReminderAdded={syncReminders} />
                        ) : activeTab === 'agent_stats' ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                صفحة الإحصائيات - قريباً
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                قريباً...
                            </div>
                        )
                    )}
                </div>
            </main >

            {/* Modals */}
            < IncomingCallModal
                call={incomingCall}
                onAccept={handleAcceptCall}
                onReject={handleRejectCall}
            />

            {viewCallDetails && (
                <CallDetailsModal
                    call={viewCallDetails}
                    onClose={() => setViewCallDetails(null)}
                />
            )}
        </div >
    );
};

export default AgentDashboardPage;
