import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/master`;

const CONFIG = {
    'cheese-tube-master': {
        title: 'Cheese Tube Master',
        apiUrl: `${API_BASE_URL}/cheese-tubes/`,
        fields: [
            { name: 'tube_name', label: 'Tube Name', type: 'text', required: true },
            { name: 'tube_type_code', label: 'Tube Type Code', type: 'text' },
            { name: 'tube_weight', label: 'Tube Weight (g)', type: 'number', step: '0.1', required: true }
        ],
        columns: [
            { key: 'tube_name', label: 'Tube Name' },
            { key: 'tube_type_code', label: 'Type Code' },
            { key: 'tube_weight', label: 'Weight' }
        ]
    },
    'cheese-tube-location': {
        title: 'Cheese Tube Location Weight',
        apiUrl: `${API_BASE_URL}/cheese-tube-locations/`,
        fields: [
            { name: 'tube_name', label: 'Tube Name', type: 'text', required: true },
            { name: 'location_name', label: 'Location', type: 'select', source: 'locations', valueField: 'location_name', labelField: 'location_name', required: true },
            { name: 'tube_weight', label: 'Weight (g)', type: 'number', step: '0.1', required: true }
        ],
        columns: [
            { key: 'tube_name', label: 'Tube Name' },
            { key: 'location_name', label: 'Location' },
            { key: 'tube_weight', label: 'Weight' }
        ]
    },
    'cheese-cover-master': {
        title: 'Cheese Cover Master',
        apiUrl: `${API_BASE_URL}/cheese-covers/`,
        fields: [
            { name: 'cover_name', label: 'Cover Name', type: 'text', required: true },
            { name: 'cover_weight', label: 'Cover Weight (g)', type: 'number', step: '0.1', required: true },
            { name: 'no_of_pcs', label: 'No. of Pcs', type: 'number', required: true }
        ],
        columns: [
            { key: 'cover_name', label: 'Cover Name' },
            { key: 'cover_weight', label: 'Weight' },
            { key: 'no_of_pcs', label: 'Pcs' }
        ]
    },
    'cheese-cover-location': {
        title: 'Cheese Cover Location Weight',
        apiUrl: `${API_BASE_URL}/cheese-cover-locations/`,
        fields: [
            { name: 'cover_name', label: 'Cover Name', type: 'text', required: true },
            { name: 'location_name', label: 'Location', type: 'select', source: 'locations', valueField: 'location_name', labelField: 'location_name', required: true },
            { name: 'cover_weight', label: 'Weight (g)', type: 'number', step: '0.1', required: true }
        ],
        columns: [
            { key: 'cover_name', label: 'Cover Name' },
            { key: 'location_name', label: 'Location' },
            { key: 'cover_weight', label: 'Weight' }
        ]
    },
    'cheese-box-master': {
        title: 'Cheese Box Master',
        apiUrl: `${API_BASE_URL}/cheese-boxes/`,
        fields: [
            { name: 'box_name', label: 'Box Name', type: 'text', required: true },
            { name: 'box_weight', label: 'Box Weight (g)', type: 'number', step: '0.1', required: true }
        ],
        columns: [
            { key: 'box_name', label: 'Box Name' },
            { key: 'box_weight', label: 'Weight' }
        ]
    },
    'cheese-box-location': {
        title: 'Cheese Box Location Weight',
        apiUrl: `${API_BASE_URL}/cheese-box-locations/`,
        fields: [
            { name: 'box_name', label: 'Box Name', type: 'text', required: true },
            { name: 'location_name', label: 'Location', type: 'select', source: 'locations', valueField: 'location_name', labelField: 'location_name', required: true },
            { name: 'box_weight', label: 'Weight (g)', type: 'number', step: '0.1', required: true }
        ],
        columns: [
            { key: 'box_name', label: 'Box Name' },
            { key: 'location_name', label: 'Location' },
            { key: 'box_weight', label: 'Weight' }
        ]
    },
    'cheese-sack-master': {
        title: 'Cheese Sack Master',
        apiUrl: `${API_BASE_URL}/cheese-sacks/`,
        fields: [
            { name: 'sack_name', label: 'Sack Name', type: 'text', required: true },
            { name: 'sack_weight', label: 'Sack Weight (g)', type: 'number', step: '0.1', required: true }
        ],
        columns: [
            { key: 'sack_name', label: 'Sack Name' },
            { key: 'sack_weight', label: 'Weight' }
        ]
    },
    'cheese-sack-location': {
        title: 'Cheese Sack Location Weight',
        apiUrl: `${API_BASE_URL}/cheese-sack-locations/`,
        fields: [
            { name: 'sack_name', label: 'Sack Name', type: 'text', required: true },
            { name: 'location_name', label: 'Location', type: 'select', source: 'locations', valueField: 'location_name', labelField: 'location_name', required: true },
            { name: 'sack_weight', label: 'Weight (g)', type: 'number', step: '0.1', required: true }
        ],
        columns: [
            { key: 'sack_name', label: 'Sack Name' },
            { key: 'location_name', label: 'Location' },
            { key: 'sack_weight', label: 'Weight' }
        ]
    },
    'cheese-box-sack-master': {
        title: 'Cheese Box/Sack Master',
        apiUrl: `${API_BASE_URL}/cheese-box-sacks/`,
        fields: [
            { name: 'box_sack', label: 'Box/Sack Detail', type: 'text', required: true },
            { name: 'box_name', label: 'Box Name', type: 'text' },
            { name: 'sack_name', label: 'Sack Name', type: 'text' },
            { name: 'no_of_boxes', label: 'No. of Boxes', type: 'number' },
            { name: 'no_of_sacks', label: 'No. of Sacks', type: 'number' },
            { name: 'total_weight', label: 'Total Weight (g)', type: 'number', step: '0.1', required: true }
        ],
        columns: [
            { key: 'box_sack', label: 'Detail' },
            { key: 'no_of_boxes', label: 'Boxes' },
            { key: 'no_of_sacks', label: 'Sacks' },
            { key: 'total_weight', label: 'Weight' }
        ]
    },
    'cheese-box-sack-location': {
        title: 'Cheese Box/Sack Location Weight',
        apiUrl: `${API_BASE_URL}/cheese-box-sack-locations/`,
        fields: [
            { name: 'box_sack', label: 'Box/Sack Detail', type: 'text', required: true },
            { name: 'location_name', label: 'Location', type: 'select', source: 'locations', valueField: 'location_name', labelField: 'location_name', required: true },
            { name: 'total_weight', label: 'Weight (g)', type: 'number', step: '0.1', required: true }
        ],
        columns: [
            { key: 'box_sack', label: 'Detail' },
            { key: 'location_name', label: 'Location' },
            { key: 'total_weight', label: 'Weight' }
        ]
    },
    'cheese-tube-cover-master': {
        title: 'Cheese Tube/Cover Combination Master',
        apiUrl: `${API_BASE_URL}/cheese-tube-covers/`,
        fields: [
            { name: 'tube_cover', label: 'Combination Code', type: 'text', required: true },
            { name: 'tube_name', label: 'Tube Name', type: 'select', source: 'cheese-tubes', valueField: 'tube_name', labelField: 'tube_name' },
            { name: 'cover_name', label: 'Cover Name', type: 'select', source: 'cheese-covers', valueField: 'cover_name', labelField: 'cover_name' },
            { name: 'no_of_tubes', label: 'No. of Tubes', type: 'number' },
            { name: 'no_of_covers', label: 'No. of Covers', type: 'number' },
            { name: 'total_weight', label: 'Total Weight (kg)', type: 'number', step: '0.001' },
            { name: 'box_sack', label: 'Box/Sack', type: 'text' },
            { name: 'cheese_weight', label: 'Cheese Weight (kg)', type: 'number', step: '0.001' }
        ],
        columns: [
            { key: 'tube_cover', label: 'Code' },
            { key: 'tube_name', label: 'Tube' },
            { key: 'cover_name', label: 'Cover' },
            { key: 'total_weight', label: 'Weight' }
        ]
    },
    'cheese-tube-cover-location': {
        title: 'Cheese Tube/Cover Combination Location Override',
        apiUrl: `${API_BASE_URL}/cheese-tube-cover-locations/`,
        fields: [
            { name: 'tube_cover', label: 'Combination Code', type: 'select', source: 'cheese-tube-covers', valueField: 'tube_cover', labelField: 'tube_cover', required: true },
            { name: 'location_name', label: 'Location', type: 'select', source: 'locations', valueField: 'location_name', labelField: 'location_name', required: true },
            { name: 'tare_weight', label: 'Tare Weight (kg)', type: 'number', step: '0.001', required: true }
        ],
        columns: [
            { key: 'tube_cover', label: 'Code' },
            { key: 'location_name', label: 'Location' },
            { key: 'tare_weight', label: 'Tare Weight' }
        ]
    },
    'twine-size-master': {
        title: 'Twine Size Master',
        apiUrl: `${import.meta.env.VITE_API_URL}/api/master/twine-sizes/`,
        fields: [
            { name: 'twine_size', label: 'Twine Size Code', type: 'text', required: true },
            { name: 'display_name', label: 'Display Name', type: 'text' },
            { name: 'twine_size_description', label: 'Description', type: 'text' }
        ],
        columns: [
            { key: 'twine_size', label: 'Code' },
            { key: 'display_name', label: 'Display Name' },
            { key: 'twine_size_description', label: 'Description' }
        ]
    }
};

export default function CheesePackingGenericMaster() {
    const { masterType } = useParams();
    const config = CONFIG[masterType];

    const [items, setItems] = useState([]);
    const [formData, setFormData] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sources, setSources] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    // Additional state for cheese-tube-cover-location override
    const [relatedInfo, setRelatedInfo] = useState({});
    const [tubeWeightData, setTubeWeightData] = useState(null);
    const [coverWeightData, setCoverWeightData] = useState(null);

    useEffect(() => {
        const fetchSources = async () => {
            const requiredSources = new Set();
            config?.fields.forEach(f => {
                if (f.source) requiredSources.add(f.source);
            });

            if (requiredSources.size === 0) return;

            const newSources = { ...sources };
            for (const source of requiredSources) {
                if (!newSources[source]) {
                    try {
                        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/master/${source}/?limit=500`);
                        const data = await res.json();
                        newSources[source] = data.items || [];
                    } catch (err) {
                        console.error(`Error fetching source ${source}:`, err);
                    }
                }
            }
            setSources(newSources);
        };

        if (config) {
            fetchItems();
            resetForm();
            fetchSources();
            setSearchTerm(''); // Reset search when switching masters
        }
    }, [masterType]);

    // Fetch related weights for cheese-tube-cover-location override
    useEffect(() => {
        const fetchRelatedData = async () => {
            if (isEditing && masterType === 'cheese-tube-cover-location' && formData.tube_cover && formData.location_name) {
                try {
                    // 1. Get tube_name and cover_name from combination master
                    const comboRes = await fetch(`${import.meta.env.VITE_API_URL}/api/master/cheese-tube-covers/?search=${encodeURIComponent(formData.tube_cover)}`);
                    const comboData = await comboRes.json();
                    const combo = comboData.items?.find(i => i.tube_cover === formData.tube_cover);
                    
                    if (combo) {
                        const { tube_name, cover_name } = combo;
                        setRelatedInfo({ tube_name, cover_name });

                        // 2. Fetch Tube Location Weight
                        const tubeLocRes = await fetch(`${import.meta.env.VITE_API_URL}/api/master/cheese-tube-locations/?search=${encodeURIComponent(tube_name)}`);
                        const tubeLocData = await tubeLocRes.json();
                        const tubeLoc = tubeLocData.items?.find(i => i.tube_name === tube_name && i.location_name === formData.location_name);
                        setTubeWeightData(tubeLoc || null);

                        // 3. Fetch Cover Location Weight
                        const coverLocRes = await fetch(`${import.meta.env.VITE_API_URL}/api/master/cheese-cover-locations/?search=${encodeURIComponent(cover_name)}`);
                        const coverLocData = await coverLocRes.json();
                        const coverLoc = coverLocData.items?.find(i => i.cover_name === cover_name && i.location_name === formData.location_name);
                        setCoverWeightData(coverLoc || null);
                    }
                } catch (err) {
                    console.error("Error fetching related weights:", err);
                }
            } else {
                setRelatedInfo({});
                setTubeWeightData(null);
                setCoverWeightData(null);
            }
        };

        fetchRelatedData();
    }, [isEditing, formData.tube_cover, formData.location_name, masterType]);

    const handleWeightUpdate = async (type, id, newWeight) => {
        if (!id) return;
        const endpoint = type === 'tube' ? 'cheese-tube-locations' : 'cheese-cover-locations';
        const field = type === 'tube' ? 'tube_weight' : 'cover_weight';
        
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/master/${endpoint}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: parseFloat(newWeight) })
            });

            if (res.ok) {
                alert(`${type.charAt(0).toUpperCase() + type.slice(1)} weight updated successfully`);
            } else {
                alert('Error updating weight');
            }
        } catch (err) {
            console.error(`Error updating ${type} weight:`, err);
        }
    };

    const resetForm = () => {
        const initialForm = { active: true };
        config?.fields.forEach(f => initialForm[f.name] = f.type === 'number' ? 0 : '');
        setFormData(initialForm);
        setIsEditing(false);
        setEditId(null);
    };

    const fetchItems = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${config.apiUrl}?limit=200`);
            const data = await response.json();
            setItems(data.items || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value)
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const method = isEditing ? 'PUT' : 'POST';
            const url = isEditing ? `${config.apiUrl}${editId}` : config.apiUrl;

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                fetchItems();
                resetForm();
            } else {
                alert('Error saving data');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    };

    const handleEdit = (item) => {
        setFormData({ ...item });
        setIsEditing(true);
        setEditId(item.id);
    };

    const filteredItems = items.filter(item => {
        if (!searchTerm) return true;
        const lowerSearch = searchTerm.toLowerCase();
        return config.columns.some(col => {
            const val = item[col.key];
            return val && val.toString().toLowerCase().includes(lowerSearch);
        });
    });

    if (!config) return <div style={{ padding: '2rem' }}>Invalid Master Type: {masterType}</div>;

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1e293b' }}>
                {config.title}
            </h2>

            {/* Form */}
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {config.fields.map(field => (
                        <div key={field.name} style={{ gridColumn: field.fullWidth ? 'span 2' : 'auto' }}>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>
                                {field.label}
                            </label>
                            {field.type === 'select' ? (
                                <select
                                    name={field.name}
                                    value={formData[field.name] || ''}
                                    onChange={handleChange}
                                    required={field.required}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                >
                                    <option value="">Select {field.label}</option>
                                    {(sources[field.source] || []).map(opt => (
                                        <option key={opt.id} value={opt[field.valueField]}>
                                            {field.source === 'units'
                                                ? `${opt.location_name} (${opt.unit_name})`
                                                : opt[field.labelField]}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type={field.type}
                                    name={field.name}
                                    value={formData[field.name] || ''}
                                    onChange={handleChange}
                                    step={field.step}
                                    required={field.required}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                />
                            )}
                        </div>
                    ))}

                    <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
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
                            {isEditing ? 'Update' : 'Add'}
                        </button>
                        {isEditing && (
                            <button
                                type="button"
                                onClick={resetForm}
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

            {/* Specialized UI for Cheese Tube/Cover Override */}
            {isEditing && masterType === 'cheese-tube-cover-location' && (
                <div style={{ backgroundColor: '#f0f9ff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #bae6fd', marginBottom: '2rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#0369a1', marginBottom: '1rem' }}>Related Weights at {formData.location_name}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        {/* Tube Weight Section */}
                        <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '6px', border: '1px solid #e0f2fe' }}>
                             <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>
                                 Tube: {relatedInfo.tube_name || 'N/A'}
                             </div>
                             {tubeWeightData ? (
                                 <div style={{ display: 'flex', gap: '0.5rem' }}>
                                     <input 
                                         type="number" 
                                         step="0.1"
                                         value={tubeWeightData.tube_weight}
                                         onChange={(e) => setTubeWeightData({...tubeWeightData, tube_weight: e.target.value})}
                                         style={{ flex: 1, padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                     />
                                     <button 
                                         onClick={() => handleWeightUpdate('tube', tubeWeightData.id, tubeWeightData.tube_weight)}
                                         style={{ padding: '0.4rem 0.8rem', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                                     >
                                         Update Tube Weight
                                     </button>
                                 </div>
                             ) : (
                                 <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No location weight record found for this tube.</div>
                             )}
                        </div>

                        {/* Cover Weight Section */}
                        <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '6px', border: '1px solid #e0f2fe' }}>
                             <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>
                                 Cover: {relatedInfo.cover_name || 'N/A'}
                             </div>
                             {coverWeightData ? (
                                 <div style={{ display: 'flex', gap: '0.5rem' }}>
                                     <input 
                                         type="number" 
                                         step="0.1"
                                         value={coverWeightData.cover_weight}
                                         onChange={(e) => setCoverWeightData({...coverWeightData, cover_weight: e.target.value})}
                                         style={{ flex: 1, padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                     />
                                     <button 
                                         onClick={() => handleWeightUpdate('cover', coverWeightData.id, coverWeightData.cover_weight)}
                                         style={{ padding: '0.4rem 0.8rem', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                                     >
                                         Update Cover Weight
                                     </button>
                                 </div>
                             ) : (
                                 <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No location weight record found for this cover.</div>
                             )}
                        </div>
                    </div>
                </div>
            )}

            {/* List */}
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#475569', margin: 0 }}>Records List</h3>
                    <div style={{ position: 'relative', width: '250px' }}>
                        <input
                            type="text"
                            placeholder="Search records..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.4rem 0.75rem',
                                paddingLeft: '2.2rem',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                fontSize: '0.875rem'
                            }}
                        />
                        <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                            🔍
                        </span>
                    </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            {config.columns.map(col => (
                                <th key={col.key} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>
                                    {col.label}
                                </th>
                            ))}
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: '#475569' }}>Status</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={config.columns.length + 2} style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
                        ) : filteredItems.length === 0 ? (
                            <tr><td colSpan={config.columns.length + 2} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No records found.</td></tr>
                        ) : filteredItems.map((item) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                {config.columns.map(col => (
                                    <td key={col.key} style={{ padding: '0.75rem 1rem', color: '#1e293b' }}>
                                        {item[col.key]}
                                    </td>
                                ))}
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
                    </tbody>
                </table>
            </div>
        </div>
    );
}
