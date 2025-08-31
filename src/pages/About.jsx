import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Shield, Users, Award, Star, Check } from 'lucide-react';
import familyCarImage from '@/assets/familia-carro.png';
import { getTestimonials } from '@/lib/car-api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ReactMarkdown from 'react-markdown';
import BackgroundShape from '@/components/BackgroundShape';

const About = () => {
    const [testimonials, setTestimonials] = useState([]);
    const [selectedTestimonial, setSelectedTestimonial] = useState(null);

    useEffect(() => {
        const fetchTestimonials = async () => {
            const data = await getTestimonials();
            setTestimonials(data || []);
        };
        fetchTestimonials();
    }, []);

    const values = [
        { icon: Shield, title: "Segurança", description: "Proteção total em todas as transações, com verificação rigorosa de procedência e documentação." },
        { icon: Users, title: "Transparência", description: "Processo claro e honesto, sem taxas ocultas ou surpresas desagradáveis." },
        { icon: Award, title: "Excelência", description: "Padrão premium de atendimento e qualidade em todos os serviços oferecidos." }
    ];

    const differentials = [
        "Assessoria Completa do início ao fim",
        "Segurança Total contra golpes e fraudes",
        "Inovação na Troca: compramos seu carro",
        "Marketing Profissional sem custo adicional"
    ];
    
    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    const TEXT_LIMIT = 30;

    return (
        <div className="bg-white pt-28">
            <Helmet>
                <title>Quem Somos - AutenTicco Motors</title>
                <meta name="description" content="Conheça a AutenTicco Motors, o marketplace premium de veículos que revoluciona a compra e venda de carros com segurança, transparência e inovação." />
            </Helmet>
            <BackgroundShape />

            <div className="relative z-10">
                {/* Hero Section */}
                <section className="py-20 text-center bg-gray-50">
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-4xl mx-auto px-4">
                        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
                            A <span className="text-yellow-500">evolução</span> do mercado automotivo
                        </h1>
                        <p className="mt-6 text-lg text-gray-600">
                            Somos a AutenTicco Motors, o marketplace premium que nasceu para eliminar a burocracia, os riscos e as incertezas da compra e venda de veículos.
                        </p>
                    </motion.div>
                </section>

                {/* Seção Missão e Imagem */}
                <section className="py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
                                <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-6">Nossa Missão é <span className="text-yellow-500">Simplificar</span></h2>
                                <p className="text-gray-600 mb-4 leading-relaxed">
                                    Criamos uma plataforma que traz uma verdadera revolução para o mercado. Nossa missão é simplificar a compra e venda de veículos, eliminando riscos e burocracia através de uma assessoria completa e pessoal.
                                </p>
                                <p className="text-gray-600 leading-relaxed">
                                    Focamos em veículos premium, de R$ 80k a R$ 500k, oferecendo uma experiência única que vai da avaliação à entrega final, sempre com o mais alto padrão de segurança e profissionalismo.
                                </p>
                                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {differentials.map((item, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <Check className="h-6 w-6 text-green-500 flex-shrink-0" />
                                            <span className="text-gray-700 font-medium">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="aspect-w-4 aspect-h-3 rounded-2xl overflow-hidden shadow-2xl border self-start">
                                <img
                                    className="w-full h-full object-cover"
                                    alt="Família feliz recebendo as chaves de um carro"
                                    src={familyCarImage}
                                />
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Nossos Valores */}
                <section className="py-20 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Nossos Pilares</h2>
                            <p className="mt-4 text-lg text-gray-600">Os valores que guiam cada uma de nossas ações.</p>
                        </div>
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-3 gap-8"
                            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
                            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                        >
                            {values.map((value) => (
                                <motion.div
                                    key={value.title} variants={itemVariants}
                                    className="text-center p-8 bg-gray-800 bg-opacity-90 border border-gray-700 rounded-xl shadow-md transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/30 hover:border-yellow-500"
                                >
                                    <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <value.icon className="w-8 h-8 text-black" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">{value.title}</h3>
                                    <p className="text-gray-300 leading-relaxed">{value.description}</p>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* Depoimentos */}
                <section className="py-20 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Histórias de Sucesso</h2>
                            <p className="mt-4 text-lg text-gray-600">Experiências reais de quem confia na AutenTicco Motors.</p>
                        </div>
                        {testimonials.length > 0 ? (
                            <motion.div
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                                initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
                                variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                            >
                                {testimonials.map((testimonial) => (
                                    <motion.div
                                        key={testimonial.id}
                                        variants={itemVariants}
                                        className="bg-gray-50 p-8 rounded-2xl shadow-lg border flex flex-col justify-between h-full"
                                    >
                                        <div className="flex-grow">
                                            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 mb-4" />
                                            <p className="italic text-gray-700 mb-4 line-clamp-4">
                                                {testimonial.testimonial_text}
                                            </p>
                                            {testimonial.testimonial_text.split(' ').length > TEXT_LIMIT && (
                                                <button
                                                    onClick={() => setSelectedTestimonial(testimonial)}
                                                    className="text-yellow-500 hover:text-yellow-600 font-semibold text-sm mb-4"
                                                >
                                                    Ler mais...
                                                </button>
                                            )}
                                        </div>
                                        <div className="border-t pt-4 mt-auto">
                                            <p className="font-bold text-gray-900">{testimonial.client_name}</p>
                                            {testimonial.car_sold && <p className="text-sm text-gray-500">Cliente {testimonial.car_sold}</p>}
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            <p className="text-center text-gray-600 text-lg">Nenhum depoimento disponível ainda.</p>
                        )}
                    </div>
                </section>
            </div>

            <Dialog open={!!selectedTestimonial} onOpenChange={() => setSelectedTestimonial(null)}>
                <DialogContent className="bg-white text-gray-900">
                    <DialogHeader>
                        <DialogTitle>{selectedTestimonial?.client_name}</DialogTitle>
                        {selectedTestimonial?.car_sold && <p className="text-sm text-gray-500">Cliente {selectedTestimonial.car_sold}</p>}
                    </DialogHeader>
                    <div className="py-4 prose max-w-none">
                        <ReactMarkdown>{selectedTestimonial?.testimonial_text}</ReactMarkdown>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default About;
