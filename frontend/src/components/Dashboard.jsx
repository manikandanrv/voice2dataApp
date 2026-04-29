import React, { useState, useEffect } from 'react';

const initialWidgets = [
    { id: 'netting', title: "Today Netting Production", value: "0.00 KGS", color: "#d97706" }, // Amber
    { id: 'orders', title: "Pending Sales Orders", value: "0", color: "#dc2626" }, // Red
    { id: 'stock', title: "Active Stock Items", value: "0", color: "#16a34a" }, // Green
    { id: 'prod_tfw', title: "Today TFW Production", value: "0.000 KGS", color: "#2563eb" }, // Blue
    { id: 'prod_doubler', title: "Today Doubler Primary", value: "0.000 KGS", color: "#334155" }, // Slate
    { id: 'prod_cheese', title: "Today Cheese Production", value: "0.000 KGS", color: "#475569" }, // Slate
];

const DashboardWidget = ({ title, value, color }) => (
    <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        border: '1px solid #e2e8f0',
        borderTop: `4px solid ${color}`,
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '140px',
        transition: 'transform 0.2s',
        cursor: 'default'
    }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
        <h3 style={{
            fontSize: '0.875rem',
            color: '#64748b',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.5rem'
        }}>
            {title}
        </h3>
        <p style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#1e293b'
        }}>
            {value}
        </p>
    </div>
);

export default function Dashboard() {
    const [widgets, setWidgets] = useState(initialWidgets);
    const [loading, setLoading] = useState(true);

    const fetchMetrics = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/metrics`);
            if (response.ok) {
                const data = await response.json();

                setWidgets(prev => prev.map(w => {
                    if (w.id === 'netting') return { ...w, value: `${data.production_today_kg.toFixed(2)} KGS` };
                    if (w.id === 'orders') return { ...w, value: data.pending_orders.toString() };
                    if (w.id === 'stock') return { ...w, value: data.active_stock_items.toString() };
                    return w;
                }));
            }
        } catch (error) {
            console.error("Failed to fetch dashboard metrics", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
        // Optional: Poll every 30 seconds
        const interval = setInterval(fetchMetrics, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="container" style={{ maxWidth: '1400px', marginTop: '2rem' }}>
            <h2 className="page-title" style={{ border: 'none', marginBottom: '1rem' }}>Dashboard Overview</h2>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.5rem',
                paddingBottom: '2rem'
            }}>
                {widgets.map((w) => (
                    <DashboardWidget key={w.id} {...w} />
                ))}
            </div>
            {loading && <p style={{ textAlign: 'center', color: '#64748b' }}>Updating metrics...</p>}
        </div>
    );
}
