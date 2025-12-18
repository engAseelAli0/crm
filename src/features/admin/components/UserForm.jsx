import React, { useState, useEffect } from 'react';
import { User as UserIcon, Lock, Shield } from 'lucide-react';
import PermissionSelector from './PermissionSelector'; // Kept if needed, but unused now
import { ROLES, PERMISSION_LABELS } from '../../../shared/constants/permissions';
import { useLanguage } from '../../../shared/context/LanguageContext';

// Using inline styles for simplicity in form, or could extract. 
// Given it's a simple form, I'll keep it self-contained but clean.

const inputStyle = {
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: '12px',
    padding: '0.75rem 1rem',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    width: '100%',
    paddingLeft: '40px',
    boxSizing: 'border-box'
};

const labelStyle = {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'var(--text-secondary)'
};

const iconStyle = {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-secondary)'
};

const UserForm = ({ initialData, onChange, onSubmit, onCancel }) => {
    const { t } = useLanguage();
    const [form, setForm] = useState(initialData || {
        name: '',
        username: '',
        password: '',
        role: 'AGENT',
        permissions: ROLES.AGENT.permissions
    });

    useEffect(() => {
        if (initialData) {
            setForm(initialData);
        }
    }, [initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(form);
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
                <label style={labelStyle}>{t('users.name')}</label>
                <div style={{ position: 'relative' }}>
                    <UserIcon size={18} style={iconStyle} />
                    <input
                        type="text"
                        style={inputStyle}
                        placeholder={t('users.name')}
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        required
                    />
                </div>
            </div>

            <div>
                <label style={labelStyle}>{t('users.username')}</label>
                <div style={{ position: 'relative' }}>
                    <UserIcon size={18} style={iconStyle} />
                    <input
                        type="text"
                        style={inputStyle}
                        placeholder={t('users.username')}
                        value={form.username}
                        onChange={e => setForm({ ...form, username: e.target.value })}
                        required
                    />
                </div>
            </div>

            <div>
                <label style={labelStyle}>{t('users.password')}</label>
                <div style={{ position: 'relative' }}>
                    <Lock size={18} style={iconStyle} />
                    <input
                        type="text"
                        style={inputStyle}
                        placeholder={t('users.password')}
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        required={!initialData}
                    />
                </div>
            </div>

            <div>
                <label style={labelStyle}>{t('users.role')}</label>
                <div style={{ position: 'relative' }}>
                    <Shield size={18} style={iconStyle} />
                    <select
                        style={{ ...inputStyle, appearance: 'none' }}
                        value={form.role}
                        onChange={e => {
                            const newRole = e.target.value;
                            const roleDef = ROLES[newRole];
                            setForm({
                                ...form,
                                role: newRole,
                                permissions: roleDef ? roleDef.permissions : []
                            });
                        }}
                    >
                        {Object.entries(ROLES).map(([key, roleData]) => (
                            <option key={key} value={key} style={{ color: 'black' }}>
                                {t(`roles.${key.toLowerCase()}`) || roleData.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {form.role && ROLES[form.role] && (
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                    <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#e2e8f0' }}>{t('users.permissionsGiven')}:</strong>
                    <ul style={{ listStyle: 'disc', paddingRight: '1.5rem', margin: 0 }}>
                        {ROLES[form.role].permissions.map(p => (
                            <li key={p}>{PERMISSION_LABELS[p] || p}</li>
                        ))}
                    </ul>
                </div>
            )}

            <button type="submit" style={{
                marginTop: '1rem',
                justifyContent: 'center',
                padding: '1rem',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.95rem'
            }}>
                {initialData ? t('common.save') : t('users.addUser')}
            </button>
        </form>
    );
};

export default UserForm;
