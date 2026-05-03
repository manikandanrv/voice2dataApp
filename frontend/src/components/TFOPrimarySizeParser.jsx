import React, { useState, useEffect } from 'react';

const API_BASE = `${import.meta.env.VITE_API_URL}/api/yarn`;

export default function TFOPrimarySizeParser() {
    const [sizeCode, setSizeCode] = useState('');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Master List State
    const [masters, setMasters] = useState([]);
    const [masterPage, setMasterPage] = useState(1);
    const [masterTotal, setMasterTotal] = useState(0);
    const [masterSearch, setMasterSearch] = useState('');
    const [addingMaster, setAddingMaster] = useState(false);
    const [addMessage, setAddMessage] = useState('');

    // Editable fields for Master Entry
    const [editableDisplayName, setEditableDisplayName] = useState('');
    const [editableDescription, setEditableDescription] = useState('');

    useEffect(() => {
        fetchMasters();
    }, [masterPage, masterSearch]);

    const fetchMasters = async () => {
        try {
            let url = `${API_BASE}/tfo-primary-masters?page=${masterPage}&limit=5`;
            if (masterSearch) url += `&search=${encodeURIComponent(masterSearch)}`;

            const res = await fetch(url);
            const data = await res.json();
            if (res.ok) {
                setMasters(data.data);
                setMasterTotal(data.total);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleParse = async (e) => {
        e.preventDefault();
        setError('');
        setResult(null);
        setAddMessage('');
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE}/parse-tfo-primary-size?size_string=${encodeURIComponent(sizeCode)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (response.ok) {
                if (data.error) {
                    setError(data.error);
                } else {
                    setResult(data);
                    setEditableDisplayName(data.generated_display_name || '');
                    setEditableDescription(data.generated_description || '');
                }
            } else {
                setError('Failed to parse. Server returned error.');
            }
        } catch (err) {
            setError('Network error or server down.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToMaster = async () => {
        if (!result || !sizeCode) return;
        setAddingMaster(true);
        setAddMessage('');

        try {
            const payload = {
                primary_ply_size: sizeCode,
                display_name: editableDisplayName || result.generated_display_name || sizeCode,
                primary_ply_size_description: editableDescription || result.generated_description,
                active: true
            };

            if (result.ply_value && result._yarn_ply_value && result.ply_value === result._yarn_ply_value) {
                payload.output_code_type = 'Doubler_Primary';
            }

            const res = await fetch(`${API_BASE}/tfo-primary-masters`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setAddMessage('Success: Added to TFO Primary Master!');
                fetchMasters(); // Refresh table
            } else {
                const errData = await res.json();
                setAddMessage(`Error: ${errData.detail || 'Failed to add'}`);
            }
        } catch (err) {
            setAddMessage('Error: Network failed');
        } finally {
            setAddingMaster(false);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1e293b' }}>
                TFO Primary Size Manager
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>

                {/* Parser Section */}
                <div style={cardStyle}>
                    <h3 style={sectionHeaderStyle}>Parse & Add New Size</h3>
                    <form onSubmit={handleParse} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                        <input
                            type="text"
                            value={sizeCode}
                            onChange={(e) => setSizeCode(e.target.value)}
                            placeholder="Enter Code (e.g. 6TPHN3POGM01V)"
                            style={inputStyle}
                        />
                        <button type="submit" disabled={loading || !sizeCode} style={buttonStyle}>
                            {loading ? 'Parsing...' : 'Check Code'}
                        </button>
                    </form>

                    {error && <div style={errorStyle}>{error}</div>}

                    {result && (
                        <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
                            {/* Validation Errors */}
                            {result.errors && result.errors.length > 0 && (
                                <div style={warningStyle}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>⚠️ Validation Issues</h4>
                                    <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                                        {result.errors.map((err, i) => <li key={i}>{err}</li>)}
                                    </ul>
                                </div>
                            )}

                            {/* Parsed Details */}
                            {(!result.errors || result.errors.length === 0) && (
                                <>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                        <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '8px' }}>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#166534', fontWeight: '600', marginBottom: '0.5rem' }}>DISPLAY NAME</label>
                                            <input
                                                type="text"
                                                value={editableDisplayName}
                                                onChange={(e) => setEditableDisplayName(e.target.value)}
                                                style={{ ...inputStyle, width: '100%', fontSize: '1.1rem', fontWeight: 'bold', color: '#15803d', backgroundColor: '#fff' }}
                                            />
                                        </div>
                                        <div style={{ padding: '1rem', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px' }}>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#0369a1', fontWeight: '600', marginBottom: '0.5rem' }}>DESCRIPTION</label>
                                            <input
                                                type="text"
                                                value={editableDescription}
                                                onChange={(e) => setEditableDescription(e.target.value)}
                                                style={{ ...inputStyle, width: '100%', fontSize: '1.1rem', fontWeight: 'bold', color: '#0369a1', backgroundColor: '#fff' }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                        <ResultItem label="Ply" value={`${result.ply_value} Ply`} />
                                        <ResultItem label="Twist" value={result.twist_name} code={result.twist_code} />
                                        <ResultItem label="Strength" value={result.strength_name} code={result.strength_code} />
                                        <ResultItem label="Yarn" value={result.yarn_name} code={result.yarn_code} highlight />
                                        <ResultItem label="Supplier" value={result.supplier_name} code={result.supplier_code} />
                                        {result.yarn_type_name && <ResultItem label="Type" value={result.yarn_type_name} code={result.yarn_type_code} />}
                                        {result.yarn_color_name && <ResultItem label="Yarn Color" value={result.yarn_color_name} code={result.yarn_color_code} />}
                                        {result.merge_number && <ResultItem label="Merge" value={`Merge ${result.merge_number}`} code={result.merge_code} />}
                                    </div>

                                    {/* Add Button */}
                                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                                        <button
                                            onClick={handleAddToMaster}
                                            disabled={addingMaster}
                                            style={{ ...buttonStyle, backgroundColor: '#059669', width: '100%' }}
                                        >
                                            {addingMaster ? 'Adding to Master...' : '✓ Add to TFO Primary Master'}
                                        </button>
                                        {addMessage && (
                                            <div style={{ marginTop: '0.5rem', textAlign: 'center', color: addMessage.startsWith('Error') ? 'red' : 'green', fontWeight: '600' }}>
                                                {addMessage}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Master List Section */}
                <div style={cardStyle}>
                    <h3 style={sectionHeaderStyle}>Existing TFO Primary Masters</h3>
                    <div style={{ marginBottom: '1rem' }}>
                        <input
                            type="text"
                            value={masterSearch}
                            onChange={(e) => { setMasterSearch(e.target.value); setMasterPage(1); }}
                            placeholder="Search Masters..."
                            style={{ ...inputStyle, fontSize: '0.9rem', padding: '0.5rem' }}
                        />
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                                <th style={{ padding: '0.75rem' }}>Full Code</th>
                                <th style={{ padding: '0.75rem' }}>Code</th>
                                <th style={{ padding: '0.75rem' }}>Size</th>
                                <th style={{ padding: '0.75rem' }}>Display Name</th>
                                <th style={{ padding: '0.75rem' }}>Description</th>
                                <th style={{ padding: '0.75rem' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {masters.map(m => (
                                <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '0.75rem', fontWeight: '600' }}>{m.primary_ply_size}</td>
                                    <td style={{ padding: '0.75rem' }}>{m.code}</td>
                                    <td style={{ padding: '0.75rem' }}>{m.size}</td>
                                    <td style={{ padding: '0.75rem' }}>{m.display_name}</td>
                                    <td style={{ padding: '0.75rem' }}>{m.primary_ply_size_description}</td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <span style={{
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '999px',
                                            fontSize: '0.75rem',
                                            backgroundColor: m.active ? '#dcfce7' : '#fee2e2',
                                            color: m.active ? '#166534' : '#991b1b'
                                        }}>
                                            {m.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {masters.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>
                                        No masters found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                        <button
                            disabled={masterPage === 1}
                            onClick={() => setMasterPage(p => p - 1)}
                            style={pageBtnStyle}
                        >
                            Previous
                        </button>
                        <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                            Page {masterPage} (Total: {masterTotal})
                        </span>
                        <button
                            disabled={masters.length < 5}
                            onClick={() => setMasterPage(p => p + 1)}
                            style={pageBtnStyle}
                        >
                            Next
                        </button>
                    </div>
                </div>

            </div>
        </div >
    );
}

const cardStyle = { backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' };
const sectionHeaderStyle = { fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' };
const inputStyle = { flex: 1, padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '1rem', outline: 'none' };
const buttonStyle = { backgroundColor: '#2563eb', color: 'white', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', opacity: 0.9 };
const errorStyle = { padding: '1rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '1rem' };
const warningStyle = { marginTop: '1.5rem', padding: '1rem', backgroundColor: '#fff1f2', border: '1px solid #fda4af', borderRadius: '8px', color: '#be123c', fontSize: '0.875rem' };
const pageBtnStyle = { padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer' };

function ResultItem({ label, value, code, highlight }) {
    if (!value && !code) return null;
    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>{label}</span>
            <span style={{ fontSize: '1.1rem', color: highlight ? '#2563eb' : '#1e293b', fontWeight: 500 }}>{value || '-'}</span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'monospace' }}>{code || ''}</span>
        </div>
    );
}
