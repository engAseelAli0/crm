import React, { useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Users, Map as MapIcon, TrendingUp, Activity, ArrowUpRight, MapPin, FileSpreadsheet, RefreshCcw } from 'lucide-react';
import styles from '../pages/AdminDashboardPage.module.css'; // Reusing admin styles
import L from 'leaflet';
import { DataManager } from '../../../shared/utils/DataManager';
import { ReportGenerator } from '../../../shared/utils/ReportGenerator';

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Fix for default Leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl
});

// Central Yemen
const YEMEN_CENTER = [15.5527, 48.5164];
const DEFAULT_ZOOM = 6;
const YEMEN_BOUNDS = [
    [12.0, 41.0], // South West
    [19.0, 55.0]  // North East
];

const GOVERNORATES_COORDS = {
    "أمانة العاصمة": [15.3694, 44.1910],
    "صنعاء": [15.3534, 44.2075],
    "عدن": [12.7855, 45.0188],
    "تعز": [13.5795, 44.0209],
    "الحديدة": [14.7979, 42.9430],
    "إب": [13.9660, 44.1721],
    "حضرموت": [16.0, 49.0],
    "ذمار": [14.5425, 44.4057],
    "حجة": [15.6995, 43.6062],
    "عمران": [15.6575, 43.9379],
    "البيضاء": [14.1664, 45.5663],
    "صعدة": [16.9748, 43.8329],
    "لحج": [13.0643, 44.8966],
    "أبين": [13.2952, 45.8953],
    "المحويت": [15.3788, 43.5135],
    "ريمة": [14.6369, 43.6493],
    "مأرب": [15.4630, 45.3197],
    "الجوف": [16.2974, 45.5492],
    "شبوة": [14.5238, 46.7725],
    "المهرة": [16.5921, 51.8596],
    "سقطرى": [12.4634, 53.8237],
    "الضالع": [13.6961, 44.7314]
};

// --- Pin Icon Style ---
const pinStyle = `
.custom-pin-icon {
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
    transition: all 0.2s ease;
}
.custom-pin-icon:hover {
    transform: translateY(-5px) scale(1.1);
    filter: drop-shadow(0 5px 8px rgba(0,0,0,0.6));
    z-index: 1000 !important;
}
`;

// Helper to create Pin Icon
const createPinIcon = (count, max) => {
    // Colors (R, G, B) mapping
    const ratio = count / max;
    let color = '#3b82f6'; // Blue default
    if (ratio > 0.3) color = '#8b5cf6'; // Purple
    if (ratio > 0.6) color = '#f59e0b'; // Orange
    if (ratio > 0.8) color = '#ef4444'; // Red

    const size = 28; // Fixed small size

    // Using SVG string directly for L.divIcon
    const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3" fill="white"/>
    </svg>
    `;

    return L.divIcon({
        className: 'custom-pin-icon',
        html: svgIcon,
        iconSize: [size, size],
        iconAnchor: [size / 2, size] // Anchor at bottom center (tip of the pin)
    });
};


const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <div className={styles.glassPanel} style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{title}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{value}</div>
            </div>
            <div style={{
                padding: '10px',
                borderRadius: '12px',
                background: `${color}20`,
                color: color
            }}>
                <Icon size={24} />
            </div>
        </div>
        {subtext && <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: 'auto' }}>{subtext}</div>}
    </div>
);

// Arabic normalization helper
const normalizeArabic = (text) => {
    if (!text) return "";
    return text
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .trim();
};

const CustomerTrackingView = ({ calls }) => {
    const [locations, setLocations] = useState([]);
    const [customers, setCustomers] = useState([]);

    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        const [locs, custs] = await Promise.all([
            DataManager.getCategoriesByType('location'),
            DataManager.getCustomers()
        ]);
        setLocations(locs || []);
        setCustomers(custs || []);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const locationStats = useMemo(() => {
        const stats = {};
        let totalCustomers = 0;

        customers.forEach(customer => {
            let govName = "غير محدد";

            // PRIORITY 1: Resolve via governorate_id
            if (customer.governorate_id) {
                const fetchedGov = locations.find(l => l.id === customer.governorate_id);
                if (fetchedGov) {
                    govName = fetchedGov.name;
                }
            }
            // PRIORITY 2: Fallback to existing city string parsing (Legacy)
            else if (customer.city) {
                const parts = customer.city.split('-');
                if (parts.length > 0) govName = parts[0].trim();
            }

            // Normalize for matching
            const normalizedGovName = normalizeArabic(govName);

            const matchedKey = Object.keys(GOVERNORATES_COORDS).find(k =>
                normalizeArabic(k) === normalizedGovName ||
                (normalizedGovName.includes(normalizeArabic(k)) && k.length > 3)
            );

            // DEBUG LOGGING (Kept for safety)
            if (customer.governorate_id && !matchedKey) {
                console.log('Mapping Failed:', {
                    id: customer.governorate_id,
                    govName,
                    normalizedGovName,
                    matchedKey
                });
            }

            const finalKey = matchedKey || "غير محدد";

            totalCustomers++;
            if (finalKey !== "غير محدد") {
                if (!stats[finalKey]) stats[finalKey] = { name: finalKey, count: 0, coords: GOVERNORATES_COORDS[finalKey] };
                stats[finalKey].count++;
            } else {
                if (!stats["غير محدد"]) stats["غير محدد"] = { name: "غير محدد", count: 0 };
                stats["غير محدد"].count++;
            }
        });
        const data = Object.values(stats).filter(s => s.coords).sort((a, b) => b.count - a.count);
        return { data, total: totalCustomers, unspecified: stats["غير محدد"] ? stats["غير محدد"].count : 0 };
    }, [customers, locations]); // Added locations to dependency array

    const maxCount = Math.max(...locationStats.data.map(d => d.count), 1);

    const handleExport = () => {
        const columns = [
            { key: 'name', label: 'المحافظة' },
            { key: 'count', label: 'عدد العملاء' }
        ];
        ReportGenerator.exportToExcel(locationStats.data, columns, `توزيع_العملاء_الجغرافي_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.xlsx`);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1.5rem' }}>
            <style>{pinStyle}</style>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                    onClick={loadData}
                    className={styles.actionBtn}
                    style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}
                >
                    <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
                    تحديث البيانات
                </button>

                <button
                    onClick={handleExport}
                    className={styles.actionBtn}
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', gap: '10px' }}
                >
                    <FileSpreadsheet size={20} />
                    تصدير تقرير التوزيع
                </button>
            </div>

            {/* Top Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', height: '140px' }}>
                <StatCard
                    title="إجمالي العملاء"
                    value={locationStats.total.toLocaleString()}
                    icon={Users}
                    color="#3b82f6"
                    subtext="قاعدة البيانات الكاملة"
                />
                <StatCard
                    title="المحافظات المغطاة"
                    value={locationStats.data.length}
                    icon={MapIcon}
                    color="#10b981"
                    subtext="نطاق التغطية الجغرافية"
                />
                <StatCard
                    title="الأعلى نشاطاً"
                    value={locationStats.data.length > 0 ? locationStats.data[0].name : '-'}
                    icon={TrendingUp}
                    color="#8b5cf6"
                    subtext={locationStats.data.length > 0 ? `${locationStats.data[0].count} عميل` : ''}
                />
                <StatCard
                    title="غير محدد الموقع"
                    value={locationStats.unspecified}
                    icon={Activity}
                    color="#f59e0b"
                    subtext="بيانات بحاجة لتحديث"
                />
            </div>

            {/* Map Container */}
            <div className={styles.glassPanel} style={{
                flex: 1,
                minHeight: '530px', // INCREASED HEIGHT
                padding: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'row'
            }}>

                {/* Side List - Enhanced Design */}
                <div style={{
                    width: '320px',
                    borderLeft: '1px solid var(--glass-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'var(--panel-bg)',
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{
                        padding: '1.5rem',
                        borderBottom: '1px solid var(--glass-border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <div style={{
                            background: 'rgba(59, 130, 246, 0.2)',
                            padding: '10px',
                            borderRadius: '12px',
                            color: '#60a5fa',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Activity size={20} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--text-primary)' }}>التوزيع الجغرافي</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ترتيب المحافظات حسب العملاء</div>
                        </div>
                    </div>

                    <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                        {locationStats.data.map((item, idx) => {
                            const percentage = Math.round((item.count / locationStats.total) * 100) || 0;
                            const isTop3 = idx < 3;

                            return (
                                <div key={item.name} style={{
                                    marginBottom: '12px',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    background: isTop3 ? 'rgba(59, 130, 246, 0.08)' : 'var(--glass-bg)',
                                    border: isTop3 ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid var(--glass-border)',
                                    transition: 'all 0.2s ease',
                                    cursor: 'default'
                                }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '24px', height: '24px',
                                                borderRadius: '6px',
                                                background: isTop3 ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                                                color: isTop3 ? 'white' : '#94a3b8',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.75rem', fontWeight: 'bold'
                                            }}>
                                                {idx + 1}
                                            </div>
                                            <span style={{ fontWeight: '600', fontSize: '0.95rem', color: '#e2e8f0' }}>{item.name}</span>
                                        </div>
                                        <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: isTop3 ? '#60a5fa' : '#cbd5e1' }}>
                                            {item.count} <span style={{ fontSize: '0.7rem', opacity: 0.7, fontWeight: 'normal' }}>عميل</span>
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.3)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${(item.count / maxCount) * 100}%`,
                                            height: '100%',
                                            background: isTop3 ? 'linear-gradient(90deg, #3b82f6, #60a5fa)' : '#64748b',
                                            borderRadius: '3px',
                                            transition: 'width 1s ease-out'
                                        }} />
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{percentage}% من الإجمالي</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Map */}
                <div style={{ flex: 1, position: 'relative' }}>
                    {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white' }}>
                            جاري تحميل الخريطة...
                        </div>
                    ) : (
                        <MapContainer
                            center={YEMEN_CENTER}
                            zoom={6}
                            minZoom={6}
                            style={{ height: '100%', width: '100%', background: '#0f172a' }}
                            zoomControl={false}
                            maxBounds={YEMEN_BOUNDS}
                            maxBoundsViscosity={1.0}
                        >
                            <TileLayer
                                attribution='&copy; CARTO'
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            />
                            {locationStats.data.map(item => {
                                return (
                                    <Marker
                                        key={item.name}
                                        position={item.coords}
                                        icon={createPinIcon(item.count, maxCount)}
                                    >
                                        <Tooltip direction="top" offset={[0, -20]} opacity={1}>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{item.name}</div>
                                                <div style={{ color: '#3b82f6' }}>{item.count} عميل</div>
                                            </div>
                                        </Tooltip>
                                    </Marker>
                                )
                            })}
                        </MapContainer>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerTrackingView;
