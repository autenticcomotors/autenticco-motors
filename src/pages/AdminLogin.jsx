import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Key, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const AdminLogin = () => {
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'autenticcoadmin') {
      localStorage.setItem('isAuthenticated', 'true');
      toast({
        title: "Login bem-sucedido!",
        description: "Redirecionando para o painel de controle.",
      });
      navigate('/admin/dashboard');
    } else {
      toast({
        title: "Senha incorreta.",
        description: "Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Login Administrador - AutenTicco Motors</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-gray-900 pt-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md p-8 space-y-8 glass-effect rounded-2xl"
        >
          <div className="text-center">
            <img 
              src="https://horizons-cdn.hostinger.com/658e15d6-90a3-489b-9359-6db98ae64202/c41758bb4f122fc5c7f566d37de84f3e.png" 
              alt="AutenTicco Motors Logo" 
              className="h-16 w-auto mx-auto mb-6"
            />
            <h1 className="text-2xl font-bold text-white">
              Painel de <span className="gradient-text">Administrador</span>
            </h1>
            <p className="text-gray-400 mt-2">Acesso restrito</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha de Acesso"
                className="w-full pl-10 pr-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-yellow-400 focus:outline-none"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-yellow-400 text-black hover:bg-yellow-500 font-bold py-3 yellow-glow"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Entrar
            </Button>
          </form>
        </motion.div>
      </div>
    </>
  );
};

export default AdminLogin;
