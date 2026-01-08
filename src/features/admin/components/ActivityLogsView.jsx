import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { DataManager } from '../../../shared/utils/DataManager';
import {
    Activity, Calendar, Filter, Search, User, Clock,
    Monitor, LogIn, MousePointer, ExternalLink
} from 'lucide-react';
import { useLanguage } from '../../../shared/context/LanguageContext';

const ActivityLogsView = () => {
    const { t } = useLanguage();
    const [logs, setLogs] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);

    // Filters
    const [filterUser, setFilterUser] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterDate, setFilterDate] = useState(''); // YYYY-MM-DD

    useEffect(() => {
        loadUsers();
        fetchLogs();
    }, [filterUser, filterType, filterDate]);

    const loadUsers = async () => {
        const data = await DataManager.getUsers();
        setUsers(data || []);
    };

    const fetchLogs = async () => {
        setLoading(true);
        setErrorMsg(null);

        // Use !inner to ensure we filter based on the joined user table
        let query = supabase
            .from('activity_logs')
            .select('*, user:users!inner(name, role)')
            .neq('user.role', 'ADMIN')
            .order('created_at', { ascending: false })
            .limit(500);

        // Try simpler query first if relation fails
        // query = supabase.from('activity_logs').select('*'); 

        if (filterUser) query = query.eq('user_id', filterUser);
        if (filterType) query = query.eq('action_type', filterType);

        // Date filtering (range for the whole day)
        if (filterDate) {
            const start = `${filterDate}T00:00:00`;
            const end = `${filterDate}T23:59:59`;
            query = query.gte('created_at', start).lte('created_at', end);
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching logs', error);
            setErrorMsg(error.message);
            // Fallback attempt without join if FK issue
            if (error.message.includes('Could not find relationship')) {
                const { data: simpleData, error: simpleError } = await supabase.from('activity_logs').select('*').limit(50);
                if (!simpleError) {
                    setLogs(simpleData || []);
                    setErrorMsg('Warning: Could not fetch user details. Showing raw logs.');
                }
            }
        } else {
            setLogs(data || []);
        }
        setLoading(false);
    };

    const handleDebugLog = async () => {
        const { error } = await supabase.from('activity_logs').insert({
            action_type: 'DEBUG',
            details: { msg: 'Test log from admin' }
        });
        if (error) alert('Insert Failed: ' + error.message);
        else {
            alert('Insert Success! Refreshing...');
            fetchLogs();
        }
    };

    const getActionIcon = (type) => {
        switch (type) {
            case 'LOGIN': return <LogIn size={18} color="#10b981" />;
            case 'LOGOUT': return <LogIn size={18} color="#ef4444" style={{ transform: 'rotate(180deg)' }} />;
            case 'NAVIGATE': return <MousePointer size={18} color="#3b82f6" />;
            case 'ACTION': return <Activity size={18} color="#f59e0b" />;
            default: return <Activity size={18} />;
        }
    };

    const formatTime = (isoString) => {
        return new Date(isoString).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDetails = (log) => {
        const details = log.details || {};
        if (log.action_type === 'NAVIGATE') {
            return (
                <span className="flex items-center gap-1 text-gray-300">
                    قام بزيارة قسم: <b className="text-white">{details.tabName || details.tabId}</b>
                </span>
            );
        }
        if (log.action_type === 'LOGIN') {
            return <span className="text-emerald-400">تسجيل دخول ناجح ({details.platform})</span>;
        }
        if (log.action_type === 'ACTION') {
            return <span>{details.action}</span>;
        }
        return JSON.stringify(details);
    };

    return (
        <div style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity color="#f59e0b" />
                    سجل نشاطات الموظفين
                </h2>
                <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                    آخر 500 عملية
                </div>
            </div>

            {/* Filter Bar */}
            {errorMsg && (
                <div style={{ padding: '1rem', background: '#e11d48', color: 'white', borderRadius: '8px', marginBottom: '1rem', fontWeight: 'bold' }}>
                    خطأ: {errorMsg}
                </div>
            )}
            <div style={{
                background: '#1e293b', padding: '1rem', borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem'
            }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <User size={18} style={{ position: 'absolute', right: '10px', top: '10px', color: '#94a3b8', pointerEvents: 'none' }} />
                    <select
                        value={filterUser}
                        onChange={(e) => setFilterUser(e.target.value)}
                        style={{
                            width: '100%', padding: '0.7rem 2.5rem 0.7rem 1rem',
                            background: '#0f172a', border: '1px solid #334155',
                            borderRadius: '8px', color: '#f8fafc',
                            appearance: 'none', cursor: 'pointer', outline: 'none'
                        }}
                    >
                        <option value="">كل الموظفين</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </div>

                <div style={{ position: 'relative', minWidth: '150px' }}>
                    <Filter size={18} style={{ position: 'absolute', right: '10px', top: '10px', color: '#94a3b8', pointerEvents: 'none' }} />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        style={{
                            width: '100%', padding: '0.7rem 2.5rem 0.7rem 1rem',
                            background: '#0f172a', border: '1px solid #334155',
                            borderRadius: '8px', color: '#f8fafc',
                            appearance: 'none', cursor: 'pointer', outline: 'none'
                        }}
                    >
                        <option value="">كل العمليات</option>
                        <option value="LOGIN">دخول</option>
                        <option value="NAVIGATE">تصفح</option>
                        <option value="ACTION">إجراء</option>
                    </select>
                </div>

                <div style={{ position: 'relative', minWidth: '150px' }}>
                    <Calendar size={18} style={{ position: 'absolute', right: '10px', top: '10px', color: '#94a3b8', pointerEvents: 'none' }} />
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        style={{
                            width: '100%', padding: '0.7rem 2.5rem 0.7rem 1rem',
                            background: '#0f172a', border: '1px solid #334155',
                            borderRadius: '8px', color: '#f8fafc', colorScheme: 'dark',
                            outline: 'none'
                        }}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', background: 'rgba(30, 41, 59, 0.3)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>جاري التحميل...</div>
                ) : logs.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <Clock size={48} style={{ opacity: 0.2 }} />
                        لا توجد سجلات مطابقة للفلاتر
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ position: 'sticky', top: 0, background: '#1e293b', zIndex: 10 }}>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <th style={{ padding: '1rem', textAlign: 'right', color: '#94a3b8' }}>الوقت</th>
                                <th style={{ padding: '1rem', textAlign: 'right', color: '#94a3b8' }}>الموظف</th>
                                <th style={{ padding: '1rem', textAlign: 'right', color: '#94a3b8' }}>نوع العملية</th>
                                <th style={{ padding: '1rem', textAlign: 'right', color: '#94a3b8' }}>التفاصيل</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s', ':hover': { background: 'rgba(255,255,255,0.02)' } }}>
                                    <td style={{ padding: '1rem', fontFamily: 'monospace', color: '#cbd5e1' }}>
                                        {new Date(log.created_at).toLocaleDateString()} <span style={{ color: '#64748b' }}>|</span> {formatTime(log.created_at)}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                {log.user?.name?.[0] || '?'}
                                            </div>
                                            {log.user?.name || 'مستخدم محذوف'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                                            padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem',
                                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)'
                                        }}>
                                            {getActionIcon(log.action_type)}
                                            {log.action_type === 'NAVIGATE' ? 'تصفح' :
                                                log.action_type === 'LOGIN' ? 'دخول' :
                                                    log.action_type === 'ACTION' ? 'إجراء' : log.action_type}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                                        {formatDetails(log)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ActivityLogsView;
