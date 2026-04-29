
import { useState, useEffect } from 'react';
import VoiceInputFAB from './VoiceInputFAB';

const API_BASE = `${import.meta.env.VITE_API_URL}/api/master`;

// Static part of schema
const baseVoiceSchema = {
    machine_name: "Extract machine name. e.g. 'TFO-1', 'Veejay'",
    machine_code: "Extract machine code/number if mentioned. e.g. 'M-01', '12'",
    machine_description: "Extract any descriptive text about the machine configuration or location.",
    no_of_spindles: "Extract number of spindles as integer.",
    no_of_decks: "Extract number of decks as integer.",
    no_of_bobbins: "Extract number of bobbins as integer.",

    print_zone_name: "Extract print zone name if mentioned. Match with available zones.",

    unit: "Extract unit name. Valid values: 'Kaveripakkam', 'Puduchery'. Default to 'Kaveripakkam' if unsure.",
    active: "Extract status as boolean. 'Active' = true, 'Inactive' = false. Default true.",
    // List control
    sort_by: "If user asks to sort, return field name (e.g. 'machine_name', 'no_of_spindles').",
    sort_order: "If user asks to sort, return 'asc' or 'desc'. Default 'desc'.",
    page_size: "If user asks to show N items, return N as integer."
};

export default function MachineMaster() {
    const [formData, setFormData] = useState({
        machine_name: '',
        machine_code: '',
        machine_type: '',
        machine_description: '',

        unit: '', // Default empty, wait for load
        print_zone_name: '', // Initialized to empty string
        specification: {}, // Dynamic specification
        running_parameters: {}, // Dynamic running parameters
        operational_settings: {}, // Dynamic operational settings
        active: true
    });

    const [listData, setListData] = useState([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [sortBy, setSortBy] = useState('id');
    const [sortOrder, setSortOrder] = useState('desc');

    // Filters
    const [machineTypes, setMachineTypes] = useState([]);
    const [units, setUnits] = useState([]);
    const [printZones, setPrintZones] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedRows, setExpandedRows] = useState({});

    const toggleRow = (id) => {
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const fetchMachineTypes = async () => {
        try {
            const res = await fetch(`${API_BASE}/machine-types/?limit=100`);
            const data = await res.json();
            setMachineTypes(data.items || []);
        } catch (err) {
            console.error("Error fetching machine types:", err);
        }
    };

    const fetchUnits = async () => {
        try {
            const res = await fetch(`${API_BASE}/units/?limit=100`);
            const data = await res.json();
            setUnits(data.items || []);
        } catch (err) {
            console.error("Error fetching units:", err);
        }
    };

    const fetchPrintZones = async () => {
        try {
            const res = await fetch(`${API_BASE}/print-zones/?limit=100`);
            const data = await res.json();
            setPrintZones(data.items || []);
        } catch (err) {
            console.error("Error fetching print zones:", err);
        }
    };

    const fetchList = async () => {
        try {
            const skip = (page - 1) * pageSize;
            const queryParams = new URLSearchParams({
                skip,
                limit: pageSize,
                sort_by: sortBy,
                order: sortOrder,
                ...(searchQuery && { search: searchQuery }),
            });
            const res = await fetch(`${API_BASE}/machines/?${queryParams.toString()}`);
            const data = await res.json();
            setListData(data.items || []);
            setTotalPages(data.pages || 0);
        } catch (err) {
            console.error("Error fetching machine list:", err);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchList();
        }, 300);
        return () => clearTimeout(timer);
    }, [page, pageSize, sortBy, sortOrder, searchQuery]);

    useEffect(() => {
        fetchMachineTypes();
        fetchUnits();
        fetchPrintZones();
    }, []);

    // Construct dynamic schema
    const voiceSchema = {
        ...baseVoiceSchema,
        machine_type: `Extract machine type. Valid values: ${machineTypes.map(t => `'${t.type_name}'`).join(', ')}. Map similar terms to these values.`,
        unit: `Extract unit. Valid values: ${units.map(u => `'${u.unit_name}'`).join(', ')}.`
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        // Handle specification fields
        if (name.startsWith('spec_')) {
            const key = name.replace('spec_', '');
            setFormData(prev => ({
                ...prev,
                specification: {
                    ...prev.specification,
                    [key]: value
                }
            }));
            return;
        }

        // Handle running_param fields
        if (name.startsWith('param_')) {
            const key = name.replace('param_', '');
            setFormData(prev => ({
                ...prev,
                running_parameters: {
                    ...prev.running_parameters,
                    [key]: value
                }
            }));
            return;
        }

        // Handle operational_settings fields
        if (name.startsWith('op_')) {
            const key = name.replace('op_', '');
            setFormData(prev => ({
                ...prev,
                operational_settings: {
                    ...prev.operational_settings,
                    [key]: value
                }
            }));
            return;
        }

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Reset specification and running parameters when machine type changes
        if (name === 'machine_type') {
            const selectedType = machineTypes.find(t => t.type_name === value);
            if (selectedType) {
                // Specifications
                const newSpec = {};
                if (selectedType.specification) {
                    Object.values(selectedType.specification).forEach(val => {
                        if (val && typeof val === 'string') {
                            newSpec[val] = '';
                        }
                    });
                }

                // Running Parameters
                const newParams = {};
                if (selectedType.running_parameters) {
                    // The REQUIREMENT says: "keys will have to match the values mentioned in running_parametrs in tbl_machine_type_master"
                    // So if type has { "param1": "Size" }, we use "Size" as the key in machine master.
                    Object.values(selectedType.running_parameters).forEach(val => {
                        if (val && typeof val === 'string') {
                            newParams[val] = '';
                        }
                    });
                }

                // Operational Settings
                const newOps = {};
                if (selectedType.operational_settings) {
                    Object.values(selectedType.operational_settings).forEach(val => {
                        if (val && typeof val === 'string') {
                            newOps[val] = '';
                        }
                    });
                }

                setFormData(prev => ({
                    ...prev,
                    specification: newSpec,
                    running_parameters: newParams,
                    operational_settings: newOps
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    specification: {},
                    running_parameters: {},
                    operational_settings: {}
                }));
            }
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

        setFormData(prev => ({
            ...prev,
            ...data,
            no_of_spindles: data.no_of_spindles || prev.no_of_spindles,
            no_of_decks: data.no_of_decks || prev.no_of_decks,
            no_of_bobbins: data.no_of_bobbins || prev.no_of_bobbins,
            unit: data.unit || prev.unit,
            active: data.active !== undefined ? data.active : prev.active
        }));
        // Note: Voice extraction for strict specifications is complex; skipping auto-fill for specs for now
    };

    const handleSubmit = async () => {
        try {
            const payload = {
                ...formData
            };

            let res;
            if (formData.id) {
                // Update existing
                res = await fetch(`${API_BASE}/machines/${formData.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                // Create new
                res = await fetch(`${API_BASE}/machines`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            if (res.ok) {
                alert(formData.id ? "Machine updated successfully!" : "Machine saved successfully!");
                setFormData({
                    machine_name: '',
                    machine_code: '',
                    machine_type: '',
                    machine_description: '',
                    no_of_bobbins: 0,
                    unit: units.length > 0 ? units[0].unit_name : '', // Reset to first unit or empty
                    print_zone_name: '',
                    active: true
                });
                fetchList();
            } else {
                alert("Error saving machine");
            }
        } catch (err) {
            console.error(err);
            alert("Error saving machine");
        }
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    const handleEdit = (item) => {
        // Find the machine type definition to get all expected keys
        const selectedType = machineTypes.find(t => t.type_name === item.machine_type);

        // Merge Specifications
        let mergedSpecs = item.specification || {};
        if (selectedType && selectedType.specification) {
            const typeSpecs = {};
            Object.values(selectedType.specification).forEach(val => {
                if (val && typeof val === 'string') {
                    typeSpecs[val] = '';
                }
            });
            // Merge: Type keys are the base, existing values overwrite empty base
            mergedSpecs = { ...typeSpecs, ...mergedSpecs };
        }

        // Merge Running Parameters
        let mergedParams = item.running_parameters || {};
        if (selectedType && selectedType.running_parameters) {
            const typeParams = {};
            Object.values(selectedType.running_parameters).forEach(val => {
                if (val && typeof val === 'string') {
                    typeParams[val] = '';
                }
            });
            mergedParams = { ...typeParams, ...mergedParams };
        }

        // Merge Operational Settings
        let mergedOps = item.operational_settings || {};
        if (selectedType && selectedType.operational_settings) {
            const typeOps = {};
            Object.values(selectedType.operational_settings).forEach(val => {
                if (val && typeof val === 'string') {
                    typeOps[val] = '';
                }
            });
            mergedOps = { ...typeOps, ...mergedOps };
        }

        setFormData({
            ...item,
            specification: mergedSpecs,
            running_parameters: mergedParams,
            operational_settings: mergedOps
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const thStyle = { padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#475569', cursor: 'pointer' };

    return (
        <div className="container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h2 className="page-title" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', marginBottom: '2rem' }}>Machine Master</h2>

            <div className="form-section" style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', marginBottom: '3rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

                    <div>
                        <div className="form-row" style={{ marginBottom: '1rem' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Machine Name <span style={{ color: 'var(--danger-red)' }}>*</span></label>
                            <input type="text" className="form-control" name="machine_name" value={formData.machine_name} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                        </div>
                        <div className="form-row" style={{ marginBottom: '1rem' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Machine Code</label>
                            <input type="text" className="form-control" name="machine_code" value={formData.machine_code} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                        </div>
                        <div className="form-row" style={{ marginBottom: '1rem' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Machine Type</label>
                            <select className="form-control" name="machine_type" value={formData.machine_type} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                                <option value="">-- Select --</option>
                                {machineTypes.map(type => (
                                    <option key={type.id} value={type.type_name}>{type.type_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-row" style={{ marginBottom: '1rem' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Description</label>
                            <textarea className="form-control" name="machine_description" value={formData.machine_description} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                        </div>
                        <div className="form-row" style={{ marginBottom: '1rem' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Unit</label>
                            <select className="form-control" name="unit" value={formData.unit} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                                <option value="">-- Select --</option>
                                {units.map(u => (
                                    <option key={u.id} value={u.unit_name}>{u.unit_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-row" style={{ marginBottom: '1rem' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Print Zone</label>
                            <select className="form-control" name="print_zone_name" value={formData.print_zone_name} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                                <option value="">-- Select --</option>
                                {printZones.map(pz => (
                                    <option key={pz.id} value={pz.print_zone_name}>{pz.print_zone_name} ({pz.unit_name})</option>
                                ))}
                            </select>
                        </div>

                        {/* Dynamic Specifications */}
                        {Object.keys(formData.specification || {}).length > 0 && (
                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '1rem' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#475569' }}>Specifications ({formData.machine_type})</h4>
                                {Object.keys(formData.specification).map(key => (
                                    <div key={key} className="form-row" style={{ marginBottom: '0.5rem' }}>
                                        <label className="form-label" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: '500' }}>{key}</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name={`spec_${key}`} // Prefix to identify spec field
                                            value={formData.specification[key]}
                                            onChange={handleChange}
                                            style={{ width: '100%', padding: '0.4rem', border: '1px solid #ccc', borderRadius: '4px' }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Dynamic Running Parameters */}
                        {Object.keys(formData.running_parameters || {}).length > 0 && (
                            <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '8px', border: '1px solid #bbf7d0', marginTop: '1rem' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#166534' }}>Running Parameters ({formData.machine_type})</h4>
                                {Object.keys(formData.running_parameters).map(key => (
                                    <div key={key} className="form-row" style={{ marginBottom: '0.5rem' }}>
                                        <label className="form-label" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: '500' }}>{key}</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name={`param_${key}`} // Prefix to identify param field
                                            value={formData.running_parameters[key]}
                                            onChange={handleChange}
                                            style={{ width: '100%', padding: '0.4rem', border: '1px solid #ccc', borderRadius: '4px' }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Dynamic Operational Settings */}
                        {Object.keys(formData.operational_settings || {}).length > 0 && (
                            <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '8px', border: '1px solid #bfdbfe', marginTop: '1rem' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#1e40af' }}>Operational Settings ({formData.machine_type})</h4>
                                {Object.keys(formData.operational_settings).map(key => (
                                    <div key={key} className="form-row" style={{ marginBottom: '0.5rem' }}>
                                        <label className="form-label" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: '500' }}>{key}</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name={`op_${key}`} // Prefix to identify op field
                                            value={formData.operational_settings[key]}
                                            onChange={handleChange}
                                            style={{ width: '100%', padding: '0.4rem', border: '1px solid #ccc', borderRadius: '4px' }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                    </div>

                </div>

                <div>
                    <div className="form-row" style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input type="checkbox" name="active" checked={formData.active} onChange={handleChange} /> Active
                        </label>
                    </div>
                </div>
            </div>

            <div className="action-buttons" style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                <button className="btn-save" onClick={handleSubmit} style={{ padding: '0.75rem 2rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Save</button>
                <button className="btn-clear" onClick={() => window.location.reload()} style={{ padding: '0.75rem 2rem', backgroundColor: '#94a3b8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Clear</button>
            </div>


            {/* LIST SECTION */}
            <div>
                <h3 className="section-header" style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Machine List</h3>

                {/* Search & Filters */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <input
                            type="text"
                            placeholder="Search..."
                            className="form-control"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                        />
                    </div>
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <label>Page Size: </label>
                        <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={{ padding: '0.2rem', marginLeft: '0.5rem' }}>
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                    <div>
                        <span style={{ marginRight: '1rem' }}>Total: {listData.length} records</span>
                        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ marginRight: '0.5rem', padding: '0.2rem 0.5rem' }}>Prev</button>
                        <span>Page {page} of {totalPages}</span>
                        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ marginLeft: '0.5rem', padding: '0.2rem 0.5rem' }}>Next</button>
                    </div>
                </div>

                <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                <th style={thStyle} onClick={() => handleSort('id')}>ID {sortBy === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                                <th style={thStyle} onClick={() => handleSort('machine_name')}>Name {sortBy === 'machine_name' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                                <th style={thStyle} onClick={() => handleSort('machine_code')}>Code {sortBy === 'machine_code' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                                <th style={thStyle} onClick={() => handleSort('machine_type')}>Type {sortBy === 'machine_type' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                                <th style={thStyle}>Details</th>
                                <th style={thStyle}>Unit</th>
                                <th style={thStyle}>Print Zone</th>
                                <th style={thStyle}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listData.map(item => {
                                const isExpanded = expandedRows[item.id];
                                // Check if running parameters are missing (rpm is null) but operational settings exist
                                const hasOpSettings = item.operational_settings && Object.keys(item.operational_settings).length > 0;
                                const isRunParamsMissing = !item.running_parameters || item.running_parameters.rpm === null || item.running_parameters.rpm === undefined;
                                const isWarning = hasOpSettings && isRunParamsMissing;

                                return (
                                    <>
                                        <tr key={item.id} style={{ borderBottom: isExpanded ? 'none' : '1px solid #e2e8f0', background: isWarning ? '#fee2e2' : 'white' }}>
                                            <td style={{ padding: '0.4rem 0.75rem' }}>{item.id}</td>
                                            <td style={{ padding: '0.4rem 0.75rem', fontWeight: '500' }}>{item.machine_name}</td>
                                            <td style={{ padding: '0.4rem 0.75rem' }}>{item.machine_code}</td>
                                            <td style={{ padding: '0.4rem 0.75rem' }}>{item.machine_type}</td>
                                            <td style={{ padding: '0.4rem 0.75rem' }}>
                                                {item.operational_settings?.status && (
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: item.operational_settings.status === 'Running' ? 'green' : '#64748b', marginBottom: '0.25rem' }}>
                                                        {item.operational_settings.status}
                                                    </div>
                                                )}
                                                <button onClick={() => toggleRow(item.id)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.8rem' }}>
                                                    {isExpanded ? 'Hide Details ▲' : 'Show Details ▼'}
                                                </button>
                                            </td>
                                            <td style={{ padding: '0.4rem 0.75rem' }}>{item.unit}</td>
                                            <td style={{ padding: '0.4rem 0.75rem' }}>{item.print_zone_name}</td>
                                            <td style={{ padding: '0.4rem 0.75rem' }}>
                                                <button onClick={() => handleEdit(item)} style={{ color: '#2563eb', padding: 0, border: 'none', background: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem' }}>Edit</button>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr style={{ background: isWarning ? '#fff1f2' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                                <td colSpan="9" style={{ padding: '1rem 2rem' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                                                        {item.specification && Object.keys(item.specification).length > 0 && (
                                                            <div>
                                                                <strong style={{ color: '#475569', display: 'block', marginBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem' }}>Specifications</strong>
                                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
                                                                    {Object.entries(item.specification).map(([key, val]) => (
                                                                        <div key={key} style={{ background: 'white', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                                            <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem', textTransform: 'uppercase' }}>{key}</div>
                                                                            <div style={{ color: '#1e293b', fontWeight: '500' }}>
                                                                                {typeof val === 'object' && val !== null ? JSON.stringify(val) : (val || '-')}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {item.running_parameters && Object.keys(item.running_parameters).length > 0 && (
                                                            <div>
                                                                <strong style={{ color: '#166534', display: 'block', marginBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem' }}>Running Parameters</strong>
                                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
                                                                    {Object.entries(item.running_parameters).map(([key, val]) => (
                                                                        <div key={key} style={{ background: '#f0fdf4', padding: '0.75rem', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                                                                            <div style={{ color: '#166534', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem', textTransform: 'uppercase' }}>{key}</div>
                                                                            <div style={{ color: '#14532d', fontWeight: '500' }}>
                                                                                {typeof val === 'object' && val !== null ? JSON.stringify(val) : (val || '-')}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {item.operational_settings && Object.keys(item.operational_settings).length > 0 && (
                                                            <div>
                                                                <strong style={{ color: '#1e40af', display: 'block', marginBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem' }}>Operational Settings</strong>
                                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
                                                                    {Object.entries(item.operational_settings).map(([key, val]) => (
                                                                        <div key={key} style={{ background: '#eff6ff', padding: '0.75rem', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                                                                            <div style={{ color: '#1d4ed8', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem', textTransform: 'uppercase' }}>{key}</div>
                                                                            <div style={{ color: '#1e3a8a', fontWeight: '500' }}>
                                                                                {typeof val === 'object' && val !== null ? JSON.stringify(val) : (val || '-')}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                );
                            })}
                            {listData.length === 0 && (
                                <tr>
                                    <td colSpan="9" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No machines found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <VoiceInputFAB onDataReceived={handleVoiceData} promptContext={voiceSchema} />
        </div >
    );
}
