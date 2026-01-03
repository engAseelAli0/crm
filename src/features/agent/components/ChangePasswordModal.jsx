import React, { useState } from 'react';
import { X, Lock, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../shared/components/Toast';

const ChangePasswordModal = ({ isOpen, onClose }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword.length < 6) {
            toast.error('كلمة المرور قصيرة', 'يجب أن تكون كلمة المرور 6 أحرف على الأقل');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('غير متطابقة', 'كلمات المرور غير متطابقة');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });

            if (error) throw error;

            toast.success('تم بنجاح', 'تم تغيير كلمة المرور بنجاح');
            setNewPassword('');
            setConfirmPassword('');
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('حدث خطأ', 'فشل تغيير كلمة المرور');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(5px)', backgroundColor: 'rgba(0,0,0,0.5)'
        }}>
            <div style={{
                background: '#1e293b', width: '100%', maxWidth: '400px',
                borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                overflow: 'hidden', animation: 'fadeIn 0.2s ease-out'
            }}>
                <div style={{
                    padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', color: '#3b82f6' }}>
                            <Lock size={20} />
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#e2e8f0', margin: 0 }}>تغيير كلمة المرور</h3>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem' }}>كلمة المرور الجديدة</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            style={{
                                width: '100%', padding: '0.75rem', borderRadius: '8px',
                                background: '#0f172a', border: '1px solid #334155',
                                color: '#e2e8f0', fontSize: '1rem', outline: 'none'
                            }}
                            placeholder="أدخل كلمة مرور قوية"
                            dir="rtl"
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem' }}>تأكيد كلمة المرور</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            style={{
                                width: '100%', padding: '0.75rem', borderRadius: '8px',
                                background: '#0f172a', border: '1px solid #334155',
                                color: '#e2e8f0', fontSize: '1rem', outline: 'none'
                            }}
                            placeholder="أعد كتابة كلمة المرور"
                            dir="rtl"
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '0.6rem 1.2rem', borderRadius: '8px',
                                background: 'transparent', border: '1px solid #334155',
                                color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem'
                            }}
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '0.6rem 1.5rem', borderRadius: '8px',
                                background: '#3b82f6', border: 'none',
                                color: 'white', cursor: loading ? 'wait' : 'pointer', fontSize: '0.9rem',
                                display: 'flex', alignItems: 'center', gap: '0.5rem'
                            }}
                        >
                            {loading ? 'جاري الحفظ...' : (
                                <>
                                    <span>حفظ التغييرات</span>
                                    <Save size={16} />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
