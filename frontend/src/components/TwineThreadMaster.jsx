import { useState, useEffect } from 'react';
import VoiceInputFAB from './VoiceInputFAB';

const API_BASE = `${import.meta.env.VITE_API_URL}/api/master`;

const baseVoiceSchema = {
    twine_thread_code: "Extract code.",
    twine_thread_name: "Extract name.",
    twine_thread_desc: "Extract description.",
    twine_ply_code: "Extract ply code.",
    sort_by: "Sort field.",
    sort_order: "Sort order.",
    page_size: "Page size."
};

export default function TwineThreadMaster() {
    const [formData, setFormData] = useState({
        twine_thread_code: '',
        twine_thread_name: '',
        twine_thread_desc: '',
        twine_ply_code: '',
        active: true
    });

    const [listData, setListData] = useState([]);
    const [plyList, setPlyList] = useState([]); // State for ply dropdown
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [sortBy, setSortBy] = useState('id');
    const [sortOrder, setSortOrder] = useState('desc');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchPlyList();
    }, []);

    const fetchPlyList = async () => {
        try {
            const res = await fetch(`${API_BASE}/twine-plies/?limit=1000`); // Fetch all plies
            const data = await res.json();
            setPlyList(data.items || []);
        } catch (err) {
            console.error("Error fetching ply list:", err);
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
            const res = await fetch(`${API_BASE}/twine-threads/?${queryParams.toString()}`);
            const data = await res.json();
            setListData(data.items || []);
            setTotalPages(data.pages || 0);
        } catch (err) {
            console.error("Error fetching list:", err);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchList();
        }, 300);
        return () => clearTimeout(timer);
    }, [page, pageSize, sortBy, sortOrder, searchQuery]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleVoiceData = (data) => {
        if (data.sort_by || data.page_size) {
            if (data.sort_by) setSortBy(data.sort_by);
            if (data.sort_order) setSortOrder(data.sort_order);
            if (data.page_size) setPageSize(parseInt(data.page_size));
            return;
        }
        setFormData(prev => ({ ...prev, ...data }));
    };

    const handleSubmit = async () => {
        try {
            const payload = { ...formData };
            let res;
            if (formData.id) {
                res = await fetch(`${API_BASE}/twine-threads/${formData.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch(`${API_BASE}/twine-threads`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            if (res.ok) {
                alert(formData.id ? "Updated!" : "Saved!");
                setFormData({
                    twine_thread_code: '',
                    twine_thread_name: '',
                    twine_thread_desc: '',
                    twine_ply_code: '',
                    active: true
                });
                fetchList();
            } else {
                alert("Error saving record");
            }
        } catch (err) {
            console.error(err);
            alert("Error saving record");
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
            <h2 className="page-title" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', marginBottom: '2rem' }}>Twine Thread Master</h2>

            <div className="form-section" style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', marginBottom: '3rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    <div>
                        <div className="form-row" style={{ marginBottom: '1rem' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Thread Code</label>
                            <input type="text" className="form-control" name="twine_thread_code" value={formData.twine_thread_code} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                        </div>
                        <div className="form-row" style={{ marginBottom: '1rem' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Thread Name</label>
                            <input type="text" className="form-control" name="twine_thread_name" value={formData.twine_thread_name} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                        </div>
                    </div>
                    <div>
                        <div className="form-row" style={{ marginBottom: '1rem' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Description</label>
                            <input type="text" className="form-control" name="twine_thread_desc" value={formData.twine_thread_desc} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                        </div>
                        <div className="form-row" style={{ marginBottom: '1rem' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Ply Code</label>
                            <select
                                className="form-control"
                                name="twine_ply_code"
                                value={formData.twine_ply_code}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                            >
                                <option value="">Select Ply Code</option>
                                {plyList.map(ply => (
                                    <option key={ply.id} value={ply.twine_ply_code}>
                                        {ply.twine_ply_code} - {ply.twine_ply_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-row" style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input type="checkbox" name="active" checked={formData.active} onChange={handleChange} /> Active
                            </label>
                        </div>
                        <div className="action-buttons" style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                            <button className="btn-save" onClick={handleSubmit} style={{ padding: '0.75rem 2rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Save</button>
                            <button className="btn-clear" onClick={() => window.location.reload()} style={{ padding: '0.75rem 2rem', backgroundColor: '#94a3b8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Clear</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* LIST SECTION */}
            <div>
                <h3 className="section-header" style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Thread List</h3>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <input type="text" placeholder="Search..." className="form-control" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
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
                                <th style={thStyle} onClick={() => handleSort('twine_thread_code')}>Code {sortBy === 'twine_thread_code' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                                <th style={thStyle} onClick={() => handleSort('twine_thread_name')}>Name {sortBy === 'twine_thread_name' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                                <th style={thStyle} onClick={() => handleSort('twine_ply_code')}>Ply Code {sortBy === 'twine_ply_code' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                                <th style={thStyle}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listData.map(item => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', background: 'white' }}>
                                    <td style={{ padding: '0.75rem' }}>{item.id}</td>
                                    <td style={{ padding: '0.75rem' }}>{item.twine_thread_code}</td>
                                    <td style={{ padding: '0.75rem', fontWeight: '500' }}>{item.twine_thread_name}</td>
                                    <td style={{ padding: '0.75rem' }}>{item.twine_ply_code}</td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <button onClick={() => handleEdit(item)} style={{ color: '#2563eb', padding: 0, border: 'none', background: 'none', cursor: 'pointer', fontWeight: '500' }}>Edit</button>
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
