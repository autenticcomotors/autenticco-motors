// src/components/PrivateRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24h

const PrivateRoute = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const ts = localStorage.getItem('autenticco_admin_login_at');
        const expired = !ts || Date.now() - Number(ts) > SESSION_TTL_MS;

        if (!session || expired) {
          if (session) {
            await supabase.auth.signOut();
          }
          setAllowed(false);
        } else {
          setAllowed(true);
        }
      } catch (err) {
        console.error('Erro PrivateRoute:', err);
        setAllowed(false);
      } finally {
        setChecking(false);
      }
    };

    check();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
        Verificando acesso...
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default PrivateRoute;

