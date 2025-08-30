import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { addLead } from '@/lib/car-api';

const InterestModal = ({ car, onClose }) => {
  const [formData, setFormData] = useState({ name: '', contact: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    const { error } = await addLead(leadData);

    if (!error) {
      toast({
        title: "Interesse registrado com sucesso! 🎉",
        description: "Entraremos em contato em breve pelo WhatsApp."
      });
      onClose();
    } else {
      toast({
        title: "Erro no envio",
        description: "Ocorreu um problema. Por favor, tente novamente.",
        variant: "destructive"
      });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Excelente Escolha!</h2>
        <p className="text-gray-600 mb-1">Você está interessado no</p>
        <p className="text-xl font-bold text-yellow-500 mb-6">{car.brand} {car.model}</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Seu Nome</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="mt-1 w-full px-4 py-3 bg-gray-100 border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" />
          </div>
          <div>
            <label htmlFor="contact" className="block text-sm font-medium text-gray-700">Seu WhatsApp ou E-mail</label>
            <input type="text" name="contact" id="contact" value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} className="mt-1 w-full px-4 py-3 bg-gray-100 border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" />
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full bg-yellow-400 text-black font-bold py-4 text-lg hover:bg-yellow-500">
            {isSubmitting ? 'Enviando...' : 'Receber Contato'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default InterestModal;
