
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, token, logout, hasPermission } = useAuth();

    if (!token) {
        return (
            <nav className="navbar" style={{ justifyContent: 'center' }}>
                <Link to="/" className="nav-link" style={{ fontWeight: 800, fontSize: '1.25rem', color: '#2563eb' }}>
                    CFN ERP
                </Link>
            </nav>
        );
    }

    const menuStructure = {
        "Sales": ["Sales Order", "Sales Dispatch", "Invoicing", "Customer Master", "Price List"],
        "Purchase": ["Purchase Order", "Vendor Mgmt"],
        "Stores": ["Inventory", "Stock Check", "Goods Receipt (GRN)", "Stock Management"],
        "Gate": ["Gate Entry", "Exit"],
        "Master": [
            "Machine Master",
            "Machine Type Master",
            "Operator Master",
            "Cheese Winder Pairing",
            "Shift Master",
            "Supplier Master",
            {
                "Yarn Masters": [
                    "Yarn Denier Master",
                    "Yarn Color Master",
                    "Yarn Type Master",
                    "Yarn Supplier Master",
                    "Yarn Merge Master",
                    "Yarn Composition Master"
                ]
            },
            {
                "Twine Masters": [
                    "Twine Size Master",
                    "Twine Twist Master",
                    "Twine Ply Master",
                    "Primary Ply Master",
                    "Twine Thread Master",
                    "Twine Strength Master",
                    "Twine Color Master"
                ]
            },
            {
                "Cheese Packing Master": [
                    "Size Settings",
                    {
                        "Cheese Tube & Cover": [
                            "Cheese Tube Master",
                            "Cheese Tube Location",
                            "Cheese Cover Master",
                            "Cheese Cover Location",
                            "Cheese Tube Cover Master",
                            "Cheese Tube Cover Location"
                        ]
                    },
                    {
                        "Cheese Box & Sack": [
                            "Cheese Box Master",
                            "Cheese Box Location",
                            "Cheese Sack Master",
                            "Cheese Sack Location",
                            "Cheese Box Sack Master",
                            "Cheese Box Sack Location"
                        ]
                    }
                ]
            },
            {
                "Size Masters": [
                    "Winder Size Parser",
                    "Twine Size Parser"
                ]
            },
            "Print Zone Master"
        ],
        "Netting": ["Net Making", "Inspection"],
        "Production": [
            "Netting Production",
            "TFO Winder",
            "Cheese Winder Production",
            "TFO Primary Production",
            "TFO Secondary Production",
            "Doubler Primary Production",
            "Doubler Secondary Production",
            "Reeling Production",
            "Packing Slip Production",
            "Bundle Entry Production",
            {
                "Cheese Packing": [
                    "Capture Doubler Details",
                    "Cheese Bag Details"
                ]
            },
            "Soft Package winder",
            "Boiler Production",
            "Heat Stretching",
            "Room Drier",
            "Colour Cheese Winder",
            "Packing",
            "Cheese",
            "Twine",
            "Pre-Request"
        ],
        "Quality": ["TFO Winder Plan", "Quality Check", "Reports"],
        "Reports": [
            "Management Dashboard",
            "Cheese Packing Details",
            "TFO Winder Production Report",
            "Secondary Production Report",
            "Secondary Ready Report",
            "Cheese Bag Details",
            "Cheese Winder Report",
            {
                "Status": [
                    "Cheese Winder Status"
                ]
            }
        ],
        "Finance": ["Accounts", "Payroll"],
        "IT": ["Users", "Settings"],
        "Personal": ["Profile", "Leaves"],
        "Messenger": ["Inbox", "Sent"]
    };

    const getPath = (menu, subItem) => {
        let path = '#';
        if (typeof subItem !== 'string') return '#';

        if (menu === 'Production') {
            if (subItem === 'TFO Winder Plan') path = '/production/tfo-winder-plan';
            else if (subItem === 'TFO Winder') path = '/production/tfo-winder';
            else if (subItem === 'Doubler Production (Primary)') path = '/production/doubler-production-primary';
            else path = `/production/${subItem.toLowerCase().replace(/[\s()]+/g, '-').replace(/-+$/, '')}`;
        } else if (subItem === 'Gate Entry') {
            path = '/entry/gate-entry';
        } else if (subItem === 'Goods Receipt (GRN)') {
            path = '/entry/goods-receipt';
        } else if (subItem === 'Netting Production') {
            path = '/production/netting-production';
        } else if (subItem === 'Sales Order') {
            path = '/sales/orders';
        } else if (subItem === 'Sales Dispatch') {
            path = '/sales/dispatch';
        } else if (subItem === 'Stock Management') {
            path = '/stock/management';
        } else if (subItem === 'Cheese Bag Details') {
            if (menu === 'Reports') path = '/reports/cheese-bag-details';
            else path = '/production/cheese-bag-details';
        } else if (subItem === 'Cheese Packing Details') {
            path = '/reports/active-bags';
        } else if (subItem === 'Management Dashboard') {
            path = '/reports/management-dashboard';
        } else if (subItem === 'Secondary Production Report') {
            path = '/reports/secondary-production';
        } else if (subItem === 'TFO Winder Production Report') {
            path = '/reports/tfo-winder-production';
        } else if (subItem === 'Secondary Ready Report') {
            path = '/reports/secondary-ready';
        } else if (subItem === 'Cheese Winder Report') {
            path = '/reports/cheese-winder-report';
        } else if (subItem === 'Print Zone Master') {
            path = '/master/print-zone';
        } else {
            // Generic path generation for other modules
            path = `/${menu.toLowerCase()}/${subItem.toLowerCase().replace(/[\s()]+/g, '-').replace(/-+$/, '')}`;
        }
        return path;
    };

    const getPermissionModule = (menu, item) => {
        if (typeof item !== 'string') return null;
        
        switch (item) {
            case "Goods Receipt (GRN)": return "grn-entry";
            case "Stock Management": return "stores-receipt";
            case "Inventory": return "stores-inventory";
            case "Machine Master": return "masters-machines";
            case "Unit Master": return "masters-units";
            case "Supplier Master": return "masters-materials";
            case "Location Master": return "masters-stores";
            case "Users": return "user-management";
            case "TFO Winder": return "prod-tfowinder";
            case "Netting Production": return "prod-netting";
            case "Cheese Winder Production": return "prod-cheesewinder";
            case "Sales Order": return "sales-entry";
            case "Sales Dispatch": return "dispatch";
            default: return null;
        }
    };

    const renderMenuItems = (items, parentMenu) => {
        return items.map((item, index) => {
            // Check Permission
            const moduleName = getPermissionModule(parentMenu, item);
            if (moduleName && !hasPermission(moduleName)) return null;

            if (typeof item === 'string') {
                return (
                    <Link
                        key={item}
                        to={getPath(parentMenu, item)}
                        className="dropdown-item"
                    >
                        {item}
                    </Link>
                );
            } else if (typeof item === 'object') {
                // Submenu logic
                const subMenuTitle = Object.keys(item)[0];
                const subMenuItems = item[subMenuTitle];

                return (
                    <div
                        key={subMenuTitle}
                        className="nested-dropdown-container"
                        style={{ position: 'relative' }}
                    >
                        <div
                            className="dropdown-item"
                            style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer', fontWeight: '600' }}
                        >
                            {subMenuTitle} <span>›</span>
                        </div>
                        <div className="submenu-dropdown">
                            {renderMenuItems(subMenuItems, parentMenu)}
                        </div>
                    </div>
                );
            }
            return null;
        });
    };

    return (
        <nav className="navbar">

            {/* Home / Logo Link */}
            <Link to="/" className="nav-link" style={{ fontWeight: 800, fontSize: '1.25rem', color: '#2563eb', paddingRight: '2rem' }}>
                CFN ERP
            </Link>

            {Object.keys(menuStructure).map(menu => (
                <div className="nav-item" key={menu}>
                    <span className="nav-link">{menu} ▾</span>
                    <div className={`dropdown-menu ${menu === 'Production' ? 'dropdown-green' : ''}`}>
                        {renderMenuItems(menuStructure[menu], menu)}
                    </div>
                </div>
            ))}

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem', paddingRight: '1rem' }}>
                {user && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        backgroundColor: '#eff6ff',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        color: '#1e40af',
                        border: '1px solid #bfdbfe'
                    }}>
                        👤 {user.full_name || user.username}
                        <span style={{
                            fontSize: '0.7rem',
                            backgroundColor: '#10b981',
                            color: 'white',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            textTransform: 'uppercase'
                        }}>
                            {user.sub_role?.sub_role_name || 'Generic'}
                        </span>
                        <span style={{
                            fontSize: '0.7rem',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            textTransform: 'uppercase'
                        }}>
                            {user.role?.role_name || 'User'}
                        </span>
                    </div>
                )}

                <button
                    onClick={logout}
                    style={{
                        background: 'none',
                        border: '1px solid #e2e8f0',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        color: '#64748b',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => { e.target.style.color = '#ef4444'; e.target.style.borderColor = '#fee2e2'; e.target.style.backgroundColor = '#fef2f2'; }}
                    onMouseOut={(e) => { e.target.style.color = '#64748b'; e.target.style.borderColor = '#e2e8f0'; e.target.style.backgroundColor = 'transparent'; }}
                >
                    Logout
                </button>

                <div style={{ fontSize: '1.2rem', cursor: 'pointer' }}>
                    🔔
                </div>
            </div>
        </nav>
    );
}
