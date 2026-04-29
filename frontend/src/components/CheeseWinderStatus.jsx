import { useState, useEffect, useMemo } from 'react';

const API_CW_MACHINES = `${import.meta.env.VITE_API_URL}/api/cheesewinder-master/machines`;

export default function CheeseWinderStatus() {
    const [listData, setListData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('machine_name');
    const [sortOrder, setSortOrder] = useState('asc');

    const fetchList = async () => {
        try {
            setLoading(true);
            const res = await fetch(API_CW_MACHINES);
            if (res.ok) {
                const data = await res.json();
                setListData(data);
            } else {
                console.error("Failed to fetch Cheese Winder machines");
            }
        } catch (err) {
            console.error("Error fetching Cheese Winder machines:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchList();
        // Optional: refresh every 30 seconds
        const intervalId = setInterval(fetchList, 30000);
        return () => clearInterval(intervalId);
    }, []);

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const sortedAndFilteredData = useMemo(() => {
        let filtered = listData;

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = listData.filter(item => {
                const opSettings = item.operational_settings || {};
                const status = opSettings.status || opSettings.machine_status || 'Stopped';
                const size = opSettings.size || '-';
                const code = opSettings.code || '-';
                const operatorName = opSettings.operator_name || opSettings.operator || '-';
                const currentBagNo = opSettings.current_bag_no || opSettings.bag_no || '-';
                const tubeCover = opSettings.tube_cover || opSettings.tube_color || opSettings.tube_cover_name || '-';

                return (
                    (item.machine_name || '').toLowerCase().includes(lowerQuery) ||
                    (item.unit || '').toLowerCase().includes(lowerQuery) ||
                    status.toLowerCase().includes(lowerQuery) ||
                    size.toLowerCase().includes(lowerQuery) ||
                    tubeCover.toLowerCase().includes(lowerQuery) ||
                    operatorName.toLowerCase().includes(lowerQuery) ||
                    currentBagNo.toString().toLowerCase().includes(lowerQuery)
                );
            });
        }

        return [...filtered].sort((a, b) => {
            const getVal = (item, field) => {
                const opSettings = item.operational_settings || {};
                if (field === 'machine_name') return item.machine_name || '';
                if (field === 'unit') return item.unit || '';
                if (field === 'status') return opSettings.status || opSettings.machine_status || 'Stopped';
                if (field === 'size') return opSettings.size || '-';
                if (field === 'tube_cover') return opSettings.tube_cover || opSettings.tube_color || opSettings.tube_cover_name || '-';
                if (field === 'operator_name') return opSettings.operator_name || opSettings.operator || '-';
                if (field === 'current_bag_no') return opSettings.current_bag_no || opSettings.bag_no || '-';
                return '';
            };

            const aVal = getVal(a, sortBy);
            const bVal = getVal(b, sortBy);

            if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }, [listData, searchQuery, sortBy, sortOrder]);

    const thStyle = { padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc', cursor: 'pointer', userSelect: 'none' };
    const tdStyle = { padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0' };

    const getSortIndicator = (field) => {
        if (sortBy !== field) return '';
        return sortOrder === 'asc' ? ' ↑' : ' ↓';
    };

    // Generates a consistent pastel badge styling from any string
    const getColorBadgeStyle = (str) => {
        if (!str || str === '-') return {
            backgroundColor: '#f1f5f9', color: '#64748b', display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.85em', fontWeight: '600'
        };

        let hash = 0;
        const strVal = String(str);
        for (let i = 0; i < strVal.length; i++) {
            hash = strVal.charCodeAt(i) + ((hash << 5) - hash);
        }
        hash = Math.abs(hash);

        const h = hash % 360;
        const s = 65 + (hash % 20); // 65-85% saturation
        const lBg = 92 + (hash % 4); // 92-95% lightness

        return {
            backgroundColor: `hsl(${h}, ${s}%, ${lBg}%)`,
            color: `hsl(${h}, ${s}%, 30%)`,
            display: 'inline-block',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.85em',
            fontWeight: '600',
        };
    };

    return (
        <div className="container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 className="page-title" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                    Cheese Winder Machine Status
                </h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        type="text"
                        placeholder="Search machines..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', width: '250px' }}
                    />
                    <button onClick={fetchList} style={{ padding: '0.5rem 1rem', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', color: '#475569' }}>
                        Refresh
                    </button>
                </div>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
                {loading && listData.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading machines...</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                            <thead>
                                <tr>
                                    <th style={thStyle} onClick={() => handleSort('machine_name')}>Machine Name{getSortIndicator('machine_name')}</th>
                                    <th style={thStyle} onClick={() => handleSort('unit')}>Location (Unit){getSortIndicator('unit')}</th>
                                    <th style={thStyle} onClick={() => handleSort('status')}>Status{getSortIndicator('status')}</th>
                                    <th style={thStyle} onClick={() => handleSort('size')}>Size{getSortIndicator('size')}</th>
                                    <th style={thStyle} onClick={() => handleSort('tube_cover')}>Tube Cover{getSortIndicator('tube_cover')}</th>
                                    <th style={thStyle} onClick={() => handleSort('tube_type_code')}>Tube Type{getSortIndicator('tube_type_code')}</th>
                                    <th style={thStyle} onClick={() => handleSort('operator_name')}>Operator Name{getSortIndicator('operator_name')}</th>
                                    <th style={thStyle} onClick={() => handleSort('current_bag_no')}>Current Bag No{getSortIndicator('current_bag_no')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedAndFilteredData.map(item => {
                                    const opSettings = item.operational_settings || {};
                                    // Use specific keys as requested or fallbacks if keys differ slightly
                                    const status = opSettings.status || opSettings.machine_status || 'Stopped';
                                    const size = opSettings.size || '-';
                                    const tubeCover = opSettings.tube_cover || opSettings.tube_color || opSettings.tube_cover_name || '-';
                                    const tubeTypeCode = opSettings.tube_type_code || opSettings.tube_type || '-';
                                    const operatorName = opSettings.operator_name || opSettings.operator || '-';
                                    const currentBagNo = opSettings.current_bag_no || opSettings.bag_no || '-';

                                    const isRunning = status.toLowerCase() === 'running';

                                    return (
                                        <tr key={item.id} style={{ transition: 'background-color 0.2s' }}>
                                            <td style={{ ...tdStyle, fontWeight: '600', color: '#1e293b' }}>{item.machine_name}</td>
                                            <td style={tdStyle}>{item.unit}</td>
                                            <td style={tdStyle}>
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '9999px',
                                                    fontSize: '0.85em',
                                                    fontWeight: '600',
                                                    backgroundColor: isRunning ? '#dcfce7' : '#f1f5f9',
                                                    color: isRunning ? '#166534' : '#64748b'
                                                }}>
                                                    {status}
                                                </span>
                                            </td>
                                            <td style={tdStyle}><span style={getColorBadgeStyle(size)}>{size}</span></td>
                                            <td style={tdStyle}><span style={getColorBadgeStyle(tubeCover)}>{tubeCover}</span></td>
                                            <td style={tdStyle}><span style={getColorBadgeStyle(tubeTypeCode)}>{tubeTypeCode}</span></td>
                                            <td style={tdStyle}>{operatorName}</td>
                                            <td style={tdStyle}><span style={getColorBadgeStyle(currentBagNo)}>{currentBagNo}</span></td>
                                        </tr>
                                    );
                                })}
                                {sortedAndFilteredData.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No machines found matching your criteria.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
