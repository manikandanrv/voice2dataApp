
import { useState, useEffect } from 'react';
import VoiceInputFAB from './VoiceInputFAB';

const API_BASE = `${import.meta.env.VITE_API_URL}/api/master`;

const baseVoiceSchema = {
    shift_code: "Extract shift code. e.g. 'S1', 'Morning'.",
    shift_name: "Extract shift name. e.g. 'First Shift'.",
    shift_desc: "Extract description.",
    start_time: "Extract start time in HH:MM or HH:MM:SS 24h format.",
    close_time: "Extract close/end time in HH:MM or HH:MM:SS 24h format.",
    active: "Extract status as boolean."
};

export default function ShiftMaster() {
    const [formData, setFormData] = useState({
        shift_code: '',
        shift_name: '',
        shift_desc: '',
        start_time: '',
        close_time: '',
        active: true
    });

    const [listData, setListData] = useState([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [sortBy, setSortBy] = useState('id');
    const [sortOrder, setSortOrder] = useState('desc');
    const [searchQuery, setSearchQuery] = useState('');

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
            const res = await fetch(`${API_BASE}/shifts/?${queryParams.toString()}`);
            const data = await res.json();
            setListData(data.items || []);
            setTotalPages(data.pages || 0);
        } catch (err) {
            console.error("Error fetching shifts:", err);
        }
    };

    useEffect(() => {
        fetchList();
    }, [page, pageSize, sortBy, sortOrder, searchQuery]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleVoiceData = (data) => {
        setFormData(prev => ({
            ...prev,
            ...data
        }));
    };

    const handleSubmit = async () => {
        try {
            let res;
            if (formData.id) {
                res = await fetch(`${API_BASE}/shifts/${formData.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            } else {
                res = await fetch(`${API_BASE}/shifts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            }

            if (res.ok) {
                alert(formData.id ? "Shift updated successfully!" : "Shift saved successfully!");
                setFormData({
                    shift_code: '',
                    shift_name: '',
                    shift_desc: '',
                    start_time: '',
                    close_time: '',
                    active: true
                });
                fetchList();
            } else {
                alert("Error saving shift");
            }
        } catch (err) {
            console.error(err);
            alert("Error saving shift");
        }
    };

    const handleEdit = (item) => {
        setFormData({ ...item });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    const thStyle = { padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#475569', cursor: 'pointer' };

    return (
        <div className="container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h2 className="page-title" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', marginBottom: '2rem' }}>Shift Master</h2>

            <div className="form-section" style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', marginBottom: '3rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

                    <div>
                        <div className="form-row" style={{ marginBottom: '1rem' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Shift Code <span style={{ color: 'var(--danger-red)' }}>*</span></label>
                            <input type="text" className="form-control" name="shift_code" value={formData.shift_code} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                        </div>
                        <div className="form-row" style={{ marginBottom: '1rem' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Shift Name <span style={{ color: 'var(--danger-red)' }}>*</span></label>
                            <input type="text" className="form-control" name="shift_name" value={formData.shift_name} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                        </div>
                        <div className="form-row" style={{ marginBottom: '1rem' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Description</label>
                            <textarea className="form-control" name="shift_desc" value={formData.shift_desc} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                        </div>
                    </div>

                    <div>
                        <div className="form-row" style={{ marginBottom: '1rem' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Start Time (HH:MM:SS)</label>
                            <input type="time" step="1" className="form-control" name="start_time" value={formData.start_time} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                        </div>
                        <div className="form-row" style={{ marginBottom: '1rem' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Close Time (HH:MM:SS)</label>
                            <input type="time" step="1" className="form-control" name="close_time" value={formData.close_time} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
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
                    <button className="btn-clear" onClick={() => window.location.reload()} style={{ padding: '0.75rem 2rem', backgroundColor: '#94a3b8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Clear</button>
                </div>
            </div>

            <div>
                <h3 className="section-header" style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Shift List</h3>
                {/* List Control and Table */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                </div>

                <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                <th style={thStyle} onClick={() => handleSort('id')}>ID</th>
                                <th style={thStyle} onClick={() => handleSort('shift_code')}>Code</th>
                                <th style={thStyle} onClick={() => handleSort('shift_name')}>Name</th>
                                <th style={thStyle}>Start Time</th>
                                <th style={thStyle}>Close Time</th>
                                <th style={thStyle}>Status</th>
                                <th style={thStyle}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listData.map(item => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', background: 'white' }}>
                                    <td style={{ padding: '0.75rem' }}>{item.id}</td>
                                    <td style={{ padding: '0.75rem' }}>{item.shift_code}</td>
                                    <td style={{ padding: '0.75rem' }}>{item.shift_name}</td>
                                    <td style={{ padding: '0.75rem' }}>{item.start_time}</td>
                                    <td style={{ padding: '0.75rem' }}>{item.close_time}</td>
                                    <td style={{ padding: '0.75rem' }}>{item.active ? 'Active' : 'Inactive'}</td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <button onClick={() => handleEdit(item)} style={{ color: '#2563eb', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '500' }}>Edit</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <VoiceInputFAB onDataReceived={handleVoiceData} promptContext={baseVoiceSchema} />
        </div>
    );
}
