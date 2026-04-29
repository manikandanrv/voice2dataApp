import { useState, useEffect } from 'react';

const API_URL = `${import.meta.env.VITE_API_URL}/api/master/yarn-suppliers/`;
const SUPPLIER_API_URL = `${import.meta.env.VITE_API_URL}/api/master/suppliers/`;
const YARN_API_URL = `${import.meta.env.VITE_API_URL}/api/master/yarns/`;
const TYPE_API_URL = `${import.meta.env.VITE_API_URL}/api/master/yarn-types/`;
const COLOR_API_URL = `${import.meta.env.VITE_API_URL}/api/master/yarn-colors/`;

const MERGE_API_URL = `${import.meta.env.VITE_API_URL}/api/master/yarn-merges/`;

export default function YarnSupplierMaster() {
    const [mappings, setMappings] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [yarns, setYarns] = useState([]);
    const [types, setTypes] = useState([]);
    const [colors, setColors] = useState([]);
    const [merges, setMerges] = useState([]);

    const [formData, setFormData] = useState({
        supplier_code: '',
        yarn_code: '',
        yarn_type_code: '',
        yarn_color_code: '',
        merge_code: '',
        distributor_id: '',
        active: true
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    useEffect(() => {
        fetchMappings();
        fetchSuppliers();
        fetchYarns();
        fetchTypes();
        fetchColors();
        fetchMerges();
    }, []);

    // ... fetch functions ...

    const fetchMerges = async () => {
        try {
            const response = await fetch(`${MERGE_API_URL}?limit=100`);
            const data = await response.json();
            setMerges(data.items || []);
        } catch (error) {
            console.error('Error fetching merges:', error);
        }
    };

    // ... helper ...
    const getMergeNumber = (code) => {
        const m = merges.find(x => x.merge_code === code);
        return m ? m.merge_number : code;
    };

    // ... render ... 
    // INSIDE FORM after Color


    const fetchMappings = async () => {
        try {
            const response = await fetch(`${API_URL}?limit=100`);
            const data = await response.json();
            setMappings(data.items || []);
        } catch (error) {
            console.error('Error fetching mappings:', error);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const response = await fetch(`${SUPPLIER_API_URL}?limit=100`);
            const data = await response.json();
            setSuppliers(data.items || []);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        }
    };

    const fetchYarns = async () => {
        try {
            const response = await fetch(`${YARN_API_URL}?limit=100`);
            const data = await response.json();
            setYarns(data.items || []);
        } catch (error) {
            console.error('Error fetching yarns:', error);
        }
    };

    const fetchTypes = async () => {
        try {
            const response = await fetch(`${TYPE_API_URL}?limit=100`);
            const data = await response.json();
            setTypes(data.items || []);
        } catch (error) {
            console.error('Error fetching types:', error);
        }
    };

    const fetchColors = async () => {
        try {
            const response = await fetch(`${COLOR_API_URL}?limit=100`);
            const data = await response.json();
            setColors(data.items || []);
        } catch (error) {
            console.error('Error fetching colors:', error);
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
                fetchMappings();
                setFormData({ supplier_code: '', yarn_code: '', yarn_type_code: '', yarn_color_code: '', merge_code: '', distributor_id: '', active: true });
                setIsEditing(false);
                setEditId(null);
            } else {
                console.error('Error saving mapping');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    };

    const handleEdit = (mapping) => {
        setFormData({
            supplier_code: mapping.supplier_code,
            yarn_code: mapping.yarn_code,
            yarn_type_code: mapping.yarn_type_code || '',
            yarn_color_code: mapping.yarn_color_code || '',
            merge_code: mapping.merge_code || '',
            distributor_id: mapping.distributor_id || '',
            active: mapping.active
        });
        setIsEditing(true);
        setEditId(mapping.id);
    };



    // Helper to get names
    const getSupplierName = (code) => {
        const sup = suppliers.find(s => s.supplier_code === code);
        return sup ? sup.supplier_name : code;
    };

    const getYarnName = (code) => {
        const y = yarns.find(yr => yr.yarn_code === code);
        return y ? y.yarn_name : code;
    };

    const getTypeName = (code) => {
        const t = types.find(type => type.yarn_type_code === code);
        return t ? t.yarn_type_name : code;
    };

    const getColorName = (code) => {
        const c = colors.find(color => color.yarn_color_code === code);
        return c ? c.yarn_color_name : code;
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1e293b' }}>
                Yarn - Supplier Mapping
            </h2>

            {/* Form */}
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>Supplier</label>
                        <select
                            name="supplier_code"
                            value={formData.supplier_code}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                            required
                        >
                            <option value="">Select Supplier</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.supplier_code}>{s.supplier_name} ({s.supplier_code})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>Yarn</label>
                        <select
                            name="yarn_code"
                            value={formData.yarn_code}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                            required
                        >
                            <option value="">Select Yarn</option>
                            {yarns.map(y => (
                                <option key={y.id} value={y.yarn_code}>{y.yarn_name} ({y.yarn_code})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>Type</label>
                        <select
                            name="yarn_type_code"
                            value={formData.yarn_type_code}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                            required
                        >
                            <option value="">Select Type</option>
                            {types.map(t => (
                                <option key={t.id} value={t.yarn_type_code}>{t.yarn_type_name} ({t.yarn_type_code})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>Color</label>
                        <select
                            name="yarn_color_code"
                            value={formData.yarn_color_code}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                            required
                        >
                            <option value="">Select Color</option>
                            {colors.map(c => (
                                <option key={c.id} value={c.yarn_color_code}>{c.yarn_color_name} ({c.yarn_color_code})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>Merge No</label>
                        <select
                            name="merge_code"
                            value={formData.merge_code}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                        >
                            <option value="">Select Merge</option>
                            {merges.map(m => (
                                <option key={m.id} value={m.merge_code}>{m.merge_number} ({m.merge_code})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>Distributor</label>
                        <select
                            name="distributor_id"
                            value={formData.distributor_id}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                        >
                            <option value="">Select Distributor</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.supplier_code}>{s.supplier_name} ({s.supplier_code})</option>
                            ))}
                        </select>
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
                            {isEditing ? 'Update Mapping' : 'Add Mapping'}
                        </button>
                        {isEditing && (
                            <button
                                type="button"
                                onClick={() => {
                                    setIsEditing(false);
                                    setFormData({ supplier_code: '', yarn_code: '', yarn_type_code: '', yarn_color_code: '', merge_code: '', distributor_id: '', active: true });
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
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Supplier</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Yarn</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Type</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Color</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Merge</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Distributor</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: '#475569' }}>Active</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mappings.map((mapping) => (
                            <tr key={mapping.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '0.75rem 1rem', color: '#1e293b' }}>
                                    <div style={{ fontWeight: 500 }}>{getSupplierName(mapping.supplier_code)}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{mapping.supplier_code}</div>
                                </td>
                                <td style={{ padding: '0.75rem 1rem', color: '#1e293b' }}>
                                    <div style={{ fontWeight: 500 }}>{getYarnName(mapping.yarn_code)}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{mapping.yarn_code}</div>
                                </td>
                                <td style={{ padding: '0.75rem 1rem', color: '#1e293b' }}>
                                    <div style={{ fontWeight: 500 }}>{getTypeName(mapping.yarn_type_code)}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{mapping.yarn_type_code}</div>
                                </td>
                                <td style={{ padding: '0.75rem 1rem', color: '#1e293b' }}>
                                    <div style={{ fontWeight: 500 }}>{getColorName(mapping.yarn_color_code)}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{mapping.yarn_color_code}</div>
                                </td>
                                <td style={{ padding: '0.75rem 1rem', color: '#1e293b' }}>
                                    <div style={{ fontWeight: 500 }}>{getMergeNumber(mapping.merge_code)}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{mapping.merge_code}</div>
                                </td>
                                <td style={{ padding: '0.75rem 1rem', color: '#1e293b' }}>
                                    <div style={{ fontWeight: 500 }}>{mapping.distributor_id ? getSupplierName(mapping.distributor_id) : '-'}</div>
                                    {mapping.distributor_id && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{mapping.distributor_id}</div>}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        backgroundColor: mapping.active ? '#dcfce7' : '#f1f5f9',
                                        color: mapping.active ? '#166534' : '#64748b'
                                    }}>
                                        {mapping.active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                    <button
                                        onClick={() => handleEdit(mapping)}
                                        style={{ marginRight: '0.5rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                                    >
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {mappings.length === 0 && (
                            <tr>
                                <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                    No mappings found. Add one above.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
