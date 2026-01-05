import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthUser, onAuthChange, logoutUser } from '../../services/authService';

interface LandingAuthContextType {
    user: AuthUser | null;
    userData: AuthUser | null;
    isAuthenticated: boolean;
    userType: any;
    loading: boolean;
    setUserData: (data: AuthUser | null) => void;
    logout: () => Promise<void>;
}

const AuthContext = createContext<LandingAuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [userData, setUserData] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthChange((u) => {
            setUserData(u as AuthUser | null);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        await logoutUser();
        setUserData(null);
    };

    const value: LandingAuthContextType = {
        user: userData,
        userData,
        isAuthenticated: !!userData,
        userType: (userData as any)?.userType || null,
        loading,
        setUserData,
        logout: handleLogout,
    };

    return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
