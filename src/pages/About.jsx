import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Shield, Users, Award, Star, Check } from 'lucide-react';
// Importando a nova imagem da família feliz com o carro
import familyCarImage from '@/assets/familia-carro.png'; // Certifique-se de que o nome do arquivo corresponde ao que você salvou

const About = () => {
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
    
    const testimonials = [
        { name: "Carlos Silva", text: "Experiência incrível! Venderam meu BMW em 15 dias sem nenhuma dor de cabeça. Processo transparente do início ao fim.", car: "BMW X5 2021" },
        { name: "Marina Santos", text: "Assessoria completa e profissional. Recomendo para quem quer segurança na compra de veículos premium.", car: "Mercedes C300 2022" },
    ];

    const stats = [
        { number: "500+", label: "Veículos Vendidos" },
        { number: "98%", label: "Clientes Satisfeitos" },
        { number: "15", label: "Dias (Média de Venda)" },
        { number: "100%", label: "Transações Seguras" }
    ];

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="bg-white pt-28">
            <Helmet>
                <title>Quem Somos - AutenTicco Motors</title>
                <meta name="description" content="Conheça a AutenTicco Motors, o marketplace premium de veículos que revoluciona a compra e venda de carros com segurança, transparência e inovação." />
            </Helmet>

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

                {/* Seção Missão e Imagem - Alinhamento Corrigido */}
                <section className="py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Ajustado items-start aqui para alinhar as colunas pelo topo */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start"> 
                            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
                                <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-6">Nossa Missão é <span className="text-yellow-500">Simplificar</span></h2>
                                <p className="text-gray-600 mb-4 leading-relaxed">
                                    Criamos uma plataforma que traz uma verdadeira revolução para o mercado. Nossa missão é simplificar a compra e venda de veículos, eliminando riscos e burocracia através de uma assessoria completa e pessoal.
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
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="aspect-w-4 aspect-h-3 rounded-2xl overflow-hidden shadow-2xl border self-start"> {/* Adicionado self-start */}
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

                {/* Seção de Depoimentos e Estatísticas podem continuar aqui... */}
            </div>
        </div>
    );
};

export default About;
