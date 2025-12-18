import React, { useState } from 'react';
import { Search, Eye, Clock, Calendar } from 'lucide-react';
import styles from './CallHistoryList.module.css';

const CallHistoryList = ({ calls, onViewDetails, compact = false }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCalls = calls.filter(c =>
        (c.callerNumber && c.callerNumber.includes(searchTerm)) ||
        (c.phone && c.phone.includes(searchTerm))
    );

    return (
        <div className={styles.container} style={compact ? { background: 'transparent', border: 'none', padding: 0 } : {}}>
            {!compact && (
                <div className={styles.header}>
                    <h3 className={styles.title}>
                        آخر المكالمات ({calls.length})
                    </h3>
                    <div className={styles.searchBox}>
                        <Search size={18} color="#94a3b8" />
                        <input
                            type="text"
                            placeholder="ابحث في المكالمات..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                </div>
            )}

            <div className={styles.list}>
                {filteredCalls.length === 0 ? (
                    <div className={styles.empty}>لا توجد مكالمات </div>
                ) : (
                    filteredCalls.map((call, index) => {
                        const statusText = (call.form_data && call.form_data.terminationProcedure) ||
                            (call.formData && call.formData.terminationProcedure) ||
                            (call.status === 'Successful' ? 'مكتملة' : (call.status === 'Active' ? 'نشطة' : 'ملغاة'));

                        let statusClass = styles.statusCancelled;
                        if (statusText) {
                            if (statusText.includes('ناجحة') || statusText.includes('مكتملة') || statusText === 'Successful') {
                                statusClass = styles.statusSuccess;
                            } else if (statusText.includes('مقطوعة')) {
                                statusClass = styles.statusDisconnected;
                            } else if (statusText.includes('مزعج')) {
                                statusClass = styles.statusAnnoying;
                            }
                        }

                        return (
                            <div key={call.id || index} className={styles.item}>
                                <div className={styles.itemInfo}>
                                    <div className={styles.itemHeader}>
                                        <span className={styles.number}>
                                            {call.callerNumber || call.phone || 'غير متوفر'}
                                        </span>
                                        <span className={`${styles.status} ${statusClass}`}>
                                            {statusText}
                                        </span>
                                    </div>
                                    <div className={styles.itemMeta}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Calendar size={12} />
                                            {new Date(call.timestamp).toLocaleDateString('en-US')}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={12} />
                                            {new Date(call.timestamp).toLocaleTimeString('en-US')}
                                        </span>
                                        {call.duration && (
                                            <span>
                                                {`${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, '0')}`}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={() => onViewDetails && onViewDetails(call)}
                                    className={styles.eyeButton}
                                    title="التفاصيل"
                                >
                                    <Eye size={18} />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default CallHistoryList;
