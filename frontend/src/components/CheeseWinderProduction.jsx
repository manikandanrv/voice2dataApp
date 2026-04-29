import { useState, useEffect } from 'react';

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

export default function CheeseWinderProduction() {
    const [masterData, setMasterData] = useState({
        machines: [],
        yarn_codes: [], // Actually code/size combos
        shifts: [],
        operators: [],
        units: []
    });

    const [formData, setFormData] = useState({
        machine_name: '',
        shift_name: '',
        operator_name: '',
        start_time: '',
        end_time: '',

        // Production Fields
        code: '',
        size: '',
        batch_no: '',
        weight: '',
        counter: '',
        cheeses_per_bag: '',

        // Stop Fields
        actual_cheeses: '',
        actual_weight: '',
        waste: '',
        remarks: '',
    });

    const [machineState, setMachineState] = useState(null); // To store full machine object for display

    // New Bag Scan Logic
    const [scanData, setScanData] = useState({
        source_type: 'Doubler', // Default
        source_id: '',
        scanned_details: null, // response from /scan-source
        bag_plan: '', // Calculated text
        active_bag_found: null // response from /active-bag
    });

    // Fetch Masters
    useEffect(() => {
        const fetchMasters = async () => {
            try {
                const [machinesRes, shiftsRes, operatorsRes, unitsRes, sizesRes] = await Promise.all([
                    fetch(`${API_BASE}/master/machines/?limit=1000`),
                    fetch(`${API_BASE}/master/shifts/`),
                    fetch(`${API_BASE}/master/operators/`),
                    fetch(`${API_BASE}/master/units/`),
                    fetch(`${API_BASE}/master/twine-sizes/`)
                ]);

                // Check for individual errors
                const responses = [machinesRes, shiftsRes, operatorsRes, unitsRes, sizesRes];
                const rNames = ['machines', 'shifts', 'operators', 'units', 'sizes'];
                for (let i = 0; i < responses.length; i++) {
                    if (!responses[i].ok) {
                        alert(`Failed to load ${rNames[i]}: ${responses[i].status}`);
                        throw new Error(`Failed to load ${rNames[i]}`);
                    }
                }

                const machinesData = await machinesRes.json();
                // Show only Cheese Winder machines across all locations - CASE INSENSITIVE & TRIMMED
                const machinesList = (machinesData.items || []).filter(m => {
                    const type = (m.machine_type || '').trim().toLowerCase();
                    return type === 'cheese winder' || type.includes('cheese winder');
                });

                const shiftsList = (await shiftsRes.json()).items?.map(i => i.shift_name) || [];
                const operatorsList = (await operatorsRes.json()).items || [];
                const unitsList = (await unitsRes.json()).items?.map(i => i.unit_name) || [];
                const twineSizes = (await sizesRes.json()).items || [];

                setMasterData(prev => ({
                    ...prev,
                    machines: machinesList,
                    shifts: shiftsList,
                    operators: operatorsList,
                    units: unitsList,
                    yarn_codes: twineSizes
                }));
            } catch (err) {
                console.error("Error fetching masters:", err);
                alert("Critical Error Loading Master Data: " + err.message);
            }
        };
        fetchMasters();
    }, []);

    // Effect to pre-fill cheese count when opening Close Bag tab
    const fetchOperatorsForMachine = async (location, machineType) => {
        try {
            const res = await fetch(`${API_BASE}/master/machines/operations/get-operator-list`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ location_name: location, machine_type: machineType })
            });
            if (res.ok) {
                const ops = await res.json();
                setMasterData(prev => ({ ...prev, operators: ops }));
            }
        } catch (err) {
            console.error("Error fetching operators:", err);
        }
    };


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'machine_name') {
            const m = masterData.machines.find(mach => mach.machine_name === value);
            setMachineState(m || null);
            if (m) {
                // Auto-fill existing state
                const settings = m.operational_settings || {};
                setFormData(prev => ({
                    ...prev,
                    machine_name: value,
                    shift_name: settings.shift || '',
                    operator_name: settings.operator || '',
                    code: settings.code || '',
                    size: settings.size || '',
                    batch_no: settings.batch_no || ''
                }));
                // Fetch location-specific operators
                fetchOperatorsForMachine(m.unit, "Cheese Winder");
            }
        }
    };

    const [activeTab, setActiveTab] = useState('status');



    // Effect to pre-fill cheese count when opening Close Bag tab
    useEffect(() => {
        if (activeTab === 'close_bag' && machineState?.operational_settings?.cheeses_per_bag) {
            setFormData(prev => ({
                ...prev,
                actual_cheeses: machineState.operational_settings.cheeses_per_bag.toString()
            }));
        }
    }, [activeTab, machineState]);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'status':
                return (
                    <div className="form-section" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px' }}>
                        <h3 className="section-header">Machine Status</h3>
                        {machineState ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div><strong>Status:</strong> <span style={{
                                    color: machineState.operational_settings?.status === 'Running' ? 'green' : 'red', fontWeight: 'bold'
                                }}>{machineState.operational_settings?.status || 'Unknown'}</span></div>
                                <div><strong>Bag No:</strong> <span style={{ color: 'blue', fontWeight: 'bold' }}>{machineState.operational_settings?.current_bag_no || 'None'}</span></div>
                                <div><strong>Code:</strong> {machineState.operational_settings?.code}</div>
                                <div><strong>Size:</strong> {machineState.operational_settings?.size}</div>
                                <div><strong>Batch:</strong> {machineState.operational_settings?.batch_no}</div>
                                <div><strong>Tube:</strong> {machineState.operational_settings?.tube_type} ({machineState.operational_settings?.tube_size})</div>
                                <div><strong>Counter:</strong> {machineState.operational_settings?.counter}</div>


                                {machineState.operational_settings?.bag_details && machineState.operational_settings.bag_details.length > 0 && (
                                    <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                                        <strong>Current Bag Scans:</strong>
                                        <table className="table table-sm" style={{ width: '100%', fontSize: '0.85rem' }}>
                                            <thead>
                                                <tr><th>Time</th><th>QR Code</th><th>Doubler</th><th>Doff</th></tr>
                                            </thead>
                                            <tbody>
                                                {machineState.operational_settings.bag_details.map((d, i) => (
                                                    <tr key={i}>
                                                        <td>{new Date(d.scanned_at).toLocaleTimeString()}</td>
                                                        <td>{d.qr_code}</td>
                                                        <td>{d.doubler_no}</td>
                                                        <td>{d.doff_no}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ) : <p>Select a machine to view status.</p>}
                    </div>
                );
            case 'new_bag':
                return (
                    <div className="form-section">
                        <h4>Scan Source for New Bag</h4>

                        <div className="form-row">
                            <label className="form-label">Source Type</label>
                            <select
                                className="form-control"
                                value={scanData.source_type}
                                onChange={(e) => setScanData(prev => ({ ...prev, source_type: e.target.value }))}
                            >
                                <option value="Doubler">Doubler Secondary</option>
                                <option value="TFO">TFO Secondary</option>
                            </select>
                        </div>

                        <div className="form-row">
                            <label className="form-label">Source ID / QR</label>
                            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                                <input
                                    className="form-control"
                                    value={scanData.source_id}
                                    onChange={(e) => setScanData(prev => ({ ...prev, source_id: e.target.value }))}
                                    placeholder="Scan or Enter ID"
                                    autoFocus
                                />
                                <button className="btn btn-primary" onClick={handleScanSource}>
                                    Scan/Fetch
                                </button>
                            </div>
                        </div>

                        {scanData.scanned_details && (
                            <div style={{ marginTop: '1rem', padding: '1rem', background: '#e0f2fe', borderRadius: '4px' }}>
                                <h5>Batch Details</h5>
                                <p><strong>Size:</strong> {scanData.scanned_details.size}</p>
                                <p><strong>Bobbins:</strong> {scanData.scanned_details.bobbins}</p>
                                <p><strong>Weight:</strong> {scanData.scanned_details.weight}</p>
                                <p><strong>Plan:</strong> {scanData.bag_plan}</p>

                                {scanData.scanned_details.previous_bags && scanData.scanned_details.previous_bags.length > 0 && (
                                    <div style={{ marginTop: '1rem', borderTop: '1px solid #ccc', paddingTop: '0.5rem' }}>
                                        <h6 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#334155' }}>Previous Bags from this Batch</h6>
                                        <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                                            <table className="table table-sm" style={{ fontSize: '0.8rem', width: '100%', marginBottom: 0 }}>
                                                <thead style={{ background: '#f1f5f9', position: 'sticky', top: 0 }}>
                                                    <tr>
                                                        <th style={{ padding: '4px 8px' }}>Bag No</th>
                                                        <th style={{ padding: '4px 8px' }}>Time</th>
                                                        <th style={{ padding: '4px 8px' }}>Cheeses</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {scanData.scanned_details.previous_bags.map((b, i) => (
                                                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                            <td style={{ padding: '4px 8px' }}>{b.bag_no}</td>
                                                            <td style={{ padding: '4px 8px' }}>{b.created_at}</td>
                                                            <td style={{ padding: '4px 8px' }}>{b.cheeses}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {scanData.active_bag_found ? (
                                    <div style={{ marginTop: '1rem', borderTop: '1px solid #ccc', paddingTop: '0.5rem' }}>
                                        <p style={{ color: 'red', fontWeight: 'bold' }}>Active Bag Found: {scanData.active_bag_found.bag_no}</p>
                                        <p>Running on: {scanData.active_bag_found.machine_name}</p>
                                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                            <button className="btn btn-warning" onClick={handleJoinBag}>
                                                Join Bag {scanData.active_bag_found.bag_no}
                                            </button>

                                            {!scanData.active_bag_found.is_same_batch && (
                                                <div style={{ marginTop: '10px', padding: '10px', background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: '4px' }}>
                                                    <strong style={{ color: '#b45309' }}>⚠ Batch Mismatch!</strong>
                                                    <p style={{ fontSize: '0.9rem', margin: '5px 0' }}>
                                                        Active Bag is running <strong>{scanData.active_bag_found.active_doubler} Doff {scanData.active_bag_found.active_doff}</strong>.
                                                        <br />
                                                        You scanned <strong>{scanData.scanned_details.machine_name} Doff {scanData.scanned_details.doff_no}</strong>.
                                                    </p>
                                                    <div className="form-group">
                                                        <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Produced Cheeses from Old Batch (Before Switch):</label>
                                                        <input
                                                            type="number"
                                                            className="form-control form-control-sm"
                                                            placeholder="Enter count (e.g. 50)"
                                                            value={formData.prev_batch_cheeses || ''}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, prev_batch_cheeses: e.target.value }))}
                                                        />
                                                        <small style={{ color: '#666' }}>Enter 0 if no production yet directly from old batch.</small>
                                                    </div>

                                                    <div className="form-group" style={{ marginTop: '10px' }}>
                                                        <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>For the NEXT bag, continue with:</label>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                            <label>
                                                                <input
                                                                    type="radio"
                                                                    name="next_batch_choice"
                                                                    value="new"
                                                                    checked={formData.update_settings !== false} // Default true
                                                                    onChange={() => setFormData(prev => ({ ...prev, update_settings: true }))}
                                                                />
                                                                <span style={{ marginLeft: '5px' }}>
                                                                    <strong>New Doff</strong> ({scanData.scanned_details.doubler_no} Doff {scanData.scanned_details.doff_no})
                                                                </span>
                                                            </label>
                                                            <label>
                                                                <input
                                                                    type="radio"
                                                                    name="next_batch_choice"
                                                                    value="old"
                                                                    checked={formData.update_settings === false}
                                                                    onChange={() => setFormData(prev => ({ ...prev, update_settings: false }))}
                                                                />
                                                                <span style={{ marginLeft: '5px' }}>
                                                                    <strong>Current Doff</strong> ({scanData.active_bag_found.active_doubler} Doff {scanData.active_bag_found.active_doff})
                                                                </span>
                                                            </label>
                                                        </div>
                                                        <small style={{ color: '#666' }}>
                                                            {formData.update_settings !== false
                                                                ? "Machine settings will be updated to the New Doff immediately."
                                                                : "Machine settings will remain on Current Doff. This scan is treated as a temporary mix."}
                                                        </small>
                                                    </div>
                                                </div>
                                            )}
                                            <button className="btn btn-secondary" onClick={() => handleSubmit(null)}>
                                                Force New Bag
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ marginTop: '1rem' }}>
                                        <p style={{ color: 'green' }}>No active bag found for this Batch.</p>
                                        <button className="btn btn-success" onClick={() => handleSubmit(null)}>
                                            Start New Bag
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        {!scanData.scanned_details && (
                            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '10px' }}>Enter ID and click Scan/Fetch to proceed.</p>
                        )}
                    </div>
                );
            case 'close_bag':
                return (
                    <div className="form-section">
                        <h4>Close Bag & Record Production</h4>
                        <div style={{ padding: '1rem', background: '#ffe4e6', borderRadius: '4px', marginBottom: '1rem', textAlign: 'center' }}>
                            <span style={{ display: 'block', fontSize: '0.9rem', color: '#881337' }}>Current Active Bag</span>
                            <strong style={{ fontSize: '1.5rem', color: '#be123c' }}>{machineState?.operational_settings?.current_bag_no || 'No Active Bag'}</strong>
                        </div>
                        <div className="form-row">
                            <label className="form-label">Cheeses in Bag *</label>
                            <input type="number" className="form-control" name="actual_cheeses" value={formData.actual_cheeses} onChange={handleChange} placeholder={machineState?.operational_settings?.cheeses_per_bag || ''} />
                        </div>
                        <div className="form-row">
                            <label className="form-label">Actual Weight (kg)</label>
                            <input type="number" step="0.001" className="form-control" name="actual_weight" value={formData.actual_weight} onChange={handleChange} placeholder="0.000" />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button className="btn btn-warning" onClick={() => handleSubmit('stop')} style={{ flex: 1, padding: '0.75rem', fontWeight: 'bold' }}>
                                Close & Stop (Remove Bag)
                            </button>
                            <button className="btn btn-success" onClick={() => handleSubmit('continue')} style={{ flex: 1, padding: '0.75rem', fontWeight: 'bold' }}>
                                Close & Continue (Next Bag)
                            </button>
                        </div>
                    </div>
                );
            case 'code_change':
                return (
                    <div className="form-section">
                        <div className="form-row">
                            <label className="form-label">Size (Twine Size) *</label>
                            <input
                                className="form-control"
                                list="size-options"
                                name="size"
                                value={formData.size}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const selectedSize = masterData.yarn_codes.find(s => s.twine_size === val);
                                    setFormData(prev => ({
                                        ...prev,
                                        size: val,
                                        code: selectedSize ? selectedSize.twine_size_description : ''
                                    }));
                                }}
                                placeholder="Search or Select Size"
                            />
                            <datalist id="size-options">
                                {masterData.yarn_codes.map(s => (
                                    <option key={s.id} value={s.twine_size} />
                                ))}
                            </datalist>
                        </div>
                        <div className="form-row">
                            <label className="form-label">Code (Auto-filled)</label>
                            <div style={{ padding: '0.4rem', background: '#e2e8f0', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                                {formData.code || <em>Select a Size needed</em>}
                            </div>
                        </div>
                    </div>
                );
            case 'machine_start':
                return (
                    <div className="form-section">
                        <div className="form-row"><label className="form-label">Start Time *</label><input type="time" className="form-control" name="start_time" value={formData.start_time} onChange={handleChange} /></div>
                    </div>
                );
            case 'machine_stop':
                return (
                    <div className="form-section">
                        <h4>Stop Machine (Pause)</h4>
                        <p>Use "Close Bag" to finish a bag and record production.</p>
                        <div className="form-row"><label className="form-label">Stop Time</label><input type="time" className="form-control" name="end_time" value={formData.end_time} onChange={handleChange} /></div>
                    </div>
                );
            case 'batch_change':
                return (
                    <div className="form-section">
                        <div className="form-row"><label className="form-label">New Batch No *</label><input className="form-control" name="batch_no" value={formData.batch_no} onChange={handleChange} /></div>
                    </div>
                );
            case 'update_counter':
                return (
                    <div className="form-section">
                        <div className="form-row"><label className="form-label">Current Counter *</label><input className="form-control" name="counter" value={formData.counter} onChange={handleChange} /></div>
                    </div>
                );
            case 'shift_start':
                return (
                    <div className="form-section">
                        <div className="form-row"><label className="form-label">Start Time *</label><input type="time" className="form-control" name="start_time" value={formData.start_time} onChange={handleChange} /></div>
                    </div>
                );
            case 'shift_end':
                return (
                    <div className="form-section">
                        <div className="form-row"><label className="form-label">End Time *</label><input type="time" className="form-control" name="end_time" value={formData.end_time} onChange={handleChange} /></div>
                    </div>
                );
            case 'shift_change':
                return (
                    <div className="form-section">
                        <h4>Shift Change (Seamless)</h4>
                        <div className="form-row"><label className="form-label">New Shift *</label>
                            <select className="form-control" name="shift_name" value={formData.shift_name} onChange={handleChange}>
                                <option value="">-- SELECT --</option>
                                {masterData.shifts.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="form-row"><label className="form-label">New Operator *</label>
                            <select className="form-control" name="operator_name" value={formData.operator_name} onChange={handleChange}>
                                <option value="">-- Select --</option>
                                {masterData.operators.map(o => (
                                    <option key={o.id} value={o.operator_name}>
                                        {o.operator_name} {o.operator_code ? `(${o.operator_code})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    // --- Advanced Logic Handlers ---
    const handleScanSource = async () => {
        if (!scanData.source_id) return alert("Enter Source ID");
        try {
            // 1. Scan Source
            const res = await fetch(`${API_BASE}/master/machines/cwoperations/scan-source`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ source_type: scanData.source_type, source_id: parseInt(scanData.source_id) })
            });

            if (!res.ok) throw new Error(await res.text());
            const details = await res.json();

            // 2. Calculate Plan
            // 2. Calculate Plan
            // Assumptions: 900g/cheese, 66/bag? Or fetch from Master? For now assume defaults.
            const cheeseWeight = 0.9; // kg
            const cheesesPerBag = 66;

            // Total Batch Weight = Bobbins * Unit Weight
            const unitWeight = details.weight || 0;
            const bobbins = details.bobbins || details.no_of_bobbins || 0;
            const totalWeight = bobbins * unitWeight;

            const approxCheeses = Math.floor(totalWeight / cheeseWeight);
            const bags = Math.floor(approxCheeses / cheesesPerBag);
            const loose = approxCheeses % cheesesPerBag;

            const planText = `Yields ~${approxCheeses} Cheeses. Est: ${bags} Bags + ${loose} Loose.`;

            // 3. Check Active Bag (Strict Batch Match)
            // Use machine_name as doubler_no
            const activeRes = await fetch(`${API_BASE}/master/machines/cwoperations/active-bag?size=${details.size}&doubler_no=${details.machine_name}&doff_no=${details.doff_no}&current_machine_name=${formData.machine_name}`);
            const activeData = await activeRes.json();
            const activeBag = activeData.active_bags?.[0]; // Just take first if multiple?

            setScanData(prev => ({
                ...prev,
                scanned_details: details,
                bag_plan: planText,
                active_bag_found: activeBag
            }));

            // Update Form Data for submission
            setFormData(prev => ({ ...prev, size: details.size, batch_no: details.batch_no }));

        } catch (err) {
            alert("Scan Failed: " + err.message);
        }
    };

    const handleJoinBag = async () => {
        if (!scanData.active_bag_found) return;
        try {
            // Calculate Payload
            const payload = {
                machine_name: formData.machine_name,
                bag_no: scanData.active_bag_found.bag_no,
                size: scanData.scanned_details.size,
                // New Batch Info
                doubler_no: scanData.scanned_details.machine_name,
                doff_no: scanData.scanned_details.doff_no,
                // Checkpoint
                previous_batch_cheeses: parseInt(formData.prev_batch_cheeses || 0),
                // User Choice for Next Batch
                update_settings: formData.update_settings !== false // Default true unless explicitly false
            };

            // Validation for Mismatch
            if (!scanData.active_bag_found.is_same_batch) {
                if (!formData.prev_batch_cheeses && formData.prev_batch_cheeses !== 0 && formData.prev_batch_cheeses !== '0') {
                    if (!window.confirm("Batch Mismatch! You haven't entered 'Produced Cheeses from Old Batch'. Are you sure it is 0?")) {
                        return;
                    }
                }
            }

            console.log("Join Payload:", payload);
            const res = await fetch(`${API_BASE}/master/machines/cwoperations/join-bag`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const txt = await res.text();
                alert("Join Failed (Server Error): " + txt);
                throw new Error(txt);
            }
            alert("Joined Bag successfully!");
            // Refresh machine data only, don't re-submit
            handleChange({ target: { name: 'machine_name', value: formData.machine_name } });
            // Or better: clear scan data and fetch machine
            // We can just call fetchMachineDetails if exposed, or re-simulate selection
            // But handleMachineSelect expects an event.
            // Let's create a helper or just manually fetch.
            // Actually, handleMachineSelect sets machine and calls fetch.
            // But we already have machine set.
            // Let's just create a quick refresher or reuse a part of handleMachineSelect logic?
            // "handleSubmit('', true)" was intended to just refresh but "handleSubmit" constructs a POST request based on activeTab.
            // If activeTab is "new_bag", it tries to create a bag again! That's the bug.

            // FIX: Just clear scan data and maybe fetch active bag again?
            setScanData({ scanned_details: null, bag_plan: null, source_id: null, source_type: null, active_bag_found: null });

            // We want to return to "Main" state or refresh the dashboard?
            // Maybe just clear the form or reload the machine details?
            // The UI updates based on "machine_name".
            // Let's force a refresh of the machine state if there's a hook for it.
            // Looking at the code, "fetchMachineDetails" isn't visible here.

            // Simplest fix: Just reset scan portion.
            setActiveTab('new_bag'); // Reset tab?
            // And maybe clear the "prev_batch_cheeses"
            setFormData(prev => ({ ...prev, prev_batch_cheeses: '' }));
        } catch (err) {
            alert("Join Failed: " + err.message);
        }
    };

    const handleSubmit = async (actionArg) => {
        if (!formData.machine_name) {
            alert("Please select a machine first.");
            return;
        }

        let url = `${API_BASE}/master/machines/cwoperations`;
        let payload = { machine_name: formData.machine_name };

        switch (activeTab) {
            case 'new_bag':
                url += '/new-bag';
                if (scanData.source_id && scanData.scanned_details) {
                    payload = {
                        ...payload,
                        source_id: scanData.source_id.toString(),
                        source_type: scanData.source_type,
                        qr_code: null
                    };
                } else {
                    payload = { ...payload, qr_code: formData.qr_code };
                }
                break;
            case 'close_bag':
                url += '/close-bag';
                payload = {
                    ...payload,
                    actual_cheeses: parseInt(formData.actual_cheeses || 0),
                    actual_weight: parseFloat(formData.actual_weight || 0),
                    waste: parseFloat(formData.waste || 0),
                    remarks: formData.remarks,
                    action: actionArg || 'stop'
                };
                break;
            case 'code_change':
                url += '/code-change';
                payload = {
                    ...payload,
                    code: formData.code || "",
                    size: formData.size || ""
                };
                break;
            case 'machine_start':
                url += '/machine-start';
                payload = { ...payload, start_time: formData.start_time };
                break;
            case 'machine_stop':
                url += '/machine-stop';
                payload = { ...payload, end_time: formData.end_time }; // Only end_time needed now
                break;
            case 'batch_change':
                url += '/batch-change';
                payload = {
                    ...payload,
                    batch_no: formData.batch_no || ""
                };
                break;
            case 'update_counter':
                url += '/cheese-counter-update';
                payload = {
                    ...payload,
                    counter: parseInt(formData.counter || 0)
                };
                break;
            case 'shift_start':
                url += '/shift-start';
                payload = { ...payload, shift_start_time: formData.start_time };
                break;
            case 'shift_end':
                url += '/shift-end';
                payload = { ...payload, shift: formData.shift_name, operator: formData.operator_name, shift_end_time: formData.end_time };
                break;
            case 'shift_change':
                url += '/shift-change';
                payload = {
                    ...payload,
                    new_shift: formData.shift_name,
                    new_operator: formData.operator_name
                };
                break;
            default:
                console.log("No action for status tab");
                return;
        }

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                alert("Action Successful: " + (data.message || 'Done'));
                // Clear inputs if needed (e.g., qr_code)
                if (activeTab === 'new_bag') setFormData(prev => ({ ...prev, qr_code: '' }));

                // Refresh machine state
                const mRes = await fetch(`${API_BASE}/master/machines/`);
                const mData = await mRes.json();
                const m = (mData.items || []).find(mach => mach.machine_name === formData.machine_name);
                setMachineState(m);
                if (m) {
                    const settings = m.operational_settings || {};
                    const currentStatus = settings.status || (settings.start_time && !settings.end_time ? "Running" : "Stopped");

                    setFormData(prev => ({
                        ...prev,
                        shift_name: settings.shift || '',
                        operator_name: settings.operator || '',
                        code: settings.code || '',
                        size: settings.size || '',
                        batch_no: settings.batch_no || '',
                        weight: settings.weight || '',
                        counter: settings.counter || '',
                        cheeses_per_bag: settings.cheeses_per_bag || '',
                        tube_type: settings.tube_type || '', // Auto-fetch
                        tube_size: settings.tube_size || '',
                        status: currentStatus,
                        current_bag_no: settings.current_bag_no || '',
                        bag_entry_time: settings.bag_start_time || ''
                    }));
                }
            } else {
                alert("Error: " + JSON.stringify(data));
            }
        } catch (e) {
            alert("Network Error: " + e.message);
        }
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h2>Cheese Winder Production</h2>
            <div className="form-row">
                <label className="form-label">Select Machine</label>
                <select className="form-control" name="machine_name" value={formData.machine_name} onChange={handleChange} style={{ maxWidth: '300px' }}>
                    <option value="">-- SELECT --</option>
                    {masterData.machines.map(m => <option key={m.id} value={m.machine_name}>{m.machine_name}</option>)}
                </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', margin: '2rem 0', flexWrap: 'wrap' }}>
                {['status', 'new_bag', 'close_bag', 'machine_start', 'machine_stop', 'batch_change', 'code_change', 'update_counter', 'shift_start', 'shift_end', 'shift_change'].map(tab => (
                    <button
                        key={tab}
                        className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '0.5rem 0.8rem',
                            background: activeTab === tab ? '#2563eb' : '#e2e8f0',
                            color: activeTab === tab ? 'white' : 'black',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                        }}
                    >
                        {tab.replace(/_/g, ' ').toUpperCase()}
                    </button>
                ))}
            </div>

            {renderTabContent()}

            {activeTab !== 'status' && activeTab !== 'close_bag' && (
                <button className="btn btn-primary" onClick={() => handleSubmit()} style={{ marginTop: '1rem', padding: '0.75rem 2rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    SUBMIT
                </button>
            )}
        </div>
    );
}
