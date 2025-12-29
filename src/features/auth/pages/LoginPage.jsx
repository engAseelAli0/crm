import React, { useState, useEffect } from 'react';
import { User, Lock, LogIn, Eye, EyeOff, Smartphone, Shield, Sparkles, AlertTriangle } from 'lucide-react';
import { DataManager } from '../../../shared/utils/DataManager'; // Assuming DataManager will be moved later or path adjusted
import styles from './LoginPage.module.css';

const LoginPage = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [particles, setParticles] = useState([]);

    // Particle effect
    useEffect(() => {
        const particleCount = 30;
        const newParticles = [];

        for (let i = 0; i < particleCount; i++) {
            newParticles.push({
                id: i,
                x: Math.random() * 100,
                y: Math.random() * 100,
                size: Math.random() * 3 + 1,
                speed: Math.random() * 0.5 + 0.2,
                direction: Math.random() * 360
            });
        }

        setParticles(newParticles);

        const interval = setInterval(() => {
            setParticles(prev => prev.map(p => ({
                ...p,
                x: (p.x + p.speed * Math.cos(p.direction * Math.PI / 180)) % 100,
                y: (p.y + p.speed * Math.sin(p.direction * Math.PI / 180)) % 100
            })));
        }, 50);

        return () => clearInterval(interval);
    }, []);

    // Check for saved username on mount
    useEffect(() => {
        const savedUsername = localStorage.getItem('remember_me_username');
        if (savedUsername) {
            setUsername(savedUsername);
            setRememberMe(true);
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username.trim() || !password.trim()) {
            setError('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Check where DataManager is located. For now assuming it's in shared/utils
            // But I haven't moved it yet. It's still in src/utils.
            // I'll import from correct relative path for now.
            const user = await DataManager.login(username, password);
            if (user) {
                // Visual success effect
                document.querySelector(`.${styles.loginContainer}`).classList.add(styles.successAnimation);

                // Handle Remember Me
                if (rememberMe) {
                    localStorage.setItem('remember_me_username', username);
                } else {
                    localStorage.removeItem('remember_me_username');
                }

                setTimeout(() => onLogin(user), 800);
            } else {
                setError('اسم المستخدم أو كلمة المرور غير صحيحة');
                // Shake effect on error
                const form = document.querySelector(`.${styles.loginForm}`);
                if (form) {
                    form.classList.add(styles.shakeAnimation);
                    setTimeout(() => {
                        form.classList.remove(styles.shakeAnimation);
                    }, 500);
                }
            }
        } catch (err) {
            console.error(err);
            setError('حدث خطأ في الاتصال بالخادم');
        }

        setLoading(false);
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className={styles.loginContainer}>
            {/* Premium Nebula Background */}
            <div className={styles.nebulaContainer}>
                <div className={`${styles.orb} ${styles.orb1}`} />
                <div className={`${styles.orb} ${styles.orb2}`} />
                <div className={`${styles.orb} ${styles.orb3}`} />
            </div>

            {/* Particles (Overlay) */}
            <div className={styles.particlesContainer}>
                {particles.map(p => (
                    <div key={p.id} className={styles.particle} style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        opacity: Math.random() * 0.5
                    }} />
                ))}
            </div>

            <div className={styles.formWrapper}>
                <div className={styles.loginForm}>
                    <div className={styles.decorativeBg} />

                    <div className={styles.content}>
                        {/* Header */}
                        <div className={styles.logoContainer}>
                            <img src="/src/assets/icon.png" alt="Tawasul Logo" className={styles.logoImage} style={{ width: '120px', height: '120px', borderRadius: '90%', objectFit: 'cover' }} />
                        </div>

                        <h1 className={styles.title}>
                            مرحباً بك مجدداً
                        </h1>

                        <p className={styles.subtitle}>
                            سجل دخولك للمتابعة إلى لوحة التحكم
                        </p>

                        {/* Login Form */}
                        <form onSubmit={handleSubmit}>
                            <div className={styles.inputGroup}>
                                <div className={styles.inputWrapper}>
                                    <User size={20} className={styles.inputIcon} />
                                    <input
                                        type="text"
                                        placeholder="اسم المستخدم"
                                        className={styles.input}
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        dir="rtl"
                                    />
                                </div>

                                <div className={styles.inputWrapper}>
                                    <Lock size={20} className={styles.inputIcon} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="كلمة المرور"
                                        className={`${styles.input} ${styles.passwordInput}`}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        dir="rtl"
                                    />
                                    <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className={styles.togglePassword}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Remember Me */}
                            <label className={styles.checkboxContainer}>
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className={styles.checkboxInput}
                                />
                                <span className={styles.checkboxCustom}></span>
                                <span className={styles.checkboxLabel}>تذكرني</span>
                            </label>

                            {error && (
                                <div className={styles.errorMessage}>
                                    <AlertTriangle size={18} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                className={styles.submitBtn}
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className={styles.spinner} />
                                ) : (
                                    <>
                                        <span>تسجيل الدخول</span>
                                        <LogIn size={20} />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Footer */}
                        <div className={styles.footer}>
                            <p>© {new Date().getFullYear()} Tawasul CRM</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
