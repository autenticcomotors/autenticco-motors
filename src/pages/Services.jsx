// src/pages/Services.jsx
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import BackgroundShape from '@/components/BackgroundShape';

/* SVGs inline — garantem compatibilidade no build */
const IconScreen = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <rect x="3" y="4" width="18" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    <path d="M8 20h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M12 16v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const IconWindow = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M12 3v18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M3 12h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const IconWheel = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <circle cx="12" cy="12" r="6.2" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="12" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M12 4v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M12 20v-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M4 12h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M20 12h-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const IconHammer = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M2 20l7-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 15l6-6 4 4-6 6-4-4z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 9l4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* imagens públicas (Unsplash) — aleatórias por termo; se quiser imagens fixas, me envia os arquivos */
const servicesData = [
  {
    id: 'multimidia',
    title: 'Central Multimídia',
    short:
      'Instalação e configuração de som, tela e integração com smartphone — entrega com garantia AutenTicco.',
    img: 'https://source.unsplash.com/1200x800/?car-audio,headunit,car-dashboard',
    smallIcon: <IconScreen />,
  },
  {
    id: 'insulfilm',
    title: 'Insulfilm',
    short: 'Aplicação profissional de películas — conforto térmico, proteção UV e estética.',
    img: 'https://source.unsplash.com/1200x800/?car-window,tint,window-tint',
    smallIcon: <IconWindow />,
  },
  {
    id: 'pneus',
    title: 'Pneus, Alinhamento & Balanceamento',
    short: 'Troca de pneus, alinhamento e balanceamento com garantia e processo profissional.',
    img: 'https://source.unsplash.com/1200x800/?car-wheel,tire,tyre',
    smallIcon: <IconWheel />,
  },
  {
    id: 'martelinho',
    title: 'Martelinho de Ouro',
    short: 'Reparos finos de lataria sem pintura — acabamento preciso e discreto.',
    img: 'https://source.unsplash.com/1200x800/?auto-body,body-repair,car-repair',
    smallIcon: <IconHammer />,
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
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">
              Loja & Serviços <span className="text-yellow-500">AutenTicco</span>
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              Oferecemos serviços e acessórios entregues ao cliente como se fossem feitos por nós — com nossa nota e garantia.
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
                {/* imagem no topo representativa */}
                <div className="w-full h-44 bg-gray-200 overflow-hidden">
                  <img
                    src={s.img}
                    alt={s.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/1200x800?text=Serviço';
                    }}
                  />
                </div>

                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-black flex-shrink-0">
                      <div className="text-black">{s.smallIcon}</div>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">{s.title}</h3>
                      <p className="text-gray-600 mt-2 text-sm leading-relaxed">{s.short}</p>
                    </div>
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

