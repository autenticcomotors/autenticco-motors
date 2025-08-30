import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Instagram, Facebook, Youtube } from 'lucide-react';
import { FaWhatsapp, FaTiktok } from 'react-icons/fa';

const Footer = () => {

  const socialLinks = {
    whatsapp: 'https://wa.me/5511975071300',
    instagram: 'https://www.instagram.com/autenticcomotors/',
    facebook: 'https://www.facebook.com/AutenTiccoMotors',
    youtube: 'https://www.youtube.com/channel/UCP7yeTZO5iD0lovXSaqInfg',
    tiktok: 'https://www.tiktok.com/@autenticcomotors',
    email: 'mailto:contato@autenticcomotors.com.br',
    maps: 'https://www.google.com/maps/search/?api=1&query=R.+Vieira+de+Morais,+2110+-+Sala+1015+-+Campo+Belo,+São+Paulo+-+SP,+04617-007'
  };

  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/">
                <img 
                  src="https://horizons-cdn.hostinger.com/658e15d6-90a3-489b-9359-6db98ae64202/c41758bb4f122fc5c7f566d37de84f3e.png" 
                  alt="AutenTicco Motors Logo" 
                  className="h-16 w-auto mb-4"
                />
            </Link>
            <p className="text-gray-400 mb-4 max-w-md">
              Simplificamos a compra e venda de veículos, eliminando riscos e burocracia através de uma assessoria completa e pessoal.
            </p>
            <div className="flex space-x-4">
              <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-yellow-400 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-yellow-400 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-yellow-400 transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
               <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-yellow-400 transition-colors">
                <FaTiktok className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <span className="text-white font-semibold mb-4 block">Links Rápidos</span>
            <div className="space-y-2">
              <Link to="/" className="text-gray-400 hover:text-yellow-400 transition-colors block">
                Início
              </Link>
              <Link to="/estoque" className="text-gray-400 hover:text-yellow-400 transition-colors block">
                Estoque
              </Link>
              <Link to="/vender" className="text-gray-400 hover:text-yellow-400 transition-colors block">
                Vender Meu Carro
              </Link>
              <Link to="/sobre" className="text-gray-400 hover:text-yellow-400 transition-colors block">
                Quem Somos
              </Link>
              <Link to="/contato" className="text-gray-400 hover:text-yellow-400 transition-colors block">
                Contato
              </Link>
            </div>
          </div>

          <div>
            <span className="text-white font-semibold mb-4 block">Contato</span>
            <div className="space-y-3">
              <a href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-gray-400 hover:text-yellow-400 transition-colors">
                <FaWhatsapp className="w-4 h-4 text-yellow-400" />
                <span>(11) 97507-1300</span>
              </a>
              <a href={socialLinks.email} className="flex items-center space-x-2 text-gray-400 hover:text-yellow-400 transition-colors">
                <Mail className="w-4 h-4 text-yellow-400" />
                <span>contato@autenticcomotors.com.br</span>
              </a>
              <a href={socialLinks.maps} target="_blank" rel="noopener noreferrer" className="flex items-start space-x-2 text-gray-400 hover:text-yellow-400 transition-colors">
                <MapPin className="w-4 h-4 text-yellow-400 mt-1 flex-shrink-0" />
                <span>R. Vieira de Morais, 2110 - Sala 1015 - Campo Belo, São Paulo - SP</span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2024 AutenTicco Motors. Todos os direitos reservados.
             <Link to="/admin" className="ml-4 text-gray-600 hover:text-yellow-500 transition-colors text-xs">
              Admin
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
