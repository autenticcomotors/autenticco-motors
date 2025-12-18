// src/pages/Services.jsx
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import BackgroundShape from '@/components/BackgroundShape';
import { MonitorPlay, Car, SteeringWheel, Hammer } from 'phosphor-react';

/* Conteúdo dos serviços */
const servicesData = [
  {
    id: 'multimidia',
    title: 'Central Multimídia',
    short: 'Instalação e integração de som e tela (Android Auto / CarPlay).',
    icon: <MonitorPlay size={48} weight="fill" color="#000" />,
  },
  {
    id: 'insulfilm',
    title: 'Insulfilm',
    short: 'Aplicação profissional de películas (controle térmico e visual).',
    icon: <CarProfile size={48} weight="fill" color="#000" />,
  },
  {
    id: 'pneus',
    title: 'Pneus & Alinhamento',
    short: 'Troca de pneus, alinhamento e balanceamento.',
    icon: <SteeringWheel size={48} weight="fill" color="#000" />,
  },
  {
    id: 'martelinho',
    title: 'Martelinho de Ouro',
    short: 'Reparos finos de lataria sem pintura.',
    icon: <Hammer size={48} weight="fill" color="#000" />,
  },
];

const Services = () => {
  return (
    <div className="bg-white pt-28">
      <Helmet>
        <title>Loja & Serviços - AutenTicco Motors</title>
        <meta
          name="description"
          content="Serviços e acessórios — instalação, manutenção e reparos realizados por parceiros, entregues ao cliente pela AutenTicco."
        />
      </Helmet>

      <BackgroundShape />

      <div className="relative z-10 max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="py-20 text-center">
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">
              Loja & Serviços <span className="text-yellow-500">AutenTicco</span>
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              Serviços e acessórios: escolha o que precisa e a AutenTicco cuida do resto.
            </p>
          </motion.div>
        </section>

        <section className="py-10">
          <div className="flex justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 justify-center max-w-7xl">
              {servicesData.map((s) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-200"
                  style={{ minWidth: 260, maxWidth: 320 }}
                >
                  <div className="p-8 flex flex-col items-center text-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-yellow-400 flex items-center justify-center text-black drop-shadow-sm">
                      {s.icon}
                    </div>

                    <h3 className="text-lg font-bold text-gray-900">{s.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{s.short}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mt-10 text-center text-gray-600">
            <p>Versão informativa — quando o catálogo estiver fechado, atualizamos o conteúdo.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Services;

