import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase'; // Importação correta
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { FaUser, FaLock } from 'react-icons/fa';
import logo from '@/assets/logo.png'; // usa logo local

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    setLoading(false);

    if (error) {
      toast({
        title: 'Erro de Login',
        description: 'Verifique seu e-mail e senha.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Login bem-sucedido!',
        description: 'Redirecionando para o painel de controle.',
      });
      navigate('/dashboard');
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard');
      }
    });
  }, [navigate]);

  return (
    <>
      <Helmet>
        <title>Login Admin - AutenTicco Motors</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="glass-effect rounded-2xl p-8 max-w-sm w-full text-center"
        >
          <img
            src={logo}
            alt="AutenTicco Motors Logo"
            className="h-36 md:h-44 w-auto mx-auto mb-6"  // <- logo maior
            onError={(e) => {
              // fallback: oculta a imagem se não carregar pra não mostrar ícone quebrado
              e.currentTarget.style.display = 'none';
              e.currentTarget.onerror = null;
            }}
          />
          <h1 className="text-2xl font-bold mb-8 text-yellow-400">Login Admin</h1> {/* título amarelo */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
              <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-yellow-400 focus:outline-none"
                required
              />
            </div>
            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-yellow-400 focus:outline-none"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-yellow-400 text-black hover:bg-yellow-500 font-bold py-3 mt-4"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </motion.div>
      </div>
    </>
  );
};

export default AdminLogin;

