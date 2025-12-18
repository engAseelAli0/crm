import React from 'react';
import { ChevronRight } from 'lucide-react';
import UserAvatar from '../../../shared/components/UserAvatar';
import styles from './AgentCard.module.css';

const AgentCard = ({ agent, onClick }) => (
    <div className={styles.card} onClick={onClick}>
        <div className={styles.header}>
            <div className={styles.profile}>
                <UserAvatar user={agent} size={48} />
                <div>
                    <div className={styles.name}>{agent.name}</div>
                    <div className={styles.role}>
                        {agent.role === 'AGENT' ? 'موظف خدمة عملاء' : 'مدير'}
                    </div>
                </div>
            </div>
            <ChevronRight size={20} color="rgba(255, 255, 255, 0.4)" style={{ transform: 'rotate(180deg)' }} />
        </div>

        <div className={styles.statsGrid}>
            <div className={styles.statItem}>
                <div className={`${styles.statValue} ${styles.colorBlue}`}>{agent.totalCalls}</div>
                <div className={styles.statLabel}>مكالمات</div>
            </div>
            <div className={styles.statItem}>
                <div className={`${styles.statValue} ${styles.colorGreen}`}>{agent.resolutionRate}</div>
                <div className={styles.statLabel}>معدل الحل</div>
            </div>
            <div className={styles.statItem}>
                <div className={`${styles.statValue} ${styles.colorOrange}`}>{agent.avgDuration}</div>
                <div className={styles.statLabel}>متوسط مدة</div>
            </div>
        </div>
    </div>
);

export default AgentCard;
