import React, { useState, useEffect } from 'react';
import { Send, FileText, AlertCircle, CheckCircle, List, Clock, RotateCcw, Bell, Power, Search, Calendar, Eye, Share2 } from 'lucide-react';
import { ComplaintManager } from '../../../shared/utils/ComplaintManager';
import { useToast } from '../../../shared/components/Toast';
import Modal from '../../../shared/components/Modal';
import { useLanguage } from '../../../shared/context/LanguageContext';

const ComplaintSubmission = ({ user }) => {
    const { t } = useLanguage();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('new'); // 'new' or 'history'

    // Form State
    const [types, setTypes] = useState([]);
    const [isLoadingTypes, setIsLoadingTypes] = useState(true);
    const [customerName, setCustomerName] = useState('');
    const [customerNumber, setCustomerNumber] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [dynamicData, setDynamicData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittedId, setSubmittedId] = useState(null);

    // History State
    const [myComplaints, setMyComplaints] = useState([]);
    const [filteredComplaints, setFilteredComplaints] = useState([]); // Filtered list for display
    const [searchTerm, setSearchTerm] = useState('');
    // Default filter date to today (YYYY-MM-DD)
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Details Modal
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    useEffect(() => {
        loadTypes();
        if (activeTab === 'history') {
            loadHistory();
        }
    }, [activeTab]);

    // Filtering Effect
    useEffect(() => {
        let result = myComplaints;

        // 1. Filter by Date
        if (filterDate) {
            result = result.filter(c => {
                const complaintDate = new Date(c.created_at).toLocaleDateString('en-CA');
                return complaintDate === filterDate;
            });
        }

        // 2. Filter by Search Term
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(c =>
                c.customer_name?.toLowerCase().includes(lower) ||
                c.customer_number?.toLowerCase().includes(lower) ||
                c.id?.toLowerCase().includes(lower)
            );
        }

        setFilteredComplaints(result);
    }, [searchTerm, filterDate, myComplaints]);

    const loadTypes = async () => {
        try {
            const data = await ComplaintManager.getComplaintTypes();
            setTypes(data);
        } catch (error) {
            console.error("Error loading types", error);
        } finally {
            setIsLoadingTypes(false);
        }
    };

    const loadHistory = async () => {
        setIsLoadingHistory(true);
        try {
            // Updated to fetch ALL complaints
            const data = await ComplaintManager.getAllComplaints();
            setMyComplaints(data);
        } catch (error) {
            console.error("Error loading history", error);
            toast.error('خطأ', 'فشل تحميل سجل الشكاوى');
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleTypeChange = (e) => {
        setSelectedType(e.target.value);
        setDynamicData({});
    };

    const handleDynamicChange = (fieldId, value) => {
        setDynamicData(prev => ({
            ...prev,
            [fieldId]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!customerName || !customerNumber || !selectedType) {
            toast.error(t('common.alert'), t('forms.fillRequired'));
            return;
        }

        const typeConfig = types.find(t => t.id === selectedType);
        if (!typeConfig) return;

        for (const field of typeConfig.fields || []) {
            if (field.required && !dynamicData[field.id]) {
                toast.error(t('common.alert'), `${t('forms.required')}: ${field.label}`);
                return;
            }
        }

        setIsSubmitting(true);
        try {
            const submission = {
                customer_name: customerName,
                customer_number: customerNumber,
                type_id: selectedType,
                form_data: dynamicData,
                // Separate notes from form_data if needed, but schema might vary.
                // Keeping consistent with previous logic.
                notes: dynamicData['notes'] || '',
                agent_id: user.id,
                status: 'Pending'
            };

            const result = await ComplaintManager.submitComplaint(submission);

            setSubmittedId(result.id);
            toast.success(t('common.success'), t('complaints.submitSuccess'));

            // Reset form
            setCustomerName('');
            setCustomerNumber('');
            setSelectedType('');
            setDynamicData({});

            // Auto hide success message
            setTimeout(() => setSubmittedId(null), 3000);

        } catch (error) {
            console.error("Submission error", error);
            toast.error(t('common.error'), t('complaints.submitError'));
        } finally {
            setIsSubmitting(false);
        }
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
            case 'Pending': return '#f59e0b';
            case 'Processing': return '#3b82f6';
            case 'Suspended': return '#ef4444';
            case 'Resolved': return '#10b981';
            default: return '#94a3b8';
        }
    };

    // Find the currently selected type object
    const activeTypeConfig = types.find(t => t.id === selectedType);

    if (submittedId) {
        return (
            <div style={{
                height: '100%', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', color: '#10b981',
                animation: 'fadeIn 0.5s ease-out', minHeight: '400px'
            }}>
                <CheckCircle size={64} style={{ marginBottom: '1rem' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{t('complaints.submitSuccess')}!</h2>
                <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>{t('complaints.id')}: #{submittedId.slice(0, 8)}</p>
                <button
                    onClick={() => setSubmittedId(null)}
                    style={{
                        marginTop: '2rem', padding: '0.6rem 1.2rem',
                        background: 'rgba(16, 185, 129, 0.1)', color: '#10b981',
                        border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px',
                        cursor: 'pointer'
                    }}
                >
                    {t('complaints.submitAnother')}
                </button>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '100%', margin: '0 auto', padding: '2rem' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem', gap: '1rem' }}>
                <button
                    onClick={() => setActiveTab('new')}
                    style={{
                        padding: '0.8rem 2rem',
                        borderRadius: '12px',
                        background: activeTab === 'new' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${activeTab === 'new' ? '#3b82f6' : 'transparent'}`,
                        color: activeTab === 'new' ? '#60a5fa' : '#94a3b8',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        fontWeight: '600', transition: 'all 0.2s'
                    }}
                >
                    <FileText size={18} /> {t('رفع شكوى')}
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    style={{
                        padding: '0.8rem 2rem',
                        borderRadius: '12px',
                        background: activeTab === 'history' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${activeTab === 'history' ? '#3b82f6' : 'transparent'}`,
                        color: activeTab === 'history' ? '#60a5fa' : '#94a3b8',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        fontWeight: '600', transition: 'all 0.2s'
                    }}
                >
                    <List size={18} /> {t('سجل الشكاوى')}
                </button>
            </div>

            {/* TAB: NEW COMPLAINT */}
            {activeTab === 'new' && (
                <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                    <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '0.5rem' }}>{t('رفع شكوى')}</h2>
                        <p style={{ color: '#94a3b8' }}>{t('complaints.newComplaintDesc')}</p>
                    </div>

                    <form onSubmit={handleSubmit} style={{
                        background: 'rgba(30, 41, 59, 0.5)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        padding: '2rem'
                    }}>
                        {/* Static Fields */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontWeight: '600' }}>{t('complaints.customerName')}</label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder={t('complaints.customerName')}
                                    style={{
                                        width: '100%', padding: '0.8rem',
                                        background: 'rgba(15, 23, 42, 0.6)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px', color: 'white', fontSize: '1rem'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontWeight: '600' }}>{t('complaints.customerPhone')}</label>
                                <input
                                    type="text"
                                    value={customerNumber}
                                    onChange={(e) => setCustomerNumber(e.target.value)}
                                    placeholder={t('complaints.customerPhone')}
                                    style={{
                                        width: '100%', padding: '0.8rem',
                                        background: 'rgba(15, 23, 42, 0.6)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px', color: 'white', fontSize: '1rem'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontWeight: '600' }}>{t('complaints.type')}</label>
                            <select
                                value={selectedType}
                                onChange={handleTypeChange}
                                style={{
                                    width: '100%', padding: '0.8rem',
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px', color: 'white', fontSize: '1rem'
                                }}
                            >
                                <option value="">-- {t('forms.select')} {t('complaints.type')} --</option>
                                {types.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Dynamic Fields */}
                        {activeTypeConfig && activeTypeConfig.fields && activeTypeConfig.fields.length > 0 && (
                            <div style={{
                                marginBottom: '2rem',
                                padding: '1.5rem',
                                background: 'rgba(15, 23, 42, 0.3)',
                                borderRadius: '12px',
                                border: '1px dashed rgba(255, 255, 255, 0.1)'
                            }}>
                                <h3 style={{ marginBottom: '1.5rem', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 'bold' }}>{t('complaints.details')} ({activeTypeConfig.name})</h3>

                                <div style={{ display: 'grid', gap: '1.5rem' }}>
                                    {activeTypeConfig.fields.map(field => (
                                        <div key={field.id}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>
                                                {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                                            </label>

                                            {field.type === 'textarea' ? (
                                                <textarea
                                                    value={dynamicData[field.id] || ''}
                                                    onChange={(e) => handleDynamicChange(field.id, e.target.value)}
                                                    style={{
                                                        width: '100%', padding: '0.8rem', minHeight: '100px',
                                                        background: 'rgba(15, 23, 42, 0.6)',
                                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                                        borderRadius: '8px', color: 'white'
                                                    }}
                                                />
                                            ) : field.type === 'dropdown' ? (
                                                <select
                                                    value={dynamicData[field.id] || ''}
                                                    onChange={(e) => handleDynamicChange(field.id, e.target.value)}
                                                    style={{
                                                        width: '100%', padding: '0.8rem',
                                                        background: 'rgba(15, 23, 42, 0.6)',
                                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                                        borderRadius: '8px', color: 'white'
                                                    }}
                                                >
                                                    <option value="">{t('forms.select')}...</option>
                                                    {field.options && field.options.split(',').map((opt, idx) => (
                                                        <option key={idx} value={opt.trim()}>{opt.trim()}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    type={field.type}
                                                    value={dynamicData[field.id] || ''}
                                                    onChange={(e) => handleDynamicChange(field.id, e.target.value)}
                                                    style={{
                                                        width: '100%', padding: '0.8rem',
                                                        background: 'rgba(15, 23, 42, 0.6)',
                                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                                        borderRadius: '8px', color: 'white'
                                                    }}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Notes Field */}
                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontWeight: '600' }}>{t('complaints.notes')}</label>
                            <textarea
                                value={dynamicData['notes'] || ''}
                                onChange={(e) => handleDynamicChange('notes', e.target.value)}
                                placeholder={t('complaints.notesPlaceholder')}
                                style={{
                                    width: '100%', padding: '0.8rem', minHeight: '80px',
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px', color: 'white'
                                }}
                            />
                        </div>

                        <div style={{ textAlign: 'left' }}>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                style={{
                                    padding: '0.8rem 2rem',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                    opacity: isSubmitting ? 0.7 : 1,
                                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem'
                                }}
                            >
                                {isSubmitting ? (
                                    t('common.loading')
                                ) : (
                                    <>
                                        <Send size={18} /> {t('forms.submit')}
                                    </>
                                )}
                            </button>
                        </div>

                    </form>
                </div>
            )}

            {/* TAB: HISTORY */}
            {activeTab === 'history' && (
                <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e2e8f0' }}>{t('complaints.allComplaints')}</h2>
                        <button onClick={loadHistory} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <RotateCcw size={16} /> {t('common.refresh')}
                        </button>
                    </div>

                    {/* Search & Filter Bar */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        {/* Search Input */}
                        <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                            <Search size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                placeholder={t('common.search')}
                                value={searchTerm || ''}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%', padding: '0.8rem 2.5rem 0.8rem 1rem',
                                    background: 'rgba(30, 41, 59, 0.5)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px', color: 'white',
                                    fontSize: '0.95rem'
                                }}
                            />
                        </div>

                        {/* Date Filter */}
                        <div style={{ position: 'relative', minWidth: '180px' }}>
                            <Calendar size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                style={{
                                    width: '100%', padding: '0.8rem 2.5rem 0.8rem 1rem',
                                    background: 'rgba(30, 41, 59, 0.5)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px', color: 'white',
                                    fontSize: '0.95rem',
                                    fontFamily: 'inherit',
                                    colorScheme: 'dark' // Ensures calendar picker is dark
                                }}
                            />
                        </div>
                    </div>

                    <div style={{
                        background: 'rgba(30, 41, 59, 0.5)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
                                <tr>
                                    <th style={{ padding: '1rem', textAlign: 'right', color: '#94a3b8' }}>{t('complaints.customerName')}</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', color: '#94a3b8' }}>{t('complaints.customerPhone')}</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>{t('complaints.raisedBy')}</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>{t('complaints.type')}</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>{t('complaints.date')}</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>{t('complaints.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoadingHistory ? (
                                    <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>{t('common.loading')}</td></tr>
                                ) : filteredComplaints.length === 0 ? (
                                    <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>{t('complaints.noComplaintsFound')}</td></tr>
                                ) : (
                                    filteredComplaints.map(complaint => (
                                        <tr key={complaint.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: '600', color: '#e2e8f0' }}>{complaint.customer_name}</div>
                                            </td>
                                            <td style={{ padding: '1rem', color: '#cbd5e1', fontFamily: 'monospace' }}>
                                                {complaint.customer_number}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center', color: '#cbd5e1', fontSize: '0.9rem' }}>
                                                {complaint.agent?.name || '-'}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center', color: '#cbd5e1' }}>
                                                {complaint.type?.name || '-'}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                                                {new Date(complaint.created_at).toLocaleDateString('ar-EG')}
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
                                                {complaint.status === 'Suspended' && complaint.suspension_reason && (
                                                    <div style={{ fontSize: '0.75rem', color: '#fca5a5', marginTop: '0.5rem', maxWidth: '160px', margin: '0.5rem auto 0', lineHeight: '1.4' }}>
                                                        {complaint.suspension_reason}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                                    {/* Details Button */}
                                                    <button
                                                        onClick={() => { setSelectedComplaint(complaint); setIsDetailsOpen(true); }}
                                                        style={{
                                                            padding: '6px', borderRadius: '4px',
                                                            background: 'rgba(255,255,255,0.05)', border: 'none',
                                                            color: '#cbd5e1', cursor: 'pointer'
                                                        }}
                                                        title="التفاصيل"
                                                    >
                                                        <Eye size={16} />
                                                    </button>

                                                    {/* Share Button */}
                                                    <button
                                                        onClick={() => handleShare(complaint)}
                                                        style={{
                                                            padding: '6px', borderRadius: '4px',
                                                            background: 'rgba(59, 130, 246, 0.1)', border: 'none',
                                                            color: '#3b82f6', cursor: 'pointer'
                                                        }}
                                                        title="نسخ للمشاركة"
                                                    >
                                                        <Share2 size={16} />
                                                    </button>

                                                    {/* Remind Button - Only if NOT Resolved */}
                                                    {complaint.status !== 'Resolved' && (
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await ComplaintManager.incrementReminder(complaint.id, user);
                                                                    toast.success('تم التذكير', 'تم إرسال تذكير للإدارة');
                                                                } catch (err) {
                                                                    toast.error('خطأ', 'فشل إرسال التذكير');
                                                                }
                                                            }}
                                                            style={{
                                                                padding: '6px', borderRadius: '4px',
                                                                background: 'rgba(234, 179, 8, 0.1)', border: 'none',
                                                                color: '#eab308', cursor: 'pointer'
                                                            }}
                                                            title="تذكير الإدارة"
                                                        >
                                                            <Bell size={16} />
                                                        </button>
                                                    )}

                                                    {/* Status Toggle (Resolved <-> Pending/Processing) */}
                                                    {/* Status Toggle (Resolved <-> Pending/Processing) - Creator Only */}
                                                    {complaint.agent_id === user.id && (
                                                        complaint.status === 'Resolved' ? (
                                                            <button
                                                                onClick={async () => {
                                                                    if (!window.confirm('هل تريد إعادة فتح الشكوى؟')) return;
                                                                    try {
                                                                        await ComplaintManager.updateComplaint(complaint.id, { status: 'Pending', resolved_by: null });
                                                                        toast.success('تم', 'تم إعادة فتح الشكوى');
                                                                        loadHistory();
                                                                    } catch (e) { toast.error('خطأ', 'فشل التحديث'); }
                                                                }}
                                                                style={{
                                                                    padding: '6px', borderRadius: '4px',
                                                                    background: 'rgba(255,255,255,0.05)', border: 'none',
                                                                    color: '#94a3b8', cursor: 'pointer'
                                                                }}
                                                                title="إعادة فتح"
                                                            >
                                                                <RotateCcw size={16} />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={async () => {
                                                                    if (!window.confirm('هل أنت متأكد من إغلاق الشكوى واعتبارها ناجحة؟')) return;
                                                                    try {
                                                                        // When Agent resolves, set resolved_by to their ID
                                                                        await ComplaintManager.updateComplaint(complaint.id, { status: 'Resolved', resolved_by: user.id });
                                                                        toast.success('تم', 'تم إغلاق الشكوى بنجاح');
                                                                        loadHistory();
                                                                    } catch (e) { toast.error('خطأ', 'فشل التحديث'); }
                                                                }}
                                                                style={{
                                                                    padding: '6px', borderRadius: '4px',
                                                                    background: 'rgba(16, 185, 129, 0.1)', border: 'none',
                                                                    color: '#10b981', cursor: 'pointer'
                                                                }}
                                                                title="إغلاق (نجاح)"
                                                            >
                                                                <CheckCircle size={16} />
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {isDetailsOpen && selectedComplaint && (
                <Modal isOpen={true} onClose={() => setIsDetailsOpen(false)} title={`${t('complaints.complaintDetails')} #${selectedComplaint.id.slice(0, 8)}`} size="xl">
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
                                    selectedComplaint.status === 'Suspended' ? <CheckCircle size={24} /> : // Re-using CheckCircle as placeholder or need specific icon
                                        <Clock size={24} />}
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: getStatusColor(selectedComplaint.status), marginBottom: '0.2rem' }}>
                                    {getStatusLabel(selectedComplaint.status)}
                                </h3>
                                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                                    {t('complaints.date')}: {new Date(selectedComplaint.created_at).toLocaleString('ar-EG')}
                                </p>
                            </div>
                        </div>

                        {selectedComplaint.status === 'Suspended' && (
                            <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#fca5a5' }}>
                                <strong>{t('complaints.suspensionReason')}:</strong> {selectedComplaint.suspension_reason}
                            </div>
                        )}

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: '1.5rem',
                            marginBottom: '2rem'
                        }}>
                            {/* Static Info */}
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
                                <div><label style={{ color: '#64748b', fontSize: '0.85rem' }}>{t('complaints.customerName')}</label><div style={{ color: '#e2e8f0' }}>{selectedComplaint.customer_name}</div></div>
                                <div><label style={{ color: '#64748b', fontSize: '0.85rem' }}>{t('complaints.customerPhone')}</label><div style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{selectedComplaint.customer_number}</div></div>
                                <div><label style={{ color: '#64748b', fontSize: '0.85rem' }}>{t('complaints.type')}</label><div style={{ color: '#fbbf24' }}>{selectedComplaint.type?.name}</div></div>
                                <div><label style={{ color: '#64748b', fontSize: '0.85rem' }}>{t('complaints.raisedBy')}</label><div style={{ color: '#6be7ff' }}>{selectedComplaint.agent?.name}</div></div>
                            </div>

                            {/* Dynamic Info */}
                            <div style={{
                                background: 'rgba(30, 41, 59, 0.4)',
                                borderRadius: '16px',
                                padding: '1.5rem',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                display: 'flex', flexDirection: 'column', gap: '1rem'
                            }}>
                                <h4 style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.8rem', marginBottom: '0.5rem' }}>
                                    {t('complaints.details')}
                                </h4>
                                {Object.entries(selectedComplaint.form_data || {}).map(([key, value]) => {
                                    const fields = selectedComplaint.type?.fields || [];
                                    const fieldDef = fields.find(f => f.id.toString() === key.toString());
                                    const label = fieldDef ? fieldDef.label : (key === 'notes' ? t('complaints.notes') : t('complaints.details'));
                                    if (key === 'notes') return null; // Handle notes separately
                                    return (
                                        <div key={key}>
                                            <label style={{ fontSize: '0.85rem', color: '#64748b' }}>{label}</label>
                                            <div style={{ fontSize: '0.95rem', color: '#f1f5f9', whiteSpace: 'pre-wrap' }}>{String(value)}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Notes */}
                        {selectedComplaint.notes && (
                            <div style={{
                                background: 'rgba(30, 41, 59, 0.4)',
                                borderRadius: '16px',
                                padding: '1.5rem',
                                border: '1px solid rgba(255, 255, 255, 0.05)'
                            }}>
                                <h4 style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{t('complaints.agentNotes')}</h4>
                                <div style={{ color: '#f1f5f9', whiteSpace: 'pre-wrap' }}>{selectedComplaint.notes}</div>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                            <button
                                onClick={() => setIsDetailsOpen(false)}
                                style={{ padding: '0.6rem 1.5rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#cbd5e1', cursor: 'pointer' }}
                            >
                                {t('forms.close')}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

        </div>
    );
};

export default ComplaintSubmission;
