import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroBackground from '@/assets/ponte.jpg'; // já apontando para a ponte (alta-res)
import { getFeaturedCars, getTestimonials } from '@/lib/car-api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ReactMarkdown from 'react-markdown';
import BackgroundShape from '@/components/BackgroundShape';

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
    { num: 1, title: 'Primeiro Contato', description: 'Você nos conta qual carro deseja comprar ou vender.' },
    { num: 2, title: 'Nossa Atuação', description: 'Cuidamos de toda a busca, avaliação, fotos e anúncios.' },
    { num: 3, title: 'Negociação Segura', description: 'Intermediamos o contato e a burocracia com total segurança.' },
    { num: 4, title: 'Conquista Realizada', description: 'Você fecha o melhor negócio sem sair de casa.' },
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

        {/* =========================
            HERO: mais largo, fundo sem blur (imagem em alta resolução),
            overlay leve apenas para contraste, texto com pontos finais.
            ========================= */}
        <section
          className="relative flex items-center justify-center text-left text-white overflow-hidden"
          style={{ height: '75vh' }}
        >
          {/* fundo (imagem em alta-res; sem blur aplicado na imagem) */}
          <div className="absolute inset-0 z-0">
            <img src={heroBackground} alt="Fundo hero" className="w-full h-full object-cover" />
            {/* overlay leve para contraste (quase transparente) */}
            <div className="absolute inset-0 bg-black/10" />
          </div>

          {/* conteúdo (z-10) - container mais largo: max-w-8xl */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 w-full px-6 sm:px-8 lg:px-12"
          >
            {/* centraliza e aumenta largura disponível (max-w-8xl) */}
            <div className="mx-auto max-w-8xl flex items-center justify-between h-full">
              {/* texto à esquerda: md:w-7/12 ocupa mais espaço; padding-left empurra o conteúdo para a direita dentro do bloco */}
              <div className="w-full md:w-7/12 flex flex-col justify-center py-12 pl-8 md:pl-16 lg:pl-24">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-white">
                  <span className="block">Venda com segurança.</span>
                  <span className="block text-yellow-400">Compre com confiança.</span>
                </h2>

                <p className="mt-4 text-sm md:text-lg text-gray-100 max-w-2xl">
                  Assessoria completa, negociação transparente e garantia de melhor valor.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="bg-yellow-400 text-black font-bold text-lg px-6 py-3 hover:bg-yellow-500 transition-transform hover:scale-105"
                  >
                    <Link to="/estoque">Quero Comprar</Link>
                  </Button>

                  <Button
                    asChild
                    size="lg"
                    className="bg-black text-yellow-400 font-bold text-lg px-6 py-3 hover:bg-gray-800 transition-transform hover:scale-105"
                  >
                    <Link to="/vender">Quero Vender</Link>
                  </Button>
                </div>
              </div>

              {/* espaço direito mantido apenas para equilíbrio visual (imagem background mostra o carro) */}
              <div className="hidden md:block md:w-5/12 h-full" />
            </div>
          </motion.div>
        </section>

        {/* =========================
            RESTANTE DA PÁGINA (mantive seu conteúdo original)
            ========================= */}
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

        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Veículos em Destaque</h2>
              <p className="mt-4 text-lg text-gray-600">Uma amostra do nosso estoque selecionado.</p>
            </div>
            {featuredCars.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {featuredCars.map((car) => (
                  <motion.div
                    key={car.id}
                    className="bg-white rounded-2xl overflow-hidden shadow-lg border flex flex-col transition-transform duration-300 hover:-translate-y-2"
                  >
                    <img
                      src={car.main_photo_url || 'https://placehold.co/400x300/e2e8f0/4a5568?text=Sem+Foto'}
                      alt={`${car.brand} ${car.model}`}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="text-lg font-bold text-gray-900">
                        {car.brand} {car.model}
                      </h3>
                      <p className="text-xl font-bold text-gray-800 my-2">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(car.price)}
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
    </>
  );
};

export default Home;

