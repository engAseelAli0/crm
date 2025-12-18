import React, { useState, useEffect } from 'react';
import {
    Activity, Shield, MapPin, Phone, PauseCircle,
    User, Save, Edit, FolderOpen, AlertCircle, Search
} from 'lucide-react';
import Select from '../../../shared/components/Select';
import Modal from '../../../shared/components/Modal';
import CallHistoryList from './CallHistoryList';
import { DataManager } from '../../../shared/utils/DataManager';
import { useToast } from '../../../shared/components/Toast';

// Inline simple styles for ActiveCallView to move fast, or extract later.
// It's quite complex layout. I'll use inline for layout structure and classes for glassmorphism if available globally.

const ActiveCallView = ({
    call,
    categories,
    locations,
    procedures,
    actions,
    accountTypes, // New prop
    calls, // New prop
    onTerminate,
    onViewDetails, // New prop for modal
    user,
    onCallUpdate // Add this to destructuring
}) => {
    const [duration, setDuration] = useState(0);
    const [selectedPath, setSelectedPath] = useState([]);
    const [showTerminationModal, setShowTerminationModal] = useState(false); // Modal state
    const toast = useToast();

    // Customer Info Local State
    const [customerInfo, setCustomerInfo] = useState({ name: '', gender: '', city: 'اليمن', governorate_id: '', district_id: '' });
    const [isEditingCustomer, setIsEditingCustomer] = useState(false);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    // Call Form State
    const [formData, setFormData] = useState({
        accountType: '',
        walletNumber: '',
        governorate: '',
        governorate_id: '',
        district_id: '',
        procedure: '',
        terminationProcedure: '',
        notes: ''
    });

    // Recursive search logic
    const searchCategories = (nodes, keyword, path = []) => {
        let results = [];
        nodes.forEach(node => {
            const currentPath = [...path, node];
            // Match name
            if (node.name.toLowerCase().includes(keyword.toLowerCase())) {
                results.push({ node, path: currentPath });
            }
            // Recurse children
            if (node.children && node.children.length > 0) {
                results = results.concat(searchCategories(node.children, keyword, currentPath));
            }
        });
        return results;
    };

    // Update results when query changes
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        const results = searchCategories(categories, searchQuery);
        setSearchResults(results);
    }, [searchQuery, categories]);

    const handleSearchResultSelect = (result) => {
        // Automatically select the full path
        setSelectedPath(result.path);
        setSearchQuery(''); // clear search
        setSearchResults([]);
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setDuration(Math.floor((new Date() - call.startTime) / 1000));
        }, 1000);
        return () => clearInterval(timer);
    }, [call.startTime]);

    useEffect(() => {
        // Fetch customer info
        const loadCustomer = async () => {
            const phoneNumber = call.callerNumber || call.number;
            const info = await DataManager.getCustomer(phoneNumber);
            if (info) {
                let govId = info.governorate_id;
                let distId = info.district_id;

                // Fallback: Try to resolve from names if IDs are missing (Legacy data or missing DB columns)
                if (!govId && locations.length > 0) {
                    // Strategy 1: Try explicit governorate/district names
                    if (info.governorate) {
                        const gov = locations.find(l => l.name === info.governorate);
                        if (gov) {
                            govId = gov.id;
                            if (info.district) {
                                const dist = gov.children?.find(d => d.name === info.district);
                                if (dist) distId = dist.id;
                            }
                        }
                    }
                    // Strategy 2: Try parsing detailed city string "Governorate - District"
                    else if (info.city && info.city.includes(' - ')) {
                        const parts = info.city.split(' - ');
                        if (parts.length >= 2) {
                            const govName = parts[0];
                            const distName = parts[1];
                            const gov = locations.find(l => l.name === govName);
                            if (gov) {
                                govId = gov.id;
                                const dist = gov.children?.find(d => d.name === distName);
                                if (dist) distId = dist.id;
                            }
                        }
                    }
                    // Strategy 3: Try matching city as governorate name
                    else if (info.city) {
                        const gov = locations.find(l => l.name === info.city);
                        if (gov) govId = gov.id;
                    }
                }

                setCustomerInfo(prev => ({
                    ...prev,
                    ...info,
                    governorate_id: govId || '',
                    district_id: distId || ''
                }));

                // Pre-fill location in form if resolved
                if (govId) {
                    setFormData(prev => ({ ...prev, governorate_id: govId, district_id: distId || '' }));
                }
            } else {
                setCustomerInfo({ name: 'عميل جديد', gender: 'غير محدد', city: '', governorate_id: '', district_id: '' });
            }
        };
        loadCustomer();
    }, [call.callerNumber, call.number, locations]);

    // Format Duration
    const formatDuration = (sec) => {
        const mins = Math.floor(sec / 60);
        const secs = sec % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Customer Save (DIRECT)
    const handleSaveCustomer = async () => {
        const phoneNumber = call.callerNumber || call.number;

        // Prepare updates for only the columns that exist in DB: name, gender, city, phone
        const updates = {
            name: customerInfo.name,
            gender: customerInfo.gender,
            phone: phoneNumber,
            governorate_id: customerInfo.governorate_id, // Keep IDs
            district_id: customerInfo.district_id
        };

        // Construct 'city' string
        const gov = locations.find(l => l.id === customerInfo.governorate_id);
        if (gov) {
            let cityString = gov.name;
            const dist = gov.children?.find(d => d.id === customerInfo.district_id);
            if (dist) {
                cityString += ` - ${dist.name}`;
            }
            updates.city = cityString;
        } else {
            updates.city = customerInfo.city || ''; // Keep existing if not changing loc
        }

        try {
            await DataManager.updateCustomer(phoneNumber, updates);

            // CRITICAL: Update local state to reflect changes immediately
            setCustomerInfo(prev => ({
                ...prev,
                ...updates,
                city: updates.city // Ensure the display string is updated
            }));

            setIsEditingCustomer(false);
            toast.success('تم الحفظ', 'تم تحديث بيانات العميل بنجاح');
        } catch (error) {
            console.error(error);
            toast.error('خطأ', 'حدث خطأ أثناء حفظ بيانات العميل');
        }
    };

    // Classification Handler
    const handleCategorySelect = (level, categoryId) => {
        const options = level === 0 ? categories : selectedPath[level - 1]?.children || [];
        const selected = options.find(c => c.id === categoryId);
        if (!selected) return;

        const newPath = [...selectedPath.slice(0, level), selected];
        setSelectedPath(newPath);
    };

    const getCategoryOptions = (level) => {
        return level === 0 ? categories : selectedPath[level - 1]?.children || [];
    };

    // Calculate levels to show
    const levelsToShow = [0];
    selectedPath.forEach((node, index) => {
        if (node.children && node.children.length > 0) {
            levelsToShow.push(index + 1);
        }
    });

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 350px', gap: '1.5rem', height: '100%' }}>
            {/* Main Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Active Call Card */}
                <div style={{
                    background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))',
                    borderRadius: '24px',
                    padding: '2rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
                                animation: 'pulse 2s infinite'
                            }}>
                                <Phone size={32} color="white" />
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#fbbf24', letterSpacing: '1px' }}>
                                    {call.number}
                                </h2>
                                <span style={{
                                    padding: '4px 12px', background: 'rgba(16, 185, 129, 0.15)',
                                    color: '#34d399', borderRadius: '20px', fontSize: '0.9rem',
                                    fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px'
                                }}>
                                    <Activity size={14} /> نشط
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '1.1rem', color: '#94a3b8' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Phone size={18} /> {call.callerNumber || call.number}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Activity size={18} /> {formatDuration(duration)}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Shield size={18} /> {user.name}
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowTerminationModal(true)}
                        style={{
                            padding: '1rem 2rem', background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                            color: 'white', borderRadius: '16px', fontWeight: '700', fontSize: '1.1rem',
                            border: 'none', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.3)',
                            display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.2s'
                        }}
                    >
                        <PauseCircle size={24} /> إنهاء المكالمة
                    </button>
                </div>

                {/* Classification */}
                <div style={{
                    background: 'rgba(30, 41, 59, 0.5)', borderRadius: '24px', padding: '2rem',
                    border: '1px solid rgba(99, 102, 241, 0.1)',
                    position: 'relative'
                }}>
                    <h3 style={{ marginBottom: '1.5rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FolderOpen size={20} className="text-indigo-400" /> تصنيف المكالمة
                    </h3>

                    {/* Category Search */}
                    <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                placeholder="بحث سريع في التصنيفات..."
                                className="glass-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%', padding: '0.8rem 2.5rem 0.8rem 1rem',
                                    background: 'rgba(30, 41, 59, 0.9)',
                                    border: '1px solid rgba(99, 102, 241, 0.3)',
                                    borderRadius: '12px', color: 'white'
                                }}
                            />
                        </div>

                        {/* Search Results Dropdown */}
                        {searchQuery && (
                            <div style={{
                                position: 'absolute', top: '100%', right: 0, left: 0, zIndex: 50,
                                background: '#1e293b', border: '1px solid rgba(99, 102, 241, 0.3)',
                                borderRadius: '12px', marginTop: '0.5rem', maxHeight: '300px', overflowY: 'auto',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                            }}>
                                {searchResults.length > 0 ? (
                                    searchResults.map((result, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => handleSearchResultSelect(result)}
                                            style={{
                                                padding: '0.8rem 1rem', cursor: 'pointer',
                                                borderBottom: idx < searchResults.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                                transition: 'background 0.2s',
                                                display: 'flex', flexDirection: 'column', gap: '4px'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <div style={{ color: 'white', fontWeight: '600' }}>{result.node.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                {result.path.map((p, i) => (
                                                    <span key={i} style={{ display: 'flex', alignItems: 'center' }}>
                                                        {i > 0 && <span style={{ margin: '0 4px' }}>&rsaquo;</span>}
                                                        {p.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ padding: '1rem', color: '#94a3b8', textAlign: 'center' }}>
                                        لا توجد نتائج مطابقة
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        {levelsToShow.map(level => {
                            const optionsRaw = getCategoryOptions(level);
                            if (optionsRaw.length === 0) return null;
                            // Add visual indicator for required fields
                            const options = optionsRaw.map(o => ({
                                ...o,
                                name: o.is_required ? `${o.name} *` : o.name
                            }));

                            return (
                                <Select
                                    key={level}
                                    label={`المستوى ${level + 1}`}
                                    placeholder="اختر التصنيف..."
                                    options={options}
                                    value={selectedPath[level]?.id}
                                    onChange={(val) => handleCategorySelect(level, val)}
                                    searchable={true}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Form Data */}
                <div style={{
                    background: 'rgba(30, 41, 59, 0.5)', borderRadius: '24px', padding: '2rem',
                    border: '1px solid rgba(99, 102, 241, 0.1)', flex: 1
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        <div>
                            <Select
                                label="نوع الحساب"
                                placeholder="اختر نوع الحساب"
                                options={accountTypes}
                                value={formData.accountType}
                                onChange={(val) => setFormData({ ...formData, accountType: val })}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: '#e2e8f0', fontWeight: '600' }}>
                                رقم المحفظة
                            </label>
                            <input
                                type="text"
                                className="glass-input"
                                placeholder="مثال: 77xxxxxxx"
                                value={formData.walletNumber}
                                onChange={(e) => setFormData({ ...formData, walletNumber: e.target.value })}
                                style={{
                                    width: '100%', padding: '0.8rem 1rem', background: 'rgba(30, 41, 59, 0.9)',
                                    border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '12px',
                                    color: 'white', fontFamily: 'monospace'
                                }}
                            />
                        </div>

                        <div>
                            <Select
                                label="الإجراء المتبع"
                                placeholder="اختر الإجراء..."
                                options={actions}
                                value={formData.procedure}
                                onChange={(val) => setFormData({ ...formData, procedure: val })}
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: '#e2e8f0', fontWeight: '600' }}>
                            ملاحظات
                        </label>
                        <textarea
                            className="glass-input"
                            placeholder="أدخل تفاصيل إضافية عن المكالمة..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            style={{
                                width: '100%', minHeight: '100px', padding: '1rem',
                                background: 'rgba(30, 41, 59, 0.9)', border: '1px solid rgba(99, 102, 241, 0.3)',
                                borderRadius: '12px', color: 'white', resize: 'vertical'
                            }}
                        />
                        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={async () => {
                                    // VALIDATION LOGIC
                                    if (selectedPath.length === 0) {
                                        alert('يجب اختيار تصنيف للمكالمة قبل الحفظ.');
                                        return;
                                    }

                                    const lastNode = selectedPath[selectedPath.length - 1];
                                    if (lastNode.is_required) {
                                        alert(`التصنيف "${lastNode.name}" إلزامي ويتطلب اختيار تصنيف فرعي أدق.`);
                                        return;
                                    }

                                    if (selectedPath.length > 0) {
                                        // Prepare Data
                                        const updatePayload = {
                                            classificationPath: selectedPath.map(c => c.name),
                                            formData: {
                                                ...formData,
                                                customerSnapshot: customerInfo
                                            },
                                            status: 'Active',
                                            duration: duration // Save current duration
                                        };

                                        try {
                                            if (call.id) {
                                                // DIRECT UPDATE
                                                await DataManager.updateCall(call.id, updatePayload);
                                            } else {
                                                // CREATE if missing (fallback)
                                                // Should not happen as we create on manual call now
                                                const newCall = {
                                                    agentId: user.id,
                                                    callerNumber: call.callerNumber || call.number,
                                                    startTime: call.startTime || new Date(),
                                                    status: 'Active',
                                                    ...updatePayload
                                                };
                                                await DataManager.addCall(newCall);
                                            }
                                            toast.success('تم الحفظ', 'تم حفظ التصنيف وتحديث المكالمة');
                                            if (onCallUpdate) onCallUpdate();
                                        } catch (e) {
                                            console.error(e);
                                            toast.error('خطأ', 'حدث خطأ أثناء حفظ التغييرات');
                                        }

                                    } else {
                                        alert('يرجى اختيار تصنيف أولاً');
                                    }
                                }}
                                id="save-class-btn-note"
                                style={{
                                    background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8',
                                    padding: '0.8rem 1.5rem', borderRadius: '12px', fontSize: '0.95rem',
                                    display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(99, 102, 241, 0.2)',
                                    cursor: 'pointer', transition: 'all 0.2s', fontWeight: '600'
                                }}
                            >
                                <Save size={18} /> حفظ التصنيف
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Side Column (Customer Info) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{
                    background: 'rgba(30, 41, 59, 0.6)', borderRadius: '24px', padding: '1.5rem',
                    border: '1px solid rgba(99, 102, 241, 0.15)', backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <User size={20} /> بيانات العميل
                        </h3>
                        {isEditingCustomer ? (
                            <button onClick={handleSaveCustomer} className="icon-btn" style={{ color: '#10b981' }}>
                                <Save size={20} />
                            </button>
                        ) : (
                            <button onClick={() => setIsEditingCustomer(true)} className="icon-btn" style={{ color: '#60a5fa' }}>
                                <Edit size={20} />
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>الاسم الكامل</label>
                            {isEditingCustomer ? (
                                <input
                                    type="text"
                                    value={customerInfo.name}
                                    onChange={e => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white' }}
                                />
                            ) : (
                                <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{customerInfo.name}</div>
                            )}
                        </div>

                        <div>
                            <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>الجنس</label>
                            {isEditingCustomer ? (
                                <select
                                    value={customerInfo.gender}
                                    onChange={e => setCustomerInfo({ ...customerInfo, gender: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white' }}
                                >
                                    <option value="" style={{ color: 'black' }}>اختر الجنس</option>
                                    <option value="male" style={{ color: 'black' }}>ذكر</option>
                                    <option value="female" style={{ color: 'black' }}>أنثى</option>
                                </select>
                            ) : (
                                <div>{customerInfo.gender === 'male' ? 'ذكر' : customerInfo.gender === 'female' ? 'أنثى' : 'غير محدد'}</div>
                            )}
                        </div>

                        <div>
                            <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>الموقع الجغرافي</label>
                            {isEditingCustomer ? (
                                <>
                                    <div style={{ marginBottom: '0.5rem' }}>
                                        <Select
                                            options={locations}
                                            value={customerInfo.governorate_id}
                                            placeholder="اختر المحافظة"
                                            onChange={val => setCustomerInfo({ ...customerInfo, governorate_id: val, district_id: '' })}
                                        />
                                    </div>
                                    <div>
                                        <Select
                                            options={locations.find(l => l.id === customerInfo.governorate_id)?.children || []}
                                            value={customerInfo.district_id}
                                            placeholder="اختر المديرية"
                                            onChange={val => setCustomerInfo({ ...customerInfo, district_id: val })}
                                            disabled={!customerInfo.governorate_id}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <MapPin size={16} color="#94a3b8" />
                                    <span>{customerInfo.city || 'اليمن'}</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>رقم الهاتف</label>
                            <div style={{ fontFamily: 'monospace', direction: 'ltr' }}>{call.number}</div>
                        </div>
                    </div>
                </div>

                {/* Quick Scripts - Placeholder */}
                <div style={{
                    background: 'rgba(30, 41, 59, 0.6)', borderRadius: '24px', padding: '1.5rem',
                    border: '1px solid rgba(99, 102, 241, 0.15)'
                }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#e2e8f0', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertCircle size={18} /> نصائح سريعة
                    </h3>
                    <ul style={{ paddingRight: '1.5rem', fontSize: '0.9rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <li>تأكد من هوية المتصل قبل الإفصاح عن معلومات الحساب.</li>
                        <li>استخدم لغة مهذبة وواضحة.</li>
                        <li>وثق جميع ملاحظات العميل بدقة.</li>
                    </ul>
                </div>

                {/* Call History from this number */}
                {calls && (
                    <div style={{
                        background: 'rgba(30, 41, 59, 0.6)', borderRadius: '24px', padding: '1.5rem',
                        border: '1px solid rgba(99, 102, 241, 0.15)', flex: 1, minHeight: '300px', display: 'flex', flexDirection: 'column'
                    }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#e2e8f0', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Activity size={18} /> سجل مكالمات الرقم
                        </h3>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <CallHistoryList
                                calls={calls.filter(c =>
                                    (c.callerNumber && (c.callerNumber == call.callerNumber || c.callerNumber == call.number)) ||
                                    (c.caller_number && (c.caller_number == call.callerNumber || c.caller_number == call.number))
                                )}
                                onViewDetails={onViewDetails}
                                compact={true}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Termination Modal */}
            <Modal
                isOpen={showTerminationModal}
                onClose={() => setShowTerminationModal(false)}
                title="إنهاء المكالمة"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <Select
                            label="إجراء الإنهاء"
                            placeholder="اختر إجراء الإنهاء..."
                            options={procedures}
                            value={formData.terminationProcedure}
                            onChange={(val) => setFormData({ ...formData, terminationProcedure: val })}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button
                            onClick={() => {
                                // Validate
                                if (!formData.terminationProcedure && procedures.length > 0) {
                                    alert('يرجى اختيار إجراء الإنهاء');
                                    return;
                                }
                                onTerminate(selectedPath, formData, customerInfo);
                            }}
                            className="btn btn-danger"
                            style={{ flex: 1, justifyContent: 'center' }}
                        >
                            تأكيد الإنهاء
                        </button>
                        <button
                            onClick={() => setShowTerminationModal(false)}
                            className="btn"
                            style={{ background: 'rgba(255,255,255,0.1)', color: 'white', flex: 1, justifyContent: 'center' }}
                        >
                            إلغاء
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ActiveCallView;
