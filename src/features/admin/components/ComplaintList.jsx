import React, { useState, useEffect } from 'react';
import {
    Search, Filter, CheckCircle, XCircle, Clock,
    AlertTriangle, MoreVertical, Eye, FileText, PauseCircle, PlayCircle, User, Hash, Bell, Download, Share2
} from 'lucide-react';
import { ComplaintManager } from '../../../shared/utils/ComplaintManager';
import Modal from '../../../shared/components/Modal';
import ComplaintExportModal from './ComplaintExportModal';
import { useToast } from '../../../shared/components/Toast';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { supabase } from '../../../lib/supabase';

const ComplaintList = ({ user }) => {
    const { t } = useLanguage();
    const toast = useToast();

    // State
    const [complaints, setComplaints] = useState([]);
    const [types, setTypes] = useState([]);
    const [filteredComplaints, setFilteredComplaints] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterDate, setFilterDate] = useState('');

    // Modal State
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
    const [suspensionReason, setSuspensionReason] = useState('');
    const [complaintToSuspend, setComplaintToSuspend] = useState(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    // Closure Modal
    const [isClosureModalOpen, setIsClosureModalOpen] = useState(false);
    const [closureReason, setClosureReason] = useState('');
    const [complaintToClose, setComplaintToClose] = useState(null);

    // Reminder Logs Modal
    const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
    const [selectedReminderLogs, setSelectedReminderLogs] = useState([]);

    useEffect(() => {
        loadData();

        // Request Notification Permission
        if (Notification.permission !== 'granted') {
            Notification.requestPermission();
        }

        // Real-time Subscription
        const channel = supabase
            .channel('complaints-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, async (payload) => {
                console.log('Real-time Event:', payload);

                if (payload.eventType === 'INSERT') {
                    // Fetch full data with relations
                    const newComplaint = await ComplaintManager.getComplaintById(payload.new.id);
                    if (newComplaint) {
                        setComplaints(prev => [newComplaint, ...prev]);
                        toast.success(t('common.success'), 'تم استلام شكوى جديدة');

                        // Trigger Browser Notification
                        if (Notification.permission === 'granted') {
                            const agentName = newComplaint.agent?.name || 'موطف';
                            new Notification('شكوى جديدة', {
                                body: `تم رفع شكوى جديدة من قبل الموظف ${agentName}`,
                                icon: '/logo.png',
                            });
                            // Optional: Play a sound
                            const audio = new Audio('/notification.mp3');
                            audio.play().catch(e => console.log('Audio play failed:', e));
                        }
                    }
                } else if (payload.eventType === 'UPDATE') {
                    // Fetch full updated data
                    const updatedComplaint = await ComplaintManager.getComplaintById(payload.new.id);
                    if (updatedComplaint) {
                        setComplaints(prev => prev.map(c => c.id === payload.new.id ? updatedComplaint : c));
                    }
                } else if (payload.eventType === 'DELETE') {
                    setComplaints(prev => prev.filter(c => c.id !== payload.old.id));
                }
            })
            .subscribe((status) => {
                console.log('Realtime Subscription Status:', status);
                if (status === 'SUBSCRIBED') {
                    toast.success('تم الاتصال', 'تم تفعيل التحديث المباشر');
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        filterComplaints();
    }, [searchTerm, filterStatus, filterDate, complaints]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [allComplaints, allTypes] = await Promise.all([
                ComplaintManager.getAllComplaints(),
                ComplaintManager.getComplaintTypes()
            ]);

            // Sort by date desc
            const sorted = allComplaints.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setComplaints(sorted);
            setTypes(allTypes);
        } catch (error) {
            console.error(error);
            toast.error(t('common.error'), t('complaints.loadError'));
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to calculate duration
    const calculateDuration = (start, end) => {
        if (!start || !end) return '-';
        const startTime = new Date(start);
        const endTime = new Date(end);
        const diffMs = endTime - startTime;

        if (diffMs < 0) return '-';
        if (diffMs < 60000) return 'أقل من دقيقة';

        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHrs = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        let parts = [];
        if (diffDays > 0) parts.push(`${diffDays} يوم`);
        if (diffHrs > 0) parts.push(`${diffHrs} ساعة`);
        if (diffMins > 0) parts.push(`${diffMins} دقيقة`);

        return parts.join(' و ');
    };

    const filterComplaints = () => {
        let result = [...complaints];

        // Search
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(c =>
                c.customer_name?.toLowerCase().includes(lowerTerm) ||
                c.customer_number?.includes(lowerTerm) ||
                c.id?.toString().includes(lowerTerm)
            );
        }

        // Status Filter
        if (filterStatus === 'HighPriority') {
            result = result.filter(c => (c.reminder_count || 0) >= 4);
        } else if (filterStatus === 'MediumPriority') {
            result = result.filter(c => (c.reminder_count || 0) >= 2);
        } else if (filterStatus !== 'All') {
            result = result.filter(c => c.status === filterStatus);
        }

        // Date Filter
        if (filterDate) {
            result = result.filter(c => {
                const cDate = new Date(c.created_at).toISOString().split('T')[0];
                return cDate === filterDate;
            });
        }

        setFilteredComplaints(result);
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'Pending': return t('complaints.statuses.pending');
            case 'Processing': return t('complaints.statuses.processing');
            case 'Suspended': return t('complaints.statuses.suspended');
            case 'Resolved': return t('complaints.statuses.resolved');
            default: return status;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return '#fbbf24'; // Amber
            case 'Processing': return '#3b82f6'; // Blue
            case 'Suspended': return '#f97316'; // Orange
            case 'Resolved': return '#10b981'; // Emerald
            default: return '#94a3b8'; // Slate
        }
    };

    // Updated translation helper for new filters (assuming existing keys or fallback)
    const getFilterLabel = (status) => {
        if (status === 'HighPriority') return 'الأكثر أهمية (4+)';
        if (status === 'MediumPriority') return 'متوسطة الأهمية (2+)';
        return getStatusLabel(status);
    };

    const handleUpdateStatus = async (id, newStatus, reason = null) => {
        try {
            const updates = { status: newStatus };
            if (newStatus === 'Suspended' && reason) updates.suspension_reason = reason;
            if (newStatus === 'Resolved' && reason) {
                updates.closure_reason = reason;
                updates.resolved_at = new Date().toISOString(); // Set timestamp
            }

            // ... (user prop logic remains same)
            if (newStatus === 'Resolved') {
                if (user) {
                    updates.resolved_by = user.id;
                } else {
                    console.error('ComplaintList: No user prop provided');
                }
            }

            console.log('ComplaintList: Updating complaint with:', updates);
            await ComplaintManager.updateComplaint(id, updates);
            toast.success(t('common.success'), t('complaints.statusUpdateSuccess'));
            loadData();
        } catch (error) {
            console.error(error);
            toast.error(t('common.error'), t('complaints.updateError'));
        }
    };

    const initiateSuspension = (id) => {
        setComplaintToSuspend(id);
        setSuspensionReason('');
        setIsSuspendModalOpen(true);
    };

    const confirmSuspension = async () => {
        if (!suspensionReason.trim()) {
            toast.error(t('forms.alert'), t('forms.fillRequired'));
            return;
        }
        await handleUpdateStatus(complaintToSuspend, 'Suspended', suspensionReason);
        setIsSuspendModalOpen(false);
        setComplaintToSuspend(null);
    };

    const openDetails = (complaint) => {
        setSelectedComplaint(complaint);
        setIsDetailsOpen(true);
    };

    const handleShare = async (complaint) => {
        try {
            const lines = [];

            lines.push(`*${t('complaints.customerName')}:* ${complaint.customer_name}`);
            lines.push(`*${t('complaints.customerPhone')}:* ${complaint.customer_number}`);
            lines.push(`*${t('complaints.type')}:* ${complaint.type?.name || '-'}`);

            // Dynamic Fields
            if (complaint.form_data) {
                Object.entries(complaint.form_data).forEach(([key, value]) => {
                    if (key === 'notes' || !value) return;
                    const fieldDef = complaint.type?.fields?.find(f => f.id.toString() === key.toString());
                    const label = fieldDef ? fieldDef.label : t('complaints.details');
                    lines.push(`*${label}:* ${value}`);
                });
            }

            if (complaint.notes) {
                lines.push(`*${t('complaints.notes')}:* ${complaint.notes}`);
            }

            const text = lines.join('\n');
            await navigator.clipboard.writeText(text);
            toast.success(t('common.copied'), t('complaints.shareSuccess'));
        } catch (err) {
            console.error('Share error', err);
            toast.error(t('common.error'), t('complaints.shareError'));
        }
    };


    return (
        <div style={{ padding: '1.5rem', color: '#e2e8f0', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* ... (Header) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{t('sidebar.complaintsManage')}</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => setIsExportModalOpen(true)}
                        style={{
                            background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6',
                            color: '#60a5fa', cursor: 'pointer', padding: '0.6rem 1.2rem',
                            borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem',
                            fontWeight: '600'
                        }}
                    >
                        <Download size={18} />
                        تصدير Excel
                    </button>
                    <button onClick={loadData} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer' }}>{t('forms.reset')}</button>
                </div>
            </div>

            {/* Filters */}
            <div style={{
                display: 'flex', gap: '1rem', marginBottom: '1.5rem',
                background: 'rgba(30, 41, 59, 0.5)', padding: '1rem', borderRadius: '12px',
                flexWrap: 'wrap'
            }}>
                {/* ... (Search and Date inputs remain same, skipping to buttons) */}
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <Search size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder={t('common.search')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%', padding: '0.6rem 2.5rem 0.6rem 1rem',
                            background: 'rgba(15, 23, 42, 0.5)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px', color: 'white'
                        }}
                    />
                </div>

                <div style={{ position: 'relative' }}>
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        style={{
                            padding: '0.6rem 1rem',
                            background: 'rgba(15, 23, 42, 0.5)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: 'white',
                            colorScheme: 'dark'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Filter size={18} color="#94a3b8" />
                    {['All', 'HighPriority', 'MediumPriority', 'Pending', 'Processing', 'Suspended', 'Resolved'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            style={{
                                padding: '0.4rem 0.8rem',
                                borderRadius: '6px',
                                border: '1px solid',
                                borderColor: filterStatus === status ? '#3b82f6' : 'transparent',
                                background: filterStatus === status ? `rgba(59, 130, 246, 0.2)` : 'rgba(255,255,255,0.05)',
                                color: filterStatus === status ? '#60a5fa' : '#94a3b8',
                                cursor: 'pointer',
                                fontSize: '0.85rem'
                            }}
                        >
                            {status === 'All' ? t('forms.select') : getFilterLabel(status)}
                        </button>
                    ))}
                </div>
            </div>

            {/* ... (Table remains mostly same) */}
            <div style={{ flex: 1, overflow: 'auto', background: 'rgba(30, 41, 59, 0.3)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
                    {/* ... (Thread) */}
                    <thead style={{ background: 'rgba(15, 23, 42, 0.5)', position: 'sticky', top: 0 }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>{t('التذكيرات')}</th>
                            <th style={{ padding: '1rem', textAlign: 'right', color: '#94a3b8', fontSize: '0.85rem' }}>{t('complaints.customerName')}</th>
                            <th style={{ padding: '1rem', textAlign: 'right', color: '#94a3b8', fontSize: '0.85rem' }}>{t('complaints.type')}</th>
                            <th style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>تاريخ الرفع</th>
                            <th style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>الموظف (مقدم الطلب)</th>
                            <th style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>تاريخ الإغلاق</th>
                            <th style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>بواسطة (المغلق)</th>
                            <th style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>المدة</th>
                            <th style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>{t('complaints.status')}</th>
                            <th style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>{t('complaints.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan="10" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>{t('common.loading')}</td></tr>
                        ) : filteredComplaints.length === 0 ? (
                            <tr><td colSpan="10" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>{t('complaints.noComplaintsFound') || t('common.search')}...</td></tr>
                        ) : (
                            filteredComplaints.map(complaint => {
                                // ... (Priority Logic same)
                                const reminderCount = complaint.reminder_count || 0;
                                let rowStyle = { borderBottom: '1px solid rgba(255, 255, 255, 0.05)', transition: 'background 0.2s' };

                                if (reminderCount >= 4) {
                                    rowStyle = { ...rowStyle, background: 'rgba(239, 68, 68, 0.15)', borderLeft: '3px solid #ef4444' };
                                } else if (reminderCount >= 2) {
                                    rowStyle = { ...rowStyle, background: 'rgba(234, 179, 8, 0.15)', borderLeft: '3px solid #eab308' };
                                }

                                return (
                                    <tr key={complaint.id} style={rowStyle}>
                                        {/* ... (Cells) */}
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <button
                                                onClick={() => {
                                                    setSelectedReminderLogs(complaint.reminder_logs || []);
                                                    setIsReminderModalOpen(true);
                                                }}
                                                style={{
                                                    background: 'transparent', border: 'none', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                                    color: reminderCount > 0 ? (reminderCount >= 4 ? '#ef4444' : '#eab308') : '#94a3b8'
                                                }}
                                                title="سجل التذكيرات"
                                            >
                                                <Bell size={18} fill={reminderCount > 0 ? "currentColor" : "none"} />
                                                <span style={{ fontWeight: 'bold' }}>{reminderCount}</span>
                                            </button>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: '600' }}>{complaint.customer_name}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{complaint.customer_number}</div>
                                        </td>
                                        <td style={{ padding: '1rem', color: '#cbd5e1' }}>
                                            {complaint.type?.name || t('forms.optional')}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', direction: 'ltr' }}>
                                            {new Date(complaint.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                                                {new Date(complaint.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', color: '#6be7ff', fontWeight: '500' }}>
                                            {complaint.agent?.name || 'Unknown'}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', direction: 'ltr' }}>
                                            {complaint.resolved_at ? (
                                                <>
                                                    {new Date(complaint.resolved_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                                                        {new Date(complaint.resolved_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                    </div>
                                                </>
                                            ) : '-'}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', color: '#e2e8f0', fontSize: '0.9rem' }} title={`Resolved By ID: ${complaint.resolved_by}, Resolver Obj: ${JSON.stringify(complaint.resolver)}`}>
                                            {complaint.resolver?.name || (complaint.resolved_by ? 'User ID: ' + complaint.resolved_by.slice(0, 5) : '-')}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', color: '#fbbf24', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                            {calculateDuration(complaint.created_at, complaint.resolved_at)}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '4px 10px', borderRadius: '12px',
                                                background: `${getStatusColor(complaint.status)}20`,
                                                color: getStatusColor(complaint.status),
                                                fontSize: '0.8rem', fontWeight: '600'
                                            }}>
                                                {getStatusLabel(complaint.status)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => openDetails(complaint)}
                                                    style={{ padding: '6px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}
                                                    title={t('complaints.details')}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleShare(complaint)}
                                                    style={{ padding: '6px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.1)', border: 'none', color: '#3b82f6', cursor: 'pointer' }}
                                                    title="نسخ للمشاركة"
                                                >
                                                    <Share2 size={16} />
                                                </button>
                                                {complaint.status === 'Pending' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(complaint.id, 'Processing')}
                                                        style={{ padding: '6px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.1)', border: 'none', color: '#60a5fa', cursor: 'pointer' }}
                                                        title={t('complaints.statuses.processing')}
                                                    >
                                                        <PlayCircle size={16} />
                                                    </button>
                                                )}

                                                {(complaint.status === 'Processing' || complaint.status === 'Pending') && (
                                                    <>
                                                        <button
                                                            onClick={() => initiateSuspension(complaint.id)}
                                                            style={{ padding: '6px', borderRadius: '4px', background: 'rgba(249, 115, 22, 0.1)', border: 'none', color: '#fb923c', cursor: 'pointer' }}
                                                            title={t('complaints.statuses.suspended')}
                                                        >
                                                            <PauseCircle size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setComplaintToClose(complaint.id);
                                                                setClosureReason('');
                                                                setIsClosureModalOpen(true);
                                                            }}
                                                            style={{ padding: '6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.1)', border: 'none', color: '#34d399', cursor: 'pointer' }}
                                                            title={t('complaints.statuses.resolved')}
                                                        >
                                                            <CheckCircle size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Details Modal */}
            {isDetailsOpen && selectedComplaint && (
                <Modal isOpen={true} onClose={() => setIsDetailsOpen(false)} title={`${t('complaints.id')} #${selectedComplaint.id.slice(0, 8)}`} size="xl">
                    <div style={{ width: '100%', padding: '1rem' }}>

                        {/* Status Banner */}
                        <div style={{
                            marginBottom: '2rem',
                            padding: '1.5rem',
                            background: `linear-gradient(to right, ${getStatusColor(selectedComplaint.status)}15, transparent)`,
                            border: `1px solid ${getStatusColor(selectedComplaint.status)}30`,
                            borderRadius: '12px',
                            display: 'flex', alignItems: 'center', gap: '1rem'
                        }}>
                            <div style={{
                                padding: '0.8rem',
                                borderRadius: '50%',
                                background: `${getStatusColor(selectedComplaint.status)}20`,
                                color: getStatusColor(selectedComplaint.status)
                            }}>
                                {selectedComplaint.status === 'Resolved' ? <CheckCircle size={24} /> :
                                    selectedComplaint.status === 'Suspended' ? <PauseCircle size={24} /> :
                                        selectedComplaint.status === 'Processing' ? <PlayCircle size={24} /> :
                                            <Clock size={24} />}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: getStatusColor(selectedComplaint.status), marginBottom: '0.5rem' }}>
                                    {getStatusLabel(selectedComplaint.status)}
                                </h3>
                                {/* Extended Timing Info */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                                    <div>
                                        <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem' }}>تاريخ الرفع:</span>
                                        {new Date(selectedComplaint.created_at).toLocaleString('ar-EG')}
                                    </div>
                                    {selectedComplaint.resolved_at && (
                                        <>
                                            <div>
                                                <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem' }}>تاريخ الإغلاق:</span>
                                                {new Date(selectedComplaint.resolved_at).toLocaleString('ar-EG')}
                                            </div>
                                            <div>
                                                <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem' }}>المدة المستغرقة:</span>
                                                <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>
                                                    {calculateDuration(selectedComplaint.created_at, selectedComplaint.resolved_at)}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {selectedComplaint.status === 'Resolved' && (
                            <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', color: '#10b981' }}>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <strong>{t('complaints.closedBy')}:</strong> {selectedComplaint.resolver?.name || 'Unknown'}
                                </div>
                                <div>
                                    <strong>{t('complaints.closureReason')}:</strong> {selectedComplaint.closure_reason || '-'}
                                </div>
                            </div>
                        )}

                        {selectedComplaint.status === 'Suspended' && (
                            <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#fca5a5' }}>
                                <strong>{t('complaints.suspensionReason')}:</strong> {selectedComplaint.suspension_reason}
                            </div>
                        )}

                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                            {t('complaints.details')}
                        </h3>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: '1.5rem',
                            marginBottom: '2rem'
                        }}>
                            {/* Static Fields Card */}
                            <div style={{
                                background: 'rgba(30, 41, 59, 0.4)',
                                borderRadius: '16px',
                                padding: '1.5rem',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                display: 'flex', flexDirection: 'column', gap: '1.2rem'
                            }}>
                                <h4 style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.8rem', marginBottom: '0.5rem' }}>
                                    {t('complaints.basicInfo')}
                                </h4>

                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.4rem' }}>
                                        <FileText size={14} /> {t('complaints.type')}
                                    </label>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fbbf24' }}>{selectedComplaint.type?.name}</div>
                                </div>

                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.4rem' }}>
                                        <User size={14} /> {t('complaints.customerName')}
                                    </label>
                                    <div style={{ fontSize: '1rem', color: '#e2e8f0' }}>{selectedComplaint.customer_name}</div>
                                </div>

                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.4rem' }}>
                                        <Hash size={14} /> {t('complaints.customerPhone')}
                                    </label>
                                    <div style={{ fontSize: '1rem', color: '#e2e8f0', fontFamily: 'monospace' }}>{selectedComplaint.customer_number}</div>
                                </div>

                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.4rem' }}>
                                        <Bell size={14} /> {t('complaints.priority')}
                                    </label>
                                    <div style={{ fontSize: '1rem', color: selectedComplaint.reminder_count > 0 ? '#fbbf24' : '#e2e8f0' }}>
                                        {selectedComplaint.reminder_count || 0}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.4rem' }}>
                                        <User size={14} /> {t('complaints.raisedBy')}
                                    </label>
                                    <div style={{ fontSize: '1rem', color: '#6be7ff' }}>{selectedComplaint.agent?.name || 'Unknown'}</div>
                                </div>
                            </div>

                            {/* Dynamic Fields Card */}
                            <div style={{
                                background: 'rgba(30, 41, 59, 0.4)',
                                borderRadius: '16px',
                                padding: '1.5rem',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                display: 'flex', flexDirection: 'column', gap: '1rem'
                            }}>
                                <h4 style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.8rem', marginBottom: '0.5rem' }}>
                                    {t('complaints.description')}
                                </h4>

                                {Object.keys(selectedComplaint.form_data || {}).length === 0 ? (
                                    <div style={{ color: '#64748b', fontStyle: 'italic' }}>No details</div>
                                ) : (
                                    Object.entries(selectedComplaint.form_data || {}).map(([key, value]) => {
                                        // Find field label
                                        const fields = selectedComplaint.type?.fields || [];
                                        const fieldDef = fields.find(f => f.id.toString() === key.toString());
                                        const label = fieldDef ? fieldDef.label : (fields.length === 0 ? 'Loading...' : t('complaints.details'));

                                        return (
                                            <div key={key}>
                                                <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.4rem' }}>
                                                    {label}
                                                </label>
                                                <div style={{
                                                    fontSize: '0.95rem', color: '#f1f5f9',
                                                    background: 'rgba(0, 0, 0, 0.2)', padding: '0.8rem', borderRadius: '8px',
                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                    whiteSpace: 'pre-wrap', lineHeight: '1.5'
                                                }}>
                                                    {String(value)}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>


                        {/* Notes Card */}
                        {selectedComplaint.notes && (
                            <div style={{
                                marginBottom: '2rem',
                                background: 'rgba(30, 41, 59, 0.4)',
                                borderRadius: '16px',
                                padding: '1.5rem',
                                border: '1px solid rgba(255, 255, 255, 0.05)'
                            }}>
                                <h4 style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.8rem', marginBottom: '0.5rem' }}>
                                    {t('complaints.agentNotes')}
                                </h4>
                                <div style={{
                                    fontSize: '0.95rem', color: '#f1f5f9',
                                    whiteSpace: 'pre-wrap', lineHeight: '1.6'
                                }}>
                                    {selectedComplaint.notes}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                            {selectedComplaint.status !== 'Resolved' && (
                                <>
                                    <button
                                        onClick={() => { setIsDetailsOpen(false); initiateSuspension(selectedComplaint.id); }}
                                        style={{ padding: '0.6rem 1rem', background: 'rgba(249, 115, 22, 0.1)', border: 'none', borderRadius: '6px', color: '#fb923c', cursor: 'pointer' }}
                                    >
                                        {t('complaints.statuses.suspended')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            // Handle Resolve from Details Modal
                                            setComplaintToClose(selectedComplaint.id);
                                            setClosureReason('');
                                            setIsDetailsOpen(false);
                                            setIsClosureModalOpen(true);
                                        }}
                                        style={{ padding: '0.6rem 1rem', background: '#10b981', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer' }}
                                    >
                                        {t('complaints.statuses.resolved')}
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => setIsDetailsOpen(false)}
                                style={{ padding: '0.6rem 1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#cbd5e1', cursor: 'pointer' }}
                            >
                                {t('forms.close')}
                            </button>
                        </div>
                    </div>
                </Modal >
            )}

            {/* Suspension Modal */}
            {isSuspendModalOpen && (
                <Modal isOpen={true} onClose={() => setIsSuspendModalOpen(false)} title={t('complaints.statuses.suspended')}>
                    <div style={{ minWidth: '400px' }}>
                        <p style={{ color: '#cbd5e1', marginBottom: '1rem' }}>{t('complaints.suspensionPrompt')}</p>
                        <textarea
                            value={suspensionReason}
                            onChange={(e) => setSuspensionReason(e.target.value)}
                            placeholder={t('complaints.suspensionPlaceholder')}
                            style={{
                                width: '100%', height: '100px', padding: '0.8rem',
                                background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px', color: 'white', marginBottom: '1.5rem', resize: 'none'
                            }}
                            autoFocus
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button
                                onClick={() => setIsSuspendModalOpen(false)}
                                style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#94a3b8', cursor: 'pointer' }}
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={confirmSuspension}
                                style={{ padding: '0.6rem 1.2rem', background: '#ef4444', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer' }}
                            >
                                {t('complaints.confirmSuspension')}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Closure Modal */}
            {isClosureModalOpen && (
                <Modal isOpen={true} onClose={() => setIsClosureModalOpen(false)} title={t('complaints.closeConfirm')}>
                    <div style={{ minWidth: '400px' }}>
                        <p style={{ color: '#cbd5e1', marginBottom: '1rem' }}>{t('complaints.closureReasonPlaceholder')}</p>
                        <textarea
                            value={closureReason}
                            onChange={(e) => setClosureReason(e.target.value)}
                            placeholder={t('complaints.closureReason')}
                            style={{
                                width: '100%', height: '100px', padding: '0.8rem',
                                background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px', color: 'white', marginBottom: '1.5rem', resize: 'none'
                            }}
                            autoFocus
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button
                                onClick={() => setIsClosureModalOpen(false)}
                                style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#94a3b8', cursor: 'pointer' }}
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={async () => {
                                    if (!closureReason.trim()) {
                                        toast.error(t('forms.alert'), t('forms.fillRequired'));
                                        return;
                                    }
                                    await handleUpdateStatus(complaintToClose, 'Resolved', closureReason);
                                    setIsClosureModalOpen(false);
                                    setComplaintToClose(null);
                                }}
                                style={{ padding: '0.6rem 1.2rem', background: '#10b981', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer' }}
                            >
                                {t('complaints.closeConfirm')}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Reminder Logs Modal */}
            {isReminderModalOpen && (
                <Modal isOpen={true} onClose={() => setIsReminderModalOpen(false)} title="سجل التذكيرات">
                    <div style={{ minWidth: '400px', maxHeight: '50vh', overflowY: 'auto' }}>
                        {selectedReminderLogs.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                لا توجد تذكيرات مسجلة لهذه الشكوى
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {selectedReminderLogs.map((log, idx) => (
                                    <div key={idx} style={{
                                        padding: '0.8rem',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '8px',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <User size={16} color="#60a5fa" />
                                            <span style={{ color: '#e2e8f0', fontWeight: '600' }}>{log.agent_name}</span>
                                        </div>
                                        <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                                            {new Date(log.timestamp).toLocaleString('ar-EG')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                            <button
                                onClick={() => setIsReminderModalOpen(false)}
                                style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#94a3b8', cursor: 'pointer' }}
                            >
                                {t('forms.close')}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
            <ComplaintExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                complaints={complaints}
                types={types}
            />
        </div >
    );
};

export default ComplaintList;
