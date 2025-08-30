import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';
import heroBackground from '@/assets/familia-conquista.jpg';
import { getFeaturedCars, getTestimonials } from '@/lib/car-api';

const Home = () => {
  const [featuredCars, setFeaturedCars] = useState([]);
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    const loadData = async () => {
        const [cars, tests] = await Promise.all([
            getFeaturedCars(),
            getTestimonials()
        ]);
        setFeaturedCars(cars || []);
        setTestimonials(tests || []);
    };
    loadData();
  }, []);

  const timelineSteps = [
    { num: 1, title: "Primeiro Contato", description: "Você nos conta qual carro deseja comprar ou vender." },
    { num: 2, title: "Nossa Atuação", description: "Cuidamos de toda a busca, avaliação, fotos e anúncios." },
    { num: 3, title: "Negociação Segura", description: "Intermediamos o contato e a burocracia com total segurança." },
    { num: 4, title: "Conquista Realizada", description: "Você fecha o melhor negócio sem sair de casa." },
  ];

  return (
    <>
      <Helmet>
        <title>AutenTicco Motors - A evolução na compra e venda de veículos</title>
        <meta name="description" content="Segurança total, assessoria completa e zero burocracia para você comprar ou vender seu próximo carro." />
      </Helmet>

      <div className="bg-white">
        {/* Bloco 1: Hero Section */}
        <section 
          className="relative flex items-center justify-center text-center text-gray-900 overflow-hidden"
          style={{ height: '75vh' }}
        >
          <div className="absolute inset-0 z-0">
            <img src={heroBackground} alt="Família feliz com carro novo" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm"></div>
          </div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            className="relative z-10 p-4"
          >
            <div className="flex justify-center items-center gap-4 md:gap-6 mb-8">
              <img 
                src={logo} 
                alt="AutenTicco Motors Logo" 
                className="h-28 md:h-40 w-auto"
                style={{ filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.6))' }}
              />
              <span 
                className="text-4xl md:text-6xl font-bold text-gray-900"
                style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.6)' }}
              >AutenTicco Motors</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              A evolução na compra e venda de veículos
            </h1>
            <p className="mt-4 text-lg md:text-xl text-gray-700 max-w-2xl mx-auto font-medium">
              Segurança total, assessoria completa e zero burocracia.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-yellow-400 text-black font-bold text-lg px-8 py-6 hover:bg-yellow-500 transition-transform hover:scale-105">
                <Link to="/estoque">Quero Comprar</Link>
              </Button>
              <Button asChild size="lg" className="bg-black text-yellow-400 font-bold text-lg px-8 py-6 hover:bg-gray-800 transition-transform hover:scale-105">
                <Link to="/vender">Quero Vender</Link>
              </Button>
            </div>
          </motion.div>
        </section>
        
        {/* Bloco 2: Como Funciona (Linha do Tempo) - REINTRODUZIDO */}
        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Como Funciona a Nossa Assessoria</h2>
              <p className="mt-4 text-lg text-gray-600">Um processo simples e transparente em 4 passos.</p>
            </div>
            <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-8">
              {timelineSteps.map((step, index) => (
                <motion.div 
                  key={step.num}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center w-16 h-16 bg-yellow-400 rounded-full mx-auto mb-4 ring-8 ring-white shadow-lg">
                    <span className="text-2xl font-bold text-black">{step.num}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Bloco 3: Vídeos Explicativos (Compra e Venda) - NOVO */}
        <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Assista e Entenda</h2>
                    <p className="mt-4 text-lg text-gray-600">Escolha o seu caminho: Compra ou Venda de veículos premium.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Vídeo de Compra */}
                    <motion.div 
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.5 }}
                        className="bg-gray-50 rounded-2xl overflow-hidden shadow-lg border p-6 flex flex-col items-center"
                    >
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Como Comprar seu Veículo</h3>
                        <div className="aspect-video w-full rounded-lg overflow-hidden mb-4">
                            <iframe
                                src="https://www.youtube.com/embed/VIDEO_ID_COMPRA" // SUBSTITUA com o ID do seu vídeo de COMPRA
                                title="Como Comprar com a AutenTicco Motors"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                className="w-full h-full"
                            ></iframe>
                        </div>
                        <p className="text-gray-700 text-center mb-4">Descubra um jeito seguro e sem burocracia de encontrar seu carro ideal.</p>
                        <Button asChild className="bg-yellow-400 text-black font-bold hover:bg-yellow-500">
                            <Link to="/estoque">Explorar Carros</Link>
                        </Button>
                    </motion.div>

                    {/* Vídeo de Venda */}
                    <motion.div 
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.5 }}
                        className="bg-gray-50 rounded-2xl overflow-hidden shadow-lg border p-6 flex flex-col items-center"
                    >
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Como Vender seu Veículo</h3>
                        <div className="aspect-video w-full rounded-lg overflow-hidden mb-4">
                            <iframe
                                src="https://www.youtube.com/embed/VIDEO_ID_VENDA" // SUBSTITUA com o ID do seu vídeo de VENDA
                                title="Como Vender com a AutenTicco Motors"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                className="w-full h-full"
                            ></iframe>
                        </div>
                        <p className="text-gray-700 text-center mb-4">Venda seu carro de forma rápida, segura e pelo melhor preço.</p>
                        <Button asChild className="bg-black text-yellow-400 font-bold hover:bg-gray-800 hover:text-white">
                            <Link to="/vender">Quero Vender</Link>
                        </Button>
                    </motion.div>
                </div>
            </div>
        </section>

        {/* Bloco 4: Veículos em Destaque */}
        <section className="py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Veículos em Destaque</h2>
                    <p className="mt-4 text-lg text-gray-600">Uma amostra do nosso estoque selecionado.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {featuredCars.map((car) => (
                        <motion.div key={car.id} className="bg-white rounded-2xl overflow-hidden shadow-lg border flex flex-col transition-transform duration-300 hover:-translate-y-2">
                             <img src={car.main_photo_url || 'https://placehold.co/400x300/e2e8f0/4a5568?text=Sem+Foto'} alt={`${car.brand} ${car.model}`} className="w-full h-48 object-cover" />
                             <div className="p-4 flex flex-col flex-grow">
                                <h3 className="text-lg font-bold text-gray-900">{car.brand} {car.model}</h3>
                                <p className="text-xl font-bold text-gray-800 my-2">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(car.price)}</p>
                                <Link to={`/carro/${car.slug}`} className="mt-auto group w-full inline-flex items-center justify-center text-center bg-yellow-400 text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-500 transition-all duration-300">
                                    Ver Detalhes <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                                </Link>
                             </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
        
        {/* Bloco 5: Depoimentos */}
        {testimonials && testimonials.length > 0 && (
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">O que Nossos Clientes Dizem</h2>
                        <p className="mt-4 text-lg text-gray-600">A confiança que construímos se reflete em cada negócio fechado.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.slice(0, 3).map((testimonial) => (
                            <motion.div key={testimonial.id} className="p-8 bg-gray-800 text-white rounded-2xl shadow-lg border border-gray-700">
                                <div className="flex mb-4">
                                    {[...Array(5)].map((_, i) => (<Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />))}
                                </div>
                                <p className="italic mb-6">"{testimonial.testimonial_text}"</p>
                                <p className="font-bold text-yellow-400">{testimonial.client_name}</p>
                                {testimonial.car_sold && <p className="text-sm text-gray-400">Comprou/Vendeu um {testimonial.car_sold}</p>}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        )}

        {/* Bloco 6: CTA Final */}
        <section className="py-24 bg-gray-900 text-white">
            <div className="max-w-4xl mx-auto px-4 text-center">
                <h2 className="text-3xl md:text-4xl font-extrabold">Pronto para dar o próximo passo?</h2>
                <p className="mt-4 text-lg text-gray-300">Seja para comprar ou vender, a experiência AutenTicco está a um clique de distância.</p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg" className="bg-yellow-400 text-black font-bold text-lg px-8 py-6 hover:bg-yellow-500 transition-transform hover:scale-105">
                        <Link to="/estoque">Quero Comprar</Link>
                    </Button>
                    <Button asChild size="lg" className="bg-black border-2 border-yellow-400 text-yellow-400 font-bold text-lg px-8 py-6 hover:bg-yellow-400 hover:text-black transition-transform hover:scale-105">
                        <Link to="/vender">Quero Vender</Link>
                    </Button>
                </div>
            </div>
        </section>
      </div>
    </>
  );
};

export default Home;
