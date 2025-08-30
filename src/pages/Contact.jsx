import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Mail, MapPin, Clock, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { FaWhatsapp, FaTiktok, FaInstagram, FaFacebook, FaYoutube } from 'react-icons/fa';
import BackgroundShape from '@/components/BackgroundShape';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', subject: '', message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const socialLinks = {
        whatsapp: 'https://wa.me/5511975071300',
        instagram: 'https://www.instagram.com/autenticcomotors/',
        facebook: 'https://www.facebook.com/AutenTiccoMotors',
        youtube: 'https://www.youtube.com/channel/UCP7yeTZO5iD0lovXSaqInfg',
        tiktok: 'https://www.tiktok.com/@autenticcomotors',
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (!formData.name || !formData.email || !formData.message) {
            toast({
                title: "Campos obrigatórios",
                description: "Por favor, preencha nome, e-mail e mensagem.",
                variant: "destructive"
            });
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await fetch("https://formsubmit.co/ajax/contato@autenticcomotors.com", {
                method: "POST",
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                toast({
                    title: "Mensagem enviada com sucesso! 🎉",
                    description: "Nossa equipe responderá o mais breve possível."
                });
                setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
            } else {
                throw new Error("Falha no envio do formulário.");
            }
        } catch (error) {
            toast({
                title: "Erro no envio",
                description: "Ocorreu um problema. Tente novamente ou entre em contato pelo WhatsApp.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const contactInfo = [
        { icon: FaWhatsapp, title: "WhatsApp", info: "(11) 97507-1300", description: "Segunda a sexta, 8h às 18h" },
        { icon: Mail, title: "E-mail", info: "contato@autenticcomotors.com", description: "Resposta em até 24h" },
        { icon: MapPin, title: "Escritório", info: "R. Vieira de Morais, 2110", description: "Sala 1015 - Campo Belo, SP" },
        { icon: Clock, title: "Horário", info: "Seg - Sex: 8h às 18h", description: "Sáb: 9h às 14h" }
    ];

    return (
        <div className="relative isolate min-h-screen bg-gray-50 text-gray-800 pt-28">
            <Helmet>
                <title>Contato - AutenTicco Motors</title>
                <meta name="description" content="Entre em contato com a AutenTicco Motors. Telefone, e-mail, WhatsApp e formulário de contato." />
            </Helmet>
            <BackgroundShape />

            <div className="relative z-10">
                <section className="py-20 text-center">
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-4xl mx-auto px-4">
                        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
                            Entre em <span className="text-yellow-500">Contato</span>
                        </h1>
                        <p className="mt-6 text-lg text-gray-600">
                            Nossa equipe está pronta para ajudar você a encontrar o veículo ideal ou vender o seu com total segurança.
                        </p>
                    </motion.div>
                </section>

                <section className="pb-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {contactInfo.map((info, index) => (
                                <motion.div 
                                    key={index} 
                                    initial={{ opacity: 0, y: 30 }} 
                                    whileInView={{ opacity: 1, y: 0 }} 
                                    viewport={{ once: true, amount: 0.5 }} 
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="text-center p-6 bg-gray-800 bg-opacity-90 border border-gray-700 rounded-xl shadow-md
                                               transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/30 hover:border-yellow-500"
                                >
                                    <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <info.icon className="w-6 h-6 text-black" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-1">{info.title}</h3>
                                    <p className="text-yellow-400 font-semibold mb-1 text-center">{info.info}</p>
                                    <p className="text-sm text-gray-400">{info.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border">
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">Envie sua mensagem</h2>
                                <p className="text-gray-600 mb-8">Preencha o formulário e retornaremos o mais breve possível.</p>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome *</label>
                                            <input id="name" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-100 border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefone</label>
                                            <input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-100 border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-mail *</label>
                                        <input id="email" type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-100 border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="message" className="block text-sm font-medium text-gray-700">Mensagem *</label>
                                        <textarea id="message" name="message" value={formData.message} onChange={handleInputChange} rows={5} className="w-full px-4 py-3 bg-gray-100 border-gray-300 rounded-lg resize-none focus:ring-yellow-500 focus:border-yellow-500" />
                                    </div>
                                    <Button type="submit" disabled={isSubmitting} className="w-full bg-yellow-400 text-black font-bold py-4 text-lg hover:bg-yellow-500 transition-all duration-300 transform hover:scale-105">
                                        <Send className="w-5 h-5 mr-3" />
                                        {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
                                    </Button>
                                </form>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }} className="space-y-8">
                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Nossa Localização</h3>
                                    <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden">
                                        <iframe
                                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3655.703358055088!2d-46.66892568440552!3d-23.61448398465691!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce5a0e0c0a3e9d%3A0x6b192e39e9e1c2e6!2sR.%20Vieira%20de%20Morais%2C%202110%20-%20Campo%20Belo%2C%20S%C3%A3o%20Paulo%20-%20SP%2C%2004617-007!5e0!3m2!1spt-BR!2sbr!4v1693421453315!5m2!1spt-BR!2sbr"
                                            className="w-full h-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade">
                                        </iframe>
                                    </div>
                                </div>
                                {/* CARD "SIGA-NOS" COM TÍTULO MENOR E ÍCONES MAIORES */}
                                <div className="p-8 bg-gray-800 bg-opacity-90 border border-gray-700 rounded-xl shadow-md">
                                    <h3 className="text-xl font-bold text-white mb-6 text-center">Siga-nos</h3>
                                    <div className="flex justify-center space-x-6">
                                        <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-yellow-400 transition-transform hover:scale-125 duration-300"><FaInstagram size={36} /></a>
                                        <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-yellow-400 transition-transform hover:scale-125 duration-300"><FaFacebook size={36} /></a>
                                        <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-yellow-400 transition-transform hover:scale-125 duration-300"><FaYoutube size={36} /></a>
                                        <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-yellow-400 transition-transform hover:scale-125 duration-300"><FaTiktok size={36} /></a>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Contact;
