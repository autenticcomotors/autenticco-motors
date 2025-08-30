import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FaWhatsapp } from 'react-icons/fa';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Início', path: '/' },
    { name: 'Estoque', path: '/estoque' },
    { name: 'Vender Meu Carro', path: '/vender' },
    { name: 'Quem Somos', path: '/sobre' },
    { name: 'Contato', path: '/contato' },
  ];
  
  const whatsappLink = "https://wa.me/5511975071300";

  return (
    <nav className="fixed top-0 w-full z-50 glass-effect">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="https://horizons-cdn.hostinger.com/658e15d6-90a3-489b-9359-6db98ae64202/c41758bb4f122fc5c7f566d37de84f3e.png" 
              alt="AutenTicco Motors Logo" 
              className="h-14 w-auto"
            />
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`text-sm font-medium transition-colors hover:text-yellow-400 ${
                  location.pathname === item.path ? 'text-yellow-400' : 'text-white'
                }`}
              >
                {item.name}
              </Link>
            ))}
             <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <Button className="bg-yellow-400 text-black hover:bg-yellow-500 font-semibold">
                    <FaWhatsapp className="w-5 h-5 mr-2" />
                    Fale Conosco
                </Button>
            </a>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:text-yellow-400 transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-black/95 backdrop-blur-lg rounded-lg mt-2 p-4"
          >
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`text-sm font-medium transition-colors hover:text-yellow-400 ${
                    location.pathname === item.path ? 'text-yellow-400' : 'text-white'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="w-full">
                <Button className="bg-yellow-400 text-black hover:bg-yellow-500 font-semibold w-full">
                    <FaWhatsapp className="w-5 h-5 mr-2" />
                    Fale Conosco
                </Button>
              </a>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
