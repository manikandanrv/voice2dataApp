import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

export default function BagSizeSettings() {
    const { token } = useAuth();
    const [settings, setSettings] = useState([]);
    const [locations, setLocations] = useState([]);
    const [twineSizes, setTwineSizes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    const [formData, setFormData] = useState({
        location_code: '',
        twine_size: '',
        bag: true,
        order_type: '',
        order_no: '',
        override_secondary_order_type: true
    });

    useEffect(() => {
        fetchSettings();
        fetchLocations();
        fetchTwineSizes();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/bag-size-settings/?limit=1000`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setSettings(data.items || []);
        } catch (err) {
            console.error('Error fetching settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLocations = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/master/locations/?limit=500`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setLocations(data.items || []);
        } catch (err) {
            console.error('Error fetching locations:', err);
        }
    };

    const fetchTwineSizes = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/master/twine-sizes/?limit=1000`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setTwineSizes(data.items || []);
        } catch (err) {
            console.error('Error fetching twine sizes:', err);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const resetForm = () => {
        setFormData({
            location_code: '',
            twine_size: '',
            bag: true,
            order_type: '',
            order_no: '',
            override_secondary_order_type: true
        });
        setIsEditing(false);
        setEditId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const method = isEditing ? 'PUT' : 'POST';
            const url = isEditing
                ? `${API_BASE_URL}/bag-size-settings/${editId}`
                : `${API_BASE_URL}/bag-size-settings/`;

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                fetchSettings();
                resetForm();
            } else {
                alert('Error saving settings');
            }
        } catch (err) {
            console.error('Error submitting form:', err);
        }
    };

    const handleEdit = (item) => {
        setFormData({
            location_code: item.location_code || '',
            twine_size: item.twine_size || '',
            bag: item.bag ?? true,
            order_type: item.order_type || '',
            order_no: item.order_no || '',
            override_secondary_order_type: item.override_secondary_order_type ?? true
        });
        setIsEditing(true);
        setEditId(item.id);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this setting?')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/bag-size-settings/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchSettings();
            }
        } catch (err) {
            console.error('Error deleting setting:', err);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1e293b' }}>
                Cheese Packing Bag Size Settings
            </h2>

            {/* Form Section */}
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>
                            Location
                        </label>
                        <select
                            name="location_code"
                            value={formData.location_code}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                        >
                            <option value="">Select Location</option>
                            {locations.map(loc => (
                                <option key={loc.id} value={loc.location_code}>
                                    {loc.location_name} ({loc.location_code})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>
                            Twine Size
                        </label>
                        <select
                            name="twine_size"
                            value={formData.twine_size}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                        >
                            <option value="">Select Size</option>
                            {twineSizes.map(size => (
                                <option key={size.id} value={size.twine_size}>
                                    {size.display_name || size.twine_size}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
                            <input
                                type="checkbox"
                                name="bag"
                                checked={formData.bag}
                                onChange={handleChange}
                                style={{ width: '1.1rem', height: '1.1rem' }}
                            />
                            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>Bag (True/False)</span>
                        </label>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>
                            Order Type
                        </label>
                        <input
                            type="text"
                            name="order_type"
                            value={formData.order_type}
                            onChange={handleChange}
                            placeholder="e.g. EXPORT-S1"
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>
                            Order No
                        </label>
                        <input
                            type="text"
                            name="order_no"
                            value={formData.order_no}
                            onChange={handleChange}
                            placeholder="e.g. ORD12345"
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
                            <input
                                type="checkbox"
                                name="override_secondary_order_type"
                                checked={formData.override_secondary_order_type}
                                onChange={handleChange}
                                style={{ width: '1.1rem', height: '1.1rem' }}
                            />
                            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>Override Secondary Details</span>
                        </label>
                    </div>

                    <div style={{ gridColumn: 'span 3', display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                        <button
                            type="submit"
                            style={{
                                padding: '0.6rem 2rem',
                                backgroundColor: '#2563eb',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}
                        >
                            {isEditing ? 'Update Setting' : 'Add Setting'}
                        </button>
                        <button
                            type="button"
                            onClick={resetForm}
                            style={{
                                padding: '0.6rem 2rem',
                                backgroundColor: '#f1f5f9',
                                color: '#475569',
                                border: '1px solid #cbd5e1',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 500,
                                fontSize: '0.9rem'
                            }}
                        >
                            Reset
                        </button>
                    </div>
                </form>
            </div>

            {/* List Section */}
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Location</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Twine Size</th>
                            <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, color: '#475569' }}>Bag</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Order Type</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Order No</th>
                            <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, color: '#475569' }}>Override</th>
                            <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                                    Loading settings...
                                </td>
                            </tr>
                        ) : settings.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                                    No settings found.
                                </td>
                            </tr>
                        ) : (
                            settings.map((item) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '1rem', color: '#1e293b', fontWeight: 500 }}>{item.location_code}</td>
                                    <td style={{ padding: '1rem', color: '#1e293b' }}>{item.twine_size}</td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <span style={{
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            backgroundColor: item.bag ? '#dcfce7' : '#fee2e2',
                                            color: item.bag ? '#166534' : '#991b1b'
                                        }}>
                                            {item.bag ? 'YES' : 'NO'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', color: '#1e293b' }}>{item.order_type || '-'}</td>
                                    <td style={{ padding: '1rem', color: '#1e293b' }}>{item.order_no || '-'}</td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <span style={{ color: item.override_secondary_order_type ? '#2563eb' : '#94a3b8' }}>
                                            {item.override_secondary_order_type ? 'True' : 'False'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <button
                                            onClick={() => handleEdit(item)}
                                            style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, marginRight: '1rem' }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
