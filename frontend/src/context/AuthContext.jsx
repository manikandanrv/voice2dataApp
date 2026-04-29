import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setPermissions([]);
        window.location.href = '/login';
    };

    const fetchPermissions = async (authToken) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const res = await fetch(`${apiUrl}/api/rbac/my-permissions`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPermissions(data.modules || []);
            }
        } catch (err) {
            console.error("Failed to fetch permissions:", err);
        }
    };

    useEffect(() => {
        const checkAuth = async () => {
            if (token) {
                try {
                    const apiUrl = import.meta.env.VITE_API_URL;
                    const res = await fetch(`${apiUrl}/api/auth/me`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (res.ok) {
                        const userData = await res.json();
                        setUser(userData);
                        await fetchPermissions(token);
                    } else {
                        logout();
                    }
                } catch (err) {
                    console.error("Auth check failed:", err);
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, [token]);

    const login = async (newToken, userData) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);
        await fetchPermissions(newToken);
    };

    const hasPermission = (moduleName) => {
        if (!user) return false;
        // Admin and Super Admin have all permissions
        if (user.role?.role_name === 'admin' || user.role?.role_name === 'sa') return true;

        if (!permissions) return false;
        if (permissions.includes('All')) return true;
        return permissions.includes(moduleName);
    };

    return (
        <AuthContext.Provider value={{ user, token, permissions, hasPermission, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
