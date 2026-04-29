
import { useState, useEffect } from 'react';

const API_BASE = `${import.meta.env.VITE_API_URL}/api/gate-entry`;

export default function GateEntry() {
    const [formData, setFormData] = useState({
        entry_date: new Date().toISOString().split('T')[0],
        entry_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
        receipt_type: 'Goods',
        unit: '',
        supplier_customer: '',
        bill_dc_da_no: '',
        bill_date: new Date().toISOString().split('T')[0],
        vehicle_no: '',
        no_of_items: ''
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    const [listData, setListData] = useState([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);

    const [units, setUnits] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    const fetchMasters = async () => {
        try {
            const unitsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/master/units/`);
            const unitsData = await unitsRes.json();
            setUnits(unitsData.items?.map(i => i.unit_name) || []);

            const suppliersRes = await fetch(`${import.meta.env.VITE_API_URL}/api/master/suppliers/`);
            const suppliersData = await suppliersRes.json();
            setSuppliers(suppliersData.items?.map(i => i.supplier_full_name || i.supplier_name) || []);
        } catch (err) {
            console.error("Error fetching master data:", err);
        }
    };

    useEffect(() => {
        fetchMasters();
    }, []);

    const fetchList = async () => {
        try {
            const skip = (page - 1) * pageSize;
            const params = new URLSearchParams({
                skip,
                limit: pageSize,
                ...(searchQuery && { search: searchQuery }),
                ...(filterStartDate && { start_date: filterStartDate }),
                ...(filterEndDate && { end_date: filterEndDate })
            });

            const res = await fetch(`${API_BASE}/?${params}`);
            const data = await res.json();
            setListData(data.items || []);
            setTotalPages(data.pages || 0);
        } catch (err) {
            console.error("Error fetching gate entries:", err);
        }
    };

    // Debounce search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1); // Reset to page 1 on search
            fetchList();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, filterStartDate, filterEndDate, pageSize]);

    // Page change effect (separate from debounce to avoid double fetch on page change if not careful, 
    // but here we can just include page in the main dependency array if we handle debounce correctly. 
    // Actually simpler is: triggering fetchList on page change directly, and debounce only triggers setPage(1) or fetchList.
    // Let's stick to a common pattern:
    useEffect(() => {
        fetchList();
    }, [page]); // Fetch on page change. Search params changes trigger debounce which resets page to 1, thus fetching.

    // Wait, if search changes -> setPage(1) -> 'page' effect runs. Correct. 
    // But if we are already on page 1, setPage(1) won't trigger effect. 
    // So we need to call fetchList in debounce if page is already 1.
    // Let's refine the debounce logic above to just call fetchList, and carefully manage dependencies.
    /*
       Correct approach for this simple component:
       1. useEffect on [page] calls fetchList().
       2. useEffect on [search, filters] sets Page(1).
       
       If page is already 1, setPage(1) does nothing, so we miss the fetch.
       So we need useEffect on [search, filters] to call fetchList() explicitly IF page is 1. If page is > 1, setPage(1) will trigger the fetch via the other effect.
       
       Actually, standard way:
       useEffect(() => { fetchList() }, [page, pageSize, debounce(search), debounce(filters)])
       
       Let's use the provided code structure but robustly.
    */

    // RE-WRITING LOGIC FOR CLARITY AND ROBUSTNESS

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchList();
        }, 300);
        return () => clearTimeout(timer);
    }, [page, pageSize, searchQuery, filterStartDate, filterEndDate]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async () => {
        try {
            // Validation: Ensure mandatory fields are not empty
            if (!formData.unit || !formData.supplier_customer || !formData.bill_dc_da_no || !formData.vehicle_no || !formData.no_of_items) {
                alert("Please fill all mandatory fields (marked with *)");
                return;
            }

            // Prepare payload: convert types and handle empty optional fields
            const payload = {
                ...formData,
                no_of_items: formData.no_of_items ? parseInt(formData.no_of_items) : 0,
                bill_date: formData.bill_date || null
            };

            let res;
            if (formData.id) {
                res = await fetch(`${API_BASE}/${formData.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch(`${API_BASE}/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            if (res.ok) {
                alert("Saved successfully!");
                setFormData({
                    entry_date: new Date().toISOString().split('T')[0],
                    entry_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
                    receipt_type: 'Goods',
                    unit: '',
                    supplier_customer: '',
                    bill_dc_da_no: '',
                    bill_date: new Date().toISOString().split('T')[0],
                    vehicle_no: '',
                    no_of_items: ''
                });
                fetchList();
            } else {
                const errorData = await res.json();
                console.error("Save error:", errorData);
                alert(`Error saving data: ${JSON.stringify(errorData.detail || errorData)}`);
            }
        } catch (err) {
            console.error(err);
            alert("Error saving data: " + err.message);
        }
    };

    const handleEdit = (item) => {
        setFormData({ ...item });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this entry?")) return;
        try {
            const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchList();
            } else {
                alert("Error deleting entry");
            }
        } catch (err) {
            console.error(err);
            alert("Error deleting entry");
        }
    };






    return (
        <div className="container" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <h2 className="page-title" style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '2rem' }}>Gate Entry</h2>

            <div className="form-section" style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: '3rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

                    <div className="form-row">
                        <label className="form-label" style={{ fontWeight: 500 }}>Entry Date <span style={{ color: 'red' }}>*</span></label>
                        <input type="date" className="form-control" name="entry_date" value={formData.entry_date} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>

                    <div className="form-row">
                        <label className="form-label" style={{ fontWeight: 500 }}>Entry Time <span style={{ color: 'red' }}>*</span></label>
                        <input type="text" className="form-control" name="entry_time" value={formData.entry_time} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>

                    <div className="form-row">
                        <label className="form-label" style={{ fontWeight: 500 }}>Receipt Type <span style={{ color: 'red' }}>*</span></label>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                            {['Courier', 'Person', 'Goods'].map(type => (
                                <label key={type} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input type="radio" name="receipt_type" value={type} checked={formData.receipt_type === type} onChange={handleChange} />
                                    {type}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="form-row">
                        <label className="form-label" style={{ fontWeight: 500 }}>Unit <span style={{ color: 'red' }}>*</span></label>
                        <select className="form-control" name="unit" value={formData.unit} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}>
                            <option value="">-- Select Unit --</option>
                            {units.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>

                    <div className="form-row" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label" style={{ fontWeight: 500 }}>Supplier / Customer <span style={{ color: 'red' }}>*</span></label>
                        <input
                            list="supplier-list"
                            className="form-control"
                            name="supplier_customer"
                            value={formData.supplier_customer}
                            onChange={handleChange}
                            placeholder="Type to search..."
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                        <datalist id="supplier-list">
                            {suppliers.map((s, index) => <option key={index} value={s} />)}
                        </datalist>
                    </div>

                    <div className="form-row">
                        <label className="form-label" style={{ fontWeight: 500 }}>Bill No / DC No / DA No <span style={{ color: 'red' }}>*</span></label>
                        <input type="text" className="form-control" name="bill_dc_da_no" value={formData.bill_dc_da_no} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>

                    <div className="form-row">
                        <label className="form-label" style={{ fontWeight: 500 }}>Date (Bill/DC) <span style={{ color: 'red' }}>*</span></label>
                        <input type="date" className="form-control" name="bill_date" value={formData.bill_date} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>

                    <div className="form-row">
                        <label className="form-label" style={{ fontWeight: 500 }}>Vehicle No <span style={{ color: 'red' }}>*</span></label>
                        <input type="text" className="form-control" name="vehicle_no" value={formData.vehicle_no} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>

                    <div className="form-row">
                        <label className="form-label" style={{ fontWeight: 500 }}>No of Items <span style={{ color: 'red' }}>*</span></label>
                        <input type="number" className="form-control" name="no_of_items" value={formData.no_of_items} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>

                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                    <button onClick={handleSubmit} style={{ padding: '0.75rem 2rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Save Entry</button>
                    <button onClick={() => window.location.reload()} style={{ padding: '0.75rem 2rem', backgroundColor: '#94a3b8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Clear</button>
                </div>
            </div>

            {/* List */}
            <div>
                <h3 style={{ marginBottom: '1rem', fontWeight: 700, color: '#475569' }}>Recent Gate Entries</h3>

                {/* Search & Filters */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <input
                            type="text"
                            placeholder="Search (Supplier, Ref No, Vehicle)..."
                            className="form-control"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="date" className="form-control" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }} />
                        <span>to</span>
                        <input type="date" className="form-control" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }} />
                    </div>
                    <button onClick={() => {
                        setSearchQuery('');
                        setFilterStartDate('');
                        setFilterEndDate('');
                    }} style={{ padding: '0.5rem 1rem', background: '#94a3b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Reset</button>
                </div>

                {/* Pagination Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                    <div>
                        <label style={{ marginRight: '0.5rem', fontWeight: 500 }}>Page Size:</label>
                        <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #ccc' }}>
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                    <div>
                        <span style={{ marginRight: '1rem', fontWeight: 500 }}>Total: {listData.length > 0 ? totalPages * pageSize : 0} records (approx)</span>
                        <span style={{ marginRight: '1rem' }}>Page {page} of {totalPages}</span>
                        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ marginRight: '0.5rem', padding: '0.3rem 0.8rem', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}>Prev</button>
                        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ marginLeft: '0.5rem', padding: '0.3rem 0.8rem', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1 }}>Next</button>
                    </div>
                </div>

                <div style={{ overflowX: 'auto', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                        <thead style={{ background: '#f8fafc', color: '#475569', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <tr>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>ID</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Date</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Type</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Supplier/Cust</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Ref No</th>
                            </tr>
                        </thead>
                        <tbody style={{ fontSize: '0.95rem' }}>
                            {listData.length === 0 ? (
                                <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No entries found</td></tr>
                            ) : (
                                listData.map(item => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background-color 0.15s' }}>
                                        <td style={{ padding: '1rem' }}>{item.id}</td>
                                        <td style={{ padding: '1rem' }}>{item.entry_date} {item.entry_time}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                backgroundColor: item.receipt_type === 'Goods' ? '#dcfce7' : item.receipt_type === 'Courier' ? '#dbeafe' : '#fef9c3',
                                                color: item.receipt_type === 'Goods' ? '#166534' : item.receipt_type === 'Courier' ? '#1e40af' : '#854d0e'
                                            }}>
                                                {item.receipt_type}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{item.supplier_customer}</td>
                                        <td style={{ padding: '1rem' }}>{item.bill_dc_da_no}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
