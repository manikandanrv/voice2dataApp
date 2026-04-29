import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import QRCode from "react-qr-code";

export default function CheeseBagDetails() {
    const { token, user } = useAuth();
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Default From Date: Today (Local)
    const getTodayLocal = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [filterDate, setFilterDate] = useState(getTodayLocal());
    const [filterLocation, setFilterLocation] = useState(user?.location_name === 'All' ? '' : (user?.location_name || ''));
    const [searchTerm, setSearchTerm] = useState('');

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [editForm, setEditForm] = useState({
        cheese_packing_id: null,
        details: []
    });

    const [operators, setOperators] = useState([]);

    useEffect(() => {
        fetchOperators();
    }, []);

    

    const fetchOperators = async () => {
        if (!token) return;
        try {
            const url = `${import.meta.env.VITE_API_URL}/api/master/operators`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const activeOps = (data.items || []).filter(op => op.active !== false);
                activeOps.sort((a, b) => (a.operator_name || "").localeCompare(b.operator_name || ""));
                setOperators(activeOps);
            }
        } catch (err) {
            console.error("Failed to fetch operators", err);
        }
    };

    const fetchReport = async () => {
        if (!token) return;
        setLoading(true);
        setError('');
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const url = `${import.meta.env.VITE_API_URL}/api/cheese-packing/cheese-bag-details-report?date=${filterDate}&location=${filterLocation}`;
            const res = await fetch(url, { headers });

            if (!res.ok) throw new Error("Failed to fetch report");
            const data = await res.json();
            setReportData(data);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (filterDate) fetchReport();
    }, [filterDate, filterLocation, token]);

    const handleEdit = (row) => {
        let parsedDetails = [];
        try {
            if (typeof row.details === 'string') {
                parsedDetails = JSON.parse(row.details || "[]");
            } else {
                parsedDetails = row.details || [];
            }
        } catch (e) {
            console.error(e);
            parsedDetails = [];
        }

        // Make a deep copy to edit safely
        setEditForm({
            cheese_packing_id: row.id,
            bag_no: row.bag_no,
            details: JSON.parse(JSON.stringify(parsedDetails))
        });
        setIsEditModalOpen(true);
    };

    const handleDetailChange = (doffIndex, machineIndex, field, value) => {
        const newDetails = [...editForm.details];
        const machineRef = newDetails[doffIndex].machines[machineIndex];

        machineRef[field] = value;

        // If changing operator code/name, try to map the other automatically from operators list
        if (field === 'operator_name') {
            const found = operators.find(o => o.operator_name === value);
            if (found) {
                machineRef.operator_code = found.operator_code || '';
            }
        } else if (field === 'operator_code') {
            const found = operators.find(o => o.operator_code === value);
            if (found) {
                machineRef.operator_name = found.operator_name || '';
            }
        }

        setEditForm({ ...editForm, details: newDetails });
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            const url = `${import.meta.env.VITE_API_URL}/api/cheese-packing/update-bag-json-details`;
            const res = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editForm)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || "Failed to update bag JSON details");
            }

            alert("Bag details updated successfully!");
            setIsEditModalOpen(false);
            fetchReport();
        } catch (err) {
            console.error(err);
            alert(`Update Failed:\n${err.message}`);
        } finally {
            setIsUpdating(false);
        }
    };

    const filteredData = reportData.filter(row => {
        if (!searchTerm) return true;

        const term = searchTerm.toLowerCase();

        // Basic fields
        if (row.bag_no && row.bag_no.toLowerCase().includes(term)) return true;
        if (row.bag_number && row.bag_number.toLowerCase().includes(term)) return true;
        if (row.display_size && row.display_size.toLowerCase().includes(term)) return true;
        if (row.size && row.size.toLowerCase().includes(term)) return true;

        // Deeper JSON fields
        if (row.details && Array.isArray(row.details)) {
            for (const doff of row.details) {
                if (doff.doubler_no && doff.doubler_no.toLowerCase().includes(term)) return true;
                if (doff.doubler_name && doff.doubler_name.toLowerCase().includes(term)) return true;
                if (doff.doff_no && doff.doff_no.toString().includes(term)) return true;

                if (doff.machines && Array.isArray(doff.machines)) {
                    for (const mach of doff.machines) {
                        if (mach.machine_name && mach.machine_name.toLowerCase().includes(term)) return true;
                        if (mach.operator_name && mach.operator_name.toLowerCase().includes(term)) return true;
                        if (mach.operator_code && mach.operator_code.toLowerCase().includes(term)) return true;
                    }
                }
            }
        }

        return false;
    });

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <div style={headerRowStyle}>
                    <h2 style={headerStyle}>Cheese Bag Details</h2>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Location</label>
                            <select
                                value={filterLocation}
                                onChange={(e) => setFilterLocation(e.target.value)}
                                style={selectStyle}
                            >
                                <option value="">All Locations</option>
                                <option value="Kaveripakkam">Kaveripakkam</option>
                                <option value="Puducherry">Puducherry</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Weighed Date</label>
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Search</label>
                            <input
                                type="text"
                                placeholder="Search bags, ops, machines..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={selectStyle}
                            />
                        </div>
                        <button onClick={fetchReport} style={{ ...refreshButtonStyle, marginTop: '1.2rem' }}>Refresh</button>
                    </div>
                </div>

                {loading && <p>Loading...</p>}
                {error && <p style={{ color: 'red' }}>Error: {error}</p>}

                {!loading && !error && reportData.length === 0 && (
                    <p style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                        No completed bags found for {filterDate}.
                    </p>
                )}

                {!loading && !error && reportData.length > 0 && (
                    <div style={tableContainerStyle}>
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>Bag Seq No</th>
                                    <th style={thStyle}>Size</th>
                                    <th style={thStyle}>Bag Number</th>
                                    <th style={thStyle}>Total Cheeses</th>
                                    <th style={thStyle}>Net Wt (kg)</th>
                                    <th style={thStyle}>Gross Wt (kg)</th>
                                    <th style={thStyle}>Bag No (Raw)</th>
                                    <th style={thStyle}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((row) => (
                                    <tr key={row.id} style={trStyle}>
                                        <td style={tdStyle}>
                                            <span style={{
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                fontWeight: 800,
                                                backgroundColor: '#dcfce7',
                                                color: '#166534',
                                                display: 'inline-block'
                                            }}>
                                                {row.bag_seq_no}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>{row.display_size || row.size}</td>
                                        <td style={tdStyle}>
                                            <span style={{ fontWeight: 600 }}>{row.bag_number}</span>
                                        </td>
                                        <td style={tdStyle}>{row.total_cheeses}</td>
                                        <td style={tdStyle}>{row.net_weight?.toFixed(2)}</td>
                                        <td style={tdStyle}>{row.gross_weight?.toFixed(2)}</td>
                                        <td style={tdStyle}><small>{row.bag_no}</small></td>
                                        <td style={tdStyle}>
                                            {(() => {
                                                const userLoc = user?.location_name || '';
                                                const rowLoc = row.location_code || '';
                                                const canModify = userLoc === 'All' || 
                                                                  userLoc === rowLoc || 
                                                                  (userLoc === 'Kaveripakkam' && rowLoc === 'K') || 
                                                                  (userLoc === 'Puducherry' && rowLoc === 'P');
                                                
                                                if (!canModify) return null;

                                                // Calculate mismatch
                                                let details = [];
                                                try {
                                                    details = typeof row.details === 'string' ? JSON.parse(row.details || "[]") : (row.details || []);
                                                } catch (e) { details = []; }
                                                
                                                let detailSum = 0;
                                                details.forEach(d => (d.machines || []).forEach(m => {
                                                    detailSum += (m.cheeses || m.machine_cheeses || 0);
                                                }));

                                                const isMismatch = detailSum !== row.total_cheeses;
                                                
                                                return (
                                                    <button 
                                                        onClick={() => handleEdit(row)} 
                                                        style={{ 
                                                            ...editButtonStyle, 
                                                            background: isMismatch ? '#059669' : '#f59e0b' 
                                                        }}
                                                        title={isMismatch ? `Mismatch: Header (${row.total_cheeses}) vs Details (${detailSum})` : ''}
                                                    >
                                                        Edit Details
                                                    </button>
                                                );
                                            })()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                            Edit JSON Details for Bag: <span style={{ color: '#2563eb' }}>{editForm.bag_no}</span>
                        </h3>
                        <form onSubmit={handleUpdateSubmit} style={formStyle}>
                            <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                {editForm.details && editForm.details.length === 0 && (
                                    <p style={{ color: '#64748b' }}>No details available to edit.</p>
                                )}
                                {editForm.details && editForm.details.map((doff, dIdx) => (
                                    <div key={dIdx} style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <h4 style={{ marginBottom: '0.8rem', color: '#334155' }}>Doff: {doff.doff_no} (Doubler: {doff.doubler_name || doff.doubler_no})</h4>
                                        {doff.machines && doff.machines.map((mach, mIdx) => (
                                            <div key={mIdx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                                <div style={{ flex: '1', minWidth: '100px' }}>
                                                    <label style={labelStyle}>Machine</label>
                                                    <input
                                                        type="text"
                                                        value={mach.machine_name || mach.machine_code || ""}
                                                        disabled
                                                        style={{ ...inputStyle, background: '#e2e8f0' }}
                                                    />
                                                </div>
                                                <div style={{ flex: '1.5', minWidth: '150px' }}>
                                                    <label style={labelStyle}>Operator</label>
                                                    <select
                                                        value={mach.operator_name || ""}
                                                        onChange={(e) => handleDetailChange(dIdx, mIdx, 'operator_name', e.target.value)}
                                                        style={selectStyle}
                                                    >
                                                        <option value="">Select Operator</option>
                                                        {operators.map(op => (
                                                            <option key={op.id} value={op.operator_name}>
                                                                {op.operator_code ? `${op.operator_code} - ${op.operator_name}` : op.operator_name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div style={{ flex: '1', minWidth: '100px' }}>
                                                    <label style={labelStyle}>Cheeses</label>
                                                    <input
                                                        type="number"
                                                        value={mach.cheeses === null || isNaN(mach.cheeses) ? '' : mach.cheeses}
                                                        onChange={(e) => handleDetailChange(dIdx, mIdx, 'cheeses', e.target.value === '' ? 0 : parseInt(e.target.value))}
                                                        style={inputStyle}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                {editForm.cheese_packing_id && (
                                    <div style={{ background: 'white', padding: '4px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                        <QRCode 
                                            value={`Cheese Packing-${editForm.cheese_packing_id}`} 
                                            size={64}
                                            level="H"
                                        />
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditModalOpen(false)}
                                        style={{ ...filterButtonStyle, background: '#f1f5f9', color: '#475569' }}
                                        disabled={isUpdating}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        style={{ ...filterButtonStyle, background: '#2563eb', color: 'white' }}
                                        disabled={isUpdating || !editForm.details || editForm.details.length === 0}
                                    >
                                        {isUpdating ? 'Updating...' : 'Save JSON Details'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Styles
const containerStyle = { minHeight: '90vh', padding: '2rem', background: '#f8fafc' };
const cardStyle = { background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', position: 'relative' };
const headerRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' };
const headerStyle = { fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', margin: 0 };
const refreshButtonStyle = { padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' };
const filterButtonStyle = { padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' };
const editButtonStyle = { padding: '0.3rem 0.8rem', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' };
const selectStyle = { padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', width: '100%', fontSize: '0.9rem' };
const tableContainerStyle = { overflowX: 'auto' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: '1rem' };
const thStyle = { padding: '1rem', background: '#f1f5f9', color: '#475569', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #e2e8f0', userSelect: 'none' };
const tdStyle = { padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#334155' };
const trStyle = { ':hover': { background: '#f8fafc' } };

// Modal Styles
const modalOverlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 1000
};
const modalContentStyle = {
    background: 'white', padding: '2rem', borderRadius: '12px', width: '600px', maxWidth: '90%',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
};
const formStyle = { display: 'flex', flexDirection: 'column', gap: '1rem' };
const labelStyle = { fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.2rem', display: 'block' };
const inputStyle = { padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem', width: '100%', boxSizing: 'border-box' };
