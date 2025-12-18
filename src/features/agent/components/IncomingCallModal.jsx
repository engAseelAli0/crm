import React from 'react';
import { Phone, PhoneOff, PhoneCall } from 'lucide-react';
import styles from './IncomingCallModal.module.css';

const IncomingCallModal = ({ call, onAccept, onReject }) => {
    if (!call) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.card}>
                <div className={styles.iconWrapper}>
                    <div className={styles.phoneIcon}>
                        <Phone size={48} color="white" />
                    </div>
                    <div className={styles.ripple} />
                </div>

                <div className={styles.info}>
                    <h2 className={styles.title}>📞 مكالمة واردة</h2>
                    <div className={styles.number}>
                        {call.number}
                    </div>
                    <div className={styles.time}>
                        {call.time.toLocaleTimeString('ar-SA')}
                    </div>
                </div>

                <div className={styles.actions}>
                    <button
                        onClick={onReject}
                        className={`${styles.btn} ${styles.btnReject}`}
                        title="رفض"
                    >
                        <PhoneOff size={32} />
                    </button>
                    <button
                        onClick={onAccept}
                        className={`${styles.btn} ${styles.btnAccept}`}
                        title="قبول"
                    >
                        <PhoneCall size={32} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IncomingCallModal;
