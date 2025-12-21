import React, { useState, useEffect } from 'react';
import { Bell, Clock, AlertCircle, Phone, FileText, CheckCircle } from 'lucide-react';
import { DataManager } from '../../../shared/utils/DataManager';

const ReminderView = ({ user, onReminderAdded }) => {
    const [reminders, setReminders] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('active'); // 'active' | 'resolved'
    const [currentTime, setCurrentTime] = useState(new Date());

    // Form State
    const [formData, setFormData] = useState({
        phoneNumber: '',
        durationHours: '24', // Default 24h
        reason: '',
        customHours: '',
        customUnit: 'hours'
    });

    useEffect(() => {
        loadReminders();
    }, [user.id, activeTab]);

    // Real-time timer update
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const loadReminders = async () => {
        setIsLoading(true);
        const status = activeTab === 'active' ? 'pending' : 'resolved';
        const data = await DataManager.getReminders(user.id, status);
        setReminders(data);
        setIsLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.phoneNumber || !formData.reason) return;

        let finalDuration = parseInt(formData.durationHours);
        if (formData.durationHours === 'custom') {
            finalDuration = parseInt(formData.customHours);
            if (!finalDuration || finalDuration <= 0) return;
        }

        setIsLoading(true);
        await DataManager.addReminder({
            agentId: user.id,
            phoneNumber: formData.phoneNumber,
            reason: formData.reason,
            durationHours: finalDuration,
            durationUnit: formData.durationHours === 'custom' ? (formData.customUnit || 'hours') : 'hours'
        });

        // Notify dashboard to sync
        if (onReminderAdded) onReminderAdded();

        // Reset form and reload
        setFormData({ phoneNumber: '', durationHours: '24', reason: '', customHours: '', customUnit: 'hours' });
        await loadReminders();
        setIsLoading(false);
    };

    const handleResolve = async (id) => {
        setIsLoading(true);
        await DataManager.resolveReminder(id);
        await loadReminders();
        setIsLoading(false);
    };

    const calculateTimeLeft = (expiresAt) => {
        const diff = new Date(expiresAt) - currentTime;
        if (diff <= 0) return { text: 'منتهية', expired: true };

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        let parts = [];
        if (hours > 0) parts.push(`${hours} ساعة`);
        if (minutes > 0) parts.push(`${minutes} دقيقة`);
        parts.push(`${seconds} ثانية`);

        return { text: parts.join(' و '), expired: false };
    };

    return (
        <div className="custom-scrollbar" style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
                    <Bell size={32} color="#f59e0b" />
                    تذكيرات الحظر
                </h2>

                <div style={{
                    display: 'flex', background: 'rgba(30, 41, 59, 0.4)',
                    padding: '4px', borderRadius: '12px', border: '1px solid rgba(148, 163, 184, 0.1)'
                }}>
                    <button
                        onClick={() => setActiveTab('active')}
                        style={{
                            padding: '8px 20px', borderRadius: '8px', border: 'none',
                            background: activeTab === 'active' ? '#3b82f6' : 'transparent',
                            color: activeTab === 'active' ? 'white' : '#94a3b8',
                            cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s'
                        }}
                    >
                        نشطة
                    </button>
                    <button
                        onClick={() => setActiveTab('resolved')}
                        style={{
                            padding: '8px 20px', borderRadius: '8px', border: 'none',
                            background: activeTab === 'resolved' ? '#10b981' : 'transparent',
                            color: activeTab === 'resolved' ? 'white' : '#94a3b8',
                            cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s'
                        }}
                    >
                        محلوّلة
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem', alignItems: 'start' }}>

                {/* Form Section */}
                <div style={{
                    background: 'rgba(30, 41, 59, 0.4)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(148, 163, 184, 0.1)',
                    borderRadius: '24px',
                    padding: '2rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={20} color="#60a5fa" />
                        إضافة تذكير جديد
                    </h3>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>رقم الهاتف المحظور</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    placeholder="أدخل رقم الهاتف..."
                                    style={{
                                        width: '100%', padding: '1rem 1rem 1rem 3rem',
                                        background: 'rgba(15, 23, 42, 0.6)',
                                        border: '1px solid rgba(148, 163, 184, 0.2)',
                                        borderRadius: '12px', color: 'white', fontSize: '1rem'
                                    }}
                                />
                                <Phone size={18} color="#64748b" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>مدة الحظر</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, durationHours: '24' })}
                                    style={{
                                        padding: '0.75rem', borderRadius: '12px',
                                        border: formData.durationHours === '24' ? '2px solid #3b82f6' : '1px solid rgba(148, 163, 184, 0.2)',
                                        background: formData.durationHours === '24' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(15, 23, 42, 0.6)',
                                        color: formData.durationHours === '24' ? '#60a5fa' : '#94a3b8',
                                        cursor: 'pointer', fontWeight: 'bold'
                                    }}
                                >
                                    24 ساعة
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, durationHours: '48' })}
                                    style={{
                                        padding: '0.75rem', borderRadius: '12px',
                                        border: formData.durationHours === '48' ? '2px solid #3b82f6' : '1px solid rgba(148, 163, 184, 0.2)',
                                        background: formData.durationHours === '48' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(15, 23, 42, 0.6)',
                                        color: formData.durationHours === '48' ? '#60a5fa' : '#94a3b8',
                                        cursor: 'pointer', fontWeight: 'bold'
                                    }}
                                >
                                    48 ساعة
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, durationHours: 'custom' })}
                                    style={{
                                        padding: '0.75rem', borderRadius: '12px',
                                        border: formData.durationHours === 'custom' ? '2px solid #3b82f6' : '1px solid rgba(148, 163, 184, 0.2)',
                                        background: formData.durationHours === 'custom' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(15, 23, 42, 0.6)',
                                        color: formData.durationHours === 'custom' ? '#60a5fa' : '#94a3b8',
                                        cursor: 'pointer', fontWeight: 'bold'
                                    }}
                                >
                                    مخصص
                                </button>
                            </div>

                            {formData.durationHours === 'custom' && (
                                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <input
                                            type="number"
                                            value={formData.customHours || ''}
                                            onChange={(e) => setFormData({ ...formData, customHours: e.target.value })}
                                            placeholder="المدة"
                                            min="1"
                                            style={{
                                                width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)',
                                                border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '10px', color: 'white'
                                            }}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <select
                                            value={formData.customUnit || 'hours'}
                                            onChange={(e) => setFormData({ ...formData, customUnit: e.target.value })}
                                            style={{
                                                width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)',
                                                border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '10px', color: 'white'
                                            }}
                                        >
                                            <option value="hours">ساعات</option>
                                            <option value="minutes">دقائق</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>سبب الحظر / ملاحظات</label>
                            <textarea
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                placeholder="اكتب سبب الحظر هنا..."
                                rows={4}
                                style={{
                                    width: '100%', padding: '1rem', background: 'rgba(15, 23, 42, 0.6)',
                                    border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '12px', color: 'white', resize: 'vertical'
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                padding: '1rem', borderRadius: '12px', border: 'none',
                                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                color: 'white', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer',
                                opacity: isLoading ? 0.7 : 1
                            }}
                        >
                            {isLoading ? 'جاري الحفظ...' : 'تفعيل التذكير'}
                        </button>
                    </form>
                </div>

                {/* List Section */}
                <div>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {activeTab === 'active' ? <AlertCircle size={20} color="#f43f5e" /> : <CheckCircle size={20} color="#10b981" />}
                        {activeTab === 'active' ? 'التذكيرات النشطة' : 'الأرشيف المحلول'}
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {reminders.length === 0 ? (
                            <div style={{
                                padding: '3rem', textAlign: 'center', color: '#64748b',
                                background: 'rgba(30, 41, 59, 0.2)', borderRadius: '16px', border: '1px dashed rgba(148, 163, 184, 0.2)'
                            }}>
                                <CheckCircle size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                <p>لا توجد تذكيرات {activeTab === 'active' ? 'نشطة' : 'محلوّلة'} حالياً</p>
                            </div>
                        ) : (
                            reminders.map(reminder => {
                                const timeLeft = calculateTimeLeft(reminder.expires_at);
                                return (
                                    <div key={reminder.id} style={{
                                        background: 'rgba(30, 41, 59, 0.4)', padding: '1.5rem', borderRadius: '16px',
                                        border: '1px solid rgba(148, 163, 184, 0.1)', display: 'flex',
                                        justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#f8fafc', fontFamily: 'monospace' }}>
                                                    {reminder.phone_number}
                                                </span>
                                                <span style={{
                                                    background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b',
                                                    padding: '2px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold'
                                                }}>
                                                    {reminder.duration_hours} {reminder.duration_unit === 'minutes' ? 'دقيقة' : 'ساعة'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.95rem' }}>
                                                <FileText size={14} />
                                                {reminder.reason}
                                            </div>
                                        </div>

                                        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                            {activeTab === 'active' ? (
                                                <>
                                                    <div style={{ textAlign: 'left' }}>
                                                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>المتبقي</div>
                                                        <div style={{ color: timeLeft.expired ? '#ef4444' : '#34d399', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                            {timeLeft.text}
                                                        </div>
                                                    </div>
                                                    {timeLeft.expired && (
                                                        <button
                                                            onClick={() => handleResolve(reminder.id)}
                                                            style={{
                                                                padding: '6px 16px', background: 'rgba(16, 185, 129, 0.1)',
                                                                border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px',
                                                                color: '#34d399', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer'
                                                            }}
                                                        >
                                                            تم الحل
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: 'bold' }}>
                                                    <CheckCircle size={16} /> مكتمل
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReminderView;
