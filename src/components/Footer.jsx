import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin } from 'lucide-react';
import { FaWhatsapp, FaTiktok, FaInstagram, FaFacebook, FaYoutube } from 'react-icons/fa';
import logo from '@/assets/logo.png'; // Usando o logo local

const Footer = () => {

  const socialLinks = {
    whatsapp: 'https://wa.me/5511975071300',
    instagram: 'https://www.instagram.com/autenticcomotors/',
    facebook: 'https://www.facebook.com/AutenTiccoMotors',
    youtube: 'https://www.youtube.com/channel/UCP7yeTZO5iD0lovXSaqInfg',
    tiktok: 'https://www.tiktok.com/@autenticcomotors',
    // E-mail corrigido aqui
    email: 'mailto:contato@autenticcomotors.com', 
    maps: 'https://www.google.com/maps/search/?api=1&query=R.+Vieira+de+Morais,+2110+-+Sala+1015+-+Campo+Belo,+São+Paulo+-+SP,+04617-007'
  };

  return (
    <footer className="bg-gray-100 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img src={logo} alt="AutenTicco Motors Logo" className="h-12 w-auto" />
              <span className="font-bold text-gray-800 text-xl">AutenTicco Motors</span>
            </Link>
            <p className="text-gray-600 mb-6 max-w-md">
              Simplificamos a compra e venda de veículos, eliminando riscos e burocracia através de uma assessoria completa e pessoal.
            </p>
            <div className="flex space-x-4">
              <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-yellow-500 transition-colors"><FaInstagram size={24} /></a>
              <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-yellow-500 transition-colors"><FaFacebook size={24} /></a>
              <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-yellow-500 transition-colors"><FaYoutube size={24} /></a>
              <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-yellow-500 transition-colors"><FaTiktok size={24} /></a>
            </div>
          </div>

          <div>
            <span className="text-gray-900 font-semibold mb-4 block">Links Rápidos</span>
            <div className="space-y-2">
              <Link to="/" className="text-gray-600 hover:text-yellow-500 transition-colors block">Início</Link>
              <Link to="/estoque" className="text-gray-600 hover:text-yellow-500 transition-colors block">Estoque</Link>
              <Link to="/vender" className="text-gray-600 hover:text-yellow-500 transition-colors block">Vender Meu Carro</Link>
              <Link to="/sobre" className="text-gray-600 hover:text-yellow-500 transition-colors block">Quem Somos</Link>
              <Link to="/contato" className="text-gray-600 hover:text-yellow-500 transition-colors block">Contato</Link>
            </div>
          </div>

          <div>
            <span className="text-gray-900 font-semibold mb-4 block">Contato</span>
            <div className="space-y-3">
              <a href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-gray-600 hover:text-yellow-500 transition-colors">
                <FaWhatsapp className="w-4 h-4 text-yellow-500" />
                <span>(11) 97507-1300</span>
              </a>
              <a href={socialLinks.email} className="flex items-center space-x-2 text-gray-600 hover:text-yellow-500 transition-colors">
                <Mail className="w-4 h-4 text-yellow-500" />
                {/* E-mail corrigido aqui */}
                <span>contato@autenticcomotors.com</span>
              </a>
              <a href={socialLinks.maps} target="_blank" rel="noopener noreferrer" className="flex items-start space-x-2 text-gray-600 hover:text-yellow-500 transition-colors">
                <MapPin className="w-4 h-4 text-yellow-500 mt-1 flex-shrink-0" />
                <span>R. Vieira de Morais, 2110 - Sala 1015 - Campo Belo, São Paulo - SP</span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8 text-center">
          <p className="text-gray-500">
            © {new Date().getFullYear()} AutenTicco Motors. Todos os direitos reservados.
            <Link to="/admin" className="ml-4 text-gray-400 hover:text-yellow-500 transition-colors text-xs">Admin</Link>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
