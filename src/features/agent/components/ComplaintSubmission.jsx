import React, { useState, useEffect } from 'react';
import { Send, FileText, AlertCircle, CheckCircle, List, Clock, RotateCcw, Bell, Power, Search, Calendar, Eye, Share2, Edit } from 'lucide-react';
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
    const [notes, setNotes] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [dynamicData, setDynamicData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittedId, setSubmittedId] = useState(null);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // History State
    const [myComplaints, setMyComplaints] = useState([]);
    const [filteredComplaints, setFilteredComplaints] = useState([]); // Filtered list for display
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('active'); // 'active' | 'resolved'
    // Default filter date to today (YYYY-MM-DD)
    // Default filter date to empty (All time)
    const [filterDate, setFilterDate] = useState('');
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Details Modal
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Closure Modal
    const [isClosureModalOpen, setIsClosureModalOpen] = useState(false);
    const [closingComplaint, setClosingComplaint] = useState(null);
    const [closureReason, setClosureReason] = useState('');

    useEffect(() => {
        loadTypes();
        if (activeTab === 'history') {
            loadHistory();
        }
    }, [activeTab]);

    // Filtering Effect
    useEffect(() => {
        let result = myComplaints;

        // 0. Filter by View Mode
        if (viewMode === 'active') {
            result = result.filter(c => ['Pending', 'Processing', 'Suspended'].includes(c.status));
        } else if (viewMode === 'resolved') {
            result = result.filter(c => c.status === 'Resolved');
        }
        // 'all' mode: do nothing (return all)

        // 1. Filter by Search Term (Global Search)
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(c =>
                c.customer_name?.toLowerCase().includes(lower) ||
                c.customer_number?.toLowerCase().includes(lower) ||
                c.id?.toLowerCase().includes(lower)
            );
        }
        // 2. If no search, check date filter
        else if (filterDate) {
            result = result.filter(c => {
                const complaintDate = new Date(c.created_at).toLocaleDateString('en-CA');
                return complaintDate === filterDate;
            });
        }

        setFilteredComplaints(result);
    }, [searchTerm, filterDate, myComplaints, viewMode]);

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

    const renderInput = (field) => {
        let value = dynamicData[field.id] || '';
        let onChange = (e) => handleDynamicChange(field.id, e.target.value);

        if (field.system_key === 'customer_name') {
            value = customerName;
            onChange = (e) => setCustomerName(e.target.value);
        }

        const commonStyle = {
            width: '100%', padding: '0.8rem',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px', color: 'white', fontSize: '1rem'
        };

        if (field.type === 'textarea') {
            return (
                <textarea
                    value={value}
                    onChange={onChange}
                    style={{ ...commonStyle, minHeight: '100px' }}
                />
            );
        } else if (field.type === 'dropdown') {
            return (
                <select value={value} onChange={onChange} style={commonStyle}>
                    <option value="">{t('forms.select')}...</option>
                    {field.options && field.options.split(',').map((opt, idx) => (
                        <option key={idx} value={opt.trim()}>{opt.trim()}</option>
                    ))}
                </select>
            );
        } else if (field.type === 'static_text') {
            return (
                <div style={{
                    width: '100%', padding: '1rem',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '8px', color: '#93c5fd', fontSize: '0.95rem',
                    whiteSpace: 'pre-wrap', lineHeight: '1.6'
                }}>
                    {field.options || field.label}
                </div>
            );
        } else {
            return (
                <input
                    type={field.type}
                    value={value}
                    onChange={onChange}
                    style={commonStyle}
                />
            );
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!customerNumber || !selectedType) {
            toast.error(t('common.alert'), t('forms.fillRequired'));
            return;
        }

        const typeConfig = types.find(t => t.id === selectedType);
        if (!typeConfig) return;

        // Validation
        for (const field of typeConfig.fields || []) {
            if (field.visible !== false && field.required) {
                if (field.type === 'system') {
                    if (field.system_key === 'customer_name' && !customerName) {
                        toast.error(t('common.alert'), `${t('forms.required')}: ${field.label || t('complaints.customerName')}`);
                        return;
                    }
                } else {
                    if (!dynamicData[field.id]) {
                        toast.error(t('common.alert'), `${t('forms.required')}: ${field.label}`);
                        return;
                    }
                }
            }
        }

        setIsSubmitting(true);
        try {
            const submission = {
                customer_name: customerName || '',
                customer_number: customerNumber,
                type_id: selectedType,
                form_data: dynamicData,
                notes: notes || '',
            };

            if (isEditing && editingId) {
                // UPDATE EXISTING
                await ComplaintManager.updateComplaint(editingId, submission);
                toast.success(t('common.success'), 'تم تحديث الشكوى بنجاح');
                handleCancelEdit(); // Reset to new mode
                setActiveTab('history'); // Go to history to see changes
                loadHistory(); // Refresh list
            } else {
                // CREATE NEW
                const newComplaint = {
                    ...submission,
                    agent_id: user.id,
                    status: 'Pending'
                };
                const result = await ComplaintManager.submitComplaint(newComplaint);
                setSubmittedId(result.id);
                toast.success(t('common.success'), t('complaints.submitSuccess'));
                handleCancelEdit(); // Reset form
                // Auto hide success message
                setTimeout(() => setSubmittedId(null), 3000);
            }

        } catch (error) {
            console.error("Submission error", error);
            toast.error(t('common.error'), isEditing ? 'فشل تحديث الشكوى' : t('complaints.submitError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (complaint) => {
        setCustomerName(complaint.customer_name);
        setCustomerNumber(complaint.customer_number);
        setSelectedType(complaint.type_id);
        setNotes(complaint.notes || '');

        // Merge forms data
        setDynamicData(complaint.form_data || {});
        setIsEditing(true);
        setEditingId(complaint.id);
        setActiveTab('new');
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditingId(null);
        setCustomerName('');
        setCustomerNumber('');
        setSelectedType('');
        setDynamicData({});
    };

    const handleShare = async (complaint) => {
        try {
            const lines = [];

            // 1. Basic Fields (Top)
            if (complaint.type && complaint.type.fields) {
                const basicFields = complaint.type.fields.filter(f => f.section === 'basic');
                basicFields.forEach(f => {
                    if (f.type === 'static_text') {
                        if (f.options) lines.push(`${f.options}`);
                    } else if (f.system_key === 'customer_name') {
                        if (complaint.customer_name) lines.push(`*${f.label}:* ${complaint.customer_name}`);
                    } else {
                        const val = complaint.form_data?.[f.id];
                        if (val) lines.push(`*${f.label}:* ${val}`);
                    }
                });
            } else if (complaint.customer_name) {
                // Fallback for legacy
                lines.push(`*${t('complaints.customerName')}:* ${complaint.customer_name}`);
            }

            // 2. Fixed Phone & Type
            lines.push(`*${t('complaints.customerPhone')}:* ${complaint.customer_number}`);
            lines.push(`*${t('complaints.type')}:* ${complaint.type?.name || '-'}`);

            // 3. Details Fields
            if (complaint.type && complaint.type.fields) {
                const detailFields = complaint.type.fields.filter(f => f.section !== 'basic');
                detailFields.forEach(f => {
                    if (f.type === 'static_text') {
                        if (f.options) lines.push(`${f.options}`);
                    } else {
                        const val = complaint.form_data?.[f.id];
                        if (val) lines.push(`*${f.label}:* ${val}`);
                    }
                });
            }

            if (complaint.notes) {
                lines.push(`*${t('complaints.notes')}:* ${complaint.notes}`);
            }

            const text = lines.join('\n');
            await navigator.clipboard.writeText(text);
            toast.success(t('تم نسخ الشكوى'), t('تم نسخ الشكوى بنجاح'));
        } catch (err) {
            console.error('Share error', err);
            toast.error(t('common.error'), t('فشل نسخ الشكوى'));
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
                    onClick={() => {
                        if (isEditing) handleCancelEdit();
                        setActiveTab('new');
                    }}
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
                    <FileText size={18} /> {isEditing ? 'تعديل الشكوى' : t('رفع شكوى')}
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

            {activeTab === 'new' && (
                <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                    <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '0.5rem' }}>
                            {isEditing ? 'تعديل الشكوى' : t('رفع شكوى')}
                        </h2>
                        <p style={{ color: '#94a3b8' }}>
                            {isEditing ? 'يمكنك تحديث بيانات الشكوى من هنا' : t('complaints.newComplaintDesc')}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} style={{
                        background: 'rgba(30, 41, 59, 0.5)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        padding: '2rem'
                    }}>
                        {/* Basic Section Dynamic Fields (Appears First) */}
                        {activeTypeConfig && activeTypeConfig.fields && (
                            <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                {activeTypeConfig.fields.filter(f => f.visible !== false && f.section === 'basic').map(field => (
                                    <div key={field.id}>
                                        {field.type !== 'static_text' && (
                                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontWeight: '600' }}>
                                                {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                                            </label>
                                        )}
                                        {renderInput(field)}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Static Phone & Type */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontWeight: '600' }}>{t('complaints.customerPhone')} <span style={{ color: '#ef4444' }}>*</span></label>
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
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontWeight: '600' }}>{t('complaints.type')} <span style={{ color: '#ef4444' }}>*</span></label>
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
                        </div>

                        {/* Instructions/Hints for Agent */}
                        {activeTypeConfig && activeTypeConfig.instructions && (
                            <div style={{
                                marginBottom: '2rem',
                                padding: '1rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                borderRight: '4px solid #ef4444',
                                borderRadius: '4px',
                                display: 'flex', gap: '1rem', alignItems: 'flex-start'
                            }}>
                                <AlertCircle size={20} color="#ef4444" style={{ marginTop: '2px', flexShrink: 0 }} />
                                <div>
                                    <h4 style={{ color: '#f87171', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                        {t('complaints.instructions') || 'تلميحات/تعليمات:'}
                                    </h4>
                                    <p style={{ color: '#e2e8f0', fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                                        {activeTypeConfig.instructions}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Dynamic Fields Rendering (System & Custom) */}
                        {activeTypeConfig ? (
                            <div style={{
                                marginBottom: '2rem',
                                padding: '1.5rem',
                                background: 'rgba(15, 23, 42, 0.3)',
                                borderRadius: '12px',
                                border: '1px dashed rgba(255, 255, 255, 0.1)'
                            }}>
                                <h3 style={{ marginBottom: '1.5rem', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 'bold' }}>{t('complaints.details')} ({activeTypeConfig.name})</h3>

                                <div style={{ display: 'grid', gap: '1.5rem' }}>
                                    {/* Details Section Dynamic Fields */}
                                    {activeTypeConfig.fields && activeTypeConfig.fields.length > 0 ? (
                                        activeTypeConfig.fields.filter(f => f.visible !== false && f.section !== 'basic').map(field => (
                                            <div key={field.id}>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontWeight: '600' }}>
                                                    {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                                                </label>
                                                {renderInput(field)}
                                            </div>
                                        ))
                                    ) : (
                                        // FALLBACK: If no fields defined (legacy types), show default static Customer Name only
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontWeight: '600' }}>{t('complaints.customerName')}</label>
                                            <input
                                                type="text"
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                                placeholder={t('complaints.customerName')}
                                                style={{ width: '100%', padding: '0.8rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: 'white', fontSize: '1rem' }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            // No Type Selected State
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                <p>يرجى اختيار نوع الشكوى من القائمة أعلاه لإظهار التفاصيل</p>
                            </div>
                        )}


                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontWeight: '600' }}>{t('complaints.notes')}</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
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
                                        <Send size={18} /> {isEditing ? 'حفظ التغييرات' : t('forms.submit')}
                                    </>
                                )}
                            </button>

                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    style={{
                                        marginRight: '1rem',
                                        padding: '0.8rem 2rem',
                                        backgroundColor: 'transparent',
                                        color: '#94a3b8',
                                        border: '1px solid rgba(148, 163, 184, 0.3)',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {t('common.cancel')}
                                </button>
                            )}
                        </div>

                    </form >
                </div >
            )}

            {/* TAB: HISTORY */}
            {
                activeTab === 'history' && (
                    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e2e8f0' }}>{t('complaints.allComplaints')}</h2>
                            <button onClick={loadHistory} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <RotateCcw size={16} /> {t('common.refresh')}
                            </button>
                        </div>

                        {/* View Mode Toggle */}
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', background: 'rgba(30, 41, 59, 0.5)', padding: '0.4rem', borderRadius: '12px', width: 'fit-content' }}>
                            <button
                                onClick={() => setViewMode('all')}
                                style={{
                                    padding: '0.6rem 1.2rem',
                                    borderRadius: '8px',
                                    background: viewMode === 'all' ? '#64748b' : 'transparent',
                                    color: viewMode === 'all' ? 'white' : '#94a3b8',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    transition: 'all 0.2s',
                                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                                }}
                            >
                                <List size={16} />
                                {t('complaints.allComplaints') || 'كل الشكاوى'}
                            </button>
                            <button
                                onClick={() => setViewMode('active')}
                                style={{
                                    padding: '0.6rem 1.2rem',
                                    borderRadius: '8px',
                                    background: viewMode === 'active' ? '#3b82f6' : 'transparent',
                                    color: viewMode === 'active' ? 'white' : '#94a3b8',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    transition: 'all 0.2s',
                                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                                }}
                            >
                                <Clock size={16} />
                                المعلقات
                            </button>
                            <button
                                onClick={() => setViewMode('resolved')}
                                style={{
                                    padding: '0.6rem 1.2rem',
                                    borderRadius: '8px',
                                    background: viewMode === 'resolved' ? '#10b981' : 'transparent',
                                    color: viewMode === 'resolved' ? 'white' : '#94a3b8',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    transition: 'all 0.2s',
                                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                                }}
                            >
                                <CheckCircle size={16} />
                                الشكاوى المحلولة
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
                                        <th style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>تاريخ الرفع</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>تاريخ الإغلاق</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>بواسطة</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>المدة</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>الحالة</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoadingHistory ? (
                                        <tr><td colSpan="9" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>{t('common.loading')}</td></tr>
                                    ) : filteredComplaints.length === 0 ? (
                                        <tr><td colSpan="9" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>{t('complaints.noComplaintsFound')}</td></tr>
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
                                                <td style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', direction: 'ltr' }}>
                                                    {new Date(complaint.created_at).toLocaleDateString('en-GB')}
                                                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                                                        {new Date(complaint.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', direction: 'ltr' }}>
                                                    {complaint.resolved_at ? (
                                                        <>
                                                            {new Date(complaint.resolved_at).toLocaleDateString('en-GB')}
                                                            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                                                                {new Date(complaint.resolved_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                            </div>
                                                        </>
                                                    ) : '-'}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center', color: '#e2e8f0', fontSize: '0.9rem' }}>
                                                    {complaint.last_actor?.name || complaint.resolver?.name || '-'}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center', color: '#fbbf24', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                                    {calculateDuration(complaint.created_at, complaint.resolved_at)}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <span style={{
                                                        padding: '4px 10px', borderRadius: '12px',
                                                        background: `${getStatusColor(complaint.status)}20`,
                                                        color: getStatusColor(complaint.status),
                                                        fontSize: '0.8rem', fontWeight: '600',
                                                        whiteSpace: 'nowrap', display: 'inline-block'
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
                                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', flexWrap: 'nowrap' }}>
                                                        <button
                                                            onClick={() => { setSelectedComplaint(complaint); setIsDetailsOpen(true); }}
                                                            style={{
                                                                width: '32px', height: '32px', padding: 0, borderRadius: '6px',
                                                                background: 'rgba(255,255,255,0.05)', border: 'none',
                                                                color: '#cbd5e1', cursor: 'pointer',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                            }}
                                                            title="التفاصيل"
                                                        >
                                                            <Eye size={16} />
                                                        </button>

                                                        {/* Edit Button - Only for Creator AND Not Resolved */}
                                                        {complaint.agent_id === user.id && complaint.status !== 'Resolved' && (
                                                            <button
                                                                onClick={() => handleEdit(complaint)}
                                                                style={{
                                                                    width: '32px', height: '32px', padding: 0, borderRadius: '6px',
                                                                    background: 'rgba(59, 130, 246, 0.1)', border: 'none',
                                                                    color: '#60a5fa', cursor: 'pointer',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                                }}
                                                                title="تعديل الشكوى"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                        )}

                                                        {/* Share Button */}
                                                        <button
                                                            onClick={() => handleShare(complaint)}
                                                            style={{
                                                                width: '32px', height: '32px', padding: 0, borderRadius: '6px',
                                                                background: 'rgba(59, 130, 246, 0.1)', border: 'none',
                                                                color: '#3b82f6', cursor: 'pointer',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
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
                                                                    width: '32px', height: '32px', padding: 0, borderRadius: '6px',
                                                                    background: 'rgba(234, 179, 8, 0.1)', border: 'none',
                                                                    color: '#eab308', cursor: 'pointer',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                                }}
                                                                title="تذكير الإدارة"
                                                            >
                                                                <Bell size={16} />
                                                            </button>
                                                        )}

                                                        {/* Status Toggle (Resolved <-> Pending/Processing) */}
                                                        {/* Status Toggle Logic */}
                                                        {complaint.status === 'Resolved' ? (
                                                            /* Reopen - Creator Only */
                                                            (complaint.agent_id === user.id) && (
                                                                <button
                                                                    onClick={async () => {
                                                                        if (!window.confirm('هل تريد إعادة فتح الشكوى؟')) return;
                                                                        try {
                                                                            await ComplaintManager.updateComplaint(complaint.id, {
                                                                                status: 'Pending',
                                                                                resolved_by: null,
                                                                                last_action_by: user ? user.id : null
                                                                            });
                                                                            toast.success('تم', 'تم إعادة فتح الشكوى');
                                                                            loadHistory();
                                                                        } catch (e) { toast.error('خطأ', 'فشل التحديث'); }
                                                                    }}
                                                                    style={{
                                                                        width: '32px', height: '32px', padding: 0, borderRadius: '6px',
                                                                        background: 'rgba(255,255,255,0.05)', border: 'none',
                                                                        color: '#94a3b8', cursor: 'pointer',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                                    }}
                                                                    title="إعادة فتح"
                                                                >
                                                                    <RotateCcw size={16} />
                                                                </button>
                                                            )
                                                        ) : (
                                                            /* Close - Everyone */
                                                            <button
                                                                onClick={() => {
                                                                    setClosingComplaint(complaint);
                                                                    setClosureReason('');
                                                                    setIsClosureModalOpen(true);
                                                                }}
                                                                style={{
                                                                    width: '32px', height: '32px', padding: 0, borderRadius: '6px',
                                                                    background: 'rgba(16, 185, 129, 0.1)', border: 'none',
                                                                    color: '#10b981', cursor: 'pointer',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                                }}
                                                                title="إغلاق (نجاح)"
                                                            >
                                                                <CheckCircle size={16} />
                                                            </button>
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
                )
            }

            {/* Details Modal */}
            {
                isDetailsOpen && selectedComplaint && (
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
                )
            }

            {/* Closure Modal */}
            {
                isClosureModalOpen && closingComplaint && (
                    <Modal isOpen={true} onClose={() => setIsClosureModalOpen(false)} title={t('complaints.closeConfirm')} size="md">
                        <div style={{ padding: '1.5rem' }}>
                            <p style={{ color: '#cbd5e1', marginBottom: '1rem' }}>{t('complaints.closureReasonPlaceholder')}</p>
                            <textarea
                                value={closureReason}
                                onChange={(e) => setClosureReason(e.target.value)}
                                placeholder={t('complaints.closureReason')}
                                style={{
                                    width: '100%', padding: '0.8rem', minHeight: '100px',
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px', color: 'white', marginBottom: '1.5rem'
                                }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button
                                    onClick={() => setIsClosureModalOpen(false)}
                                    style={{
                                        padding: '0.6rem 1.2rem', background: 'transparent',
                                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px',
                                        color: '#94a3b8', cursor: 'pointer'
                                    }}
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!closureReason.trim()) {
                                            toast.error(t('common.error'), t('complaints.fillRequired'));
                                            return;
                                        }
                                        try {
                                            console.log('ComplaintSubmission: Closing complaint', closingComplaint.id, 'with user', user?.id);
                                            await ComplaintManager.updateComplaint(closingComplaint.id, {
                                                status: 'Resolved',
                                                resolved_by: user.id,
                                                closure_reason: closureReason,
                                                resolved_at: new Date().toISOString(),
                                                last_action_by: user.id
                                            });
                                            toast.success(t('common.success'), t('complaints.statusUpdateSuccess'));
                                            setIsClosureModalOpen(false);
                                            loadHistory();
                                        } catch (err) {
                                            console.error(err);
                                            toast.error(t('common.error'), t('complaints.updateError'));
                                        }
                                    }}
                                    style={{
                                        padding: '0.6rem 1.2rem', background: '#10b981',
                                        border: 'none', borderRadius: '6px',
                                        color: 'white', cursor: 'pointer', fontWeight: 'bold'
                                    }}
                                >
                                    {t('complaints.closeConfirm')}
                                </button>
                            </div>
                        </div>
                    </Modal>
                )
            }

        </div >
    );
};

export default ComplaintSubmission;
