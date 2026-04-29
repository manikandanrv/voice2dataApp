
import React, { useState, useEffect } from 'react';
import { Truck, FileText, CheckCircle, Search, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceInputFAB from '../components/VoiceInputFAB';

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

const SalesDispatch = () => {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [bagSize, setBagSize] = useState(50.0);
    const [packingList, setPackingList] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const voiceSchema = {
        bag_size: "Standard Bag Size (e.g. 50)",
        confirm: "Confirm Dispatch (yes/true)"
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/sales/orders?limit=100`);
            if (res.ok) {
                const data = await res.json();
                setOrders(data.items.filter(o => o.status !== 'Shipped') || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleVoiceData = (data) => {
        if (data.bag_size) setBagSize(data.bag_size);
        if (data.confirm && selectedOrder && packingList) {
            confirmDispatch();
        }
        alert("Voice data applied");
    };

    const generatePackingList = async () => {
        if (!selectedOrder) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/dispatch/packing-list`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sales_order_id: selectedOrder.id, bag_size_kg: parseFloat(bagSize) })
            });
            if (res.ok) setPackingList(await res.json());
            else alert("Failed to generate packing list");
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const confirmDispatch = async () => {
        if (!selectedOrder) return;
        if (!window.confirm(`Confirm dispatch for Order ${selectedOrder.order_no}?`)) return;

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/dispatch/confirm?sales_order_id=${selectedOrder.id}`, { method: 'POST' });
            if (res.ok) {
                alert("Dispatch Confirmed Successfully!");
                setSelectedOrder(null);
                setPackingList(null);
                fetchOrders();
            } else {
                const err = await res.json();
                alert(`Error: ${err.detail}`);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const filteredOrders = orders.filter(o =>
        o.order_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(o.customer_id).includes(searchTerm)
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 h-[calc(100vh-4rem)]">
            <VoiceInputFAB onDataReceived={handleVoiceData} promptContext={voiceSchema} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                {/* Left Panel: List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden h-full">
                    <div className="p-4 border-b border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Pending Orders</h2>
                            <button onClick={fetchOrders} className="text-gray-400 hover:text-indigo-600"><RefreshCw size={18} /></button>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search orders..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading && filteredOrders.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">Loading...</div>
                        ) : filteredOrders.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">No pending orders found</div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {filteredOrders.map(order => (
                                    <motion.div
                                        key={order.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        onClick={() => { setSelectedOrder(order); setPackingList(null); }}
                                        className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${selectedOrder?.id === order.id ? 'bg-indigo-50 border-l-4 border-indigo-500 pl-3' : ''
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-semibold text-gray-900">{order.order_no}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${order.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div className="text-sm text-gray-500">Customer ID: {order.customer_id}</div>
                                            <div className="text-xs font-medium text-gray-400">{new Date(order.order_date).toLocaleDateString()}</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Actions */}
                <div className="lg:col-span-2 space-y-6 flex flex-col h-full overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex-1">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Dispatch Management</h1>
                                <p className="text-sm text-gray-500">Generate packing lists and confirm shipments</p>
                            </div>
                            <Truck className="text-gray-200" size={48} />
                        </div>

                        {selectedOrder ? (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{selectedOrder.order_no}</h3>
                                            <p className="text-sm text-gray-500">Total Value: ₹{selectedOrder.total_amount?.toFixed(2)}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={bagSize}
                                                    onChange={e => setBagSize(e.target.value)}
                                                    className="w-24 pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">kg</span>
                                            </div>
                                            <button
                                                onClick={generatePackingList}
                                                disabled={loading}
                                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                            >
                                                <FileText size={18} /> Generate List
                                            </button>
                                        </div>
                                    </div>

                                    {packingList && (
                                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-lg border border-green-200 shadow-sm overflow-hidden mt-4">
                                            <div className="px-4 py-3 bg-green-50 border-b border-green-100 flex justify-between items-center">
                                                <div className="flex items-center gap-2 text-green-800 font-semibold">
                                                    <FileText size={18} />
                                                    Packing List: {packingList.packing_list_no}
                                                </div>
                                                <div className="text-sm text-green-700 font-medium">
                                                    {packingList.total_bags} Bags | {packingList.total_weight} Kg
                                                </div>
                                            </div>

                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
                                                        <th className="px-4 py-2 text-left font-medium">Item</th>
                                                        <th className="px-4 py-2 text-right font-medium">Qty</th>
                                                        <th className="px-4 py-2 text-right font-medium">Bags</th>
                                                        <th className="px-4 py-2 text-right font-medium">Loose</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {packingList.items.map((item, idx) => (
                                                        <tr key={idx}>
                                                            <td className="px-4 py-3 text-gray-900">{item.item_name}</td>
                                                            <td className="px-4 py-3 text-right text-gray-600">{item.quantity}</td>
                                                            <td className="px-4 py-3 text-right text-gray-600">{item.bags}</td>
                                                            <td className="px-4 py-3 text-right text-gray-600">{item.loose_kg || '-'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>

                                            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                                                <button
                                                    onClick={confirmDispatch}
                                                    disabled={loading}
                                                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 shadow-sm transition-colors"
                                                >
                                                    <CheckCircle size={18} /> Confirm Dispatch
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                                <Truck size={48} className="mb-3 opacity-20" />
                                <p className="font-medium">Select an order from the list to proceed</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesDispatch;
