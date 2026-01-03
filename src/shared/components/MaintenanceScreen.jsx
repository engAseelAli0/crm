import React, { useEffect, useState } from 'react';
import { Settings, Wrench, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';

const MaintenanceScreen = ({ onDevLogin }) => {
    const [dots, setDots] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: 'white', zIndex: 99999, overflow: 'hidden'
        }}>
            {/* Animated Background Elements */}
            <div style={{
                position: 'absolute', width: '600px', height: '600px',
                background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
                top: '-20%', right: '-20%', borderRadius: '50%',
                animation: 'pulse 10s infinite ease-in-out'
            }}></div>
            <div style={{
                position: 'absolute', width: '500px', height: '500px',
                background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
                bottom: '-10%', left: '-10%', borderRadius: '50%',
                animation: 'pulse 10s infinite ease-in-out 5s'
            }}></div>

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 0.5; }
                    50% { transform: scale(1.2); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 0.5; }
                }
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                    100% { transform: translateY(0px); }
                }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .glass-panell {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }
            `}</style>

            <div className="glass-panell" style={{
                padding: '4rem', borderRadius: '32px',
                textAlign: 'center', maxWidth: '600px', width: '90%',
                position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center'
            }}>
                {/* Icon Circle */}
                <div style={{
                    width: '120px', height: '120px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '2rem',
                    boxShadow: '0 0 40px rgba(59, 130, 246, 0.4)',
                    animation: 'float 6s ease-in-out infinite'
                }}>
                    <Wrench size={50} color="white" />
                </div>

                <h1 style={{
                    fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem',
                    background: 'linear-gradient(to right, #fff, #94a3b8)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                }}>
                    الموقع تحت الصيانة
                </h1>

                <p style={{ fontSize: '1.2rem', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '2.5rem', maxWidth: '80%' }}>
                    نحن نعمل حالياً على تحسين تجربة الاستخدام وإضافة ميزات جديدة.
                    <br />
                    سنعود قريباً جداً{dots}
                </p>

                <div style={{
                    display: 'flex', gap: '2rem', justifyContent: 'center',
                    padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', width: '100%'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ color: '#3b82f6' }}><ShieldCheck size={24} /></div>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>أمان وتشفير</span>
                    </div>
                    <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ color: '#8b5cf6' }}><Settings size={24} className="spin-slow" style={{ animation: 'spin-slow 10s linear infinite' }} /></div>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>تحديث النظام</span>
                    </div>
                    <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ color: '#10b981' }}><Clock size={24} /></div>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>عودة قريبة</span>
                    </div>
                </div>

                <div
                    style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', cursor: 'default' }}
                    onDoubleClick={onDevLogin}
                    title="Developer Access"
                >
                    Developer Contact
                </div>
            </div>
        </div>
    );
};

export default MaintenanceScreen;
