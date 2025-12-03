// src/pages/Services.jsx
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ShoppingCart, Tool, Tire, Film, ChevronRight } from 'lucide-react';
import BackgroundShape from '@/components/BackgroundShape';
//import placeholderService from '@/assets/placeholder-service.jpg'; // se não existir, substitua por URL

const servicesData = [
  {
    id: 'multimidia',
    title: 'Central Multimídia',
    short: 'Instalação e configuração com garantia AutenTicco.',
    icon: <ShoppingCart className="w-6 h-6" />,
    img: 'https://placehold.co/600x400?text=Central+Multim%C3%ADdia',
  },
  {
    id: 'insulfilm',
    title: 'Insulfilm',
    short: 'Proteção, conforto térmico e estética.',
    icon: <Film className="w-6 h-6" />,
    img: 'https://placehold.co/600x400?text=Insulfilm',
  },
  {
    id: 'pneus',
    title: 'Pneus, Alinhamento e Balanceamento',
    short: 'Serviços completos com parceiras certificadas.',
    icon: <Tire className="w-6 h-6" />,
    img: 'https://placehold.co/600x400?text=Pneus+%26+Alinhamento',
  },
  {
    id: 'martelinho',
    title: 'Martelinho de Ouro',
    short: 'Reparos sem pintura — acabamento profissional.',
    icon: <Tool className="w-6 h-6" />,
    img: 'https://placehold.co/600x400?text=Martelinho+de+Ouro',
  },
];

const Services = () => {
  return (
    <div className="bg-white pt-28">
      <Helmet>
        <title>Loja & Serviços - AutenTicco Motors</title>
        <meta
          name="description"
          content="Serviços, acessórios e pequenas manutenções entregues com a qualidade e garantia AutenTicco. Temos parceiros qualificados para cada necessidade."
        />
      </Helmet>

      <BackgroundShape />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="py-20 text-center">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">
              Loja & Serviços <span className="text-yellow-500">AutenTicco</span>
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              Oferecemos uma seleção de serviços e acessórios feitos por parceiros qualificados — entregues ao cliente com a nossa garantia e nota AutenTicco.
            </p>
          </motion.div>
        </section>

        <section className="py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {servicesData.map((s) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-gray-50 rounded-2xl overflow-hidden shadow-md border hover:shadow-lg transition-transform hover:-translate-y-2"
              >
                <div className="aspect-w-16 aspect-h-10">
                  <img src={s.img} alt={s.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-black flex-shrink-0">
                      {s.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{s.title}</h3>
                      <p className="text-gray-600 mt-1">{s.short}</p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-sm text-gray-500">Parceiros certificados</span>
                    <button className="inline-flex items-center gap-2 text-yellow-500 font-semibold">
                      Saiba mais <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 text-center text-gray-600">
            <p>
              Esta é a versão informativa. Quando o catálogo estiver definido (nome dos serviços, fotos e preços), atualizamos os cards com conteúdo real.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Services;

