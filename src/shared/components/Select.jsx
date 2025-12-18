import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import styles from './Select.module.css';

const Select = ({
    label,
    options = [],
    value,
    onChange,
    placeholder = "اختر...",
    icon: Icon,
    disabled = false,
    searchable = false,
    error = false,
    zIndex = 10050
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    const filteredOptions = searchable
        ? options.filter(opt =>
            opt.name && opt.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : options;

    const selectedOption = options.find(opt => opt.id === value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={styles.container} ref={dropdownRef}>
            {label && (
                <label className={styles.label}>
                    {Icon && <Icon size={14} />}
                    {label}
                </label>
            )}

            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`${styles.button} ${disabled ? styles.buttonDisabled : ''} ${error ? styles.buttonError : ''}`}
                disabled={disabled}
            >
                <div className={styles.buttonContent}>
                    <span className={selectedOption ? '' : styles.placeholder}>
                        {selectedOption ? selectedOption.name : placeholder}
                    </span>
                </div>
                <ChevronDown size={16} className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} />
            </button>

            {isOpen && (
                <div className={styles.dropdown} style={{ zIndex }}>
                    {searchable && (
                        <div className={styles.searchContainer}>
                            <input
                                type="text"
                                placeholder="بحث..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={styles.searchInput}
                                autoFocus
                            />
                        </div>
                    )}

                    <div className={styles.optionsList}>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(opt => (
                                <div
                                    key={opt.id}
                                    onClick={() => { onChange(opt.id); setIsOpen(false); setSearchTerm(''); }}
                                    className={`${styles.option} ${value === opt.id ? styles.optionSelected : ''}`}
                                >
                                    <div className={styles.optionIcon}>
                                        {opt.icon && <opt.icon size={16} />}
                                        <span>{opt.name}</span>
                                    </div>
                                    {value === opt.id && (
                                        <Check size={16} color="#818cf8" />
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className={styles.noOptions}>
                                لا توجد خيارات
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Select;
