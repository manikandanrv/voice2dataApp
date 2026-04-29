
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Edit2, Trash2, ChevronLeft, ChevronRight, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceInputFAB from '../components/VoiceInputFAB';

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

const TFOPrimaryProduction = () => {
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
    orders: [],
    operators: [],
    shifts: []
  });

  // Form State
  const [formData, setFormData] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    shift: 'Day',
    machine: '',
    size: '',
    lot_no: '',
    order_no: '',
    standard_weight: '',
    operator_name: '',
    current_doff_no: '',
    side: 'A',
    tfo_winder_batch_no: '',
    start_time: '',
    end_time: '',
    no_of_spindles: '',
    doff_status: '',
    actual_weight: '',
    waste: '',
    remarks: ''
  });

  // Fetch Master Data
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [machinesRes, ordersRes, operatorsRes, shiftsRes] = await Promise.all([
          fetch(`${API_BASE}/master/machines/`),
          fetch(`${API_BASE}/master/orders/`),
          fetch(`${API_BASE}/master/operators/`),
          fetch(`${API_BASE}/master/shifts/`)
        ]);

        const machinesData = await machinesRes.json();
        const ordersData = await ordersRes.json();
        const operatorsData = await operatorsRes.json();
        const shiftsData = await shiftsRes.json();

        setMasterData({
          machines: machinesData.items || [],
          orders: ordersData.items || [],
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
      const response = await fetch(`${API_BASE}/production/tfo-primary/?${queryParams}`);
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
    if (name === 'machine') {
      const selectedMachine = masterData.machines.find(m => m.machine_name === value);
      if (selectedMachine) {
        // Try to pre-fill from operational settings if available
        const settings = selectedMachine.operational_settings || {};
        setFormData(prev => ({
          ...prev,
          machine: value,
          operator_name: settings.operator || prev.operator_name,
          shift: settings.shift || prev.shift,
          lot_no: settings.batch || prev.lot_no,
          size: settings.size || prev.size,
          standard_weight: settings.weight || prev.standard_weight
        }));
        return;
      }
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVoiceData = (data) => {
    if (!data) return;

    // Map voice fields to form fields
    const mappedData = { ...data };
    if (data.machine_name) mappedData.machine = data.machine_name;
    if (data.weight) mappedData.actual_weight = data.weight; // Ambiguity resolution

    setFormData(prev => ({
      ...prev,
      ...mappedData,
      // Preserve existing if not spoken
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

      // Common payloads
      const common = { machine_name: formData.machine };

      // Note: Endpoints for operations are distinct
      if (activeTab === 'production') {
        url = editingId
          ? `${API_BASE}/production/tfo-primary/${editingId}`
          : `${API_BASE}/production/tfo-primary/`;
        method = editingId ? 'PUT' : 'POST';
        payload = {
          ...formData,
          size: parseFloat(formData.size || 0),
          standard_weight: parseFloat(formData.standard_weight || 0),
          actual_weight: parseFloat(formData.actual_weight || 0),
          waste: parseFloat(formData.waste || 0),
          no_of_spindles: parseInt(formData.no_of_spindles || 0),
          current_doff_no: parseInt(formData.current_doff_no || 0)
        };
      } else {
        // Operations
        if (!formData.machine) {
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
              // Generic stop might expect no_of_bobbins, we map spindles or actual output
              no_of_bobbins: 0, // TFO Primary might not use bobbins count for stop logic same as Winder? 
              actual_weight: parseFloat(formData.actual_weight || 0),
              waste: parseFloat(formData.waste || 0),
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
      await fetch(`${API_BASE}/production/tfo-primary/${id}`, { method: 'DELETE' });
      fetchEntries();
    }
  };

  const voiceSchema = {
    machine_name: "Machine Name",
    shift: "Shift (Day/Night)",
    side: "Side (A/B)",
    lot_no: "Lot Number",
    tfo_winder_batch_no: "Winder Batch No",
    actual_weight: "Actual Weight",
    waste: "Waste",
    operator_name: "Operator Name",
    no_of_spindles: "Spindles Count"
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <VoiceInputFAB onDataReceived={handleVoiceData} promptContext={voiceSchema} />

      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">TFO Primary Production</h1>
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
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Batch/Lot</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Side</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Weight</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? <tr><td colSpan="6" className="text-center py-4">Loading...</td></tr> : entries.map(entry => (
                <tr key={entry.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 text-sm">
                    <div className="font-medium text-gray-900">{new Date(entry.entry_date).toLocaleDateString()}</div>
                    <span className="text-xs text-gray-500">{entry.shift}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{entry.machine} <br /><span className="text-xs text-gray-400">{entry.operator_name}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-600">{entry.lot_no} <br /><span className="text-xs text-gray-400">WB: {entry.tfo_winder_batch_no}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-600">{entry.side}</td>
                  <td className="px-6 py-4 text-sm text-right font-medium">{entry.actual_weight}</td>
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

                {/* TAB NAVIGATION */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  padding: '0.5rem 0.5rem 0 0.5rem',
                  borderBottom: '2px solid var(--primary-blue)',
                  marginBottom: '1.5rem'
                }}>
                  <style>{`
                        /* Hide scrollbar for Chrome/Safari */
                        .tab-scroll-container::-webkit-scrollbar {
                            display: none;
                        }
                    `}</style>
                  <div className="tab-scroll-container" style={{ display: 'flex', width: '100%', overflowX: 'auto' }}>
                    {[
                      { id: 'production', label: 'Production' },
                      { id: 'shift_start', label: 'Shift Start' },
                      { id: 'shift_close', label: 'Shift Close' },
                      { id: 'machine_start', label: 'Machine Start' },
                      { id: 'machine_stop', label: 'Machine Stop' },
                      { id: 'operator_change', label: 'Op. Change' }
                    ].map((tab, index) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                          padding: '0.75rem 2rem',
                          border: '1px solid #e2e8f0',
                          borderBottom: 'none',
                          borderRadius: '16px 16px 0 0',
                          background: activeTab === tab.id ? 'var(--primary-blue)' : '#f8fafc',
                          color: activeTab === tab.id ? '#fff' : '#64748b',
                          cursor: 'pointer',
                          fontWeight: '600',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.2s',
                          marginLeft: index === 0 ? '0' : '-30px',
                          zIndex: activeTab === tab.id ? 10 : index,
                          position: 'relative',
                          boxShadow: activeTab === tab.id ? '0 -4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
                          minWidth: '140px'
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Machine Selection (Common) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Machine <span className="text-red-500">*</span></label>
                    <select name="machine" value={formData.machine} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
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
                          <label className="block text-sm font-medium text-gray-700 mb-1">Side</label>
                          <select name="side" value={formData.side} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                            <option value="A">Side A</option>
                            <option value="B">Side B</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Lot No</label>
                          <input type="text" name="lot_no" value={formData.lot_no} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Winder Batch No</label>
                          <input type="text" name="tfo_winder_batch_no" value={formData.tfo_winder_batch_no} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                          <input type="number" step="0.01" name="size" value={formData.size} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Standard Weight</label>
                          <input type="number" step="0.01" name="standard_weight" value={formData.standard_weight} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Actual Weight <span className="text-red-500">*</span></label>
                          <input type="number" step="0.01" name="actual_weight" value={formData.actual_weight} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Waste</label>
                          <input type="number" step="0.01" name="waste" value={formData.waste} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg" />
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
                          <label className="block text-sm font-medium text-gray-700 mb-1">Production (Kg)</label>
                          <input type="number" step="0.01" name="actual_weight" value={formData.actual_weight} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg" />
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

export default TFOPrimaryProduction;
