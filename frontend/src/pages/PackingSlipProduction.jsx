
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Edit2, Trash2, ChevronLeft, ChevronRight, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceInputFAB from '../components/VoiceInputFAB';

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

const PackingSlipProduction = () => {
    // Main Data State
    const [entries, setEntries] = useState([]);
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
    const [masterData, setMasterData] = useState({
        customers: [],
        orders: [],
        counts: [],
        varieties: []
    });

    // Form State
    const [formData, setFormData] = useState({
        entry_date: new Date().toISOString().split('T')[0],
        packing_slip_no: '',
        customer_name: '',
        order_no: '',
        count_code: '',
        variety_name: '',
        lot_no: '',
        no_of_bags: '',
        weight_per_bag: '',
        total_weight: '',
        remarks: ''
    });

    // Fetch Master Data
    useEffect(() => {
        const fetchMasters = async () => {
            try {
                const [customersRes, ordersRes, countsRes, varietiesRes] = await Promise.all([
                    fetch(`${API_BASE}/master/customers/`),
                    fetch(`${API_BASE}/master/orders/`),
                    fetch(`${API_BASE}/master/counts/`),
                    fetch(`${API_BASE}/master/varieties/`)
                ]);

                const customersData = await customersRes.json();
                const ordersData = await ordersRes.json();
                const countsData = await countsRes.json();
                const varietiesData = await varietiesRes.json();

                setMasterData({
                    customers: customersData.items || [],
                    orders: ordersData.items || [],
                    counts: countsData.items || [],
                    varieties: varietiesData.items || []
                });
            } catch (error) {
                console.error('Error fetching master data:', error);
            }
        };
        fetchMasters();
    }, []);

    // Fetch Entries
    const fetchEntries = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                skip: (currentPage - 1) * itemsPerPage,
                limit: itemsPerPage,
                search: searchTerm,
                ...(filterDate && { date: filterDate })
            });
            const response = await fetch(`${API_BASE}/production/packing-slip/?${queryParams}`);
            const data = await response.json();
            setEntries(data.items || []);
            setTotalItems(data.total || 0);
        } catch (error) {
            console.error('Error fetching entries:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEntries();
    }, [currentPage, searchTerm, filterDate]);

    // Auto-calculate Total Weight
    useEffect(() => {
        const total = (parseFloat(formData.no_of_bags) || 0) * (parseFloat(formData.weight_per_bag) || 0);
        if (total !== parseFloat(formData.total_weight || 0)) {
            setFormData(prev => ({ ...prev, total_weight: total > 0 ? parseFloat(total.toFixed(2)) : '' }));
        }
    }, [formData.no_of_bags, formData.weight_per_bag]);

    // Handlers
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleVoiceData = (data) => {
        if (!data) return;
        setFormData(prev => ({
            ...prev,
            ...data,
            entry_date: data.entry_date || prev.entry_date
        }));
        if (!showForm) setShowForm(true);
        alert("Voice data applied! Please review.");
    };

    const handleSubmit = async (e) => {
        e && e.preventDefault();
        try {
            const url = editingId
                ? `${API_BASE}/production/packing-slip/${editingId}`
                : `${API_BASE}/production/packing-slip/`;
            const method = editingId ? 'PUT' : 'POST';

            const payload = {
                ...formData,
                no_of_bags: parseInt(formData.no_of_bags || 0),
                weight_per_bag: parseFloat(formData.weight_per_bag || 0),
                total_weight: parseFloat(formData.total_weight || 0)
            };

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert("Saved Successfully!");
                setShowForm(false);
                setEditingId(null);
                fetchEntries();
                setFormData({
                    entry_date: new Date().toISOString().split('T')[0],
                    packing_slip_no: '',
                    customer_name: '',
                    order_no: '',
                    count_code: '',
                    variety_name: '',
                    lot_no: '',
                    no_of_bags: '',
                    weight_per_bag: '',
                    total_weight: '',
                    remarks: ''
                });
            } else {
                const err = await response.json();
                alert(`Error: ${JSON.stringify(err)}`);
            }
        } catch (error) {
            console.error('Error saving:', error);
            alert("Network Error");
        }
    };

    const handleEdit = (entry) => {
        setFormData(entry);
        setEditingId(entry.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this entry?')) {
            await fetch(`${API_BASE}/production/packing-slip/${id}`, { method: 'DELETE' });
            fetchEntries();
        }
    };

    const voiceSchema = {
        packing_slip_no: "Packing Slip Number",
        customer_name: "Customer Name",
        order_no: "Order Number",
        count_code: "Count Code",
        variety_name: "Variety Name",
        lot_no: "Lot Number",
        no_of_bags: "Number of bags",
        weight_per_bag: "Weight per bag"
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <VoiceInputFAB onDataReceived={handleVoiceData} promptContext={voiceSchema} />

            {/* Header */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Packing Slip Production</h1>
                    <p className="text-sm text-gray-500">Manage packing slips</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => { setEditingId(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm">
                        <Plus size={18} /> New Entry
                    </button>
                </div>
            </div>

            {/* List View */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Slip No</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Order</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total Wt</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? <tr><td colSpan="6" className="text-center py-4">Loading...</td></tr> : entries.map(entry => (
                                <tr key={entry.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{new Date(entry.entry_date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">{entry.packing_slip_no}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{entry.customer_name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{entry.order_no}</td>
                                    <td className="px-6 py-4 text-sm text-right font-bold text-gray-900">{entry.total_weight}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleEdit(entry)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(entry.id)} className="p-1 text-red-600 hover:bg-red-50 rounded ml-2"><Trash2 size={16} /></button>
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
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Entry' : 'New Entry'}</h2>
                                    <button onClick={() => setShowForm(false)}><X size={24} className="text-gray-400 hover:text-gray-600" /></button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                        <input type="date" name="entry_date" value={formData.entry_date} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Packing Slip</label>
                                            <input type="text" name="packing_slip_no" value={formData.packing_slip_no} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                                            <select name="customer_name" value={formData.customer_name} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                                <option value="">Select Customer</option>
                                                {masterData.customers.map(c => <option key={c.id} value={c.customer_name}>{c.customer_name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Order No</label>
                                        <select name="order_no" value={formData.order_no} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                            <option value="">Select Order</option>
                                            {masterData.orders.map(o => <option key={o.id} value={o.order_no}>{o.order_no}</option>)}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Count Code</label>
                                            <select name="count_code" value={formData.count_code} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                                <option value="">Select Count</option>
                                                {masterData.counts.map(c => <option key={c.id} value={c.count_code}>{c.count_code}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Variety</label>
                                            <select name="variety_name" value={formData.variety_name} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                                <option value="">Select Variety</option>
                                                {masterData.varieties.map(v => <option key={v.id} value={v.variety_name}>{v.variety_name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Lot No</label>
                                        <input type="text" name="lot_no" value={formData.lot_no} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">No of Bags</label>
                                            <input type="number" name="no_of_bags" value={formData.no_of_bags} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Wt/Bag</label>
                                            <input type="number" step="0.01" name="weight_per_bag" value={formData.weight_per_bag} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Weight</label>
                                        <input type="number" step="0.01" name="total_weight" value={formData.total_weight} readOnly className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                                        <input type="text" name="remarks" value={formData.remarks} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg" />
                                    </div>

                                    <div className="pt-4 flex gap-3">
                                        <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                                        <button type="submit" className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Save</button>
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

export default PackingSlipProduction;
