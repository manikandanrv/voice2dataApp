import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

export default function AppShell() {
    const { token } = useAuth();
    const location = useLocation();

    const [collapsed, setCollapsed] = useState(
        () => localStorage.getItem('sidebar.collapsed') === 'true'
    );
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('sidebar.collapsed', String(collapsed));
    }, [collapsed]);

    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    if (!token) {
        return (
            <div className="app-shell app-shell--unauth">
                <header className="topbar">
                    <NavLink to="/" className="topbar__brand topbar__brand--logo">
                        <img src="/v2d-logo.png" alt="Voice2Data ERP" height={20} />
                        <span>Voice2Data ERP</span>
                    </NavLink>
                    <div className="topbar__spacer" />
                    <NavLink to="/login" className="topbar__login-link">
                        Sign In
                    </NavLink>
                </header>
                <main className="app-main app-main--full">
                    <Outlet />
                </main>
            </div>
        );
    }

    return (
        <div className={`app-shell ${mobileOpen ? 'app-shell--mobile-open' : ''}`}>
            <Sidebar
                collapsed={collapsed}
                onToggle={() => setCollapsed(c => !c)}
                onNavigate={() => setMobileOpen(false)}
            />
            {mobileOpen && (
                <div
                    className="app-shell__backdrop"
                    onClick={() => setMobileOpen(false)}
                    aria-hidden="true"
                />
            )}
            <div className="app-shell__main">
                <header className="topbar">
                    <button
                        type="button"
                        className="topbar__hamburger"
                        onClick={() => setMobileOpen(o => !o)}
                        aria-label="Toggle navigation"
                    >
                        <Menu size={20} />
                    </button>
                    <NavLink to="/" className="topbar__brand">
                        Voice2Data ERP
                    </NavLink>
                    <div className="topbar__spacer" />
                    <button
                        type="button"
                        className="topbar__icon-btn"
                        aria-label="Notifications"
                    >
                        <Bell size={18} />
                    </button>
                </header>
                <main className="app-main">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
