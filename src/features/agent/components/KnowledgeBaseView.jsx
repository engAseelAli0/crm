import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Search, ChevronLeft, ChevronRight, X, BookOpen, ArrowLeft, Maximize2, ZoomIn, ZoomOut, ChevronUp, ChevronDown } from 'lucide-react';
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

    // Low-level Search State
    const [innerSearchTerm, setInnerSearchTerm] = useState('');
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

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

    // Strip HTML for preview
    const stripHtml = (html) => {
        if (!html) return '';
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    };

    // Reset index on search change
    useEffect(() => {
        setCurrentMatchIndex(0);
    }, [innerSearchTerm]);

    // Computed content with highlights
    const { highlightedContent, matchCount } = React.useMemo(() => {
        if (!selectedItem || !innerSearchTerm.trim()) {
            return {
                highlightedContent: selectedItem?.content || '',
                matchCount: 0
            };
        }

        let count = 0;
        const keyword = innerSearchTerm.trim();
        const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const escapedKeyword = escapeRegExp(keyword);
        const regex = new RegExp(`(<[^>]+>)|(${escapedKeyword})`, 'gi');

        const content = selectedItem.content.replace(regex, (match, tag, text) => {
            if (tag) return tag;
            count++;
            const isCurrent = count === currentMatchIndex + 1;
            return `<mark id="match-${count}" style="background-color: ${isCurrent ? '#f97316' : '#fde047'}; color: ${isCurrent ? 'white' : 'black'}; border-radius: 2px; padding: 0 2px; display: inline-block;">${match}</mark>`;
        });

        return { highlightedContent: content, matchCount: count };
    }, [selectedItem, innerSearchTerm, currentMatchIndex]);

    // Scrolling effect
    useEffect(() => {
        if (matchCount > 0) {
            // Small timeout to ensure DOM render before scrolling
            setTimeout(() => {
                const el = document.getElementById(`match-${currentMatchIndex + 1}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                }
            }, 100);
        }
    }, [currentMatchIndex, matchCount]);

    const handleNext = () => {
        if (matchCount === 0) return;
        setCurrentMatchIndex((prev) => (prev + 1) % matchCount);
    };

    const handlePrev = () => {
        if (matchCount === 0) return;
        setCurrentMatchIndex((prev) => (prev - 1 + matchCount) % matchCount);
    };

    // Reset inner search when item changes
    useEffect(() => {
        if (selectedItem) {
            setInnerSearchTerm('');
        }
    }, [selectedItem]);

    const filteredItems = items.filter(item => {
        const lowerTerm = searchTerm.toLowerCase();
        const titleMatch = item.title.toLowerCase().includes(lowerTerm);
        const rawContentMatch = item.content && item.content.toLowerCase().includes(lowerTerm);
        // Also search in stripped text to find words even if tags split them (mostly)
        const strippedMatch = item.content && stripHtml(item.content).toLowerCase().includes(lowerTerm);

        return titleMatch || rawContentMatch || strippedMatch;
    });

    return (
        <div className="custom-scrollbar" style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(to bottom, #0f172a, #1e293b)',
            zIndex: 10,
            borderRadius: '16px', // Rounded corners to fit nicely inside padding
            overflow: 'hidden', // Ensure content respects border radius
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
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
                                <h3 style={{ margin: '0 0 0.5rem 0', color: '#f1f5f9', fontSize: '1.1rem' }}>{item.title}</h3>

                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    {item.content && item.content.toLowerCase().includes('<table') ? (
                                        <div
                                            style={{
                                                fontSize: '0.75rem',
                                                color: '#cbd5e1',
                                                maxHeight: '120px',
                                                overflow: 'hidden',
                                                position: 'relative'
                                            }}
                                            className="card-preview-html"
                                        >
                                            <style>{`
                                                .card-preview-html table { width: 100% !important; border-collapse: collapse !important; margin-bottom: 0 !important; }
                                                .card-preview-html th, .card-preview-html td { 
                                                    padding: 4px !important; 
                                                    border: 1px solid rgba(148, 163, 184, 0.2) !important; 
                                                    text-align: center !important; 
                                                    background: transparent !important;
                                                }
                                                .card-preview-html th { background: rgba(30, 41, 59, 0.5) !important; font-weight: bold; }
                                                .card-preview-html img { display: none !important; } 
                                                .card-preview-html p { margin: 0 0 4px 0 !important; }
                                            `}</style>
                                            <div dangerouslySetInnerHTML={{ __html: item.content }} />
                                            {/* Gradient Fade for overflow */}
                                            <div style={{
                                                position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px',
                                                background: 'linear-gradient(to bottom, transparent, rgba(30, 41, 59, 0.9))'
                                            }} />
                                        </div>
                                    ) : (
                                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                            {item.content ? stripHtml(item.content).substring(0, 100) + '...' : 'يعرض هنا وصف مختصر...'}
                                        </p>
                                    )}
                                </div>

                                <div style={{
                                    marginTop: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    color: '#60a5fa',
                                    fontSize: '0.85rem',
                                    fontWeight: '600'
                                }}>
                                    اقرأ المزيد <ArrowLeft size={14} />
                                </div>
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

            {/* Reading Modal - In Portal */}
            {selectedItem && ReactDOM.createPortal(
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(5px)',
                    zIndex: 99999, // Now this will truly be top-level
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
                            maxWidth: '900px',
                            maxHeight: '90vh',
                            borderRadius: '24px',
                            overflowY: 'auto',
                            position: 'relative',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                            display: 'flex',
                            flexDirection: 'column'
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
                                zIndex: 20
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
                                        height: '350px',
                                        flexShrink: 0,
                                        background: '#0f172a',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                        cursor: isHovering ? 'zoom-out' : 'zoom-in'
                                    }}
                                    onClick={() => setIsHovering(!isHovering)}
                                    onMouseMove={handleMouseMove}
                                    onMouseLeave={() => setIsHovering(false)}
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
                                            transition: 'transform 0.2s ease-out'
                                        }}
                                    />

                                    {/* Navigation Buttons */}
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
                                                    width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    zIndex: 10, transition: 'background 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
                                            >
                                                <ChevronLeft size={24} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setCurrentImageIndex((prev) => (prev + 1) % imagesList.length);
                                                }}
                                                style={{
                                                    position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                                                    background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%',
                                                    width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    zIndex: 10, transition: 'background 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
                                            >
                                                <ChevronRight size={24} />
                                            </button>

                                            {/* Dots Indicator */}
                                            <div style={{
                                                position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
                                                display: 'flex', gap: '8px', zIndex: 10,
                                                padding: '4px 8px', borderRadius: '12px', background: 'rgba(0,0,0,0.3)'
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
                                                            cursor: 'pointer', transition: 'all 0.2s',
                                                            transform: idx === currentImageIndex ? 'scale(1.2)' : 'scale(1)'
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })()}

                        <div style={{ padding: '2.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <h1 style={{
                                fontSize: '1.8rem',
                                fontWeight: '800',
                                marginBottom: '2rem',
                                color: '#f8fafc',
                                lineHeight: '1.4',
                                textAlign: 'right',
                                borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
                                paddingBottom: '1.5rem'
                            }}>
                                {selectedItem.title}
                            </h1>

                            {/* Inner Search code preserved... */}
                            <div style={{ marginBottom: '2rem', position: 'relative', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <div style={{ position: 'relative', flex: 1 }}>
                                    <input
                                        type="text"
                                        placeholder="بحث في محتوى المقال..."
                                        value={innerSearchTerm}
                                        onChange={(e) => setInnerSearchTerm(e.target.value)}
                                        style={{
                                            width: '100%', padding: '0.875rem 3rem 0.875rem 1rem',
                                            borderRadius: '12px', border: '1px solid rgba(148, 163, 184, 0.2)',
                                            background: 'rgba(15, 23, 42, 0.6)', color: 'white',
                                            fontSize: '0.95rem',
                                            transition: 'border-color 0.2s'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#60a5fa'}
                                        onBlur={(e) => e.target.style.borderColor = 'rgba(148, 163, 184, 0.2)'}
                                    />
                                    <Search size={18} color="#94a3b8" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                                </div>

                                {matchCount > 0 && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        background: 'rgba(30, 41, 59, 0.8)', padding: '4px 8px', borderRadius: '8px',
                                        border: '1px solid rgba(148, 163, 184, 0.2)'
                                    }}>
                                        <span style={{ color: '#e2e8f0', fontSize: '0.9rem', margin: '0 8px', fontFamily: 'monospace' }}>
                                            {currentMatchIndex + 1} / {matchCount}
                                        </span>
                                        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
                                        <button onClick={handleNext} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'flex' }}><ChevronDown size={20} /></button>
                                        <button onClick={handlePrev} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'flex' }}><ChevronUp size={20} /></button>
                                    </div>
                                )}
                            </div>

                            <style>{`
                                .jodit-wysiwyg img { width: 100% !important; height: auto !important; display: block !important; margin: 1rem auto !important; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
                                .jodit-wysiwyg table { width: 100% !important; }
                            `}</style>
                            <div
                                className="jodit-wysiwyg"
                                style={{
                                    color: '#e2e8f0',
                                    lineHeight: '1.8',
                                    fontSize: '1.05rem',
                                    direction: 'rtl',
                                    textAlign: 'right'
                                }}
                                dangerouslySetInnerHTML={{ __html: highlightedContent }}
                            />
                        </div>
                    </div>
                </div>,
                document.body
            )}
            }

        </div >
    );
};

export default KnowledgeBaseView;
