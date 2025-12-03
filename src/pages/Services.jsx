// src/pages/Services.jsx
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import BackgroundShape from '@/components/BackgroundShape';

/* Ícones SVG grandes e claros (inline) */
const IconScreen = ({ className = 'w-10 h-10' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <rect x="3" y="4" width="18" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    <rect x="7" y="8" width="10" height="6" rx="0.8" fill="currentColor" />
    <path d="M9 18h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const IconWindow = ({ className = 'w-10 h-10' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M12 3v18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M3 12h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const IconWheel = ({ className = 'w-10 h-10' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="12" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M12 5v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M12 19v-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M5 12h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M19 12h-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const IconHammer = ({ className = 'w-10 h-10' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M21 3l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 4l6 6-4 4-6-6 4-4z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 21l6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* conteúdo enxuto e direto */
const servicesData = [
  {
    id: 'multimidia',
    title: 'Central Multimídia',
    short: 'Instalação e integração de som e tela (Android Auto / CarPlay).',
    icon: <IconScreen />,
  },
  {
    id: 'insulfilm',
    title: 'Insulfilm',
    short: 'Aplicação profissional de películas (controle térmico e visual).',
    icon: <IconWindow />,
  },
  {
    id: 'pneus',
    title: 'Pneus & Alinhamento',
    short: 'Troca de pneus, alinhamento e balanceamento.',
    icon: <IconWheel />,
  },
  {
    id: 'martelinho',
    title: 'Martelinho de Ouro',
    short: 'Reparos finos de lataria sem pintura.',
    icon: <IconHammer />,
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
                      {/* ícone grande */}
                      <div className="text-black">{s.icon}</div>
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

