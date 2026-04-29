import { useState } from 'react';

const API_BASE = `${import.meta.env.VITE_API_URL}/api/cheese-packing/get-cheese-bag-details`;

export default function CheesePackingDetails() {
    const [bagNo, setBagNo] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError('');

        // Mock Implementation for visual verification until API is fully ready
        // Real implementation would fetch from API_BASE

        setTimeout(() => {
            // Mock Response
            setResult({
                bag_no: bagNo || "6HN3A-Jan-42",
                twine_size: "6HN3A",
                cheeses: 66,
                weight: 50.5,
                doubler_details: [
                    { doubler: "D1", doff: 10 },
                    { doubler: "D2", doff: 12 }
                ]
            });
            setLoading(false);
        }, 1000);
    };

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <h2 style={headerStyle}>Cheese Bag Details</h2>
                <p style={subHeaderStyle}>Scan Bag QR to view details</p>

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={bagNo}
                        onChange={(e) => setBagNo(e.target.value)}
                        placeholder="Scan Bag No..."
                        style={inputStyle}
                        disabled={loading}
                    />
                    <button type="submit" style={buttonStyle} disabled={loading}>
                        {loading ? 'Fetching...' : 'Get Details'}
                    </button>
                </form>

                {result && (
                    <div style={{ marginTop: '2rem', textAlign: 'left' }}>
                        <div style={detailRowStyle}>
                            <span>Bag No:</span>
                            <strong>{result.bag_no}</strong>
                        </div>
                        <div style={detailRowStyle}>
                            <span>Twine Size:</span>
                            <strong>{result.twine_size}</strong>
                        </div>
                        <div style={detailRowStyle}>
                            <span>Cheeses:</span>
                            <strong>{result.cheeses}</strong>
                        </div>
                        <div style={detailRowStyle}>
                            <span>Weight:</span>
                            <strong>
                                {result.weight < 1
                                    ? `${Math.round(result.weight * 1000)} g`
                                    : `${result.weight} kg`
                                }
                            </strong>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Reuse styles or import from shared
const containerStyle = { minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8fafc', padding: '2rem' };
const cardStyle = { background: 'white', padding: '3rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '500px', textAlign: 'center' };
const headerStyle = { fontSize: '1.8rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.5rem' };
const subHeaderStyle = { color: '#64748b', marginBottom: '2rem' };
const inputStyle = { width: '100%', padding: '0.8rem', fontSize: '1.1rem', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '1rem' };
const buttonStyle = { width: '100%', padding: '0.8rem', fontSize: '1rem', fontWeight: 'bold', color: 'white', backgroundColor: '#3b82f6', border: 'none', borderRadius: '8px', cursor: 'pointer' };
const detailRowStyle = { display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid #f1f5f9', color: '#334155' };
