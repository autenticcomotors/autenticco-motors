import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase'; // Importação corrigida

const PrivateRoute = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setIsAuthenticated(!!session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setIsAuthenticated(!!session);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (isAuthenticated === null) {
        return <div className="min-h-screen flex items-center justify-center text-white">Carregando...</div>;
    }

    return isAuthenticated ? children : <Navigate to="/admin" />;
};

export default PrivateRoute;
