import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { FaWhatsapp, FaInstagram, FaFacebook, FaYoutube, FaTiktok } from 'react-icons/fa';
import logo from '@/assets/logo.png'; 

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { title: 'Início', path: '/' },
    { title: 'Estoque', path: '/estoque' },
    { title: 'Vender Meu Carro', path: '/vender' },
    { title: 'Quem Somos', path: '/sobre' },
    { title: 'Contato', path: '/contato' },
  ];
  
  const socialLinks = {
    whatsapp: 'https://wa.me/5511975071300',
    instagram: 'https://www.instagram.com/autenticcomotors/',
    facebook: 'https://www.facebook.com/AutenTiccoMotors',
    youtube: 'https://www.youtube.com/channel/UCP7yeTZO5iD0lovXSaqInfg',
    tiktok: 'https://www.tiktok.com/@autenticcomotors',
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex-shrink-0 flex items-center gap-3">
            <img className="h-10 w-auto" src={logo} alt="AutenTicco Motors Logo" />
            <span className="text-white font-bold text-xl hidden sm:block">AutenTicco Motors</span>
          </Link>

          <div className="hidden md:flex md:items-center">
            <div className="flex items-center space-x-6">
                {navLinks.map((link) => (
                <NavLink
                    key={link.title}
                    to={link.path}
                    className={({ isActive }) =>
                    `text-sm font-semibold transition-colors duration-300 ${
                        isActive ? 'text-yellow-400' : 'text-white hover:text-yellow-300'
                    }`
                    }
                >
                    {link.title}
                </NavLink>
                ))}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <Button asChild>
              {/* As classes de estilo foram movidas para o <a> para garantir o alinhamento */}
              <a href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="bg-yellow-400 text-black font-bold hover:bg-yellow-500 transition-transform hover:scale-105 text-sm px-5 py-2.5 flex items-center justify-center rounded-md">
                <FaWhatsapp className="w-4 h-4 mr-2" />
                <span>Fale Conosco</span>
              </a>
            </Button>

            <div className="flex items-center space-x-4 pl-6 border-l border-gray-700">
                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-yellow-400 transition-transform hover:scale-110"><FaInstagram size={22} /></a>
                <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-yellow-400 transition-transform hover:scale-110"><FaFacebook size={22} /></a>
                <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-yellow-400 transition-transform hover:scale-110"><FaYoutube size={22} /></a>
                <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-yellow-400 transition-transform hover:scale-110"><FaTiktok size={22} /></a>
            </div>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} aria-label="Abrir menu">
              {isOpen ? <X className="h-6 w-6 text-white" /> : <Menu className="h-6 w-6 text-white" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile */}
      {isOpen && (
        <motion.div 
          className="md:hidden bg-black/95 py-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col items-center space-y-4">
            {navLinks.map((link) => (
              <NavLink key={link.title} to={link.path} onClick={() => setIsOpen(false)} className="text-white hover:text-yellow-400 font-medium">
                {link.title}
              </NavLink>
            ))}
            <Button asChild>
              <a href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="bg-yellow-400 text-black font-bold mt-2 flex items-center justify-center px-5 py-2.5 rounded-md">
                <FaWhatsapp className="w-4 h-4 mr-2" />
                <span>Fale Conosco</span>
              </a>
            </Button>
            <div className="flex items-center space-x-6 pt-4">
                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-yellow-400"><FaInstagram size={24} /></a>
                <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-yellow-400"><FaFacebook size={24} /></a>
                <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-yellow-400"><FaYoutube size={24} /></a>
                <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-yellow-400"><FaTiktok size={24} /></a>
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
};

// O componente Button agora serve apenas como um invólucro sem estilo próprio, 
// o estilo é aplicado diretamente no <a>
const Button = ({ children, asChild, ...props }) => {
  const Comp = asChild ? 'div' : 'button';
  return <Comp {...props}>{children}</Comp>;
};

export default Navbar;
