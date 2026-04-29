import React, { useState, useEffect, useCallback } from 'react';
import Plot from 'react-plotly.js';
import {
    BarChart3,
    TrendingUp,
    Users,
    Package,
    Filter,
    RefreshCcw,
    X,
    ChevronRight,
    Maximize2,
    Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './ManagementDashboard.css';

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

const ManagementDashboard = () => {
    // Filters
    const [machineType, setMachineType] = useState('Cheese Winding');
    const [granularity, setGranularity] = useState('hourly');
    const [dateRange, setDateRange] = useState({
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    // Data State
    const [chartData, setChartData] = useState([]);
    const [breakdownData, setBreakdownData] = useState([]);
    const [kpiData, setKpiData] = useState({ total_today: 0, active_operators: 0, unit: 'kg' });
    const [activities, setActivities] = useState([]);
    const [breakdownType, setBreakdownType] = useState('machine');
    const [trendGroupBy, setTrendGroupBy] = useState('machine');
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    // Chart Visibility Logic
    const [traceVisibility, setTraceVisibility] = useState({}); // { traceName: true/false }

    // Drill-down State
    const [drillDownModal, setDrillDownModal] = useState({
        isOpen: false,
        period: null,
        machineName: null,
        data: [],
        loading: false
    });
    const [maximizedChart, setMaximizedChart] = useState(null); // 'line' or 'bar'

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [lineRes, breakdownRes, kpiRes, activityRes] = await Promise.all([
                fetch(`${API_BASE}/dashboard/production-line-data?machine_type=${machineType}&granularity=${granularity}&start_date=${dateRange.start}&end_date=${dateRange.end}&group_by_field=${trendGroupBy}`),
                fetch(`${API_BASE}/dashboard/breakdown-metrics?machine_type=${machineType}&breakdown_by=${breakdownType}&start_date=${dateRange.start}&end_date=${dateRange.end}`),
                fetch(`${API_BASE}/dashboard/kpi-summary?machine_type=${machineType}`),
                fetch(`${API_BASE}/dashboard/activity-stream?machine_type=${machineType}`)
            ]);

            if (lineRes.ok && breakdownRes.ok && kpiRes.ok && activityRes.ok) {
                const line = await lineRes.json();
                const breakdown = await breakdownRes.json();
                const kpis = await kpiRes.json();
                const activeStream = await activityRes.json();

                setChartData(line);
                setBreakdownData(breakdown);
                setKpiData(kpis);
                setActivities(activeStream);
                setLastUpdated(new Date());

                // Initialize visibility for new traces
                setTraceVisibility(prev => {
                    const next = { ...prev };
                    line.forEach(trace => {
                        if (next[trace.name] === undefined) next[trace.name] = true;
                    });
                    return next;
                });
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    }, [machineType, granularity, dateRange, breakdownType, trendGroupBy]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000); // Poll every 60s
        return () => clearInterval(interval);
    }, [fetchData]);

    const handleChartClick = async (event) => {
        if (!event.points || event.points.length === 0) return;

        const point = event.points[0];
        const period = point.x;
        const machineName = point.data.name;

        setDrillDownModal({
            isOpen: true,
            period,
            machineName,
            data: [],
            loading: true
        });

        try {
            const res = await fetch(`${API_BASE}/dashboard/production-details?machine_type=${machineType}&period=${period}&granularity=${granularity}&machine_name=${machineName}`);
            if (res.ok) {
                const data = await res.json();
                setDrillDownModal(prev => ({ ...prev, data, loading: false }));
            }
        } catch (error) {
            console.error("Error fetching drill-down details:", error);
            setDrillDownModal(prev => ({ ...prev, loading: false }));
        }
    };

    const toggleAllTraces = (visible) => {
        setTraceVisibility(prev => {
            const next = { ...prev };
            chartData.forEach(trace => {
                next[trace.name] = visible;
            });
            return next;
        });
    };

    const machineTypes = [
        "Cheese Winding", "Cheese Bagging", "TFO Winder", "TFO Primary",
        "TFO Secondary", "Doubler Primary", "Doubler Secondary", "Netting"
    ];

    const breakdownOptions = machineType === 'Cheese Bagging'
        ? ['machine', 'operator', 'location', 'size', 'doubler_doff']
        : ['machine', 'operator', 'yarn_code'];

    // Map internal types to display labels
    const displayLabels = {
        machine: 'Machine',
        operator: 'Operator',
        yarn_code: 'Yarn Code',
        location: 'Location',
        size: 'Size',
        doubler_doff: 'DoublerDoff'
    };

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">Management Dashboard</h1>
                    <p className="dashboard-subtitle">
                        <TrendingUp size={16} color="#6366f1" />
                        Live production insights • Last updated: {lastUpdated.toLocaleTimeString()}
                    </p>
                </div>

                <div className="dashboard-actions">
                    <button
                        onClick={fetchData}
                        className="icon-button"
                        title="Refresh Data"
                    >
                        <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            <div className="dashboard-grid">
                {/* Sidebar Filters */}
                <div className="sidebar-filters">
                    <div className="filter-card">
                        <h3 className="filter-label">
                            <Filter size={14} style={{ marginRight: '4px' }} /> Filters
                        </h3>

                        <div className="filter-group">
                            <label className="filter-label">Production Line</label>
                            <select
                                value={machineType}
                                onChange={(e) => {
                                    setMachineType(e.target.value);
                                    // Reset groupings when line changes
                                    setBreakdownType('machine');
                                    setTrendGroupBy('machine');
                                }}
                                className="filter-select"
                            >
                                {machineTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label className="filter-label">Trend Grouping</label>
                            <select
                                value={trendGroupBy}
                                onChange={(e) => setTrendGroupBy(e.target.value)}
                                className="filter-select"
                                style={{ height: '32px', fontSize: '13px' }}
                            >
                                {breakdownOptions.map(opt => (
                                    <option key={opt} value={opt}>{displayLabels[opt] || opt}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label className="filter-label">Time Granularity</label>
                            <div className="granularity-tabs">
                                {['hourly', 'daily'].map(g => (
                                    <button
                                        key={g}
                                        onClick={() => setGranularity(g)}
                                        className={`tab-button ${granularity === g ? 'active' : ''}`}
                                    >
                                        {g.charAt(0).toUpperCase() + g.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="filter-group">
                            <label className="filter-label">Start Date</label>
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                className="filter-input"
                            />
                        </div>

                        <div className="filter-group">
                            <label className="filter-label">End Date</label>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                className="filter-input"
                            />
                        </div>
                    </div>

                    {/* Quick Metrics */}
                    <div className="kpi-grid">
                        <motion.div whileHover={{ y: -4 }} className="kpi-card primary">
                            <div className="kpi-header">
                                <Package size={24} />
                                <span className="kpi-tag">Today</span>
                            </div>
                            <h4 className="kpi-value">{kpiData.total_today.toLocaleString()} {kpiData.unit}</h4>
                            <p className="kpi-label">Volume Across Selected Line</p>
                        </motion.div>

                        <motion.div whileHover={{ y: -4 }} className="kpi-card secondary">
                            <div className="kpi-header">
                                <Users color="#10b981" size={24} />
                                <span className="kpi-tag">Active</span>
                            </div>
                            <h4 className="kpi-value">{kpiData.active_operators}</h4>
                            <p className="kpi-label">Current Scale Operators</p>
                        </motion.div>
                    </div>
                </div>

                {/* Main Charts */}
                <div className="main-content">
                    <div className="chart-container">
                        <div className="chart-header">
                            <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', width: '100%' }}>
                                <TrendingUp size={20} color="#6366f1" />
                                <span>Performance: Grouped by {displayLabels[trendGroupBy]}</span>
                                <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
                                    <button
                                        onClick={() => toggleAllTraces(true)}
                                        style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}
                                    >
                                        Select All
                                    </button>
                                    <button
                                        onClick={() => toggleAllTraces(false)}
                                        style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}
                                    >
                                        Deselect All
                                    </button>
                                </div>
                            </h3>
                            <div className="chart-header-actions">
                                <div className="chart-hint">Click points to drill down</div>
                                <button
                                    onClick={() => setMaximizedChart('line')}
                                    className="icon-button"
                                    title="Maximize Chart"
                                >
                                    <Maximize2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div style={{ height: '450px' }}>
                            {loading ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', height: '100%', width: '100%' }}>
                                    <RefreshCcw size={32} className="animate-spin" color="#e2e8f0" style={{ margin: 'auto' }} />
                                </div>
                            ) : (
                                <Plot
                                    data={chartData.map(trace => ({
                                        ...trace,
                                        type: 'scatter',
                                        mode: 'lines+markers',
                                        visible: traceVisibility[trace.name] === false ? 'legendonly' : true,
                                        line: { width: 3 },
                                        marker: { size: 8 }
                                    }))}
                                    layout={{
                                        autosize: true,
                                        margin: { t: 10, r: 10, b: 40, l: 50 },
                                        hovermode: 'closest',
                                        showlegend: true,
                                        legend: { orientation: 'h', y: -0.2 },
                                        xaxis: {
                                            gridcolor: '#f3f4f6',
                                            zeroline: false,
                                            tickfont: { size: 10, color: '#9ca3af' }
                                        },
                                        yaxis: {
                                            gridcolor: '#f3f4f6',
                                            zeroline: false,
                                            tickfont: { size: 10, color: '#9ca3af' },
                                            title: 'N. Wt. (kg)'
                                        },
                                        paper_bgcolor: 'rgba(0,0,0,0)',
                                        plot_bgcolor: 'rgba(0,0,0,0)',
                                    }}
                                    config={{ responsive: true, displayModeBar: false }}
                                    onLegendClick={(data) => {
                                        const name = data.data[data.curveNumber].name;
                                        setTraceVisibility(prev => ({
                                            ...prev,
                                            [name]: !prev[name]
                                        }));
                                        return false; // Prevent Plotly's default legend toggle
                                    }}
                                    onClick={handleChartClick}
                                    style={{ width: "100%", height: "100%" }}
                                />
                            )}
                        </div>
                    </div>

                    <div className="secondary-grid">
                        <div className="filter-card">
                            <div className="chart-header">
                                <h3 className="chart-title">
                                    <BarChart3 size={20} color="#6366f1" />
                                    N. Wt. Breakdown
                                </h3>
                                <div className="chart-header-actions">
                                    {/* <div className="granularity-tabs" style={{ width: 'auto' }}> */}
                                    <div className="granularity-tabs" style={{ width: 'auto', flexWrap: 'wrap' }}>
                                        {breakdownOptions.map(t => (
                                            // {['machine', 'operator', 'yarn_code'].map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setBreakdownType(t)}
                                                className={`tab-button ${breakdownType === t ? 'active' : ''}`}
                                                style={{ padding: '0.25rem 0.5rem', fontSize: '11px' }}
                                            >
                                                {displayLabels[t] || t}
                                                {/* {t.charAt(0).toUpperCase()} */}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setMaximizedChart('bar')}
                                        className="icon-button"
                                        title="Maximize Chart"
                                    >
                                        <Maximize2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div style={{ height: '250px' }}>
                                <Plot
                                    data={[{
                                        type: 'bar',
                                        x: breakdownData.map(d => d.label),
                                        y: breakdownData.map(d => d.value),
                                        marker: { color: '#6366f1' }
                                    }]}
                                    layout={{
                                        autosize: true,
                                        margin: { t: 0, r: 0, b: 40, l: 40 },
                                        xaxis: { tickfont: { size: 9 }, tickangle: -45 },
                                        yaxis: { gridcolor: '#f3f4f6' },
                                        paper_bgcolor: 'rgba(0,0,0,0)',
                                        plot_bgcolor: 'rgba(0,0,0,0)',
                                    }}
                                    config={{ responsive: true, displayModeBar: false }}
                                    style={{ width: "100%", height: "100%" }}
                                />
                            </div>
                        </div>

                        <div className="filter-card">
                            <h3 className="chart-title" style={{ marginBottom: '1rem' }}>Real-time Activity Stream</h3>
                            <div className="activity-stream">
                                {activities.length === 0 ? (
                                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', padding: '1rem', textAlign: 'center' }}>No recent activity</p>
                                ) : activities.map((act) => (
                                    <div key={act.id} className="activity-item">
                                        <div className="activity-icon">
                                            {act.type}
                                        </div>
                                        <div className="activity-details">
                                            <p className="activity-title">{act.title}</p>
                                            <p className="activity-meta">{act.meta} • {act.timestamp ? new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</p>
                                        </div>
                                        <ChevronRight size={14} color="#e2e8f0" style={{ marginLeft: 'auto' }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Drill-down Modal */}
            <AnimatePresence>
                {drillDownModal.isOpen && (
                    <div className="modal-overlay">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDrillDownModal(prev => ({ ...prev, isOpen: false }))}
                            style={{ position: 'absolute', inset: 0 }}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="modal-content"
                        >
                            <div className="modal-header">
                                <div className="modal-title">
                                    <h2>N. Wt. Drill-down</h2>
                                    <p className="modal-subtitle">
                                        {drillDownModal.machineName} • {new Date(drillDownModal.period).toLocaleString()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setDrillDownModal(prev => ({ ...prev, isOpen: false }))}
                                    className="icon-button"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="modal-body">
                                {drillDownModal.loading ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0', gap: '1rem' }}>
                                        <RefreshCcw size={40} className="animate-spin" color="#6366f1" />
                                        <p style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: '700' }}>Fetching detailed records...</p>
                                    </div>
                                ) : (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table className="detail-table">
                                            <thead>
                                                <tr>
                                                    <th>Time</th>
                                                    <th>Machine</th>
                                                    <th>Operator</th>
                                                    <th>Yarn Code</th>
                                                    <th className="text-right">N. Wt. (kg)</th>
                                                    <th>Details</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {drillDownModal.data.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No records found for this period.</td>
                                                    </tr>
                                                ) : drillDownModal.data.map((row, idx) => (
                                                    <tr key={idx}>
                                                        <td>{new Date(row.entry_date || row.weighed_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                                        <td style={{ fontWeight: '700' }}>{row.machine_name || row.location_code}</td>
                                                        <td>{row.operator_name || row.yarn_operator || "N/A"}</td>
                                                        <td><span className="font-mono-tag">{row.code || row.yarn_display_code}</span></td>
                                                        <td className="text-right font-black weight-highlight">{row.actual_weight || row.net_weight}</td>
                                                        <td style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Bag: {row.bag_no || row.bag_number || "N/A"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer">
                                <button
                                    onClick={() => setDrillDownModal(prev => ({ ...prev, isOpen: false }))}
                                    className="close-btn"
                                >
                                    Close Details
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Maximized Chart Modal */}
            <AnimatePresence>
                {maximizedChart && (
                    <div className="modal-overlay chart-maximized">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMaximizedChart(null)}
                            style={{ position: 'absolute', inset: 0 }}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="modal-content maximized-modal"
                        >
                            <div className="modal-header">
                                <div className="modal-title">
                                    <h2>
                                        {maximizedChart === 'line' ? 'Production Performance Over Time' : 'Production Breakdown'}
                                    </h2>
                                    <p className="modal-subtitle">
                                        Line: {machineType} • {granularity === 'hourly' ? 'Hourly View' : 'Daily View'}
                                    </p>
                                    {maximizedChart === 'line' && (
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                            <button
                                                onClick={() => toggleAllTraces(true)}
                                                className="tab-button"
                                                style={{ fontSize: '11px', padding: '4px 8px' }}
                                            >
                                                Select All
                                            </button>
                                            <button
                                                onClick={() => toggleAllTraces(false)}
                                                className="tab-button"
                                                style={{ fontSize: '11px', padding: '4px 8px' }}
                                            >
                                                Deselect All
                                            </button>
                                        </div>
                                    )}
                                    {maximizedChart === 'bar' && (
                                        <div className="granularity-tabs" style={{ width: 'auto', flexWrap: 'wrap', marginTop: '8px' }}>
                                            {breakdownOptions.map(t => (
                                                <button
                                                    key={t}
                                                    onClick={() => setBreakdownType(t)}
                                                    className={`tab-button ${breakdownType === t ? 'active' : ''}`}
                                                    style={{ padding: '0.25rem 0.5rem', fontSize: '11px' }}
                                                >
                                                    {displayLabels[t] || t}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => setMaximizedChart(null)}
                                    className="icon-button"
                                    title="Minimize"
                                >
                                    <Minimize2 size={24} />
                                </button>
                            </div>

                            <div className="modal-body maximized-chart-body">
                                {maximizedChart === 'line' ? (
                                    <Plot
                                        data={chartData.map(trace => ({
                                            ...trace,
                                            type: 'scatter',
                                            mode: 'lines+markers',
                                            visible: traceVisibility[trace.name] === false ? 'legendonly' : true,
                                            line: { width: 4 },
                                            marker: { size: 10 }
                                        }))}
                                        layout={{
                                            autosize: true,
                                            margin: { t: 20, r: 20, b: 60, l: 60 },
                                            hovermode: 'closest',
                                            showlegend: true,
                                            legend: { orientation: 'h', y: -0.15 },
                                            xaxis: {
                                                gridcolor: '#f3f4f6',
                                                zeroline: false,
                                                tickfont: { size: 12, color: '#64748b' }
                                            },
                                            yaxis: {
                                                gridcolor: '#f3f4f6',
                                                zeroline: false,
                                                tickfont: { size: 12, color: '#64748b' },
                                                title: 'Production (kg)',
                                                titlefont: { size: 14, color: '#64748b' }
                                            },
                                            paper_bgcolor: 'rgba(0,0,0,0)',
                                            plot_bgcolor: 'rgba(0,0,0,0)',
                                        }}
                                        config={{ responsive: true, displayModeBar: true }}
                                        onLegendClick={(data) => {
                                            const name = data.data[data.curveNumber].name;
                                            setTraceVisibility(prev => ({
                                                ...prev,
                                                [name]: !prev[name]
                                            }));
                                            return false;
                                        }}
                                        onClick={handleChartClick}
                                        style={{ width: "100%", height: "100%" }}
                                    />
                                ) : (
                                    <Plot
                                        data={[{
                                            type: 'bar',
                                            x: breakdownData.map(d => d.label),
                                            y: breakdownData.map(d => d.value),
                                            marker: { color: '#6366f1' }
                                        }]}
                                        layout={{
                                            autosize: true,
                                            margin: { t: 20, r: 20, b: 100, l: 60 },
                                            xaxis: {
                                                tickfont: { size: 11, color: '#64748b' },
                                                tickangle: -45
                                            },
                                            yaxis: {
                                                gridcolor: '#f3f4f6',
                                                title: 'Quantity (kg)',
                                                titlefont: { size: 14, color: '#64748b' }
                                            },
                                            paper_bgcolor: 'rgba(0,0,0,0)',
                                            plot_bgcolor: 'rgba(0,0,0,0)',
                                        }}
                                        config={{ responsive: true, displayModeBar: true }}
                                        style={{ width: "100%", height: "100%" }}
                                    />
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ManagementDashboard;
