import React, { useState, useEffect } from 'react';
import { DataManager } from '../../../shared/utils/DataManager';
import { NAVIGATION_CONFIG, getDefaultModulesForRole } from '../constants/navigationConfig';
import { Save, CheckSquare, Square, User as UserIcon, Shield, Users } from 'lucide-react';
import { useToast } from '../../../shared/components/Toast';

const styles = {
    container: {
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: '2rem',
        height: '100%',
        minHeight: '500px'
    },
    sidebar: {
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '16px',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
    },
    main: {
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '16px',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column'
    },
    userItem: {
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        transition: 'all 0.2s',
        border: '1px solid transparent'
    },
    userItemActive: {
        background: 'rgba(59, 130, 246, 0.15)',
        borderColor: 'rgba(59, 130, 246, 0.3)',
    },
    moduleGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '1rem',
        marginTop: '1.5rem'
    },
    moduleCard: {
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '1rem',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        position: 'relative'
    },
    moduleCardActive: {
        background: 'rgba(16, 185, 129, 0.1)',
        borderColor: 'rgba(16, 185, 129, 0.4)',
    },
    header: {
        marginBottom: '2rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    }
};

const PermissionsManager = () => {
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [currentPermissions, setCurrentPermissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        const allUsers = await DataManager.getUsers();
        // Filter out Super Admin if necessary, or keep all. Let's keep all but exclude current maybe?
        setUsers(allUsers);
    };

    const handleUserSelect = (user) => {
        setSelectedUserId(user.id);
        // If user has saved permissions, use them.
        // Else, calculate default based on role for backward compatibility
        const userPerms = user.permissions || getDefaultModulesForRole(user.role);
        setCurrentPermissions(userPerms);
    };

    const togglePermission = (moduleId) => {
        if (currentPermissions.includes(moduleId)) {
            setCurrentPermissions(currentPermissions.filter(id => id !== moduleId));
        } else {
            setCurrentPermissions([...currentPermissions, moduleId]);
        }
    };

    const handleSave = async () => {
        if (!selectedUserId) return;
        setLoading(true);
        try {
            await DataManager.updateUser(selectedUserId, { permissions: currentPermissions });
            toast.success('تم الحفظ', 'تم تحديث صلاحيات الموظف بنجاح');

            // Update local user list to reflect changes
            setUsers(users.map(u => u.id === selectedUserId ? { ...u, permissions: currentPermissions } : u));
        } catch (error) {
            console.error(error);
            toast.error('خطأ', 'فشل حفظ الصلاحيات');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = () => {
        setCurrentPermissions(NAVIGATION_CONFIG.map(m => m.id));
    };

    const handleDeselectAll = () => {
        setCurrentPermissions([]);
    };

    const selectedUser = users.find(u => u.id === selectedUserId);

    return (
        <div style={styles.container}>
            {/* Sidebar: User List */}
            <div style={styles.sidebar}>
                <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={20} />
                    الموظفين
                </h3>
                <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }} className="custom-scrollbar">
                    {users.map(user => (
                        <div
                            key={user.id}
                            style={{
                                ...styles.userItem,
                                ...(selectedUserId === user.id ? styles.userItemActive : {})
                            }}
                            onClick={() => handleUserSelect(user)}
                        >
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                background: user.role === 'ADMIN' ? '#8b5cf6' : '#3b82f6',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontWeight: 'bold', fontSize: '0.8rem'
                            }}>
                                {user.name.charAt(0)}
                            </div>
                            <div>
                                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{user.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    {user.role === 'ADMIN' ? 'مدير' : user.role === 'AGENT' ? 'خدمة عملاء' : user.role}
                                </div>
                            </div>
                            {user.role === 'ADMIN' && <Shield size={14} color="#a78bfa" style={{ marginLeft: 'auto' }} />}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main: Permissions Grid */}
            <div style={styles.main}>
                {!selectedUser ? (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-secondary)' }}>
                        <Shield size={64} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                        <p>اختر موظفاً لعرض وتعديل صلاحياته</p>
                    </div>
                ) : (
                    <>
                        <div style={styles.header}>
                            <div>
                                <h2 style={{ margin: 0 }}>صلاحيات الوصول</h2>
                                <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    حدد الواجهات التي يمكن لـ <span style={{ color: '#fff', fontWeight: 'bold' }}>{selectedUser.name}</span> الوصول إليها.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button onClick={handleSelectAll} style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '0.9rem' }}>تحديد الكل</button>
                                <button onClick={handleDeselectAll} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.9rem' }}>إلغاء الكل</button>
                            </div>
                        </div>

                        {selectedUser.role === 'ADMIN' && (
                            <div style={{
                                background: 'rgba(59, 130, 246, 0.1)',
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                borderRadius: '8px',
                                padding: '1rem',
                                marginBottom: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                color: '#93c5fd'
                            }}>
                                <Shield size={20} />
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>حساب مدير النظام</div>
                                    <div style={{ fontSize: '0.85rem' }}>المدراء يملكون صلاحية الوصول لجميع الواجهات بشكل افتراضي. التعديل هنا قد لا يؤثر إذا كان النظام يتجاوز التحقق للمدراء.</div>
                                </div>
                            </div>
                        )}

                        <div style={styles.moduleGrid}>
                            {NAVIGATION_CONFIG.map(module => {
                                const isChecked = currentPermissions.includes(module.id);
                                const Icon = module.icon;
                                return (
                                    <div
                                        key={module.id}
                                        style={{
                                            ...styles.moduleCard,
                                            ...(isChecked ? styles.moduleCardActive : {})
                                        }}
                                        onClick={() => togglePermission(module.id)}
                                    >
                                        <div style={{
                                            width: '24px', height: '24px', borderRadius: '50%',
                                            border: `2px solid ${isChecked ? '#10b981' : 'rgba(255,255,255,0.3)'}`,
                                            background: isChecked ? '#10b981' : 'transparent',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'all 0.2s'
                                        }}>
                                            {isChecked && <CheckSquare size={14} color="white" />}
                                        </div>
                                        <div style={{
                                            width: 32, height: 32, borderRadius: 8,
                                            background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Icon size={18} color={isChecked ? '#fff' : '#94a3b8'} />
                                        </div>
                                        <div style={{ fontWeight: '600', color: isChecked ? '#fff' : '#94a3b8' }}>
                                            {module.fallbackLabel}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{ marginTop: 'auto', paddingTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                style={{
                                    padding: '0.75rem 2rem',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                    color: 'white',
                                    fontWeight: '700',
                                    cursor: filter => (loading ? 'wait' : 'pointer'),
                                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                                    opacity: loading ? 0.7 : 1,
                                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
                                }}
                            >
                                <Save size={18} />
                                {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PermissionsManager;
