import React, { useState, useEffect } from 'react';
import {
    Search, Filter, CheckCircle, XCircle, Clock,
    AlertTriangle, MoreVertical, Eye, FileText, PauseCircle, PlayCircle, User, Hash, Bell
} from 'lucide-react';
import { ComplaintManager } from '../../../shared/utils/ComplaintManager';
import Modal from '../../../shared/components/Modal';
import { useToast } from '../../../shared/components/Toast';
import { useLanguage } from '../../../shared/context/LanguageContext';

const ComplaintList = () => {
    const { t } = useLanguage();
    const toast = useToast();

    // State
    const [complaints, setComplaints] = useState([]);
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

    useEffect(() => {
        loadComplaints();
    }, []);

    useEffect(() => {
        filterComplaints();
    }, [searchTerm, filterStatus, filterDate, complaints]);

    const loadComplaints = async () => {
        setIsLoading(true);
        try {
            // Admin usually sees ALL complaints
            const allComplaints = await ComplaintManager.getAllComplaints();
            // Sort by date desc
            const sorted = allComplaints.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setComplaints(sorted);
        } catch (error) {
            console.error(error);
            toast.error(t('common.error'), t('complaints.loadError') || 'Failed to load complaints');
        } finally {
            setIsLoading(false);
        }
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
        if (filterStatus !== 'All') {
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

    const handleUpdateStatus = async (id, newStatus, reason = null) => {
        try {
            const updates = { status: newStatus };
            if (reason) updates.suspension_reason = reason;

            await ComplaintManager.updateComplaint(id, updates);
            toast.success(t('common.success'), t('complaints.statusUpdateSuccess') || 'Status updated');
            loadComplaints();
        } catch (error) {
            toast.error(t('common.error'), t('complaints.updateError') || 'Failed to update status');
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

    return (
        <div style={{ padding: '1.5rem', color: '#e2e8f0', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{t('sidebar.complaintsManage')}</h2>

                <button onClick={loadComplaints} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer' }}>{t('forms.reset')}</button>
            </div>

            {/* Filters */}
            <div style={{
                display: 'flex', gap: '1rem', marginBottom: '1.5rem',
                background: 'rgba(30, 41, 59, 0.5)', padding: '1rem', borderRadius: '12px',
                flexWrap: 'wrap'
            }}>
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

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Filter size={18} color="#94a3b8" />
                    {['All', 'Pending', 'Processing', 'Suspended', 'Resolved'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            style={{
                                padding: '0.4rem 0.8rem',
                                borderRadius: '6px',
                                border: '1px solid',
                                borderColor: filterStatus === status ? getStatusColor(status) : 'transparent',
                                background: filterStatus === status ? `${getStatusColor(status)}20` : 'rgba(255,255,255,0.05)',
                                color: filterStatus === status ? getStatusColor(status) : '#94a3b8',
                                cursor: 'pointer',
                                fontSize: '0.85rem'
                            }}
                        >
                            {status === 'All' ? t('forms.select') : getStatusLabel(status)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div style={{ flex: 1, overflow: 'auto', background: 'rgba(30, 41, 59, 0.3)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'rgba(15, 23, 42, 0.5)', position: 'sticky', top: 0 }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'right', color: '#94a3b8', fontSize: '0.85rem' }}>{t('complaints.id')}</th>
                            <th style={{ padding: '1rem', textAlign: 'right', color: '#94a3b8', fontSize: '0.85rem' }}>{t('complaints.customerName')}</th>
                            <th style={{ padding: '1rem', textAlign: 'right', color: '#94a3b8', fontSize: '0.85rem' }}>{t('complaints.type')}</th>
                            <th style={{ padding: '1rem', textAlign: 'right', color: '#94a3b8', fontSize: '0.85rem' }}>{t('complaints.date')}</th>
                            <th style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>{t('complaints.status')}</th>
                            <th style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>{t('complaints.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>{t('common.loading')}</td></tr>
                        ) : filteredComplaints.length === 0 ? (
                            <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>{t('complaints.noComplaintsFound') || t('common.search')}...</td></tr>
                        ) : (
                            filteredComplaints.map(complaint => {
                                // Priority Logic
                                const reminderCount = complaint.reminder_count || 0;
                                let rowStyle = { borderBottom: '1px solid rgba(255, 255, 255, 0.05)', transition: 'background 0.2s' };
                                let priorityBadge = null;

                                if (reminderCount >= 4) {
                                    rowStyle = { ...rowStyle, background: 'rgba(239, 68, 68, 0.15)', borderLeft: '3px solid #ef4444' };
                                    priorityBadge = <span style={{ fontSize: '0.75rem', background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}><Bell size={10} fill="currentColor" /> {reminderCount}</span>;
                                } else if (reminderCount >= 2) {
                                    rowStyle = { ...rowStyle, background: 'rgba(234, 179, 8, 0.15)', borderLeft: '3px solid #eab308' };
                                    priorityBadge = <span style={{ fontSize: '0.75rem', background: '#eab308', color: 'black', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}><Bell size={10} fill="currentColor" /> {reminderCount}</span>;
                                }

                                return (
                                    <tr key={complaint.id} style={rowStyle}>
                                        <td style={{ padding: '1rem', fontSize: '0.9rem', fontFamily: 'monospace' }}>
                                            #{complaint.id.slice(0, 8)}
                                            {priorityBadge}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: '600' }}>{complaint.customer_name}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{complaint.customer_number}</div>
                                        </td>
                                        <td style={{ padding: '1rem', color: '#cbd5e1' }}>
                                            {complaint.type?.name || t('forms.optional')}
                                        </td>
                                        <td style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                                            {new Date(complaint.created_at).toLocaleDateString()}
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
                                                {/* Actions */}
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
                                                            onClick={() => handleUpdateStatus(complaint.id, 'Resolved')}
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
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: getStatusColor(selectedComplaint.status), marginBottom: '0.2rem' }}>
                                    {getStatusLabel(selectedComplaint.status)}
                                </h3>
                                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                                    {t('complaints.date')}: {new Date(selectedComplaint.created_at).toLocaleString()}
                                </p>
                            </div>
                        </div>

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
                                        onClick={() => { handleUpdateStatus(selectedComplaint.id, 'Resolved'); setIsDetailsOpen(false); }}
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
            {
                isSuspendModalOpen && (
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
                )
            }
        </div >
    );
};

export default ComplaintList;
