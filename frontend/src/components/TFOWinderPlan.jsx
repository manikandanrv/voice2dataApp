import { useState, useEffect } from 'react';

const API_BASE = `${import.meta.env.VITE_API_URL}/api/tfo-winder-plan`;
const MACHINE_API = `${import.meta.env.VITE_API_URL}/api/master/machines/`;
const SUPPLIER_API = `${import.meta.env.VITE_API_URL}/api/master/suppliers/`;

export default function TFOWinderPlan() {
    const [view, setView] = useState('list'); // 'list', 'form'
    const [listData, setListData] = useState([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    const [machines, setMachines] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    const initialFormState = {
        machine_name: '',
        supplier_name: '',
        code: '',
        size: '',
        rpm: '',
        length_in_metre: '',
        taper_in_mm: '',
        min_time_in_minutes: '',
        max_time_in_mins: '',
        weight_in_kgs: '',
        tolerance_in_gms: ''
    };
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        fetchList();
        fetchMasters();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => fetchList(), 300);
        return () => clearTimeout(timer);
    }, [page, pageSize, searchQuery]);

    const fetchList = async () => {
        try {
            const skip = (page - 1) * pageSize;
            const params = new URLSearchParams({ skip, limit: pageSize });
            if (searchQuery) params.append('search', searchQuery);

            const res = await fetch(`${API_BASE}/?${params}`);
            const data = await res.json();
            setListData(data.items || []);
            setTotalPages(data.pages || 0);
        } catch (err) {
            console.error("Error fetching list:", err);
        }
    };

    const fetchMasters = async () => {
        try {
            const mRes = await fetch(`${MACHINE_API}?limit=100`);
            const mData = await mRes.json();
            setMachines(mData.items || []);

            const sRes = await fetch(SUPPLIER_API);
            const sData = await sRes.json();
            setSuppliers(sData.items || []);
        } catch (err) {
            console.error("Error fetching masters:", err);
        }
    };

    const handleEdit = (item) => {
        setFormData(item);
        setView('form');
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
            fetchList();
        } catch (err) {
            console.error("Error deleting:", err);
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.machine_name || !formData.code) {
            alert("Machine Name and Code are mandatory.");
            return;
        }

        try {
            const method = formData.id ? 'PUT' : 'POST';
            const url = formData.id ? `${API_BASE}/${formData.id}` : API_BASE;

            // Sanitize payload: convert empty strings to null for numeric fields
            const payload = { ...formData };
            const numericFields = ['rpm', 'length_in_metre', 'taper_in_mm', 'min_time_in_minutes', 'max_time_in_mins', 'weight_in_kgs', 'tolerance_in_gms'];

            numericFields.forEach(field => {
                if (payload[field] === '') {
                    payload[field] = null;
                }
            });

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("Saved Successfully!");
                setView('list');
                fetchList();
                setFormData(initialFormState);
            } else {
                alert("Failed to save.");
            }
        } catch (err) {
            console.error("Error saving:", err);
        }
    };


    return (
        <div className="container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>TFO Winder Plan</h2>
                {view === 'list' ? (
                    <button onClick={() => { setFormData(initialFormState); setView('form'); }} style={btnStyle}>+ New Plan</button>
                ) : (
                    <button onClick={() => setView('list')} style={{ ...btnStyle, backgroundColor: '#64748b' }}>Back to List</button>
                )}
            </div>

            {view === 'list' ? (
                <div>
                    <input
                        type="text"
                        placeholder="Search Plan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ ...inputStyle, maxWidth: '300px', marginBottom: '1rem' }}
                    />
                    <table style={{ width: '100%', borderCollapse: 'collapse', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <thead style={{ background: '#f1f5f9' }}>
                            <tr>
                                <th style={thStyle}>Machine</th>
                                <th style={thStyle}>Supplier</th>
                                <th style={thStyle}>Code</th>
                                <th style={thStyle}>Size</th>
                                <th style={thStyle}>RPM</th>
                                <th style={thStyle}>Min Time</th>
                                <th style={thStyle}>Max Time</th>
                                <th style={thStyle}>Weight (kg)</th>
                                <th style={thStyle}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listData.map(item => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={tdStyle}>{item.machine_name}</td>
                                    <td style={tdStyle}>{item.supplier_name}</td>
                                    <td style={tdStyle}>{item.code}</td>
                                    <td style={tdStyle}>{item.size}</td>
                                    <td style={tdStyle}>{item.rpm}</td>
                                    <td style={tdStyle}>{item.min_time_in_minutes}</td>
                                    <td style={tdStyle}>{item.max_time_in_mins}</td>
                                    <td style={tdStyle}>{item.weight_in_kgs}</td>
                                    <td style={tdStyle}>
                                        <button onClick={() => handleEdit(item)} style={{ marginRight: '0.5rem', color: '#2563eb', border: 'none', background: 'none', cursor: 'pointer' }}>Edit</button>
                                        <button onClick={() => handleDelete(item.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                            {listData.length === 0 && <tr><td colSpan="7" style={{ padding: '1rem', textAlign: 'center' }}>No plans found</td></tr>}
                        </tbody>
                    </table>
                    {/* Pagination Controls could be added here */}
                </div>
            ) : (
                <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                    <div>
                        <label style={labelStyle}>Machine Name *</label>
                        <select name="machine_name" value={formData.machine_name} onChange={handleFormChange} style={inputStyle}>
                            <option value="">-- Select Machine --</option>
                            {machines.map(m => <option key={m.id} value={m.machine_name}>{m.machine_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Supplier Name</label>
                        <select name="supplier_name" value={formData.supplier_name} onChange={handleFormChange} style={inputStyle}>
                            <option value="">-- Select Supplier --</option>
                            {suppliers.map(s => <option key={s.id} value={s.supplier_name}>{s.supplier_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Code *</label>
                        <input type="text" name="code" value={formData.code} onChange={handleFormChange} style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Size</label>
                        <input type="text" name="size" value={formData.size} onChange={handleFormChange} style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>RPM</label>
                        <input type="number" name="rpm" value={formData.rpm} onChange={handleFormChange} style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Length (mtrs)</label>
                        <input type="number" name="length_in_metre" value={formData.length_in_metre} onChange={handleFormChange} style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Taper (mm)</label>
                        <input type="number" name="taper_in_mm" value={formData.taper_in_mm} onChange={handleFormChange} style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Min Time (mins)</label>
                        <input type="number" name="min_time_in_minutes" value={formData.min_time_in_minutes} onChange={handleFormChange} style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Max Time (mins)</label>
                        <input type="number" name="max_time_in_mins" value={formData.max_time_in_mins} onChange={handleFormChange} style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Weight (kgs)</label>
                        <input type="number" name="weight_in_kgs" value={formData.weight_in_kgs} onChange={handleFormChange} style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Tolerance (gms)</label>
                        <input type="number" name="tolerance_in_gms" value={formData.tolerance_in_gms} onChange={handleFormChange} style={inputStyle} />
                    </div>

                    <div style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
                        <button onClick={handleSubmit} style={btnStyle}>Save Plan</button>
                        <button onClick={() => setView('list')} style={{ ...btnStyle, background: '#94a3b8', marginLeft: '1rem' }}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
}

const btnStyle = { padding: '0.6rem 1.2rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 };
const inputStyle = { width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '4px' };
const labelStyle = { display: 'block', marginBottom: '0.4rem', fontWeight: 500, color: '#334155' };
const thStyle = { padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#475569', borderBottom: '2px solid #e2e8f0' };
const tdStyle = { padding: '1rem', color: '#334155' };
