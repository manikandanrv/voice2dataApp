import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE = `${import.meta.env.VITE_API_URL}/api/production/secondary-ready-report`;

export default function SecondaryReadyReport() {
    const { user } = useAuth();
    const [reportData, setReportData] = useState({
        detailed: [],
        tfo_sizewise: [],
        doubler_sizewise: [],
        cumulative_sizewise: [],
        tfo_machinewise: [],
        doubler_machinewise: [],
        grand_totals: { no_of_bobbins: 0, total_weight: 0, doff_count: 0 }
    });
    const [loading, setLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState('');
    const [viewMode, setViewMode] = useState('detailed'); // 'detailed', 'sizewise', 'machinewise'
    const [sortConfig, setSortConfig] = useState({ key: 'end_time', direction: 'desc' });

    // Default From Date: Today at midnight
    const getTodayMidnightLocal = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}T00:00`;
    };

    // Default To Date: Tomorrow at midnight
    const getTomorrowMidnightLocal = () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}T00:00`;
    };

    const [filterFromDate, setFilterFromDate] = useState(getTodayMidnightLocal());
    const [filterToDate, setFilterToDate] = useState(getTomorrowMidnightLocal());
    const [filterLocation, setFilterLocation] = useState(user?.location_name === 'All' ? '' : (user?.location_name || ''));

    const handleDownloadPDF = async () => {
        setIsDownloading(true);
        try {
            let url = `${API_BASE}/pdf?from_date=${filterFromDate}`;
            if (filterToDate) url += `&to_date=${filterToDate}`;
            if (filterLocation) url += `&location=${filterLocation}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error("Failed to download PDF");

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', `Secondary_Ready_Report_${filterFromDate}.pdf`);
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
        fetchReport();
    }, [filterFromDate, filterToDate, filterLocation]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedDetailed = [...reportData.detailed].sort((a, b) => {
        if (!sortConfig.key) return 0;
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

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

    const renderDetailedTable = () => (
        <div style={tableContainerStyle}>
            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={thSortableStyle} onClick={() => handleSort('machine_type')}>Type {sortConfig.key === 'machine_type' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                        <th style={thSortableStyle} onClick={() => handleSort('machine_no')}>Machine No {sortConfig.key === 'machine_no' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                        <th style={thSortableStyle} onClick={() => handleSort('doff_no')}>Doff No {sortConfig.key === 'doff_no' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                        <th style={thSortableStyle} onClick={() => handleSort('size')}>Size {sortConfig.key === 'size' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                        <th style={thSortableStyle} onClick={() => handleSort('end_time')}>End Date & Time {sortConfig.key === 'end_time' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                        <th style={thSortableStyle} onClick={() => handleSort('no_of_bobbins')}>Bobbins {sortConfig.key === 'no_of_bobbins' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                        <th style={thSortableStyle} onClick={() => handleSort('bobbin_weight')}>Bobbin Wt {sortConfig.key === 'bobbin_weight' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                        <th style={thSortableStyle} onClick={() => handleSort('total_weight')}>Total Wt {sortConfig.key === 'total_weight' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedDetailed.map((row, idx) => (
                        <tr key={idx} style={trStyle}>
                            <td style={tdStyle}>
                                <span style={{
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    background: row.machine_type === 'Doubler' ? '#dcfce7' : '#fef9c3',
                                    color: row.machine_type === 'Doubler' ? '#166534' : '#854d0e'
                                }}>
                                    {row.machine_type}
                                </span>
                            </td>
                            <td style={tdStyle}><strong>{row.machine_no}</strong></td>
                            <td style={tdStyle}>{row.doff_no}</td>
                            <td style={tdStyle}>{row.size}</td>
                            <td style={tdStyle}>{formatDateTime(row.end_time)}</td>
                            <td style={tdStyle}>{row.no_of_bobbins}</td>
                            <td style={tdStyle}>{row.bobbin_weight ? `${row.bobbin_weight.toFixed(3)} kg` : '-'}</td>
                            <td style={tdStyle}><strong>{row.total_weight ? `${row.total_weight.toFixed(2)} kg` : '-'}</strong></td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                        <td colSpan="5" style={{ ...tdStyle, textAlign: 'right' }}>GRAND TOTAL</td>
                        <td style={tdStyle}>{reportData.grand_totals?.no_of_bobbins || 0}</td>
                        <td style={tdStyle}>-</td>
                        <td style={tdStyle}>{(reportData.grand_totals?.total_weight || 0).toFixed(2)} kg</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );

    const SummaryTable = ({ data, title, typeLabel = "Size" }) => {
        if (!data || data.length === 0) return null;

        const totals = data.reduce((acc, curr) => ({
            doffs: acc.doffs + curr.doff_count,
            bobbins: acc.bobbins + (curr.no_of_bobbins || 0),
            weight: acc.weight + curr.total_weight
        }), { doffs: 0, bobbins: 0, weight: 0 });

        const isMachine = typeLabel === "Machine No";

        return (
            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#1e293b', borderLeft: '4px solid #3b82f6', paddingLeft: '0.75rem' }}>
                    {title}
                </h3>
                <div style={tableContainerStyle}>
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={thStyle}>{typeLabel}</th>
                                <th style={thStyle}>Doff Count</th>
                                {!isMachine && <th style={thStyle}>Total Bobbins</th>}
                                <th style={thStyle}>Total Weight</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, idx) => (
                                <tr key={idx} style={trStyle}>
                                    <td style={tdStyle}><strong>{isMachine ? row.machine_no : (row.display_name || row.size)}</strong></td>
                                    <td style={tdStyle}>{row.doff_count}</td>
                                    {!isMachine && <td style={tdStyle}>{row.no_of_bobbins}</td>}
                                    <td style={tdStyle}><strong>{row.total_weight.toFixed(2)} kg</strong></td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                                <td style={tdStyle}>Section Total</td>
                                <td style={tdStyle}>{totals.doffs}</td>
                                {!isMachine && <td style={tdStyle}>{totals.bobbins}</td>}
                                <td style={tdStyle}>{totals.weight.toFixed(2)} kg</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        );
    };

    const renderSizeWiseTable = () => (
        <>
            <SummaryTable data={reportData.tfo_sizewise} title="TFO Size-wise Summary" />
            <SummaryTable data={reportData.doubler_sizewise} title="Doubler Size-wise Summary" />
            <SummaryTable data={reportData.cumulative_sizewise} title="Cumulative Size-wise Summary" />
        </>
    );

    const renderMachineWiseTable = () => (
        <>
            <SummaryTable data={reportData.tfo_machinewise} title="TFO Machine-wise Summary" typeLabel="Machine No" />
            <SummaryTable data={reportData.doubler_machinewise} title="Doubler Machine-wise Summary" typeLabel="Machine No" />

            <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '8px', marginTop: '1rem', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: 0, color: '#475569', fontSize: '0.9rem' }}>REPORT GRAND TOTALS</h4>
                <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
                    <div>
                        <small style={{ color: '#64748b', display: 'block' }}>Total Doffs</small>
                        <strong style={{ fontSize: '1.25rem' }}>{reportData.grand_totals?.doff_count || 0}</strong>
                    </div>
                    <div>
                        <small style={{ color: '#64748b', display: 'block' }}>Total Bobbins</small>
                        <strong style={{ fontSize: '1.25rem' }}>{reportData.grand_totals?.no_of_bobbins || 0}</strong>
                    </div>
                    <div>
                        <small style={{ color: '#64748b', display: 'block' }}>Total Weight</small>
                        <strong style={{ fontSize: '1.25rem', color: '#059669' }}>{(reportData.grand_totals?.total_weight || 0).toFixed(2)} kg</strong>
                    </div>
                </div>
            </div>
        </>
    );

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <div style={headerRowStyle}>
                    <div>
                        <h2 style={headerStyle}>Secondary Ready Report (ready for cheese winding)</h2>
                        <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                            Shows doffs where Packing DateTime {'>'} Production EndTime
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={filterGroupStyle}>
                            <label style={labelStyle}>Location</label>
                            <select
                                value={filterLocation}
                                onChange={(e) => setFilterLocation(e.target.value)}
                                style={inputStyle}
                            >
                                <option value="">All Locations</option>
                                <option value="Kaveripakkam">Kaveripakkam</option>
                                <option value="Puducherry">Puducherry</option>
                            </select>
                        </div>
                        <div style={filterGroupStyle}>
                            <label style={labelStyle}>From Date (End Time)</label>
                            <input
                                type="datetime-local"
                                value={filterFromDate}
                                onChange={(e) => setFilterFromDate(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                        <div style={filterGroupStyle}>
                            <label style={labelStyle}>To Date</label>
                            <input
                                type="datetime-local"
                                value={filterToDate}
                                onChange={(e) => setFilterToDate(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                        <button onClick={fetchReport} style={refreshButtonStyle}>Refresh</button>
                        <button
                            onClick={handleDownloadPDF}
                            style={{ ...refreshButtonStyle, background: '#059669' }}
                            disabled={isDownloading || loading}
                        >
                            {isDownloading ? 'Downloading...' : '📥 Download PDF'}
                        </button>
                    </div>
                </div>

                <div style={tabContainerStyle}>
                    <button
                        onClick={() => setViewMode('detailed')}
                        style={viewMode === 'detailed' ? activeTabStyle : tabStyle}
                    >
                        Detailed View
                    </button>
                    <button
                        onClick={() => setViewMode('sizewise')}
                        style={viewMode === 'sizewise' ? activeTabStyle : tabStyle}
                    >
                        Size-wise Summary
                    </button>
                    <button
                        onClick={() => setViewMode('machinewise')}
                        style={viewMode === 'machinewise' ? activeTabStyle : tabStyle}
                    >
                        Machine-wise Summary
                    </button>
                </div>

                {loading && <p style={{ textAlign: 'center', padding: '2rem' }}>Loading data...</p>}
                {error && <p style={{ color: '#ef4444', textAlign: 'center', padding: '2rem' }}>Error: {error}</p>}

                {!loading && !error && (
                    <>
                        {viewMode === 'detailed' && renderDetailedTable()}
                        {viewMode === 'sizewise' && renderSizeWiseTable()}
                        {viewMode === 'machinewise' && renderMachineWiseTable()}

                        {reportData.detailed.length === 0 && (
                            <p style={emptyStyle}>No ready records found from the selected date.</p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// Styles
const containerStyle = { minHeight: '90vh', padding: '1.5rem', background: '#f8fafc' };
const cardStyle = { background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' };
const headerRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' };
const headerStyle = { fontSize: '1.4rem', fontWeight: 'bold', color: '#1e293b', margin: 0 };
const filterGroupStyle = { display: 'flex', flexDirection: 'column', gap: '0.2rem' };
const labelStyle = { fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' };
const inputStyle = { padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' };
const refreshButtonStyle = { alignSelf: 'end', padding: '0.5rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' };
const tableContainerStyle = { overflowX: 'auto', marginTop: '1rem' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thStyle = { padding: '1rem', background: '#f1f5f9', color: '#475569', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #e2e8f0' };
const thSortableStyle = { ...thStyle, cursor: 'pointer', userSelect: 'none' };
const tdStyle = { padding: '0.8rem 1rem', borderBottom: '1px solid #e2e8f0', color: '#334155', fontSize: '0.9rem' };
const trStyle = { transition: 'background 0.2s' };
const emptyStyle = { textAlign: 'center', padding: '3rem', color: '#94a3b8', fontSize: '1rem' };

const tabContainerStyle = { display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1rem' };
const tabStyle = {
    padding: '0.6rem 1.2rem',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    color: '#64748b',
    fontWeight: '600',
    fontSize: '0.9rem'
};
const activeTabStyle = {
    ...tabStyle,
    color: '#2563eb',
    borderBottom: '2px solid #2563eb',
    background: '#eff6ff'
};
