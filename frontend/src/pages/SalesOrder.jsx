import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus, Search, FileText, Trash2, ChevronLeft, ChevronRight, X,
    Eye, Calendar, Loader2, Receipt, Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceInputFAB from '../components/VoiceInputFAB';

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

const STATUS_OPTIONS = ['Draft', 'Confirmed', 'Invoiced', 'Cancelled'];

const STATUS_STYLES = {
    Draft: 'bg-slate-100 text-slate-700 border border-slate-200',
    Confirmed: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    Invoiced: 'bg-blue-100 text-blue-700 border border-blue-200',
    Cancelled: 'bg-red-100 text-red-700 border border-red-200',
};

const emptyForm = () => ({
    order_no: '',
    customer_name: '',
    order_date: new Date().toISOString().split('T')[0],
    status: 'Draft',
    remarks: '',
    items: [],
});

const emptyItem = () => ({
    item_name: '',
    quantity: '',
    rate: '',
    uom: 'kg',
    spec_size: '',
    spec_color: '',
});

const formatCurrency = (n) =>
    Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ----- Voice helpers -----
const ORDINAL_WORDS = {
    first: 1, '1st': 1, one: 1,
    second: 2, '2nd': 2, two: 2,
    third: 3, '3rd': 3, three: 3,
    fourth: 4, '4th': 4, four: 4,
    fifth: 5, '5th': 5, five: 5,
    sixth: 6, '6th': 6, six: 6,
    seventh: 7, '7th': 7, seven: 7,
    eighth: 8, '8th': 8, eight: 8,
    ninth: 9, '9th': 9, nine: 9,
    tenth: 10, '10th': 10, ten: 10,
};

const parsePosition = (val) => {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'number' && Number.isInteger(val) && val >= 1) return val;
    if (typeof val === 'string') {
        const k = val.trim().toLowerCase().replace(/\s+/g, '');
        if (ORDINAL_WORDS[k]) return ORDINAL_WORDS[k];
        const m = val.match(/(\d+)/);
        if (m) {
            const n = parseInt(m[1], 10);
            if (n >= 1) return n;
        }
    }
    return null;
};

const normalizeVoiceItem = (raw) => {
    if (!raw || typeof raw !== 'object') return {};
    const out = {};
    if (raw.item_name) out.item_name = String(raw.item_name);
    if (raw.quantity !== undefined && raw.quantity !== null && raw.quantity !== '') {
        out.quantity = String(raw.quantity);
    }
    if (raw.rate !== undefined && raw.rate !== null && raw.rate !== '') {
        out.rate = String(raw.rate);
    }
    if (raw.uom) out.uom = String(raw.uom).toLowerCase();
    const size = raw.size ?? raw.spec_size ?? raw.specifications?.size;
    if (size) out.spec_size = String(size);
    const color = raw.color ?? raw.spec_color ?? raw.specifications?.color;
    if (color) out.spec_color = String(color);
    return out;
};

const SalesOrder = () => {
    // List
    const [orders, setOrders] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

    // Drawer state
    const [mode, setMode] = useState(null); // 'create' | 'view' | null
    const [viewing, setViewing] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Form
    const [formData, setFormData] = useState(emptyForm());
    const [currentItem, setCurrentItem] = useState(emptyItem());

    const grandTotal = useMemo(
        () => formData.items.reduce(
            (s, i) => s + (parseFloat(i.quantity || 0) * parseFloat(i.rate || 0)), 0
        ),
        [formData.items]
    );

    // Fetch list
    const fetchOrders = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                skip: (currentPage - 1) * itemsPerPage,
                limit: itemsPerPage,
                ...(searchTerm && { search: searchTerm }),
            });
            const res = await fetch(`${API_BASE}/sales/orders?${queryParams}`);
            if (res.ok) {
                const data = await res.json();
                let items = data.items || [];
                // Optional client-side date filter (API doesn't accept date)
                if (filterDate) {
                    items = items.filter(o => (o.order_date || '').startsWith(filterDate));
                }
                setOrders(items);
                setTotalItems(data.total ?? items.length);
            } else {
                setOrders([]);
                setTotalItems(0);
            }
        } catch (e) {
            console.error('Error fetching orders:', e);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, searchTerm, filterDate]);

    // Reset to page 1 when filters change
    useEffect(() => { setCurrentPage(1); }, [searchTerm, filterDate]);

    // Voice — merges header fields and supports an `items` array with
    // optional 1-based `position` so utterances like "first item …" / "2nd item …"
    // place data in the correct slot. Single-item legacy payloads are appended.
    const handleVoiceData = (data) => {
        if (!data || typeof data !== 'object') return;

        const wasOpen = mode === 'create';

        setFormData(prev => {
            const base = wasOpen ? { ...prev } : emptyForm();

            // Header fields
            if (data.order_no) base.order_no = String(data.order_no);
            if (data.customer_name) base.customer_name = String(data.customer_name);
            if (data.order_date) {
                const d = new Date(data.order_date);
                if (!isNaN(d.getTime())) {
                    base.order_date = d.toISOString().split('T')[0];
                }
            }
            if (data.status) {
                const s = STATUS_OPTIONS.find(
                    o => o.toLowerCase() === String(data.status).toLowerCase()
                );
                if (s) base.status = s;
            }
            if (data.remarks) base.remarks = String(data.remarks);

            // Items: prefer explicit `items` array; otherwise treat top-level
            // item fields as a single line item to append.
            const incoming = Array.isArray(data.items)
                ? data.items
                : (data.item_name || data.quantity || data.rate || data.size || data.color)
                    ? [{
                        item_name: data.item_name,
                        quantity: data.quantity,
                        rate: data.rate,
                        uom: data.uom,
                        size: data.size,
                        color: data.color,
                        position: data.position ?? data.index,
                    }]
                    : [];

            if (incoming.length > 0) {
                const items = [...base.items];
                incoming.forEach(raw => {
                    const norm = normalizeVoiceItem(raw);
                    const pos = parsePosition(raw?.position ?? raw?.index ?? raw?.line);
                    if (pos !== null) {
                        const idx = pos - 1;
                        while (items.length < idx) items.push(emptyItem());
                        items[idx] = { ...(items[idx] || emptyItem()), ...norm };
                    } else {
                        items.push({ ...emptyItem(), ...norm });
                    }
                });
                base.items = items;
            }

            return base;
        });

        if (!wasOpen) {
            setCurrentItem(emptyItem());
            setViewing(null);
            setMode('create');
        }
    };

    // Item editor
    const addItem = () => {
        if (!currentItem.item_name || !currentItem.quantity) return;
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, currentItem],
        }));
        setCurrentItem(emptyItem());
    };

    const removeItem = (idx) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== idx),
        }));
    };

    // Drawer open helpers
    const openCreate = () => {
        setFormData(emptyForm());
        setCurrentItem(emptyItem());
        setViewing(null);
        setMode('create');
    };

    const openView = async (order) => {
        setMode('view');
        setViewing(order); // optimistic
        try {
            const res = await fetch(`${API_BASE}/sales/orders/${order.id}`);
            if (res.ok) {
                const fresh = await res.json();
                setViewing(fresh);
            }
        } catch (e) { /* keep optimistic */ }
    };

    const closeDrawer = () => {
        setMode(null);
        setViewing(null);
    };

    // Submit (create only — API does not document update)
    const handleSubmit = async (e) => {
        e?.preventDefault();
        if (!formData.order_no.trim()) {
            alert('Order Number is required');
            return;
        }
        if (!formData.customer_name.trim()) {
            alert('Customer Name is required');
            return;
        }
        if (formData.items.length === 0) {
            alert('Add at least one item');
            return;
        }

        setSubmitting(true);
        try {
            const remarksParts = [
                `Customer: ${formData.customer_name.trim()}`,
                ...(formData.remarks ? [formData.remarks] : []),
            ];
            const payload = {
                order_no: formData.order_no.trim(),
                customer_id: 0,
                order_date: new Date(formData.order_date).toISOString(),
                status: formData.status,
                proforma_invoice_no: null,
                remarks: remarksParts.join('\n'),
                items: formData.items.map(i => {
                    const qty = parseFloat(i.quantity || 0);
                    const rate = parseFloat(i.rate || 0);
                    const specifications = {};
                    if (i.spec_size) specifications.size = i.spec_size;
                    if (i.spec_color) specifications.color = i.spec_color;
                    return {
                        item_name: i.item_name,
                        quantity: qty,
                        rate: rate,
                        amount: qty * rate,
                        uom: i.uom || 'kg',
                        ...(Object.keys(specifications).length > 0 && { specifications }),
                    };
                }),
            };

            const res = await fetch(`${API_BASE}/sales/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                closeDrawer();
                await fetchOrders();
            } else {
                const err = await res.json().catch(() => ({}));
                alert(`Failed to save order: ${err.detail || res.statusText}`);
            }
        } catch (err) {
            console.error(err);
            alert('Network error saving order');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this order? This cannot be undone.')) return;
        try {
            const res = await fetch(`${API_BASE}/sales/orders/${id}`, { method: 'DELETE' });
            if (res.status === 204 || res.ok) {
                await fetchOrders();
                if (viewing?.id === id) closeDrawer();
            } else {
                alert('Failed to delete order');
            }
        } catch (e) {
            console.error(e);
            alert('Network error deleting order');
        }
    };

    const generateProforma = async (id) => {
        try {
            const res = await fetch(`${API_BASE}/sales/orders/${id}/generate-proforma`, {
                method: 'POST',
            });
            if (res.ok) {
                const data = await res.json();
                alert(`${data.message}: ${data.proforma_no}`);
                await fetchOrders();
                if (viewing?.id === id) {
                    const updated = await fetch(`${API_BASE}/sales/orders/${id}`);
                    if (updated.ok) setViewing(await updated.json());
                }
            } else {
                alert('Failed to generate proforma');
            }
        } catch (e) {
            console.error(e);
            alert('Network error');
        }
    };

    // Customer name extraction (from `customer` object or remarks fallback)
    const getCustomerName = (order) => {
        if (order.customer?.customer_name) return order.customer.customer_name;
        const m = (order.remarks || '').match(/Customer:\s*(.+?)(\n|$)/);
        return m ? m[1].trim() : '—';
    };

    // Voice schema — describes the JSON the backend should extract from speech.
    // `items` is an array; the LLM should populate one entry per line item the
    // user mentions. When the user uses ordinal phrasing ("first item", "2nd
    // item", "third"), set `position` to the 1-based index so the UI places
    // (or merges) the data into that exact slot.
    const voiceSchema = {
        order_no: 'Order Number, e.g. "SO-2026-001"',
        customer_name: 'Customer Name (free text, e.g. "Acme Corp")',
        order_date: 'Order Date in YYYY-MM-DD format',
        status: 'Order status — one of: Draft, Confirmed, Invoiced, Cancelled',
        remarks: 'Order-level remarks or notes',
        items: 'Array of line items. Each element is an object with keys: position (integer, 1-based; set when the user says "1st item", "second item", "third item", etc.), item_name (string), quantity (number), rate (number, price per unit), uom (one of kg, nos, m, pcs, bag), size (specification string, e.g. "210D/3"), color (specification string, e.g. "Blue"). Always wrap multiple items in this array even if the user lists them sequentially. If the user only updates one field of a specific item ("for the second item, color is red"), return a single element with position=2 and just the spoken fields.',
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <VoiceInputFAB onDataReceived={handleVoiceData} promptContext={voiceSchema} />

            {/* Header */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Sales Orders</h1>
                    <p className="text-sm text-gray-500">Create and track customer orders, generate proforma invoices.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm"
                    >
                        <Plus size={18} /> New Order
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-[240px] max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by order no…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                    {filterDate && (
                        <button
                            onClick={() => setFilterDate('')}
                            className="text-xs text-gray-500 hover:text-gray-700 underline"
                        >
                            clear
                        </button>
                    )}
                    <div className="ml-auto text-xs text-gray-500">
                        {totalItems} {totalItems === 1 ? 'order' : 'orders'}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order No</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Proforma</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-10 text-gray-400">
                                        <Loader2 className="inline animate-spin mr-2" size={16} /> Loading orders…
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-12 text-gray-400">
                                        <Package className="inline mb-2" size={28} />
                                        <div>No sales orders yet.</div>
                                        <button
                                            onClick={openCreate}
                                            className="mt-3 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                                        >
                                            + Create your first order
                                        </button>
                                    </td>
                                </tr>
                            ) : orders.map(order => (
                                <tr key={order.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.order_no}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{getCustomerName(order)}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {order.order_date ? new Date(order.order_date).toLocaleDateString() : '—'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[order.status] || STATUS_STYLES.Draft}`}>
                                            {order.status || 'Draft'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {order.proforma_invoice_no ? (
                                            <span className="font-mono text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                                                {order.proforma_invoice_no}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-xs">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                                        ₹ {formatCurrency(order.total_amount)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button
                                                onClick={() => openView(order)}
                                                className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                title="View"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => generateProforma(order.id)}
                                                disabled={!!order.proforma_invoice_no}
                                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                                title={order.proforma_invoice_no ? 'Proforma already generated' : 'Generate Proforma'}
                                            >
                                                <Receipt size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(order.id)}
                                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalItems > itemsPerPage && (
                    <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                        <div>
                            Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Drawer */}
            <AnimatePresence>
                {mode && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeDrawer}
                            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">
                                            {mode === 'create' ? 'New Sales Order' : `Order ${viewing?.order_no || ''}`}
                                        </h2>
                                        {mode === 'view' && viewing && (
                                            <p className="text-sm text-gray-500 mt-1">
                                                {getCustomerName(viewing)} · {viewing.order_date ? new Date(viewing.order_date).toLocaleString() : ''}
                                            </p>
                                        )}
                                    </div>
                                    <button onClick={closeDrawer} className="p-1 hover:bg-gray-100 rounded">
                                        <X size={22} className="text-gray-500" />
                                    </button>
                                </div>

                                {mode === 'create' && (
                                    <CreateForm
                                        formData={formData}
                                        setFormData={setFormData}
                                        currentItem={currentItem}
                                        setCurrentItem={setCurrentItem}
                                        addItem={addItem}
                                        removeItem={removeItem}
                                        grandTotal={grandTotal}
                                        submitting={submitting}
                                        onSubmit={handleSubmit}
                                        onCancel={closeDrawer}
                                    />
                                )}

                                {mode === 'view' && viewing && (
                                    <ViewOrder
                                        order={viewing}
                                        onGenerateProforma={() => generateProforma(viewing.id)}
                                        onDelete={() => handleDelete(viewing.id)}
                                        getCustomerName={getCustomerName}
                                    />
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

// ----- Create form (extracted for clarity) -----
const CreateForm = ({
    formData, setFormData, currentItem, setCurrentItem,
    addItem, removeItem, grandTotal, submitting, onSubmit, onCancel,
}) => (
    <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
            <Field label="Order No" required>
                <input
                    type="text"
                    value={formData.order_no}
                    onChange={e => setFormData({ ...formData, order_no: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                    placeholder="SO-2026-001"
                />
            </Field>
            <Field label="Order Date">
                <input
                    type="date"
                    value={formData.order_date}
                    onChange={e => setFormData({ ...formData, order_date: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                />
            </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <Field label="Customer Name" required>
                <input
                    type="text"
                    value={formData.customer_name}
                    onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                    placeholder="Acme Corp"
                />
                <p className="text-[11px] text-gray-400 mt-1">New customers are auto-created.</p>
            </Field>
            <Field label="Status">
                <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </Field>
        </div>

        <Field label="Remarks">
            <textarea
                rows={2}
                value={formData.remarks}
                onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 resize-none"
                placeholder="Optional notes…"
            />
        </Field>

        {/* Items */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
            <div className="flex justify-between items-center">
                <h4 className="text-sm font-semibold text-gray-700">Order Items</h4>
                <span className="text-xs text-gray-500">{formData.items.length} item{formData.items.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Add row */}
            <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4">
                    <label className="text-xs text-gray-500">Item Name</label>
                    <input
                        type="text"
                        value={currentItem.item_name}
                        onChange={e => setCurrentItem({ ...currentItem, item_name: e.target.value })}
                        className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                </div>
                <div className="col-span-2">
                    <label className="text-xs text-gray-500">Qty</label>
                    <input
                        type="number"
                        step="0.01"
                        value={currentItem.quantity}
                        onChange={e => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                        className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                </div>
                <div className="col-span-2">
                    <label className="text-xs text-gray-500">UoM</label>
                    <select
                        value={currentItem.uom}
                        onChange={e => setCurrentItem({ ...currentItem, uom: e.target.value })}
                        className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                        <option value="kg">kg</option>
                        <option value="nos">nos</option>
                        <option value="m">m</option>
                        <option value="pcs">pcs</option>
                        <option value="bag">bag</option>
                    </select>
                </div>
                <div className="col-span-3">
                    <label className="text-xs text-gray-500">Rate</label>
                    <input
                        type="number"
                        step="0.01"
                        value={currentItem.rate}
                        onChange={e => setCurrentItem({ ...currentItem, rate: e.target.value })}
                        className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                </div>
                <div className="col-span-1">
                    <button
                        type="button"
                        onClick={addItem}
                        disabled={!currentItem.item_name || !currentItem.quantity}
                        className="w-full px-2 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                        title="Add item"
                    >
                        <Plus size={16} />
                    </button>
                </div>

                {/* Specs row */}
                <div className="col-span-6">
                    <label className="text-xs text-gray-500">Size (spec)</label>
                    <input
                        type="text"
                        value={currentItem.spec_size}
                        onChange={e => setCurrentItem({ ...currentItem, spec_size: e.target.value })}
                        className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="e.g. 210D/3"
                    />
                </div>
                <div className="col-span-6">
                    <label className="text-xs text-gray-500">Color (spec)</label>
                    <input
                        type="text"
                        value={currentItem.spec_color}
                        onChange={e => setCurrentItem({ ...currentItem, spec_color: e.target.value })}
                        className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="e.g. Blue"
                    />
                </div>
            </div>

            {/* Items table */}
            {formData.items.length > 0 ? (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                            <th className="pb-2">Item</th>
                            <th className="pb-2 text-right">Qty</th>
                            <th className="pb-2 text-right">Rate</th>
                            <th className="pb-2 text-right">Amount</th>
                            <th className="pb-2"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {formData.items.map((item, idx) => (
                            <tr key={idx}>
                                <td className="py-2">
                                    <div className="font-medium text-gray-800">{item.item_name}</div>
                                    {(item.spec_size || item.spec_color) && (
                                        <div className="text-xs text-gray-500">
                                            {[item.spec_size, item.spec_color].filter(Boolean).join(' · ')}
                                        </div>
                                    )}
                                </td>
                                <td className="py-2 text-right">{item.quantity} {item.uom}</td>
                                <td className="py-2 text-right">{formatCurrency(item.rate)}</td>
                                <td className="py-2 text-right font-medium">
                                    {formatCurrency(parseFloat(item.quantity || 0) * parseFloat(item.rate || 0))}
                                </td>
                                <td className="py-2 text-right pl-2">
                                    <button
                                        type="button"
                                        onClick={() => removeItem(idx)}
                                        className="text-red-500 hover:text-red-700"
                                        title="Remove"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-gray-200">
                            <td colSpan="3" className="pt-3 text-right text-sm font-semibold text-gray-700">Grand Total</td>
                            <td className="pt-3 text-right text-base font-bold text-gray-900">₹ {formatCurrency(grandTotal)}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            ) : (
                <div className="py-6 text-center text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                    Add at least one item.
                </div>
            )}
        </div>

        <div className="pt-2 flex gap-3">
            <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
                Cancel
            </button>
            <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2"
            >
                {submitting && <Loader2 className="animate-spin" size={16} />}
                {submitting ? 'Saving…' : 'Save Order'}
            </button>
        </div>
    </form>
);

// ----- View order (read-only) -----
const ViewOrder = ({ order, onGenerateProforma, onDelete, getCustomerName }) => (
    <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
            <Stat label="Status">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[order.status] || STATUS_STYLES.Draft}`}>
                    {order.status || 'Draft'}
                </span>
            </Stat>
            <Stat label="Customer">{getCustomerName(order)}</Stat>
            <Stat label="Order Date">
                {order.order_date ? new Date(order.order_date).toLocaleString() : '—'}
            </Stat>
            <Stat label="Proforma">
                {order.proforma_invoice_no ? (
                    <span className="font-mono text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                        {order.proforma_invoice_no}
                    </span>
                ) : <span className="text-gray-400">Not generated</span>}
            </Stat>
        </div>

        {order.remarks && (
            <Stat label="Remarks">
                <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-2 rounded border border-gray-100 text-gray-700">{order.remarks}</pre>
            </Stat>
        )}

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Items</h4>
            {order.items?.length ? (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                            <th className="pb-2">Item</th>
                            <th className="pb-2 text-right">Qty</th>
                            <th className="pb-2 text-right">Rate</th>
                            <th className="pb-2 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {order.items.map((item, idx) => (
                            <tr key={item.id || idx}>
                                <td className="py-2">
                                    <div className="font-medium text-gray-800">{item.item_name}</div>
                                    {item.specifications && Object.keys(item.specifications).length > 0 && (
                                        <div className="text-xs text-gray-500">
                                            {Object.entries(item.specifications).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                                        </div>
                                    )}
                                </td>
                                <td className="py-2 text-right">{item.quantity} {item.uom}</td>
                                <td className="py-2 text-right">{formatCurrency(item.rate)}</td>
                                <td className="py-2 text-right font-medium">{formatCurrency(item.amount)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-gray-200">
                            <td colSpan="3" className="pt-3 text-right text-sm font-semibold text-gray-700">Total</td>
                            <td className="pt-3 text-right text-base font-bold text-gray-900">₹ {formatCurrency(order.total_amount)}</td>
                        </tr>
                    </tfoot>
                </table>
            ) : (
                <div className="text-sm text-gray-400">No items.</div>
            )}
        </div>

        <div className="pt-2 flex gap-3">
            <button
                type="button"
                onClick={onDelete}
                className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2"
            >
                <Trash2 size={16} /> Delete
            </button>
            <button
                type="button"
                onClick={onGenerateProforma}
                disabled={!!order.proforma_invoice_no}
                className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                title={order.proforma_invoice_no ? 'Already generated' : 'Generate Proforma'}
            >
                <FileText size={16} />
                {order.proforma_invoice_no ? 'Proforma Generated' : 'Generate Proforma'}
            </button>
        </div>
    </div>
);

// ----- Tiny helpers -----
const Field = ({ label, required, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
    </div>
);

const Stat = ({ label, children }) => (
    <div>
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</div>
        <div className="text-sm text-gray-800">{children}</div>
    </div>
);

export default SalesOrder;
