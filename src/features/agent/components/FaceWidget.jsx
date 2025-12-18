import React, { useRef, useState, useEffect } from 'react';
import { Smartphone, Phone } from 'lucide-react';
import styles from './FaceWidget.module.css';

const FaceWidget = ({ title, subtitle, showActions, onSimulateCall, onManualCall }) => {
    const faceRef = useRef(null);
    const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!faceRef.current) return;
            const rect = faceRef.current.getBoundingClientRect();
            const faceCenterX = rect.left + rect.width / 2;
            const faceCenterY = rect.top + rect.height / 2;

            const angle = Math.atan2(e.clientY - faceCenterY, e.clientX - faceCenterX);
            const distance = Math.min(10, Math.hypot(e.clientX - faceCenterX, e.clientY - faceCenterY) / 10);

            setEyePosition({
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.pulseBg} />

            <div ref={faceRef} className={styles.face}>
                <div className={styles.eyesContainer}>
                    <div className={styles.eye}>
                        <div
                            className={styles.pupil}
                            style={{ transform: `translate(-50%, -50%) translate(${eyePosition.x}px, ${eyePosition.y}px)` }}
                        />
                    </div>
                    <div className={styles.eye}>
                        <div
                            className={styles.pupil}
                            style={{ transform: `translate(-50%, -50%) translate(${eyePosition.x}px, ${eyePosition.y}px)` }}
                        />
                    </div>
                </div>
                <div className={styles.mouth} />
            </div>

            <h2 className={styles.title}>{title}</h2>
            <p className={styles.subtitle}>{subtitle}</p>

            {showActions && (
                <div className={styles.actions}>
                    <button onClick={onSimulateCall} className={`${styles.actionBtn} ${styles.actionBtnGreen}`}>
                        <Smartphone size={20} /> محاكاة مكالمة
                    </button>
                    <button onClick={onManualCall} className={styles.actionBtn}>
                        <Phone size={20} /> مكالمة يدوية
                    </button>
                </div>
            )}
        </div>
    );
};

export default FaceWidget;
