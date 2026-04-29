import { useState, useEffect } from 'react';

const API_URL = `${import.meta.env.VITE_API_URL}/api/master/twine-colors/`;

export default function TwineColorMaster() {
    const [colors, setColors] = useState([]);
    const [formData, setFormData] = useState({
        twine_color_code: '',
        twine_color_name: '',
        active: true
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    useEffect(() => {
        fetchColors();
    }, []);

    const fetchColors = async () => {
        try {
            const response = await fetch(`${API_URL}?limit=100`);
            const data = await response.json();
            setColors(data.items || []);
        } catch (error) {
            console.error('Error fetching twine colors:', error);
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
                fetchColors();
                setFormData({ twine_color_code: '', twine_color_name: '', active: true });
                setIsEditing(false);
                setEditId(null);
            } else {
                console.error('Error saving twine color');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    };

    const handleEdit = (item) => {
        setFormData({
            twine_color_code: item.twine_color_code,
            twine_color_name: item.twine_color_name,
            active: item.active
        });
        setIsEditing(true);
        setEditId(item.id);
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1e293b' }}>
                Twine Color Master
            </h2>

            {/* Form */}
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>Color Code</label>
                        <input
                            type="text"
                            name="twine_color_code"
                            value={formData.twine_color_code}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>Color Name</label>
                        <input
                            type="text"
                            name="twine_color_name"
                            value={formData.twine_color_name}
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
                            {isEditing ? 'Update Color' : 'Add Color'}
                        </button>
                        {isEditing && (
                            <button
                                type="button"
                                onClick={() => {
                                    setIsEditing(false);
                                    setFormData({ twine_color_code: '', twine_color_name: '', active: true });
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
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Color Code</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Color Name</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: '#475569' }}>Active</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {colors.map((item) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '0.75rem 1rem', color: '#1e293b' }}>{item.twine_color_code}</td>
                                <td style={{ padding: '0.75rem 1rem', color: '#1e293b' }}>{item.twine_color_name}</td>
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
                        {colors.length === 0 && (
                            <tr>
                                <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                    No colors found. Add one above.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
