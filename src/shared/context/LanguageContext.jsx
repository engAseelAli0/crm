import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../locales/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    // Default to 'ar' if not set
    const [language, setLanguage] = useState(() => {
        const saved = localStorage.getItem('app_language');
        return saved || 'ar';
    });

    useEffect(() => {
        localStorage.setItem('app_language', language);
        // Update document direction
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = language;
    }, [language]);

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'ar' ? 'en' : 'ar');
    };

    // Helper to get nested translation keys (e.g., 'common.welcome')
    const t = (key) => {
        const keys = key.split('.');
        let value = translations[language];

        for (const k of keys) {
            value = value?.[k];
            if (!value) break;
        }

        return value || key; // Return key if translation missing
    };

    const isRTL = language === 'ar';

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t, isRTL }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
