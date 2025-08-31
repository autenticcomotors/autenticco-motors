import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { addLead } from '@/lib/car-api';
import { FaWhatsapp } from 'react-icons/fa';

const InterestModal = ({ car, onClose }) => {
  const [formData, setFormData] = useState({ name: '', contact: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const whatsappLink = "https://wa.me/5511975071300";

  if (!car) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.contact) {
      toast({ title: "Preencha seu nome e contato.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const leadData = {
      client_name: formData.name,
      client_contact: formData.contact,
      lead_type: 'Compra',
      car_id: car.id,
      car_details: `${car.brand} ${car.model}`
    };

    // 1. Salva o lead no banco
    await addLead(leadData);

    // 2. Envia o e-mail via FormSubmit
    try {
        const emailData = {
            Nome: formData.name,
            Contato: formData.contact,
            Interesse: `${car.brand} ${car.model}`,
            _subject: `Novo Interesse: ${car.brand} ${car.model}`
        };
        const formSubmitResponse = await fetch("https://formsubmit.co/ajax/contato@autenticcomotors.com", {
            method: "POST",
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(emailData)
        });

        if (!formSubmitResponse.ok) throw new Error("Falha no FormSubmit");

        toast({
            title: "Interesse registrado com sucesso! 🎉",
            description: "Entraremos em contato em breve."
        });
        onClose();

    } catch (emailError) {
        toast({ title: "Erro no envio do e-mail", description: "Ocorreu um problema, mas seu interesse foi registrado. Tente o WhatsApp se preferir.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors">
            <X size={24} />
          </button>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Excelente Escolha!</h2>
          <p className="text-gray-600 mb-1">Você está interessado no</p>
          <p className="text-xl font-bold text-yellow-500 mb-6">{car.brand} {car.model}</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Seu Nome</label>
              <input type="text" name="name" id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="mt-1 w-full px-4 py-3 bg-gray-100 border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" required />
            </div>
            <div>
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700">Seu WhatsApp ou E-mail</label>
              <input type="text" name="contact" id="contact" value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} className="mt-1 w-full px-4 py-3 bg-gray-100 border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" required />
            </div>
            <div className="space-y-3 pt-2">
              <Button type="submit" disabled={isSubmitting} className="w-full bg-yellow-400 text-black font-bold py-4 text-lg hover:bg-yellow-500">
                {isSubmitting ? 'Enviando...' : 'Receber Contato'}
              </Button>
              <Button asChild className="w-full bg-green-500 text-white font-bold py-4 text-lg hover:bg-green-600">
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                  <FaWhatsapp className="w-5 h-5 mr-3" /> Falar agora por WhatsApp
                </a>
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default InterestModal;
