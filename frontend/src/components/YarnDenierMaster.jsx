import { useState, useEffect } from 'react';

const API_URL = `${import.meta.env.VITE_API_URL}/api/master/yarns/`;
const PLY_API_URL = `${import.meta.env.VITE_API_URL}/api/master/primary-plies/`;

export default function YarnDenierMaster() {
    const [yarns, setYarns] = useState([]);
    const [plies, setPlies] = useState([]);
    const [formData, setFormData] = useState({
        yarn_code: '',
        yarn_name: '',
        uom: '',
        inspection: false,
        yarn_desc: '',
        ply_code: '',
        active: true
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    useEffect(() => {
        fetchYarns();
        fetchPlies();
    }, []);

    const fetchYarns = async () => {
        try {
            const response = await fetch(`${API_URL}?limit=100`);
            const data = await response.json();
            setYarns(data.items || []);
        } catch (error) {
            console.error('Error fetching yarns:', error);
        }
    };

    const fetchPlies = async () => {
        try {
            const response = await fetch(`${PLY_API_URL}?limit=100`);
            const data = await response.json();
            setPlies(data.items || []);
        } catch (error) {
            console.error('Error fetching plies:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const method = isEditing ? 'PUT' : 'POST';
            const url = isEditing ? `${API_URL}${editId}` : API_URL;

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                fetchYarns();
                setFormData({ yarn_code: '', yarn_name: '', uom: '', inspection: false, yarn_desc: '', ply_code: '', active: true });
                setIsEditing(false);
                setEditId(null);
            } else {
                console.error('Error saving yarn');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    };

    const handleEdit = (yarn) => {
        setFormData({
            yarn_code: yarn.yarn_code,
            yarn_name: yarn.yarn_name,
            uom: yarn.uom || '',
            inspection: yarn.inspection || false,
            yarn_desc: yarn.yarn_desc,
            ply_code: yarn.ply_code || '',
            active: yarn.active
        });
        setIsEditing(true);
        setEditId(yarn.id);
        window.scrollTo(0, 0);
    };



    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1e293b' }}>
                Yarn Denier Master
            </h2>

            {/* Form */}
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>Yarn Code</label>
                        <input
                            type="text"
                            name="yarn_code"
                            value={formData.yarn_code}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>Yarn Name</label>
                        <input
                            type="text"
                            name="yarn_name"
                            value={formData.yarn_name}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>Ply</label>
                        <select
                            name="ply_code"
                            value={formData.ply_code || ''}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                        >
                            <option value="">Select Ply</option>
                            {plies.map(p => (
                                <option key={p.id} value={p.primary_ply_code}>{p.primary_ply_name} ({p.primary_ply_code})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>UOM</label>
                        <input
                            type="text"
                            name="uom"
                            value={formData.uom}
                            onChange={handleChange}
                            placeholder="e.g. Kg, Mtr"
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#475569', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                name="inspection"
                                checked={formData.inspection}
                                onChange={handleChange}
                                style={{ transform: 'scale(1.2)' }}
                            />
                            Inspection Required
                        </label>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>Description</label>
                        <textarea
                            name="yarn_desc"
                            value={formData.yarn_desc}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', minHeight: '80px' }}
                        />
                    </div>

                    <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#475569' }}>
                            <input
                                type="checkbox"
                                name="active"
                                checked={formData.active}
                                onChange={handleChange}
                            />
                            Active
                        </label>
                        <button
                            type="submit"
                            style={{
                                marginLeft: 'auto',
                                padding: '0.5rem 1.5rem',
                                backgroundColor: '#2563eb',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 500
                            }}
                        >
                            {isEditing ? 'Update Yarn' : 'Add Yarn'}
                        </button>
                        {isEditing && (
                            <button
                                type="button"
                                onClick={() => {
                                    setIsEditing(false);
                                    setFormData({ yarn_code: '', yarn_name: '', uom: '', inspection: false, yarn_desc: '', ply_code: '', active: true });
                                    setEditId(null);
                                }}
                                style={{
                                    padding: '0.5rem 1.5rem',
                                    backgroundColor: '#94a3b8',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 500
                                }}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* List */}
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Code</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Yarn Name</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Ply</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>UOM</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: '#475569' }}>Insp?</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Description</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: '#475569' }}>Active</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {yarns.map((yarn) => (
                            <tr key={yarn.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '0.75rem 1rem', color: '#1e293b' }}>{yarn.yarn_code}</td>
                                <td style={{ padding: '0.75rem 1rem', color: '#1e293b' }}>{yarn.yarn_name}</td>
                                <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>
                                    {plies.find(p => p.primary_ply_code === yarn.ply_code)?.primary_ply_name || yarn.ply_code || '-'}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{yarn.uom}</td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#64748b' }}>
                                    {yarn.inspection ? 'Yes' : 'No'}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{yarn.yarn_desc}</td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        backgroundColor: yarn.active ? '#dcfce7' : '#f1f5f9',
                                        color: yarn.active ? '#166534' : '#64748b'
                                    }}>
                                        {yarn.active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                    <button
                                        onClick={() => handleEdit(yarn)}
                                        style={{ marginRight: '0.5rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                                    >
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {yarns.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                    No yarns found. Add one above.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div >
    );
}
