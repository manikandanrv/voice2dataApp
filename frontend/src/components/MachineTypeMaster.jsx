
import { useState, useEffect } from 'react';

const API_BASE = `${import.meta.env.VITE_API_URL}/api/master`;

export default function MachineTypeMaster() {
    const [formData, setFormData] = useState({
        type_name: '',
        specification: {}, // JSON object
        running_parameters: {}, // JSON object
        operational_settings: {}, // JSON object
        active: true
    });

    const [listData, setListData] = useState([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);

    // Specification Editor State
    const [specValue, setSpecValue] = useState('');
    const [paramValue, setParamValue] = useState('');
    const [opValue, setOpValue] = useState('');

    const fetchList = async () => {
        try {
            const skip = (page - 1) * pageSize;
            const res = await fetch(`${API_BASE}/machine-types/?skip=${skip}&limit=${pageSize}`);
            const data = await res.json();
            setListData(data.items || []);
            setTotalPages(data.pages || 0);
        } catch (err) {
            console.error("Error fetching machine types:", err);
        }
    };

    useEffect(() => {
        fetchList();
    }, [page, pageSize]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Specification Handling
    const addSpec = () => {
        if (!specValue) return;

        const currentKeys = Object.keys(formData.specification || {});
        // Find next available spec key (spec1, spec2, ...)
        let nextIndex = 1;
        while (currentKeys.includes(`spec${nextIndex}`)) {
            nextIndex++;
        }
        const newKey = `spec${nextIndex}`;

        setFormData(prev => ({
            ...prev,
            specification: {
                ...prev.specification,
                [newKey]: specValue
            }
        }));
        setSpecValue('');
    };

    const removeSpec = (key) => {
        const newSpec = { ...formData.specification };
        delete newSpec[key];
        setFormData(prev => ({ ...prev, specification: newSpec }));
    };

    // Running Parameters Handling
    const addParam = () => {
        if (!paramValue) return;

        const currentKeys = Object.keys(formData.running_parameters || {});
        let nextIndex = 1;
        while (currentKeys.includes(`param${nextIndex}`)) {
            nextIndex++;
        }
        const newKey = `param${nextIndex}`;

        setFormData(prev => ({
            ...prev,
            running_parameters: {
                ...prev.running_parameters,
                [newKey]: paramValue
            }
        }));
        setParamValue('');
    };

    const removeParam = (key) => {
        const newParams = { ...formData.running_parameters };
        delete newParams[key];
        setFormData(prev => ({ ...prev, running_parameters: newParams }));
    };

    // Operational Settings Handling
    const addOp = () => {
        if (!opValue) return;

        const currentKeys = Object.keys(formData.operational_settings || {});
        let nextIndex = 1;
        while (currentKeys.includes(`op${nextIndex}`)) {
            nextIndex++;
        }
        const newKey = `op${nextIndex}`;

        setFormData(prev => ({
            ...prev,
            operational_settings: {
                ...prev.operational_settings,
                [newKey]: opValue
            }
        }));
        setOpValue('');
    };

    const removeOp = (key) => {
        const newOps = { ...formData.operational_settings };
        delete newOps[key];
        setFormData(prev => ({ ...prev, operational_settings: newOps }));
    };

    const handleSubmit = async () => {
        try {
            let res;
            if (formData.id) {
                res = await fetch(`${API_BASE}/machine-types/${formData.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            } else {
                res = await fetch(`${API_BASE}/machine-types/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            }

            if (res.ok) {
                alert("Saved successfully!");
                setFormData({ type_name: '', specification: {}, active: true });
                fetchList();
            } else {
                alert("Error saving data");
            }
        } catch (err) {
            console.error(err);
            alert("Error saving data");
        }
    };

    const handleEdit = (item) => {
        setFormData({
            ...item,
            ...item,
            specification: item.specification || {},
            running_parameters: item.running_parameters || {},
            operational_settings: item.operational_settings || {}
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="container" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <h2 className="page-title" style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '2rem' }}>Machine Type Master</h2>

            <div className="form-section" style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: '3rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>

                    <div className="form-row">
                        <label className="form-label" style={{ fontWeight: 500 }}>Type Name <span style={{ color: 'red' }}>*</span></label>
                        <input type="text" className="form-control" name="type_name" value={formData.type_name} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>

                    {/* Specification Editor */}
                    <div style={{ border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '8px' }}>
                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Specifications (JSON)</h4>

                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <input
                                type="text"
                                placeholder="Specification Name (e.g. no_of_spindles, no_of_decks)"
                                value={specValue}
                                onChange={(e) => setSpecValue(e.target.value)}
                                style={{ flex: 1, padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                            />
                            <button onClick={addSpec} style={{ padding: '0.5rem 1rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Add</button>
                        </div>

                        {/* Spec List */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {Object.entries(formData.specification || {}).map(([key, val]) => (
                                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.9rem' }}>
                                    <strong>{key}:</strong> {val}
                                    <button onClick={() => removeSpec(key)} style={{ border: 'none', background: 'none', color: 'red', cursor: 'pointer', fontWeight: 'bold', marginLeft: '0.5rem' }}>×</button>
                                </div>
                            ))}
                            {Object.keys(formData.specification || {}).length === 0 && <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No specifications added</span>}
                        </div>
                    </div>

                    {/* Running Parameters Editor */}
                    <div style={{ border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '8px' }}>
                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Running Parameters (JSON)</h4>

                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <input
                                type="text"
                                placeholder="Parameter Name (e.g. Temperature, Pressure)"
                                value={paramValue}
                                onChange={(e) => setParamValue(e.target.value)}
                                style={{ flex: 1, padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                            />
                            <button onClick={addParam} style={{ padding: '0.5rem 1rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Add</button>
                        </div>

                        {/* Param List */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {Object.entries(formData.running_parameters || {}).map(([key, val]) => (
                                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.9rem' }}>
                                    <strong>{key}:</strong> {val}
                                    <button onClick={() => removeParam(key)} style={{ border: 'none', background: 'none', color: 'red', cursor: 'pointer', fontWeight: 'bold', marginLeft: '0.5rem' }}>×</button>
                                </div>
                            ))}
                            {Object.keys(formData.running_parameters || {}).length === 0 && <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No parameters added</span>}
                        </div>
                    </div>

                    {/* Operational Settings Editor */}
                    <div style={{ border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '8px' }}>
                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Operational Settings (JSON)</h4>

                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <input
                                type="text"
                                placeholder="Setting Name (e.g. Speed, Tension)"
                                value={opValue}
                                onChange={(e) => setOpValue(e.target.value)}
                                style={{ flex: 1, padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                            />
                            <button onClick={addOp} style={{ padding: '0.5rem 1rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Add</button>
                        </div>

                        {/* Op List */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {Object.entries(formData.operational_settings || {}).map(([key, val]) => (
                                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.9rem' }}>
                                    <strong>{key}:</strong> {val}
                                    <button onClick={() => removeOp(key)} style={{ border: 'none', background: 'none', color: 'red', cursor: 'pointer', fontWeight: 'bold', marginLeft: '0.5rem' }}>×</button>
                                </div>
                            ))}
                            {Object.keys(formData.operational_settings || {}).length === 0 && <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No settings added</span>}
                        </div>
                    </div>

                    <div className="form-row">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input type="checkbox" name="active" checked={formData.active} onChange={handleChange} /> Active
                        </label>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={handleSubmit} style={{ padding: '0.75rem 2rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Save</button>
                        <button onClick={() => window.location.reload()} style={{ padding: '0.75rem 2rem', backgroundColor: '#94a3b8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Clear</button>
                    </div>

                </div>
            </div>

            {/* List */}
            <div>
                <h3 style={{ marginBottom: '1rem' }}>Machine Types List</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
                    <thead style={{ background: '#f8fafc' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>ID</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Type Name</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Specs</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Params</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Op Settings</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {listData.map(item => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '1rem' }}>{item.id}</td>
                                <td style={{ padding: '1rem' }}>{item.type_name}</td>
                                <td style={{ padding: '1rem' }}>
                                    <pre style={{ margin: 0, fontSize: '0.8rem' }}>{JSON.stringify(item.specification, null, 2)}</pre>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <pre style={{ margin: 0, fontSize: '0.8rem' }}>{JSON.stringify(item.running_parameters, null, 2)}</pre>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <pre style={{ margin: 0, fontSize: '0.8rem' }}>{JSON.stringify(item.operational_settings, null, 2)}</pre>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <button onClick={() => handleEdit(item)} style={{ color: '#2563eb', border: 'none', background: 'none', cursor: 'pointer' }}>Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
