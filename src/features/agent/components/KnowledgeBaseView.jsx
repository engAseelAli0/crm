import React, { useState, useEffect } from 'react';
import { Search, BookOpen, X, ChevronLeft, ChevronRight, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import { DataManager } from '../../../shared/utils/DataManager';

const KnowledgeBaseView = ({ onClose }) => {
    const [items, setItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0); // For Slider
    const [isLoading, setIsLoading] = useState(true);

    // Zoom State
    const [isHovering, setIsHovering] = useState(false);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setCursorPos({ x, y });
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const data = await DataManager.getKnowledgeBase();
        setItems(data);
        setIsLoading(false);
    };

    // ... (rest of search/filter logic remains the same, I will use Replace Block effectively)


    const filteredItems = items.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.content && item.content.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="custom-scrollbar" style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(to bottom, #0f172a, #1e293b)',
            // Removed absolute positioning to prevent overlap with header
            zIndex: 10
        }}>

            {/* Header */}
            <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                background: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(10px)'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: 'none',
                        color: 'white',
                        padding: '8px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    <ChevronLeft size={24} />
                </button>
                <div style={{ flex: 1 }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <BookOpen size={28} color="#60a5fa" />
                        الدليل الشامل
                    </h2>
                    <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>مرجعك الأول لكل المعلومات التي تحتاجها</p>
                </div>
            </div>

            {/* Content Area */}
            <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }} className="custom-scrollbar">

                {/* Search Bar */}
                <div style={{ maxWidth: '800px', margin: '0 auto 3rem auto', position: 'relative' }}>
                    <input
                        type="text"
                        placeholder="ابحث عن معلومة، إجراء، أو نصيحة..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '1.25rem 3.5rem 1.25rem 1.5rem',
                            background: 'rgba(30, 41, 59, 0.5)',
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            borderRadius: '20px',
                            color: 'white',
                            fontSize: '1.1rem',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                            outline: 'none',
                            transition: 'all 0.3s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#60a5fa'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(148, 163, 184, 0.2)'}
                    />
                    <Search
                        size={24}
                        color="#94a3b8"
                        style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)' }}
                    />
                </div>

                {/* Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '1.5rem',
                    maxWidth: '1200px',
                    margin: '0 auto'
                }}>
                    {filteredItems.map(item => (
                        <div
                            key={item.id}
                            onClick={() => {
                                setSelectedItem(item);
                                setCurrentImageIndex(0);
                            }}
                            style={{
                                background: 'rgba(30, 41, 59, 0.4)',
                                borderRadius: '16px',
                                border: '1px solid rgba(148, 163, 184, 0.1)',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)';
                                e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.1)';
                            }}
                        >
                            {(item.images?.length > 0 || item.image_url) && (
                                <div style={{ height: '160px', width: '100%', position: 'relative' }}>
                                    <img
                                        src={item.images?.[0] || item.image_url}
                                        alt={item.title}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    {item.images?.length > 1 && (
                                        <div style={{
                                            position: 'absolute', bottom: '8px', right: '8px',
                                            background: 'rgba(0,0,0,0.6)', color: 'white',
                                            padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold'
                                        }}>
                                            +{item.images.length - 1} صور
                                        </div>
                                    )}
                                </div>
                            )}
                            <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#f8fafc' }}>{item.title}</h3>
                                <p style={{
                                    color: '#94a3b8',
                                    fontSize: '0.9rem',
                                    lineHeight: '1.5',
                                    display: '-webkit-box',
                                    WebkitLineClamp: '3',
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    flex: 1
                                }}>
                                    {item.content}
                                </p>
                                <span style={{
                                    display: 'inline-block',
                                    marginTop: '1rem',
                                    color: '#60a5fa',
                                    fontSize: '0.85rem',
                                    fontWeight: 'bold'
                                }}>
                                    اقرأ المزيد &larr;
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {!isLoading && filteredItems.length === 0 && (
                    <div style={{ textAlign: 'center', marginTop: '4rem', color: '#64748b' }}>
                        <BookOpen size={64} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p>لا توجد نتائج مطابقة لبحثك</p>
                    </div>
                )}
            </div>

            {/* Reading Modal */}
            {selectedItem && (
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
                }} onClick={() => setSelectedItem(null)}>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="custom-scrollbar"
                        style={{
                            background: '#1e293b',
                            width: '100%',
                            maxWidth: '700px', // Reduced width
                            maxHeight: '85vh',  // Reduced height
                            borderRadius: '24px',
                            overflowY: 'auto',
                            position: 'relative',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        <button
                            onClick={() => setSelectedItem(null)}
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

                        {/* Images Gallery Slider */}
                        {(selectedItem.images?.length > 0 || selectedItem.image_url) && (() => {
                            const imagesList = selectedItem.images && selectedItem.images.length > 0
                                ? selectedItem.images
                                : [selectedItem.image_url];

                            if (imagesList.length === 0) return null;

                            return (
                                <div
                                    style={{
                                        position: 'relative',
                                        width: '100%',
                                        height: '300px', // Reduced image height
                                        marginBottom: '0',
                                        background: '#0f172a',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden', // Essential for zoom
                                        cursor: isHovering ? 'zoom-out' : 'zoom-in'
                                    }}
                                    onClick={() => setIsHovering(!isHovering)}
                                    onMouseMove={handleMouseMove}
                                    onMouseLeave={() => setIsHovering(false)} // Optional: Turn off if mouse leaves container? User didn't ask, but good UX. Let's keep it simply toggle for now as requested. actually better to turn off on leave to avoid getting stuck "zoomed" when moving away.
                                >
                                    <img
                                        src={imagesList[currentImageIndex]}
                                        alt={`Slide ${currentImageIndex}`}
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '100%',
                                            objectFit: 'contain',
                                            transform: isHovering ? 'scale(2)' : 'scale(1)',
                                            transformOrigin: `${cursorPos.x}% ${cursorPos.y}%`,
                                            transition: 'transform 0.2s ease-out' // Slightly slower for click feel
                                        }}
                                    />

                                    {/* Navigation Buttons (Only allow nav when not zoomed for better UX, or always? User might want to zoom then switch. Let's keep them but z-index high) */}
                                    {imagesList.length > 1 && !isHovering && (
                                        <>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setCurrentImageIndex((prev) => (prev - 1 + imagesList.length) % imagesList.length);
                                                }}
                                                style={{
                                                    position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                                                    background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%',
                                                    width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    zIndex: 10
                                                }}
                                            >
                                                <ChevronLeft size={20} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setCurrentImageIndex((prev) => (prev + 1) % imagesList.length);
                                                }}
                                                style={{
                                                    position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                                                    background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%',
                                                    width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    zIndex: 10
                                                }}
                                            >
                                                <ChevronRight size={20} />
                                            </button>

                                            {/* Dots Indicator */}
                                            <div style={{
                                                position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
                                                display: 'flex', gap: '8px', zIndex: 10
                                            }}>
                                                {imagesList.map((_, idx) => (
                                                    <div
                                                        key={idx}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setCurrentImageIndex(idx);
                                                        }}
                                                        style={{
                                                            width: '8px', height: '8px', borderRadius: '50%',
                                                            background: idx === currentImageIndex ? '#60a5fa' : 'rgba(255,255,255,0.3)',
                                                            cursor: 'pointer', transition: 'background 0.2s'
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })()}

                        <div style={{ padding: '2rem' }}> {/* Reduced padding */}
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'white', lineHeight: '1.3' }}> {/* Reduced title size */}
                                {selectedItem.title}
                            </h1>
                            <div style={{
                                color: '#e2e8f0',
                                lineHeight: '1.7',
                                fontSize: '1rem', // Reduced font size
                                whiteSpace: 'pre-wrap'
                            }}>
                                {selectedItem.content}
                            </div>
                        </div>
                    </div>
                </div>
            )
            }

        </div >
    );
};

export default KnowledgeBaseView;
