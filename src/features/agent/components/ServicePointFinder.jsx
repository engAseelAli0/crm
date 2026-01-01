import React, { useState, useEffect } from 'react';
import {
    MapPin, Search, Copy, ExternalLink, Phone, Map, Filter, User, Store, CheckCircle
} from 'lucide-react';
import { DataManager } from '../../../shared/utils/DataManager';
import { useToast } from '../../../shared/components/Toast';
import styles from './ServicePointFinder.module.css';

const ServicePointFinder = () => {
    const toast = useToast();
    const [points, setPoints] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');

    // Locations
    const [locations, setLocations] = useState([]);
    const [selectedGov, setSelectedGov] = useState('');
    const [selectedDist, setSelectedDist] = useState('');
    // Rating Filters
    const [filterDeposit, setFilterDeposit] = useState('');
    const [filterRegistration, setFilterRegistration] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [pts, locs] = await Promise.all([
                DataManager.getServicePoints(),
                DataManager.getCategoriesByType('location')
            ]);
            setPoints(pts);
            setLocations(locs);
        } catch (error) {
            console.error(error);
            toast.error('خطأ', 'فشل تحميل البيانات');
        } finally {
            setIsLoading(false);
        }
    };

    const getDistricts = () => {
        if (!selectedGov) return [];
        const gov = locations.find(l => l.id === selectedGov);
        return gov?.children || [];
    };

    const filteredPoints = points.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.phone?.includes(searchTerm) ||
            p.address?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchType = filterType === 'All' || p.type === filterType;
        const matchGov = !selectedGov || p.governorate_id === selectedGov;
        const matchDist = !selectedDist || p.district_id === selectedDist;
        const matchDeposit = !filterDeposit || p.deposit_withdrawal === filterDeposit;
        const matchRegistration = !filterRegistration || p.registration_activation === filterRegistration;

        return matchSearch && matchType && matchGov && matchDist && matchDeposit && matchRegistration;
    });

    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text);
        toast.success('تم النسخ', `تم نسخ ${label} بنجاح`);
    };

    const copyFullInfo = (point) => {
        const services = point.type === 'Agent' ? 'سحب، إيداع، تسجيل، تفعيل' : 'إيداع';
        const info = `
الاسم: ${point.name}
النوع: ${point.type === 'Agent' ? 'وكيل خدمة' : 'نقطة بيع'}
الخدمات: ${services}
الهاتف: ${point.phone || '-'}
العنوان: ${point.governorate?.name || ''} - ${point.district?.name || ''} - ${point.address || ''}
الخريطة: ${point.google_map_link || '-'}
        `.trim();
        copyToClipboard(info, 'بيانات النقطة');
    };

    const getRatingClass = (rating) => {
        if (!rating) return '';
        if (rating.includes('ممتاز')) return styles.ratingExcellent;
        if (rating.includes('جيد')) return styles.ratingGood;
        if (rating.includes('ضعيف')) return styles.ratingPoor;
        return styles.ratingNeutral;
    };

    return (
        <div className={styles.container}>
            {/* Header Section */}
            <div className={styles.headerCard}>
                <div className={styles.titleSection}>
                    <h1>
                        <MapPin className={styles.titleIcon} size={36} />
                        دليل نقاط الخدمة
                    </h1>
                    <p className={styles.subtitle}>
                        ابحث عن أقرب وكلاء ومراكز خدمة معتمدة بسهولة. يمكنك تصفية النتائج حسب الموقع أو النوع.
                    </p>
                </div>

                {/* Quick Filters */}
                <div className={styles.filtersGroup}>
                    {[
                        { id: 'All', label: 'الكل', icon: Filter },
                        { id: 'Agent', label: 'وكلاء خدمة', icon: User },
                        { id: 'POS', label: 'نقاط بيع', icon: Store }
                    ].map(t => {
                        const Icon = t.icon;
                        const isActive = filterType === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => setFilterType(t.id)}
                                className={`${styles.filterBtn} ${isActive ? styles.active : ''}`}
                            >
                                <Icon size={16} />
                                <span style={{ display: isActive ? 'inline' : 'none' }} className="hidden md:inline">{t.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Smart Search Bar */}
            <div className={styles.searchWrapper}>
                <div className={styles.searchContainer}>

                    {/* Main Search Input */}
                    <div className={styles.searchField}>
                        <Search className={styles.searchIcon} size={20} />
                        <input
                            type="text"
                            placeholder="ابحث بالاسم، العنوان، الهاتف، أو المتجر..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>

                    {/* Location Filters */}
                    <div className={styles.selectField}>
                        <select
                            value={selectedGov}
                            onChange={(e) => { setSelectedGov(e.target.value); setSelectedDist(''); }}
                            className={styles.selectInput}
                        >
                            <option value="">كافة المحافظات</option>
                            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                    </div>

                    <div className={styles.selectField}>
                        <select
                            value={selectedDist}
                            onChange={(e) => setSelectedDist(e.target.value)}
                            className={styles.selectInput}
                            disabled={!selectedGov}
                        >
                            <option value="">{selectedGov ? 'كافة المديريات' : 'اختر المحافظة أولاً'}</option>
                            {getDistricts().map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Advanced Rating Filters */}
                <div className={styles.searchContainer} style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
                    <div className={styles.selectField}>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px', display: 'block' }}>سحب وإيداع:</span>
                        <select
                            value={filterDeposit}
                            onChange={(e) => setFilterDeposit(e.target.value)}
                            className={styles.selectInput}
                        >
                            <option value="">(الكل)</option>
                            <option value="ممتاز">ممتاز</option>
                            <option value="جيد">جيد</option>
                            <option value="ضعيف">ضعيف</option>
                        </select>
                    </div>
                    <div className={styles.selectField}>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px', display: 'block' }}>تسجيل وتفعيل:</span>
                        <select
                            value={filterRegistration}
                            onChange={(e) => setFilterRegistration(e.target.value)}
                            className={styles.selectInput}
                        >
                            <option value="">(الكل)</option>
                            <option value="ممتاز">ممتاز</option>
                            <option value="جيد">جيد</option>
                            <option value="ضعيف">ضعيف</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div style={{ flex: 1 }}>
                {isLoading ? (
                    <div className={styles.loader}>
                        <div className={styles.spinner}></div>
                        <p>جاري جلب البيانات...</p>
                    </div>
                ) : filteredPoints.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <Search size={40} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#cbd5e1' }}>لا توجد نتائج مطابقة</h3>
                            <p style={{ marginTop: '0.5rem' }}>حاول تغيير كلمات البحث أو إزالة بعض الفلاتر.</p>
                        </div>
                        <button
                            onClick={() => { setSearchTerm(''); setSelectedGov(''); setFilterType('All'); }}
                            className={`${styles.btn} ${styles.btnCopy}`}
                        >
                            مسح الفلاتر
                        </button>
                    </div>
                ) : (
                    <div className={styles.gridContainer}>
                        {filteredPoints.map((point, index) => (
                            <div
                                key={point.id}
                                className={styles.card}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {/* Card Header - Color Coded line */}
                                <div className={`${styles.colorBar} ${point.type === 'Agent' ? styles.agentBar : styles.posBar}`}></div>

                                <div className={styles.cardContent}>
                                    {/* Top Row */}
                                    <div className={styles.cardTop}>
                                        <div className={`${styles.iconBox} ${point.type === 'Agent' ? styles.agentIcon : styles.posIcon}`}>
                                            {point.type === 'Agent' ? (
                                                <User size={24} strokeWidth={1.5} />
                                            ) : (
                                                <Store size={24} strokeWidth={1.5} />
                                            )}
                                        </div>
                                        <div className={`${styles.badge} ${point.type === 'Agent' ? styles.agentBadge : styles.posBadge}`}>
                                            {point.type === 'Agent' ? 'وكيل خدمة' : 'نقطة بيع'}
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <h3 className={styles.cardName} title={point.name}>
                                        {point.name}
                                    </h3>

                                    <div className={styles.locationTag}>
                                        <span className={styles.locationBadge}>{point.governorate?.name}</span>
                                        <span>/</span>
                                        <span className={styles.locationBadge}>{point.district?.name}</span>
                                    </div>

                                    {/* Details Grid */}
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <div className={styles.infoRow}>
                                            <MapPin size={16} style={{ color: '#64748b' }} />
                                            <p className={styles.infoText}>
                                                {point.address || 'العنوان غير محدد بالتفصيل'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Services Ratings (New Design) */}
                                    {point.type === 'Agent' && (
                                        <div className={styles.servicesGrid}>
                                            <div className={styles.serviceRatingRow}>
                                                <span className={styles.serviceLabel}>سحب وإيداع:</span>
                                                <span className={`${styles.ratingValue} ${getRatingClass(point.deposit_withdrawal)}`}>
                                                    {point.deposit_withdrawal || 'غير محدد'}
                                                </span>
                                            </div>
                                            <div className={styles.serviceRatingRow}>
                                                <span className={styles.serviceLabel}>تسجيل وتفعيل:</span>
                                                <span className={`${styles.ratingValue} ${getRatingClass(point.registration_activation)}`}>
                                                    {point.registration_activation || 'غير محدد'}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions Footer */}
                                    <div className={styles.actionsFooter}>
                                        <button
                                            onClick={() => copyFullInfo(point)}
                                            className={`${styles.btn} ${styles.btnCopy}`}
                                        >
                                            <Copy size={16} />
                                            نسخ
                                        </button>

                                        {point.google_map_link ? (
                                            <a
                                                href={point.google_map_link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className={`${styles.btn} ${styles.btnMap}`}
                                            >
                                                <Map size={16} />
                                                الموقع
                                            </a>
                                        ) : (
                                            <button disabled className={`${styles.btn} ${styles.btnCopy}`} style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                                                <Map size={16} />
                                                بدون موقع
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ServicePointFinder;
