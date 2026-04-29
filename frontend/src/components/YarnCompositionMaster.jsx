import { useState, useEffect } from 'react';

const API_URL = `${import.meta.env.VITE_API_URL}/api/master/yarn-compositions/`;
const SUPPLIER_YARN_API_URL = `${import.meta.env.VITE_API_URL}/api/master/yarn-suppliers/`;
const SUPPLIER_API_URL = `${import.meta.env.VITE_API_URL}/api/master/suppliers/`;
const DENIER_API_URL = `${import.meta.env.VITE_API_URL}/api/master/yarns/`;
const TYPE_API_URL = `${import.meta.env.VITE_API_URL}/api/master/yarn-types/`;
const COLOR_API_URL = `${import.meta.env.VITE_API_URL}/api/master/yarn-colors/`;
const MERGE_API_URL = `${import.meta.env.VITE_API_URL}/api/master/yarn-merges/`;

export default function YarnCompositionMaster() {
    const [compositions, setCompositions] = useState([]);
    const [supplierYarns, setSupplierYarns] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [deniers, setDeniers] = useState([]);
    const [types, setTypes] = useState([]);
    const [colors, setColors] = useState([]);
    const [merges, setMerges] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        composition_code: '',
        composition_name: '',
        active: true,
        details: [] // Array of { yarn_code: '', number_of_yarns: 0 }
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    useEffect(() => {
        fetchCompositions();
        fetchSupplierYarns();
        fetchSuppliers();
        fetchDeniers();
        fetchTypes();
        fetchColors();
        fetchMerges();
    }, []);

    const fetchCompositions = async () => {
        try {
            const response = await fetch(`${API_URL}?limit=100`);
            const data = await response.json();
            setCompositions(data.items || []);
        } catch (error) {
            console.error('Error fetching compositions:', error);
        }
    };

    const fetchSupplierYarns = async () => {
        try {
            const response = await fetch(`${SUPPLIER_YARN_API_URL}?limit=100`);
            const data = await response.json();
            setSupplierYarns(data.items || []);
        } catch (error) {
            console.error('Error fetching supplier yarns:', error);
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

    const fetchDeniers = async () => {
        try {
            const response = await fetch(`${DENIER_API_URL}?limit=100`);
            const data = await response.json();
            setDeniers(data.items || []);
        } catch (error) {
            console.error('Error fetching deniers:', error);
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

    const fetchMerges = async () => {
        try {
            const response = await fetch(`${MERGE_API_URL}?limit=100`);
            const data = await response.json();
            setMerges(data.items || []);
        } catch (error) {
            console.error('Error fetching merges:', error);
        }
    };

    // Helper functions for Names
    const getDenierName = (code) => {
        const d = deniers.find(x => x.yarn_code === code);
        return d ? d.yarn_name : code;
    };
    const getTypeName = (code) => {
        const t = types.find(x => x.yarn_type_code === code);
        return t ? t.yarn_type_name : code;
    };
    const getColorName = (code) => {
        const c = colors.find(x => x.yarn_color_code === code);
        return c ? c.yarn_color_name : code;
    };
    const getMergeNumber = (code) => {
        const m = merges.find(x => x.merge_code === code);
        return m ? m.merge_number : code;
    };
    const getSupplierName = (code) => {
        const s = suppliers.find(x => x.supplier_code === code);
        return s ? s.supplier_name : code;
    }

    const handleMasterChange = (e) => {
        const { name, value, type, checked } = e.target;
        let updates = { [name]: type === 'checkbox' ? checked : value };

        // Auto-populate names if codes change
        if (name === 'supplier_code') {
            const s = suppliers.find(x => x.supplier_code === value);
            if (s) updates['supplier_name'] = s.supplier_name;
            else updates['supplier_name'] = '';
        }

        setFormData({
            ...formData,
            ...updates
        });
    };

    // Detail handlers
    const addDetailRow = () => {
        setFormData({
            ...formData,
            details: [...formData.details, { yarn_supplier_id: '', number_of_yarns: '' }]
        });
    };

    const removeDetailRow = (index) => {
        const newDetails = [...formData.details];
        newDetails.splice(index, 1);
        setFormData({ ...formData, details: newDetails });
    };

    const handleDetailChange = (index, field, value) => {
        const newDetails = [...formData.details];
        newDetails[index][field] = value;
        setFormData({ ...formData, details: newDetails });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const method = isEditing ? 'PUT' : 'POST';
            const url = isEditing ? `${API_URL}${editId}` : API_URL;

            // Validate details
            const validDetails = formData.details.filter(d => d.yarn_supplier_id && d.number_of_yarns);

            if (validDetails.length < 2) {
                alert("A composition must contain at least 2 yarns.");
                return;
            }

            const payload = { ...formData, details: validDetails };

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                fetchCompositions();
                resetForm();
            } else {
                console.error('Error saving composition');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            composition_code: '',
            composition_name: '',
            active: true,
            details: []
        });
        setIsEditing(false);
        setEditId(null);
    }

    const handleEdit = (item) => {
        setFormData({
            composition_code: item.composition_code,
            composition_name: item.composition_name,
            active: item.active,
            details: item.details || []
        });
        setIsEditing(true);
        setEditId(item.id);
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1e293b' }}>
                Yarn Composition (Mix) Master
            </h2>

            {/* Form */}
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Composition Code</label>
                            <input type="text" name="composition_code" value={formData.composition_code} onChange={handleMasterChange} placeholder="e.g. 86" style={inputStyle} required />
                        </div>
                        <div>
                            <label style={labelStyle}>Composition Name</label>
                            <input type="text" name="composition_name" value={formData.composition_name} onChange={handleMasterChange} placeholder="e.g. 1260-630" style={inputStyle} required />
                        </div>
                    </div>

                    {/* Details Section */}
                    <div style={{ marginBottom: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>Yarn Mix Details</h3>
                        {formData.details.map((detail, index) => (
                            <div key={index} style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                                <select
                                    value={detail.yarn_supplier_id}
                                    onChange={(e) => handleDetailChange(index, 'yarn_supplier_id', e.target.value)}
                                    style={{ flex: 2, padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                    required
                                >
                                    <option value="">Select Supplier Yarn</option>
                                    {supplierYarns.map(sy => {
                                        const denierName = getDenierName(sy.yarn_code);
                                        const typeName = getTypeName(sy.yarn_type_code);
                                        const colorName = getColorName(sy.yarn_color_code);
                                        const mergeNum = getMergeNumber(sy.merge_code);
                                        let label = `${sy.supplier_name} (${sy.supplier_code}) - ${denierName} - ${typeName} - ${colorName}`;
                                        if (mergeNum) {
                                            label += ` - M:${mergeNum}`;
                                        }

                                        return (
                                            <option key={sy.id} value={sy.id}>
                                                {label}
                                            </option>
                                        );
                                    })}
                                </select>
                                <input
                                    type="number"
                                    placeholder="No. of Yarns"
                                    value={detail.number_of_yarns}
                                    onChange={(e) => handleDetailChange(index, 'number_of_yarns', e.target.value)}
                                    style={{ flex: 1, padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => removeDetailRow(index)}
                                    style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addDetailRow}
                            style={{ fontSize: '0.875rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                        >
                            + Add Yarn to Mix
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#475569' }}>
                            <input
                                type="checkbox"
                                name="active"
                                checked={formData.active}
                                onChange={handleMasterChange}
                            />
                            Active
                        </label>
                        <button type="submit" style={btnStyle(false)}>
                            {isEditing ? 'Update Composition' : 'Add Composition'}
                        </button>
                        {isEditing && (
                            <button type="button" onClick={resetForm} style={btnStyle(true)}>
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* List */}
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={thStyle}>Combined Yarn Code</th>
                            <th style={thStyle}>Combined Name</th>
                            <th style={thStyle}>Calculated Ply</th>
                            <th style={thStyle}>Composition Details</th>
                            <th style={thStyle}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {compositions.map((item) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={tdStyle}>{item.composition_code}</td>
                                <td style={tdStyle}>{item.composition_name}</td>
                                <td style={tdStyle}>{item.ply_code || '-'}</td>
                                <td style={tdStyle}>
                                    {item.details && item.details.map(d => (
                                        <div key={d.id} style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                            {d.number_of_yarns} x {d.yarn_code}
                                        </div>
                                    ))}
                                </td>
                                <td style={tdStyle}>
                                    <button onClick={() => handleEdit(item)} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const labelStyle = { display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#475569' };
const inputStyle = { width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' };
const thStyle = { padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' };
const tdStyle = { padding: '0.75rem 1rem', color: '#1e293b', verticalAlign: 'top' };
const btnStyle = (secondary) => ({
    marginLeft: secondary ? '0' : 'auto',
    padding: '0.5rem 1.5rem',
    backgroundColor: secondary ? '#94a3b8' : '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 500
});
