// src/pages/SellCar.jsx
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Shield, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { FaWhatsapp } from 'react-icons/fa';
import BackgroundShape from '@/components/BackgroundShape';
import { addLead } from '@/lib/car-api';

const SellCar = () => {
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', brand: '', model: '', year: '', observations: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const whatsappLink = 'https://wa.me/5511975071300';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const requiredFields = ['name', 'phone', 'email', 'brand', 'model', 'year'];
    if (requiredFields.some(field => !formData[field])) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos com *.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    const leadData = {
      client_name: formData.name,
      client_contact: `${formData.phone} | ${formData.email}`,
      lead_type: 'Venda',
      car_details: `${formData.brand} ${formData.model} ${formData.year}`,
      notes: formData.observations,
    };

    const { error } = await addLead(leadData);
    if (error) {
      toast({
        title: 'Erro ao salvar lead',
        description: 'Apesar do erro, tentaremos enviar o e-mail.',
        variant: 'destructive',
      });
    }

    try {
      const r = await fetch('https://formsubmit.co/ajax/contato@autenticcomotors.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...formData, _subject: 'Nova Proposta de Venda de Veículo!' }),
      });
      if (!r.ok) throw new Error();

      toast({ title: 'Proposta enviada com sucesso! 🎉', description: 'Nossa equipe entrará em contato em breve.' });
      setFormData({ name: '', phone: '', email: '', brand: '', model: '', year: '', observations: '' });
    } catch {
      toast({
        title: 'Erro no envio do e-mail',
        description: 'Ocorreu um problema. Por favor, tente novamente ou entre em contato pelo WhatsApp.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    { icon: Shield, title: 'Avaliação Gratuita', description: 'Receba uma avaliação profissional do seu veículo sem custo ou compromisso.' },
    { icon: Clock, title: 'Venda Rápida', description: 'Nosso processo otimizado e marketing focado garantem a venda em tempo recorde.' },
    { icon: Zap, title: 'Melhor Valor de Mercado', description: 'Anunciamos seu carro da melhor forma para alcançar o maior valor possível.' },
  ];

  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  return (
    <div className="relative isolate min-h-screen bg-gray-50 text-gray-800 pt-28">
      <Helmet>
        <title>Vender Meu Carro - AutenTicco Motors</title>
        <meta name="description" content="Venda seu carro com segurança e agilidade. Avaliação gratuita, processo sem burocracia e a melhor valorização do mercado. Solicite sua avaliação agora!" />
      </Helmet>

      <BackgroundShape />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* HERO */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16 sm:mb-20"
        >
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight sm:leading-tight">
            Venda seu carro com <span className="text-yellow-500">segurança e sem esforço</span>
          </h1>

          <div className="mt-4 sm:mt-6 text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
            <span className="block">Cuidamos de tudo para você, da avaliação profissional à documentação.</span>
            <span className="block mt-1">Preencha o formulário e receba uma proposta.</span>
          </div>
        </motion.div>

        {/* GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* FORM — sticky só no desktop */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border lg:sticky lg:top-28 z-10"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Solicite sua avaliação</h2>
            <p className="text-gray-600 mb-8">É rápido, fácil e gratuito.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome *</label>
                  <input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Seu nome completo" className="w-full px-4 py-3 bg-gray-100 border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">WhatsApp *</label>
                  <input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="(11) 99999-9999" className="w-full px-4 py-3 bg-gray-100 border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-mail *</label>
                <input id="email" type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="seu@email.com" className="w-full px-4 py-3 bg-gray-100 border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label htmlFor="brand" className="block text-sm font-medium text-gray-700">Marca *</label>
                  <input id="brand" name="brand" value={formData.brand} onChange={handleInputChange} placeholder="Ex: BMW" className="w-full px-4 py-3 bg-gray-100 border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="model" className="block text-sm font-medium text-gray-700">Modelo *</label>
                  <input id="model" name="model" value={formData.model} onChange={handleInputChange} placeholder="Ex: X5" className="w-full px-4 py-3 bg-gray-100 border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="year" className="block text-sm font-medium text-gray-700">Ano *</label>
                  <input id="year" name="year" type="number" value={formData.year} onChange={handleInputChange} placeholder="Ex: 2023" className="w-full px-4 py-3 bg-gray-100 border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="observations" className="block text-sm font-medium text-gray-700">Observações</label>
                <textarea id="observations" name="observations" value={formData.observations} onChange={handleInputChange} placeholder="Detalhes como KM, versão, cor, estado de conservação..." rows={4} className="w-full px-4 py-3 bg-gray-100 border-gray-300 rounded-lg resize-none focus:ring-yellow-500 focus:border-yellow-500" />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full bg-yellow-400 text-black font-bold py-6 text-lg hover:bg-yellow-500 transition-all duration-300 transform hover:scale-105">
                {isSubmitting ? 'Enviando...' : 'Solicitar Avaliação Gratuita'}
              </Button>
            </form>
          </motion.div>

          {/* LADO DIREITO */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            className="space-y-6"
          >
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="flex items-start gap-4 p-6 bg-gray-800 bg-opacity-80 border border-gray-700 rounded-xl shadow-md transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/30 hover:border-yellow-500"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                  <b.icon className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{b.title}</h3>
                  <p className="text-gray-300">{b.description}</p>
                </div>
              </motion.div>
            ))}

            <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border text-center mt-12">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Prefere falar agora?</h3>
              <p className="text-gray-600 mb-6">Clique no botão abaixo e fale diretamente com um de nossos assessores pelo WhatsApp.</p>
              <Button asChild className="w-full bg-green-500 text-white font-bold py-6 text-lg hover:bg-green-600 transition-all duration-300 transform hover:scale-105">
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <FaWhatsapp className="w-6 h-6 mr-3" /> Chamar no WhatsApp
                </a>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SellCar;

