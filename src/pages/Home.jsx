import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Clock, Zap, Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FaWhatsapp } from 'react-icons/fa';

const Home = () => {

  const whatsappLink = "https://wa.me/5511975071300";

  const featuredCars = [
    {
      id: 1,
      brand: "BMW",
      model: "X5 M Sport",
      year: 2022,
      price: "R$ 450.000",
      image: "Luxurious BMW X5 M Sport in metallic gray"
    },
    {
      id: 2,
      brand: "Mercedes",
      model: "C300 AMG",
      year: 2023,
      price: "R$ 320.000",
      image: "Elegant Mercedes C300 AMG in pearl white"
    },
    {
      id: 3,
      brand: "Audi",
      model: "Q7 Prestige",
      year: 2022,
      price: "R$ 380.000",
      image: "Premium Audi Q7 Prestige in midnight black"
    }
  ];

  const testimonials = [
    {
      name: "Carlos Silva",
      text: "Experiência incrível! Venderam meu carro em 15 dias sem nenhuma dor de cabeça.",
      rating: 5
    },
    {
      name: "Marina Santos",
      text: "Assessoria completa e profissional. Recomendo para quem quer segurança na compra.",
      rating: 5
    },
    {
      name: "Roberto Lima",
      text: "Processo transparente do início ao fim. Equipe muito competente!",
      rating: 5
    }
  ];

  return (
    <>
      <Helmet>
        <title>AutenTicco Motors - Marketplace de Veículos Premium</title>
        <meta name="description" content="Compre e venda veículos premium com segurança total. Assessoria completa, verificação de procedência e processo sem burocracia." />
        <meta property="og:title" content="AutenTicco Motors - Marketplace de Veículos Premium" />
        <meta property="og:description" content="Compre e venda veículos premium com segurança total. Assessoria completa, verificação de procedência e processo sem burocracia." />
      </Helmet>

      <div className="pt-20">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
             <img  class="w-full h-full object-cover opacity-40" alt="Abstract digital art of car silhouettes with dynamic light trails on a dark background" src="https://images.unsplash.com/photo-1688829012453-358ab4c3fe80" />
          </div>
           <div className="absolute inset-0 hero-gradient z-10"></div>
          
          <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
             <img 
                src="https://horizons-cdn.hostinger.com/658e15d6-90a3-489b-9359-6db98ae64202/c41758bb4f122fc5c7f566d37de84f3e.png" 
                alt="AutenTicco Motors Logo" 
                className="h-28 md:h-40 w-auto mx-auto mb-8"
              />
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
                A <span className="gradient-text">evolução</span> na compra<br />
                e venda de veículos
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
                Segurança total, assessoria completa e zero burocracia
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/vender">
                  <Button className="bg-yellow-400 text-black hover:bg-yellow-500 text-lg px-8 py-4 h-auto font-bold yellow-glow">
                    Vender Meu Carro Agora
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                    <Button 
                    variant="outline" 
                    className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black text-lg px-8 py-4 h-auto font-bold w-full"
                    >
                    <FaWhatsapp className="mr-2 w-5 h-5" />
                    Fale Conosco
                    </Button>
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Principais Vantagens */}
        <section className="py-20 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Por que escolher a <span className="gradient-text">AutenTicco</span>?
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Três pilares que fazem toda a diferença na sua experiência
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Shield,
                  title: "Segurança Total",
                  description: "Proteção contra golpes, verificação completa de laudos e procedência garantida"
                },
                {
                  icon: Clock,
                  title: "Praticidade",
                  description: "Processo simplificado do início ao fim, sem burocracia e com acompanhamento pessoal"
                },
                {
                  icon: Zap,
                  title: "Inovação",
                  description: "Compramos seu veículo de troca e cuidamos do marketing profissional por nossa conta"
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="glass-effect rounded-2xl p-8 text-center card-hover"
                >
                  <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6">
                    <feature.icon className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Veículos em Destaque */}
        <section className="py-20 bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Veículos em <span className="gradient-text">Destaque</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Seleção premium de veículos verificados e com procedência garantida
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {featuredCars.map((car, index) => (
                <motion.div
                  key={car.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="glass-effect rounded-2xl overflow-hidden card-hover"
                >
                  <div className="aspect-video overflow-hidden">
                    <img  class="w-full h-full object-cover" alt={`${car.image}`} src="https://images.unsplash.com/photo-1694027655519-016c93b014e6" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{car.brand} {car.model}</h3>
                    <p className="text-gray-400 mb-4">{car.year}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-yellow-400">{car.price}</span>
                      <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                        <Button 
                            variant="outline" 
                            className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
                        >
                            Ver Detalhes
                        </Button>
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-center">
              <Link to="/estoque">
                <Button className="bg-yellow-400 text-black hover:bg-yellow-500 text-lg px-8 py-4 h-auto font-bold">
                  Ver Todo o Estoque
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Depoimentos */}
        <section className="py-20 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                O que nossos <span className="gradient-text">clientes</span> dizem
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Experiências reais de quem confia na AutenTicco Motors
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="glass-effect rounded-2xl p-8 card-hover"
                >
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-6 italic">"{testimonial.text}"</p>
                  <p className="font-semibold text-yellow-400">{testimonial.name}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-20 bg-black">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Pronto para <span className="gradient-text">vender</span> seu carro?
              </h2>
              <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                Receba uma avaliação gratuita e descubra como podemos ajudar você a vender seu veículo com segurança e agilidade
              </p>
              <Link to="/vender">
                <Button className="bg-yellow-400 text-black hover:bg-yellow-500 text-xl px-12 py-6 h-auto font-bold yellow-glow">
                  Começar Agora
                  <ArrowRight className="ml-2 w-6 h-6" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Home;
