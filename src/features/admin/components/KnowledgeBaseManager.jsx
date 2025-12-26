import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Search, BookOpen, Image as ImageIcon, X } from 'lucide-react';
import JoditEditor from 'jodit-react';
import { DataManager } from '../../../shared/utils/DataManager';
import Modal from '../../../shared/components/Modal';

const KnowledgeBaseManager = () => {
    const [items, setItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({ id: null, title: '', content: '', images: [] });
    const [mode, setMode] = useState('add');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const data = await DataManager.getKnowledgeBase();
        setItems(data);
        setIsLoading(false);
    };

    const handleOpenAdd = () => {
        setFormData({ id: null, title: '', content: '', images: [] });
        setMode('add');
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item) => {
        setFormData({
            id: item.id,
            title: item.title,
            content: item.content,
            images: item.images || (item.image_url ? [item.image_url] : []) // Backward compatibility
        });
        setMode('edit');
        setIsModalOpen(true);
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setFormData(prev => ({
                ...prev,
                images: [...(prev.images || []), ...files]
            }));
        }
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSave = async () => {
        if (!formData.title) return;

        setIsLoading(true);

        // Process Images: Upload if File, keep if String
        const processedImages = await Promise.all((formData.images || []).map(async (img) => {
            if (img instanceof File) {
                return await DataManager.uploadFile(img);
            }
            return img;
        }));

        // Filter out any failed uploads (null)
        const finalImages = processedImages.filter(img => img !== null);

        const payload = {
            title: formData.title,
            content: formData.content,
            images: finalImages
        };

        if (mode === 'add') {
            await DataManager.addKnowledgeBaseItem(payload);
        } else {
            await DataManager.updateKnowledgeBaseItem(formData.id, payload);
        }

        setIsModalOpen(false);
        await loadData();
        setIsLoading(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm('هل أنت متأكد من حذف هذا المقال؟')) {
            await DataManager.deleteKnowledgeBaseItem(id);
            loadData();
        }
    };

    const filteredItems = items.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.content && item.content.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Preview State
    const [previewItem, setPreviewItem] = useState(null);
    const [innerSearchTerm, setInnerSearchTerm] = useState('');
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Jodit Config
    const config = useMemo(() => ({
        readonly: false,
        direction: 'rtl',
        height: 400,
        enableDragAndDropFileToEditor: true,
        language: 'ar',
        toolbarAdaptive: false,
        buttons: [
            'source', '|',
            'bold', 'strikethrough', 'underline', 'italic', '|',
            'ul', 'ol', '|',
            'outdent', 'indent', '|',
            'font', 'fontsize', 'brush', 'paragraph', '|',
            'image', 'table', 'link', '|',
            'align', 'undo', 'redo', '|',
            'hr', 'eraser', 'copyformat', '|',
            'symbol', 'fullsize', 'print', 'about'
        ],
        uploader: {
            insertImageAsBase64URI: true
        },
        placeholder: 'اكتب التفاصيل هنا...'
    }), []);

    // Reset inner search when preview changes
    useEffect(() => {
        if (previewItem) {
            setInnerSearchTerm('');
            setCurrentImageIndex(0);
        }
    }, [previewItem]);

    return (
        <div className="custom-scrollbar" style={{ padding: '1rem', height: '100%' }}>
            {/* Header / Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <BookOpen size={24} color="#60a5fa" />
                        الدليل الشامل
                    </h2>
                    <p style={{ color: '#94a3b8' }}>إدارة المحتوى التعليمي والتوضيحي للموظفين</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    style={{
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.4)'
                    }}
                >
                    <Plus size={18} /> إضافة مقال
                </button>
            </div>

            {/* Search */}
            <div style={{ marginBottom: '2rem', position: 'relative' }}>
                <Search size={20} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                    type="text"
                    placeholder="بحث في الدليل..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '1rem 3rem 1rem 1rem',
                        background: 'rgba(30, 41, 59, 0.4)',
                        border: '1px solid rgba(148, 163, 184, 0.1)',
                        borderRadius: '16px',
                        color: 'white',
                        fontSize: '1rem'
                    }}
                />
            </div>

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {filteredItems.map(item => (
                    <div key={item.id} style={{
                        background: 'rgba(30, 41, 59, 0.4)',
                        borderRadius: '16px',
                        border: '1px solid rgba(148, 163, 184, 0.1)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s',
                        height: '100%'
                    }}>

                        {(item.images && item.images.length > 0) || item.image_url ? (
                            <div style={{ height: '160px', width: '100%', overflow: 'hidden', borderBottom: '1px solid rgba(148, 163, 184, 0.1)', position: 'relative' }}>
                                <img
                                    src={item.images?.[0] || item.image_url}
                                    alt={item.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                {item.images?.length > 1 && (
                                    <div style={{
                                        position: 'absolute', bottom: '8px', right: '8px',
                                        background: 'rgba(0,0,0,0.6)', color: 'white',
                                        padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem'
                                    }}>
                                        +{item.images.length - 1}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ height: '160px', width: '100%', background: 'rgba(59, 130, 246, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ImageIcon size={48} color="rgba(59, 130, 246, 0.2)" />
                            </div>
                        )}

                        <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#f8fafc' }}>{item.title}</h3>
                            <div
                                style={{
                                    color: '#94a3b8',
                                    fontSize: '0.9rem',
                                    lineHeight: '1.5',
                                    marginBottom: '1.5rem',
                                    flex: 1,
                                    overflow: 'hidden',
                                    display: '-webkit-box',
                                    WebkitLineClamp: '3',
                                    WebkitBoxOrient: 'vertical'
                                }}
                                dangerouslySetInnerHTML={{ __html: item.content }} // Render HTML safe for preview
                            />

                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: 'auto' }}>
                                <button
                                    onClick={() => setPreviewItem(item)}
                                    style={{ padding: '8px', borderRadius: '8px', background: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8', border: 'none', cursor: 'pointer' }}
                                    title="عرض (بحث داخل المقال)"
                                >
                                    <BookOpen size={16} />
                                </button>
                                <button
                                    onClick={() => handleOpenEdit(item)}
                                    style={{ padding: '8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: 'none', cursor: 'pointer' }}
                                    title="تعديل"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    style={{ padding: '8px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: 'none', cursor: 'pointer' }}
                                    title="حذف"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={mode === 'add' ? 'إضافة مقال جديد' : 'تعديل المقال'}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem' }}>

                    {/* Title */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.9rem' }}>عنوان المعلومة</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="مثال: طريقة التعامل مع العميل الغاضب"
                            style={{
                                width: '100%', padding: '0.75rem',
                                background: 'rgba(15, 23, 42, 0.3)',
                                border: '1px solid rgba(148, 163, 184, 0.2)',
                                borderRadius: '10px', color: 'white'
                            }}
                        />
                    </div>

                    {/* Content - Jodit Editor */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.9rem' }}>التفاصيل والشرح</label>
                        <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', color: 'black' }}>
                            <JoditEditor
                                value={formData.content}
                                config={config}
                                onBlur={newContent => setFormData({ ...formData, content: newContent })}
                            />
                        </div>
                    </div>

                    {/* Image */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.9rem' }}>صور توضيحية (يمكن اختيار أكثر من صورة)</label>

                        {/* Image Grid */}
                        {formData.images && formData.images.length > 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
                                {formData.images.map((img, idx) => (
                                    <div key={idx} style={{ position: 'relative', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <img
                                            src={img instanceof File ? URL.createObjectURL(img) : img}
                                            alt={`Preview ${idx}`}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                        <button
                                            onClick={() => removeImage(idx)}
                                            style={{
                                                position: 'absolute', top: '2px', right: '2px',
                                                background: 'rgba(239, 68, 68, 0.8)', color: 'white',
                                                border: 'none', borderRadius: '50%',
                                                width: '20px', height: '20px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{
                            border: '2px dashed rgba(148, 163, 184, 0.2)',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            position: 'relative'
                        }}>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                                style={{
                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                    opacity: 0, cursor: 'pointer'
                                }}
                            />
                            <div style={{ color: '#94a3b8' }}>
                                <ImageIcon size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                                <p style={{ fontSize: '0.9rem' }}>اضغط لاختيار صور</p>
                                <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>يمكنك اختيار عدة صور</p>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '10px',
                                background: 'transparent',
                                border: '1px solid rgba(148, 163, 184, 0.2)',
                                color: '#cbd5e1',
                                cursor: 'pointer'
                            }}
                        >
                            إلغاء
                        </button>
                        <button
                            onClick={handleSave}
                            style={{
                                padding: '0.75rem 2.5rem',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                border: 'none',
                                color: 'white',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            حفظ
                        </button>
                    </div>

                </div>
            </Modal>

            {/* Preview Modal for Search */}
            {previewItem && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(5px)',
                    zIndex: 100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem'
                }} onClick={() => setPreviewItem(null)}>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="custom-scrollbar"
                        style={{
                            background: '#1e293b',
                            width: '100%',
                            maxWidth: '700px',
                            maxHeight: '85vh',
                            borderRadius: '24px',
                            overflowY: 'auto',
                            position: 'relative',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        <button
                            onClick={() => setPreviewItem(null)}
                            style={{
                                position: 'absolute',
                                left: '1.5rem',
                                top: '1.5rem',
                                background: 'rgba(0,0,0,0.3)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '36px',
                                height: '36px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white',
                                cursor: 'pointer',
                                zIndex: 10
                            }}
                        >
                            <X size={18} />
                        </button>

                        {/* Image Slider Replica */}
                        {(previewItem.images?.length > 0 || previewItem.image_url) && (() => {
                            const imagesList = previewItem.images && previewItem.images.length > 0 ? previewItem.images : [previewItem.image_url];
                            if (imagesList.length === 0) return null;
                            return (
                                <div style={{ position: 'relative', width: '100%', height: '300px', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                    <img src={imagesList[currentImageIndex]} alt="Slide" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                    {imagesList.length > 1 && (
                                        <div style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px' }}>
                                            {imagesList.map((_, idx) => (
                                                <div key={idx} onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                                                    style={{ width: '8px', height: '8px', borderRadius: '50%', background: idx === currentImageIndex ? '#60a5fa' : 'rgba(255,255,255,0.3)', cursor: 'pointer' }} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        <div style={{ padding: '2rem' }}>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'white', lineHeight: '1.3' }}>
                                {previewItem.title}
                            </h1>

                            {/* Inner Search is removed for HTML Content cleanliness due to complexity of highlighting HTML */}
                            <div style={{ display: 'none', marginBottom: '1rem', position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="بحث داخل المقال..."
                                    value={innerSearchTerm}
                                    onChange={(e) => setInnerSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%', padding: '0.75rem 2.5rem 0.75rem 1rem',
                                        borderRadius: '12px', border: '1px solid rgba(148, 163, 184, 0.2)',
                                        background: 'rgba(15, 23, 42, 0.5)', color: 'white'
                                    }}
                                />
                                <Search size={18} color="#94a3b8" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                            </div>

                            <div
                                className="jodit-wysiwyg" // Use Jodit class for styling
                                style={{ color: '#e2e8f0', lineHeight: '1.7', fontSize: '1rem' }}
                                dangerouslySetInnerHTML={{ __html: previewItem.content }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KnowledgeBaseManager;
