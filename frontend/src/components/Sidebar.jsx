import { NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingCart, Truck, Boxes, DoorOpen, Database, Grid3x3,
    Factory, ShieldCheck, BarChart3, Wallet, Settings, User,
    MessageSquare, ChevronDown, ChevronsLeft, ChevronsRight, LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV = [
    {
        id: 'sales', label: 'Sales', icon: ShoppingCart,
        items: [
            { label: 'Sales Order', path: '/sales/orders', module: 'sales-entry' },
            { label: 'Sales Dispatch', path: '/sales/dispatch', module: 'dispatch' },
            { label: 'Invoicing', path: '/sales/invoicing' },
            { label: 'Customer Master', path: '/sales/customer-master' },
            { label: 'Price List', path: '/sales/price-list' },
        ],
    },
    {
        id: 'purchase', label: 'Purchase', icon: Truck,
        items: [
            { label: 'Purchase Order', path: '/purchase/purchase-order' },
            { label: 'Vendor Mgmt', path: '/purchase/vendor-mgmt' },
        ],
    },
    {
        id: 'stores', label: 'Stores', icon: Boxes,
        items: [
            { label: 'Inventory', path: '/stores/inventory', module: 'stores-inventory' },
            { label: 'Stock Check', path: '/stores/stock-check' },
            { label: 'Goods Receipt (GRN)', path: '/entry/goods-receipt', module: 'grn-entry' },
            { label: 'Stock Management', path: '/stock/management', module: 'stores-receipt' },
        ],
    },
    {
        id: 'gate', label: 'Gate', icon: DoorOpen,
        items: [
            { label: 'Gate Entry', path: '/entry/gate-entry', module: 'grn-entry' },
            { label: 'Exit', path: '/gate/exit' },
        ],
    },
    {
        id: 'master', label: 'Master', icon: Database,
        items: [
            { label: 'Machine Master', path: '/master/machine-master', module: 'masters-machines' },
            { label: 'Machine Type Master', path: '/master/machine-type-master' },
            { label: 'Operator Master', path: '/master/operator-master' },
            { label: 'Cheese Winder Pairing', path: '/master/cheese-winder-pairing' },
            { label: 'Shift Master', path: '/master/shift-master' },
            { label: 'Supplier Master', path: '/master/supplier-master', module: 'masters-materials' },
            { label: 'Yarn Masters', path: '/master/yarn' },
            { label: 'Twine Masters', path: '/master/twine' },
            { label: 'Cheese Packing Master', path: '/master/cheese-packing' },
            { label: 'Size Masters', path: '/master/size' },
            { label: 'Print Zone Master', path: '/master/print-zone' },
        ],
    },
    {
        id: 'netting', label: 'Netting', icon: Grid3x3,
        items: [
            { label: 'Net Making', path: '/netting/net-making' },
            { label: 'Inspection', path: '/netting/inspection' },
        ],
    },
    {
        id: 'production', label: 'Production', icon: Factory,
        items: [
            { label: 'Netting Production', path: '/production/netting-production' },
            { label: 'TFO Winder', path: '/production/tfo-winder' },
            { label: 'Cheese Winder Production', path: '/production/cheese-winder-production', module: 'prod-cheesewinder' },
            { label: 'TFO Primary Production', path: '/production/tfo-primary-production' },
            { label: 'TFO Secondary Production', path: '/production/tfo-secondary-production' },
            { label: 'Doubler Primary Production', path: '/production/doubler-primary-production' },
            { label: 'Doubler Secondary Production', path: '/production/doubler-secondary-production' },
            { label: 'Reeling Production', path: '/production/reeling-production' },
            { label: 'Packing Slip Production', path: '/production/packing-slip-production' },
            { label: 'Bundle Entry Production', path: '/production/bundle-entry-production' },
            { label: 'Capture Doubler Details', path: '/production/capture-doubler-details' },
            { label: 'Cheese Bag Details', path: '/production/cheese-bag-details' },
            { label: 'Soft Package Winder', path: '/production/soft-package-winder' },
            { label: 'Boiler Production', path: '/production/boiler-production' },
            { label: 'Heat Stretching', path: '/production/heat-stretching' },
            { label: 'Room Drier', path: '/production/room-drier' },
            { label: 'Colour Cheese Winder', path: '/production/colour-cheese-winder' },
            { label: 'Packing', path: '/production/packing' },
            { label: 'Cheese', path: '/production/cheese' },
            { label: 'Twine', path: '/production/twine' },
            { label: 'Pre-Request', path: '/production/pre-request' },
        ],
    },
    {
        id: 'quality', label: 'Quality', icon: ShieldCheck,
        items: [
            { label: 'TFO Winder Plan', path: '/quality/tfo-winder-plan' },
            { label: 'Quality Check', path: '/quality/quality-check' },
            { label: 'Reports', path: '/quality/reports' },
        ],
    },
    {
        id: 'reports', label: 'Reports', icon: BarChart3,
        items: [
            { label: 'Management Dashboard', path: '/reports/management-dashboard' },
            { label: 'Cheese Packing Details', path: '/reports/active-bags' },
            { label: 'TFO Winder Production', path: '/reports/tfo-winder-production' },
            { label: 'Secondary Production', path: '/reports/secondary-production' },
            { label: 'Secondary Ready', path: '/reports/secondary-ready' },
            { label: 'Cheese Bag Details', path: '/reports/cheese-bag-details' },
            { label: 'Cheese Winder Report', path: '/reports/cheese-winder-report' },
            { label: 'Cheese Winder Status', path: '/reports/cheese-winder-status' },
        ],
    },
    {
        id: 'finance', label: 'Finance', icon: Wallet,
        items: [
            { label: 'Accounts', path: '/finance/accounts' },
            { label: 'Payroll', path: '/finance/payroll' },
        ],
    },
    {
        id: 'it', label: 'IT', icon: Settings,
        items: [
            { label: 'Users', path: '/it/users', module: 'user-management' },
            { label: 'Settings', path: '/it/settings' },
        ],
    },
    {
        id: 'personal', label: 'Personal', icon: User,
        items: [
            { label: 'Profile', path: '/personal/profile' },
            { label: 'Leaves', path: '/personal/leaves' },
        ],
    },
    {
        id: 'messenger', label: 'Messenger', icon: MessageSquare,
        items: [
            { label: 'Inbox', path: '/messenger/inbox' },
            { label: 'Sent', path: '/messenger/sent' },
        ],
    },
];

export default function Sidebar({ collapsed, onToggle, onNavigate }) {
    const { user, logout, hasPermission } = useAuth();
    const location = useLocation();

    const filteredNav = useMemo(() => (
        NAV
            .map(section => ({
                ...section,
                items: section.items.filter(item => !item.module || hasPermission(item.module)),
            }))
            .filter(section => section.items.length > 0)
    ), [hasPermission]);

    const [openSections, setOpenSections] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('sidebar.openSections') || '{}');
        } catch {
            return {};
        }
    });

    useEffect(() => {
        const active = filteredNav.find(s => s.items.some(i => location.pathname === i.path));
        if (active && !openSections[active.id]) {
            setOpenSections(prev => ({ ...prev, [active.id]: true }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    useEffect(() => {
        localStorage.setItem('sidebar.openSections', JSON.stringify(openSections));
    }, [openSections]);

    const toggleSection = (id) => {
        setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleSectionClick = (id) => {
        if (collapsed) {
            onToggle();
            setOpenSections(prev => ({ ...prev, [id]: true }));
        } else {
            toggleSection(id);
        }
    };

    const initial = (user?.full_name || user?.username || '?').charAt(0).toUpperCase();

    return (
        <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
            <div className="sidebar__header">
                {!collapsed && (
                    <NavLink to="/" className="sidebar__brand" onClick={onNavigate}>
                        Voice2Data
                    </NavLink>
                )}
                <button
                    type="button"
                    onClick={onToggle}
                    className="sidebar__toggle"
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    title={collapsed ? 'Expand' : 'Collapse'}
                >
                    {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
                </button>
            </div>

            <nav className="sidebar__nav">
                {filteredNav.map(section => {
                    const Icon = section.icon;
                    const isActive = section.items.some(i => location.pathname === i.path);
                    const isOpen = !!openSections[section.id];

                    return (
                        <div key={section.id} className="sidebar__section">
                            <button
                                type="button"
                                className={`sidebar__section-btn ${isActive ? 'is-active' : ''}`}
                                onClick={() => handleSectionClick(section.id)}
                                title={collapsed ? section.label : undefined}
                            >
                                <Icon size={18} className="sidebar__icon" />
                                {!collapsed && (
                                    <>
                                        <span className="sidebar__label">{section.label}</span>
                                        <ChevronDown
                                            size={16}
                                            className={`sidebar__chevron ${isOpen ? 'is-open' : ''}`}
                                        />
                                    </>
                                )}
                            </button>

                            <AnimatePresence initial={false}>
                                {!collapsed && isOpen && (
                                    <motion.div
                                        key="content"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.18, ease: 'easeOut' }}
                                        style={{ overflow: 'hidden' }}
                                    >
                                        <div className="sidebar__items">
                                            {section.items.map(item => (
                                                <NavLink
                                                    key={item.path}
                                                    to={item.path}
                                                    end
                                                    onClick={onNavigate}
                                                    className={({ isActive }) =>
                                                        `sidebar__item ${isActive ? 'is-active' : ''}`
                                                    }
                                                >
                                                    {item.label}
                                                </NavLink>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </nav>

            <div className="sidebar__footer">
                {user && (
                    collapsed ? (
                        <div className="sidebar__avatar" title={user.full_name || user.username}>
                            {initial}
                        </div>
                    ) : (
                        <div className="sidebar__user">
                            <div className="sidebar__avatar">{initial}</div>
                            <div className="sidebar__user-info">
                                <div className="sidebar__user-name">{user.full_name || user.username}</div>
                                <div className="sidebar__user-role">
                                    {user.role?.role_name || 'User'}
                                    {user.sub_role?.sub_role_name ? ` · ${user.sub_role.sub_role_name}` : ''}
                                </div>
                            </div>
                        </div>
                    )
                )}
                <button
                    type="button"
                    onClick={logout}
                    className="sidebar__logout"
                    title="Logout"
                >
                    <LogOut size={16} />
                    {!collapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
}
