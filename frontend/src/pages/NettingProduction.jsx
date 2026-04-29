
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Edit2, Trash2, ChevronLeft, ChevronRight, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceInputFAB from '../components/VoiceInputFAB';

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

const NettingProduction = () => {
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
    const [activeTab, setActiveTab] = useState('production');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Master Data
    const [masterData, setMasterData] = useState({
        machines: [],
        operators: [],
        shifts: []
    });

    // Form State
    const [formData, setFormData] = useState({
        entry_date: new Date().toISOString().split('T')[0],
        shift: 'Day',
        machine_no: '', // Netting uses machine_no
        operator_name: '',
        mesh_size: '',
        depth: '',
        knot_type: 'Single',
        weight: '',
        nylon_or_hdpe: 'Nylon',
        remarks: '',
        // Operations specific
        start_time: '',
        end_time: ''
    });

    // Fetch Master Data
    useEffect(() => {
        const fetchMasters = async () => {
            try {
                const [machinesRes, operatorsRes, shiftsRes] = await Promise.all([
                    fetch(`${API_BASE}/master/machines/`),
                    fetch(`${API_BASE}/master/operators/`),
                    fetch(`${API_BASE}/master/shifts/`)
                ]);

                const machinesData = await machinesRes.json();
                const operatorsData = await operatorsRes.json();
                const shiftsData = await shiftsRes.json();

                setMasterData({
                    machines: machinesData.items || [],
                    operators: operatorsData.items || [],
                    shifts: shiftsData.items?.map(s => s.shift_name) || []
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
            const response = await fetch(`${API_BASE}/netting/production?${queryParams}`);
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

    // Handlers
    const handleChange = (e) => {
        const { name, value } = e.target;

        // Auto-fill logic for Machine
        if (name === 'machine_no') {
            const selectedMachine = masterData.machines.find(m => m.machine_name === value);
            if (selectedMachine) {
                const settings = selectedMachine.operational_settings || {};
                setFormData(prev => ({
                    ...prev,
                    machine_no: value,
                    operator_name: settings.operator || prev.operator_name,
                    shift: settings.shift || prev.shift
                }));
                return;
            }
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleVoiceData = (data) => {
        if (!data) return;

        const mappedData = { ...data };
        if (data.machine_no) mappedData.machine_no = data.machine_no; // Ensure specific field name

        setFormData(prev => ({
            ...prev,
            ...mappedData,
            entry_date: mappedData.entry_date || prev.entry_date
        }));

        if (!showForm) setShowForm(true);
        alert("Voice data applied! Please review.");
    };

    const handleSubmit = async (e) => {
        e && e.preventDefault();
        try {
            let url = '';
            let method = 'POST';
            let payload = {};
            const common = { machine_name: formData.machine_no }; // Operations expect machine_name

            if (activeTab === 'production') {
                url = editingId
                    ? `${API_BASE}/netting/production/${editingId}`
                    : `${API_BASE}/netting/production`;
                method = editingId ? 'PUT' : 'POST';
                payload = {
                    ...formData,
                    mesh_size: parseFloat(formData.mesh_size || 0),
                    depth: parseFloat(formData.depth || 0),
                    weight: parseFloat(formData.weight || 0)
                };
            } else {
                if (!formData.machine_no) {
                    alert("Please select a machine first.");
                    return;
                }

                switch (activeTab) {
                    case 'shift_start':
                        url = `${API_BASE}/master/machines/operations/shift-start`;
                        payload = { ...common, shift: formData.shift, operator: formData.operator_name, start_time: formData.start_time };
                        break;
                    case 'shift_close':
                        url = `${API_BASE}/master/machines/operations/shift-close`;
                        payload = { ...common, shift: formData.shift, operator: formData.operator_name, end_time: formData.end_time };
                        break;
                    case 'machine_start':
                        url = `${API_BASE}/master/machines/operations/machine-start`;
                        payload = { ...common, start_time: formData.start_time };
                        break;
                    case 'machine_stop':
                        url = `${API_BASE}/master/machines/operations/machine-stop`;
                        payload = {
                            ...common,
                            end_time: formData.end_time,
                            // Netting specific stop usually just logs time, weight might be relevant
                            actual_weight: parseFloat(formData.weight || 0),
                            remarks: formData.remarks
                        };
                        break;
                    case 'operator_change':
                        url = `${API_BASE}/master/machines/operations/operator-change`;
                        payload = { ...common, operator: formData.operator_name, start_time: formData.start_time };
                        break;
                    default:
                        alert("Unknown Operation");
                        return;
                }
            }

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert("Saved Successfully!");
                if (activeTab === 'production') {
                    setShowForm(false);
                    setEditingId(null);
                    fetchEntries();
                }
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
        setActiveTab('production');
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this entry?')) {
            await fetch(`${API_BASE}/netting/production/${id}`, { method: 'DELETE' });
            fetchEntries();
        }
    };

    const voiceSchema = {
        machine_no: "Machine Number",
        shift: "Shift (Day/Night)",
        mesh_size: "Mesh Size",
        depth: "Depth",
        knot_type: "Knot Type (Single/Double)",
        weight: "Weight",
        operator_name: "Operator Name"
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <VoiceInputFAB onDataReceived={handleVoiceData} promptContext={voiceSchema} />

            {/* Header */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Netting Production</h1>
                    <p className="text-sm text-gray-500">Production Entry & Machine Operations</p>
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
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date/Shift</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Machine</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Details</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Weight</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? <tr><td colSpan="5" className="text-center py-4">Loading...</td></tr> : entries.map(entry => (
                                <tr key={entry.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4 text-sm">
                                        <div className="font-medium text-gray-900">{new Date(entry.entry_date).toLocaleDateString()}</div>
                                        <span className="text-xs text-gray-500">{entry.shift}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{entry.machine_no} <br /><span className="text-xs text-gray-400">{entry.operator_name}</span></td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {entry.mesh_size}mm / {entry.depth}md <br />
                                        <span className="text-xs text-gray-400">{entry.knot_type}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-right font-medium">{entry.weight}</td>
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
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Entry' : 'New Entry'}</h2>
                                    <button onClick={() => setShowForm(false)}><X size={24} className="text-gray-400 hover:text-gray-600" /></button>
                                </div>

                                {/* Tabs */}
                                <div className="flex gap-2 overflow-x-auto pb-4 mb-4 border-b border-gray-100">
                                    {[
                                        { id: 'production', label: 'Production' },
                                        { id: 'shift_start', label: 'Shift Start' },
                                        { id: 'shift_close', label: 'Shift Close' },
                                        { id: 'machine_start', label: 'Machine Start' },
                                        { id: 'machine_stop', label: 'Machine Stop' },
                                        { id: 'operator_change', label: 'Op. Change' }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Machine Selection (Common) */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Machine <span className="text-red-500">*</span></label>
                                        <select name="machine_no" value={formData.machine_no} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                            <option value="">Select Machine</option>
                                            {masterData.machines.map(m => <option key={m.id} value={m.machine_name}>{m.machine_name}</option>)}
                                        </select>
                                    </div>

                                    {/* Tab Content */}
                                    {activeTab === 'production' && (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                                    <input type="date" name="entry_date" value={formData.entry_date} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                                                    <select name="shift" value={formData.shift} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                                        <option value="">Select</option>
                                                        {masterData.shifts.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Operator</label>
                                                    <select name="operator_name" value={formData.operator_name} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                                        <option value="">Select</option>
                                                        {masterData.operators.map(o => <option key={o.id} value={o.operator_name}>{o.operator_name}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Knot Type</label>
                                                    <select name="knot_type" value={formData.knot_type} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                                        <option value="Single">Single</option>
                                                        <option value="Double">Double</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mesh Size (mm)</label>
                                                    <input type="number" step="0.1" name="mesh_size" value={formData.mesh_size} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Depth (md)</label>
                                                    <input type="number" step="0.1" name="depth" value={formData.depth} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg" />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg) <span className="text-red-500">*</span></label>
                                                    <input type="number" step="0.01" name="weight" value={formData.weight} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                                                    <select name="nylon_or_hdpe" value={formData.nylon_or_hdpe} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                                        <option value="Nylon">Nylon</option>
                                                        <option value="HDPE">HDPE</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                                                <input type="text" name="remarks" value={formData.remarks} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg" />
                                            </div>
                                        </>
                                    )}

                                    {activeTab === 'shift_start' && (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                                                    <select name="shift" value={formData.shift} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                                        <option value="">Select</option>
                                                        {masterData.shifts.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Operator</label>
                                                    <select name="operator_name" value={formData.operator_name} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                                        <option value="">Select</option>
                                                        {masterData.operators.map(o => <option key={o.id} value={o.operator_name}>{o.operator_name}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                                                <input type="time" name="start_time" value={formData.start_time} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg" />
                                            </div>
                                        </>
                                    )}

                                    {activeTab === 'shift_close' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                                                <input type="time" name="end_time" value={formData.end_time} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg" />
                                            </div>
                                        </>
                                    )}

                                    {activeTab === 'machine_start' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                                            <input type="time" name="start_time" value={formData.start_time} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg" />
                                        </div>
                                    )}

                                    {activeTab === 'machine_stop' && (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stop Time</label>
                                                    <input type="time" name="end_time" value={formData.end_time} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (Kg)</label>
                                                    <input type="number" step="0.01" name="weight" value={formData.weight} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                                                <input type="text" name="remarks" value={formData.remarks} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg" />
                                            </div>
                                        </>
                                    )}

                                    {activeTab === 'operator_change' && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">New Operator</label>
                                                <select name="operator_name" value={formData.operator_name} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                                    <option value="">Select</option>
                                                    {masterData.operators.map(o => <option key={o.id} value={o.operator_name}>{o.operator_name}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                                                <input type="time" name="start_time" value={formData.start_time} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg" />
                                            </div>
                                        </div>
                                    )}

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

export default NettingProduction;
