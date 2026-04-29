import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function CheeseWinderReport() {
    const { token, user } = useAuth();
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'machine_name', direction: 'asc' });
    const [isDownloading, setIsDownloading] = useState(false);
    
    // Default Filter Dates: Today
    const getTodayLocal = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [filterDate, setFilterDate] = useState(getTodayLocal());
    const [filterLocation, setFilterLocation] = useState(
        user?.location_name === 'Kaveripakkam' ? 'K' : 
        (user?.location_name === 'Puducherry' ? 'P' : 'All')
    );

    const fetchReport = async () => {
        if (!token) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/cheese-packing/winder-report?report_date=${filterDate}&location=${filterLocation}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || "Failed to fetch report");
            }
            const data = await res.json();
            setReportData(data);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!token) return;
        setIsDownloading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/cheese-packing/winder-report/pdf?report_date=${filterDate}&location=${filterLocation}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || "Failed to download PDF");
            }
            
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Cheese_Winder_Report_${filterDate}.pdf`);
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

    useEffect(() => {
        fetchReport();
    }, [filterDate, filterLocation, token]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = [...reportData].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const totalCheeses = reportData.reduce((sum, row) => sum + (row.cheese_count || 0), 0);
    const totalWeight = reportData.reduce((sum, row) => sum + (row.total_weight_kg || 0), 0);

    const getSortIndicator = (key) => {
        if (sortConfig.key !== key) return ' ↕️';
        return sortConfig.direction === 'asc' ? ' 🔼' : ' 🔽';
    };

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <div style={headerRowStyle}>
                    <div>
                        <h2 style={headerStyle}>Cheese Winder Production Report</h2>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.4rem' }}>
                            Aggregated production from closed bags
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <label style={labelStyle}>Date</label>
                            <input 
                                type="date" 
                                value={filterDate} 
                                onChange={(e) => setFilterDate(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <label style={labelStyle}>Location</label>
                            <select
                                value={filterLocation}
                                onChange={(e) => setFilterLocation(e.target.value)}
                                style={selectStyle}
                            >
                                <option value="All">All Locations</option>
                                <option value="K">Kaveripakkam</option>
                                <option value="P">Puducherry</option>
                            </select>
                        </div>
                        <button onClick={fetchReport} style={{ ...refreshButtonStyle, marginTop: '1.2rem' }}>Refresh</button>
                        <button 
                            onClick={handleDownloadPDF} 
                            disabled={isDownloading}
                            style={{ ...refreshButtonStyle, marginTop: '1.2rem', background: '#10b981' }}
                        >
                            {isDownloading ? 'Downloading...' : 'Download PDF'}
                        </button>
                    </div>
                </div>

                {loading && <p style={{ textAlign: 'center', padding: '2rem' }}>Loading report data...</p>}
                {error && <p style={{ color: '#ef4444', textAlign: 'center', padding: '2rem' }}>Error: {error}</p>}

                {!loading && !error && (
                    <div style={tableContainerStyle}>
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    <th style={thStyle} onClick={() => handleSort('machine_name')}>Machine Name{getSortIndicator('machine_name')}</th>
                                    <th style={thStyle} onClick={() => handleSort('display_size')}>Size (Display Size){getSortIndicator('display_size')}</th>
                                    <th style={thStyle} onClick={() => handleSort('operator_name')}>Operator{getSortIndicator('operator_name')}</th>
                                    <th style={thStyle} onClick={() => handleSort('weight_per_cheese')}>Weight per Cheese (g){getSortIndicator('weight_per_cheese')}</th>
                                    <th style={thStyle} onClick={() => handleSort('cheese_count')}>Cheese Count{getSortIndicator('cheese_count')}</th>
                                    <th style={thStyle} onClick={() => handleSort('total_weight_kg')}>Total Weight (kg){getSortIndicator('total_weight_kg')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedData.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ ...tdStyle, textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                                            No production data found for the selected date and location.
                                        </td>
                                    </tr>
                                ) : (
                                    sortedData.map((row, idx) => (
                                        <tr key={idx} style={trStyle}>
                                            <td style={tdStyle}><strong>{row.machine_name}</strong></td>
                                            <td style={tdStyle}>{row.display_size}</td>
                                            <td style={tdStyle}>{row.operator_name || "-"}</td>
                                            <td style={tdStyle}>{row.weight_per_cheese > 0 ? `${row.weight_per_cheese} g` : "-"}</td>
                                            <td style={{ ...tdStyle, fontWeight: 'bold', color: '#2563eb' }}>{row.cheese_count}</td>
                                            <td style={{ ...tdStyle, fontWeight: 'bold', color: '#059669' }}>{row.total_weight_kg.toFixed(3)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {sortedData.length > 0 && (
                                <tfoot style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                                    <tr>
                                        <td colSpan="4" style={{ ...tdStyle, textAlign: 'right', fontWeight: 'bold' }}>Grand Total:</td>
                                        <td style={{ ...tdStyle, fontWeight: 'bold', fontSize: '1.1rem', color: '#2563eb' }}>{totalCheeses}</td>
                                        <td style={{ ...tdStyle, fontWeight: 'bold', fontSize: '1.1rem', color: '#059669' }}>{totalWeight.toFixed(3)}</td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// Styles consistent with existing reports
const containerStyle = { minHeight: '90vh', padding: '2rem', background: '#f8fafc' };
const cardStyle = { background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' };
const headerRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' };
const headerStyle = { fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', margin: 0 };
const refreshButtonStyle = { padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' };
const labelStyle = { fontSize: '0.8rem', fontWeight: '600', color: '#64748b' };
const inputStyle = { padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#1e293b' };
const selectStyle = { padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', color: '#1e293b' };
const tableContainerStyle = { overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thStyle = { padding: '1rem', background: '#f1f5f9', color: '#475569', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #e2e8f0', cursor: 'pointer', userSelect: 'none' };
const tdStyle = { padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#334155' };
const trStyle = { transition: 'background 0.2s', ':hover': { background: '#f8fafc' } };
