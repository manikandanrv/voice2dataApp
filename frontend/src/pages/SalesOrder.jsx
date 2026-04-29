
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, FileText, Edit2, Trash2, ChevronLeft, ChevronRight, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceInputFAB from '../components/VoiceInputFAB';

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

const SalesOrder = () => {
    // Main Data State
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalItems, setTotalItems] = useState(0);

    // Filter/Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');

    // UI State
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Master Data
    const [customers, setCustomers] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        order_no: '',
        customer_id: '',
        order_date: new Date().toISOString().split('T')[0],
        status: 'Draft',
        remarks: '',
        items: []
    });

    const [currentItem, setCurrentItem] = useState({
        item_name: '',
        quantity: '',
        rate: '',
        amount: 0,
        uom: 'Kg'
    });

    // Fetch Master Data
    useEffect(() => {
        const fetchMasters = async () => {
            try {
                const customersRes = await fetch(`${API_BASE}/master/customers/`);
                if (customersRes.ok) {
                    const data = await customersRes.json();
                    setCustomers(data.items || []);
                } else {
                    // Fallback using mock data if API fails (as per original file logic)
                    setCustomers([{ id: 1, customer_name: "Customer A" }, { id: 2, customer_name: "Customer B" }]);
                }
            } catch (error) {
                console.error('Error fetching master data:', error);
                setCustomers([{ id: 1, customer_name: "Customer A" }, { id: 2, customer_name: "Customer B" }]);
            }
        };
        fetchMasters();
    }, []);

    // Fetch Entries
    const fetchOrders = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                skip: (currentPage - 1) * itemsPerPage,
                limit: itemsPerPage,
                search: searchTerm,
                ...(filterDate && { date: filterDate })
            });
            const response = await fetch(`${API_BASE}/sales/orders?${queryParams}`);
            const data = await response.json();
            setOrders(data.items || []);
            setTotalItems(data.total || 0);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [currentPage, searchTerm, filterDate]);

    // Handlers
    const handleVoiceData = (data) => {
        if (!data) return;

        if (data.item_name && data.quantity) {
            // Context: Adding an item
            setCurrentItem(prev => ({
                ...prev,
                item_name: data.item_name,
                quantity: data.quantity,
                rate: data.rate || prev.rate,
                amount: parseFloat(data.quantity) * parseFloat(data.rate || prev.rate || 0)
            }));
            alert(`Voice Item Detected: ${data.item_name}. Review and click Add.`);
        } else {
            // Context: Form Header
            setFormData(prev => ({
                ...prev,
                ...data,
                order_date: data.entry_date || prev.order_date // Map entry_date to order_date
            }));
            if (!showForm) setShowForm(true);
            alert("Voice Header Data Applied.");
        }
    };

    const addItem = () => {
        if (!currentItem.item_name || !currentItem.quantity) return;
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, {
                ...currentItem,
                quantity: parseFloat(currentItem.quantity),
                rate: parseFloat(currentItem.rate || 0),
                amount: parseFloat(currentItem.quantity) * parseFloat(currentItem.rate || 0)
            }]
        }));
        setCurrentItem({ item_name: '', quantity: '', rate: '', amount: 0, uom: 'Kg' });
    };

    const removeItem = (idx) => {
        setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
    };

    const handleSubmit = async (e) => {
        e && e.preventDefault();
        try {
            const url = editingId ? `${API_BASE}/sales/orders/${editingId}` : `${API_BASE}/sales/orders`;
            const method = editingId ? 'PUT' : 'POST';

            const payload = {
                ...formData,
                customer_id: parseInt(formData.customer_id) || null
            };

            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (res.ok) {
                alert("Order Saved!");
                setShowForm(false);
                setEditingId(null);
                fetchOrders();
                setFormData({
                    order_no: '',
                    customer_id: '',
                    order_date: new Date().toISOString().split('T')[0],
                    status: 'Draft',
                    remarks: '',
                    items: []
                });
            } else {
                alert("Failed to save order");
            }
        } catch (err) {
            console.error(err);
            alert("Network Error");
        }
    };

    const generateProforma = async (id) => {
        try {
            const res = await fetch(`${API_BASE}/sales/orders/${id}/generate-proforma`, { method: 'POST' });
            if (res.ok) alert("Proforma Generated Successfully");
            else alert("Failed to generate Proforma");
        } catch (e) { console.error(e); alert("Network Error"); }
    };

    // Voice Schema
    const voiceSchema = {
        order_no: "Order Number",
        customer_name: "Customer Name",
        item_name: "Item Name (for line item)",
        quantity: "Quantity (for line item)",
        rate: "Rate (for line item)"
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <VoiceInputFAB onDataReceived={handleVoiceData} promptContext={voiceSchema} />

            {/* Header */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Sales Orders</h1>
                    <p className="text-sm text-gray-500">Manage customer orders</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => { setEditingId(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm">
                        <Plus size={18} /> New Order
                    </button>
                </div>
            </div>

            {/* List View */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" placeholder="Search orders..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Order No</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? <tr><td colSpan="5" className="text-center py-4">Loading...</td></tr> : orders.map(order => (
                                <tr key={order.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.order_no}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {customers.find(c => c.id === order.customer_id)?.customer_name || order.customer_id}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-right font-bold text-gray-900">{order.total_amount?.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button onClick={() => generateProforma(order.id)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded" title="Generate Proforma"><FileText size={18} /></button>
                                        <button onClick={() => { setFormData(order); setEditingId(order.id); setShowForm(true); }} className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"><Edit2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Form */}
            <AnimatePresence>
                {showForm && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Order' : 'New Sales Order'}</h2>
                                    <button onClick={() => setShowForm(false)}><X size={24} className="text-gray-400 hover:text-gray-600" /></button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Order No <span className="text-red-500">*</span></label>
                                            <input type="text" value={formData.order_no} onChange={e => setFormData({ ...formData, order_no: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                                            <select value={formData.customer_id} onChange={e => setFormData({ ...formData, customer_id: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                                <option value="">Select Customer</option>
                                                {customers.map(c => <option key={c.id} value={c.id}>{c.customer_name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Items Section */}
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Order Items</h4>
                                        <div className="flex gap-2 items-end mb-4">
                                            <div className="flex-1">
                                                <label className="text-xs text-gray-500">Item Name</label>
                                                <input type="text" value={currentItem.item_name} onChange={e => setCurrentItem({ ...currentItem, item_name: e.target.value })} className="w-full px-2 py-1 bg-white border border-gray-200 rounded text-sm" />
                                            </div>
                                            <div className="w-20">
                                                <label className="text-xs text-gray-500">Qty</label>
                                                <input type="number" value={currentItem.quantity} onChange={e => setCurrentItem({ ...currentItem, quantity: e.target.value })} className="w-full px-2 py-1 bg-white border border-gray-200 rounded text-sm" />
                                            </div>
                                            <div className="w-24">
                                                <label className="text-xs text-gray-500">Rate</label>
                                                <input type="number" value={currentItem.rate} onChange={e => setCurrentItem({ ...currentItem, rate: e.target.value })} className="w-full px-2 py-1 bg-white border border-gray-200 rounded text-sm" />
                                            </div>
                                            <button type="button" onClick={addItem} className="px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"><Plus size={16} /></button>
                                        </div>

                                        {formData.items.length > 0 && (
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                                                        <th className="pb-2">Item</th>
                                                        <th className="pb-2 text-right">Qty</th>
                                                        <th className="pb-2 text-right">Rate</th>
                                                        <th className="pb-2 text-right">Amt</th>
                                                        <th className="pb-2"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {formData.items.map((item, idx) => (
                                                        <tr key={idx}>
                                                            <td className="py-2">{item.item_name}</td>
                                                            <td className="py-2 text-right">{item.quantity}</td>
                                                            <td className="py-2 text-right">{item.rate}</td>
                                                            <td className="py-2 text-right">{(item.quantity * item.rate).toFixed(2)}</td>
                                                            <td className="py-2 text-right pl-2">
                                                                <button onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>

                                    <div className="pt-4 flex gap-3">
                                        <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                                        <button type="submit" className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Save Order</button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SalesOrder;
