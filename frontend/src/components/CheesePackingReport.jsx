import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import QRCode from "react-qr-code";


const API_BASE = `${import.meta.env.VITE_API_URL}/api/cheese-packing/active-bags-report`;

export default function CheesePackingReport() {
    const { token, user } = useAuth();
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [refreshInterval, setRefreshInterval] = useState(0); // Default Off
    const [sortConfig, setSortConfig] = useState({ key: 'bag_seq_no', direction: 'asc' });
    const [currentTime, setCurrentTime] = useState(new Date()); // For live elapsed time
    const [filterStatus, setFilterStatus] = useState('Cheese Winding'); // Default filter
    const [filterLocation, setFilterLocation] = useState(
        user?.location_name === 'Kaveripakkam' ? 'K' : 
        (user?.location_name === 'Puducherry' ? 'P' : '')
    ); 
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [editForm, setEditForm] = useState({
        cheese_packing_id: null,
        total_cheeses: 0,
        no_of_covers: 0,
        tare_weight: 0,
        repacking: false,
        bag: true,
        tube_cover: ''
    });
    const [tubeCovers, setTubeCovers] = useState([]);
    const [isReprintModalOpen, setIsReprintModalOpen] = useState(false);
    const [selectedReprintBagId, setSelectedReprintBagId] = useState('');
    const [isPrinting, setIsPrinting] = useState(false);
    const [brotherLabelNeeded, setBrotherLabelNeeded] = useState(true);
    const [frontLabelNeeded, setFrontLabelNeeded] = useState(true);
    const [insideLabelNeeded, setInsideLabelNeeded] = useState(true);

    // Helpers for Nested Details State
    const handleAddDoffGroup = () => {
        setEditForm(prev => ({
            ...prev,
            details: [...prev.details, {
                doff_no: 0,
                doubler_no: '',
                machines: [{ machine_code: '', operator_code: '', machine_cheeses: 0 }]
            }]
        }));
    };

    const handleAddMachineToGroup = (doffIdx) => {
        const newDetails = [...editForm.details];
        newDetails[doffIdx].machines.push({
            machine_code: '',
            operator_code: '',
            machine_cheeses: 0
        });
        setEditForm({ ...editForm, details: newDetails });
    };

    const handleRemoveDoffGroup = (doffIdx) => {
        const newDetails = editForm.details.filter((_, idx) => idx !== doffIdx);
        setEditForm({ ...editForm, details: newDetails });
    };

    const handleRemoveMachineFromGroup = (doffIdx, machIdx) => {
        const newDetails = [...editForm.details];
        newDetails[doffIdx].machines = newDetails[doffIdx].machines.filter((_, idx) => idx !== machIdx);
        setEditForm({ ...editForm, details: newDetails });
    };

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
    const [summaryData, setSummaryData] = useState([]); // Grouped data for summary report
    const [repackedSummaryData, setRepackedSummaryData] = useState([]);
    const [mtdSummaryData, setMtdSummaryData] = useState([]); // MTD Grouped data
    const [repackedMtdSummaryData, setRepackedMtdSummaryData] = useState([]);
    
    // Master data for detailed machine modal
    const [machinesMaster, setMachinesMaster] = useState([]);
    const [operatorsMaster, setOperatorsMaster] = useState([]);
    const [detailFormNew, setDetailFormNew] = useState({ machine_code: '', operator_code: '', machine_cheeses: '' });

    const fetchReport = async () => {
        if (!token) return;
        setLoading(true);
        setError('');
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            if (filterStatus === 'Summary' || filterStatus === 'SizeSummary') {
                const url = `${import.meta.env.VITE_API_URL}/api/cheese-packing/summary-report?from_date=${filterFromDate}&to_date=${filterToDate}${filterLocation ? `&location=${filterLocation}` : ''}`;
                const res = await fetch(url, { headers });
                if (!res.ok) throw new Error("Failed to fetch summary report");
                const data = await res.json();
                setSummaryData(data.summary || []);
                setMtdSummaryData(data.mtd_summary || []);
                setRepackedSummaryData(data.repacked_summary || []);
                setRepackedMtdSummaryData(data.repacked_mtd_summary || []);
            } else {
                let url = `${import.meta.env.VITE_API_URL}/api/cheese-packing/active-bags-report?`;
                const params = new URLSearchParams();
                if (filterLocation) params.append('location', filterLocation);
                if (filterFromDate) params.append('from_date', filterFromDate);
                if (filterToDate) params.append('to_date', filterToDate);
                params.append('status', filterStatus);

                url += params.toString();

                const res = await fetch(url, { headers });
                if (!res.ok) throw new Error("Failed to fetch report");
                const data = await res.json();
                setReportData(data);
            }
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Auto Refresh
    useEffect(() => {
        fetchReport();
    }, [filterLocation, filterFromDate, filterToDate, filterStatus, token]); // Fetch when filter changes

    useEffect(() => {
        if (refreshInterval > 0) {
            const interval = setInterval(fetchReport, refreshInterval);
            return () => clearInterval(interval);
        }
    }, [refreshInterval, filterLocation, filterFromDate, filterToDate, filterStatus]);

    const fetchTubeCovers = async (locationCode = '', bagId = '') => {
        if (!token) return;
        try {
            const params = new URLSearchParams();
            if (locationCode) params.append('location_code', locationCode);
            if (bagId) params.append('bag_id', bagId);
            const url = `${import.meta.env.VITE_API_URL}/api/cheese-packing/tube-covers?${params.toString()}`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setTubeCovers(await res.json());
        } catch (err) { console.error("Failed to fetch tube covers", err); }
    };

    const fetchMachinesMaster = async (locationCode) => {
        if (!token) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/master/machines`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const locationName = locationCode === 'K' ? 'Kaveripakkam' : (locationCode === 'P' ? 'Puducherry' : '');
                const filtered = data.items.filter(m => 
                    ['Cheese Winder', 'Doubler', 'TFO'].includes(m.machine_type) && 
                    (!locationName || m.unit?.includes(locationCode) || (m.location_name === locationName))
                );
                setMachinesMaster(filtered);
            }
        } catch (err) { console.error("Failed to fetch machines master", err); }
    };

    const fetchOperatorsMaster = async (locationCode) => {
        if (!token) return;
        try {
            const locationName = locationCode === 'K' ? 'Kaveripakkam' : (locationCode === 'P' ? 'Puducherry' : '');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/master/machines/operations/get-operator-list`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    location_name: locationName || 'All',
                    machine_type: 'Cheese Winder'
                })
            });
            if (res.ok) {
                setOperatorsMaster(await res.json());
            }
        } catch (err) { console.error("Failed to fetch operators master", err); }
    };

    // Live Clock for Elapsed Time
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        fetchTubeCovers(); // Initial fetch (all covers)
        return () => clearInterval(timer);
    }, [token]);

    // Helper: Calculate Time Elapsed
    const getTimeElapsed = (startTimeStr) => {
        if (!startTimeStr) return "-";
        const start = new Date(startTimeStr);
        const diffValid = !isNaN(start.getTime());
        if (!diffValid) return "-";

        const diffMs = currentTime - start;
        if (diffMs < 0) return "0m";

        const mins = Math.floor(diffMs / 60000);
        const hrs = Math.floor(mins / 60);
        const days = Math.floor(hrs / 24);

        if (days > 0) return `${days}d ${hrs % 24}h`;
        if (hrs > 0) return `${hrs}h ${mins % 60}m`;
        return `${mins}m`;
    };

    // Sorting
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredData = reportData.filter(row => row.status === filterStatus);

    const sortedData = [...filteredData].sort((a, b) => {
        if (!a[sortConfig.key]) return 1;
        if (!b[sortConfig.key]) return -1;

        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        // Number check for specific columns
        if (['bag_seq_no', 'cheeses_per_bag', 'cheese_weight', 'current_total', 'total_cheeses', 'net_weight', 'gross_weight'].includes(sortConfig.key)) {
            valA = parseFloat(valA) || 0;
            valB = parseFloat(valB) || 0;
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const normalSortedData = sortedData.filter(row => !row.repacking);
    const repackedSortedData = sortedData.filter(row => row.repacking);

    const getSortIndicator = (key) => {
        if (sortConfig.key !== key) return '↕'; // Neutral
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    // Real-time Tare Recalculation Effect
    useEffect(() => {
        if (editForm.manual_tare || !editForm.tube_cover || !isEditModalOpen) return;

        const selectedCover = tubeCovers.find(tc => tc.tube_cover === editForm.tube_cover);
        if (selectedCover) {
            const masterTubes = selectedCover.no_of_tubes || 0;
            const masterCovers = selectedCover.no_of_covers || 0;
            const tubeWt = selectedCover.tube_weight || 0;
            const coverWt = selectedCover.cover_weight || 0;
            const baseTare = selectedCover.tare_weight || 0;

            const p_total = editForm.total_cheeses || 0;
            const p_covers = editForm.no_of_covers || 0;

            const diffTubes = p_total - masterTubes;
            const diffCovers = p_covers - masterCovers;

            let newTare = baseTare;
            if (tubeWt > 0) newTare += (diffTubes * tubeWt) / 1000.0;
            if (coverWt > 0) newTare += (diffCovers * coverWt) / 1000.0;

            const roundedTare = Math.round(newTare * 100) / 100;

            if (Math.abs(editForm.tare_weight - roundedTare) > 0.001) {
                setEditForm(prev => ({ ...prev, tare_weight: roundedTare }));
            }
        }
    }, [editForm.total_cheeses, editForm.no_of_covers, editForm.tube_cover, editForm.manual_tare, tubeCovers, isEditModalOpen]);

    // Helper: Format Weight
    const formatWeight = (val) => {
        if (!val) return "-";
        const num = parseFloat(val);
        if (isNaN(num)) return val;

        // If weight > 10, assume it's already in grams (heuristic for single cheese)
        if (num >= 10) {
            return `${Math.round(num)} g`;
        }

        if (num < 1) {
            return `${Math.round(num * 1000)} g`;
        }
        return `${num} kg`;
    };

    const handleEdit = (row) => {
        let rawDetails = row.details || [];
        let finalDetails = [];

        if (rawDetails.length > 0) {
            // Check if it's already nested (has 'machines' key in first element)
            if (rawDetails[0].machines) {
                finalDetails = JSON.parse(JSON.stringify(rawDetails)).map(group => ({
                    ...group,
                    machines: (group.machines || []).map(m => ({
                        ...m,
                        machine_cheeses: m.machine_cheeses ?? m.cheeses ?? m.qty ?? 0
                    }))
                }));
            } else {
                // Flat structure detected - convert to nested
                finalDetails = [{
                    doff_no: row.doff_no || 0,
                    doubler_no: row.doubler_no || '',
                    machines: rawDetails.map(d => ({
                        machine_code: d.machine_code || d.machine_name || '',
                        operator_code: d.operator_code || '',
                        machine_cheeses: d.machine_cheeses ?? d.cheeses ?? d.qty ?? 0
                    }))
                }];
            }
        } else {
            // Empty details - provide a default group
            finalDetails = [{
                doff_no: row.doff_no || 0,
                doubler_no: row.doubler_no || '',
                machines: []
            }];
        }

        setEditForm({
            cheese_packing_id: row.id,
            total_cheeses: row.total_cheeses || row.cheeses_per_bag || 0,
            no_of_covers: row.no_of_covers || 0,
            tare_weight: row.tare_weight || 0,
            repacking: row.repacking || false,
            bag: row.bag !== undefined ? row.bag : true,
            tube_cover: row.tube_cover || '',
            original_tube_cover: row.tube_cover || '',
            manual_tare: false,
            status: row.status,
            details: finalDetails,
            location_code: row.location_code,
            bag_no: row.bag_no,
            doubler_no: row.doubler_no,
            doff_no: row.doff_no,
            orig_machine: row.cheesewinder_machine_code,
            orig_operator: row.operator_code,
            orig_cheeses: row.machine_cheeses
        });
        
        // Pre-fetch masters for the bag's location
        fetchMachinesMaster(row.location_code);
        fetchOperatorsMaster(row.location_code);
        fetchTubeCovers(row.location_code, row.id);
        
        setIsEditModalOpen(true);
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            const isWinding = editForm.status === 'Cheese Winding';
            const url = `${import.meta.env.VITE_API_URL}/api/cheese-packing/${isWinding ? 'winding-update' : 'update-bag-details'}`;
            // Enrich details before submission to match requested schema
            const enrichedDetails = (editForm.details || []).map(group => {
                // User enters machine name (e.g. 9009) in doubler_no, we look up machine_code
                const dMatch = machinesMaster.find(m => m.machine_name === group.doubler_no);
                return {
                    ...group,
                    doubler_code: dMatch ? dMatch.machine_code : "",
                    machines: (group.machines || []).map(m => {
                        const machMatch = machinesMaster.find(mm => mm.machine_code === m.machine_code);
                        const opMatch = operatorsMaster.find(op => op.operator_code === m.operator_code);
                        return {
                            ...m,
                            machine_name: machMatch ? machMatch.machine_name : "",
                            operator_name: opMatch ? (opMatch.operator_only_name || (opMatch.operator_name ? opMatch.operator_name.split(' - ')[1] : "")) : "",
                            cheeses: parseInt(m.machine_cheeses) || 0,
                            shift: "Day"
                        };
                    })
                };
            });

            const res = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ...editForm, details: enrichedDetails })
            });

            if (!res.ok) {
                const errData = await res.json();
                let detail = "Failed to update bag details";
                if (errData.detail) {
                    if (Array.isArray(errData.detail)) {
                        detail = errData.detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join('\n');
                    } else {
                        detail = errData.detail;
                    }
                }
                throw new Error(detail);
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

    const handlePrint = async (row) => {
        try {
            const url = `${import.meta.env.VITE_API_URL}/api/cheese-packing/trigger-print/${row.id}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to trigger print");
            alert(`Print triggered for bag ${row.bag_no}`);
        } catch (err) {
            console.error(err);
            alert(`Print Failed: ${err.message}`);
        }
    };

    const handleReprintSubmit = async (e) => {
        e.preventDefault();
        if (!selectedReprintBagId) return;
        setIsPrinting(true);
        try {
            const url = `${import.meta.env.VITE_API_URL}/api/cheese-packing/reprint-bag-label/${selectedReprintBagId}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    brother_label_needed: brotherLabelNeeded,
                    front_label_needed: frontLabelNeeded,
                    inside_label_needed: insideLabelNeeded
                })
            });

            if (!res.ok) throw new Error("Failed to trigger reprint");

            alert("Reprint triggered successfully!");
            setIsReprintModalOpen(false);
            setSelectedReprintBagId('');
        } catch (err) {
            console.error(err);
            alert(`Reprint Failed: ${err.message}`);
        } finally {
            setIsPrinting(false);
        }
    };

    const handleResetBag = async () => {
        if (!selectedReprintBagId) {
            alert("Please select a bag to reset.");
            return;
        }

        const confirmReset = window.confirm("Are you sure you want to reset this bag to 'Cheese Ready' status? This action is only allowed within 15 minutes of weighing.");
        if (!confirmReset) return;

        setIsPrinting(true); // Using isPrinting to disable buttons during API call
        try {
            const url = `${import.meta.env.VITE_API_URL}/api/cheese-packing/reset-bag/${selectedReprintBagId}`;
            const res = await fetch(url, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || "Failed to reset bag");
            }

            alert("Bag successfully reset to 'Cheese Ready' status!");
            setIsReprintModalOpen(false);
            setSelectedReprintBagId('');
            fetchReport(); // Refresh the table
        } catch (err) {
            console.error(err);
            alert(`Reset Failed: ${err.message}`);
        } finally {
            setIsPrinting(false);
        }
    };

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <div style={headerRowStyle}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <h2 style={headerStyle}>
                            {filterStatus === 'Completed' ? 'Cheese Packing History (Completed Bags)' : 'Cheese Packing Details (Active Bags)'}
                        </h2>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                            <button
                                onClick={() => setFilterStatus('Cheese Winding')}
                                style={{
                                    ...filterButtonStyle,
                                    background: filterStatus === 'Cheese Winding' ? '#2563eb' : '#f1f5f9',
                                    color: filterStatus === 'Cheese Winding' ? 'white' : '#475569'
                                }}
                            >
                                Cheese Winding
                            </button>
                            <button
                                onClick={() => setFilterStatus('Cheese Ready')}
                                style={{
                                    ...filterButtonStyle,
                                    background: filterStatus === 'Cheese Ready' ? '#2563eb' : '#f1f5f9',
                                    color: filterStatus === 'Cheese Ready' ? 'white' : '#475569'
                                }}
                            >
                                Cheese Ready
                            </button>
                            <button
                                onClick={() => setFilterStatus('Completed')}
                                style={{
                                    ...filterButtonStyle,
                                    background: filterStatus === 'Completed' ? '#2563eb' : '#f1f5f9',
                                    color: filterStatus === 'Completed' ? 'white' : '#475569'
                                }}
                            >
                                Completed Bags
                            </button>
                            <button
                                onClick={() => setFilterStatus('Summary')}
                                style={{
                                    ...filterButtonStyle,
                                    background: filterStatus === 'Summary' ? '#2563eb' : '#f1f5f9',
                                    color: filterStatus === 'Summary' ? 'white' : '#475569'
                                }}
                            >
                                Production Summary
                            </button>
                            <button
                                onClick={() => setFilterStatus('SizeSummary')}
                                style={{
                                    ...filterButtonStyle,
                                    background: filterStatus === 'SizeSummary' ? '#2563eb' : '#f1f5f9',
                                    color: filterStatus === 'SizeSummary' ? 'white' : '#475569'
                                }}
                            >
                                Size-wise Summary
                            </button>
                        </div>
                        {filterStatus === 'Completed' && (
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                <button
                                    onClick={() => setIsReprintModalOpen(true)}
                                    style={{ ...refreshButtonStyle, background: '#059669' }}
                                >
                                    🖨️ Reprint Bag Label
                                </button>
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Location</label>
                            <select
                                value={filterLocation}
                                onChange={(e) => setFilterLocation(e.target.value)}
                                style={selectStyle}
                            >
                                <option value="">All Locations</option>
                                <option value="K">Kaveripakkam (K)</option>
                                <option value="P">Puducherry (P)</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <label style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                {filterStatus === 'Completed' || filterStatus === 'Summary' || filterStatus === 'SizeSummary' ? 'Weighed From' : 'Created From'}
                            </label>
                            <input
                                type="datetime-local"
                                value={filterFromDate}
                                onChange={(e) => setFilterFromDate(e.target.value)}
                                style={selectStyle}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <label style={{ fontSize: '0.8rem', color: '#64748b' }}>To</label>
                            <input
                                type="datetime-local"
                                value={filterToDate}
                                onChange={(e) => setFilterToDate(e.target.value)}
                                style={selectStyle}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Refresh</label>
                            <select
                                value={refreshInterval}
                                onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                                style={selectStyle}
                            >
                                <option value={30000}>30 sec</option>
                                <option value={60000}>1 min</option>
                                <option value={120000}>2 mins</option>
                                <option value={300000}>5 mins</option>
                                <option value={600000}>10 mins</option>
                                <option value={0}>Off</option>
                            </select>
                        </div>
                        <button onClick={fetchReport} style={{ ...refreshButtonStyle, marginTop: '1.2rem' }}>Refresh</button>
                        {
                            (filterStatus === 'Summary' || filterStatus === 'SizeSummary') && (
                                <button
                                    onClick={async () => {
                                        try {
                                            const reportType = filterStatus === 'SizeSummary' ? 'compact' : 'detailed';
                                            const url = `${import.meta.env.VITE_API_URL}/api/cheese-packing/summary-report/pdf?from_date=${filterFromDate}&to_date=${filterToDate}${filterLocation ? `&location=${filterLocation}` : ''}&report_type=${reportType}`;
                                            const response = await fetch(url);
                                            if (!response.ok) throw new Error("Failed to download PDF");

                                            const blob = await response.blob();
                                            const blobUrl = window.URL.createObjectURL(blob);
                                            const link = document.createElement('a');
                                            link.href = blobUrl;
                                            link.download = `${reportType === 'compact' ? 'Size_Summary' : 'Production_Summary'}_${filterFromDate}.pdf`;
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                            window.URL.revokeObjectURL(blobUrl);
                                        } catch (err) {
                                            console.error(err);
                                            alert("Failed to download PDF. Please try again.");
                                        }
                                    }}
                                    style={{ ...refreshButtonStyle, marginTop: '1.2rem', background: '#dc2626' }}
                                >
                                    📄 Download PDF
                                </button>
                            )
                        }
                    </div>
                </div>

                {loading && <p>Loading...</p>}
                {error && <p style={{ color: 'red' }}>Error: {error}</p>}

                {!loading && !error && (filterStatus === 'Summary' || filterStatus === 'SizeSummary') && 
                    summaryData.length === 0 && 
                    repackedSummaryData.length === 0 && 
                    mtdSummaryData.length === 0 && 
                    repackedMtdSummaryData.length === 0 && (
                    <p style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                        No production data found for {filterFromDate.replace('T', ' ')}.
                    </p>
                )}

                {!loading && !error && filterStatus === 'SizeSummary' && (summaryData.length > 0 || repackedSummaryData.length > 0 || mtdSummaryData.length > 0 || repackedMtdSummaryData.length > 0) && (
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div>
                            <h3 style={{ marginBottom: '1rem', color: '#1e293b' }}>Size-wise Summary ({filterFromDate.replace('T', ' ')} to {filterToDate.replace('T', ' ')})</h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                    <tr>
                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#475569' }}>S.No</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#475569' }}>Twine Size</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#475569' }}>Display Size</th>
                                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#475569' }}>Total Bags</th>
                                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#475569' }}>Total Net Wt (kg)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summaryData.map((group, idx) => {
                                        const totalBags = group.bags.length;
                                        const totalWeight = group.bags.reduce((sum, b) => sum + (b.net_weight || 0), 0);
                                        return (
                                            <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                <td style={{ padding: '12px', color: '#1e293b' }}>{idx + 1}</td>
                                                <td style={{ padding: '12px', color: '#1e293b', fontWeight: '600' }}>{group.twine_size}</td>
                                                <td style={{ padding: '12px', color: '#1e293b' }}>{group.display_size}</td>
                                                <td style={{ padding: '12px', textAlign: 'center', color: '#1e293b' }}>{totalBags}</td>
                                                <td style={{ padding: '12px', textAlign: 'right', color: '#1e293b', fontWeight: '600' }}>{totalWeight.toFixed(2)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                                    <tr>
                                        <td colSpan="3" style={{ padding: '12px', textAlign: 'right', color: '#1e293b' }}>
                                            Grand Total ({summaryData.reduce((sum, group) => sum + group.bags.length, 0)} Bags):
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center', color: '#1e293b' }}>
                                            {summaryData.reduce((sum, group) => sum + group.bags.length, 0)}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right', color: '#1e293b' }}>
                                            {summaryData.reduce((sum, group) => sum + group.bags.reduce((s, b) => s + (b.net_weight || 0), 0), 0).toFixed(2)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {repackedSummaryData.length > 0 && (
                            <div>
                                <h3 style={{ marginBottom: '1rem', color: '#dc2626' }}>Repacked Size-wise Summary ({filterFromDate.replace('T', ' ')} to {filterToDate.replace('T', ' ')})</h3>
                                <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fffefc', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #fee2e2' }}>
                                    <thead style={{ background: '#fef2f2', borderBottom: '2px solid #fee2e2' }}>
                                        <tr>
                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#991b1b' }}>S.No</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#991b1b' }}>Twine Size</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#991b1b' }}>Display Size</th>
                                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#991b1b' }}>Total Bags</th>
                                            <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#991b1b' }}>Total Net Wt (kg)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {repackedSummaryData.map((group, idx) => {
                                            const totalBags = group.bags.length;
                                            const totalWeight = group.bags.reduce((sum, b) => sum + (b.net_weight || 0), 0);
                                            return (
                                                <tr key={idx} style={{ borderBottom: '1px solid #fee2e2' }}>
                                                    <td style={{ padding: '12px', color: '#991b1b' }}>{idx + 1}</td>
                                                    <td style={{ padding: '12px', color: '#991b1b', fontWeight: '600' }}>{group.twine_size}</td>
                                                    <td style={{ padding: '12px', color: '#991b1b' }}>{group.display_size}</td>
                                                    <td style={{ padding: '12px', textAlign: 'center', color: '#991b1b' }}>{totalBags}</td>
                                                    <td style={{ padding: '12px', textAlign: 'right', color: '#991b1b', fontWeight: '600' }}>{totalWeight.toFixed(2)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot style={{ background: '#fef2f2', fontWeight: 'bold' }}>
                                        <tr>
                                            <td colSpan="3" style={{ padding: '12px', textAlign: 'right', color: '#991b1b' }}>
                                                Total Repacked ({repackedSummaryData.reduce((sum, group) => sum + group.bags.length, 0)} Bags):
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center', color: '#991b1b' }}>
                                                {repackedSummaryData.reduce((sum, group) => sum + group.bags.length, 0)}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'right', color: '#991b1b' }}>
                                                {repackedSummaryData.reduce((sum, group) => sum + group.bags.reduce((s, b) => s + (b.net_weight || 0), 0), 0).toFixed(2)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}

                        {mtdSummaryData.length > 0 && (
                            <div>
                                <h3 style={{ marginBottom: '1rem', color: '#1e293b' }}>Month-to-Date Size-wise Summary (up to {filterToDate.replace('T', ' ')})</h3>
                                <table style={{ width: '100%', borderCollapse: 'collapse', background: '#f0f9ff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                    <thead style={{ background: '#e0f2fe', borderBottom: '2px solid #bae6fd' }}>
                                        <tr>
                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#0369a1' }}>S.No</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#0369a1' }}>Twine Size</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#0369a1' }}>Display Size</th>
                                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#0369a1' }}>Total Bags</th>
                                            <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#0369a1' }}>Total Net Wt (kg)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mtdSummaryData.map((group, idx) => {
                                            const totalBags = group.bags.length;
                                            const totalWeight = group.bags.reduce((sum, b) => sum + (b.net_weight || 0), 0);
                                            return (
                                                <tr key={idx} style={{ borderBottom: '1px solid #bae6fd' }}>
                                                    <td style={{ padding: '12px', color: '#0c4a6e' }}>{idx + 1}</td>
                                                    <td style={{ padding: '12px', color: '#0c4a6e', fontWeight: '600' }}>{group.twine_size}</td>
                                                    <td style={{ padding: '12px', color: '#0c4a6e' }}>{group.display_size}</td>
                                                    <td style={{ padding: '12px', textAlign: 'center', color: '#0c4a6e' }}>{totalBags}</td>
                                                    <td style={{ padding: '12px', textAlign: 'right', color: '#0c4a6e', fontWeight: '600' }}>{totalWeight.toFixed(2)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot style={{ background: '#e0f2fe', fontWeight: 'bold' }}>
                                        <tr>
                                            <td colSpan="3" style={{ padding: '12px', textAlign: 'right', color: '#0369a1' }}>
                                                MTD Total ({mtdSummaryData.reduce((sum, group) => sum + group.bags.length, 0)} Bags):
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center', color: '#0c4a6e' }}>
                                                {mtdSummaryData.reduce((sum, group) => sum + group.bags.length, 0)}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'right', color: '#0c4a6e' }}>
                                                {mtdSummaryData.reduce((sum, group) => sum + group.bags.reduce((s, b) => s + (b.net_weight || 0), 0), 0).toFixed(2)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}

                        {repackedMtdSummaryData.length > 0 && (
                            <div>
                                <h3 style={{ marginBottom: '1rem', color: '#991b1b' }}>Month-to-Date Repacked Size-wise Summary (up to {filterToDate.replace('T', ' ')})</h3>
                                <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fef2f2', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #fee2e2' }}>
                                    <thead style={{ background: '#fee2e2', borderBottom: '2px solid #fecaca' }}>
                                        <tr>
                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#991b1b' }}>S.No</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#991b1b' }}>Twine Size</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#991b1b' }}>Display Size</th>
                                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#991b1b' }}>Total Bags</th>
                                            <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#991b1b' }}>Total Net Wt (kg)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {repackedMtdSummaryData.map((group, idx) => {
                                            const totalBags = group.bags.length;
                                            const totalWeight = group.bags.reduce((sum, b) => sum + (b.net_weight || 0), 0);
                                            return (
                                                <tr key={idx} style={{ borderBottom: '1px solid #fecaca' }}>
                                                    <td style={{ padding: '12px', color: '#7f1d1d' }}>{idx + 1}</td>
                                                    <td style={{ padding: '12px', color: '#7f1d1d', fontWeight: '600' }}>{group.twine_size}</td>
                                                    <td style={{ padding: '12px', color: '#7f1d1d' }}>{group.display_size}</td>
                                                    <td style={{ padding: '12px', textAlign: 'center', color: '#7f1d1d' }}>{totalBags}</td>
                                                    <td style={{ padding: '12px', textAlign: 'right', color: '#7f1d1d', fontWeight: '600' }}>{totalWeight.toFixed(2)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot style={{ background: '#fee2e2', fontWeight: 'bold' }}>
                                        <tr>
                                            <td colSpan="3" style={{ padding: '12px', textAlign: 'right', color: '#991b1b' }}>
                                                MTD Repacked Total ({repackedMtdSummaryData.reduce((sum, group) => sum + group.bags.length, 0)} Bags):
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center', color: '#7f1d1d' }}>
                                                {repackedMtdSummaryData.reduce((sum, group) => sum + group.bags.length, 0)}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'right', color: '#7f1d1d' }}>
                                                {repackedMtdSummaryData.reduce((sum, group) => sum + group.bags.reduce((s, b) => s + (b.net_weight || 0), 0), 0).toFixed(2)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>
                )}


                {!loading && !error && filterStatus === 'Summary' && (summaryData.length > 0 || repackedSummaryData.length > 0) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {summaryData.map((group) => {
                            const totalPcs = group.bags.reduce((acc, b) => acc + (b.total_cheeses || 0), 0);
                            const totalNet = group.bags.reduce((acc, b) => acc + (b.net_weight || 0), 0);
                            const totalGross = group.bags.reduce((acc, b) => acc + (b.gross_weight || 0), 0);

                            const nettingBags = group.bags.filter(b => b.bag === false);
                            const nettingNet = nettingBags.reduce((acc, b) => acc + (b.net_weight || 0), 0);

                            return (
                                <div key={group.twine_size + group.display_size} style={{ ...cardStyle, padding: '1rem', background: '#fff' }}>
                                    <h3 style={{ marginBottom: '1rem', color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                        {group.twine_size} - {group.display_size}
                                    </h3>
                                    <div style={tableContainerStyle}>
                                        <table style={tableStyle}>
                                            <thead>
                                                <tr>
                                                    <th style={{ ...thStyle, width: '60px' }}>S.No</th>
                                                    <th style={thStyle}>Bale Number</th>
                                                    <th style={thStyle}>No of Pcs</th>
                                                    <th style={thStyle}>Net Wt (kg)</th>
                                                    <th style={thStyle}>Gross Wt (kg)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {group.bags.map((bag, idx) => (
                                                    <tr key={bag.bag_number} style={trStyle}>
                                                        <td style={tdStyle}>{bag.bag === false ? `*${idx + 1}` : (idx + 1)}</td>
                                                        <td style={tdStyle}>
                                                            <span style={{
                                                                padding: '0.2rem 0.6rem',
                                                                borderRadius: '9999px',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 800,
                                                                backgroundColor: bag.bag ? '#dcfce7' : '#fee2e2',
                                                                color: bag.bag ? '#166534' : '#991b1b',
                                                                display: 'inline-block'
                                                            }}>
                                                                {bag.bag_number}
                                                                {bag.order_type && !bag.order_type.toString().toUpperCase().includes('DOMESTIC') && ` (${bag.order_type})`}
                                                            </span>
                                                        </td>
                                                        <td style={tdStyle}>{bag.total_cheeses}</td>
                                                        <td style={tdStyle}>{bag.net_weight?.toFixed(2)}</td>
                                                        <td style={tdStyle}>{bag.gross_weight?.toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr style={{ ...trStyle, background: '#f8fafc', fontWeight: 'bold' }}>
                                                    <td colSpan="2" style={{ ...tdStyle, textAlign: 'right' }}>Total ({group.bags.length} Bags):</td>
                                                    <td style={tdStyle}>{totalPcs}</td>
                                                    <td style={tdStyle}>{totalNet.toFixed(2)}</td>
                                                    <td style={tdStyle}>{totalGross.toFixed(2)}</td>
                                                </tr>
                                                {nettingNet > 0 && (
                                                    <tr style={{ ...trStyle, color: '#dc2626', fontWeight: 'bold' }}>
                                                        <td colSpan="3" style={{ ...tdStyle, textAlign: 'right' }}>*Issued to Netting:</td>
                                                        <td style={tdStyle}>{nettingNet.toFixed(2)}</td>
                                                        <td style={tdStyle}>-</td>
                                                    </tr>
                                                )}
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                        {repackedSummaryData.length > 0 && (
                            <div style={{ marginTop: '2rem', borderTop: '4px solid #ef4444', paddingTop: '2rem' }}>
                                <h2 style={{ ...headerStyle, color: '#b91c1c', marginBottom: '1.5rem' }}>Repacked Production Summary</h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                    {repackedSummaryData.map((group) => {
                                        const totalPcs = group.bags.reduce((acc, b) => acc + (b.total_cheeses || 0), 0);
                                        const totalNet = group.bags.reduce((acc, b) => acc + (b.net_weight || 0), 0);
                                        const totalGross = group.bags.reduce((acc, b) => acc + (b.gross_weight || 0), 0);

                                        return (
                                            <div key={"repacked-" + group.twine_size + group.display_size} style={{ ...cardStyle, padding: '1rem', background: '#fffefc', border: '1px solid #fee2e2' }}>
                                                <h3 style={{ marginBottom: '1rem', color: '#b91c1c', borderBottom: '2px solid #fee2e2', paddingBottom: '0.5rem' }}>
                                                    {group.twine_size} - {group.display_size} (Repacked)
                                                </h3>
                                                <div style={tableContainerStyle}>
                                                    <table style={tableStyle}>
                                                        <thead>
                                                            <tr>
                                                                <th style={{ ...thStyle, width: '60px', background: '#fef2f2', color: '#991b1b' }}>S.No</th>
                                                                <th style={{ ...thStyle, background: '#fef2f2', color: '#991b1b' }}>Bale Number</th>
                                                                <th style={{ ...thStyle, background: '#fef2f2', color: '#991b1b' }}>No of Pcs</th>
                                                                <th style={{ ...thStyle, background: '#fef2f2', color: '#991b1b' }}>Net Wt (kg)</th>
                                                                <th style={{ ...thStyle, background: '#fef2f2', color: '#991b1b' }}>Gross Wt (kg)</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {group.bags.map((bag, idx) => (
                                                                <tr key={bag.bag_number} style={trStyle}>
                                                                    <td style={{ ...tdStyle, color: '#7f1d1d' }}>{idx + 1}</td>
                                                                    <td style={tdStyle}>
                                                                        <span style={{
                                                                            padding: '0.2rem 0.6rem',
                                                                            borderRadius: '9999px',
                                                                            fontSize: '0.75rem',
                                                                            fontWeight: 800,
                                                                            backgroundColor: '#fee2e2',
                                                                            color: '#991b1b',
                                                                            display: 'inline-block'
                                                                        }}>
                                                                            {bag.bag_number}
                                                                        </span>
                                                                    </td>
                                                                    <td style={{ ...tdStyle, color: '#7f1d1d' }}>{bag.total_cheeses}</td>
                                                                    <td style={{ ...tdStyle, color: '#7f1d1d' }}>{bag.net_weight?.toFixed(2)}</td>
                                                                    <td style={{ ...tdStyle, color: '#7f1d1d' }}>{bag.gross_weight?.toFixed(2)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                        <tfoot>
                                                            <tr style={{ ...trStyle, background: '#fef2f2', fontWeight: 'bold' }}>
                                                                <td colSpan="2" style={{ ...tdStyle, textAlign: 'right', color: '#991b1b' }}>Total Repacked ({group.bags.length} Bags):</td>
                                                                <td style={{ ...tdStyle, color: '#991b1b' }}>{totalPcs}</td>
                                                                <td style={{ ...tdStyle, color: '#991b1b' }}>{totalNet.toFixed(2)}</td>
                                                                <td style={{ ...tdStyle, color: '#991b1b' }}>{totalGross.toFixed(2)}</td>
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {!loading && !error && filterStatus !== 'Summary' && filterStatus !== 'SizeSummary' && normalSortedData.length === 0 && (
                    <p style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                        No bags found with status "{filterStatus}".
                    </p>
                )}

                {!loading && !error && filterStatus !== 'Summary' && filterStatus !== 'SizeSummary' && normalSortedData.length > 0 && (
                    <div style={tableContainerStyle}>
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    <th style={thStyle} onClick={() => handleSort('bag_seq_no')}>Bag Seq {getSortIndicator('bag_seq_no')}</th>
                                    <th style={thStyle} onClick={() => handleSort('twine_size')}>Size {getSortIndicator('twine_size')}</th>
                                    {filterStatus === 'Completed' && <th style={thStyle} onClick={() => handleSort('display_size')}>Display Size {getSortIndicator('display_size')}</th>}
                                    {filterStatus !== 'Completed' && <th style={thStyle} onClick={() => handleSort('month_year')}>Month/Year {getSortIndicator('month_year')}</th>}
                                    {filterStatus !== 'Completed' && <th style={thStyle} onClick={() => handleSort('doubler_doff')}>Doubler Doff {getSortIndicator('doubler_doff')}</th>}
                                    {filterStatus !== 'Completed' && <th style={thStyle} onClick={() => handleSort('start_time')}>Time Elapsed {getSortIndicator('start_time')}</th>}
                                    {filterStatus === 'Completed' && <th style={thStyle} onClick={() => handleSort('total_cheeses')}>Total Cheeses {getSortIndicator('total_cheeses')}</th>}
                                    {filterStatus === 'Completed' && <th style={thStyle} onClick={() => handleSort('net_weight')}>Net Wt {getSortIndicator('net_weight')}</th>}
                                    {filterStatus === 'Completed' && <th style={thStyle} onClick={() => handleSort('gross_weight')}>Gross Wt {getSortIndicator('gross_weight')}</th>}
                                    {filterStatus === 'Completed' && <th style={thStyle} onClick={() => handleSort('bag')}>Bag {getSortIndicator('bag')}</th>}
                                    {filterStatus === 'Completed' && <th style={thStyle} onClick={() => handleSort('weighed_time')}>Weighing Date {getSortIndicator('weighed_time')}</th>}

                                    {filterStatus !== 'Completed' && <th style={{ ...thStyle, width: '400px' }}>Associated Machines</th>}
                                    {filterStatus !== 'Completed' && <th style={thStyle} onClick={() => handleSort('cheese_tube')}>Cheese Tube {getSortIndicator('cheese_tube')}</th>}
                                    {filterStatus !== 'Completed' && <th style={thStyle} onClick={() => handleSort('cheese_weight')}>Cheese Weight {getSortIndicator('cheese_weight')}</th>}
                                    {filterStatus !== 'Completed' && <th style={thStyle} onClick={() => handleSort('cheeses_per_bag')}>Cheeses / Bag {getSortIndicator('cheeses_per_bag')}</th>}
                                    <th style={thStyle} onClick={() => handleSort('bag_number')}>Full Bag No {getSortIndicator('bag_number')}</th>
                                    {(filterStatus === 'Cheese Ready' || filterStatus === 'Cheese Winding') && <th style={thStyle}>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {normalSortedData.map((row) => (
                                    <tr key={row.bag_no} style={trStyle}>
                                        <td style={tdStyle}>
                                            <span style={{
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                fontWeight: 800,
                                                backgroundColor: row.bag ? '#dcfce7' : '#fee2e2',
                                                color: row.bag ? '#166534' : '#991b1b',
                                                display: 'inline-block'
                                            }}>
                                                {row.bag_seq_no}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>{row.twine_size}</td>
                                        {filterStatus === 'Completed' && <td style={tdStyle}>{row.display_size}</td>}
                                        {filterStatus !== 'Completed' && <td style={tdStyle}>{row.month_year}</td>}
                                        {filterStatus !== 'Completed' && <td style={tdStyle}>{row.doubler_doff}</td>}
                                        {filterStatus !== 'Completed' && (
                                            <td style={{ ...tdStyle, color: '#2563eb', fontWeight: 'bold' }}>
                                                {getTimeElapsed(row.start_time)}
                                            </td>
                                        )}
                                        {filterStatus === 'Completed' && <td style={tdStyle}>{row.total_cheeses}</td>}
                                        {filterStatus === 'Completed' && <td style={tdStyle}>{row.net_weight ? `${row.net_weight} kg` : "-"}</td>}
                                        {filterStatus === 'Completed' && <td style={tdStyle}>{row.gross_weight ? `${row.gross_weight} kg` : "-"}</td>}
                                        {filterStatus === 'Completed' && <td style={tdStyle}>{row.bag ? "Yes" : "No"}</td>}
                                        {filterStatus === 'Completed' && <td style={tdStyle}><small>{row.weighed_time ? new Date(row.weighed_time).toLocaleString() : "-"}</small></td>}

                                        {filterStatus !== 'Completed' && (
                                            <td style={tdStyle}>
                                                {row.machines ? row.machines.reduce((acc, curr, i) => {
                                                    if (i % 2 === 0) acc.push([curr]);
                                                    else acc[acc.length - 1].push(curr);
                                                    return acc;
                                                }, []).map((pair, i, arr) => (
                                                    <div key={i} style={{ marginBottom: i < arr.length - 1 ? '0.2rem' : 0 }}>
                                                        {pair.join(", ")}
                                                    </div>
                                                )) : ""}
                                            </td>
                                        )}
                                        {filterStatus !== 'Completed' && <td style={tdStyle}>{row.cheese_tube}</td>}
                                        {filterStatus !== 'Completed' && <td style={tdStyle}>{formatWeight(row.cheese_weight)}</td>}
                                        {filterStatus !== 'Completed' && <td style={tdStyle}>{row.cheeses_per_bag}</td>}
                                        <td style={tdStyle}>
                                            <span style={{
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                backgroundColor: row.order_type && !row.order_type.toString().toUpperCase().includes('DOMESTIC') ? '#ffedd5' : '#f1f5f9',
                                                color: row.order_type && !row.order_type.toString().toUpperCase().includes('DOMESTIC') ? '#9a3412' : '#475569',
                                                display: 'inline-block'
                                            }}>
                                                {row.bag_number || row.bag_no}
                                                {row.order_type && !row.order_type.toString().toUpperCase().includes('DOMESTIC') && ` (${row.order_type})`}
                                            </span>
                                        </td>
                                        {(filterStatus === 'Cheese Ready' || filterStatus === 'Cheese Winding') && (
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    {(() => {
                                                        const userLoc = user?.location_name || '';
                                                        const rowLoc = row.location_code || '';
                                                        const canModify = userLoc === 'All' || 
                                                                          userLoc === rowLoc || 
                                                                          (userLoc === 'Kaveripakkam' && rowLoc === 'K') || 
                                                                          (userLoc === 'Puducherry' && rowLoc === 'P');
                                                        
                                                        if (!canModify) return null;

                                                        return (
                                                            <>
                                                                {filterStatus === 'Cheese Ready' && (
                                                                    <button
                                                                        onClick={() => handleEdit(row)}
                                                                        style={editButtonStyle}
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                )}
                                                                {filterStatus === 'Cheese Winding' && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleEdit(row)}
                                                                            style={editButtonStyle}
                                                                        >
                                                                            Edit
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handlePrint(row)}
                                                                            style={{ ...editButtonStyle, background: '#059669' }}
                                                                        >
                                                                            Reprint Label
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Repacked Bags List */}
                {!loading && !error && filterStatus !== 'Summary' && filterStatus !== 'SizeSummary' && repackedSortedData.length > 0 && (
                    <div style={{ ...tableContainerStyle, marginTop: '3rem', borderTop: '4px solid #ef4444', paddingTop: '1.5rem' }}>
                        <h3 style={{ ...headerStyle, color: '#b91c1c', marginBottom: '1rem' }}>Repacked Bags List</h3>
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    <th style={{ ...thStyle, background: '#fef2f2', color: '#991b1b' }} onClick={() => handleSort('bag_seq_no')}>Bag Seq {getSortIndicator('bag_seq_no')}</th>
                                    <th style={{ ...thStyle, background: '#fef2f2', color: '#991b1b' }} onClick={() => handleSort('twine_size')}>Size {getSortIndicator('twine_size')}</th>
                                    {filterStatus === 'Completed' && <th style={{ ...thStyle, background: '#fef2f2', color: '#991b1b' }} onClick={() => handleSort('display_size')}>Display Size {getSortIndicator('display_size')}</th>}
                                    {filterStatus !== 'Completed' && <th style={{ ...thStyle, background: '#fef2f2', color: '#991b1b' }} onClick={() => handleSort('month_year')}>Month/Year {getSortIndicator('month_year')}</th>}
                                    {filterStatus !== 'Completed' && <th style={{ ...thStyle, background: '#fef2f2', color: '#991b1b' }} onClick={() => handleSort('doubler_doff')}>Doubler Doff {getSortIndicator('doubler_doff')}</th>}
                                    {filterStatus !== 'Completed' && <th style={{ ...thStyle, background: '#fef2f2', color: '#991b1b' }} onClick={() => handleSort('start_time')}>Time Elapsed {getSortIndicator('start_time')}</th>}
                                    {filterStatus === 'Completed' && <th style={{ ...thStyle, background: '#fef2f2', color: '#991b1b' }} onClick={() => handleSort('total_cheeses')}>Total Cheeses {getSortIndicator('total_cheeses')}</th>}
                                    {filterStatus === 'Completed' && <th style={{ ...thStyle, background: '#fef2f2', color: '#991b1b' }} onClick={() => handleSort('net_weight')}>Net Wt {getSortIndicator('net_weight')}</th>}
                                    {filterStatus === 'Completed' && <th style={{ ...thStyle, background: '#fef2f2', color: '#991b1b' }} onClick={() => handleSort('gross_weight')}>Gross Wt {getSortIndicator('gross_weight')}</th>}
                                    {filterStatus === 'Completed' && <th style={{ ...thStyle, background: '#fef2f2', color: '#991b1b' }} onClick={() => handleSort('bag')}>Bag {getSortIndicator('bag')}</th>}
                                    {filterStatus === 'Completed' && <th style={{ ...thStyle, background: '#fef2f2', color: '#991b1b' }} onClick={() => handleSort('weighed_time')}>Weighing Date {getSortIndicator('weighed_time')}</th>}

                                    {filterStatus !== 'Completed' && <th style={{ ...thStyle, width: '400px', background: '#fef2f2', color: '#991b1b' }}>Associated Machines</th>}
                                    {filterStatus !== 'Completed' && <th style={{ ...thStyle, background: '#fef2f2', color: '#991b1b' }} onClick={() => handleSort('cheese_tube')}>Cheese Tube {getSortIndicator('cheese_tube')}</th>}
                                    {filterStatus !== 'Completed' && <th style={{ ...thStyle, background: '#fef2f2', color: '#991b1b' }} onClick={() => handleSort('cheese_weight')}>Cheese Weight {getSortIndicator('cheese_weight')}</th>}
                                    {filterStatus !== 'Completed' && <th style={{ ...thStyle, background: '#fef2f2', color: '#991b1b' }} onClick={() => handleSort('cheeses_per_bag')}>Cheeses / Bag {getSortIndicator('cheeses_per_bag')}</th>}
                                    <th style={{ ...thStyle, background: '#fef2f2', color: '#991b1b' }} onClick={() => handleSort('bag_number')}>Full Bag No {getSortIndicator('bag_number')}</th>
                                    {(filterStatus === 'Cheese Ready' || filterStatus === 'Cheese Winding') && <th style={{ ...thStyle, background: '#fef2f2', color: '#991b1b' }}>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {repackedSortedData.map((row) => (
                                    <tr key={row.bag_no} style={trStyle}>
                                        <td style={tdStyle}>
                                            <span style={{
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                fontWeight: 800,
                                                backgroundColor: '#fee2e2',
                                                color: '#991b1b',
                                                display: 'inline-block'
                                            }}>
                                                {row.bag_seq_no}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>{row.twine_size}</td>
                                        {filterStatus === 'Completed' && <td style={tdStyle}>{row.display_size}</td>}
                                        {filterStatus !== 'Completed' && <td style={tdStyle}>{row.month_year}</td>}
                                        {filterStatus !== 'Completed' && <td style={tdStyle}>{row.doubler_doff}</td>}
                                        {filterStatus !== 'Completed' && (
                                            <td style={{ ...tdStyle, color: '#dc2626', fontWeight: 'bold' }}>
                                                {getTimeElapsed(row.start_time)}
                                            </td>
                                        )}
                                        {filterStatus === 'Completed' && <td style={tdStyle}>{row.total_cheeses}</td>}
                                        {filterStatus === 'Completed' && <td style={tdStyle}>{row.net_weight ? `${row.net_weight} kg` : "-"}</td>}
                                        {filterStatus === 'Completed' && <td style={tdStyle}>{row.gross_weight ? `${row.gross_weight} kg` : "-"}</td>}
                                        {filterStatus === 'Completed' && <td style={tdStyle}>{row.bag ? "Yes" : "No"}</td>}
                                        {filterStatus === 'Completed' && <td style={tdStyle}><small>{row.weighed_time ? new Date(row.weighed_time).toLocaleString() : "-"}</small></td>}

                                        {filterStatus !== 'Completed' && (
                                            <td style={tdStyle}>
                                                {row.machines ? row.machines.reduce((acc, curr, i) => {
                                                    if (i % 2 === 0) acc.push([curr]);
                                                    else acc[acc.length - 1].push(curr);
                                                    return acc;
                                                }, []).map((pair, i, arr) => (
                                                    <div key={i} style={{ marginBottom: i < arr.length - 1 ? '0.2rem' : 0 }}>
                                                        {pair.join(", ")}
                                                    </div>
                                                )) : ""}
                                            </td>
                                        )}
                                        {filterStatus !== 'Completed' && <td style={tdStyle}>{row.cheese_tube}</td>}
                                        {filterStatus !== 'Completed' && <td style={tdStyle}>{formatWeight(row.cheese_weight)}</td>}
                                        {filterStatus !== 'Completed' && <td style={tdStyle}>{row.cheeses_per_bag}</td>}
                                        <td style={tdStyle}>
                                            <span style={{
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                backgroundColor: '#fee2e2',
                                                color: '#b91c1c',
                                                display: 'inline-block'
                                            }}>
                                                {row.bag_number || row.bag_no}
                                                {row.order_type && !row.order_type.toString().toUpperCase().includes('DOMESTIC') && ` (${row.order_type})`}
                                            </span>
                                        </td>
                                        {(filterStatus === 'Cheese Ready' || filterStatus === 'Cheese Winding') && (
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    {(() => {
                                                        const userLoc = user?.location_name || '';
                                                        const rowLoc = row.location_code || '';
                                                        const canModify = userLoc === 'All' || 
                                                                          userLoc === rowLoc || 
                                                                          (userLoc === 'Kaveripakkam' && rowLoc === 'K') || 
                                                                          (userLoc === 'Puducherry' && rowLoc === 'P');
                                                        
                                                        if (!canModify) return null;

                                                        return (
                                                            <>
                                                                {filterStatus === 'Cheese Ready' && (
                                                                    <button
                                                                        onClick={() => handleEdit(row)}
                                                                        style={editButtonStyle}
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                )}
                                                                {filterStatus === 'Cheese Winding' && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleEdit(row)}
                                                                            style={editButtonStyle}
                                                                        >
                                                                            Edit
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handlePrint(row)}
                                                                            style={{ ...editButtonStyle, background: '#059669' }}
                                                                        >
                                                                            Reprint Label
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modals */}
            <>
                {isEditModalOpen && (
                    <div style={modalOverlayStyle}>
                        <div style={modalContentStyle}>
                            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                Edit Bag Details: <span style={{ color: '#2563eb' }}>{editForm.cheese_packing_id}</span>
                            </h3>
                            <form onSubmit={handleUpdateSubmit} style={formStyle}>
                                <div style={{ paddingRight: '0.2rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        {(() => {
                                            const currentTubeCoverObj = tubeCovers.find(tc => tc.tube_cover === editForm.tube_cover);
                                            return (
                                                <>
                                                    <div style={formGroupStyle}>
                                                        <label style={labelStyle}>Total Cheeses</label>
                                                        <input
                                                            type="number"
                                                            value={editForm.total_cheeses === null || isNaN(editForm.total_cheeses) ? '' : editForm.total_cheeses}
                                                            onChange={(e) => setEditForm({ ...editForm, total_cheeses: e.target.value === '' ? null : parseInt(e.target.value) })}
                                                            style={inputStyle}
                                                            required
                                                        />
                                                        {currentTubeCoverObj && currentTubeCoverObj.tube_name && (
                                                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem', paddingLeft: '0.1rem' }}>
                                                                <div><b>Tube:</b> {currentTubeCoverObj.tube_name} ({currentTubeCoverObj.tube_weight}g)</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div style={formGroupStyle}>
                                                        <label style={labelStyle}>No. of Covers</label>
                                                        <input
                                                            type="number"
                                                            value={editForm.no_of_covers === null || isNaN(editForm.no_of_covers) ? '' : editForm.no_of_covers}
                                                            onChange={(e) => setEditForm({ ...editForm, no_of_covers: e.target.value === '' ? 0 : parseInt(e.target.value) })}
                                                            style={inputStyle}
                                                            required
                                                        />
                                                        {currentTubeCoverObj && currentTubeCoverObj.cover_name && (
                                                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem', paddingLeft: '0.1rem' }}>
                                                                <div><b>Cover:</b> {currentTubeCoverObj.cover_name} ({currentTubeCoverObj.cover_weight}g)</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>

                                    <div style={formGroupStyle}>
                                        <label style={labelStyle}>Tube Cover Selection</label>
                                        <select
                                            value={editForm.tube_cover}
                                            onChange={(e) => {
                                                const selectedCoverId = e.target.value;
                                                const selectedCover = tubeCovers.find(tc => tc.tube_cover === selectedCoverId);
                                                let updates = { tube_cover: selectedCoverId };
                                                if (selectedCover) {
                                                    updates.total_cheeses = selectedCover.no_of_tubes || 0;
                                                    updates.no_of_covers = selectedCover.no_of_covers || 0;
                                                }
                                                setEditForm({ ...editForm, ...updates });
                                            }}
                                            style={{ ...selectStyle, padding: '0.5rem' }}
                                        >
                                            <option value="">Select Tube Cover</option>
                                            {tubeCovers.map(tc => (
                                                <option key={tc.tube_cover} value={tc.tube_cover}>{tc.tube_cover}</option>
                                            ))}
                                        </select>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                                            Current: {editForm.original_tube_cover || 'None'}
                                        </div>
                                    </div>

                                    {editForm.status !== 'Cheese Winding' && (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center', background: '#f8fafc', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <input
                                                        type="checkbox"
                                                        id="manual_tare"
                                                        checked={editForm.manual_tare}
                                                        onChange={(e) => setEditForm({ ...editForm, manual_tare: e.target.checked })}
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                    <label htmlFor="manual_tare" style={{ ...labelStyle, marginBottom: 0, fontWeight: 'normal', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                        Manual Tare
                                                    </label>
                                                </div>
                                                <div style={{ display: 'flex', gap: '1rem' }}>
                                                    <label style={{ ...labelStyle, marginBottom: 0, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                        <input type="checkbox" checked={editForm.repacking} onChange={(e) => setEditForm({ ...editForm, repacking: e.target.checked })} />
                                                        Repacking
                                                    </label>
                                                    <label style={{ ...labelStyle, marginBottom: 0, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                        <input type="checkbox" checked={editForm.bag} onChange={(e) => setEditForm({ ...editForm, bag: e.target.checked })} />
                                                        Bag
                                                    </label>
                                                </div>
                                            </div>
                                            <div>
                                                <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Tare Weight (kg)</label>
                                                <input
                                                    type="number"
                                                    step="0.001"
                                                    value={editForm.tare_weight === null || isNaN(editForm.tare_weight) ? '' : editForm.tare_weight}
                                                    onChange={(e) => setEditForm({ ...editForm, tare_weight: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                                                    style={{ ...inputStyle, padding: '0.4rem', background: editForm.manual_tare ? 'white' : '#f1f5f9', cursor: editForm.manual_tare ? 'text' : 'not-allowed' }}
                                                    required
                                                    disabled={!editForm.manual_tare}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'space-between', alignItems: 'flex-end' }}>
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
                                            disabled={isUpdating}
                                        >
                                            {isUpdating ? 'Updating...' : 'Update Details'}
                                        </button>
                                    </div>
                                </div>

                                <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setIsDetailModalOpen(true)}
                                        style={{ ...filterButtonStyle, background: '#3b82f6', color: 'white', width: '100%', padding: '0.8rem', fontSize: '0.95rem' }}
                                    >
                                        Edit Machine & Operator Details
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {isDetailModalOpen && (
                    <div style={modalOverlayStyle}>
                        <div style={{ ...modalContentStyle, width: '800px', maxWidth: '95vw', padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.8rem' }}>
                                <h3 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.2rem' }}>
                                    <span style={{ fontSize: '1.4rem' }}>⚙️</span> Machine Assignments: <span style={{ color: '#2563eb' }}>{editForm.bag_no}</span>
                                </h3>
                                <button onClick={() => setIsDetailModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold' }}>×</button>
                            </div>
                            
                            <div style={{ maxHeight: '65vh', overflowY: 'auto', padding: '0.2rem', marginBottom: '1rem' }}>
                                {editForm.details.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
                                        <p>No batches or groups defined for this bag yet.</p>
                                        <button onClick={handleAddDoffGroup} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+ Create First Group</button>
                                    </div>
                                )}
                                
                                {editForm.details.map((group, dIdx) => (
                                    <div key={dIdx} style={{ 
                                        marginBottom: '2rem', 
                                        background: 'white', 
                                        borderRadius: '12px', 
                                        border: '1px solid #e2e8f0',
                                        borderTop: '4px solid #3b82f6',
                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                                        overflow: 'hidden'
                                    }}>
                                <div style={{ 
                                            padding: '0.5rem 1rem', 
                                            background: '#f1f5f9', 
                                            borderBottom: '1px solid #e2e8f0',
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center'
                                        }}>
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700' }}>BATCH</span>
                                                    <div style={{ background: '#1e293b', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>{dIdx + 1}</div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.6rem' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <label style={{ fontSize: '0.6rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Doubler</label>
                                                        <input
                                                            type="text"
                                                            value={group.doubler_no}
                                                            onChange={(e) => {
                                                                const newDetails = [...editForm.details];
                                                                newDetails[dIdx].doubler_no = e.target.value;
                                                                setEditForm({ ...editForm, details: newDetails });
                                                            }}
                                                            placeholder="No"
                                                            style={{ border: 'none', background: 'white', borderBottom: '1px solid #cbd5e1', width: '70px', fontSize: '0.85rem', fontWeight: 'bold', color: '#1e293b', outline: 'none', padding: '1px 4px', borderRadius: '2px' }}
                                                        />
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <label style={{ fontSize: '0.55rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Doff</label>
                                                        <input
                                                            type="number"
                                                            value={group.doff_no}
                                                            onChange={(e) => {
                                                                const newDetails = [...editForm.details];
                                                                newDetails[dIdx].doff_no = parseInt(e.target.value) || 0;
                                                                setEditForm({ ...editForm, details: newDetails });
                                                            }}
                                                            style={{ border: 'none', background: 'white', borderBottom: '1px solid #cbd5e1', width: '45px', fontSize: '0.85rem', fontWeight: 'bold', color: '#1e293b', outline: 'none', padding: '1px 4px', borderRadius: '2px' }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveDoffGroup(dIdx)}
                                                style={{ 
                                                    background: 'none', color: '#ef4444', border: '1px solid #fee2e2', 
                                                    padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.7rem', fontWeight: '600',
                                                    display: 'flex', alignItems: 'center', gap: '0.2rem', borderRadius: '4px'
                                                }}
                                            >
                                                <span>🗑️</span> Remove batch
                                            </button>
                                        </div>

                                        <div style={{ padding: '0.6rem' }}>
                                            {group.machines.map((mach, mIdx) => (
                                                <div key={mIdx} style={{ 
                                                    display: 'grid', 
                                                    gridTemplateColumns: '1.4fr 1.1fr 50px 30px', 
                                                    gap: '0.4rem', 
                                                    marginBottom: '0.4rem',
                                                    alignItems: 'center',
                                                    background: '#f8fafc',
                                                    border: '1px solid #e2e8f0',
                                                    padding: '0.3rem 0.5rem',
                                                    borderRadius: '6px'
                                                }}>
                                                    <div style={{ position: 'relative' }}>
                                                        <span style={{ position: 'absolute', left: '0.4rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.6, fontSize: '0.75rem' }}>🧶</span>
                                                        <select
                                                            value={mach.machine_code}
                                                            onChange={(e) => {
                                                                const mCode = e.target.value;
                                                                const newDetails = [...editForm.details];
                                                                newDetails[dIdx].machines[mIdx].machine_code = mCode;
                                                                setEditForm({ ...editForm, details: newDetails });
                                                            }}
                                                            style={{ ...selectStyle, padding: '0.25rem 0.4rem 0.25rem 1.4rem', background: 'white', fontSize: '0.75rem', border: '1px solid #cbd5e1' }}
                                                        >
                                                            <option value="">Winder</option>
                                                            {machinesMaster.map(m => (
                                                                <option key={m.machine_code} value={m.machine_code}>{m.machine_name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div style={{ position: 'relative' }}>
                                                        <span style={{ position: 'absolute', left: '0.4rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.6, fontSize: '0.75rem' }}>👤</span>
                                                        <select
                                                            value={mach.operator_code}
                                                            onChange={(e) => {
                                                                const newDetails = [...editForm.details];
                                                                newDetails[dIdx].machines[mIdx].operator_code = e.target.value;
                                                                setEditForm({ ...editForm, details: newDetails });
                                                            }}
                                                            style={{ ...selectStyle, padding: '0.25rem 0.4rem 0.25rem 1.4rem', background: 'white', fontSize: '0.75rem', border: '1px solid #cbd5e1' }}
                                                        >
                                                            <option value="">Operator</option>
                                                            {operatorsMaster.map(op => (
                                                                <option key={op.operator_code} value={op.operator_code}>{op.operator_name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <input
                                                            type="number"
                                                            value={mach.machine_cheeses}
                                                            placeholder="Qty"
                                                            onChange={(e) => {
                                                                const newDetails = [...editForm.details];
                                                                newDetails[dIdx].machines[mIdx].machine_cheeses = e.target.value === '' ? 0 : parseInt(e.target.value);
                                                                setEditForm({ ...editForm, details: newDetails });
                                                            }}
                                                            style={{ ...inputStyle, padding: '0.25rem', background: 'white', fontSize: '0.75rem', textAlign: 'center', border: '1px solid #cbd5e1', width: '50px' }}
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveMachineFromGroup(dIdx, mIdx)}
                                                        style={{ 
                                                            background: 'none', color: '#94a3b8', border: 'none', 
                                                            fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                        }}
                                                        title="Remove assignment"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => handleAddMachineToGroup(dIdx)}
                                                style={{ 
                                                    marginTop: '0.2rem',
                                                    padding: '0.25rem 0.6rem',
                                                    background: '#eff6ff',
                                                    color: '#3b82f6',
                                                    border: '1px solid #dbeafe',
                                                    borderRadius: '4px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    width: '100%',
                                                    textAlign: 'center'
                                                }}
                                            >
                                                + Add Winder Assignment
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={handleAddDoffGroup}
                                    style={{ 
                                        width: '100%',
                                        padding: '0.8rem',
                                        background: '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '10px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <span>📥</span> Add New Doubler/Doff Group
                                </button>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                               <button
                                    type="button"
                                    onClick={() => setIsDetailModalOpen(false)}
                                    style={{ 
                                        background: '#2563eb', 
                                        color: 'white', 
                                        padding: '0.6rem 2rem', 
                                        borderRadius: '8px', 
                                        border: 'none', 
                                        fontWeight: 'bold', 
                                        cursor: 'pointer'
                                    }}
                                >
                                    Apply & Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {isReprintModalOpen && (
                    <div style={modalOverlayStyle}>
                        <div style={modalContentStyle}>
                            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                Reprint Bag Label
                            </h3>
                            <form onSubmit={handleReprintSubmit} style={formStyle}>
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>Select Completed Bag</label>
                                    <select
                                        value={selectedReprintBagId}
                                        onChange={(e) => setSelectedReprintBagId(e.target.value)}
                                        style={selectStyle}
                                        required
                                    >
                                        <option value="">-- Select Bag --</option>
                                        {sortedData
                                            .filter(bag => {
                                                const userLoc = user?.location_name || '';
                                                if (userLoc === 'All') return true;
                                                const mappedLoc = userLoc === 'Kaveripakkam' ? 'K' : (userLoc === 'Puducherry' ? 'P' : '');
                                                return bag.location_code === mappedLoc || bag.location_code === userLoc;
                                            })
                                            .map(bag => (
                                                <option key={bag.id} value={bag.id}>
                                                    {bag.bag_no} ({bag.display_size || bag.twine_size})
                                                </option>
                                            ))
                                        }
                                    </select>
                                </div>

                                <div style={{ ...formGroupStyle, marginTop: '0.5rem' }}>
                                    <label style={{ ...labelStyle, marginBottom: '0.5rem' }}>Labels to Print</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', fontSize: '0.95rem', color: '#334155' }}>
                                            <input
                                                type="checkbox"
                                                checked={brotherLabelNeeded}
                                                onChange={(e) => setBrotherLabelNeeded(e.target.checked)}
                                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                            />
                                            Brother Label (Final)
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', fontSize: '0.95rem', color: '#334155' }}>
                                            <input
                                                type="checkbox"
                                                checked={frontLabelNeeded}
                                                onChange={(e) => setFrontLabelNeeded(e.target.checked)}
                                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                            />
                                            Front Label (ZPL)
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', fontSize: '0.95rem', color: '#334155' }}>
                                            <input
                                                type="checkbox"
                                                checked={insideLabelNeeded}
                                                onChange={(e) => setInsideLabelNeeded(e.target.checked)}
                                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                            />
                                            Inside Label (ZPL)
                                        </label>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end', width: '100%' }}>
                                    <button
                                        type="button"
                                        onClick={handleResetBag}
                                        style={{ ...filterButtonStyle, background: '#ef4444', color: 'white', marginRight: 'auto' }}
                                        disabled={isPrinting || !selectedReprintBagId}
                                        title="Reset bag status to 'Cheese Ready' (only within 15 mins of weighing)"
                                    >
                                        Reset Bag
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsReprintModalOpen(false)}
                                        style={{ ...filterButtonStyle, background: '#f1f5f9', color: '#475569' }}
                                        disabled={isPrinting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        style={{ ...filterButtonStyle, background: '#059669', color: 'white' }}
                                        disabled={isPrinting || !selectedReprintBagId || (!brotherLabelNeeded && !frontLabelNeeded && !insideLabelNeeded)}
                                    >
                                        {isPrinting ? 'Processing...' : 'Print Bag Labels'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </>
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
const selectStyle = { padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' };
const tableContainerStyle = { overflowX: 'auto' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: '1rem' };
const thStyle = { padding: '1rem', background: '#f1f5f9', color: '#475569', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #e2e8f0', cursor: 'pointer', userSelect: 'none' };
const tdStyle = { padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#334155' };
const trStyle = { ':hover': { background: '#f8fafc' } };

// Modal Styles
const modalOverlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 1000
};
const modalContentStyle = {
    background: 'white', padding: '2rem', borderRadius: '12px', width: '500px',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
};
const formStyle = { display: 'flex', flexDirection: 'column', gap: '1rem' };
const formGroupStyle = { display: 'flex', flexDirection: 'column', gap: '0.4rem' };
const labelStyle = { fontSize: '0.9rem', fontWeight: '600', color: '#475569', marginBottom: '0.2rem' };
const inputStyle = { padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem' };
