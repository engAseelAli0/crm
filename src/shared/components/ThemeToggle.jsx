import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ className, style }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`theme-toggle ${className || ''}`}
            style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: theme === 'dark' ? '#fbbf24' : '#3b82f6', // Yellow for Moon (wait, Moon is white/yellow in dark), Blue for Sun? 
                // Logic: In dark mode, show Sun (to switch to light) or show Moon (active)?
                // Standard: Show the icon of the TARGET or CURRENT?
                // Visual consistency: In Dark mode, seeing a Moon feels right. In Light mode, seeing a Sun feels right.
                transition: 'all 0.3s ease',
                ...style
            }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
    );
};

export default ThemeToggle;
