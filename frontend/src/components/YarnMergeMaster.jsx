import { useState, useEffect } from 'react';

const API_URL = `${import.meta.env.VITE_API_URL}/api/master/yarn-merges/`;

export default function YarnMergeMaster() {
    const [merges, setMerges] = useState([]);
    const [formData, setFormData] = useState({
        merge_code: '',
        merge_number: '',
        active: true
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    useEffect(() => {
        fetchMerges();
    }, []);

    const fetchMerges = async () => {
        try {
            const response = await fetch(`${API_URL}?limit=100`);
            const data = await response.json();
            setMerges(data.items || []);
        } catch (error) {
            console.error('Error fetching yarn merges:', error);
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
                fetchMerges();
                setFormData({ merge_code: '', merge_number: '', active: true });
                setIsEditing(false);
                setEditId(null);
            } else {
                console.error('Error saving yarn merge');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    };

    const handleEdit = (item) => {
        setFormData({
            merge_code: item.merge_code,
            merge_number: item.merge_number,
            active: item.active
        });
        setIsEditing(true);
        setEditId(item.id);
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1e293b' }}>
                Yarn Merge Master
            </h2>

            {/* Form */}
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>Merge Code</label>
                        <input
                            type="text"
                            name="merge_code"
                            value={formData.merge_code}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>Merge Number</label>
                        <input
                            type="text"
                            name="merge_number"
                            value={formData.merge_number}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                            required
                        />
                    </div>

                    <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#475569' }}>
                            <input
                                type="checkbox"
                                name="active"
                                checked={formData.active}
                                onChange={handleChange}
                                style={{ transform: 'scale(1.2)' }}
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
                            {isEditing ? 'Update Merge' : 'Add Merge'}
                        </button>
                        {isEditing && (
                            <button
                                type="button"
                                onClick={() => {
                                    setIsEditing(false);
                                    setFormData({ merge_code: '', merge_number: '', active: true });
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
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Merge Code</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Merge Number</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: '#475569' }}>Active</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {merges.map((item) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '0.75rem 1rem', color: '#1e293b' }}>{item.merge_code}</td>
                                <td style={{ padding: '0.75rem 1rem', color: '#1e293b' }}>{item.merge_number}</td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        backgroundColor: item.active ? '#dcfce7' : '#f1f5f9',
                                        color: item.active ? '#166534' : '#64748b'
                                    }}>
                                        {item.active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                    <button
                                        onClick={() => handleEdit(item)}
                                        style={{ marginRight: '0.5rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                                    >
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {merges.length === 0 && (
                            <tr>
                                <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                    No merges found. Add one above.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
