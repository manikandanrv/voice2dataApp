import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE = `${import.meta.env.VITE_API_URL}/api/production/secondary-report`;

export default function SecondaryProductionReport() {
    const { user } = useAuth();
    const [data, setData] = useState({ 
        detail: [], 
        summary_machine: { Doubler: [], TFO: [] }, 
        summary_size: { Doubler: [], TFO: [] }, 
        summary_size_mtd: { Doubler: [], TFO: [] } 
    });
    const [loading, setLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState('');
    const [refreshInterval, setRefreshInterval] = useState(0); // Default Off
    const [viewMode, setViewMode] = useState('detail'); // detail, summary_machine, summary_size
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // Default dates
    const getYesterday = () => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d.toISOString().split('T')[0];
    };
    const getToday = () => new Date().toISOString().split('T')[0];

    const [filterFromDate, setFilterFromDate] = useState(getYesterday());
    const [filterToDate, setFilterToDate] = useState(getToday());
    const [filterLocation, setFilterLocation] = useState(user?.location_name === 'All' ? '' : (user?.location_name || ''));
    const [sortConfig, setSortConfig] = useState({ key: 'end_time', direction: 'desc' });

    const fetchReport = async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (filterFromDate) params.append('from_date', filterFromDate);
            if (filterToDate) params.append('to_date', filterToDate);
            if (filterLocation) params.append('location', filterLocation);

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
    }, [filterFromDate, filterToDate, filterLocation]);

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
        const pad = (num) => String(num).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const startEdit = (row) => {
        setEditForm({ ...row });
        setIsEditModalOpen(true);
    };

    const handleDownloadPDF = async () => {
        setIsDownloading(true);
        try {
            const params = new URLSearchParams();
            if (filterFromDate) params.append('from_date', filterFromDate);
            if (filterToDate) params.append('to_date', filterToDate);
            if (filterLocation) params.append('location', filterLocation);

            const res = await fetch(`${API_BASE}/pdf?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to download PDF");
            
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Secondary_Report_${filterFromDate}_to_${filterToDate}.pdf`);
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

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            const endpoint = editForm.machine_type.toLowerCase() === 'tfo' ? 'tfo-secondary' : 'doubler-secondary';
            
            // Map frontend field names to backend schema field names
            const { 
                machine_no, machine, // Map machine_no or machine to machine_name
                size, // Map size to output_code
                doff_no, // Map doff_no to current_doff_no
                start_time, // Exclude start_time as per previous request
                ...otherFields 
            } = editForm;

            const payload = {
                ...otherFields,
                machine_name: editForm.machine_name || editForm.machine || editForm.machine_no,
                output_code: editForm.output_code || editForm.size,
                current_doff_no: editForm.current_doff_no || editForm.doff_no
            };
            
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/production/${endpoint}/${editForm.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(payload)
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

    const handlePrint = async (recordId, machineType) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/production/print-secondary-label?record_id=${recordId}&secondary_type=${machineType}`, {
                method: 'POST'
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

    const renderSummaryTable = (list, title, isMachine = false, mtdStyle = false) => {
        const sorted = getSortedData(list);
        if (sorted.length === 0) return null;

        const tableBg = mtdStyle ? '#f0f9ff' : 'transparent';
        const headerBg = mtdStyle ? '#e0f2fe' : '#f1f5f9';
        const textColor = mtdStyle ? '#0369a1' : '#475569';
        const borderColor = mtdStyle ? '#bae6fd' : '#e2e8f0';

        return (
            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', color: textColor }}>{title}</h3>
                <div style={{ ...tableContainerStyle, background: tableBg, borderRadius: mtdStyle ? '12px' : '0', padding: mtdStyle ? '1rem' : '0', border: mtdStyle ? `1px solid ${borderColor}` : 'none' }}>
                    <table style={{ ...tableStyle, background: 'transparent' }}>
                        <thead>
                            <tr>
                                {isMachine && <th style={{ ...thStyle, background: headerBg, color: textColor, borderBottomColor: borderColor }} onClick={() => handleSort('machine_no')}>Machine No {getSortIndicator('machine_no')}</th>}
                                <th style={{ ...thStyle, background: headerBg, color: textColor, borderBottomColor: borderColor }} onClick={() => handleSort('size')}>Size {getSortIndicator('size')}</th>
                                <th style={{ ...thStyle, background: headerBg, color: textColor, borderBottomColor: borderColor }} onClick={() => handleSort('total_bobbins')}>Bobbins {getSortIndicator('total_bobbins')}</th>
                                <th style={{ ...thStyle, background: headerBg, color: textColor, borderBottomColor: borderColor }} onClick={() => handleSort('record_count')}>Doff Count {getSortIndicator('record_count')}</th>
                                <th style={{ ...thStyle, background: headerBg, color: textColor, borderBottomColor: borderColor }} onClick={() => handleSort('total_weight')}>Weight {getSortIndicator('total_weight')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((row, idx) => (
                                <tr key={idx} style={{ ...trStyle, background: 'transparent' }}>
                                    {isMachine && <td style={{ ...tdStyle, color: mtdStyle ? '#0c4a6e' : '#334155', borderBottomColor: mtdStyle ? '#e0f2fe' : '#e2e8f0' }}><strong>{row.machine_no}</strong></td>}
                                    <td style={{ ...tdStyle, color: mtdStyle ? '#0c4a6e' : '#334155', borderBottomColor: mtdStyle ? '#e0f2fe' : '#e2e8f0' }}>{row.size}</td>
                                    <td style={{ ...tdStyle, color: mtdStyle ? '#0c4a6e' : '#334155', borderBottomColor: mtdStyle ? '#e0f2fe' : '#e2e8f0' }}>{row.total_bobbins}</td>
                                    <td style={{ ...tdStyle, color: mtdStyle ? '#0c4a6e' : '#334155', borderBottomColor: mtdStyle ? '#e0f2fe' : '#e2e8f0' }}>{row.record_count}</td>
                                    <td style={{ ...tdStyle, color: mtdStyle ? '#0c4a6e' : '#334155', borderBottomColor: mtdStyle ? '#e0f2fe' : '#e2e8f0' }}><strong>{row.total_weight.toFixed(2)} kg</strong></td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot style={{ background: headerBg, fontWeight: 'bold' }}>
                            <tr>
                                <td colSpan={isMachine ? 2 : 1} style={{ padding: '1rem', textAlign: 'right', color: mtdStyle ? '#0c4a6e' : '#1e293b' }}>Total:</td>
                                <td style={{ padding: '1rem', color: mtdStyle ? '#0c4a6e' : '#1e293b' }}>{sorted.reduce((sum, r) => sum + r.total_bobbins, 0)}</td>
                                <td style={{ padding: '1rem', color: mtdStyle ? '#0c4a6e' : '#1e293b' }}>{sorted.reduce((sum, r) => sum + r.record_count, 0)}</td>
                                <td style={{ padding: '1rem', color: mtdStyle ? '#0c4a6e' : '#1e293b' }}>{sorted.reduce((sum, r) => sum + r.total_weight, 0).toFixed(2)} kg</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <div style={headerRowStyle}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <h2 style={headerStyle}>Secondary Production Report (Doubler / TFO)</h2>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                            <div style={filterGroupStyle}>
                                <label style={labelStyle}>Location</label>
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
                            <div style={filterGroupStyle}>
                                <label style={labelStyle}>From Date</label>
                                <input
                                    type="date"
                                    value={filterFromDate}
                                    onChange={(e) => setFilterFromDate(e.target.value)}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={filterGroupStyle}>
                                <label style={labelStyle}>To Date</label>
                                <input
                                    type="date"
                                    value={filterToDate}
                                    onChange={(e) => setFilterToDate(e.target.value)}
                                    style={inputStyle}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button onClick={() => setViewMode('detail')} style={{ ...tabButtonStyle, background: viewMode === 'detail' ? '#2563eb' : '#f1f5f9', color: viewMode === 'detail' ? 'white' : '#475569' }}>Detail View</button>
                            <button onClick={() => setViewMode('summary_machine')} style={{ ...tabButtonStyle, background: viewMode === 'summary_machine' ? '#2563eb' : '#f1f5f9', color: viewMode === 'summary_machine' ? 'white' : '#475569' }}>Machine Summary</button>
                            <button onClick={() => setViewMode('summary_size')} style={{ ...tabButtonStyle, background: viewMode === 'summary_size' ? '#2563eb' : '#f1f5f9', color: viewMode === 'summary_size' ? 'white' : '#475569' }}>Size Summary</button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={filterGroupStyle}>
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
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'end' }}>
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
                </div>

                {loading && <p>Loading data...</p>}
                {error && <p style={{ color: '#ef4444' }}>Error: {error}</p>}

                {!loading && !error && viewMode === 'detail' && (
                    <div style={tableContainerStyle}>
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    <th style={thStyle} onClick={() => handleSort('machine_type')}>Type {getSortIndicator('machine_type')}</th>
                                    <th style={thStyle} onClick={() => handleSort('machine_no')}>Machine No {getSortIndicator('machine_no')}</th>
                                    <th style={thStyle} onClick={() => handleSort('doff_no')}>Doff No {getSortIndicator('doff_no')}</th>
                                    <th style={thStyle} onClick={() => handleSort('size')}>Size {getSortIndicator('size')}</th>
                                    <th style={thStyle} onClick={() => handleSort('end_time')}>End Date & Time {getSortIndicator('end_time')}</th>
                                    <th style={thStyle} onClick={() => handleSort('no_of_bobbins')}>Bobbins {getSortIndicator('no_of_bobbins')}</th>
                                    <th style={thStyle} onClick={() => handleSort('bobbin_weight')}>Bobbin Wt {getSortIndicator('bobbin_weight')}</th>
                                    <th style={thStyle} onClick={() => handleSort('total_weight')}>Total Wt {getSortIndicator('total_weight')}</th>
                                    <th style={thStyle}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {getSortedData(data.detail).map((row, idx) => (
                                    <tr key={idx} style={trStyle}>
                                        <td style={tdStyle}>
                                            <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', background: row.machine_type === 'Doubler' ? '#dcfce7' : '#fef9c3', color: row.machine_type === 'Doubler' ? '#166534' : '#854d0e' }}>
                                                {row.machine_type}
                                            </span>
                                        </td>
                                        <td style={tdStyle}><strong>{row.machine_no}</strong></td>
                                        <td style={tdStyle}>{row.doff_no}</td>
                                        <td style={tdStyle}>{row.size}</td>
                                        <td style={tdStyle}>{formatDateTime(row.end_time)}</td>
                                        <td style={tdStyle}>{row.no_of_bobbins}</td>
                                        <td style={tdStyle}>{row.bobbin_weight ? `${row.bobbin_weight.toFixed(2)}` : '-'}</td>
                                        <td style={tdStyle}><strong>{row.total_weight.toFixed(2)} kg</strong></td>
                                        <td style={tdStyle}>
                                            {(user?.location_name === 'All' || user?.location_name === row.location) && (
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button onClick={() => handlePrint(row.id, row.machine_type)} style={printButtonStyle}>🖨️ Label</button>
                                                    <button 
                                                        onClick={() => startEdit(row)}
                                                        style={{
                                                            padding: '0.4rem 0.8rem',
                                                            background: '#3b82f6',
                                                            color: '#fff',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.8rem',
                                                            fontWeight: '600'
                                                        }}
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && !error && viewMode === 'summary_machine' && (
                    <div>
                        {renderSummaryTable(data.summary_machine.Doubler, "Doubler Machine-Size Summary", true)}
                        {renderSummaryTable(data.summary_machine.TFO, "TFO Machine-Size Summary", true)}
                    </div>
                )}

                {!loading && !error && viewMode === 'summary_size' && (
                    <div>
                         {renderSummaryTable(data.summary_size.Doubler, `Doubler Size Summary (${filterFromDate} to ${filterToDate})`)}
                         {renderSummaryTable(data.summary_size.TFO, `TFO Size Summary (${filterFromDate} to ${filterToDate})`)}
                         
                         {renderSummaryTable(data.summary_size_mtd.Doubler, `Doubler MTD Size Summary (up to ${filterToDate})`, false, true)}
                         {renderSummaryTable(data.summary_size_mtd.TFO, `TFO MTD Size Summary (up to ${filterToDate})`, false, true)}
                    </div>
                )}
            </div>

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
                        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>Edit {editForm.machine_type} Production</h3>
                        <form onSubmit={handleUpdateSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div style={modalFormGroupStyle}>
                                    <label style={modalLabelStyle}>Machine No</label>
                                    <input type="text" value={editForm.machine_name || editForm.machine || editForm.machine_no || ""} onChange={(e) => setEditForm({ ...editForm, machine_name: e.target.value })} style={modalInputStyle} />
                                </div>
                                <div style={modalFormGroupStyle}>
                                    <label style={modalLabelStyle}>Doff No</label>
                                    <input type="number" step="1" value={editForm.current_doff_no || editForm.doff_no || 0} onChange={(e) => setEditForm({ ...editForm, current_doff_no: e.target.value })} style={modalInputStyle} />
                                </div>
                                <div style={modalFormGroupStyle}>
                                    <label style={modalLabelStyle}>Size</label>
                                    <input type="text" value={editForm.output_code || editForm.size || ""} onChange={(e) => setEditForm({ ...editForm, output_code: e.target.value })} style={modalInputStyle} />
                                </div>
                                <div style={modalFormGroupStyle}>
                                    <label style={modalLabelStyle}>End Time</label>
                                    <input type="datetime-local" value={formatForInput(editForm.end_time)} onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })} style={modalInputStyle} />
                                </div>
                                <div style={modalFormGroupStyle}>
                                    <label style={modalLabelStyle}>No of Bobbins</label>
                                    <input type="number" step="1" value={editForm.no_of_bobbins || 0} onChange={(e) => setEditForm({ ...editForm, no_of_bobbins: e.target.value })} style={modalInputStyle} />
                                </div>
                                <div style={modalFormGroupStyle}>
                                    <label style={modalLabelStyle}>Bobbin Wt (kg)</label>
                                    <input type="number" step="0.001" value={editForm.bobbin_weight || 0} onChange={(e) => setEditForm({ ...editForm, bobbin_weight: e.target.value })} style={modalInputStyle} />
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
const tabButtonStyle = { padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s', marginRight: '0.5rem' };
const tableContainerStyle = { overflowX: 'auto', marginTop: '1rem' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thStyle = { padding: '1rem', background: '#f1f5f9', color: '#475569', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #e2e8f0', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' };
const tdStyle = { padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#334155', fontSize: '0.95rem', whiteSpace: 'nowrap' };
const trStyle = { transition: 'background 0.2s' };
const printButtonStyle = { padding: '0.4rem 0.8rem', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' };

// Modal Styles
const modalFormGroupStyle = { display: 'flex', flexDirection: 'column', gap: '4px' };
const modalLabelStyle = { fontSize: '13px', fontWeight: 'bold', color: '#475569' };
const modalInputStyle = { padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '14px' };
const modalSubmitBtnStyle = { padding: '8px 16px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
const modalCancelBtnStyle = { padding: '8px 16px', backgroundColor: '#94a3b8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
