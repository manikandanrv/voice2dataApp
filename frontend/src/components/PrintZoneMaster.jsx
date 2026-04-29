import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, Printer, Server } from 'lucide-react';

const API_URL = `${import.meta.env.VITE_API_URL}/api/master`;

export default function PrintZoneMaster() {
    const [zones, setZones] = useState([]);
    const [units, setUnits] = useState([]);
    const [open, setOpen] = useState(false);
    const [currentZone, setCurrentZone] = useState({
        print_zone_name: '',
        print_zone_description: '',
        unit_name: '',
        printer_ip_address: '',
        zone_printer_name: '',
        packing_zone: '',
        is_server: false
    });
    const [isEdit, setIsEdit] = useState(false);

    useEffect(() => {
        fetchZones();
        fetchUnits();
    }, []);

    const fetchZones = async () => {
        try {
            const response = await fetch(`${API_URL}/print-zones/`);
            const data = await response.json();
            setZones(data.items || []);
        } catch (error) {
            console.error('Error fetching print zones:', error);
        }
    };

    const fetchUnits = async () => {
        try {
            const response = await fetch(`${API_URL}/units/?limit=100`);
            const data = await response.json();
            if (data && data.items) {
                setUnits(data.items.map(u => u.unit_name));
            }
        } catch (error) {
            console.error('Error fetching units:', error);
        }
    };

    const handleOpen = () => {
        setCurrentZone({
            print_zone_name: '',
            print_zone_description: '',
            unit_name: '',
            printer_ip_address: '',
            zone_printer_name: '',
            packing_zone: '',
            is_server: false
        });
        setIsEdit(false);
        setOpen(true);
    };

    const handleEdit = (zone) => {
        setCurrentZone(zone);
        setIsEdit(true);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleSave = async () => {
        try {
            let response;
            const method = isEdit ? 'PUT' : 'POST';
            const url = isEdit ? `${API_URL}/print-zones/${currentZone.id}` : `${API_URL}/print-zones/`;

            response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentZone)
            });

            if (response.ok) {
                fetchZones();
                handleClose();
            } else {
                console.error('Error saving print zone');
                alert('Error saving print zone. Please check details.');
            }
        } catch (error) {
            console.error('Error saving print zone:', error);
            alert('Error saving print zone. Please check details.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this print zone?')) {
            try {
                await fetch(`${API_URL}/print-zones/${id}`, { method: 'DELETE' });
                fetchZones();
            } catch (error) {
                console.error('Error deleting print zone:', error);
            }
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCurrentZone(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Styles matching MachineMaster.jsx
    const containerStyle = { padding: '2rem', maxWidth: '1200px', margin: '0 auto' };
    const pageTitleStyle = { fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', marginBottom: '2rem' };
    const cardStyle = { backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', marginBottom: '2rem' };
    const btnPrimaryStyle = { padding: '0.5rem 1rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' };
    const btnSecondaryStyle = { padding: '0.5rem 1rem', backgroundColor: '#94a3b8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' };
    const tableHeaderStyle = { padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#475569', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' };
    const tableCellStyle = { padding: '0.75rem', borderBottom: '1px solid #e2e8f0' };
    const inputStyle = { width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', marginBottom: '1rem' };
    const labelStyle = { display: 'block', marginBottom: '0.5rem', fontWeight: '500' };

    // Modal Styles
    const modalOverlayStyle = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    };
    const modalContentStyle = {
        backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '500px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto'
    };

    return (
        <div style={containerStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={pageTitleStyle}>Print Zone Master</h2>
                <button onClick={handleOpen} style={btnPrimaryStyle}>
                    <Plus size={18} /> Add Print Zone
                </button>
            </div>

            <div style={cardStyle}>
                <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr>
                                <th style={tableHeaderStyle}>Name</th>
                                <th style={tableHeaderStyle}>Description</th>
                                <th style={tableHeaderStyle}>Unit</th>
                                <th style={tableHeaderStyle}>Printer IP</th>
                                <th style={tableHeaderStyle}>Printer Name</th>
                                <th style={tableHeaderStyle}>Packing Zone</th>
                                <th style={tableHeaderStyle}>Is Server</th>
                                <th style={tableHeaderStyle}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {zones.map((zone) => (
                                <tr key={zone.id}>
                                    <td style={tableCellStyle}>{zone.print_zone_name}</td>
                                    <td style={tableCellStyle}>{zone.print_zone_description}</td>
                                    <td style={tableCellStyle}>{zone.unit_name}</td>
                                    <td style={tableCellStyle}>{zone.printer_ip_address}</td>
                                    <td style={tableCellStyle}>{zone.zone_printer_name}</td>
                                    <td style={tableCellStyle}>{zone.packing_zone}</td>
                                    <td style={tableCellStyle}>{zone.is_server ? "Yes" : "No"}</td>
                                    <td style={tableCellStyle}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={() => handleEdit(zone)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb' }}>
                                                <Edit size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(zone.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {zones.length === 0 && (
                                <tr>
                                    <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No print zones found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {open && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>{isEdit ? 'Edit Print Zone' : 'Add Print Zone'}</h3>

                        <div>
                            <label style={labelStyle}>Print Zone Name *</label>
                            <input
                                type="text"
                                name="print_zone_name"
                                value={currentZone.print_zone_name}
                                onChange={handleChange}
                                style={inputStyle}
                                required
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>Description</label>
                            <input
                                type="text"
                                name="print_zone_description"
                                value={currentZone.print_zone_description}
                                onChange={handleChange}
                                style={inputStyle}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>Unit Name</label>
                            <select
                                name="unit_name"
                                value={currentZone.unit_name || ''}
                                onChange={handleChange}
                                style={inputStyle}
                            >
                                <option value="">Select Unit</option>
                                {units.map(unit => (
                                    <option key={unit} value={unit}>{unit}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={labelStyle}>Printer IP Address</label>
                            <input
                                type="text"
                                name="printer_ip_address"
                                value={currentZone.printer_ip_address}
                                onChange={handleChange}
                                style={inputStyle}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>Printer Name</label>
                            <input
                                type="text"
                                name="zone_printer_name"
                                value={currentZone.zone_printer_name}
                                onChange={handleChange}
                                style={inputStyle}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>Packing Zone Redirection</label>
                            <select
                                name="packing_zone"
                                value={currentZone.packing_zone || ''}
                                onChange={handleChange}
                                style={inputStyle}
                            >
                                <option value="">None (Local Only)</option>
                                {zones.filter(z => z.id !== currentZone.id).map(z => (
                                    <option key={z.id} value={z.print_zone_name}>{z.print_zone_name}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    name="is_server"
                                    checked={currentZone.is_server}
                                    onChange={handleChange}
                                />
                                Is Server
                            </label>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button onClick={handleClose} style={{ ...btnSecondaryStyle, backgroundColor: '#cbd5e1', color: '#334155' }}>Cancel</button>
                            <button onClick={handleSave} style={btnPrimaryStyle}>Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
