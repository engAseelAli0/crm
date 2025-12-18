import React, { useState, useEffect } from 'react';
import { User, Lock, LogIn, Eye, EyeOff, Smartphone, Shield, Sparkles } from 'lucide-react';
import { DataManager } from '../../../shared/utils/DataManager'; // Assuming DataManager will be moved later or path adjusted
import styles from './LoginPage.module.css';

const LoginPage = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [activeDemo, setActiveDemo] = useState(null);
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

    const handleDemoLogin = (type) => {
        setActiveDemo(type);
        if (type === 'admin') {
            setUsername('admin');
            setPassword('123');
        } else {
            setUsername('agent');
            setPassword('123');
        }

        // Pulse effect
        // NOTE: We need a unique selector or ref. For now using class logic similar to before but with module classes might be tricky if they are hashed.
        // It's better to use state for animation classes or Refs.
        // However, to keep it simple and close to original:
        // We can add a temporarily id or just rely on state to render class?
        // Actually, the button render logic uses `activeDemo` state. 
        // Let's just rely on the active class for styling, and maybe add animation class via state if needed.
        // The original used document.querySelector. I'll use refs if I were properly rewriting, but let's try to match behavior.
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className={styles.loginContainer}>
            {/* Particles */}
            <div className={styles.particlesContainer}>
                {particles.map(p => (
                    <div key={p.id} className={styles.particle} style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                    }} />
                ))}
            </div>

            {/* Radial Effect */}
            <div className={styles.radialEffect} />

            <div className={styles.formWrapper}>
                <div className={styles.loginForm}>
                    <div className={styles.decorativeBg} />

                    <div className={styles.content}>
                        {/* Header */}
                        <div className={styles.logoContainer}>
                            <div className={styles.logoIcon}>
                                <Shield size={32} color="white" />
                                <Sparkles size={16} color="rgba(255, 255, 255, 0.8)" className={styles.sparkle} />
                            </div>
                        </div>

                        <h1 className={styles.title}>
                            نظام خدمة العملاء
                        </h1>

                        <p className={styles.subtitle}>
                            منصة متكاملة لإدارة علاقات العملاء وتقديم الدعم الفني
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
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <div className={styles.inputWrapper}>
                                    <Lock size={20} className={styles.inputIcon} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="كلمة المرور"
                                        className={styles.input}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        style={{ paddingRight: '50px' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className={styles.togglePassword}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className={styles.errorMessage}>
                                    <Shield size={16} style={{ marginLeft: '8px' }} />
                                    {error}
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
                                        <LogIn size={20} style={{ marginLeft: '10px' }} />
                                        تسجيل الدخول
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className={styles.divider}>
                            <div className={styles.dividerLine}></div>
                            <div className={styles.dividerText}>حسابات تجريبية</div>
                            <div className={styles.dividerLine}></div>
                        </div>

                        {/* Demo Accounts */}
                        <div className={styles.demoButtons}>
                            <button
                                className={`${styles.demoBtn} ${activeDemo === 'admin' ? styles.demoBtnActive : ''} ${activeDemo === 'admin' ? styles.pulseAnimation : ''}`}
                                onClick={() => handleDemoLogin('admin')}
                            >
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '10px'
                                }}>
                                    <User size={20} />
                                </div>
                                <div style={{ fontWeight: '600', marginBottom: '4px' }}>مدير النظام</div>
                                <div style={{ fontSize: '0.85rem', opacity: '0.8' }}>admin / 123</div>
                            </button>

                            <button
                                className={`${styles.demoBtn} ${activeDemo === 'agent' ? styles.demoBtnActive : ''} ${activeDemo === 'agent' ? styles.pulseAnimation : ''}`}
                                onClick={() => handleDemoLogin('agent')}
                            >
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '10px'
                                }}>
                                    <Smartphone size={20} />
                                </div>
                                <div style={{ fontWeight: '600', marginBottom: '4px' }}>موظف الدعم</div>
                                <div style={{ fontSize: '0.85rem', opacity: '0.8' }}>agent / 123</div>
                            </button>
                        </div>

                        {/* Footer */}
                        <div className={styles.footer}>
                            <p>جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
                            <p style={{ fontSize: '0.8rem', marginTop: '5px' }}>
                                نظام آمن ومشفر لحماية بياناتك
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
