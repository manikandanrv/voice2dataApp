import { useState, useEffect } from 'react';
import VoiceInputFAB from './VoiceInputFAB';

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;


export default function TFOWinderProduction() {
    const [masterData, setMasterData] = useState({
        machines: [],
        yarn_codes: [],
        units: [],
        trollies: [],
        operators: [],
        shifts: []
    });

    const [formData, setFormData] = useState({
        code: '',
        date: new Date().toISOString().split('T')[0],
        machine_name: '',
        wip: false,
        batch_no: '',
        specification: '',
        unit: '',
        lot_size_completed: false,
        trolley: '',
        operator_name: '',
        no_of_bobbins: 96,
        weight: '',
        actual_weight: '',
        shift_name: '',
        start_time: '',
        waste_kgs: '',
        remarks: '',
        doff_no: '',
        batch_doff_no: '',
        enter_by: 'ADMIN',
        // New Fields
        no_of_spindles: '',
        spindles: '',
        rpm: '',
        length: '',
        taper: '',
        min_time: '',
        max_time: '',
        tolerance: '',
        total_weight: ''
    });



    // List & Pagination State
    const [listData, setListData] = useState([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [sortBy, setSortBy] = useState('id'); // Default sort
    const [sortOrder, setSortOrder] = useState('desc');

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterMachine, setFilterMachine] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    // Notification State
    const [latestId, setLatestId] = useState(0);
    const [showNotification, setShowNotification] = useState(false);

    const fetchList = async () => {
        try {
            const skip = (page - 1) * pageSize;
            const queryParams = new URLSearchParams({
                skip,
                limit: pageSize,
                sort_by: sortBy,
                order: sortOrder,
                ...(searchQuery && { search: searchQuery }),
                ...(filterMachine && { machine: filterMachine }),
                ...(filterStartDate && { start_date: filterStartDate }),
                ...(filterEndDate && { end_date: filterEndDate }),
            });
            const res = await fetch(`${API_BASE}/production/tfo-winder/?${queryParams.toString()}`);
            const data = await res.json();
            if (!res.ok) {
                alert(`API Error: ${JSON.stringify(data)}`);
                console.error("API Error Response:", data);
            }
            if (!data.items) {
                console.warn("API returned no items array:", data);
            }
            setListData(data.items || []);
            setTotalPages(data.pages || 0);

            // Update latestId if on first page and polling hasn't found newer yet
            if (page === 1 && !searchQuery && !filterMachine && !filterStartDate && !filterEndDate && data.items && data.items.length > 0) {
                // Assuming list returns newest first if sortOrder is desc
                // If not, we find max. But usually list is time based.
                const currentIds = data.items.map(i => i.id);
                const currentMax = Math.max(...currentIds);

                if (currentMax > latestId && !showNotification) {
                    setLatestId(currentMax);
                }
            }
        } catch (err) {
            console.error("Error fetching list:", err);
            alert(`Network/Parse Error: ${err.message}`);
        }
    };

    const checkForUpdates = async () => {
        try {
            // Check for newest record
            const queryParams = new URLSearchParams({
                limit: 1,
                sort_by: 'id',
                order: 'desc'
            });
            const res = await fetch(`${API_BASE}/production/tfo-winder/?${queryParams.toString()}`);
            const data = await res.json();

            if (data.items && data.items.length > 0) {
                const newestId = data.items[0].id;
                if (newestId > latestId && latestId > 0) {
                    setShowNotification(true);
                }
            }
        } catch (err) {
            console.error("Error checking for updates:", err);
        }
    };

    const handleRefresh = () => {
        setShowNotification(false);
        setPage(1); // Go to first page to see new items
        fetchList();
    };

    // Polling Effect
    useEffect(() => {
        const interval = setInterval(() => {
            // Only poll if not currently showing notification and no filters active
            if (!showNotification && !searchQuery && !filterMachine && !filterStartDate && !filterEndDate) {
                checkForUpdates();
            }
        }, 10000); // 10 seconds

        return () => clearInterval(interval);
    }, [latestId, showNotification, searchQuery, filterMachine, filterStartDate, filterEndDate]);

    useEffect(() => {
        // Debounce search slightly to avoid too many requests or just rely on state changes
        const timer = setTimeout(() => {
            fetchList();
        }, 300);
        return () => clearTimeout(timer);
    }, [page, pageSize, sortBy, sortOrder, searchQuery, filterMachine, filterStartDate, filterEndDate]);

    useEffect(() => {
        const fetchMasters = async () => {
            try {
                const [machinesRes, countsRes, shiftsRes, operatorsRes, unitsRes, yarnSuppliersRes] = await Promise.all([
                    fetch(`${API_BASE}/master/machines/`),
                    fetch(`${API_BASE}/master/counts/`),
                    fetch(`${API_BASE}/master/shifts/`),
                    fetch(`${API_BASE}/master/operators/`),
                    fetch(`${API_BASE}/master/units/`),
                    fetch(`${API_BASE}/master/yarn-suppliers/`)
                ]);

                const responses = [machinesRes, countsRes, shiftsRes, operatorsRes, unitsRes, yarnSuppliersRes];
                const rNames = ['machines', 'counts', 'shifts', 'operators', 'units', 'suppliers'];
                for (let i = 0; i < responses.length; i++) {
                    if (!responses[i].ok) {
                        alert(`Failed to load ${rNames[i]}: ${responses[i].status}`);
                        throw new Error(`Failed to load ${rNames[i]}`);
                    }
                }

                const machinesData = await machinesRes.json();
                const countsData = await countsRes.json();
                const shiftsData = await shiftsRes.json();
                const operatorsData = await operatorsRes.json();
                const unitsData = await unitsRes.json();
                const yarnSuppliersData = await yarnSuppliersRes.json();

                setMasterData(prev => ({
                    ...prev,
                    machines: machinesData.items || [],
                    yarn_codes: yarnSuppliersData.items || [],
                    shifts: shiftsData.items?.map(i => i.shift_name) || [],
                    operators: operatorsData.items || [],
                    units: unitsData.items?.map(i => i.unit_name) || []
                }));
            } catch (err) {
                console.error("Error fetching master data:", err);
                alert("Critical Error Loading Master Data: " + err.message);
            }
        };
        fetchMasters();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'machine_name') {
            const selectedMachine = masterData.machines.find(m => m.machine_name === value);

            let autoFillData = {};
            if (selectedMachine) {
                // Merge all potential source objects
                const sources = [
                    selectedMachine.specification || {},
                    selectedMachine.running_parameters || {},
                    selectedMachine.operational_settings || {}
                ];

                // Mapping dictionary for normalization
                const keyMap = {
                    'rpm': ['rpm', 'speed', 'spindle_speed', 'r_p_m', 'motor_speed', 'running_rpm'],
                    'length': ['length', 'len', 'total_length', 'cut_length'],
                    'taper': ['taper', 'angle', 'cone_angle'],
                    'min_time': ['min_time', 'minimum_time', 'min_duration', 'min_run_time', 'running_time'],
                    'max_time': ['max_time', 'maximum_time', 'max_duration', 'max_run_time'],
                    'tolerance': ['tolerance', 'tol', 'deviation'],
                    'no_of_spindles': ['no_of_spindles', 'total_spindles', 'num_spindles', 'spindle_count', 'no_spindles'],
                    'no_of_bobbins': ['no_of_bobbins', 'bobbins', 'num_bobbins', 'bobbin_count', 'no_bobbins'],
                    'spindles': ['spindles', 'active_spindles'],
                    'total_weight': ['total_weight', 'weight_capacity', 'max_weight'],
                    'code': ['code', 'yarn_code', 'item_code'],
                    'batch_no': ['batch', 'batch_no', 'lot_no', 'batch_id', 'lot_number'],
                    'shift_name': ['shift', 'shift_name', 'current_shift'],
                    'operator_name': ['operator', 'operator_name', 'employee_name'],
                    'doff_no': ['doff_no', 'current_doff_no', 'doff', 'doff_number', 'curr_doff_no'],
                    'batch_doff_no': ['batch_doff_no', 'curr_doff_no', 'current_doff_no'],
                    'start_time': ['start_time', 'start', 'begin_time'],
                    'end_time': ['end_time', 'end', 'finish_time'],
                    'actual_weight': ['actual_weight', 'gross_weight'],
                    'waste_kgs': ['waste', 'waste_kgs', 'process_waste'],
                    'remarks': ['remarks', 'remark', 'comments', 'note'],
                    'weight': ['weight', 'standard_weight', 'std_weight', 'weight_per_bobbin'],
                    'specification': ['specification', 'spec', 'size', 'package_size']
                };

                const targetFields = Object.keys(keyMap);

                sources.forEach(source => {
                    Object.entries(source).forEach(([key, val]) => {
                        // Improved normalization: replace non-alphanumeric with underscores, ensuring "No. Of Spindles" -> "no_of_spindles"
                        // This handles spaces, dots, dashes etc.
                        const normalizedKey = key.toLowerCase()
                            .replace(/[^a-z0-9]+/g, '_')
                            .replace(/^_|_$/g, ''); // Trim leading/trailing underscores

                        // Check against keyMap
                        for (const [targetField, aliases] of Object.entries(keyMap)) {
                            if (aliases.includes(normalizedKey)) {
                                autoFillData[targetField] = val;
                            }
                        }

                        // Also try exact match for keys not in map but in target fields
                        if (targetFields.includes(normalizedKey)) {
                            autoFillData[normalizedKey] = val;
                        }
                    });
                });

                // Post-process dropdown fields for loose matching (Case-insensitive)
                if (autoFillData.shift_name) {
                    const match = masterData.shifts.find(s => s.toLowerCase() === String(autoFillData.shift_name).toLowerCase());
                    if (match) autoFillData.shift_name = match;
                }

                if (autoFillData.operator_name) {
                    const match = masterData.operators.find(o => o.operator_name.toLowerCase() === String(autoFillData.operator_name).toLowerCase());
                    if (match) autoFillData.operator_name = match.operator_name;
                }

                if (autoFillData.unit) {
                    const match = masterData.units.find(u => u.toLowerCase() === String(autoFillData.unit).toLowerCase());
                    if (match) autoFillData.unit = match;
                }

                if (autoFillData.code) { // Check yarn codes
                    // masterData.yarn_codes are now objects {yarn_code, supplier_name}
                    const match = masterData.yarn_codes.find(c => (c.yarn_code || '').toLowerCase() === String(autoFillData.code).toLowerCase());
                    if (match) {
                        autoFillData.code = `${match.supplier_name || ''} ${match.yarn_code}`.trim();
                    }
                }

            }

            setFormData(prev => ({
                ...prev,
                machine_name: value,
                unit: selectedMachine ? selectedMachine.unit : prev.unit,
                ...autoFillData
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleVoiceData = (data) => {
        // Check for sort/list commands
        if (data.sort_by || data.page_size) {
            if (data.sort_by) setSortBy(data.sort_by);
            if (data.sort_order) setSortOrder(data.sort_order);
            if (data.page_size) setPageSize(parseInt(data.page_size));
            alert(`List updated: Sort by ${data.sort_by || sortBy}, Size ${data.page_size || pageSize}`);
            return;
        }

        // Filter out null/undefined/empty string values from data
        const nonEmptyData = Object.fromEntries(
            Object.entries(data).filter(([_, v]) => v !== null && v !== undefined && v !== '')
        );

        setFormData(prev => ({
            ...prev,
            ...nonEmptyData,
            // Ensure numeric fields are correctly typed if provided
            no_of_spindles: nonEmptyData.no_of_spindles || prev.no_of_spindles,
            actual_weight: nonEmptyData.actual_weight || prev.actual_weight
        }));

        // Auto-submit logic: Check if critical fields are present
        const requiredFields = ['code_no', 'machine', 'operator_name'];
        const isComplete = requiredFields.every(field => data[field] || formData[field]);

        if (isComplete) {
            // Optional: Uncomment below to auto-submit
            // handleSubmit(); 
            alert("Voice data applied! Please review and click Save.");
        }
    };

    const handleRadioChange = (val) => {
        setFormData(prev => ({ ...prev, lot_size_completed: val }));
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };





    const allTabs = [
        { id: 'production', label: 'Production Entry' },
        { id: 'spindle_change', label: 'Spindle Change' },
        { id: 'code_change', label: 'Code Change' },
        { id: 'weight_change', label: 'Weight Change' },
        { id: 'shift_start', label: 'Shift Start' },
        { id: 'shift_close', label: 'Shift Close' },
        { id: 'operator_change', label: 'Operator Change' },
        { id: 'machine_start', label: 'Machine Start' },
        { id: 'machine_stop', label: 'Machine Stop' },
    ];

    const [activeTab, setActiveTab] = useState('production');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'production':
                return (
                    <>
                        <div className="form-section">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                                <div>
                                    <div className="form-row">
                                        <label className="form-label">No Of Spindles <span style={{ color: 'var(--danger-red)' }}>*</span></label>
                                        <input type="number" className="form-control" name="no_of_spindles" value={formData.no_of_spindles} onChange={handleChange} />
                                    </div>
                                    <div className="form-row">
                                        <label className="form-label">Batch No <span style={{ color: 'var(--danger-red)' }}>*</span></label>
                                        <input type="text" className="form-control" name="batch_no" value={formData.batch_no} onChange={handleChange} />
                                    </div>
                                    <div className="form-row">
                                        <label className="form-label">Date <span style={{ color: 'var(--danger-red)' }}>*</span></label>
                                        <input type="date" className="form-control" name="date" value={formData.date} onChange={handleChange} />
                                        <div style={{ marginLeft: '1rem' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                <input type="checkbox" name="wip" checked={formData.wip} onChange={handleChange} /> WIP
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div className="form-row">
                                        <label className="form-label">Yarn Code <span style={{ color: 'var(--danger-red)' }}>*</span></label>
                                        <select className="form-control" name="code" value={formData.code} onChange={handleChange}>
                                            <option value="">-- SELECT --</option>
                                            {masterData.yarn_codes.map(y => {
                                                const label = `${y.supplier_name || ''} ${y.yarn_code}`.trim();
                                                return <option key={y.id} value={label}>{label}</option>;
                                            })}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '2rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                                <div>
                                    <div className="form-row">
                                        <label className="form-label">Specification <span style={{ color: 'var(--danger-red)' }}>*</span></label>
                                        <select className="form-control" name="specification" value={formData.specification} onChange={handleChange}>
                                            <option value="">--</option>
                                            <option value="Spec A">Spec A</option>
                                        </select>
                                    </div>
                                    <div className="form-row">
                                        <label className="form-label">Unit <span style={{ color: 'var(--danger-red)' }}>*</span></label>
                                        <input type="text" className="form-control" name="unit" value={formData.unit} readOnly placeholder="Auto-selected based on machine" style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }} />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <label className="form-label">Lot Size Completed</label>
                                    <div className="radio-group" style={{ maxWidth: 'fit-content' }}>
                                        <label style={{ cursor: 'pointer' }}><input type="radio" checked={formData.lot_size_completed === true} onChange={() => handleRadioChange(true)} /> Yes</label>
                                        <label style={{ cursor: 'pointer' }}><input type="radio" checked={formData.lot_size_completed === false} onChange={() => handleRadioChange(false)} /> No</label>
                                    </div>
                                </div>
                            </div>

                            {/* Technical Parameters */}
                            <div style={{ marginTop: '2rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <h4 style={{ margin: '0 0 1rem 0', color: '#475569', fontSize: '1rem', fontWeight: '600' }}>Technical Parameters</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                    {['rpm', 'length', 'taper', 'min_time', 'max_time', 'tolerance'].map(field => (
                                        <div className="form-row" key={field}>
                                            <label className="form-label">{field.replace('_', ' ').toUpperCase()}</label>
                                            <input type="number" className="form-control" name={field} value={formData[field]} onChange={handleChange} step={field === 'taper' ? "0.01" : "1"} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="section-header">Production Details</div>
                        <div className="section-body">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                                <div>
                                    <div className="form-row">
                                        <label className="form-label">Doff No <span style={{ color: 'var(--danger-red)' }}>*</span></label>
                                        <input type="text" className="form-control" name="doff_no" value={formData.doff_no} onChange={handleChange} />
                                    </div>
                                    <div className="form-row">
                                        <label className="form-label">Start Time</label>
                                        <input type="time" className="form-control" name="start_time" value={formData.start_time} onChange={handleChange} />
                                    </div>
                                    <div className="form-row">
                                        <label className="form-label">End Time</label>
                                        <input type="time" className="form-control" name="end_time" value={formData.end_time} onChange={handleChange} />
                                    </div>
                                    <div className="form-row">
                                        <label className="form-label">No Of Bobbins <span style={{ color: 'var(--danger-red)' }}>*</span></label>
                                        <input type="number" className="form-control" name="no_of_bobbins" value={formData.no_of_bobbins} onChange={handleChange} />
                                    </div>
                                </div>
                                <div>
                                    <div className="form-row">
                                        <label className="form-label">Actual Weight <span style={{ color: 'var(--danger-red)' }}>*</span></label>
                                        <input type="number" className="form-control" name="actual_weight" value={formData.actual_weight} onChange={handleChange} />
                                    </div>
                                    <div className="form-row">
                                        <label className="form-label">Waste (Kgs)</label>
                                        <input type="number" className="form-control" name="waste_kgs" value={formData.waste_kgs} onChange={handleChange} />
                                    </div>
                                    <div className="form-row">
                                        <label className="form-label">Remarks</label>
                                        <input type="text" className="form-control" name="remarks" value={formData.remarks} onChange={handleChange} />
                                    </div>
                                    <div className="form-row">
                                        <label className="form-label">Trolley</label>
                                        <select className="form-control" name="trolley" value={formData.trolley} onChange={handleChange}>
                                            <option value="">-- SELECT --</option>
                                            {masterData.trollies.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                <div className="form-row">
                                    <label className="form-label">Operator Name <span style={{ color: 'var(--danger-red)' }}>*</span></label>
                                    <select className="form-control" name="operator_name" value={formData.operator_name} onChange={handleChange}>
                                        <option value="">-- Select --</option>
                                        {masterData.operators.map(o => <option key={o.id} value={o.operator_name}>{o.operator_name}</option>)}
                                    </select>
                                </div>
                                <div className="form-row">
                                    <label className="form-label">Shift Name <span style={{ color: 'var(--danger-red)' }}>*</span></label>
                                    <select className="form-control" name="shift_name" value={formData.shift_name} onChange={handleChange}>
                                        <option value="">-- SELECT --</option>
                                        {masterData.shifts.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="form-row">
                                    <label className="form-label">Batch Doff No</label>
                                    <input type="text" className="form-control" name="batch_doff_no" value={formData.batch_doff_no} onChange={handleChange} />
                                </div>
                                <div className="form-row">
                                    <label className="form-label">Total Weight</label>
                                    <input type="number" className="form-control" name="total_weight" value={formData.total_weight} onChange={handleChange} />
                                </div>
                                <div className="form-row">
                                    <label className="form-label">Spindles</label>
                                    <input type="number" className="form-control" name="spindles" value={formData.spindles} onChange={handleChange} />
                                </div>
                            </div>
                        </div>
                    </>
                );

            case 'spindle_change':
                return (
                    <div className="form-section">
                        <div className="form-row">
                            <label className="form-label">New Spindles Count <span style={{ color: 'var(--danger-red)' }}>*</span></label>
                            <input type="number" className="form-control" name="spindles" value={formData.spindles} onChange={handleChange} />
                        </div>
                    </div>
                );

            case 'code_change':
                return (
                    <div className="form-section">
                        <div className="form-row">
                            <label className="form-label">New Code <span style={{ color: 'var(--danger-red)' }}>*</span></label>
                            <select className="form-control" name="code" value={formData.code} onChange={handleChange}>
                                <option value="">-- SELECT --</option>
                                {masterData.yarn_codes.map(y => {
                                    // NEW LOGIC: Supplier Name + Yarn Name (Fallback to yarn_code)
                                    const label = `${y.supplier_name || ''} ${y.yarn_name || y.yarn_code}`.trim();
                                    return <option key={y.id} value={label}>{label}</option>;
                                })}
                            </select>
                        </div>
                        <div className="form-row">
                            <label className="form-label">New Batch No <span style={{ color: 'var(--danger-red)' }}>*</span></label>
                            <input type="text" className="form-control" name="batch_no" value={formData.batch_no} onChange={handleChange} />
                        </div>
                        <div className="form-row">
                            <label className="form-label">Size (String) <span style={{ color: 'var(--danger-red)' }}>*</span></label>
                            <input type="text" className="form-control" name="specification" value={formData.specification} onChange={handleChange} placeholder="e.g. 12 inch" />
                        </div>
                        <div className="form-row">
                            <label className="form-label">Running Time <span style={{ color: 'var(--danger-red)' }}>*</span></label>
                            <input type="number" className="form-control" name="min_time" value={formData.min_time} onChange={handleChange} placeholder="Running Time" />
                        </div>
                        <div className="form-row">
                            <label className="form-label">Weight <span style={{ color: 'var(--danger-red)' }}>*</span></label>
                            <input type="number" className="form-control" name="weight" value={formData.weight} onChange={handleChange} />
                        </div>
                    </div>
                );

            case 'weight_change':
                return (
                    <div className="form-section">
                        <div className="form-row">
                            <label className="form-label">New Weight <span style={{ color: 'var(--danger-red)' }}>*</span></label>
                            <input type="number" className="form-control" name="weight" value={formData.weight} onChange={handleChange} />
                        </div>
                        <div className="form-row">
                            <label className="form-label">Running Time <span style={{ color: 'var(--danger-red)' }}>*</span></label>
                            <input type="number" className="form-control" name="min_time" value={formData.min_time} onChange={handleChange} placeholder="Running Time" />
                        </div>
                    </div>
                );



            case 'shift_start':
                return (
                    <div className="form-section">
                        <div className="form-row">
                            <label className="form-label">Shift <span style={{ color: 'var(--danger-red)' }}>*</span></label>
                            <select className="form-control" name="shift_name" value={formData.shift_name} onChange={handleChange}>
                                <option value="">-- SELECT --</option>
                                {masterData.shifts.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="form-row">
                            <label className="form-label">Operator <span style={{ color: 'var(--danger-red)' }}>*</span></label>
                            <select className="form-control" name="operator_name" value={formData.operator_name} onChange={handleChange}>
                                <option value="">-- Select --</option>
                                {masterData.operators.map(o => <option key={o.id} value={o.operator_name}>{o.operator_name}</option>)}
                            </select>
                        </div>
                        <div className="form-row">
                            <label className="form-label">Start Time <span style={{ color: 'var(--danger-red)' }}>*</span></label>
                            <input type="time" className="form-control" name="start_time" value={formData.start_time} onChange={handleChange} />
                        </div>
                    </div>
                );

            case 'shift_close':
                return (
                    <div className="form-section">
                        <div className="form-row">
                            <label className="form-label">Shift <span style={{ color: 'var(--danger-red)' }}>*</span></label>
                            <select className="form-control" name="shift_name" value={formData.shift_name} onChange={handleChange}>
                                <option value="">-- SELECT --</option>
                                {masterData.shifts.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="form-row">
                            <label className="form-label">Operator <span style={{ color: 'var(--danger-red)' }}>*</span></label>
                            <select className="form-control" name="operator_name" value={formData.operator_name} onChange={handleChange}>
                                <option value="">-- Select --</option>
                                {masterData.operators.map(o => <option key={o.id} value={o.operator_name}>{o.operator_name}</option>)}
                            </select>
                        </div>
                        <div className="form-row">
                            <label className="form-label">End Time <span style={{ color: 'var(--danger-red)' }}>*</span></label>
                            <input type="time" className="form-control" name="end_time" value={formData.end_time} onChange={handleChange} />
                        </div>
                    </div>
                );

            case 'operator_change':
                return (
                    <div className="form-section">
                        <div className="form-row">
                            <label className="form-label">New Operator <span style={{ color: 'var(--danger-red)' }}>*</span></label>
                            <select className="form-control" name="operator_name" value={formData.operator_name} onChange={handleChange}>
                                <option value="">-- Select --</option>
                                {masterData.operators.map(o => <option key={o.id} value={o.operator_name}>{o.operator_name}</option>)}
                            </select>
                        </div>
                        <div className="form-row">
                            <label className="form-label">Start Time <span style={{ color: 'var(--danger-red)' }}>*</span></label>
                            <input type="time" className="form-control" name="start_time" value={formData.start_time} onChange={handleChange} />
                        </div>
                    </div>
                );

            case 'machine_start':
                return (
                    <div className="form-section">
                        <div className="form-row">
                            <label className="form-label">Start Time <span style={{ color: 'var(--danger-red)' }}>*</span></label>
                            <input type="time" className="form-control" name="start_time" value={formData.start_time} onChange={handleChange} />
                        </div>
                    </div>
                );

            case 'machine_stop':
                return (
                    <div className="form-section">
                        <div className="form-row">
                            <label className="form-label">Stop Time (End Time) <span style={{ color: 'var(--danger-red)' }}>*</span></label>
                            <input type="time" className="form-control" name="end_time" value={formData.end_time} onChange={handleChange} />
                        </div>
                        <div className="form-row">
                            <label className="form-label">Start Time (Optional)</label>
                            <input type="time" className="form-control" name="start_time" value={formData.start_time} onChange={handleChange} />
                        </div>
                        <div className="form-row">
                            <label className="form-label">No Of Bobbins <span style={{ color: 'var(--danger-red)' }}>*</span></label>
                            <input type="number" className="form-control" name="no_of_bobbins" value={formData.no_of_bobbins} onChange={handleChange} />
                        </div>
                        <div className="form-row">
                            <label className="form-label">Actual Weight <span style={{ color: 'var(--danger-red)' }}>*</span></label>
                            <input type="number" className="form-control" name="actual_weight" value={formData.actual_weight} onChange={handleChange} />
                        </div>
                        <div className="form-row">
                            <label className="form-label">Waste (Kgs)</label>
                            <input type="number" className="form-control" name="waste_kgs" value={formData.waste_kgs} onChange={handleChange} />
                        </div>
                        <div className="form-row">
                            <label className="form-label">Remarks</label>
                            <input type="text" className="form-control" name="remarks" value={formData.remarks} onChange={handleChange} />
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    const handleSubmit = async () => {
        try {
            let url = '';
            let payload = {};

            // Common payloads
            const common = { machine_name: formData.machine_name };

            // Note: min_time is used as running_time input in form
            const running_time = parseFloat(formData.min_time || 0);

            switch (activeTab) {
                case 'production':
                    url = `${API_BASE}/production/tfo-winder`;
                    payload = {
                        ...formData,
                        actual_weight: parseFloat(formData.actual_weight || 0),
                        waste_kgs: parseFloat(formData.waste_kgs || 0),
                        total_weight: parseFloat(formData.total_weight || 0),
                        no_of_spindles: parseFloat(formData.no_of_spindles || 0),
                        spindles: parseFloat(formData.spindles || 0),
                        rpm: parseFloat(formData.rpm || 0),
                        length: parseFloat(formData.length || 0),
                        taper: parseFloat(formData.taper || 0),
                        min_time: parseFloat(formData.min_time || 0),
                        max_time: parseFloat(formData.max_time || 0),
                        tolerance: parseFloat(formData.tolerance || 0),
                    };
                    break;
                case 'spindle_change':
                    url = `${API_BASE}/master/machines/operations/spindle-change`;
                    payload = { ...common, spindles: parseInt(formData.spindles || 0) };
                    break;
                case 'code_change':
                    url = `${API_BASE}/master/machines/operations/code-change`;
                    payload = {
                        ...common,
                        code: formData.code,
                        size: formData.specification, // Using specification field for size
                        weight: parseFloat(formData.weight || 0),
                        batch_no: formData.batch_no,
                        running_time: running_time
                    };
                    break;
                case 'weight_change':
                    url = `${API_BASE}/master/machines/operations/weight-change`;
                    payload = {
                        ...common,
                        weight: parseFloat(formData.weight || 0),
                        running_time: running_time
                    };
                    break;
                case 'shift_start':
                    url = `${API_BASE}/master/machines/operations/shift-start`;
                    payload = {
                        ...common,
                        shift: formData.shift_name,
                        operator: formData.operator_name,
                        start_time: formData.start_time
                    };
                    break;
                case 'shift_close':
                    url = `${API_BASE}/master/machines/operations/shift-close`;
                    payload = {
                        ...common,
                        shift: formData.shift_name,
                        operator: formData.operator_name,
                        end_time: formData.end_time
                    };
                    break;
                case 'operator_change':
                    url = `${API_BASE}/master/machines/operations/operator-change`;
                    payload = {
                        ...common,
                        operator: formData.operator_name,
                        start_time: formData.start_time
                    };
                    break;
                case 'machine_start':
                    url = `${API_BASE}/master/machines/operations/machine-start`;
                    payload = { ...common, start_time: formData.start_time };
                    break;
                case 'machine_stop':
                    url = `${API_BASE}/master/machines/operations/machine-stop`;
                    payload = {
                        ...common,
                        end_time: formData.end_time,
                        start_time: formData.start_time || null,
                        no_of_bobbins: parseInt(formData.no_of_bobbins || 0),
                        actual_weight: parseFloat(formData.actual_weight || 0),
                        waste: parseFloat(formData.waste_kgs || 0),
                        remarks: formData.remarks || ''
                    };
                    break;

                default:
                    alert('Unknown Tab');
                    return;
            }

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (res.ok) {
                alert("Action Completed Successfully!");
                if (activeTab === 'production') fetchList(); // Refresh list if generic production
                // Maybe fetch list anyway to show updates if they reflect in table
            } else {
                alert(`Error: ${JSON.stringify(data)}`);
            }
        } catch (err) {
            console.error(err);
            alert("Error processing request");
        }
    };

    const voiceSchema = {
        code: "Yarn code (alphanumeric)",
        machine_name: "Machine name/id",
        operator_name: "Name of the operator",
        shift_name: "Shift (Day/Night or specific name)",
        no_of_bobbins: "Number of bobbins (old no_of_spindles)",
        no_of_spindles: "Number of spindles (new)",
        spindles: "Active spindles count or running spindles",
        actual_weight: "Actual weight in kgs",
        waste_kgs: "Waste weight in kgs",
        total_weight: "Total weight",
        rpm: "RPM value",
        length: "Length value",
        taper: "Taper value",
        doff_no: "Doff number",
        batch_no: "Batch number",
        batch_doff_no: "Batch doff number",
        remarks: "Any additional remarks",
        start_time: "Start time (HH:MM or HH:MM:SS)",
        end_time: "End time (HH:MM or HH:MM:SS)",
        date: "Date of entry (YYYY-MM-DD)",
        wip: "WIP status (true/false or yes/no)",
        specification: "Specification or Size (e.g., 12 inch)",
        lot_size_completed: "Lot Size Completed status (true/false)",
        min_time: "Running time or minimum time",
        max_time: "Maximum time",
        tolerance: "Tolerance value",
        trolley: "Trolley number or name",
        weight: "Target weight or standard weight",
        unit: `Unit name. Valid values: ${masterData.units.map(u => `'${u}'`).join(', ')}`,
        sort_by: "Field to sort by (e.g., date, machine_name)",
        sort_order: "Sort order (asc or desc)",
        page_size: "Number of items to show"
    };

    return (
        <div className="container">
            <VoiceInputFAB onDataReceived={handleVoiceData} promptContext={voiceSchema} />
            <h2 className="page-title">TFO Winder Production</h2>

            {/* TAB NAVIGATION */}
            <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                overflowX: 'auto',
                scrollbarWidth: 'none', // Hide scrollbar Firefox
                msOverflowStyle: 'none', // Hide scrollbar IE/Edge
                padding: '0.5rem 0.5rem 0 0.5rem',
                borderBottom: '2px solid var(--primary-blue)',
                marginBottom: '1.5rem'
            }}>
                <style>{`
                    /* Hide scrollbar for Chrome/Safari */
                    .tab-scroll-container::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>
                <div className="tab-scroll-container" style={{ display: 'flex', width: '100%', overflowX: 'auto' }}>
                    {allTabs.map((tab, index) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '0.75rem 2rem',
                                border: '1px solid #e2e8f0',
                                borderBottom: 'none',
                                borderRadius: '16px 16px 0 0',
                                background: activeTab === tab.id ? 'var(--primary-blue)' : '#f8fafc',
                                color: activeTab === tab.id ? '#fff' : '#64748b',
                                cursor: 'pointer',
                                fontWeight: '600',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.2s',
                                marginLeft: index === 0 ? '0' : '-30px', // Heavy overlap
                                zIndex: activeTab === tab.id ? 10 : index, // Active on top, or maintain order
                                position: 'relative',
                                boxShadow: activeTab === tab.id ? '0 -4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
                                clipPath: 'polygon(10% 0, 90% 0, 100% 100%, 0% 100%)', // Trapezoid shape for real overlapping look? Maybe too much.
                                // Let's stick to simple overlapping pills/tabs first.
                                // Resetting clipPath for now, standard overlap is better.
                                minWidth: '140px'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Persistent Machine Selection */}
            <div className="form-section" style={{ marginBottom: '1.5rem' }}>
                <div className="form-row">
                    <label className="form-label">Machine Name <span style={{ color: 'var(--danger-red)' }}>*</span></label>
                    <select className="form-control" name="machine_name" value={formData.machine_name} onChange={handleChange}>
                        <option value="">-- SELECT --</option>
                        {masterData.machines
                            .filter(m => {
                                const type = (m.machine_type || '').trim().toLowerCase();
                                return type === 'tfo winder' || type.includes('tfo winder');
                            })
                            .map(m => <option key={m.id} value={m.machine_name}>{m.machine_name}</option>)}
                    </select>
                </div>
            </div>

            {renderTabContent()}

            <div className="action-buttons">
                <button className="btn-action btn-save" onClick={handleSubmit}>
                    {activeTab === 'production' ? 'Save Entry' : 'Update Machine'}
                </button>
                <button className="btn-action btn-clear" onClick={() => window.location.reload()}>Clear</button>
            </div>

            {/* LIST SECTION (Only show for Production Entry tab to avoid clutter?) 
                Actually user might want to see history while changing parameters. Keeping it. 
            */}
            {/* LIST SECTION */}
            <div style={{ marginTop: '3rem' }}>
                <h3 className="section-header">Last Production Entries</h3>

                {showNotification && (
                    <div
                        onClick={handleRefresh}
                        style={{
                            backgroundColor: '#dcfce7',
                            border: '1px solid #86efac',
                            color: '#166534',
                            padding: '1rem',
                            borderRadius: '8px',
                            marginBottom: '1rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '600',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}
                    >
                        <span>🔔 New production records available! Click here to refresh.</span>
                    </div>
                )}

                {/* Search & Filters */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <input
                            type="text"
                            placeholder="Search..."
                            className="form-control"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div>
                        <select className="form-control" value={filterMachine} onChange={(e) => setFilterMachine(e.target.value)}>
                            <option value="">All Machines</option>
                            {masterData.machines.map(m => <option key={m.id} value={m.machine_name}>{m.machine_name}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="date" className="form-control" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
                        <span>to</span>
                        <input type="date" className="form-control" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
                    </div>
                    <button className="btn-action btn-clear" style={{ padding: '0.5rem 1rem' }} onClick={() => {
                        setSearchQuery('');
                        setFilterMachine('');
                        setFilterStartDate('');
                        setFilterEndDate('');
                    }}>Reset</button>
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <label>Page Size: </label>
                        <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={{ padding: '0.2rem' }}>
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                    <div>
                        <span style={{ marginRight: '1rem' }}>Total: {listData.length} records</span>
                        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ marginRight: '0.5rem' }}>Prev</button>
                        <span>Page {page} of {totalPages}</span>
                        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ marginLeft: '0.5rem' }}>Next</button>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                <th style={thStyle} onClick={() => handleSort('id')}>ID {sortBy === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                                <th style={thStyle} onClick={() => handleSort('entry_date')}>Date {sortBy === 'entry_date' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                                <th style={thStyle} onClick={() => handleSort('machine')}>Machine {sortBy === 'machine' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                                <th style={thStyle}>Shift</th>
                                <th style={thStyle}>Code</th>
                                <th style={thStyle}>Batch No</th>
                                <th style={thStyle}>Operator</th>
                                <th style={thStyle}>No. of Bobbins</th>
                                <th style={thStyle}>Weight</th>
                                <th style={thStyle}>Total Weight</th>
                                <th style={thStyle}>Doff No</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listData.map(item => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={tdStyle}>{item.id}</td>
                                    <td style={tdStyle}>{new Date(item.entry_date || item.created_at).toLocaleDateString()}</td>
                                    <td style={tdStyle}>{item.machine_name}</td>
                                    <td style={tdStyle}>{item.shift}</td>
                                    <td style={tdStyle}>{item.code || '-'}</td>
                                    <td style={tdStyle}>{item.batch_no || '-'}</td>
                                    <td style={tdStyle}>{item.operator_name}</td>
                                    <td style={tdStyle}>{item.no_of_bobbins}</td>
                                    <td style={tdStyle}>{item.actual_weight}</td>
                                    <td style={tdStyle}>{item.total_weight}</td>
                                    <td style={tdStyle}>{item.current_doff_no}</td>
                                </tr>
                            ))}
                            {listData.length === 0 && (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '1rem' }}>No records found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}

const thStyle = { padding: '0.75rem', textAlign: 'left', cursor: 'pointer', userSelect: 'none' };
const tdStyle = { padding: '0.75rem' };
