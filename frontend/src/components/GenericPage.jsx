import { useParams } from 'react-router-dom';

export default function GenericPage() {
    const { moduleName } = useParams();

    return (
        <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
            <h1 style={{ color: '#556b2f' }}>{moduleName ? moduleName.replace(/-/g, ' ').toUpperCase() : 'MODULE'}</h1>
            <div style={{
                background: '#f8f9fa',
                border: '1px solid #dee2e6',
                padding: '3rem',
                borderRadius: '8px',
                marginTop: '1rem'
            }}>
                <h3>🚧 Under Construction</h3>
                <p>This screen is currently being developed.</p>
                <div style={{ marginTop: '2rem', fontSize: '3rem' }}>
                    🛠️
                </div>
            </div>
        </div>
    );
}
