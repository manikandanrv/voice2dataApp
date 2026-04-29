import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const CheeseWinderPairing = () => {
    const { token } = useAuth();
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });

    const fetchMachines = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/cheesewinder-master/machines`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMachines(data);
            } else {
                setMessage({ type: 'error', text: 'Failed to fetch machines' });
            }
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Connection error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchMachines();
    }, [token]);

    const handleUpdate = async (machineName, pairingMachine, isPairing) => {
        setUpdatingId(machineName);
        setMessage({ type: '', text: '' });
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/cheesewinder-master/machine-pairing`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    machine_name: machineName,
                    pairing_machine: pairingMachine || null,
                    is_pairing: isPairing
                })
            });

            if (res.ok) {
                setMessage({ type: 'success', text: `Updated ${machineName} successfully` });
                fetchMachines(); // Refresh data
            } else {
                const error = await res.json();
                setMessage({ type: 'error', text: error.detail || 'Update failed' });
            }
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Connection error' });
        } finally {
            setUpdatingId(null);
        }
    };

    const handleFieldChange = (machineName, field, value) => {
        setMachines(prev => prev.map(m => {
            if (m.machine_name === machineName) {
                const newSpec = { ...(m.specification || {}), [field]: value };
                return { ...m, specification: newSpec };
            }
            return m;
        }));
    };

    if (loading) return <div className="container" style={{ padding: '2rem' }}>Loading Cheese Winders...</div>;

    const thStyle = { padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#475569' };

    return (
        <div className="container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h2 className="page-title" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', marginBottom: '2rem' }}>Cheese Winder Pairing Master</h2>

            {message.text && (
                <div style={{
                    marginBottom: '1rem',
                    padding: '1rem',
                    borderRadius: '8px',
                    backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
                    color: message.type === 'success' ? '#166534' : '#991b1b',
                    border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`
                }}>
                    {message.text}
                </div>
            )}

            <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                            <th style={thStyle}>Machine Name</th>
                            <th style={thStyle}>Location</th>
                            <th style={thStyle}>Pairing Machine</th>
                            <th style={{ ...thStyle, textAlign: 'center' }}>Is Pairing</th>
                            <th style={{ ...thStyle, textAlign: 'right' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {machines.map((m) => (
                            <tr key={m.machine_name} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '0.75rem', fontWeight: '500', color: '#1e293b' }}>{m.machine_name}</td>
                                <td style={{ padding: '0.75rem', color: '#64748b' }}>{m.unit || '-'}</td>
                                <td style={{ padding: '0.75rem' }}>
                                    <select
                                        className="form-control"
                                        style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                        value={m.specification?.pairing_machine || ''}
                                        onChange={(e) => handleFieldChange(m.machine_name, 'pairing_machine', e.target.value)}
                                    >
                                        <option value="">None</option>
                                        {machines
                                            .filter(other => other.machine_name !== m.machine_name)
                                            .map(other => (
                                                <option key={other.machine_name} value={other.machine_name}>
                                                    {other.machine_name}
                                                </option>
                                            ))
                                        }
                                    </select>
                                </td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                    <input
                                        type="checkbox"
                                        style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer' }}
                                        checked={m.specification?.is_pairing || false}
                                        onChange={(e) => handleFieldChange(m.machine_name, 'is_pairing', e.target.checked)}
                                    />
                                </td>
                                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                    <button
                                        onClick={() => handleUpdate(m.machine_name, m.specification?.pairing_machine, m.specification?.is_pairing)}
                                        disabled={updatingId === m.machine_name}
                                        className="btn-save"
                                        style={{
                                            padding: '0.5rem 1.25rem',
                                            backgroundColor: '#2563eb',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            fontSize: '0.85rem',
                                            opacity: updatingId === m.machine_name ? 0.7 : 1
                                        }}
                                    >
                                        {updatingId === m.machine_name ? 'Updating...' : 'Update'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {machines.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No machines found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CheeseWinderPairing;
