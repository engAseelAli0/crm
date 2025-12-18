import React from 'react';
import { Check, Shield } from 'lucide-react';
import { PERMISSIONS, PERMISSION_LABELS } from '../../../shared/constants/permissions';

const containerStyle = {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '1rem',
};

const titleStyle = {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
};

const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '0.75rem'
};

const checkboxLabelStyle = (checked) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    borderRadius: '8px',
    cursor: 'pointer',
    background: checked ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
    border: checked ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
    transition: 'all 0.2s ease',
    userSelect: 'none'
});

const checkboxStyle = {
    appearance: 'none',
    width: '18px',
    height: '18px',
    borderRadius: '4px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    display: 'grid',
    placeItems: 'center',
    margin: 0
};

const PermissionSelector = ({ selectedPermissions = [], onChange, disabled = false }) => {

    // Only show relevant permissions for now, can be expanded
    const availablePermissions = [
        PERMISSIONS.HANDLE_CALLS,
        PERMISSIONS.VIEW_REPORTS,
        PERMISSIONS.MANAGE_CATEGORIES,
    ];

    const togglePermission = (permission) => {
        if (disabled) return;

        const newPermissions = selectedPermissions.includes(permission)
            ? selectedPermissions.filter(p => p !== permission)
            : [...selectedPermissions, permission];

        onChange(newPermissions);
    };

    return (
        <div style={containerStyle}>
            <div style={titleStyle}>
                <Shield size={16} />
                <span>الصلاحيات الإضافية</span>
            </div>

            <div style={gridStyle}>
                {availablePermissions.map(permission => {
                    const isChecked = selectedPermissions.includes(permission);
                    return (
                        <label
                            key={permission}
                            style={checkboxLabelStyle(isChecked)}
                        >
                            <div style={{ position: 'relative', width: '18px', height: '18px' }}>
                                <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => togglePermission(permission)}
                                    disabled={disabled}
                                    style={{
                                        ...checkboxStyle,
                                        borderColor: isChecked ? '#3b82f6' : 'rgba(255, 255, 255, 0.3)',
                                        backgroundColor: isChecked ? '#3b82f6' : 'transparent',
                                    }}
                                />
                                {isChecked && (
                                    <Check
                                        size={12}
                                        color="white"
                                        style={{ position: 'absolute', top: '3px', left: '3px', pointerEvents: 'none' }}
                                    />
                                )}
                            </div>
                            <span style={{ fontSize: '0.9rem', color: isChecked ? 'white' : 'rgba(255, 255, 255, 0.7)' }}>
                                {PERMISSION_LABELS[permission]}
                            </span>
                        </label>
                    );
                })}
            </div>
        </div>
    );
};

export default PermissionSelector;
