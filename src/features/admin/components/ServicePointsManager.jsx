import React, { useState, useEffect, useRef } from 'react';
import {
    MapPin, Search, Plus, Upload, Trash2, Edit2, Download,
    CheckCircle, X, FileSpreadsheet, Store, User, Filter
} from 'lucide-react';
import { DataManager } from '../../../shared/utils/DataManager';
import * as XLSX from 'xlsx';
import Modal from '../../../shared/components/Modal';
import { useToast } from '../../../shared/components/Toast';

const ServicePointsManager = () => {
    const toast = useToast();
    const [points, setPoints] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');

    // Lookup Data
    const [locations, setLocations] = useState([]);
    const [districts, setDistricts] = useState([]);

    // Modals
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [editingPoint, setEditingPoint] = useState(null);

    // Form Stats
    const fileInputRef = useRef(null);
    const [importStats, setImportStats] = useState(null);

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
            toast.error('خطأ', 'فشل تحميل البيانات');
        } finally {
            setIsLoading(false);
        }
    };

    const getDistrictsForGov = (govId) => {
        const gov = locations.find(l => l.id === govId);
        return gov?.children || [];
    };

    // --- CRUD ---
    const handleDelete = async (id) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا السجل؟')) return;
        await DataManager.deleteServicePoint(id);
        setPoints(prev => prev.filter(p => p.id !== id));
        toast.success('تم الحذف', 'تم حذف السجل بنجاح');
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            name: formData.get('name'),
            type: formData.get('type'),
            governorate_id: formData.get('governorate_id'),
            district_id: formData.get('district_id'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            google_map_link: formData.get('google_map_link'),
            working_hours: formData.get('working_hours'),
            // New Fields
            record_date: formData.get('record_date'),
            activations_count: parseInt(formData.get('activations_count') || 0),
            cash_withdrawal_count: parseInt(formData.get('cash_withdrawal_count') || 0),
            deposit_count: parseInt(formData.get('deposit_count') || 0)
        };

        if (editingPoint) {
            await DataManager.updateServicePoint(editingPoint.id, data);
            toast.success('تم التحديث', 'تم تحديث البيانات بنجاح');
        } else {
            await DataManager.addServicePoint(data);
            toast.success('تم الإضافة', 'تم إضافة النقطة بنجاح');
        }
        setIsAddOpen(false);
        setEditingPoint(null);
        loadData();
    };

    // --- Import ---
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;

            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];

            // Parse as array of arrays to safely find header row
            const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });

            // Find header row index
            let headerRowIndex = -1;
            for (let i = 0; i < rawData.length; i++) {
                const row = rawData[i];
                // Look for known columns like 'الوكيل' or 'Name' or 'الاسم'
                if (row && row.some(cell => cell && typeof cell === 'string' && (cell.includes('الوكيل') || cell.includes('Name') || cell.includes('الاسم')))) {
                    headerRowIndex = i;
                    break;
                }
            }

            if (headerRowIndex === -1) {
                // Fallback: try to process as normal if we couldn't find specific header
                const data = XLSX.utils.sheet_to_json(ws);
                processImportData(data);
                return;
            }

            // Construct objects based on found header
            const headers = rawData[headerRowIndex];
            const data = [];

            for (let i = headerRowIndex + 1; i < rawData.length; i++) {
                const row = rawData[i];
                if (!row || row.length === 0) continue;

                const obj = {};
                headers.forEach((h, index) => {
                    if (h) {
                        // Trim header to avoid spacing issues
                        const cleanHeader = h.toString().trim();
                        obj[cleanHeader] = row[index];
                    }
                });
                data.push(obj);
            }

            processImportData(data);
        };
        reader.readAsBinaryString(file);
    };

    const normalizeText = (text) => {
        if (!text) return '';
        return text.toString().trim()
            .replace(/[أإآ]/g, 'ا')
            .replace(/ة/g, 'ه')
            .replace(/ى/g, 'ي');
    };

    const parseDate = (dateRaw) => {
        if (!dateRaw) return null;

        let dateStr = dateRaw.toString().trim();

        // Handle Excel numeric date (if parsing raw values)
        if (typeof dateRaw === 'number') {
            // Excel date to JS date
            const date = new Date((dateRaw - (25567 + 2)) * 86400 * 1000);
            return date.toISOString().split('T')[0];
        }

        // Handle "MM/YYYY" or "M/YYYY"
        if (/^\d{1,2}\/\d{4}$/.test(dateStr)) {
            const [month, year] = dateStr.split('/');
            return `${year}-${month.padStart(2, '0')}-01`;
        }

        // Handle "DD/MM/YYYY" or "YYYY-MM-DD" parsing attempts
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
            return d.toISOString().split('T')[0];
        }

        // Return null if invalid, or maybe current date? Let's return null to avoid bad data
        return null;
    };

    const processImportData = async (json) => {
        let successCount = 0;
        let newLocCount = 0; // Stats for new locations
        const validRows = []; // Rows that have at least a Name

        // Maps to track what we need to create
        // Structure: { "NormalizedGovName": { original: "GovName", districts: { "NormalizedDistName": "DistName" } } }
        const missingLocations = {};

        // Current Lookups
        const govMap = {};
        locations.forEach(l => { govMap[normalizeText(l.name)] = l; });

        // DEBUG: Log the first row keys to see what we are getting
        if (json.length > 0) {
            console.log('Excel Import Debug - First Row Keys:', Object.keys(json[0]));
            console.log('Excel Import Debug - First Row Data:', json[0]);
        }

        for (const row of json) {
            // Support new Excel format columns
            const name = row['الاسم'] || row['Name'] || row['اسم الوكيل'] || row['الوكيل'];
            const typeRaw = row['النوع'] || row['Type'] || 'Agent';

            // Skip invalid rows
            if (!name) continue;

            // Support new column names: المناطقة (governorate), البنديه (district)
            const govName = row['المحافظة'] || row['Governorate'] || row['المناطقة'];
            const distName = row['المديرية'] || row['District'] || row['البنديه'];

            if (!govName || !distName) continue; // Basic validation

            const normGov = normalizeText(govName);
            const normDist = normalizeText(distName);

            let govExists = govMap[normGov];
            let distExists = false;

            if (govExists) {
                // Gov exists, check district
                // distMap for this specific gov
                const dists = govExists.children || [];
                distExists = dists.some(d => normalizeText(d.name) === normDist);
            }

            if (!govExists || !distExists) {
                // Something is missing, add to missingLocations to be created later
                if (!missingLocations[normGov]) {
                    missingLocations[normGov] = { original: govName, districts: {} };
                }
                if (!distExists) {
                    missingLocations[normGov].districts[normDist] = distName;
                }
                newLocCount++; // Rough count of rows affecting new locations
            }

            // We store ALL valid rows, ensuring we map them correctly at confirm stage
            validRows.push(row);
            successCount++;
        }

        setImportStats({
            total: json.length,
            valid: successCount,
            newLocations: Object.keys(missingLocations).length, // Just count new Govs/Dists roughly or just bool
            missingLocations, // Pass this to confirm
            data: validRows
        });
    };

    const confirmImport = async () => {
        if (!importStats?.data?.length) return;
        setIsLoading(true);
        toast.info('جاري المعالجة', 'يتم التحقق من المناطق وإنشاؤها...');

        const { missingLocations, data } = importStats;

        try {
            // 1. Create Missing Locations
            // We need to refresh local lookups as we go or after batch
            // For safety, let's process sequentially to get IDs

            // First, get fresh map (in case of race/updates)
            // Actually, we will just use our create logic:
            // "Get or Create" strategy

            // Helper to fetch latest gov/dist map
            const refreshMaps = async () => {
                const locs = await DataManager.getCategoriesByType('location'); // This returns tree
                const map = {};
                locs.forEach(l => {
                    map[normalizeText(l.name)] = l;
                });
                return map;
            };

            let currentGovMap = await refreshMaps();

            // Iterate our identified missing structure
            for (const normGov of Object.keys(missingLocations)) {
                const govInfo = missingLocations[normGov];

                let govObj = currentGovMap[normGov];

                // Create Gov if missing
                if (!govObj) {
                    const newGov = await DataManager.addCategory(govInfo.original, null, 'location');
                    if (newGov) {
                        govObj = { ...newGov, children: [] };
                        currentGovMap[normGov] = govObj; // Update local map
                    }
                }

                if (govObj) {
                    // Handle Districts
                    const pendingDists = govInfo.districts;
                    // Existing dists lookup for this gov
                    const existingDistNorms = (govObj.children || []).map(d => normalizeText(d.name));

                    for (const normDist of Object.keys(pendingDists)) {
                        if (!existingDistNorms.includes(normDist)) {
                            const newDist = await DataManager.addCategory(pendingDists[normDist], govObj.id, 'location');
                            if (newDist) {
                                govObj.children = [...(govObj.children || []), newDist];
                            }
                        }
                    }
                }
            }

            // 2. Now map all rows to IDs using the FULLY UPDATED map
            const finalPoints = [];

            // Re-normalize to be safe
            for (const row of data) {
                // Support both old and new Excel column names
                const name = row['الاسم'] || row['Name'] || row['اسم الوكيل'] || row['الوكيل'];
                const typeRaw = row['النوع'] || row['Type'] || 'Agent';
                const govName = row['المحافظة'] || row['Governorate'] || row['المناطقة'];
                const distName = row['المديرية'] || row['District'] || row['البنديه'];
                const phone = row['الهاتف'] || row['Phone'] || row['رقم الهاتف'];
                const address = row['العنوان'] || row['Address'];
                const mapLink = row['الموقع'] || row['Map'] || row['رابط الموقع'];

                // New fields from updated Excel format
                const dateValue = row['التاريخ'] || row['Date'];
                // Handle typo 'عدد التتفعيلات' (double Ta) seen in user debug
                const activationsCount = parseInt(row['عدد التفعيلات'] || row['عدد التتفعيلات'] || row['ActivationsCount'] || row['عدد التنبيهات'] || 0) || 0;
                const cashWithdrawalCount = parseInt(row['عدد عمليات السحب النقدي'] || row['CashWithdrawalCount'] || 0) || 0;
                const depositCount = parseInt(row['عدد عمليات الإيداع'] || row['DepositCount'] || 0) || 0;

                // Old Ratings (keep for backward compatibility)
                const depositRating = row['سحب وايداع'] || row['DepositStatus'];
                const regRating = row['تسجيل وتفعيل'] || row['RegistrationStatus'];

                const type = (typeRaw.includes('بيع') || typeRaw.toLowerCase().includes('pos')) ? 'POS' : 'Agent';

                const govObj = currentGovMap[normalizeText(govName)];
                if (govObj) {
                    const distObj = (govObj.children || []).find(d => normalizeText(d.name) === normalizeText(distName));
                    if (distObj) {
                        finalPoints.push({
                            name, type,
                            governorate_id: govObj.id,
                            district_id: distObj.id,
                            phone: phone?.toString(),
                            address,
                            google_map_link: mapLink,
                            deposit_withdrawal: depositRating,
                            registration_activation: regRating,
                            // New fields
                            record_date: parseDate(dateValue),
                            activations_count: activationsCount,
                            cash_withdrawal_count: cashWithdrawalCount,
                            deposit_count: depositCount
                        });
                    }
                }
            }

            if (finalPoints.length > 0) {
                await DataManager.bulkAddServicePoints(finalPoints);
                toast.success('تم الاستيراد', `تم إضافة ${finalPoints.length} نقطة وإنشاء المناطق الجديدة.`);
            } else {
                toast.warning('تنبيه', 'لم يتم استيراد أي سجلات. تأكد من صحة البيانات.');
            }

        } catch (error) {
            console.error(error);
            toast.error('خطأ', 'حدث خطأ أثناء معالجة المناطق أو الاستيراد');
        }

        setIsImportOpen(false);
        setImportStats(null);
        loadData(); // Final refresh
    };

    const downloadTemplate = () => {
        const wb = XLSX.utils.book_new();
        // Updated template with new fields matching the image format
        const ws = XLSX.utils.json_to_sheet([
            {
                'التاريخ': '11/2025',
                'الوكيل': 'مثال وكيل',
                'المناطقة': 'أمانة العاصمة',
                'البنديه': 'الوحدة',
                'العنوان': 'شارع حدة - جوار الجامع',
                'عدد التفعيلات': 0,
                'عدد عمليات السحب النقدي': 0,
                'عدد عمليات الإيداع': 0
            }
        ]);
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "ServicePoints_Template.xlsx");
    };

    const filteredPoints = points.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.phone?.includes(searchTerm) ||
            p.governorate?.name?.includes(searchTerm) ||
            p.district?.name?.includes(searchTerm);
        const matchType = filterType === 'All' || p.type === filterType;
        return matchSearch && matchType;
    });

    // --- Styles ---
    const glassStyle = {
        background: 'rgba(30, 41, 59, 0.5)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    };

    const inputStyle = {
        width: '100%',
        padding: '0.75rem 1rem',
        background: 'rgba(15, 23, 42, 0.5)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: '8px',
        color: 'white',
        fontSize: '0.95rem',
        outline: 'none',
        transition: 'border-color 0.2s',
        textAlign: 'right'
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto', color: '#f1f5f9' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', background: 'linear-gradient(to right, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        <MapPin size={32} color="#60a5fa" />
                        نظام إدارة نقاط الخدمة
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '1rem' }}>إدارة بيانات الوكلاء ونقاط البيع وتحديث مواقعهم الجغرافية</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => setIsImportOpen(true)}
                        style={{
                            ...glassStyle,
                            padding: '0.75rem 1.5rem',
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            cursor: 'pointer', color: '#e2e8f0', fontWeight: '500',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Upload size={18} />
                        استيراد Excel
                    </button>
                    <button
                        onClick={() => { setEditingPoint(null); setIsAddOpen(true); }}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                            borderRadius: '12px',
                            border: 'none',
                            color: 'white', fontWeight: '600',
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                        }}
                    >
                        <Plus size={20} />
                        إضافة نقطة جديدة
                    </button>
                </div>
            </div>

            {/* Controls */}
            <div style={{ ...glassStyle, padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <input
                        type="text"
                        placeholder="بحث بالاسم، الهاتف، المحافظة..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ ...inputStyle, paddingRight: '2.75rem' }}
                    />
                    <Search style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={18} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(15, 23, 42, 0.5)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
                    {[{ id: 'All', label: 'الكل' }, { id: 'Agent', label: 'الوكلاء' }, { id: 'POS', label: 'نقاط البيع' }].map(type => (
                        <button
                            key={type.id}
                            onClick={() => setFilterType(type.id)}
                            style={{
                                padding: '0.5rem 1.25rem',
                                borderRadius: '8px',
                                border: 'none',
                                background: filterType === type.id ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                color: filterType === type.id ? '#60a5fa' : '#94a3b8',
                                fontWeight: filterType === type.id ? '600' : '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div style={{ ...glassStyle, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                            <th style={{ padding: '1.25rem', textAlign: 'right', color: '#cbd5e1', fontWeight: '600' }}>الاسم</th>
                            <th style={{ padding: '1.25rem', textAlign: 'right', color: '#cbd5e1', fontWeight: '600' }}>النوع</th>
                            <th style={{ padding: '1.25rem', textAlign: 'right', color: '#cbd5e1', fontWeight: '600' }}>المنطقة</th>
                            <th style={{ padding: '1.25rem', textAlign: 'right', color: '#cbd5e1', fontWeight: '600' }}>الهاتف</th>
                            <th style={{ padding: '1.25rem', textAlign: 'center', color: '#cbd5e1', fontWeight: '600' }}>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>جاري التحميل...</td></tr>
                        ) : filteredPoints.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>لا توجد بيانات مطابقة</td></tr>
                        ) : (
                            filteredPoints.map((point, idx) => (
                                <tr key={point.id} style={{
                                    borderBottom: idx === filteredPoints.length - 1 ? 'none' : '1px solid rgba(148, 163, 184, 0.05)',
                                    transition: 'background 0.2s',
                                    color: '#e2e8f0'
                                }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <td style={{ padding: '1.25rem', fontWeight: '500' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{
                                                width: '36px', height: '36px', borderRadius: '50%',
                                                background: point.type === 'Agent' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: point.type === 'Agent' ? '#c084fc' : '#34d399'
                                            }}>
                                                {point.type === 'Agent' ? <User size={18} /> : <Store size={18} />}
                                            </div>
                                            {point.name}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem' }}>
                                        <span style={{
                                            padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem',
                                            background: point.type === 'Agent' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                            color: point.type === 'Agent' ? '#e879f9' : '#34d399',
                                            border: `1px solid ${point.type === 'Agent' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
                                        }}>
                                            {point.type === 'Agent' ? 'وكيل خدمة' : 'نقطة بيع'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1.25rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1' }}>
                                            <MapPin size={14} color="#94a3b8" />
                                            {point.governorate?.name} - {point.district?.name}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem', fontFamily: 'monospace', direction: 'ltr', textAlign: 'right' }}>
                                        {point.phone || '-'}
                                    </td>
                                    <td style={{ padding: '1.25rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                            <button onClick={() => { setEditingPoint(point); setIsAddOpen(true); }} style={{ padding: '8px', borderRadius: '8px', border: 'none', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', cursor: 'pointer' }}><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(point.id)} style={{ padding: '8px', borderRadius: '8px', border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Modal */}
            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={editingPoint ? 'تعديل بيانات نقطة' : 'إضافة نقطة جديدة'}>
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>اسم النقطة / الوكيل</label>
                        <input name="name" required defaultValue={editingPoint?.name} type="text" style={inputStyle} placeholder="الاسم التجاري..." />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>النوع</label>
                            <select name="type" defaultValue={editingPoint?.type || 'Agent'} style={{ ...inputStyle, padding: '0.75rem' }}>
                                <option value="Agent">وكيل خدمة</option>
                                <option value="POS">نقطة بيع</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>رقم الهاتف</label>
                            <input name="phone" defaultValue={editingPoint?.phone} type="text" style={inputStyle} placeholder="77xxxxxxx" />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>المحافظة</label>
                            <select
                                name="governorate_id"
                                required
                                defaultValue={editingPoint?.governorate_id}
                                onChange={(e) => {
                                    const govId = e.target.value;
                                    setDistricts(getDistrictsForGov(govId));
                                }}
                                style={{ ...inputStyle, padding: '0.75rem' }}
                            >
                                <option value="">اختر المحافظة...</option>
                                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>المديرية</label>
                            <select
                                name="district_id"
                                required
                                defaultValue={editingPoint?.district_id}
                                style={{ ...inputStyle, padding: '0.75rem' }}
                            >
                                <option value="">اختر المديرية...</option>
                                {(districts.length > 0 ? districts : getDistrictsForGov(editingPoint?.governorate_id))
                                    .map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>العنوان التفصيلي</label>
                        <input name="address" defaultValue={editingPoint?.address} type="text" style={inputStyle} placeholder="الشارع، جوار..." />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>رابط الموقع (Google Maps)</label>
                        <input name="google_map_link" defaultValue={editingPoint?.google_map_link} type="url" dir="ltr" style={{ ...inputStyle, textAlign: 'left' }} placeholder="https://maps.google.com/..." />
                    </div>

                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#94a3b8', fontSize: '0.9rem' }}>بيانات العمليات والتفعيلات</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>تاريخ السجل</label>
                                <input name="record_date" defaultValue={editingPoint?.record_date} type="text" style={inputStyle} placeholder="MM/YYYY or Date" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>عدد التفعيلات</label>
                                <input name="activations_count" defaultValue={editingPoint?.activations_count || 0} type="number" min="0" style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>عدد عمليات السحب</label>
                                <input name="cash_withdrawal_count" defaultValue={editingPoint?.cash_withdrawal_count || 0} type="number" min="0" style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>عدد عمليات الإيداع</label>
                                <input name="deposit_count" defaultValue={editingPoint?.deposit_count || 0} type="number" min="0" style={inputStyle} />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={() => setIsAddOpen(false)} style={{ padding: '0.75rem 2rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', cursor: 'pointer' }}>إلغاء</button>
                        <button type="submit" style={{ padding: '0.75rem 2.5rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>حفظ البيانات</button>
                    </div>
                </form>
            </Modal>

            {/* Import Modal */}
            <Modal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} title="استيراد متعدد (Excel)">
                <div style={{ width: '100%', textAlign: 'center' }}>
                    <div style={{ width: '80px', height: '80px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                        <FileSpreadsheet size={40} color="#10b981" />
                    </div>

                    {!importStats ? (
                        <>
                            <p style={{ color: '#cbd5e1', marginBottom: '2rem', lineHeight: '1.6' }}>
                                يمكنك رفع ملف Excel يحتوي على آلاف السجلات. <br />
                                سيقوم النظام آلياً بالتعرف على المحافظات والمديريات وربطها.
                            </p>

                            <button onClick={downloadTemplate} style={{ color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%' }}>
                                <Download size={16} /> تحميل شيت فارغ (Template)
                            </button>

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    border: '2px dashed rgba(148, 163, 184, 0.3)', borderRadius: '16px', padding: '3rem',
                                    cursor: 'pointer', transition: 'all 0.2s', background: 'rgba(30, 41, 59, 0.3)'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)'; e.currentTarget.style.background = 'rgba(30, 41, 59, 0.3)'; }}
                            >
                                <p style={{ color: 'white', fontWeight: '600', marginBottom: '0.5rem' }}>انقر لاختيار الملف</p>
                                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>يدعم ملفات .xlsx و .csv</p>
                            </div>
                            <input ref={fileInputRef} type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} style={{ display: 'none' }} />
                        </>
                    ) : (
                        <div style={{ width: '100%' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#34d399' }}>{importStats.valid}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#ecfdf5' }}>سجل صحيح</div>
                                </div>
                                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f87171' }}>{importStats.invalid}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#fef2f2' }}>سجل مرفوض</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <button onClick={() => setImportStats(null)} style={{ padding: '0.75rem 2rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#cbd5e1', cursor: 'pointer' }}>إلغاء</button>
                                <button onClick={confirmImport} disabled={importStats.valid === 0} style={{ padding: '0.75rem 2rem', borderRadius: '10px', border: 'none', background: '#10b981', color: 'white', fontWeight: 'bold', cursor: 'pointer', opacity: importStats.valid === 0 ? 0.5 : 1 }}>تأكيد الاستيراد</button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default ServicePointsManager;
