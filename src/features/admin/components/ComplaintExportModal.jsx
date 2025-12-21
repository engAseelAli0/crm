import React, { useState, useEffect } from 'react';
import { Download, X, Calendar, User, Filter, FileText } from 'lucide-react';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { ReportGenerator } from '../../../shared/utils/ReportGenerator';
import { useToast } from '../../../shared/components/Toast';

const ComplaintExportModal = ({ isOpen, onClose, complaints, types }) => {
    const { t } = useLanguage();
    const toast = useToast();

    // Filter States
    const [selectedAgent, setSelectedAgent] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Derived Lists
    const [agents, setAgents] = useState([]);

    useEffect(() => {
        if (complaints && complaints.length > 0) {
            // Extract unique agents
            const uniqueAgents = [];
            const map = new Map();
            complaints.forEach(c => {
                if (c.agent && !map.has(c.agent_id)) {
                    map.set(c.agent_id, true);
                    uniqueAgents.push({ id: c.agent_id, name: c.agent.name });
                }
            });
            setAgents(uniqueAgents);
        }
    }, [complaints]);

    const handleExport = () => {
        try {
            // 1. Filter Data
            let filtered = [...complaints];

            if (selectedAgent) {
                filtered = filtered.filter(c => c.agent_id === selectedAgent);
            }
            if (selectedType) {
                filtered = filtered.filter(c => c.type_id === selectedType);
            }
            if (selectedStatus) {
                filtered = filtered.filter(c => c.status === selectedStatus);
            }
            if (dateFrom) {
                filtered = filtered.filter(c => new Date(c.created_at) >= new Date(dateFrom));
            }
            if (dateTo) {
                // Add one day to include the end date fully
                const nextDay = new Date(dateTo);
                nextDay.setDate(nextDay.getDate() + 1);
                filtered = filtered.filter(c => new Date(c.created_at) < nextDay);
            }

            if (filtered.length === 0) {
                toast.error(t('common.error'), t('complaints.noComplaintsFound'));
                return;
            }

            // 2. Prepare Columns
            const columns = [
                { label: t('complaints.id'), key: 'id' },
                { label: t('complaints.customerName'), key: 'customer_name' },
                { label: t('complaints.customerPhone'), key: 'customer_number' },
                { label: t('complaints.type'), key: 'type_name' },
                { label: t('complaints.raisedBy'), key: 'agent_name' },
                { label: t('complaints.status'), key: 'status_label' },
                { label: 'تاريخ الرفع', key: 'created_date' },
                { label: 'وقت الرفع', key: 'created_time' },
                { label: 'تاريخ الإغلاق', key: 'closed_date' },
                { label: 'المدة', key: 'duration' },
                { label: t('complaints.closureReason'), key: 'closure_reason' },
                { label: t('complaints.closedBy'), key: 'resolver_name' },
                { label: t('complaints.notes'), key: 'notes' }
            ];

            // 3. Flatten Data
            const exportData = filtered.map(c => ({
                id: c.id.slice(0, 8),
                customer_name: c.customer_name,
                customer_number: c.customer_number,
                type_name: c.type?.name || '-',
                agent_name: c.agent?.name || '-',
                status_label: c.status, // Should confirm if translation is needed here or raw status
                created_date: new Date(c.created_at).toLocaleDateString('ar-EG'),
                created_time: new Date(c.created_at).toLocaleTimeString('ar-EG'),
                closed_date: c.resolved_at ? new Date(c.resolved_at).toLocaleString('ar-EG') : '-',
                duration: calculateDuration(c.created_at, c.resolved_at),
                closure_reason: c.closure_reason || '-',
                resolver_name: c.resolver?.name || '-',
                notes: c.notes || '-'
            }));

            // 4. Generate Excel
            ReportGenerator.exportToExcel(exportData, columns, `Complaints_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
            toast.success(t('common.success'), 'تم تحميل التقرير بنجاح');
            onClose();

        } catch (error) {
            console.error(error);
            toast.error(t('common.error'), 'فشل تصدير التقرير');
        }
    };

    // Helper for duration (reused logic)
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

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, animation: 'fadeIn 0.2s ease-out'
        }}>
            <div style={{
                backgroundColor: '#1e293b',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                width: '100%', maxWidth: '600px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                margin: '1rem',
                display: 'flex', flexDirection: 'column', maxHeight: '90vh'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={20} color="#60a5fa" />
                        تصدير تقرير الشكاوى
                    </h3>
                    <button
                        onClick={onClose}
                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '2rem', overflowY: 'auto' }}>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        {/* Agent Filter */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.9rem' }}>
                                <User size={14} style={{ display: 'inline', marginInlineEnd: '4px' }} />
                                {t('complaints.raisedBy')}
                            </label>
                            <select
                                value={selectedAgent}
                                onChange={(e) => setSelectedAgent(e.target.value)}
                                style={{
                                    width: '100%', padding: '0.7rem',
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px', color: 'white'
                                }}
                            >
                                <option value="">{t('جميع الشكاوي')}</option>
                                {agents.map(agent => (
                                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Type Filter */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.9rem' }}>
                                <Filter size={14} style={{ display: 'inline', marginInlineEnd: '4px' }} />
                                {t('complaints.type')}
                            </label>
                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                style={{
                                    width: '100%', padding: '0.7rem',
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px', color: 'white'
                                }}
                            >
                                <option value="">{t('جميع الشكاوي')}</option>
                                {types.map(type => (
                                    <option key={type.id} value={type.id}>{type.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.9rem' }}>
                            {t('complaints.status')}
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {['Pending', 'Processing', 'Suspended', 'Resolved'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setSelectedStatus(prev => prev === status ? '' : status)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '8px',
                                        border: '1px solid',
                                        borderColor: selectedStatus === status ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                                        background: selectedStatus === status ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                                        color: selectedStatus === status ? '#60a5fa' : '#94a3b8',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    {status === 'Pending' ? t('complaints.statuses.pending') :
                                        status === 'Processing' ? t('complaints.statuses.processing') :
                                            status === 'Suspended' ? t('complaints.statuses.suspended') :
                                                status === 'Resolved' ? t('complaints.statuses.resolved') : status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date Range */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.9rem' }}>
                                <Calendar size={14} style={{ display: 'inline', marginInlineEnd: '4px' }} />
                                من تاريخ
                            </label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                style={{
                                    width: '100%', padding: '0.7rem',
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px', color: 'white',
                                    colorScheme: 'dark'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.9rem' }}>
                                <Calendar size={14} style={{ display: 'inline', marginInlineEnd: '4px' }} />
                                إلى تاريخ
                            </label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                style={{
                                    width: '100%', padding: '0.7rem',
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px', color: 'white',
                                    colorScheme: 'dark'
                                }}
                            />
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div style={{
                    padding: '1.5rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex', justifyContent: 'flex-end', gap: '1rem'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.8rem 1.5rem',
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={handleExport}
                        style={{
                            padding: '0.8rem 2rem',
                            background: '#10b981', // Changed to Green for Excel
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: '600',
                            display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}
                    >
                        <Download size={18} />
                        تحميل ملف Excel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ComplaintExportModal;
