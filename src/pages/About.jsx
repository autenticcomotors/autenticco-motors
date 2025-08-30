import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Shield, Users, Award, Target, Eye, Heart, Star } from 'lucide-react';

const About = () => {
  const values = [
    {
      icon: Shield,
      title: "Segurança",
      description: "Proteção total em todas as transações, com verificação rigorosa de procedência e documentação."
    },
    {
      icon: Users,
      title: "Transparência",
      description: "Processo claro e honesto, sem taxas ocultas ou surpresas desagradáveis."
    },
    {
      icon: Award,
      title: "Excelência",
      description: "Padrão premium de atendimento e qualidade em todos os serviços oferecidos."
    }
  ];

  const differentials = [
    {
      title: "Assessoria Completa",
      description: "Acompanhamento 'mão na massa' do início ao fim do processo, com suporte personalizado."
    },
    {
      title: "Segurança Total",
      description: "Proteção contra golpes, verificação de laudos e garantia de procedência de todos os veículos."
    },
    {
      title: "Inovação na Troca",
      description: "Compramos o veículo da troca para facilitar e agilizar todo o processo de venda."
    },
    {
      title: "Marketing Profissional",
      description: "Fotos, vídeos e anúncios em plataformas premium por nossa conta, sem custo adicional."
    }
  ];

  const testimonials = [
    {
      name: "Carlos Silva",
      text: "Experiência incrível! Venderam meu BMW em 15 dias sem nenhuma dor de cabeça. Processo transparente do início ao fim.",
      rating: 5,
      car: "BMW X5 2021"
    },
    {
      name: "Marina Santos",
      text: "Assessoria completa e profissional. Recomendo para quem quer segurança na compra de veículos premium.",
      rating: 5,
      car: "Mercedes C300 2022"
    },
    {
      name: "Roberto Lima",
      text: "Equipe muito competente! Cuidaram de toda a documentação e conseguiram um preço excelente pelo meu carro.",
      rating: 5,
      car: "Audi Q7 2021"
    },
    {
      name: "Ana Costa",
      text: "Superou todas as expectativas. Processo rápido, seguro e com o melhor preço do mercado.",
      rating: 5,
      car: "Porsche Cayenne 2022"
    }
  ];

  return (
    <>
      <Helmet>
        <title>Quem Somos - AutenTicco Motors</title>
        <meta name="description" content="Conheça a AutenTicco Motors, o marketplace premium de veículos que revoluciona a compra e venda de carros com segurança, transparência e inovação." />
        <meta property="og:title" content="Quem Somos - AutenTicco Motors" />
        <meta property="og:description" content="Conheça a AutenTicco Motors, o marketplace premium de veículos que revoluciona a compra e venda de carros com segurança, transparência e inovação." />
      </Helmet>

      <div className="pt-20 min-h-screen bg-black">
        {/* Hero Section */}
        <section className="py-20 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Quem <span className="gradient-text">Somos</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Somos a AutenTicco Motors, o marketplace premium que revoluciona a forma como você compra e vende veículos
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h2 className="text-3xl font-bold mb-6">
                  A <span className="gradient-text">evolução</span> do mercado automotivo
                </h2>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Criamos uma plataforma que traz uma verdadeira revolução para o mercado automotivo. Nossa missão é eliminar a burocracia, os riscos e as incertezas que tradicionalmente acompanham a compra e venda de veículos.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  Focamos em veículos premium, de R$ 80k a R$ 500k, oferecendo uma experiência completa que vai desde a avaliação até a entrega final, sempre com o mais alto padrão de segurança e profissionalismo.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="aspect-video rounded-2xl overflow-hidden"
              >
                <img  
                  className="w-full h-full object-cover" 
                  alt="Modern automotive showroom with premium vehicles" src="https://images.unsplash.com/photo-1634981297356-f9b4daa98a92" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Missão, Visão e Valores */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="glass-effect rounded-2xl p-8 text-center"
              >
                <Target className="w-12 h-12 text-yellow-400 mx-auto mb-6" />
                <h3 className="text-2xl font-bold mb-4">Missão</h3>
                <p className="text-gray-400 leading-relaxed">
                  Simplificar a compra e venda de veículos, eliminando riscos e burocracia através de uma assessoria completa e pessoal.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="glass-effect rounded-2xl p-8 text-center"
              >
                <Eye className="w-12 h-12 text-yellow-400 mx-auto mb-6" />
                <h3 className="text-2xl font-bold mb-4">Visão</h3>
                <p className="text-gray-400 leading-relaxed">
                  Ser a principal referência em marketplace automotivo premium, reconhecida pela segurança e inovação.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="glass-effect rounded-2xl p-8 text-center"
              >
                <Heart className="w-12 h-12 text-yellow-400 mx-auto mb-6" />
                <h3 className="text-2xl font-bold mb-4">Valores</h3>
                <p className="text-gray-400 leading-relaxed">
                  Segurança, transparência, excelência e inovação em cada transação e relacionamento.
                </p>
              </motion.div>
            </div>

            {/* Valores Detalhados */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="glass-effect rounded-2xl p-8"
                >
                  <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mb-6">
                    <value.icon className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-xl font-bold mb-4">{value.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Nossos Diferenciais */}
        <section className="py-20 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Nossos <span className="gradient-text">Diferenciais</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                O que nos torna únicos no mercado automotivo premium
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {differentials.map((differential, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="glass-effect rounded-2xl p-8"
                >
                  <h3 className="text-xl font-bold mb-4 text-yellow-400">{differential.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{differential.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Depoimentos */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Depoimentos de <span className="gradient-text">Clientes</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Experiências reais de quem confia na AutenTicco Motors
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="glass-effect rounded-2xl p-8"
                >
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-6 italic">"{testimonial.text}"</p>
                  <div className="border-t border-gray-700 pt-4">
                    <p className="font-semibold text-yellow-400">{testimonial.name}</p>
                    <p className="text-sm text-gray-400">{testimonial.car}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Estatísticas */}
        <section className="py-20 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { number: "500+", label: "Veículos Vendidos" },
                { number: "98%", label: "Clientes Satisfeitos" },
                { number: "15", label: "Dias Médios de Venda" },
                { number: "100%", label: "Transações Seguras" }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">
                    {stat.number}
                  </div>
                  <p className="text-gray-400">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default About;
