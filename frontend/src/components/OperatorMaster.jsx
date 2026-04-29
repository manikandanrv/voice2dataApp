
import { useState, useEffect } from 'react';

const API_BASE = `${import.meta.env.VITE_API_URL}/api/master`;

export default function OperatorMaster() {
    const [formData, setFormData] = useState({
        operator_name: '',
        operator_code: '',
        operator_full_name: '',
        machine_type: [], // Array for multi-select
        location_name: '',
        mobile_no: '',
        active: true
    });

    const [listData, setListData] = useState([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    // For dropdown
    const [machineTypes, setMachineTypes] = useState([]);
    const [locations, setLocations] = useState([]);

    const fetchMachineTypes = async () => {
        try {
            const res = await fetch(`${API_BASE}/machine-types/?limit=100`);
            const data = await res.json();
            setMachineTypes(data.items || []);
        } catch (err) {
            console.error("Error fetching machine types:", err);
        }
    };

    const fetchLocations = async () => {
        try {
            const res = await fetch(`${API_BASE}/locations/?limit=100`);
            const data = await res.json();
            setLocations(data.items || []);
        } catch (err) {
            console.error("Error fetching locations:", err);
        }
    };

    const fetchList = async () => {
        try {
            const skip = (page - 1) * pageSize;
            const queryParams = new URLSearchParams({
                skip,
                limit: pageSize,
                ...(searchQuery && { search: searchQuery }),
            });
            const res = await fetch(`${API_BASE}/operators/?${queryParams.toString()}`);
            const data = await res.json();
            setListData(data.items || []);
            setTotalPages(data.pages || 0);
        } catch (err) {
            console.error("Error fetching operator list:", err);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchList();
        }, 300);
        return () => clearTimeout(timer);
    }, [page, pageSize, searchQuery]);

    useEffect(() => {
        fetchMachineTypes();
        fetchLocations();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleMachineTypeChange = (e) => {
        const options = e.target.options;
        const selectedValues = [];
        for (let i = 0; i < options.length; i++) {
            if (options[i].selected) {
                selectedValues.push(options[i].value);
            }
        }
        setFormData(prev => ({
            ...prev,
            machine_type: selectedValues
        }));
    };

    const handleSubmit = async () => {
        try {
            const payload = { ...formData };
            let res;
            if (formData.id) {
                res = await fetch(`${API_BASE}/operators/${formData.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch(`${API_BASE}/operators`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            if (res.ok) {
                alert(formData.id ? "Operator updated successfully!" : "Operator saved successfully!");
                setFormData({
                    operator_name: '',
                    operator_code: '',
                    operator_full_name: '',
                    machine_type: [],
                    location_name: '',
                    mobile_no: '',
                    active: true
                });
                fetchList();
            } else {
                const errData = await res.json();
                alert("Error saving operator: " + (errData.detail || "Unknown error"));
            }
        } catch (err) {
            console.error(err);
            alert("Error saving operator");
        }
    };

    const handleEdit = (item) => {
        setFormData({
            ...item,
            machine_type: item.machine_type || [], // Ensure array
            location_name: item.location_name || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h2 className="page-title" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', marginBottom: '2rem' }}>Operator Master</h2>

            <div className="form-section" style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', marginBottom: '3rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    <div>
                        <div className="form-row" style={{ marginBottom: '1rem' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Operator Name (Unique) <span style={{ color: 'var(--danger-red)' }}>*</span></label>
                            <input type="text" className="form-control" name="operator_name" value={formData.operator_name} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                        </div>
                        <div className="form-row" style={{ marginBottom: '1rem' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Operator Code</label>
                            <input type="text" className="form-control" name="operator_code" value={formData.operator_code} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                        </div>
                        <div className="form-row" style={{ marginBottom: '1rem' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Full Name</label>
                            <input type="text" className="form-control" name="operator_full_name" value={formData.operator_full_name} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                        </div>
                    </div>
                    <div>
                        <div className="form-row" style={{ marginBottom: '1rem' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Machine Types (Multiple)</label>
                            <select multiple className="form-control" value={formData.machine_type} onChange={handleMachineTypeChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', minHeight: '120px' }}>
                                {machineTypes.map(type => (
                                    <option key={type.id} value={type.type_name}>{type.type_name}</option>
                                ))}
                            </select>
                            <small style={{ color: '#64748b' }}>Hold Ctrl (Windows) or Cmd (Mac) to select multiple</small>
                        </div>
                        <div className="form-row" style={{ marginBottom: '1rem' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Location</label>
                            <select className="form-control" name="location_name" value={formData.location_name} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                                <option value="">-- Select --</option>
                                {locations.map(l => (
                                    <option key={l.id} value={l.location_name}>{l.location_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-row" style={{ marginBottom: '1rem' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Mobile No</label>
                            <input type="text" className="form-control" name="mobile_no" value={formData.mobile_no} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                        </div>
                        <div className="form-row" style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input type="checkbox" name="active" checked={formData.active} onChange={handleChange} /> Active
                            </label>
                        </div>
                    </div>
                </div>

                <div className="action-buttons" style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                    <button className="btn-save" onClick={handleSubmit} style={{ padding: '0.75rem 2rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Save</button>
                    <button className="btn-clear" onClick={() => setFormData({ operator_name: '', operator_code: '', operator_full_name: '', machine_type: [], location_name: '', mobile_no: '', active: true })} style={{ padding: '0.75rem 2rem', backgroundColor: '#94a3b8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Clear</button>
                </div>
            </div>

            {/* LIST SECTION */}
            <div>
                <h3 className="section-header" style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Operator List</h3>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <input
                            type="text"
                            placeholder="Search operator..."
                            className="form-control"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <label>Page Size: </label>
                        <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={{ padding: '0.2rem', marginLeft: '0.5rem' }}>
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                        </select>
                    </div>
                    <div>
                        <span style={{ marginRight: '1rem' }}>Total: {listData.length} records</span> {/* Note: Ideally total from API */}
                        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ marginRight: '0.5rem', padding: '0.2rem 0.5rem' }}>Prev</button>
                        <span>Page {page} of {totalPages}</span>
                        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ marginLeft: '0.5rem', padding: '0.2rem 0.5rem' }}>Next</button>
                    </div>
                </div>

                <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                <th style={{ padding: '0.75rem', textAlign: 'left' }}>ID</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Operator Name</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Full Name</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Operator Code</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Location</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Machine Types</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Mobile No</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listData.map(item => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', background: 'white' }}>
                                    <td style={{ padding: '0.75rem' }}>{item.id}</td>
                                    <td style={{ padding: '0.75rem', fontWeight: '500' }}>{item.operator_name}</td>
                                    <td style={{ padding: '0.75rem' }}>{item.operator_full_name}</td>
                                    <td style={{ padding: '0.75rem' }}>{item.operator_code}</td>
                                    <td style={{ padding: '0.75rem' }}>{item.location_name}</td>
                                    <td style={{ padding: '0.75rem' }}>
                                        {Array.isArray(item.machine_type) ? (
                                            item.machine_type.map(t => <span key={t} style={{ display: 'inline-block', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', marginRight: '4px' }}>{t}</span>)
                                        ) : item.machine_type}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>{item.mobile_no}</td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <button onClick={() => handleEdit(item)} style={{ color: '#2563eb', padding: 0, border: 'none', background: 'none', cursor: 'pointer', fontWeight: '500' }}>Edit</button>
                                    </td>
                                </tr>
                            ))}
                            {listData.length === 0 && (
                                <tr>
                                    <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No operators found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
