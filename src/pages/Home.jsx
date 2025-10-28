// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Star, ArrowRight, Droplet } from 'lucide-react';
import { getFeaturedCars, getTestimonials } from '@/lib/car-api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ReactMarkdown from 'react-markdown';
import BackgroundShape from '@/components/BackgroundShape';
import heroBackground from '@/assets/ponte.jpg';

const Home = () => {
  const [featuredCars, setFeaturedCars] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [selectedTestimonial, setSelectedTestimonial] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const [cars, tests] = await Promise.all([getFeaturedCars(), getTestimonials()]);
      setFeaturedCars(cars || []);
      setTestimonials(tests || []);
    };
    loadData();
  }, []);

  const timelineSteps = [
    { num: 1, title: 'Vocẽ envia as informações do seu carro', description: 'Realizamos um estudo de mercado e sugerimos um valor de venda ideal para o anúncio.' },
    { num: 2, title: 'Iremos até você tirar as fotos e videos do carro', description: 'Anunciamos seu carro em diversas plataformas automiotivas e redes sociais, alcançando um publico amplo e diversificado.' },
    { num: 3, title: 'Agendamos e acompanhamos as visitas', description: 'Agendamos e acompanhamos as visitas de todos os potencias compradores, garantindo segurança e transparencia na negociação.' },
    { num: 4, title: 'Auxiliamos na documentação e pronto, seu carro está vendido', description: 'Cuidamos de todo o processo de documentação e pagamento garantindo que tudo seja simples e claro para vocẽ e o comprador.' },
  ];

  const TEXT_LIMIT = 20;

  return (
    <>
      <Helmet>
        <title>AutenTicco Motors - A evolução na compra e venda de veículos</title>
        <meta
          name="description"
          content="Segurança total, assessoria completa e zero burocracia para você comprar ou vender seu próximo carro."
        />
      </Helmet>

      <div className="bg-white">
        <BackgroundShape />

        {/* HERO */}
        <section
          className="relative flex items-center justify-center text-left text-white overflow-hidden"
          // 👉 em vez de height fixa, min-height fluida. Garante que o texto nunca corte (150%/200%).
          style={{ minHeight: 'clamp(520px, 72vh, 820px)' }}
        >
          {/* imagem de fundo */}
          <div className="absolute inset-0 z-0">
            <img
              src={heroBackground}
              alt="Fundo hero"
              className="w-full h-full object-cover"
              style={{ display: 'block', objectPosition: 'center 35%' }}
            />
            <div className="absolute inset-0 bg-black/10" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            // 👇 espaço no topo (mobile) considerando header fixo + safe area. E um pb para folga.
            className="relative z-10 w-full px-4 sm:px-6 lg:px-12 pt-[calc(env(safe-area-inset-top)+88px)] md:pt-0 pb-6 md:pb-0"
          >
            {/* largura alinhada ao restante do site */}
            <div className="mx-auto max-w-7xl flex items-center justify-between h-full">
              <div className="w-full md:w-5/12 flex flex-col justify-center py-6 md:py-12 pl-2 sm:pl-6 md:pl-12 lg:pl-20">
                <div
                  className="rounded-2xl p-5 sm:p-6 md:p-8"
                  style={{
                    background: 'linear-gradient(rgba(3,3,3,0.48), rgba(3,3,3,0.44))',
                    backdropFilter: 'saturate(120%) blur(2px)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
                    maxWidth: '560px',
                    width: '100%',
                  }}
                >
                  <h2
                    className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight"
                    style={{ color: '#fff', textShadow: '0 6px 18px rgba(0,0,0,0.45)' }}
                  >
                    <span className="block">Venda com segurança.</span>
                    <span className="block" style={{ color: '#F7C93C' }}>Compre com confiança.</span>
                  </h2>

                  <p className="mt-3 sm:mt-4 text-sm md:text-base text-gray-200 max-w-2xl">
                    Assessoria completa, negociação transparente e garantia de melhor valor.
                  </p>

                  <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <Link
                      to="/estoque"
                      className="inline-block bg-yellow-400 text-black px-6 py-3 rounded-xl text-base sm:text-lg font-semibold shadow-2xl transform transition-all duration-200 hover:-translate-y-1 text-center"
                    >
                      Quero Comprar
                    </Link>

                    <Link
                      to="/vender"
                      className="inline-block bg-black text-yellow-400 px-6 py-3 rounded-xl text-base sm:text-lg font-semibold shadow-md border-2 border-yellow-400 transition-all duration-200 hover:bg-yellow-400 hover:text-black text-center"
                    >
                      Quero Vender
                    </Link>
                  </div>
                </div>
              </div>

              <div className="hidden md:block md:w-7/12 h-full" />
            </div>
          </motion.div>
        </section>

        {/* "Quer vender seu carro ?" */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Quer vender seu carro ?</h2>
              <p className="mt-4 text-lg text-gray-600">Venda seu carro sem sair de casa, com comodidade, transparencia e segurança</p>
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

        {/* Veículos em Destaque */}
        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Veículos em Destaque</h2>
              <p className="mt-4 text-lg text-gray-600">Uma amostra do nosso estoque selecionado.</p>
            </div>
            {featuredCars.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
                {featuredCars.map((car) => (
                  <motion.div
                    key={car.id}
                    className="bg-white rounded-2xl overflow-hidden shadow-lg border flex flex-col transition-transform duration-300 hover:-translate-y-2"
                  >
                    <div className="relative">
                      <img
                        src={car.main_photo_url || 'https://placehold.co/400x300/e2e8f0/4a5568?text=Sem+Foto'}
                        alt={`${car.brand} ${car.model}`}
                        className="w-full h-44 object-cover"
                      />
                      {/* fuel */}
                      {car.fuel && (
                        <div className="absolute top-3 left-3 bg-black/60 text-white text-xs font-bold py-1 px-3 rounded-full flex items-center gap-1.5">
                          <Droplet size={12} />
                          <span className="leading-none">{car.fuel}</span>
                        </div>
                      )}
                      {/* blindado */}
                      {(car.is_blindado || car.isBlindado || car.blindado) && (
                        <div className="absolute top-3 right-3 bg-yellow-400 text-black text-xs font-bold py-1 px-3 rounded-full">
                          BLINDADO
                        </div>
                      )}
                    </div>

                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="text-lg font-bold text-gray-900">
                        {car.brand} {car.model}
                      </h3>
                      <p className="text-xl font-bold text-gray-800 my-2">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(car.price) || 0)}
                      </p>
                      <Link
                        to={`/carro/${car.slug}`}
                        className="mt-auto group w-full inline-flex items-center justify-center text-center bg-yellow-400 text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-500 transition-all duration-300"
                      >
                        Ver Detalhes <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {testimonials && testimonials.length > 0 && (
          <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">O que Nossos Clientes Dizem</h2>
                <p className="mt-4 text-lg text-gray-600">A confiança que construímos se reflete em cada negócio fechado.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {testimonials.slice(0, 3).map((testimonial) => (
                  <motion.div key={testimonial.id} className="p-8 bg-gray-800 text-white rounded-2xl shadow-lg border border-gray-700 flex flex-col justify-between h-full">
                    <div className="flex-grow">
                      <Star className="w-5 h-5 text-yellow-400 fill-current mb-4" />
                      <p className="italic mb-4 line-clamp-4">{testimonial.testimonial_text}</p>
                      {testimonial.testimonial_text.split(' ').length > TEXT_LIMIT && (
                        <button onClick={() => setSelectedTestimonial(testimonial)} className="text-yellow-400 hover:text-yellow-300 font-semibold text-sm">
                          Ler mais...
                        </button>
                      )}
                    </div>
                    <div className="mt-auto border-t border-gray-700 pt-4">
                      <p className="font-bold text-yellow-400">{testimonial.client_name}</p>
                      {testimonial.car_sold && <p className="text-sm text-gray-400">Cliente {testimonial.car_sold}</p>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="py-24 bg-gray-900 text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold">Pronto para dar o próximo passo?</h2>
            <p className="mt-4 text-lg text-gray-300">Seja para comprar ou vender, a experiência AutenTicco está a um clique de distância.</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/estoque" className="bg-yellow-400 text-black font-bold text-lg px-8 py-6 rounded-md hover:bg-yellow-500 transition-transform hover:scale-105">Quero Comprar</Link>
              <Link to="/vender" className="bg-black border-2 border-yellow-400 text-yellow-400 font-bold text-lg px-8 py-6 rounded-md hover:bg-yellow-400 hover:text-black transition-transform hover:scale-105">Quero Vender</Link>
            </div>
          </div>
        </section>
      </div>

      <Dialog open={!!selectedTestimonial} onOpenChange={() => setSelectedTestimonial(null)}>
        <DialogContent className="bg-white text-gray-900">
          <DialogHeader>
            <DialogTitle>{selectedTestimonial?.client_name}</DialogTitle>
            {selectedTestimonial?.car_sold && <p className="text-sm text-gray-500">Cliente {testimonial.car_sold}</p>}
          </DialogHeader>
          <div className="py-4 prose max-w-none">
            <ReactMarkdown>{selectedTestimonial?.testimonial_text}</ReactMarkdown>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Home;

