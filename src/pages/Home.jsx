// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';
import heroBackground from '@/assets/ponte.jpg'; // sua imagem hero
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
      try {
        const [cars, tests] = await Promise.all([
          getFeaturedCars(),
          getTestimonials()
        ]);
        setFeaturedCars(cars || []);
        setTestimonials(tests || []);
      } catch (err) {
        console.error('Erro ao carregar dados da home:', err);
      }
    };
    loadData();
  }, []);

  return (
    <>
      <Helmet>
        <title>AutenTicco Motors — Home</title>
      </Helmet>

      {/* HERO SECTION - RESPONSIVO E ESCALÁVEL */}
      <header
        className="relative w-full bg-center bg-cover bg-no-repeat"
        style={{
          backgroundImage: `url(${heroBackground})`,
          backgroundAttachment: 'scroll', // <--- evita comportamento 'fixo'
          // fallback sizing: cover garante escala correta com zoom
        }}
      >
        {/* Ajusta altura mínima de forma responsiva */}
        <div className="min-h-[60vh] md:min-h-[75vh] lg:min-h-screen flex items-center">
          {/* Overlay para melhorar contraste do texto */}
          <div className="absolute inset-0 bg-black/45 pointer-events-none" />

          <div className="relative z-10 container mx-auto px-4">
            <div className="max-w-4xl text-white">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <img src={logo} alt="AutenTicco Motors" className="w-36 mb-6" />
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                  Venda com segurança, compre com confiança.
                </h1>
                <p className="mt-4 text-base md:text-lg max-w-2xl">
                  Assessoria completa na compra e venda de seminovos — transparência total e zero burocracia.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link to="/vender" className="inline-block">
                    <Button>Quero vender</Button>
                  </Link>
                  <Link to="/estoque" className="inline-block">
                    <Button variant="outline">Ver carros</Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </header>

      {/* RESTO DA PÁGINA */}
      <main className="container mx-auto px-4 -mt-8 relative z-0">
        {/* Featured cars */}
        <section className="pt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Destaques</h2>
            <Link to="/estoque" className="text-sm text-slate-600 hover:underline">Ver todos <ArrowRight className="inline ml-1" size={14} /></Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredCars && featuredCars.length ? featuredCars.map(car => (
              <article key={car.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="w-full h-44 bg-slate-100">
                  {/* Caso tenha imagem principal use ela, senão fallback */}
                  <img
                    src={car.images?.[0] || heroBackground}
                    alt={`${car.brand} ${car.model}`}
                    className="w-full h-full object-cover"
                    style={{ display: 'block' }}
                  />
                </div>

                <div className="p-4">
                  <h3 className="font-medium text-lg">{car.title || `${car.brand} ${car.model}`}</h3>
                  <p className="text-sm text-slate-500">{car.year || ''} • {car.km ? `${car.km} km` : ''}</p>

                  {/* Exibir combustível e blindado conforme pedido anterior */}
                  <div className="mt-3 text-sm text-slate-700 flex items-center justify-between">
                    <span>{car.fuel || 'Combustível N/D'}</span>
                    <span>{car.blind ? 'Blindado' : 'Não blindado'}</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <strong className="text-lg">R$ {car.price?.toLocaleString('pt-BR') || '-'}</strong>
                    <Link to={`/veiculo/${car.id}`} className="text-sm text-indigo-600 hover:underline">Detalhes</Link>
                  </div>
                </div>
              </article>
            )) : (
              <p className="text-slate-600">Nenhum destaque disponível no momento.</p>
            )}
          </div>
        </section>

        {/* Testimonials */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">Depoimentos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials && testimonials.length ? testimonials.map(t => (
              <div key={t.id} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                    <Star size={16} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-700">{t.text}</p>
                    <p className="text-xs text-slate-500 mt-2">— {t.author}</p>
                  </div>
                </div>
              </div>
            )) : <p className="text-slate-600">Ainda sem depoimentos.</p>}
          </div>
        </section>

      </main>
    </>
  );
};

export default Home;

