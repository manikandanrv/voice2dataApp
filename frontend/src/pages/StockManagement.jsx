
import React, { useState, useEffect } from 'react';
import { Package, ArrowRightLeft, Search, RefreshCw, Send, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceInputFAB from '../components/VoiceInputFAB';

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

const StockManagement = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [stock, setStock] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Transfer State
    const [transferData, setTransferData] = useState({
        item_id: '',
        from_location: 'Puducherry', // Default
        to_location: 'HO',
        quantity: '',
        remarks: ''
    });

    const voiceSchema = {
        item_name: "Item Name to find or transfer",
        quantity: "Quantity to transfer",
        from_location: "Source Location",
        to_location: "Destination Location",
        remarks: "Reason for transfer"
    };

    useEffect(() => {
        fetchStock();
    }, []);

    const fetchStock = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/stock/current-stock`);
            if (res.ok) setStock(await res.json());
            else {
                // Fallback mock if API fails
                console.warn("API failed, using mock data");
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleVoiceData = (data) => {
        if (activeTab === 'transfer') {
            setTransferData(prev => ({ ...prev, ...data }));
        } else {
            // Search
            if (data.item_name) setSearchTerm(data.item_name);
        }
        alert("Voice Updated");
    };

    const handleTransfer = async () => {
        if (!transferData.item_id || !transferData.quantity) return alert("Please fill all fields");

        try {
            const res = await fetch(`${API_BASE}/stock/transfer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    item_id: parseInt(transferData.item_id),
                    from_location: transferData.from_location,
                    to_location: transferData.to_location,
                    quantity: parseFloat(transferData.quantity),
                    remarks: transferData.remarks
                })
            });

            if (res.ok) {
                alert("Transfer Successful!");
                setTransferData({ item_id: '', from_location: 'Puducherry', to_location: 'HO', quantity: '', remarks: '' });
                fetchStock();
            } else {
                alert("Transfer Failed");
            }
        } catch (err) { console.error(err); }
    };

    const filteredStock = stock.filter(item =>
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(item.id).includes(searchTerm)
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <VoiceInputFAB onDataReceived={handleVoiceData} promptContext={voiceSchema} />

            {/* Header with Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Stock Management</h1>
                    <p className="text-sm text-gray-500">Monitor inventory and Inter-unit transfers</p>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'overview'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Package size={16} /> Stock Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('transfer')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'transfer'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <ArrowRightLeft size={16} /> Stock Transfer
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'overview' ? (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {/* Search Bar */}
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search Items..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>
                            <button onClick={fetchStock} className="p-2 text-gray-400 hover:text-indigo-600 border border-transparent hover:border-gray-200 rounded-lg transition-all">
                                <RefreshCw size={20} />
                            </button>
                        </div>

                        {/* Stock Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50/50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Item Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Quantity</th>
                                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">UOM</th>
                                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Min Level</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {loading ? (
                                            <tr><td colSpan="5" className="text-center py-8 text-gray-500">Loading stock data...</td></tr>
                                        ) : filteredStock.length === 0 ? (
                                            <tr><td colSpan="5" className="text-center py-8 text-gray-500">No items found</td></tr>
                                        ) : (
                                            filteredStock.map(item => (
                                                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.item_name}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{item.category}</td>
                                                    <td className={`px-6 py-4 text-sm text-right font-bold ${item.quantity < item.min_level ? 'text-red-600' : 'text-green-700'
                                                        }`}>
                                                        {item.quantity}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-center text-gray-500">{item.uom}</td>
                                                    <td className="px-6 py-4 text-sm text-right text-gray-400">{item.min_level}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="transfer"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="max-w-2xl mx-auto"
                    >
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 bg-indigo-50/50">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <ArrowRightLeft className="text-indigo-600" size={20} />
                                    Inter-Unit Transfer
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">Move stock between locations</p>
                            </div>

                            <div className="p-6 space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Item to Transfer <span className="text-red-500">*</span></label>
                                    <select
                                        value={transferData.item_id}
                                        onChange={e => setTransferData({ ...transferData, item_id: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    >
                                        <option value="">Select Item</option>
                                        {stock.map(s => <option key={s.id} value={s.id}>{s.item_name} (Avail: {s.quantity} {s.uom})</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">From Location</label>
                                        <select
                                            value={transferData.from_location}
                                            onChange={e => setTransferData({ ...transferData, from_location: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        >
                                            <option>Puducherry</option>
                                            <option>HO</option>
                                            <option>Branch A</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">To Location</label>
                                        <select
                                            value={transferData.to_location}
                                            onChange={e => setTransferData({ ...transferData, to_location: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        >
                                            <option>HO</option>
                                            <option>Puducherry</option>
                                            <option>Branch A</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity <span className="text-red-500">*</span></label>
                                    <input
                                        type="number"
                                        value={transferData.quantity}
                                        onChange={e => setTransferData({ ...transferData, quantity: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                                    <input
                                        type="text"
                                        value={transferData.remarks}
                                        onChange={e => setTransferData({ ...transferData, remarks: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        placeholder="Reason for transfer..."
                                    />
                                </div>

                                <button
                                    onClick={handleTransfer}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-md transition-all active:scale-[0.98]"
                                >
                                    <Send size={18} /> Confirm Transfer
                                </button>
                            </div>
                        </div>

                        {/* Alert Info */}
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 flex gap-3">
                            <AlertTriangle className="shrink-0" size={20} />
                            <p>Transfers are immediate and will update stock levels in both source and destination locations. Please verify quantities physically before confirming.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StockManagement;
