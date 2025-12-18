import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const LanguageToggle = () => {
    const { language, toggleLanguage } = useLanguage();

    return (
        <button
            onClick={toggleLanguage}
            title={language === 'ar' ? 'Change to English' : 'تغيير للعربية'}
            style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#e2e8f0',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: language === 'ar' ? 'Inter, sans-serif' : 'Cairo, sans-serif',
                fontWeight: 'bold'
            }}
        >
            {language === 'ar' ? 'EN' : 'عربي'}
        </button>
    );
};

export default LanguageToggle;
