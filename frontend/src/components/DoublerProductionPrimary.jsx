import { useState, useEffect } from 'react';

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

export default function DoublerProductionPrimary() {
    const [masterData, setMasterData] = useState({
        machines: [],
        doubler_machines: [],
        yarn_codes: [],
        units: [],
        trollies: [],
        operators: [],
        shifts: [],
        sizes: []
    });

    const [formData, setFormData] = useState({
        code_no: '',
        date: new Date().toISOString().split('T')[0],
        machine: '',
        wip: false,
        size_desc: '',
        lot_no: '',
        order_no: '',
        shift_name: '',
        unit: '',
        operator_name: '',
        order_type: 'DOMESTIC',
        lot_size_completed: false,
        start_time: '',
        end_time: '',
        no_of_spindles: 0,
        completed_status: false,
        doubler_sec_doff_no: '',
        actual_weight: 0,
        quantity: 0,
        remarks: '',
        enter_by: 'ADMIN'
    });

    // Accordion State
    const [expanded, setExpanded] = useState({
        parameter: true,
        sideA: true,
        sideB: true
    });

    const toggleSection = (section) => {
        setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
    };

    useEffect(() => {
        const fetchMasters = async () => {
            try {
                const [machinesRes, shiftsRes, operatorsRes] = await Promise.all([
                    fetch(`${API_BASE}/master/machines/`),
                    fetch(`${API_BASE}/master/shifts/`),
                    fetch(`${API_BASE}/master/operators/`)
                ]);

                const machinesData = await machinesRes.json();
                const shiftsData = await shiftsRes.json();
                const operatorsData = await operatorsRes.json();

                setMasterData(prev => ({
                    ...prev,
                    doubler_machines: machinesData.items?.map(i => i.machine_name) || [],
                    shifts: shiftsData.items?.map(i => i.shift_name) || [],
                    operators: operatorsData.items?.map(i => i.operator_name) || []
                }));
            } catch (err) {
                console.error("Error fetching master data:", err);
            }
        };
        fetchMasters();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleRadioChange = (name, val) => {
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const handleSubmit = async () => {
        try {
            const payload = {
                ...formData,
                actual_weight: parseFloat(formData.actual_weight || 0),
                quantity: parseFloat(formData.quantity || 0),
                no_of_spindles: parseInt(formData.no_of_spindles || 0)
            }
            const res = await fetch(`${API_BASE}/production/doubler-primary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                alert("Saved successfully!");
            } else {
                alert("Error saving data");
            }
        } catch (err) {
            console.error(err);
            alert("Error saving data");
        }
    };

    return (
        <div className="container">
            <h2 className="page-title">Doubler Production (Primary)</h2>

            {/* Top Header Card */}
            <div className="card">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div>
                        <div className="form-row">
                            <label className="form-label">Code No</label>
                            <input type="text" className="form-control" name="code_no" value={formData.code_no} onChange={handleChange} style={{ backgroundColor: '#f1f5f9' }} />
                            <input type="date" className="form-control" name="date" value={formData.date} onChange={handleChange} style={{ maxWidth: '160px' }} />
                        </div>
                        <div className="form-row">
                            <label className="form-label">Size Desc</label>
                            <select className="form-control" name="size_desc" value={formData.size_desc} onChange={handleChange}>
                                <option value="">-- Select --</option>
                                {masterData.sizes.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <div className="form-row">
                            <label className="form-label">Doubler M/C No</label>
                            <select className="form-control" name="machine" value={formData.machine} onChange={handleChange}>
                                <option value="">-- Select --</option>
                                {masterData.doubler_machines.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                                <input type="checkbox" name="wip" checked={formData.wip} onChange={handleChange} /> WIP
                            </label>
                        </div>
                        <div className="form-row">
                            <label className="form-label">Lot No</label>
                            <select className="form-control" name="lot_no" value={formData.lot_no} onChange={handleChange}>
                                <option value="">-- Select --</option>
                                <option value="L-101">L-101</option>
                            </select>
                            <button className="btn-add">Add +</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Accordion 1: Parameter Details */}
            <div className="section-header" onClick={() => toggleSection('parameter')}>
                <span>Parameter Details</span>
                <span style={{ color: '#94a3b8' }}>{expanded.parameter ? '▼' : '►'}</span>
            </div>
            {expanded.parameter && (
                <div className="section-body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                        <div className="form-row">
                            <label className="form-label">Order No</label>
                            <input type="text" className="form-control" name="order_no" value={formData.order_no} onChange={handleChange} />
                        </div>
                        <div className="form-row">
                            <label className="form-label">Shift</label>
                            <select className="form-control" name="shift_name" value={formData.shift_name} onChange={handleChange}>
                                <option value="">-- Select --</option>
                                {masterData.shifts.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="form-row">
                            <label className="form-label">Unit</label>
                            <select className="form-control" name="unit" value={formData.unit} onChange={handleChange}>
                                <option value="">-- Select --</option>
                                {masterData.units.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                        <div className="form-row">
                            <label className="form-label">Operator</label>
                            <select className="form-control" name="operator_name" value={formData.operator_name} onChange={handleChange}>
                                <option value="">-- Select --</option>
                                {masterData.operators.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                        <div className="form-row">
                            <label className="form-label">Order Type</label>
                            <div className="radio-group">
                                <label style={{ cursor: 'pointer' }}><input type="radio" checked={formData.order_type === 'DOMESTIC'} onChange={() => handleRadioChange('order_type', 'DOMESTIC')} /> DOMESTIC</label>
                            </div>
                        </div>
                        <div className="form-row">
                            <label className="form-label">Lot Size Completed</label>
                            <div className="radio-group">
                                <label style={{ cursor: 'pointer' }}><input type="radio" checked={formData.lot_size_completed === true} onChange={() => handleRadioChange('lot_size_completed', true)} /> Yes</label>
                                <label style={{ cursor: 'pointer' }}><input type="radio" checked={formData.lot_size_completed === false} onChange={() => handleRadioChange('lot_size_completed', false)} /> No</label>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Accordion 2: Side A */}
            <div className="section-header" onClick={() => toggleSection('sideA')}>
                <span>Observed Side A Details</span>
                <span style={{ color: '#94a3b8' }}>{expanded.sideA ? '▼' : '►'}</span>
            </div>
            {expanded.sideA && (
                <div className="section-body">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginBottom: '1.5rem' }}>
                        <div className="form-row">
                            <label className="form-label">Start Time</label>
                            <input type="time" className="form-control" name="start_time" value={formData.start_time} onChange={handleChange} />
                        </div>
                        <div className="form-row">
                            <label className="form-label">End Time</label>
                            <input type="time" className="form-control" name="end_time" value={formData.end_time} onChange={handleChange} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div className="form-row">
                            <label className="form-label">No.of Spindles</label>
                            <input type="number" className="form-control" name="no_of_spindles" value={formData.no_of_spindles} onChange={handleChange} style={{ width: '100px' }} />
                        </div>

                        <div style={{ display: 'flex', borderRadius: '20px', overflow: 'hidden', border: '1px solid #10b981', cursor: 'pointer' }}>
                            <div
                                style={{ padding: '0.4rem 1rem', fontSize: '0.9rem', background: formData.completed_status ? '#10b981' : 'white', color: formData.completed_status ? 'white' : '#10b981' }}
                                onClick={() => handleRadioChange('completed_status', true)}
                            >
                                Completed
                            </div>
                            <div
                                style={{ padding: '0.4rem 1rem', fontSize: '0.9rem', background: !formData.completed_status ? '#10b981' : 'white', color: !formData.completed_status ? 'white' : '#10b981' }}
                                onClick={() => handleRadioChange('completed_status', false)}
                            >
                                Not Completed
                            </div>
                        </div>

                        <div className="form-row">
                            <label className="form-label" style={{ width: 'auto' }}>Doubler Sec Doff No</label>
                            <input type="text" className="form-control" name="doubler_sec_doff_no" value={formData.doubler_sec_doff_no} onChange={handleChange} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginBottom: '1rem' }}>
                        <div className="form-row">
                            <label className="form-label">Actual Weight</label>
                            <input type="number" className="form-control" name="actual_weight" value={formData.actual_weight} onChange={handleChange} />
                        </div>
                        <div className="form-row">
                            <label className="form-label">Quantity (Kgs)</label>
                            <input type="number" className="form-control" name="quantity" value={formData.quantity} onChange={handleChange} style={{ backgroundColor: '#f1f5f9' }} />
                            <button className="btn-add">Add</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Accordion 3: Side B */}
            <div className="section-header" onClick={() => toggleSection('sideB')}>
                <span>Observed Side B Details</span>
                <span style={{ color: '#94a3b8' }}>{expanded.sideB ? '▼' : '►'}</span>
            </div>
            {expanded.sideB && (
                <div className="section-body">
                    <div className="form-row" style={{ width: '100%' }}>
                        <label className="form-label">Remarks</label>
                        <input type="text" className="form-control" name="remarks" value={formData.remarks} onChange={handleChange} style={{ flex: 1, maxWidth: 'none' }} />

                        <label className="form-label" style={{ width: 'auto', marginLeft: '2rem' }}>Enter By</label>
                        <input type="text" className="form-control" value="ADMIN" disabled style={{ width: '100px' }} />
                    </div>
                </div>
            )}


            <div className="action-buttons">
                <button className="btn-action btn-save" onClick={handleSubmit}>Save</button>
                <button className="btn-action btn-clear" onClick={() => window.location.reload()}>Clear</button>
                <button className="btn-action btn-list">List</button>
            </div>

        </div>
    );
}
