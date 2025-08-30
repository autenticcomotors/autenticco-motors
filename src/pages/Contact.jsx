import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Mail, MapPin, Clock, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { FaWhatsapp, FaTiktok, FaInstagram, FaFacebook, FaYoutube } from 'react-icons/fa';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const socialLinks = {
    whatsapp: 'https://wa.me/5511975071300',
    instagram: 'https://www.instagram.com/autenticcomotors/',
    facebook: 'https://www.facebook.com/AutenTiccoMotors',
    youtube: 'https://www.youtube.com/channel/UCP7yeTZO5iD0lovXSaqInfg',
    tiktok: 'https://www.tiktok.com/@autenticcomotors',
    email: 'mailto:contato@autenticcomotors.com.br',
    maps: 'https://www.google.com/maps/search/?api=1&query=R.+Vieira+de+Morais,+2110+-+Sala+1015+-+Campo+Belo,+São+Paulo+-+SP,+04617-007'
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Enviando mensagem...",
    });

    e.target.submit();
  };

  const contactInfo = [
    {
      icon: FaWhatsapp,
      title: "WhatsApp",
      info: "(11) 97507-1300",
      description: "Segunda a sexta, 8h às 18h"
    },
    {
      icon: Mail,
      title: "E-mail",
      info: "contato@autenticcomotors.com.br",
      description: "Resposta em até 24h"
    },
    {
      icon: MapPin,
      title: "Escritório",
      info: "R. Vieira de Morais, 2110",
      description: "Sala 1015 - Campo Belo, SP"
    },
    {
      icon: Clock,
      title: "Horário",
      info: "Seg - Sex: 8h às 18h",
      description: "Sáb: 9h às 14h"
    }
  ];

  return (
    <>
      <Helmet>
        <title>Contato - AutenTicco Motors</title>
        <meta name="description" content="Entre em contato com a AutenTicco Motors. Telefone, e-mail, WhatsApp e formulário de contato. Atendimento especializado em veículos premium." />
        <meta property="og:title" content="Contato - AutenTicco Motors" />
        <meta property="og:description" content="Entre em contato com a AutenTicco Motors. Telefone, e-mail, WhatsApp e formulário de contato. Atendimento especializado em veículos premium." />
      </Helmet>

      <div className="pt-20 min-h-screen bg-black">
        {/* Hero Section */}
        <section className="py-20 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Entre em <span className="gradient-text">Contato</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Nossa equipe está pronta para ajudar você a encontrar o veículo ideal ou vender o seu com segurança
              </p>
            </motion.div>

            {/* Informações de Contato */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              {contactInfo.map((info, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="glass-effect rounded-2xl p-6 text-center"
                >
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <info.icon className="w-6 h-6 text-black" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{info.title}</h3>
                  <p className="text-yellow-400 font-semibold mb-1">{info.info}</p>
                  <p className="text-sm text-gray-400">{info.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Formulário e Mapa */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Formulário */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="glass-effect rounded-2xl p-8"
              >
                <h2 className="text-3xl font-bold mb-6">
                  Envie sua <span className="gradient-text">mensagem</span>
                </h2>
                <p className="text-gray-400 mb-8">
                  Preencha o formulário abaixo e nossa equipe entrará em contato o mais breve possível
                </p>

                <form 
                  onSubmit={handleSubmit}
                  action="https://formsubmit.co/contato@autenticcomotors.com.br"
                  method="POST"
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Nome *</label>
                      <input
                        type="text" name="name"
                        value={formData.name} onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-yellow-400 focus:outline-none"
                        placeholder="Seu nome completo" required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Telefone</label>
                      <input
                        type="tel" name="phone"
                        value={formData.phone} onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-yellow-400 focus:outline-none"
                        placeholder="(11) 97507-1300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">E-mail *</label>
                    <input
                      type="email" name="email"
                      value={formData.email} onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-yellow-400 focus:outline-none"
                      placeholder="seu@email.com" required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Assunto</label>
                    <select
                      name="subject" value={formData.subject} onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                    >
                      <option value="">Selecione um assunto</option>
                      <option value="venda">Quero vender meu carro</option>
                      <option value="compra">Quero comprar um carro</option>
                      <option value="avaliacao">Solicitar avaliação</option>
                      <option value="duvidas">Dúvidas gerais</option>
                      <option value="outros">Outros</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Mensagem *</label>
                    <textarea
                      name="message" value={formData.message} onChange={handleInputChange}
                      rows={6}
                      className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-yellow-400 focus:outline-none resize-none"
                      placeholder="Descreva como podemos ajudar você..." required
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                      type="submit"
                      className="flex-1 bg-yellow-400 text-black hover:bg-yellow-500 font-bold py-4 h-auto yellow-glow"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Enviar Mensagem
                    </Button>
                     <a href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="flex-1">
                        <Button 
                        type="button"
                        variant="outline"
                        className="w-full border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black font-bold py-4 h-auto"
                        >
                        <FaWhatsapp className="w-4 h-4 mr-2" />
                        WhatsApp
                        </Button>
                    </a>
                  </div>
                </form>
              </motion.div>

              {/* Mapa */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-8"
              >
                 <h2 className="text-3xl font-bold">
                  Nossa <span className="gradient-text">Localização</span>
                </h2>
                <div className="aspect-video rounded-2xl overflow-hidden glass-effect">
                  <iframe 
                    src="https://www.openstreetmap.org/export/embed.html?bbox=-46.66952,-23.61902,-46.66315,-23.61528&layer=mapnik&marker=-23.61715,-46.66633"
                    className="w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
                 <div className="glass-effect rounded-2xl p-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center">
                        <MapPin className="w-5 h-5 text-yellow-400 mr-2" />
                        Nosso Escritório
                    </h3>
                    <p className="text-gray-300">
                        R. Vieira de Morais, 2110 - Sala 1015<br/>
                        Campo Belo, São Paulo - SP, 04617-007
                    </p>
                </div>
                <div className="glass-effect rounded-2xl p-6">
                  <h3 className="text-xl font-bold mb-4">Siga-nos nas Redes Sociais</h3>
                  <div className="flex space-x-4">
                    <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer"><FaInstagram className="w-6 h-6 text-gray-400 hover:text-yellow-400" /></a>
                    <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer"><FaFacebook className="w-6 h-6 text-gray-400 hover:text-yellow-400" /></a>
                    <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer"><FaYoutube className="w-6 h-6 text-gray-400 hover:text-yellow-400" /></a>
                    <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer"><FaTiktok className="w-6 h-6 text-gray-400 hover:text-yellow-400" /></a>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Contact;
