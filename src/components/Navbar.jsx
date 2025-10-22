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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* altura menor (h-24) conforme pedido */}
        <div className="flex items-center justify-between h-24">
          {/* logo maior via scale-110 (mantém responsividade e aumenta 10%) */}
<Link to="/" className="flex-shrink-0 flex items-center gap-3 h-full">
  <div className="flex items-center h-full">
    <img
      src={logo}
      alt="AutenTicco Motors Logo"
      className="h-20 md:h-28 lg:h-32 w-auto transform scale-110 translate-y-2 md:translate-y-4 lg:translate-y-6"
      // fallback opcional (esconde se não carregar)
      onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.onerror = null; }}
    />
  </div>
</Link>


          <div className="hidden md:flex md:items-center">
            <div className="flex items-center space-x-8">
                {navLinks.map((link) => (
                <NavLink
                    key={link.title}
                    to={link.path}
                    className={({ isActive }) =>
                    `text-sm md:text-base font-semibold transition-colors duration-300 ${
                        isActive ? 'text-yellow-400' : 'text-white hover:text-yellow-300'
                    }`
                    }
                >
                    {link.title}
                </NavLink>
                ))}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <Button asChild>
              {/* Botão verde WhatsApp (mantido) */}
              <a
                href={socialLinks.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#25D366] text-white font-bold hover:bg-[#1ebe54] transition-transform hover:scale-105 text-sm px-6 py-2.5 flex items-center justify-center rounded-md"
                aria-label="Fale Conosco via WhatsApp"
              >
                <FaWhatsapp className="w-5 h-5 mr-2" />
                <span>Fale Conosco</span>
              </a>
            </Button>

            <div className="flex items-center space-x-6 pl-6 border-l border-gray-700">
                {/* ícones com cores originais e tamanho mantido */}
                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="transition-transform hover:scale-110">
                  <FaInstagram size={26} style={{ color: '#E4405F' }} />
                </a>
                <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="transition-transform hover:scale-110">
                  <FaFacebook size={26} style={{ color: '#1877F2' }} />
                </a>
                <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="transition-transform hover:scale-110">
                  <FaYoutube size={26} style={{ color: '#FF0000' }} />
                </a>
                <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="transition-transform hover:scale-110">
                  <FaTiktok size={26} style={{ color: '#69C9D0' }} />
                </a>
            </div>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} aria-label="Abrir menu">
              {isOpen ? <X className="h-8 w-8 text-white" /> : <Menu className="h-8 w-8 text-white" />}
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
              <NavLink key={link.title} to={link.path} onClick={() => setIsOpen(false)} className="text-white hover:text-yellow-400 font-medium text-lg">
                {link.title}
              </NavLink>
            ))}
            <Button asChild>
              <a href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="bg-[#25D366] text-white font-bold mt-2 flex items-center justify-center px-6 py-2.5 rounded-md">
                <FaWhatsapp className="w-5 h-5 mr-2" />
                <span>Fale Conosco</span>
              </a>
            </Button>
            <div className="flex items-center space-x-6 pt-4">
                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110"><FaInstagram size={28} style={{ color: '#E4405F' }} /></a>
                <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110"><FaFacebook size={28} style={{ color: '#1877F2' }} /></a>
                <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110"><FaYoutube size={28} style={{ color: '#FF0000' }} /></a>
                <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110"><FaTiktok size={28} style={{ color: '#69C9D0' }} /></a>
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

