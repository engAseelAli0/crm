import React from 'react';
import { TrendingUp } from 'lucide-react';
import styles from './StatsCard.module.css';

const StatsCard = ({ title, value, icon: Icon, color, change, trend }) => (
    <div className={styles.card}>
        <div className={styles.orb} style={{ background: color }} />

        <div className={styles.content}>
            <div>
                <div className={styles.title}>{title}</div>
                <div
                    className={styles.value}
                    style={{ backgroundImage: `linear-gradient(135deg, ${color}, ${color}CC)` }}
                >
                    {value}
                </div>
            </div>

            <div
                className={styles.iconWrapper}
                style={{
                    background: `${color}20`,
                    border: `1px solid ${color}40`
                }}
            >
                <Icon size={24} color={color} />
            </div>
        </div>

        {change && (
            <div
                className={styles.footer}
                style={{ color: change.startsWith('+') ? '#10b981' : '#ef4444' }}
            >
                {change.startsWith('+') ? (
                    <TrendingUp size={14} />
                ) : (
                    <TrendingUp size={14} style={{ transform: 'rotate(180deg)' }} />
                )}
                <span>{change}</span>
                {trend && <span className={styles.trend}>{trend}</span>}
            </div>
        )}
    </div>
);

export default StatsCard;
