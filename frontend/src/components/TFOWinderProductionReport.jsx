import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE = `${import.meta.env.VITE_API_URL}/api/production/tfo-winder-production-report`;

export default function TFOWinderProductionReport() {
    const { user, token } = useAuth();
    const [data, setData] = useState({ detail: [], summary_machine_yarn: [], summary_yarn: [], summary_yarn_mtd: [] });
    const [loading, setLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState('');
    const [refreshInterval, setRefreshInterval] = useState(0); // Default Off
    const [viewMode, setViewMode] = useState('detail'); // detail, summary_machine, summary_yarn
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [machinesMaster, setMachinesMaster] = useState([]);
    const [filterMachineName, setFilterMachineName] = useState('');

    // Default dates
    const getToday = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}T00:00`;
    };
    const getTomorrow = () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}T00:00`;
    };

    const [filterFromDate, setFilterFromDate] = useState(getToday());
    const [filterToDate, setFilterToDate] = useState(getTomorrow());
    const [filterLocation, setFilterLocation] = useState(user?.location_name === 'All' ? '' : (user?.location_name || ''));
    const [filterMachine, setFilterMachine] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'end_time', direction: 'desc' });

    const fetchReport = async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (filterFromDate) params.append('from_date', filterFromDate);
            if (filterToDate) params.append('to_date', filterToDate);
            if (filterLocation) params.append('location', filterLocation);
            if (filterMachine) params.append('machine_name', filterMachine);

            const res = await fetch(`${API_BASE}?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch report");
            const result = await res.json();
            setData(result);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [filterFromDate, filterToDate, filterLocation, filterMachine]);

    const handleDownloadPDF = async () => {
        setIsDownloading(true);
        try {
            const params = new URLSearchParams();
            if (filterFromDate) params.append('from_date', filterFromDate);
            if (filterToDate) params.append('to_date', filterToDate);
            if (filterLocation) params.append('location', filterLocation);
            if (filterMachine) params.append('machine_name', filterMachine);

            const res = await fetch(`${API_BASE}/pdf?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to download PDF");
            
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `TFO_Winder_Report_${filterFromDate}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            console.error(err);
            alert("Error downloading PDF: " + err.message);
        } finally {
            setIsDownloading(false);
        }
    };

    const fetchMachinesMaster = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/master/machines`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // User requested to only show TFO Winders
                const filtered = data.items.filter(m => (m.machine_type || '').trim() === 'TFO Winder');
                setMachinesMaster(filtered);
            }
        } catch (err) { console.error("Failed to fetch machines master", err); }
    };

    useEffect(() => {
        fetchMachinesMaster();
    }, [token]);

    useEffect(() => {
        if (refreshInterval > 0) {
            const interval = setInterval(fetchReport, refreshInterval);
            return () => clearInterval(interval);
        }
    }, [refreshInterval, filterFromDate, filterToDate, filterLocation]);

    const formatDateTime = (dateStr) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        return d.toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatForInput = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        // Correctly handle local time for datetime-local input
        const pad = (num) => String(num).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const startEdit = (row) => {
        setEditForm({ ...row });
        setIsEditModalOpen(true);
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/production/tfo-winder/${editForm.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editForm)
            });
            if (res.ok) {
                setIsEditModalOpen(false);
                fetchReport();
            } else {
                const err = await res.json();
                alert(err.detail || "Failed to update record");
            }
        } catch (err) {
            console.error(err);
            alert("Error updating record");
        } finally {
            setIsUpdating(false);
        }
    };

    const handlePrint = async (recordId) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/production/print-tfo-winder-label?record_id=${recordId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                alert("Print request sent successfully!");
            } else {
                alert(`Error: ${data.detail || "Failed to print"}`);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to connect to server for printing");
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortedData = (list) => {
        if (!Array.isArray(list)) return [];
        return [...list].sort((a, b) => {
            if (!sortConfig.key) return 0;
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const getSortIndicator = (key) => {
        if (sortConfig.key !== key) return ' ↕';
        return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
    };

    const renderDetailTable = () => {
        const sorted = getSortedData(data.detail);
        return (
            <div style={tableContainerStyle}>
                <table style={tableStyle}>
                    <thead>
                        <tr>
                            <th style={thStyle} onClick={() => handleSort('machine_no')}>Machine No {getSortIndicator('machine_no')}</th>
                            <th style={thStyle} onClick={() => handleSort('doff_no')}>Doff No {getSortIndicator('doff_no')}</th>
                            <th style={thStyle} onClick={() => handleSort('code')}>Code {getSortIndicator('code')}</th>
                            <th style={thStyle} onClick={() => handleSort('size')}>Size {getSortIndicator('size')}</th>
                            <th style={thStyle} onClick={() => handleSort('start_time')}>Start Time {getSortIndicator('start_time')}</th>
                            <th style={thStyle} onClick={() => handleSort('end_time')}>End Time {getSortIndicator('end_time')}</th>
                            <th style={thStyle} onClick={() => handleSort('running_time')}>Running Time (h) {getSortIndicator('running_time')}</th>
                            <th style={thStyle} onClick={() => handleSort('no_of_bobbins')}>Bobbins {getSortIndicator('no_of_bobbins')}</th>
                            <th style={thStyle} onClick={() => handleSort('bobbin_weight')}>Bobbin Wt {getSortIndicator('bobbin_weight')}</th>
                            <th style={thStyle} onClick={() => handleSort('total_weight')}>Total Wt {getSortIndicator('total_weight')}</th>
                            <th style={thStyle}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((row, idx) => {
                            const canEdit = user?.location_name === 'All' || row.location === user?.location_name;
                            return (
                                <tr key={idx} style={trStyle}>
                                    <td style={tdStyle}><strong>{row.machine_no}</strong></td>
                                    <td style={tdStyle}>{row.doff_no}</td>
                                    <td style={tdStyle}>{row.code}</td>
                                    <td style={tdStyle}>{row.size}</td>
                                    <td style={tdStyle}>{formatDateTime(row.start_time)}</td>
                                    <td style={tdStyle}>{formatDateTime(row.end_time)}</td>
                                    <td style={tdStyle}>{row.running_time ? row.running_time.toFixed(2) : '-'}</td>
                                    <td style={tdStyle}>{row.no_of_bobbins}</td>
                                    <td style={tdStyle}>{row.bobbin_weight ? row.bobbin_weight.toFixed(2) : '-'}</td>
                                    <td style={tdStyle}><strong>{row.total_weight ? row.total_weight.toFixed(2) : '-'} kg</strong></td>
                                    <td style={tdStyle}>
                                        {canEdit && (
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <button onClick={() => handlePrint(row.id)} style={printButtonStyle}>🖨️ Label</button>
                                                <button 
                                                    onClick={() => startEdit(row)}
                                                    style={{
                                                        padding: '4px 8px',
                                                        backgroundColor: '#3b82f6',
                                                        color: '#fff',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '12px'
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderMachineSummaryTable = () => {
        const sorted = getSortedData(data.summary_machine_yarn);
        return (
            <div style={tableContainerStyle}>
                <table style={tableStyle}>
                    <thead>
                        <tr>
                            <th style={thStyle} onClick={() => handleSort('machine_no')}>Machine No {getSortIndicator('machine_no')}</th>
                            <th style={thStyle} onClick={() => handleSort('code')}>Code {getSortIndicator('code')}</th>
                            <th style={thStyle} onClick={() => handleSort('size')}>Size {getSortIndicator('size')}</th>
                            <th style={thStyle} onClick={() => handleSort('total_bobbins')}>Total Bobbins {getSortIndicator('total_bobbins')}</th>
                            <th style={thStyle} onClick={() => handleSort('record_count')}>Doff Count {getSortIndicator('record_count')}</th>
                            <th style={thStyle} onClick={() => handleSort('total_weight')}>Total Weight {getSortIndicator('total_weight')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((row, idx) => (
                            <tr key={idx} style={trStyle}>
                                <td style={tdStyle}><strong>{row.machine_no}</strong></td>
                                <td style={tdStyle}>{row.code}</td>
                                <td style={tdStyle}>{row.size}</td>
                                <td style={tdStyle}>{row.total_bobbins}</td>
                                <td style={tdStyle}>{row.record_count}</td>
                                <td style={tdStyle}><strong>{row.total_weight.toFixed(2)} kg</strong></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderYarnSummaryTable = () => {
        const sorted = getSortedData(data.summary_yarn);
        const sortedMtd = getSortedData(data.summary_yarn_mtd);
        
        return (
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div>
                    <h3 style={{ marginBottom: '1rem', color: '#1e293b' }}>Period Yarn Summary ({filterFromDate} to {filterToDate})</h3>
                    <div style={tableContainerStyle}>
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    <th style={thStyle} onClick={() => handleSort('code')}>Code {getSortIndicator('code')}</th>
                                    <th style={thStyle} onClick={() => handleSort('size')}>Size {getSortIndicator('size')}</th>
                                    <th style={thStyle} onClick={() => handleSort('total_bobbins')}>Total Bobbins {getSortIndicator('total_bobbins')}</th>
                                    <th style={thStyle} onClick={() => handleSort('record_count')}>Doff Count {getSortIndicator('record_count')}</th>
                                    <th style={thStyle} onClick={() => handleSort('total_weight')}>Total Weight {getSortIndicator('total_weight')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.map((row, idx) => (
                                    <tr key={idx} style={trStyle}>
                                        <td style={tdStyle}><strong>{row.code}</strong></td>
                                        <td style={tdStyle}>{row.size}</td>
                                        <td style={tdStyle}>{row.total_bobbins}</td>
                                        <td style={tdStyle}>{row.record_count}</td>
                                        <td style={tdStyle}><strong>{row.total_weight.toFixed(2)} kg</strong></td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                                <tr>
                                    <td colSpan="2" style={{ padding: '1rem', textAlign: 'right', color: '#1e293b' }}>Grand Total:</td>
                                    <td style={{ padding: '1rem', color: '#1e293b' }}>{sorted.reduce((sum, r) => sum + r.total_bobbins, 0)}</td>
                                    <td style={{ padding: '1rem', color: '#1e293b' }}>{sorted.reduce((sum, r) => sum + r.record_count, 0)}</td>
                                    <td style={{ padding: '1rem', color: '#1e293b' }}>{sorted.reduce((sum, r) => sum + r.total_weight, 0).toFixed(2)} kg</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {sortedMtd.length > 0 && (
                    <div>
                        <h3 style={{ marginBottom: '1rem', color: '#0369a1' }}>Month-to-Date Yarn Summary (up to {filterToDate})</h3>
                        <div style={{ ...tableContainerStyle, background: '#f0f9ff', borderRadius: '12px', overflow: 'hidden', padding: '1rem', border: '1px solid #bae6fd' }}>
                            <table style={{ ...tableStyle, background: 'transparent' }}>
                                <thead>
                                    <tr>
                                        <th style={{ ...thStyle, background: '#e0f2fe', color: '#0369a1', borderBottomColor: '#bae6fd' }} onClick={() => handleSort('code')}>Code {getSortIndicator('code')}</th>
                                        <th style={{ ...thStyle, background: '#e0f2fe', color: '#0369a1', borderBottomColor: '#bae6fd' }} onClick={() => handleSort('size')}>Size {getSortIndicator('size')}</th>
                                        <th style={{ ...thStyle, background: '#e0f2fe', color: '#0369a1', borderBottomColor: '#bae6fd' }} onClick={() => handleSort('total_bobbins')}>Total Bobbins {getSortIndicator('total_bobbins')}</th>
                                        <th style={{ ...thStyle, background: '#e0f2fe', color: '#0369a1', borderBottomColor: '#bae6fd' }} onClick={() => handleSort('record_count')}>Doff Count {getSortIndicator('record_count')}</th>
                                        <th style={{ ...thStyle, background: '#e0f2fe', color: '#0369a1', borderBottomColor: '#bae6fd' }} onClick={() => handleSort('total_weight')}>Total Weight {getSortIndicator('total_weight')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedMtd.map((row, idx) => (
                                        <tr key={idx} style={{ ...trStyle, background: 'transparent' }}>
                                            <td style={{ ...tdStyle, color: '#0c4a6e', borderBottomColor: '#e0f2fe' }}><strong>{row.code}</strong></td>
                                            <td style={{ ...tdStyle, color: '#0c4a6e', borderBottomColor: '#e0f2fe' }}>{row.size}</td>
                                            <td style={{ ...tdStyle, color: '#0c4a6e', borderBottomColor: '#e0f2fe' }}>{row.total_bobbins}</td>
                                            <td style={{ ...tdStyle, color: '#0c4a6e', borderBottomColor: '#e0f2fe' }}>{row.record_count}</td>
                                            <td style={{ ...tdStyle, color: '#0c4a6e', borderBottomColor: '#e0f2fe' }}><strong>{row.total_weight.toFixed(2)} kg</strong></td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot style={{ background: '#e0f2fe', fontWeight: 'bold' }}>
                                    <tr>
                                        <td colSpan="2" style={{ padding: '1rem', textAlign: 'right', color: '#0c4a6e' }}>MTD Grand Total:</td>
                                        <td style={{ padding: '1rem', color: '#0c4a6e' }}>{sortedMtd.reduce((sum, r) => sum + r.total_bobbins, 0)}</td>
                                        <td style={{ padding: '1rem', color: '#0c4a6e' }}>{sortedMtd.reduce((sum, r) => sum + r.record_count, 0)}</td>
                                        <td style={{ padding: '1rem', color: '#0c4a6e' }}>{sortedMtd.reduce((sum, r) => sum + r.total_weight, 0).toFixed(2)} kg</td>
                                        
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <div style={headerRowStyle}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <h2 style={headerStyle}>TFO Winder Production Report</h2>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                            <div style={filterGroupStyle}>
                                <label style={labelStyle}>Location</label>
                                <select
                                    value={filterLocation}
                                    onChange={(e) => {
                                        setFilterLocation(e.target.value);
                                        setFilterMachine(''); // Reset machine filter when location changes
                                    }}
                                    style={selectStyle}
                                >
                                    <option value="">All Locations</option>
                                    <option value="Kaveripakkam">Kaveripakkam</option>
                                    <option value="Puducherry">Puducherry</option>
                                </select>
                            </div>
                            <div style={filterGroupStyle}>
                                <label style={labelStyle}>Machine Name</label>
                                <select
                                    value={filterMachine}
                                    onChange={(e) => setFilterMachine(e.target.value)}
                                    style={selectStyle}
                                >
                                    <option value="">All Machines</option>
                                    {machinesMaster
                                        .filter(m => {
                                            if (!filterLocation) return true;
                                            // Robust location check: handle both location_name and unit codes (KPM, Puduchery)
                                            const loc = filterLocation.toLowerCase();
                                            const mLoc = (m.location_name || '').toLowerCase();
                                            const mUnit = (m.unit || '').toLowerCase();
                                            
                                            if (loc.includes('kaveripakkam')) {
                                                return mLoc.includes('kaveripakkam') || mUnit.includes('kaveripakkam') || mUnit.includes('kpm');
                                            }
                                            if (loc.includes('puducherry')) {
                                                return mLoc.includes('puducherry') || mLoc.includes('puduchery') || 
                                                       mUnit.includes('puducherry') || mUnit.includes('puduchery');
                                            }
                                            return mLoc === loc;
                                        })
                                        .map(m => (
                                            <option key={m.id} value={m.machine_name}>{m.machine_name}</option>
                                        ))
                                    }
                                </select>
                            </div>
                            <div style={filterGroupStyle}>
                                <label style={labelStyle}>From Date & Time</label>
                                <input
                                    type="datetime-local"
                                    value={filterFromDate}
                                    onChange={(e) => setFilterFromDate(e.target.value)}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={filterGroupStyle}>
                                <label style={labelStyle}>To Date & Time</label>
                                <input
                                    type="datetime-local"
                                    value={filterToDate}
                                    onChange={(e) => setFilterToDate(e.target.value)}
                                    style={inputStyle}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button 
                                onClick={() => setViewMode('detail')} 
                                style={{ ...tabButtonStyle, background: viewMode === 'detail' ? '#2563eb' : '#f1f5f9', color: viewMode === 'detail' ? 'white' : '#475569' }}
                            >
                                Detail View
                            </button>
                            <button 
                                onClick={() => setViewMode('summary_machine')} 
                                style={{ ...tabButtonStyle, background: viewMode === 'summary_machine' ? '#2563eb' : '#f1f5f9', color: viewMode === 'summary_machine' ? 'white' : '#475569' }}
                            >
                                Machine & Yarn Summary
                            </button>
                            <button 
                                onClick={() => setViewMode('summary_yarn')} 
                                style={{ ...tabButtonStyle, background: viewMode === 'summary_yarn' ? '#2563eb' : '#f1f5f9', color: viewMode === 'summary_yarn' ? 'white' : '#475569' }}
                            >
                                Yarn Summary
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={filterGroupStyle}>
                            <label style={labelStyle}>Refresh (Mins)</label>
                            <label style={labelStyle}>Refresh</label>
                            <select
                                value={refreshInterval}
                                onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                                style={selectStyle}
                            >
                                <option value={0}>Off</option>
                                <option value={60000}>1 min</option>
                                <option value={300000}>5 mins</option>
                            </select>
                        </div>
                        <button onClick={fetchReport} style={refreshButtonStyle}>Refresh Now</button>
                        <button 
                            onClick={handleDownloadPDF} 
                            disabled={isDownloading || loading} 
                            style={{ ...refreshButtonStyle, background: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            {isDownloading ? 'Downloading...' : '📥 Download PDF'}
                        </button>
                    </div>
                </div>

                {loading && <p>Loading data...</p>}
                {error && <p style={{ color: '#ef4444' }}>Error: {error}</p>}

                {!loading && !error && (
                    <>
                        {viewMode === 'detail' && renderDetailTable()}
                        {viewMode === 'summary_machine' && renderMachineSummaryTable()}
                        {viewMode === 'summary_yarn' && renderYarnSummaryTable()}
                    </>
                )}

                {/* Edit Modal */}
                {isEditModalOpen && editForm && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            backgroundColor: '#fff', padding: '24px', borderRadius: '8px',
                            width: '500px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto',
                            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                        }}>
                            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>Edit Production Detail</h3>
                            <form onSubmit={handleUpdateSubmit}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div style={modalFormGroupStyle}>
                                        <label style={modalLabelStyle}>Machine No</label>
                                        <input type="text" value={editForm.machine_name || editForm.machine_no || ""} onChange={(e) => setEditForm({ ...editForm, machine_name: e.target.value })} style={modalInputStyle} />
                                    </div>
                                    <div style={modalFormGroupStyle}>
                                        <label style={modalLabelStyle}>Doff No</label>
                                        <input type="number" step="1" value={editForm.current_doff_no || editForm.doff_no || 0} onChange={(e) => setEditForm({ ...editForm, current_doff_no: e.target.value })} style={modalInputStyle} />
                                    </div>
                                    <div style={modalFormGroupStyle}>
                                        <label style={modalLabelStyle}>Code</label>
                                        <input type="text" value={editForm.code || ""} onChange={(e) => setEditForm({ ...editForm, code: e.target.value })} style={modalInputStyle} />
                                    </div>
                                    <div style={modalFormGroupStyle}>
                                        <label style={modalLabelStyle}>Size</label>
                                        <input type="text" value={editForm.size || ""} onChange={(e) => setEditForm({ ...editForm, size: e.target.value })} style={modalInputStyle} />
                                    </div>
                                    <div style={modalFormGroupStyle}>
                                        <label style={modalLabelStyle}>Start Time</label>
                                        <input type="datetime-local" value={formatForInput(editForm.start_time)} onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })} style={modalInputStyle} />
                                    </div>
                                    <div style={modalFormGroupStyle}>
                                        <label style={modalLabelStyle}>End Time</label>
                                        <input type="datetime-local" value={formatForInput(editForm.end_time)} onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })} style={modalInputStyle} />
                                    </div>
                                    <div style={modalFormGroupStyle}>
                                        <label style={modalLabelStyle}>Running Time</label>
                                        <input type="number" step="0.01" value={editForm.running_time || 0} onChange={(e) => setEditForm({ ...editForm, running_time: e.target.value })} style={modalInputStyle} />
                                    </div>
                                    <div style={modalFormGroupStyle}>
                                        <label style={modalLabelStyle}>No of Bobbins</label>
                                        <input type="number" step="1" value={editForm.no_of_bobbins || 0} onChange={(e) => setEditForm({ ...editForm, no_of_bobbins: e.target.value })} style={modalInputStyle} />
                                    </div>
                                    <div style={modalFormGroupStyle}>
                                        <label style={modalLabelStyle}>Bobbin Wt (g)</label>
                                        <input type="number" step="0.001" value={editForm.actual_weight || editForm.bobbin_weight || 0} onChange={(e) => setEditForm({ ...editForm, actual_weight: e.target.value })} style={modalInputStyle} />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                                    <button type="button" onClick={() => setIsEditModalOpen(false)} style={modalCancelBtnStyle}>Cancel</button>
                                    <button type="submit" disabled={isUpdating} style={modalSubmitBtnStyle}>
                                        {isUpdating ? 'Updating...' : 'Update Details'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Styles
const containerStyle = { minHeight: '90vh', padding: '2rem', background: '#f8fafc' };
const cardStyle = { background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' };
const headerRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2rem' };
const headerStyle = { fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', margin: 0 };
const filterGroupStyle = { display: 'flex', flexDirection: 'column', gap: '0.2rem' };
const labelStyle = { fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' };
const inputStyle = { padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' };
const selectStyle = { padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', fontSize: '0.9rem' };
const refreshButtonStyle = { alignSelf: 'end', padding: '0.5rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' };
const tabButtonStyle = { padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' };
const tableContainerStyle = { overflowX: 'auto', marginTop: '1rem' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thStyle = { padding: '1rem', background: '#f1f5f9', color: '#475569', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #e2e8f0', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' };
const tdStyle = { padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#334155', fontSize: '0.95rem', whiteSpace: 'nowrap' };
const trStyle = { transition: 'background 0.2s' };
const printButtonStyle = { padding: '4px 8px', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' };

// Modal Styles
const modalFormGroupStyle = { display: 'flex', flexDirection: 'column', gap: '4px' };
const modalLabelStyle = { fontSize: '13px', fontWeight: 'bold', color: '#475569' };
const modalInputStyle = { padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '14px' };
const modalSubmitBtnStyle = { padding: '8px 16px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
const modalCancelBtnStyle = { padding: '8px 16px', backgroundColor: '#94a3b8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
