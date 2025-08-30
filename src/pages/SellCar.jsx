import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { CheckCircle, Shield, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { FaWhatsapp } from 'react-icons/fa';

const SellCar = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    brand: '',
    model: '',
    year: '',
    observations: ''
  });

  const whatsappLink = "https://wa.me/5511975071300";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.email || !formData.brand || !formData.model || !formData.year) {
      toast({
        title: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Formulário enviado com sucesso! 🎉",
      description: "Nossa equipe entrará em contato em breve para avaliar seu veículo."
    });

    e.target.submit();

  };

  const benefits = [
    {
      icon: Shield,
      title: "Avaliação Gratuita",
      description: "Receba uma avaliação profissional do seu veículo sem compromisso"
    },
    {
      icon: Clock,
      title: "Venda Rápida",
      description: "Processo otimizado para vender seu carro em até 15 dias"
    },
    {
      icon: Zap,
      title: "Melhor Preço",
      description: "Marketing profissional para alcançar o melhor valor de mercado"
    }
  ];

  const process = [
    "Preencha o formulário com os dados do seu veículo",
    "Nossa equipe fará uma avaliação gratuita",
    "Cuidamos de toda documentação e burocracia",
    "Seu carro é vendido com segurança e agilidade"
  ];

  return (
    <>
      <Helmet>
        <title>Vender Meu Carro - AutenTicco Motors</title>
        <meta name="description" content="Venda seu carro com segurança e agilidade. Avaliação gratuita, processo sem burocracia e venda em até 15 dias. Solicite sua avaliação agora!" />
        <meta property="og:title" content="Vender Meu Carro - AutenTicco Motors" />
        <meta property="og:description" content="Venda seu carro com segurança e agilidade. Avaliação gratuita, processo sem burocracia e venda em até 15 dias. Solicite sua avaliação agora!" />
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
                Venda seu carro com <span className="gradient-text">segurança</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Processo completo sem burocracia, avaliação gratuita e venda garantida em até 15 dias
              </p>
            </motion.div>

            {/* Benefícios */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="glass-effect rounded-2xl p-8 text-center"
                >
                  <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6">
                    <benefit.icon className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-xl font-bold mb-4">{benefit.title}</h3>
                  <p className="text-gray-400">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Formulário e Processo */}
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
                  Solicite sua <span className="gradient-text">avaliação</span>
                </h2>
                <p className="text-gray-400 mb-8">
                  Preencha os dados abaixo e nossa equipe entrará em contato para avaliar seu veículo
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
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-yellow-400 focus:outline-none"
                        placeholder="Seu nome completo"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Telefone *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-yellow-400 focus:outline-none"
                        placeholder="(11) 97507-1300"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">E-mail *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-yellow-400 focus:outline-none"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Marca *</label>
                      <input
                        type="text"
                        name="brand"
                        value={formData.brand}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-yellow-400 focus:outline-none"
                        placeholder="BMW, Mercedes..."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Modelo *</label>
                      <input
                        type="text"
                        name="model"
                        value={formData.model}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-yellow-400 focus:outline-none"
                        placeholder="X5, C300..."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Ano *</label>
                      <input
                        type="number"
                        name="year"
                        value={formData.year}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-yellow-400 focus:outline-none"
                        placeholder="2023"
                        min="2000"
                        max="2024"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Observações</label>
                    <textarea
                      name="observations"
                      value={formData.observations}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-yellow-400 focus:outline-none resize-none"
                      placeholder="Informações adicionais sobre o veículo (quilometragem, estado de conservação, etc.)"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                      type="submit"
                      className="flex-1 bg-yellow-400 text-black hover:bg-yellow-500 font-bold py-4 h-auto yellow-glow"
                    >
                      Solicitar Avaliação Gratuita
                    </Button>
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex-1">
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

              {/* Processo */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-3xl font-bold mb-6">
                    Como <span className="gradient-text">funciona</span>
                  </h2>
                  <p className="text-gray-400 mb-8">
                    Nosso processo é simples, transparente e focado na sua segurança
                  </p>
                </div>

                <div className="space-y-6">
                  {process.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                      className="flex items-start space-x-4"
                    >
                      <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-black font-bold text-sm">{index + 1}</span>
                      </div>
                      <p className="text-gray-300 leading-relaxed">{step}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="glass-effect rounded-2xl p-6 mt-8">
                  <div className="flex items-center space-x-3 mb-4">
                    <CheckCircle className="w-6 h-6 text-yellow-400" />
                    <h3 className="text-xl font-bold">Garantias AutenTicco</h3>
                  </div>
                  <ul className="space-y-2 text-gray-400">
                    <li>✓ Avaliação gratuita e sem compromisso</li>
                    <li>✓ Processo 100% seguro e transparente</li>
                    <li>✓ Documentação completa incluída</li>
                    <li>✓ Suporte durante todo o processo</li>
                  </ul>
                </div>

                <div className="aspect-video rounded-2xl overflow-hidden">
                  <img  
                    className="w-full h-full object-cover" 
                    alt="Professional car evaluation process" src="https://images.unsplash.com/photo-1634324320508-b9a309a1fb1a" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default SellCar;
