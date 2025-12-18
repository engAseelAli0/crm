import React from 'react';
import styles from './SidebarItem.module.css';

const SidebarItem = ({ icon: Icon, label, active, onClick, collapsed, badge }) => (
    <button
        onClick={onClick}
        className={`${styles.item} ${active ? styles.active : ''} ${collapsed ? styles.collapsed : ''}`}
    >
        <Icon size={20} />
        {!collapsed && (
            <>
                <span className={styles.label}>{label}</span>
                {badge !== null && badge !== undefined && (
                    <span className={styles.badge}>
                        {badge}
                    </span>
                )}
            </>
        )}
        {collapsed && badge !== null && badge !== undefined && (
            <span className={styles.collapsedBadge}>
                {badge}
            </span>
        )}
    </button>
);

export default SidebarItem;
