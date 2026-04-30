import React, { useState, useEffect } from 'react';
import {
    Plus, Search, X, ChevronLeft, ChevronRight, Loader2,
    Users, Phone, MapPin, Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceInputFAB from '../components/VoiceInputFAB';

const API_BASE = `${import.meta.env.VITE_API_URL}/api/master`;

const emptyForm = () => ({
    customer_name: '',
    address: '',
    mobile_no: '',
    active: true,
});

const CustomerMaster = () => {
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));

    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState(emptyForm());
    const [formError, setFormError] = useState('');

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                skip: (currentPage - 1) * itemsPerPage,
                limit: itemsPerPage,
                ...(searchTerm && { search: searchTerm }),
            });
            const res = await fetch(`${API_BASE}/customers?${params}`);
            if (res.ok) {
                const data = await res.json();
                setItems(data.items || []);
                setTotal(data.total ?? (data.items?.length || 0));
            } else {
                setItems([]);
                setTotal(0);
            }
        } catch (e) {
            console.error('Error fetching customers:', e);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, searchTerm]);

    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    const openCreate = () => {
        setFormData(emptyForm());
        setFormError('');
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setFormError('');
    };

    const handleVoiceData = (data) => {
        if (!data || typeof data !== 'object') return;
        setFormData(prev => ({
            ...prev,
            ...(data.customer_name && { customer_name: String(data.customer_name) }),
            ...(data.address && { address: String(data.address) }),
            ...(data.mobile_no && { mobile_no: String(data.mobile_no) }),
            ...(typeof data.active === 'boolean' && { active: data.active }),
        }));
        if (!showForm) setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e?.preventDefault();
        setFormError('');

        if (!formData.customer_name.trim()) {
            setFormError('Customer name is required.');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                customer_name: formData.customer_name.trim(),
                address: formData.address.trim() || null,
                mobile_no: formData.mobile_no.trim() || null,
                active: formData.active,
            };
            const res = await fetch(`${API_BASE}/customers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                closeForm();
                await fetchCustomers();
            } else {
                const err = await res.json().catch(() => ({}));
                setFormError(err.detail || `Save failed (${res.status})`);
            }
        } catch (err) {
            console.error(err);
            setFormError('Network error saving customer');
        } finally {
            setSubmitting(false);
        }
    };

    const voiceSchema = {
        customer_name: 'Customer Name (e.g. "Acme Corporation")',
        address: 'Address (street, city, etc.)',
        mobile_no: 'Mobile number (with country code if mentioned)',
        active: 'Active flag — boolean true or false',
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <VoiceInputFAB onDataReceived={handleVoiceData} promptContext={voiceSchema} />

            {/* Header */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Customer Master</h1>
                    <p className="text-sm text-gray-500">Manage customer records used across sales and dispatch.</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm"
                >
                    <Plus size={18} /> New Customer
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-[240px] max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by customer name…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                    <div className="ml-auto text-xs text-gray-500">
                        {total} {total === 1 ? 'customer' : 'customers'}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mobile</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Address</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-10 text-gray-400">
                                        <Loader2 className="inline animate-spin mr-2" size={16} /> Loading customers…
                                    </td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-12 text-gray-400">
                                        <Users className="inline mb-2" size={28} />
                                        <div>No customers yet.</div>
                                        <button
                                            onClick={openCreate}
                                            className="mt-3 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                                        >
                                            + Add your first customer
                                        </button>
                                    </td>
                                </tr>
                            ) : items.map(c => (
                                <tr key={c.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">{c.id}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.customer_name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {c.mobile_no ? (
                                            <span className="inline-flex items-center gap-1.5">
                                                <Phone size={13} className="text-gray-400" /> {c.mobile_no}
                                            </span>
                                        ) : <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={c.address || ''}>
                                        {c.address ? (
                                            <span className="inline-flex items-center gap-1.5">
                                                <MapPin size={13} className="text-gray-400 shrink-0" />
                                                <span className="truncate">{c.address}</span>
                                            </span>
                                        ) : <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${c.active
                                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                                            }`}>
                                            {c.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {total > itemsPerPage && (
                    <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                        <div>Page {currentPage} of {totalPages}</div>
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
                {showForm && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeForm}
                            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-gray-900">New Customer</h2>
                                    <button onClick={closeForm} className="p-1 hover:bg-gray-100 rounded">
                                        <X size={22} className="text-gray-500" />
                                    </button>
                                </div>

                                {formError && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                        {formError}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Customer Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.customer_name}
                                            onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                                            placeholder="Acme Corporation"
                                            autoFocus
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Mobile No</label>
                                        <input
                                            type="text"
                                            value={formData.mobile_no}
                                            onChange={e => setFormData({ ...formData, mobile_no: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                                            placeholder="+91-9876543210"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                        <textarea
                                            rows={3}
                                            value={formData.address}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 resize-none"
                                            placeholder="123 Industrial Way, Tech Park"
                                        />
                                    </div>

                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={formData.active}
                                            onChange={e => setFormData({ ...formData, active: e.target.checked })}
                                            className="w-4 h-4 accent-indigo-600"
                                        />
                                        <span className="text-sm text-gray-700">Active</span>
                                    </label>

                                    <div className="pt-2 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={closeForm}
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
                                            {submitting ? 'Saving…' : 'Save Customer'}
                                        </button>
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

export default CustomerMaster;
