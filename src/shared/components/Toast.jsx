import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import styles from './Toast.module.css';

const ToastContext = createContext(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((type, title, message, duration = 4000) => {
        const id = Date.now().toString() + Math.random().toString();
        setToasts(prev => [...prev, { id, type, title, message, duration, isExiting: false }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, isExiting: true } : t));
        // Actual removal after animation
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 300); // Match CSS animation duration
    }, []);

    const value = {
        success: (title, message) => addToast('success', title, message),
        error: (title, message) => addToast('error', title, message),
        warning: (title, message) => addToast('warning', title, message),
        info: (title, message) => addToast('info', title, message),
        addToast
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className={styles.toastContainer}>
                {toasts.map(toast => (
                    <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

const ToastItem = ({ toast, onRemove }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onRemove(toast.id);
        }, toast.duration);

        return () => clearTimeout(timer);
    }, [toast.id, toast.duration, onRemove]);

    const icons = {
        success: <CheckCircle size={20} />,
        error: <XCircle size={20} />,
        warning: <AlertTriangle size={20} />,
        info: <Info size={20} />
    };

    return (
        <div
            className={`${styles.toast} ${styles[toast.type]} ${toast.isExiting ? styles.exiting : ''}`}
            role="alert"
        >
            <div className={styles.iconWrapper}>
                {icons[toast.type]}
            </div>
            <div className={styles.content}>
                <div className={styles.title}>{toast.title}</div>
                {toast.message && <div className={styles.message}>{toast.message}</div>}
            </div>
            <button className={styles.closeBtn} onClick={() => onRemove(toast.id)}>
                <X size={16} />
            </button>
            <div
                className={styles.progressBar}
                style={{ animationDuration: `${toast.duration}ms` }}
            />
        </div>
    );
};

export default ToastProvider;
