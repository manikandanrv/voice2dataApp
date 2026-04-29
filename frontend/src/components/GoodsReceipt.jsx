import { useState, useEffect } from 'react';

const API_BASE = `${import.meta.env.VITE_API_URL}/api/grn`;
const GATE_ENTRY_API = `${import.meta.env.VITE_API_URL}/api/gate-entry`;
const SUPPLIER_API = `${import.meta.env.VITE_API_URL}/api/master/suppliers/`;

export default function GoodsReceipt() {
    // Mode: 'list' or 'form'
    const [view, setView] = useState('list');

    // Master Data
    const [gateEntries, setGateEntries] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    // List State
    const [listData, setListData] = useState([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [latestId, setLatestId] = useState(0);
    const [showNotification, setShowNotification] = useState(false);

    // Form State
    const initialFormState = {
        grn_no: '',
        grn_date: new Date().toISOString().split('T')[0],
        supplier_name: '',
        supplier_reference: '',
        dc_invoice_no: '',
        invoice_date: new Date().toISOString().split('T')[0],
        gate_entry_id: '',
        order_reference_no: '',
        grn_receipt_date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        remarks: '',
        items: []
    };
    const [formData, setFormData] = useState(initialFormState);

    // Initial Load
    useEffect(() => {
        fetchList();
        fetchMasters();
    }, []);

    // Fetch List with Search/Pagination
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchList();
        }, 300);
        return () => clearTimeout(timer);
    }, [page, pageSize, searchQuery]);

    const fetchList = async () => {
        try {
            const skip = (page - 1) * pageSize;
            const params = new URLSearchParams({
                skip,
                limit: pageSize,
                ...(searchQuery && { search: searchQuery })
            });
            const res = await fetch(`${API_BASE}/?${params}`);
            const data = await res.json();
            setListData(data.items || []);
            setTotalPages(data.pages || 0);

            // Update latestId if on first page and polling hasn't found newer yet
            if (page === 1 && !searchQuery && data.items && data.items.length > 0) {
                // Assuming list returns newest first
                const currentMax = Math.max(...data.items.map(i => i.id));
                if (currentMax > latestId && !showNotification) {
                    setLatestId(currentMax);
                }
            }
        } catch (err) {
            console.error("Error fetching GRN list:", err);
        }
    };

    const checkForUpdates = async () => {
        try {
            // Fetch top 1 item to check ID
            const res = await fetch(`${API_BASE}/?limit=1`);
            const data = await res.json();
            if (data.items && data.items.length > 0) {
                const newestId = data.items[0].id;
                if (newestId > latestId && latestId > 0) {
                    setShowNotification(true);
                }
            }
        } catch (err) {
            console.error("Error checking for updates:", err);
        }
    };

    const handleRefresh = () => {
        setShowNotification(false);
        setPage(1);
        fetchList();
    };

    // Polling Effect
    useEffect(() => {
        const interval = setInterval(() => {
            // Only poll if not currently showing notification and no search active
            if (!showNotification && !searchQuery) {
                checkForUpdates();
            }
        }, 10000); // Poll every 10 seconds

        return () => clearInterval(interval);
    }, [latestId, showNotification, searchQuery]);

    const fetchMasters = async () => {
        try {
            // Gate Entries (Get all for now, or searchable in real app)
            // Fetching only recent 50 for dropdown to check
            const geRes = await fetch(`${GATE_ENTRY_API}/?limit=50`);
            const geData = await geRes.json();
            setGateEntries(geData.items || []);

            // Suppliers
            const supRes = await fetch(SUPPLIER_API);
            const supData = await supRes.json();
            setSuppliers(supData.items?.map(s => s.supplier_full_name || s.supplier_name) || []);
        } catch (err) {
            console.error("Error fetching masters:", err);
        }
    };

    const handleGateEntrySelect = (e) => {
        const selectedId = e.target.value;
        const entry = gateEntries.find(ge => ge.id == selectedId);

        setFormData(prev => ({
            ...prev,
            gate_entry_id: selectedId,
            // Auto-fill from Gate Entry
            supplier_name: entry ? entry.supplier_customer : prev.supplier_name,
            dc_invoice_no: entry ? entry.bill_dc_da_no : prev.dc_invoice_no,
            invoice_date: entry && entry.bill_date ? entry.bill_date : prev.invoice_date,
            remarks: entry ? `Ref Gate Entry ID: ${entry.id}, Vehicle: ${entry.vehicle_no}` : prev.remarks
        }));
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Item Management
    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [
                ...prev.items,
                {
                    s_no: prev.items.length + 1,
                    description: '',
                    uom: '',
                    quantity_received: 0,
                    po_quantity: 0,
                    excess_quantity: 0,
                    lot_size: 0,
                    spec: '',
                    actual: '',
                    item_status: 'OK',
                    remarks: ''
                }
            ]
        }));
    };

    const removeItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleItemChange = (index, field, value) => {
        setFormData(prev => {
            const newItems = [...prev.items];
            newItems[index] = { ...newItems[index], [field]: value };

            // Auto-calc Excess
            if (field === 'quantity_received' || field === 'po_quantity') {
                const qty = parseFloat(newItems[index].quantity_received) || 0;
                const po = parseFloat(newItems[index].po_quantity) || 0;
                newItems[index].excess_quantity = (qty > po) ? (qty - po) : 0;
            }
            return { ...prev, items: newItems };
        });
    };

    const handleSubmit = async () => {
        if (!formData.supplier_name) {
            alert("Supplier Name is mandatory.");
            return;
        }

        try {
            const method = formData.id ? 'PUT' : 'POST';
            const url = formData.id ? `${API_BASE}/${formData.id}` : API_BASE;

            const payload = {
                ...formData,
                gate_entry_id: formData.gate_entry_id ? parseInt(formData.gate_entry_id) : null
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("GRN Saved Successfully!");
                setView('list');
                fetchList();
                setFormData(initialFormState);
            } else {
                const err = await res.json();
                alert(`Error: ${JSON.stringify(err.detail || err)}`);
            }
        } catch (error) {
            console.error("Save error:", error);
            alert("Failed to save GRN.");
        }
    };

    const [expandedRows, setExpandedRows] = useState({});

    const toggleRow = (id) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="container" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="title" style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1e293b' }}>Goods Receipt Note (GRN)</h2>
                {view === 'list' ? (
                    <button onClick={() => { setFormData(initialFormState); setView('form'); }} style={btnStyle}>+ New GRN</button>
                ) : (
                    <button onClick={() => setView('list')} style={{ ...btnStyle, backgroundColor: '#64748b' }}>Back to List</button>
                )}
            </div>

            {view === 'list' ? (
                // LIST VIEW
                <div>
                    <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <input
                            type="text"
                            placeholder="Search GRN, Supplier..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={inputStyle}
                        />
                        {showNotification && (
                            <div style={{ marginLeft: 'auto', background: '#dbeafe', color: '#1e40af', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                <span>🔔 New GRN entries available!</span>
                                <button onClick={handleRefresh} style={{ border: 'none', background: '#2563eb', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '12px', cursor: 'pointer', fontSize: '0.8rem' }}>Refresh</button>
                            </div>
                        )}
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <thead style={{ background: '#f1f5f9' }}>
                            <tr>
                                <th style={{ ...thStyle, width: '40px' }}></th>
                                <th style={thStyle}>GRN No</th>
                                <th style={thStyle}>Date</th>
                                <th style={thStyle}>Supplier</th>
                                <th style={thStyle}>Invoice No</th>
                                <th style={thStyle}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listData.map(item => (
                                <>
                                    <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', background: expandedRows[item.id] ? '#f8fafc' : 'white' }}>
                                        <td style={tdStyle}>
                                            <button
                                                onClick={() => toggleRow(item.id)}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#64748b' }}
                                            >
                                                {expandedRows[item.id] ? '▼' : '▶'}
                                            </button>
                                        </td>
                                        <td style={tdStyle}>{item.grn_no}</td>
                                        <td style={tdStyle}>{item.grn_date}</td>
                                        <td style={tdStyle}>{item.supplier_name}</td>
                                        <td style={tdStyle}>{item.dc_invoice_no}</td>
                                        <td style={tdStyle}>
                                            <span style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '4px',
                                                fontSize: '0.85rem',
                                                background: item.status === 'OK' ? '#dcfce7' : '#fee2e2',
                                                color: item.status === 'OK' ? '#166534' : '#991b1b'
                                            }}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                    {expandedRows[item.id] && (
                                        <tr>
                                            <td colSpan="6" style={{ padding: '1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                                <div style={{ marginLeft: '40px' }}>
                                                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#475569', fontSize: '0.9rem' }}>Items:</h4>
                                                    <table style={{ width: '100%', border: '1px solid #e2e8f0', fontSize: '0.85rem', background: 'white' }}>
                                                        <thead style={{ background: '#f1f5f9' }}>
                                                            <tr>
                                                                <th style={itemThStyle}>S.No</th>
                                                                <th style={itemThStyle}>Description</th>
                                                                <th style={itemThStyle}>UOM</th>
                                                                <th style={itemThStyle}>Rec Qty</th>
                                                                <th style={itemThStyle}>PO Qty</th>
                                                                <th style={itemThStyle}>Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {item.items && item.items.map((subItem, idx) => (
                                                                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                                                    <td style={itemTdStyle}>{subItem.s_no}</td>
                                                                    <td style={itemTdStyle}>{subItem.description}</td>
                                                                    <td style={itemTdStyle}>{subItem.uom}</td>
                                                                    <td style={itemTdStyle}>{subItem.quantity_received}</td>
                                                                    <td style={itemTdStyle}>{subItem.po_quantity}</td>
                                                                    <td style={itemTdStyle}>{subItem.item_status}</td>
                                                                </tr>
                                                            ))}
                                                            {(!item.items || item.items.length === 0) && <tr><td colSpan="6" style={{ padding: '0.5rem', textAlign: 'center', color: '#94a3b8' }}>No items</td></tr>}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                            {listData.length === 0 && <tr><td colSpan="6" style={{ padding: '1rem', textAlign: 'center' }}>No records found</td></tr>}
                        </tbody>
                    </table>
                </div>
            ) : (
                // FORM VIEW
                <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    {/* Header Fields */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div>
                            <label style={labelStyle}>GRN No (Auto)</label>
                            <input type="text" name="grn_no" value={formData.grn_no} placeholder="Auto-generated" disabled style={{ ...inputStyle, backgroundColor: '#f1f5f9' }} />
                        </div>
                        <div>
                            <label style={labelStyle}>GRN Date *</label>
                            <input type="date" name="grn_date" value={formData.grn_date} onChange={handleFormChange} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Link Gate Entry</label>
                            <select name="gate_entry_id" value={formData.gate_entry_id} onChange={handleGateEntrySelect} style={inputStyle}>
                                <option value="">-- Select Gate Entry --</option>
                                {gateEntries.map(ge => (
                                    <option key={ge.id} value={ge.id}>{ge.id} - {ge.supplier_customer} ({ge.entry_date})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Supplier Name *</label>
                            <input list="supplier-list" name="supplier_name" value={formData.supplier_name} onChange={handleFormChange} style={inputStyle} />
                            <datalist id="supplier-list">
                                {suppliers.map((s, i) => <option key={i} value={s} />)}
                            </datalist>
                        </div>
                        <div>
                            <label style={labelStyle}>Supplier Ref / Party Ref</label>
                            <input type="text" name="supplier_reference" value={formData.supplier_reference} onChange={handleFormChange} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>DC / Invoice No</label>
                            <input type="text" name="dc_invoice_no" value={formData.dc_invoice_no} onChange={handleFormChange} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Invoice Date</label>
                            <input type="date" name="invoice_date" value={formData.invoice_date} onChange={handleFormChange} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Received Date</label>
                            <input type="date" name="grn_receipt_date" value={formData.grn_receipt_date} onChange={handleFormChange} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>PO No / Order Ref</label>
                            <input type="text" name="order_reference_no" value={formData.order_reference_no} onChange={handleFormChange} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Status</label>
                            <select name="status" value={formData.status} onChange={handleFormChange} style={inputStyle}>
                                <option>Pending</option>
                                <option>OK</option>
                                <option>Rejected</option>
                            </select>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={labelStyle}>Remarks</label>
                            <input type="text" name="remarks" value={formData.remarks} onChange={handleFormChange} style={inputStyle} />
                        </div>
                    </div>

                    <hr style={{ margin: '2rem 0', borderColor: '#e2e8f0' }} />

                    {/* Items Table */}
                    <h3 style={{ marginBottom: '1rem', color: '#475569' }}>GRN Items</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                                    <th style={itemThStyle}>S.No</th>
                                    <th style={itemThStyle}>Description</th>
                                    <th style={itemThStyle}>UOM</th>
                                    <th style={itemThStyle}>Rec Qty</th>
                                    <th style={itemThStyle}>PO Qty</th>
                                    <th style={itemThStyle}>Excess</th>
                                    <th style={itemThStyle}>Lot Size</th>
                                    <th style={itemThStyle}>Spec</th>
                                    <th style={itemThStyle}>Actual</th>
                                    <th style={itemThStyle}>Status</th>
                                    <th style={itemThStyle}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.items.map((item, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={itemTdStyle}>{index + 1}</td>
                                        <td style={itemTdStyle}><input type="text" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} style={cellInputStyle} /></td>
                                        <td style={itemTdStyle}><input type="text" value={item.uom} onChange={(e) => handleItemChange(index, 'uom', e.target.value)} style={cellInputStyle} /></td>
                                        <td style={itemTdStyle}><input type="number" value={item.quantity_received} onChange={(e) => handleItemChange(index, 'quantity_received', e.target.value)} style={cellInputStyle} /></td>
                                        <td style={itemTdStyle}><input type="number" value={item.po_quantity} onChange={(e) => handleItemChange(index, 'po_quantity', e.target.value)} style={cellInputStyle} /></td>
                                        <td style={itemTdStyle}><input type="number" value={item.excess_quantity} disabled style={{ ...cellInputStyle, background: '#f1f5f9' }} /></td>
                                        <td style={itemTdStyle}><input type="number" value={item.lot_size} onChange={(e) => handleItemChange(index, 'lot_size', e.target.value)} style={cellInputStyle} /></td>
                                        <td style={itemTdStyle}><input type="text" value={item.spec} onChange={(e) => handleItemChange(index, 'spec', e.target.value)} style={cellInputStyle} /></td>
                                        <td style={itemTdStyle}><input type="text" value={item.actual} onChange={(e) => handleItemChange(index, 'actual', e.target.value)} style={cellInputStyle} /></td>
                                        <td style={itemTdStyle}>
                                            <select value={item.item_status} onChange={(e) => handleItemChange(index, 'item_status', e.target.value)} style={cellInputStyle}>
                                                <option>OK</option>
                                                <option>Rejected</option>
                                            </select>
                                        </td>
                                        <td style={itemTdStyle}>
                                            <button onClick={() => removeItem(index)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <button onClick={addItem} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, color: '#475569' }}>+ Add Item</button>

                    <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                        <button onClick={handleSubmit} style={btnStyle}>Save GRN</button>
                        <button onClick={() => setView('list')} style={{ ...btnStyle, background: '#94a3b8' }}>Cancel</button>
                    </div>

                </div>
            )}
        </div>
    );
}

// Styles
const btnStyle = { padding: '0.6rem 1.2rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 };
const inputStyle = { width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.95rem' };
const labelStyle = { display: 'block', marginBottom: '0.4rem', fontWeight: 500, color: '#334155', fontSize: '0.9rem' };
const thStyle = { padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#475569', borderBottom: '2px solid #e2e8f0' };
const tdStyle = { padding: '1rem', color: '#334155' };

const itemThStyle = { padding: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#475569' };
const itemTdStyle = { padding: '0.25rem' };
const cellInputStyle = { width: '100%', padding: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.85rem' };
