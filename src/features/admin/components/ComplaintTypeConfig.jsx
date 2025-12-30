import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Save, X, List, Type, CheckSquare, Settings } from 'lucide-react';
import { ComplaintManager } from '../../../shared/utils/ComplaintManager';
import Modal from '../../../shared/components/Modal';
import { useToast } from '../../../shared/components/Toast';
import { useLanguage } from '../../../shared/context/LanguageContext';

const ComplaintTypeConfig = () => {
    const { t } = useLanguage();
    const toast = useToast();
    const [types, setTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        instructions: '',
        fields: []
    });

    useEffect(() => {
        loadTypes();
    }, []);

    const loadTypes = async () => {
        setIsLoading(true);
        try {
            const data = await ComplaintManager.getComplaintTypes();
            setTypes(data);
        } catch (error) {
            toast.error(t('common.error'), t('complaints.loadTypesError'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (type = null) => {
        if (type) {
            setEditingType(type);
            setFormData({
                name: type.name,
                instructions: type.instructions || '',
                fields: type.fields || []
            });
        } else {
            setEditingType(null);
            setFormData({
                name: '',
                instructions: '',
                fields: []
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingType(null);
    };

    // --- Field Builder Logic ---
    const addField = () => {
        setFormData(prev => ({
            ...prev,
            fields: [
                ...prev.fields,
                { id: Date.now(), label: '', type: 'text', required: false, options: '' }
            ]
        }));
    };

    const removeField = (id) => {
        setFormData(prev => ({
            ...prev,
            fields: prev.fields.filter(f => f.id !== id)
        }));
    };

    const updateField = (id, updates) => {
        setFormData(prev => ({
            ...prev,
            fields: prev.fields.map(f => f.id === id ? { ...f, ...updates } : f)
        }));
    };

    // --- Save Logic ---
    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error(t('forms.alert'), t('forms.fillRequired'));
            return;
        }

        try {
            if (editingType) {
                await ComplaintManager.updateComplaintType(editingType.id, {
                    name: formData.name,
                    instructions: formData.instructions,
                    fields: formData.fields
                });
                toast.success(t('common.success'), t('complaints.updateTypeSuccess'));
            } else {
                await ComplaintManager.createComplaintType({
                    name: formData.name,
                    instructions: formData.instructions,
                    fields: formData.fields
                });
                toast.success(t('common.success'), t('complaints.createTypeSuccess'));
            }
            handleCloseModal();
            loadTypes();
        } catch (error) {
            toast.error(t('common.error'), t('complaints.saveError'));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('complaints.deleteTypeConfirm'))) return;
        try {
            await ComplaintManager.deleteComplaintType(id);
            toast.success(t('common.success'), t('complaints.deleteTypeSuccess'));
            loadTypes();
        } catch (error) {
            toast.error(t('common.error'), t('complaints.deleteError'));
        }
    };

    return (
        <div style={{ padding: '1.5rem', color: '#e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{t('complaints.complaintConfigTitle')}</h2>
                    <p style={{ color: '#94a3b8' }}>{t('complaints.complaintConfigDesc')}</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    style={{
                        padding: '0.6rem 1.2rem',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        cursor: 'pointer', fontWeight: '600'
                    }}
                >
                    <Plus size={18} /> {t('complaints.addType')}
                </button>
            </div>

            {/* List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {types.map(type => (
                    <div key={type.id} style={{
                        background: 'rgba(30, 41, 59, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        position: 'relative',
                        transition: 'transform 0.2s',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '10px',
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#3b82f6'
                                }}>
                                    <List size={20} />
                                </div>
                                <div>
                                    <h3 style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{type.name}</h3>
                                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                                        {type.fields?.length || 0} {t('complaints.customFields')}
                                    </span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => handleOpenModal(type)}
                                    style={{ padding: '6px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                                    title={t('forms.edit')}
                                >
                                    <Edit size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(type.id)}
                                    style={{ padding: '6px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                    title={t('forms.delete')}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Fields Preview */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {type.fields?.slice(0, 3).map((field, idx) => (
                                <span key={idx} style={{
                                    fontSize: '0.75rem', padding: '4px 8px',
                                    background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', color: '#cbd5e1'
                                }}>
                                    {field.label}
                                </span>
                            ))}
                            {(type.fields?.length > 3) && (
                                <span style={{ fontSize: '0.75rem', padding: '4px 8px', color: '#94a3b8' }}>
                                    +{type.fields.length - 3} ...
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Config Modal */}
            {isModalOpen && (
                <Modal isOpen={true} onClose={handleCloseModal} title={editingType ? t('complaints.editType') : t('complaints.addType')}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
                        {/* Basic Info */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>{t('complaints.typeName')}</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder={t('complaints.typeNamePlaceholder')}
                                style={{
                                    width: '100%', padding: '0.75rem',
                                    background: 'rgba(15, 23, 42, 0.5)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px', color: 'white'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>{t('complaints.instructions') || 'تعليمات/تلميحات للموظف'}</label>
                            <textarea
                                value={formData.instructions}
                                onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                                placeholder={t('complaints.instructionsPlaceholder') || 'أضف تعليمات أو تلميحات ستظهر للموظف عند اختيار هذا النوع...'}
                                style={{
                                    width: '100%', padding: '0.75rem', minHeight: '80px',
                                    background: 'rgba(15, 23, 42, 0.5)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px', color: 'white'
                                }}
                            />
                        </div>

                        {/* Field Builder */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <label style={{ color: '#cbd5e1', fontWeight: '600' }}>{t('complaints.customFields')}</label>
                                <button
                                    onClick={addField}
                                    style={{
                                        fontSize: '0.85rem', padding: '0.4rem 0.8rem',
                                        background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa',
                                        border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '6px',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem'
                                    }}
                                >
                                    <Plus size={14} /> {t('complaints.addField')}
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                {formData.fields.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', color: '#64748b' }}>
                                        {t('complaints.noFields')}
                                    </div>
                                ) : (
                                    formData.fields.map((field, index) => (
                                        <div key={field.id} style={{
                                            background: 'rgba(15, 23, 42, 0.5)',
                                            padding: '1rem', borderRadius: '8px',
                                            border: '1px solid rgba(255, 255, 255, 0.05)',
                                            display: 'flex', gap: '1rem', alignItems: 'flex-start'
                                        }}>
                                            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                <div>
                                                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>{t('forms.fieldName')}</label>
                                                    <input
                                                        type="text"
                                                        value={field.label}
                                                        onChange={(e) => updateField(field.id, { label: e.target.value })}
                                                        placeholder={t('forms.fieldName')}
                                                        style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: 'white', fontSize: '0.9rem' }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>{t('forms.fieldType')}</label>
                                                    <select
                                                        value={field.type}
                                                        onChange={(e) => updateField(field.id, { type: e.target.value })}
                                                        style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: 'white', fontSize: '0.9rem' }}
                                                    >
                                                        <option value="text">{t('complaints.fieldTypes.text')}</option>
                                                        <option value="number">{t('complaints.fieldTypes.number')}</option>
                                                        <option value="textarea">{t('complaints.fieldTypes.textarea')}</option>
                                                        <option value="dropdown">{t('complaints.fieldTypes.dropdown')}</option>
                                                        <option value="date">{t('complaints.fieldTypes.date')}</option>
                                                    </select>
                                                </div>

                                                {field.type === 'dropdown' && (
                                                    <div style={{ gridColumn: '1 / -1' }}>
                                                        <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>{t('forms.fieldOptions')}</label>
                                                        <input
                                                            type="text"
                                                            value={field.options || ''}
                                                            onChange={(e) => updateField(field.id, { options: e.target.value })}
                                                            placeholder={t('forms.fieldOptions')}
                                                            style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: 'white', fontSize: '0.9rem' }}
                                                        />
                                                    </div>
                                                )}

                                                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <input
                                                        type="checkbox"
                                                        id={`req-${field.id}`}
                                                        checked={field.required}
                                                        onChange={(e) => updateField(field.id, { required: e.target.checked })}
                                                    />
                                                    <label htmlFor={`req-${field.id}`} style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{t('forms.required')}</label>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeField(field.id)}
                                                style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                            <button
                                onClick={handleCloseModal}
                                style={{
                                    padding: '0.6rem 1.2rem',
                                    backgroundColor: 'transparent',
                                    color: '#94a3b8',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                {t('إلغاء')}
                            </button>
                            <button
                                onClick={handleSave}
                                style={{
                                    padding: '0.6rem 1.2rem',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                {t('حفظ')}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default ComplaintTypeConfig;
