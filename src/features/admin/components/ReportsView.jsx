import React, { useState } from 'react';
import {
    BarChart3, FileText, Download, Filter,
    Calendar, CheckCircle, Search
} from 'lucide-react';
import { ReportGenerator } from '../../../shared/utils/ReportGenerator';

// Style constants (reusing or defining new ones to be self-contained)
const styles = {
    glassPanel: {
        background: 'rgba(30, 41, 59, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        backdropFilter: 'blur(10px)',
        color: 'white'
    },
    sectionTitle: {
        fontSize: '1.1rem',
        fontWeight: '700',
        marginBottom: '1rem',
        color: 'white'
    },
    input: {
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        padding: '0.6rem 1rem',
        color: 'white',
        fontSize: '0.9rem',
    },
    button: {
        padding: '0.6rem 1.2rem',
        borderRadius: '8px',
        fontWeight: '600',
        cursor: 'pointer',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.9rem'
    },
    primaryBtn: {
        background: '#3b82f6',
        color: 'white'
    },
    secondaryBtn: {
        background: 'rgba(255, 255, 255, 0.1)',
        color: 'white'
    },
    checkbox: {
        cursor: 'pointer',
        accentColor: '#3b82f6'
    }
};

const AVAILABLE_COLUMNS = {
    calls: [
        { key: 'callerNumber', label: 'رقم العميل' },
        { key: 'status', label: 'الحالة' },
        { key: 'duration', label: 'المدة (ثواني)' },
        { key: 'timestamp', label: 'الوقت والتاريخ' },
        { key: 'agentName', label: 'اسم الموظف' },
        { key: 'terminationProcedure', label: 'إجراء الإنهاء' },
        { key: 'classification', label: 'التصنيف' },
        { key: 'note', label: 'ملاحظات' }
    ],
    agents: [
        { key: 'name', label: 'اسم الموظف' },
        { key: 'username', label: 'اسم المستخدم' },
        { key: 'totalCalls', label: 'إجمالي المكالمات' },
        { key: 'successfulCalls', label: 'المكالمات الناجحة' },
        { key: 'resolutionRate', label: 'نسبة الحل' },
        { key: 'avgDuration', label: 'متوسط المدة' }
    ]
};

const ReportsView = ({ calls, users }) => {
    const [reportConfig, setReportConfig] = useState({
        source: 'calls',
        dateRange: 'all',
        startDate: '',
        endDate: '',
        selectedColumns: ['callerNumber', 'status', 'timestamp', 'agentName'],
        filters: {}
    });

    const formatDuration = (seconds) => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

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
                        `${Math.floor(agentCalls.reduce((sum, call) => sum + (call.duration || 0), 0) / agentCalls.length / 60)}:${(Math.floor(agentCalls.reduce((sum, call) => sum + (call.duration || 0), 0) / agentCalls.length) % 60).toString().padStart(2, '0')}` : '0:00'
                };
            });
    };

    const getFilteredReportData = () => {
        let data = [];
        if (reportConfig.source === 'calls') {
            data = calls.map(c => {
                const agent = users.find(u => u.id === c.agentId || u.id === c.agent_id);
                return {
                    ...c,
                    agentName: agent ? agent.name : 'Unknown',
                    terminationProcedure: (c.form_data && c.form_data.terminationProcedure) || (c.formData && c.formData.terminationProcedure) || '-',
                    classification: ((c.classificationPath || c.classification_path) || []).join(' > ')
                };
            });
        } else if (reportConfig.source === 'agents') {
            data = getAgentStats();
        }

        if (reportConfig.dateRange === 'custom' && reportConfig.startDate && reportConfig.endDate) {
            const start = new Date(reportConfig.startDate);
            const end = new Date(reportConfig.endDate);
            end.setHours(23, 59, 59);

            data = data.filter(item => {
                const d = new Date(item.timestamp || item.created_at || new Date());
                return d >= start && d <= end;
            });
        }

        return data;
    };

    const handleReportExport = async (type) => {
        let data = getFilteredReportData();
        const columns = AVAILABLE_COLUMNS[reportConfig.source].filter(col => reportConfig.selectedColumns.includes(col.key));

        data = data.map(item => ({
            ...item,
            duration: item.duration ? formatDuration(item.duration) : (item.avgDuration || '-')
        }));

        if (type === 'excel') {
            ReportGenerator.exportToExcel(data, columns, `report_${reportConfig.source}_${Date.now()}.xlsx`);
        } else {
            await ReportGenerator.exportToPDF(data, columns, `report_${reportConfig.source}_${Date.now()}.pdf`);
        }
    };

    const toggleColumn = (key) => {
        setReportConfig(prev => {
            const exists = prev.selectedColumns.includes(key);
            return {
                ...prev,
                selectedColumns: exists
                    ? prev.selectedColumns.filter(c => c !== key)
                    : [...prev.selectedColumns, key]
            };
        });
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div style={styles.glassPanel}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h2 style={styles.sectionTitle}>منشئ التقارير المتقدم</h2>
                        <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem' }}>
                            قم بتخصيص وتصدير تقارير مفصلة عن المكالمات والأداء
                        </p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    {/* Source Selection */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#94a3b8' }}>مصدر البيانات</label>
                        <select
                            style={{ ...styles.input, width: '100%' }}
                            value={reportConfig.source}
                            onChange={(e) => setReportConfig(prev => ({ ...prev, source: e.target.value, selectedColumns: [] }))}
                        >
                            <option value="calls" style={{ color: 'black' }}>سجل المكالمات</option>
                            <option value="agents" style={{ color: 'black' }}>أداء الموظفين</option>
                        </select>
                    </div>

                    {/* Date Range */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#94a3b8' }}>النطاق الزمني</label>
                        <select
                            style={{ ...styles.input, width: '100%' }}
                            value={reportConfig.dateRange}
                            onChange={(e) => setReportConfig(prev => ({ ...prev, dateRange: e.target.value }))}
                        >
                            <option value="all" style={{ color: 'black' }}>الكل</option>
                            <option value="custom" style={{ color: 'black' }}>فترة مخصصة</option>
                        </select>

                        {reportConfig.dateRange === 'custom' && (
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <input
                                    type="date"
                                    style={{ ...styles.input, flex: 1 }}
                                    value={reportConfig.startDate}
                                    onChange={(e) => setReportConfig(prev => ({ ...prev, startDate: e.target.value }))}
                                />
                                <span style={{ alignSelf: 'center' }}>-</span>
                                <input
                                    type="date"
                                    style={{ ...styles.input, flex: 1 }}
                                    value={reportConfig.endDate}
                                    onChange={(e) => setReportConfig(prev => ({ ...prev, endDate: e.target.value }))}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Column Selection */}
                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.9rem', color: '#94a3b8' }}>الحقول المطلوبة</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                        {AVAILABLE_COLUMNS[reportConfig.source].map(col => (
                            <label
                                key={col.key}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.5rem 0.75rem',
                                    background: reportConfig.selectedColumns.includes(col.key) ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '8px',
                                    border: reportConfig.selectedColumns.includes(col.key) ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={reportConfig.selectedColumns.includes(col.key)}
                                    onChange={() => toggleColumn(col.key)}
                                    style={{ display: 'none' }}
                                />
                                {reportConfig.selectedColumns.includes(col.key) && <CheckCircle size={14} color="#60a5fa" />}
                                <span>{col.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Preview Table (Simplified for UI) */}
                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '1rem', marginBottom: '2rem', overflowX: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                        <Search size={14} />
                        معاينة النتائج ({getFilteredReportData().length} سجل)
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                {AVAILABLE_COLUMNS[reportConfig.source]
                                    .filter(col => reportConfig.selectedColumns.includes(col.key))
                                    .map(col => (
                                        <th key={col.key} style={{ textAlign: 'right', padding: '0.75rem', color: '#cbd5e1' }}>{col.label}</th>
                                    ))}
                            </tr>
                        </thead>
                        <tbody>
                            {getFilteredReportData().slice(0, 5).map((row, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    {AVAILABLE_COLUMNS[reportConfig.source]
                                        .filter(col => reportConfig.selectedColumns.includes(col.key))
                                        .map(col => {
                                            let val = row[col.key];
                                            if (col.key === 'duration' || col.key === 'avgDuration') {
                                                val = typeof val === 'number' ? formatDuration(val) : val;
                                            }
                                            return <td key={col.key} style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>{val}</td>;
                                        })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div style={{ textAlign: 'center', padding: '1rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
                        عرض 5 من أصل {getFilteredReportData().length}
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button
                        onClick={() => handleReportExport('pdf')}
                        style={{ ...styles.button, ...styles.secondaryBtn }}
                        disabled={reportConfig.selectedColumns.length === 0}
                    >
                        <FileText size={18} />
                        تصدير PDF
                    </button>
                    <button
                        onClick={() => handleReportExport('excel')}
                        style={{ ...styles.button, ...styles.primaryBtn }}
                        disabled={reportConfig.selectedColumns.length === 0}
                    >
                        <Download size={18} />
                        تصدير Excel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportsView;
