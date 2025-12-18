import React from 'react';
import { PhoneCall, CheckCircle, Shield, User as UserIcon, Edit, Trash2 } from 'lucide-react';
import UserAvatar from '../../../shared/components/UserAvatar';
import styles from './UserRow.module.css';
import { ROLES } from '../../../shared/constants/permissions';

const UserRow = ({ user, onEdit, onDelete, calls }) => {
    const userCalls = calls.filter(c => c.agentId === user.id || c.agent_id === user.id);
    const successfulCalls = userCalls.filter(c => c.status === 'Successful').length;

    return (
        <tr className={styles.row}>
            <td className={styles.cell}>
                <div className={styles.userCell}>
                    <UserAvatar user={user} size={48} />
                    <div>
                        <div className={styles.userName}>{user.name}</div>
                        <div className={styles.userHandle}>@{user.username}</div>
                    </div>
                </div>
            </td>
            <td className={styles.cell}>
                <div className={styles.statsCell}>
                    <div className={styles.statRow}>
                        <PhoneCall size={14} color="rgba(255, 255, 255, 0.5)" />
                        <span className={styles.statText}>{userCalls.length} مكالمة</span>
                    </div>
                    <div className={styles.statRow}>
                        <CheckCircle size={14} color="rgba(255, 255, 255, 0.5)" />
                        <span className={styles.statText}>{successfulCalls} ناجحة</span>
                    </div>
                </div>
            </td>
            <td className={styles.cell}>
                <div className={`${styles.roleBadge} ${user.role === 'ADMIN' ? styles.roleAdmin : styles.roleAgent}`}>
                    {user.role === 'ADMIN' ? <Shield size={16} /> : <UserIcon size={16} />}
                    {ROLES[user.role]?.label || user.role}
                </div>
            </td>
            <td className={styles.cell}>
                <div className={styles.actions}>
                    <button
                        onClick={() => onEdit(user)}
                        className={`${styles.iconBtn} ${styles.btnEdit}`}
                        title="تعديل"
                    >
                        <Edit size={18} />
                    </button>
                    <button
                        onClick={() => onDelete(user.id)}
                        className={`${styles.iconBtn} ${styles.btnDelete} ${user.username === 'admin' ? styles.btnDisabled : ''}`}
                        disabled={user.username === 'admin'}
                        title={user.username === 'admin' ? 'لا يمكن حذف الحساب الرئيسي' : 'حذف'}
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default UserRow;
