import React, { useState } from 'react';
import { ArrowRight, Smartphone, Phone, Eye, FileSpreadsheet, X, CheckSquare, Square, Download } from 'lucide-react';
import UserAvatar from '../../../shared/components/UserAvatar';
import { ReportGenerator } from '../../../shared/utils/ReportGenerator';

const AgentDetailsView = ({ agent, calls, onBack, dateFilter, onDateFilterChange, onViewCallDetails }) => {
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [selectedColumns, setSelectedColumns] = useState(['timestamp', 'callerNumber', 'duration', 'status', 'classification']);

    const availableColumns = [
        { key: 'timestamp', label: 'الوقت والتاريخ' },
        { key: 'callerNumber', label: 'رقم العميل' },
        { key: 'duration', label: 'المدة (ثواني)' },
        { key: 'status', label: 'الحالة' },
        { key: 'classification', label: 'التصنيف' },
        { key: 'terminationProcedure', label: 'إجراء الإنهاء' },
        { key: 'notes', label: 'ملاحظات' }
    ];

    const toggleColumn = (key) => {
        if (selectedColumns.includes(key)) {
            setSelectedColumns(selectedColumns.filter(c => c !== key));
        } else {
            setSelectedColumns([...selectedColumns, key]);
        }
    };

    const handleExport = () => {
        const dataToExport = calls.map(c => ({
            ...c,
            timestamp: new Date(c.timestamp).toLocaleString('ar-SA'),
            callerNumber: c.callerNumber || c.caller_number,
            duration: c.duration ? `${Math.floor(c.duration / 60)}:${(c.duration % 60).toString().padStart(2, '0')}` : '0:00',
            classification: ((c.classificationPath || c.classification_path) || []).join(' > '),
            terminationProcedure: (c.form_data && c.form_data.terminationProcedure) || (c.formData && c.formData.terminationProcedure) || '-',
            notes: (c.form_data && c.form_data.notes) || (c.formData && c.formData.notes) || '-'
        }));

        const columns = availableColumns.filter(c => selectedColumns.includes(c.key));
        ReportGenerator.exportToExcel(dataToExport, columns, `تقرير_الموظف_${agent.name}_${new Date().toISOString().split('T')[0]}.xlsx`);
        setIsExportModalOpen(false);
    };

    return (
        <div className="animate-fade-in" style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <button
                onClick={onBack}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '0.75rem 1.25rem',
                    borderRadius: '12px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    cursor: 'pointer',
                    marginBottom: '1.5rem',
                    fontSize: '0.95rem'
                }}
            >
                <ArrowRight size={18} /> العودة للوحة التحكم
            </button>

            <div style={{
                padding: '2rem',
                borderRadius: '20px',
                marginBottom: '1.5rem',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                background: 'rgba(255, 255, 255, 0.02)',
                backdropFilter: 'blur(10px)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <UserAvatar user={agent} size={80} />
                        <div>
                            <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '0.5rem' }}>{agent.name}</h1>
                            <div style={{ display: 'flex', gap: '1.5rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Smartphone size={16} /> {agent.username}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: agent.role === 'ADMIN' ? '#ef4444' : '#10b981'
                                    }} />
                                    {agent.role === 'AGENT' ? 'موظف خدمة عملاء' : 'مدير نظام'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        background: 'rgba(255, 255, 255, 0.02)',
                        padding: '1rem 1.5rem',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#60a5fa' }}>{calls.length}</div>
                            <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)' }}>إجمالي المكالمات</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>{agent.resolutionRate}</div>
                            <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)' }}>معدل الحل</div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{
                padding: '2rem',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                background: 'rgba(255, 255, 255, 0.02)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: '600' }}>سجل المكالمات التفصيلي</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                            onClick={() => setIsExportModalOpen(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                background: '#10b981',
                                border: 'none',
                                padding: '0.75rem 1.25rem',
                                borderRadius: '12px',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: '600'
                            }}
                        >
                            <FileSpreadsheet size={16} /> تصدير Excel
                        </button>
                        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }}></div>
                        <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>تصفية حسب التاريخ:</span>
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => onDateFilterChange(e.target.value)}
                            style={{
                                width: 'auto',
                                marginBottom: 0,
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                padding: '0.75rem 1rem',
                                color: 'white',
                                fontSize: '0.95rem'
                            }}
                        />
                    </div>
                </div>

                {calls.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                        <Phone size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <div style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>لا توجد مكالمات</div>
                        <p>لم يتم تسجيل أي مكالمات {dateFilter ? 'في هذا التاريخ' : 'حتى الآن'}</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: 'rgba(255, 255, 255, 0.7)' }}>وقت المكالمة</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: 'rgba(255, 255, 255, 0.7)' }}>رقم العميل</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: 'rgba(255, 255, 255, 0.7)' }}>مدة المكالمة</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: 'rgba(255, 255, 255, 0.7)' }}>الحالة</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: 'rgba(255, 255, 255, 0.7)' }}>التصنيف</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: 'rgba(255, 255, 255, 0.7)' }}>الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {calls.map(call => (
                                    <tr key={call.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.02)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: '600' }}>{new Date(call.timestamp).toLocaleTimeString('en-US')}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>{new Date(call.timestamp).toLocaleDateString('en-US')}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{call.callerNumber || call.caller_number}</td>
                                        <td style={{ padding: '1rem' }}>
                                            {call.duration ? `${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, '0')}` : '-'}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {(() => {
                                                const statusText = (call.form_data && call.form_data.terminationProcedure) ||
                                                    (call.formData && call.formData.terminationProcedure) ||
                                                    (call.status === 'Successful' ? 'ناجحة' : call.status);

                                                let color = '#60a5fa';
                                                let bg = 'rgba(59, 130, 246, 0.15)';
                                                let border = 'rgba(59, 130, 246, 0.3)';

                                                if (statusText.includes('ناجحة') || statusText === 'Successful') {
                                                    color = '#34d399';
                                                    bg = 'rgba(16, 185, 129, 0.15)';
                                                    border = 'rgba(16, 185, 129, 0.3)';
                                                } else if (statusText.includes('مقطوعة')) {
                                                    color = '#fb923c'; // Orange
                                                    bg = 'rgba(249, 115, 22, 0.15)';
                                                    border = 'rgba(249, 115, 22, 0.3)';
                                                } else if (statusText.includes('مزعج') || statusText.includes('فاشلة')) {
                                                    color = '#f87171'; // Red
                                                    bg = 'rgba(239, 68, 68, 0.15)';
                                                    border = 'rgba(239, 68, 68, 0.3)';
                                                }

                                                return (
                                                    <span style={{
                                                        padding: '4px 10px',
                                                        borderRadius: '20px',
                                                        fontSize: '0.8rem',
                                                        fontWeight: '600',
                                                        background: bg,
                                                        color: color,
                                                        border: `1px solid ${border}`
                                                    }}>
                                                        {statusText}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {((call.classificationPath || call.classification_path) || []).length > 0 ? (
                                                <div style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {((call.classificationPath || call.classification_path) || []).slice(-1)[0]}
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <button
                                                onClick={() => onViewCallDetails(call)}
                                                style={{
                                                    background: 'rgba(59, 130, 246, 0.1)',
                                                    color: '#60a5fa',
                                                    border: '1px solid rgba(59, 130, 246, 0.2)',
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '8px',
                                                    fontSize: '0.85rem',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}
                                            >
                                                <Eye size={16} /> التفاصيل
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Export Modal */}
            {isExportModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(5px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    direction: 'rtl'
                }}>
                    <div style={{
                        background: '#1e293b',
                        padding: '2rem',
                        borderRadius: '16px',
                        width: '90%',
                        maxWidth: '500px',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>تصدير سجلات الموظف</h3>
                            <button onClick={() => setIsExportModalOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <p style={{ marginBottom: '1rem', color: 'rgba(255,255,255,0.7)' }}>حدد الأعمدة التي تريد تضمينها في ملف Excel:</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                                {availableColumns.map(col => (
                                    <div
                                        key={col.key}
                                        onClick={() => toggleColumn(col.key)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.75rem',
                                            background: selectedColumns.includes(col.key) ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.03)',
                                            border: `1px solid ${selectedColumns.includes(col.key) ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`,
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {selectedColumns.includes(col.key) ? <CheckSquare size={18} color="#3b82f6" /> : <Square size={18} color="rgba(255,255,255,0.5)" />}
                                        <span style={{ fontSize: '0.9rem' }}>{col.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={handleExport}
                                disabled={selectedColumns.length === 0}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    background: selectedColumns.length === 0 ? 'rgba(255,255,255,0.1)' : '#10b981',
                                    color: selectedColumns.length === 0 ? 'rgba(255,255,255,0.3)' : 'white',
                                    border: 'none',
                                    cursor: selectedColumns.length === 0 ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <Download size={18} /> تصدير الملف
                            </button>
                            <button
                                onClick={() => setIsExportModalOpen(false)}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    cursor: 'pointer'
                                }}
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgentDetailsView;
