// src/pages/AdminLogin.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // se já está logado e dentro da validade, manda pro dashboard
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const ts = localStorage.getItem('autenticco_admin_login_at');
      const expired = !ts || Date.now() - Number(ts) > 24 * 60 * 60 * 1000;
      if (session && !expired) {
        navigate('/dashboard');
      }
    })();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        toast({
          title: 'Erro ao entrar',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }
      // login ok → grava horário
      localStorage.setItem('autenticco_admin_login_at', Date.now().toString());
      navigate('/dashboard');
    } catch (err) {
      toast({
        title: 'Erro ao entrar',
        description: String(err),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl">
        <h1 className="text-xl font-bold mb-4 text-gray-900">
          Acesso Administrativo
        </h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
          <input
            type="password"
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button
            type="submit"
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 rounded-lg"
          >
            Entrar
          </button>
        </form>
        <p className="text-[10px] text-gray-400 mt-4">
          Sessão expira em 24h automaticamente.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;

