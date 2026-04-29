import { useState, useRef, useEffect } from 'react';

const API_BASE = `${import.meta.env.VITE_API_URL}/api/cheese-packing/capture-doubler-details`;

export default function CheesePackingDoubler() {
    // Helper to get current local date-time string for input type="datetime-local"
    const getCurrentDateTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    };

    const getMinDate = () => {
        const d = new Date();
        d.setDate(d.getDate() - 1); // Yesterday
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    };

    const [qrCode, setQrCode] = useState('');
    const [doublerDateTime, setDoublerDateTime] = useState(getCurrentDateTime());
    const [noOfBobbins, setNoOfBobbins] = useState('');
    const [actualWeight, setActualWeight] = useState('');

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const inputRef = useRef(null);

    // Auto-focus on mount
    useEffect(() => {
        if (inputRef.current) inputRef.current.focus();
    }, []);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        // Basic Validation
        if (!qrCode.trim()) return;
        if (!doublerDateTime) {
            setError("Please select a date and time.");
            return;
        }
        if (!noOfBobbins) {
            setError("Please enter No. of Bobbins.");
            return;
        }
        if (!actualWeight) {
            setError("Please enter Actual Weight.");
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const payload = {
                qr_code: qrCode.trim(),
                doubler_date_time: new Date(doublerDateTime).toISOString(),
                no_of_bobbins: Number(noOfBobbins),
                actual_weight: Number(actualWeight)
            };

            const res = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (res.ok) {
                setResult(data);
                setQrCode(''); // Clear QR to allow next scan
                // Keep other fields? Usually user might scan multiple doffs with same bobbins/weight?
                // Requirement doesn't specify. Keeping them is safer for batch work.
            } else {
                setError(data.detail || "Failed to capture details");
                setQrCode('');
            }
        } catch (err) {
            console.error(err);
            setError("Network Error: Could not connect to server.");
        } finally {
            setLoading(false);
            // Re-focus after processing
            if (inputRef.current) inputRef.current.focus();
        }
    };

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <h2 style={headerStyle}>Capture Doubler Details</h2>
                <p style={subHeaderStyle}>Enter details and scan QR Code</p>

                <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>

                    {/* Date Time Picker */}
                    <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
                        <label style={labelStyle}>Doff Date & Time</label>
                        <input
                            type="datetime-local"
                            value={doublerDateTime}
                            min={getMinDate()}
                            onChange={(e) => setDoublerDateTime(e.target.value)}
                            style={inputStyle}
                        />
                    </div>

                    <div style={gridStyle2}>
                        {/* No of Bobbins */}
                        <div style={{ textAlign: 'left' }}>
                            <label style={labelStyle}>No. of Bobbins</label>
                            <input
                                type="number"
                                value={noOfBobbins}
                                onChange={(e) => setNoOfBobbins(e.target.value)}
                                placeholder="0"
                                style={inputStyle}
                            />
                        </div>

                        {/* Actual Weight */}
                        <div style={{ textAlign: 'left' }}>
                            <label style={labelStyle}>Actual Weight (Kg)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={actualWeight}
                                onChange={(e) => setActualWeight(e.target.value)}
                                placeholder="0.00"
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    <div style={{ position: 'relative', marginTop: '1rem' }}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={qrCode}
                            onChange={(e) => setQrCode(e.target.value)}
                            placeholder="Scan QR here..."
                            style={{ ...inputStyle, borderColor: '#2563eb', borderStyle: 'dashed' }}
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            style={buttonStyle}
                        >
                            {loading ? 'Processing...' : 'Capture'}
                        </button>
                    </div>
                </form>

                {/* Status Messages */}
                {error && (
                    <div style={errorStyle}>
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {result && result.data && (
                    <div style={successCardStyle}>
                        <div style={checkIconStyle}>✓</div>
                        <h3 style={{ margin: '0 0 1rem 0', color: '#166534' }}>{result.message}</h3>

                        <div style={gridStyle}>
                            <div style={itemStyle}>
                                <label style={labelStyle}>Machine Type</label>
                                <div style={valueStyle}>{result.data.machine_type}</div>
                            </div>
                            <div style={itemStyle}>
                                <label style={labelStyle}>Table</label>
                                <div style={valueStyle}>{result.data.table}</div>
                            </div>
                            <div style={itemStyle}>
                                <label style={labelStyle}>ID</label>
                                <div style={valueStyle}>{result.data.id}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Premium Styles
const containerStyle = {
    minHeight: '80vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
    padding: '2rem'
};

const cardStyle = {
    background: 'white',
    padding: '3rem',
    borderRadius: '24px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    width: '100%',
    maxWidth: '600px',
    textAlign: 'center'
};

const headerStyle = {
    fontSize: '2rem',
    fontWeight: '800',
    background: '-webkit-linear-gradient(45deg, #2563eb, #4f46e5)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '0.5rem'
};

const subHeaderStyle = {
    color: '#64748b',
    marginBottom: '2rem'
};

const inputStyle = {
    width: '100%',
    padding: '1rem 1.5rem',
    fontSize: '1.2rem',
    borderRadius: '12px',
    border: '2px solid #e2e8f0',
    outline: 'none',
    transition: 'all 0.2s',
    backgroundColor: '#f8fafc',
    marginBottom: '0.5rem',
    boxSizing: 'border-box'
};

const buttonStyle = {
    width: '100%',
    padding: '1rem',
    fontSize: '1.1rem',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#2563eb',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'background 0.2s',
    boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
    marginTop: '1rem'
};

const errorStyle = {
    padding: '1rem',
    backgroundColor: '#fef2f2',
    color: '#ef4444',
    borderRadius: '12px',
    border: '1px solid #fee2e2',
    marginTop: '1rem',
    textAlign: 'left'
};

const successCardStyle = {
    marginTop: '2rem',
    padding: '2rem',
    backgroundColor: '#f0fdf4',
    borderRadius: '16px',
    border: '1px solid #dcfce7',
    animation: 'fadeIn 0.5s ease-out'
};

const checkIconStyle = {
    width: '50px',
    height: '50px',
    backgroundColor: '#dcfce7',
    color: '#166534',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    margin: '0 auto 1rem auto'
};

const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
    marginTop: '1.5rem'
};

const gridStyle2 = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginBottom: '1rem'
};

const itemStyle = {
    backgroundColor: 'white',
    padding: '1rem',
    borderRadius: '8px',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
};

const labelStyle = {
    display: 'block',
    fontSize: '0.85rem',
    color: '#64748b',
    marginBottom: '0.25rem',
    fontWeight: '500'
};

const valueStyle = {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1e293b'
};
