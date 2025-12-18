import React, { useState, useEffect } from 'react';
import { X, Phone, User, MessageSquare, Clock, MapPin, Hash, CheckCircle, AlertCircle, FileText, Activity } from 'lucide-react';
import { DataManager } from '../../../shared/utils/DataManager';

const CallDetailsModal = ({ call, onClose }) => {
    const [agentName, setAgentName] = useState('---');
    const [lookupData, setLookupData] = useState({ procedures: [], actions: [] });

    useEffect(() => {
        const loadContext = async () => {
            if (!call) return;

            // Fetch Users to resolve Agent Name
            const users = await DataManager.getUsers();
            const agent = users.find(u => u.id === (call.agentId || call.agent_id));
            if (agent) {
                setAgentName(agent.name);
            } else if (call.agentName || call.agent_name) {
                setAgentName(call.agentName || call.agent_name);
            }

            // Fetch Lookups
            const [procs, acts] = await Promise.all([
                DataManager.getCategoriesByType('procedure'),
                DataManager.getCategoriesByType('action')
            ]);
            setLookupData({ procedures: procs || [], actions: acts || [] });
        };
        loadContext();
    }, [call]);

    if (!call) return null;

    // Helper to safety check nested properties
    const getVal = (obj, path) => {
        if (!obj) return null;
        return path.split('.').reduce((acc, part) => acc && acc[part], obj) || null;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '---';
        return new Date(dateString).toLocaleDateString('en-US');
    };

    const formatTime = (dateString) => {
        if (!dateString) return '---';
        return new Date(dateString).toLocaleTimeString('en-US');
    };

    const formatDuration = (seconds) => {
        if (seconds === undefined || seconds === null) return '00:00:00';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Data Extraction
    const department = ((call.classificationPath || call.classification_path) || []).join(' > ') || '---';

    // Status Logic
    const termProcName = getVal(call, 'formData.terminationProcedure') || getVal(call, 'form_data.terminationProcedure');
    const status = termProcName || (call.status === 'Successful' ? 'ناجحة' : (call.status === 'Missed' ? 'فائتة' : call.status || '---'));

    // Customer Info: Prefer snapshot from formData, then top level
    const snapshot = getVal(call, 'formData.customerSnapshot') || getVal(call, 'form_data.customerSnapshot') || {};
    const customerName = snapshot.name || call.customerName || call.customer_name || 'غير مسجل';
    const genderRaw = snapshot.gender || call.customerGender || call.gender;
    const gender = genderRaw === 'male' ? 'ذكر' : (genderRaw === 'female' ? 'أنثى' : '---');
    const city = snapshot.city || (getVal(call, 'formData.governorate') ? `${getVal(call, 'formData.governorate')} - ${getVal(call, 'formData.district')}` : '---');

    const accountTypeRaw = getVal(call, 'formData.accountType') || getVal(call, 'form_data.accountType');
    const accountType = accountTypeRaw === 'business' ? 'حساب تاجر' : (accountTypeRaw === 'personal' ? 'حساب شخصي' : (accountTypeRaw || '---'));

    // Resolve Procedures/Actions
    const procRaw = getVal(call, 'formData.procedure') || getVal(call, 'form_data.procedure');
    const termRaw = getVal(call, 'formData.terminationProcedure') || getVal(call, 'form_data.terminationProcedure');

    // Try to find name in lookups if raw value looks like ID
    const resolveName = (val, list) => {
        if (!val) return '---';
        const item = list.find(i => i.id === val || i.name === val);
        return item ? item.name : val;
    };

    const procedure = resolveName(procRaw, lookupData.actions);
    const terminationProcedure = resolveName(termRaw, lookupData.procedures);

    const inquiryType = ((call.classificationPath || call.classification_path) || [])[0] || '---';
    const notes = call.notes || '---';

    // Styles for Dark Theme
    const modalBg = 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)';
    const glassPanel = 'rgba(255, 255, 255, 0.03)';
    const borderColor = 'rgba(255, 255, 255, 0.08)';
    const textColorPrimary = '#f1f5f9';
    const textColorSecondary = '#94a3b8';
    const accentColor = '#6366f1'; // Indigo-500

    const labelStyle = {
        fontSize: '0.8rem',
        color: textColorSecondary,
        marginBottom: '0.35rem',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
    };

    const valueBoxStyle = {
        background: 'rgba(0, 0, 0, 0.2)',
        padding: '0.85rem 1rem',
        borderRadius: '12px',
        color: textColorPrimary,
        fontSize: '0.95rem',
        fontWeight: '500',
        minHeight: '44px',
        display: 'flex',
        alignItems: 'center',
        border: `1px solid ${borderColor}`,
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
    };

    const sectionTitleStyle = {
        fontSize: '1.1rem',
        color: '#e2e8f0', // Slate-200
        marginBottom: '1rem',
        marginTop: '1.5rem',
        paddingBottom: '0.5rem',
        borderBottom: `1px solid ${borderColor}`,
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    };


    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)'
        }} onClick={onClose}>
            <div style={{
                background: modalBg,
                borderRadius: '24px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)',
                width: '900px',
                maxWidth: '95vw',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative',
                fontFamily: 'sans-serif',
                direction: 'rtl',
                color: textColorPrimary
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{
                    padding: '1.5rem 2rem',
                    borderBottom: `1px solid ${borderColor}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'rgba(255,255,255,0.02)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '12px',
                            background: 'rgba(99, 102, 241, 0.15)', color: accentColor,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <FileText size={20} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: 'white' }}>
                                تفاصيل السجل
                            </h2>
                            <span style={{ fontSize: '0.85rem', color: textColorSecondary, fontFamily: 'monospace', direction: 'ltr', display: 'block', textAlign: 'left' }}>
                                #{call.id || getVal(call, 'number') || getVal(call, 'callerNumber')}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer',
                        color: 'white', padding: '8px', borderRadius: '50%', display: 'flex'
                    }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: '0 2rem 2rem 2rem' }}>

                    {/* Section: Call Data */}
                    <div>
                        <h3 style={sectionTitleStyle}>
                            <Phone size={18} color={accentColor} />
                            بيانات المكالمة
                        </h3>

                        <div style={{ marginBottom: '1rem' }}>
                            <div style={labelStyle}><Activity size={14} /> القسم / التصنيف</div>
                            <div style={{ ...valueBoxStyle, color: accentColor, fontWeight: '600', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                                {department}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <div style={labelStyle}>التاريخ</div>
                                <div style={valueBoxStyle}>{formatDate(call.timestamp)}</div>
                            </div>
                            <div>
                                <div style={labelStyle}><Clock size={14} /> الوقت</div>
                                <div style={valueBoxStyle}>{formatTime(call.timestamp)}</div>
                            </div>
                            <div>
                                <div style={labelStyle}>المدة</div>
                                <div style={valueBoxStyle}>{formatDuration(call.duration || 0)}</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                            <div>
                                <div style={labelStyle}>الموظف</div>
                                <div style={valueBoxStyle}>{agentName}</div>
                            </div>
                            <div>
                                <div style={labelStyle}>الحالة</div>
                                <div style={{
                                    ...valueBoxStyle,
                                    color: (status === 'ناجحة' || status === 'مكتملة') ? '#10b981' : (status === 'مقطوعة' ? '#f97316' : (status.includes('مزعج') ? '#ef4444' : '#f59e0b')),
                                    background: (status === 'ناجحة' || status === 'مكتملة') ? 'rgba(16, 185, 129, 0.1)' : (status === 'مقطوعة' ? 'rgba(249, 115, 22, 0.1)' : (status.includes('مزعج') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)')),
                                    borderColor: (status === 'ناجحة' || status === 'مكتملة') ? 'rgba(16, 185, 129, 0.2)' : (status === 'مقطوعة' ? 'rgba(249, 115, 22, 0.2)' : (status.includes('مزعج') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'))
                                }}>{status}</div>
                            </div>
                            <div>
                                <div style={labelStyle}><Hash size={14} /> الرقم</div>
                                <div style={{ ...valueBoxStyle, fontFamily: 'monospace', letterSpacing: '1px' }}>
                                    {call.callerNumber || call.caller_number || call.number}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Personal Information */}
                    <div>
                        <h3 style={sectionTitleStyle}>
                            <User size={18} color="#38bdf8" /> {/* Sky-400 */}
                            البيانات الشخصية
                        </h3>

                        <div style={{ marginBottom: '1rem' }}>
                            <div style={labelStyle}><MapPin size={14} /> الموقع الجغرافي</div>
                            <div style={valueBoxStyle}>
                                {city}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                            <div>
                                <div style={labelStyle}>الاسم</div>
                                <div style={valueBoxStyle}>{customerName}</div>
                            </div>
                            <div>
                                <div style={labelStyle}>نوع الحساب</div>
                                <div style={valueBoxStyle}>{accountType}</div>
                            </div>
                            <div>
                                <div style={labelStyle}>الجنس</div>
                                <div style={valueBoxStyle}>{gender}</div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Answers */}
                    <div>
                        <h3 style={sectionTitleStyle}>
                            <MessageSquare size={18} color="#f472b6" /> {/* Pink-400 */}
                            الإجابات والملاحظات
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <div style={labelStyle}><CheckCircle size={14} /> إجراء الإنهاء</div>
                                <div style={valueBoxStyle}>{terminationProcedure}</div>
                            </div>
                            <div>
                                <div style={labelStyle}><AlertCircle size={14} /> الإجراء المتخذ</div>
                                <div style={valueBoxStyle}>{procedure}</div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <div style={labelStyle}>نوع الاستفسار الرئيسي</div>
                            <div style={valueBoxStyle}>{inquiryType}</div>
                        </div>

                        <div>
                            <div style={labelStyle}>الملاحظات / الاستفسار</div>
                            <div style={{ ...valueBoxStyle, minHeight: '100px', alignItems: 'flex-start', lineHeight: '1.6' }}>
                                {notes}
                            </div>
                        </div>
                    </div>

                    {/* Footer Close Button */}
                    <div style={{ marginTop: '2.5rem' }}>
                        <button
                            onClick={onClose}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', // Indigo Gradient
                                border: 'none',
                                borderRadius: '12px',
                                color: 'white',
                                fontWeight: '600',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                letterSpacing: '0.5px',
                                boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.4), 0 2px 4px -1px rgba(79, 70, 229, 0.2)',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.transform = 'translateY(-1px)';
                                e.target.style.boxShadow = '0 10px 15px -3px rgba(79, 70, 229, 0.4)';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 6px -1px rgba(79, 70, 229, 0.4)';
                            }}
                        >
                            إغلاق النافذة
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CallDetailsModal;
