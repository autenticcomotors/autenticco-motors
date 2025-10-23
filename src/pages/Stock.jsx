// src/pages/Stock.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getCars } from '@/lib/car-api';
import { ArrowRight, Gauge, Droplet, Calendar, Cog } from 'lucide-react';
import BackgroundShape from '@/components/BackgroundShape';
import CarFilter from '@/components/CarFilter';

const WHATSAPP_NUMBER = '5511975071300'; // número usado para enviar as mensagens via wa.me

const Stock = () => {
    const [allCars, setAllCars] = useState([]);
    const [filteredCars, setFilteredCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        model: '', price: '', year: '', fuel: '', color: '',
        transmission: '', bodyType: '', mileage: ''
    });

    // estado para o formulário "não encontrou"
    const [leadName, setLeadName] = useState('');
    const [leadPhone, setLeadPhone] = useState('');
    const [leadVehicle, setLeadVehicle] = useState('');
    const [leadSubmitting, setLeadSubmitting] = useState(false);
    const [leadSent, setLeadSent] = useState(false);
    const [leadError, setLeadError] = useState('');

    useEffect(() => {
        const fetchCars = async () => {
            try {
                setLoading(true);
                const carsData = await getCars();
                const safeCars = Array.isArray(carsData) ? carsData : [];
                setAllCars(safeCars);
                setFilteredCars(safeCars);
            } catch (err) {
                console.error('Erro ao buscar carros:', err);
                setAllCars([]);
                setFilteredCars([]);
            } finally {
                setLoading(false);
            }
        };
        fetchCars();
    }, []);

    const filterOptions = useMemo(() => {
        const safeCars = Array.isArray(allCars) ? allCars : [];
        const years = [...new Set(safeCars.map(car => car.year))].sort((a, b) => b - a);
        const fuels = [...new Set(safeCars.map(car => car.fuel).filter(Boolean))];
        const colors = [...new Set(safeCars.map(car => car.color).filter(Boolean))];
        const transmissions = [...new Set(safeCars.map(car => car.transmission).filter(Boolean))];
        const bodyTypes = [...new Set(safeCars.map(car => car.body_type).filter(Boolean))];
        return { years, fuels, colors, transmissions, bodyTypes };
    }, [allCars]);

    useEffect(() => {
        const safeAll = Array.isArray(allCars) ? allCars : [];
        let carsToFilter = [...safeAll];

        if (filters.model) {
            carsToFilter = carsToFilter.filter(car =>
                (car.brand && car.brand.toLowerCase().includes(filters.model.toLowerCase())) ||
                (car.model && car.model.toLowerCase().includes(filters.model.toLowerCase()))
            );
        }

        if (filters.price) {
            const [min, max] = filters.price.split('-').map(Number);
            carsToFilter = carsToFilter.filter(car => {
                const price = Number(car.price) || 0;
                return price >= (min || 0) && (max ? price <= max : true);
            });
        }

        if (filters.mileage) {
            const [min, max] = filters.mileage.split('-').map(Number);
            carsToFilter = carsToFilter.filter(car => {
                const mileage = Number(car.mileage) || 0;
                return mileage >= (min || 0) && (max ? mileage <= max : true);
            });
        }

        ['year', 'fuel', 'color', 'transmission'].forEach(key => {
            if (filters[key]) {
                carsToFilter = carsToFilter.filter(car => String(car[key]) === filters[key]);
            }
        });

        if (filters.bodyType) {
            carsToFilter = carsToFilter.filter(car => car.body_type === filters.bodyType);
        }

        setFilteredCars(carsToFilter);
    }, [filters, allCars]);

    const handleClearFilters = () => {
        setFilters({
            model: '', price: '', year: '', fuel: '', color: '',
            transmission: '', bodyType: '', mileage: ''
        });
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex justify-center items-center">
                <div className="text-yellow-500 text-xl animate-pulse">Carregando estoque...</div>
            </div>
        );
    }

    // abre o whatsapp com mensagem pronta (usado tanto pelo botão direto quanto pelo form)
    const openWhatsApp = (message) => {
        const text = encodeURIComponent(message);
        const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
        window.open(url, '_blank');
    };

    // handler do formulário (construí mensagem e abro o whatsapp)
    const handleLeadSubmit = (e) => {
        e.preventDefault();
        setLeadError('');
        if (!leadVehicle || leadVehicle.trim().length < 2) {
            setLeadError('Descreva o veículo que procura (ex: modelo, ano, cor).');
            return;
        }
        // simples validação de telefone (mínimo)
        if (!leadPhone || leadPhone.replace(/\D/g, '').length < 8) {
            setLeadError('Informe um telefone válido para que possamos te contatar.');
            return;
        }

        setLeadSubmitting(true);
        const message = `Olá, meu nome é ${leadName || '[sem nome]'}.\nEstou procurando: ${leadVehicle}.\nTelefone: ${leadPhone}.\nPor favor, entrem em contato.`;
        // abre o WhatsApp
        try {
            openWhatsApp(message);
            setLeadSent(true);
            // mantém um pequeno delay para resetar o formulário se quiser
            setTimeout(() => {
                setLeadSubmitting(false);
                setLeadName('');
                setLeadPhone('');
                setLeadVehicle('');
            }, 600);
        } catch (err) {
            console.error(err);
            setLeadError('Erro ao abrir o WhatsApp. Tente novamente.');
            setLeadSubmitting(false);
        }
    };

    return (
        <div className="relative isolate min-h-screen bg-gray-50 text-gray-800 pt-28">
            <Helmet>
                <title>Estoque - AutenTicco Motors</title>
                <meta name="description" content="Veículos premium selecionados com procedência verificada e qualidade garantida." />
            </Helmet>
            <BackgroundShape />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <h1 className="text-4xl font-extrabold text-center text-gray-900 tracking-tight mb-4">Nosso <span className="text-yellow-500">Catálogo</span></h1>
                    <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">Encontre o carro ideal para você. Use os filtros para refinar sua busca.</p>
                </motion.div>

                <CarFilter 
                    filters={filters} 
                    setFilters={setFilters} 
                    filterOptions={filterOptions}
                    onClear={handleClearFilters}
                />
                
                <p className="mb-6 text-gray-600 font-medium">{Array.isArray(filteredCars) ? filteredCars.length : 0} veículo(s) encontrado(s)</p>

                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {(Array.isArray(filteredCars) ? filteredCars : []).map(car => (
                        <motion.div
                            key={car.id}
                            className="bg-white rounded-2xl overflow-hidden shadow-lg border flex flex-col transition-transform duration-300 hover:-translate-y-2"
                            variants={itemVariants}
                            layout
                        >
                            <div className="relative">
                                <img src={car.main_photo_url || 'https://placehold.co/400x300/e2e8f0/4a5568?text=Sem+Foto'} alt={`${car.brand} ${car.model}`} className="w-full h-56 object-cover" />
                                <div className="absolute top-4 right-4 bg-black/50 text-white text-xs font-bold py-1 px-3 rounded-full flex items-center gap-1.5">
                                    <Droplet size={12} />
                                    <span>{car.fuel}</span>
                                </div>
                            </div>
                            <div className="p-6 flex flex-col flex-grow">
                                <h2 className="text-xl font-bold text-gray-900">{car.brand} {car.model}</h2>
                                <p className="text-2xl font-bold text-gray-800 my-2">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(car.price) || 0)}</p>
                                
                                <div className="grid grid-cols-3 gap-3 text-sm text-gray-600 my-4 border-t border-b py-4">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar size={16} className="text-yellow-500 flex-shrink-0" /> 
                                        <span className="truncate">{car.year}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Gauge size={16} className="text-yellow-500 flex-shrink-0" /> 
                                        <span className="truncate">{new Intl.NumberFormat('pt-BR').format(Number(car.mileage) || 0)} km</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Cog size={16} className="text-yellow-500 flex-shrink-0" /> 
                                        <span className="truncate">{car.transmission}</span>
                                    </div>
                                </div>
                                
                                <div className="mt-auto">
                                    <Link to={`/carro/${car.slug}`} className="group w-full inline-flex items-center justify-center text-center bg-yellow-400 text-black font-bold py-3 px-4 rounded-lg hover:bg-yellow-500 transition-all duration-300 transform hover:scale-105">
                                        Ver Detalhes
                                        <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
                
                {Array.isArray(filteredCars) && filteredCars.length === 0 && !loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16">
                        <div className="max-w-3xl mx-auto text-center">
                            <h3 className="text-2xl font-bold text-gray-800">Nenhum veículo encontrado</h3>
                            <p className="text-gray-600 mt-2 mb-8">Entre em contato conosco ou preencha o formulário abaixo com o veículo que você procura — nós encontraremos para você.</p>

                            {/* cartão profissional com formulário + botão whatsapp */}
                            <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-2xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row items-start gap-6">
                                {/* esquerda: texto + botão whatsapp */}
                                <div className="flex-1 text-left">
                                    <h4 className="text-lg font-semibold text-white mb-2">Não encontrou? Chame a gente no WhatsApp</h4>
                                    <p className="text-gray-200 mb-4">Clique para abrir um chat com nossa equipe e informe o veículo desejado.</p>
                                    <div className="flex gap-3">
                                        <button
                                          onClick={() => openWhatsApp('Olá! Estou procurando um veículo. Podem me ajudar?')}
                                          className="inline-flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-3 rounded-lg shadow-md transition"
                                        >
                                            {/* ícone simples */}
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382a3.54 3.54 0 0 0-.99-1.34l-.07-.06a1.11 1.11 0 0 0-1.19 0c-.36.23-1.05.64-1.6.9-.55.27-1.02.41-1.6.11-.58-.3-1.98-.61-3.76-2.38-1.78-1.77-2.09-3.17-2.38-3.75-.3-.59-.16-1.05.11-1.6.27-.55.67-1.24.9-1.6.17-.24.12-.55-.12-.75l-.07-.06a3.52 3.52 0 0 0-1.34-.99A2.85 2.85 0 0 0 3 6.28c-.06 2.76 1.2 5.36 3.47 7.62 2.27 2.27 4.87 3.53 7.62 3.47.24 0 .47-.01.7-.03a2.85 2.85 0 0 0 1.98-.98z" fill="white"/></svg>
                                            Fale no WhatsApp
                                        </button>
                                        <button
                                          onClick={() => {
                                              // scroll para o form
                                              const el = document.getElementById('stock-lead-form');
                                              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                          }}
                                          className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-4 py-3 rounded-lg shadow-md transition"
                                        >
                                          Preencher formulário
                                        </button>
                                    </div>
                                </div>

                                {/* direita: formulário */}
                                <form id="stock-lead-form" onSubmit={handleLeadSubmit} className="w-full md:w-1/2 bg-white/6 p-4 rounded-xl" style={{ backdropFilter: 'blur(6px)' }}>
                                    <div className="mb-3">
                                        <label className="text-sm text-gray-200 block mb-1">Nome (opcional)</label>
                                        <input
                                            value={leadName}
                                            onChange={(e) => setLeadName(e.target.value)}
                                            type="text"
                                            placeholder="Seu nome"
                                            className="w-full rounded-md px-3 py-2 border border-gray-700 bg-transparent text-white placeholder-gray-400"
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="text-sm text-gray-200 block mb-1">Veículo que procura</label>
                                        <input
                                            value={leadVehicle}
                                            onChange={(e) => setLeadVehicle(e.target.value)}
                                            type="text"
                                            placeholder="Ex: Fiat Uno 2016, prata"
                                            required
                                            className="w-full rounded-md px-3 py-2 border border-gray-700 bg-transparent text-white placeholder-gray-400"
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="text-sm text-gray-200 block mb-1">Telefone</label>
                                        <input
                                            value={leadPhone}
                                            onChange={(e) => setLeadPhone(e.target.value)}
                                            type="tel"
                                            placeholder="+55 (11) 9xxxx-xxxx"
                                            required
                                            className="w-full rounded-md px-3 py-2 border border-gray-700 bg-transparent text-white placeholder-gray-400"
                                        />
                                    </div>

                                    {leadError && <p className="text-sm text-red-300 mb-2">{leadError}</p>}
                                    {leadSent && <p className="text-sm text-green-300 mb-2">Enviando... o WhatsApp foi aberto. Em breve entraremos em contato.</p>}

                                    <div className="flex gap-3">
                                        <button
                                            type="submit"
                                            disabled={leadSubmitting}
                                            className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-4 py-2 rounded-lg shadow-md transition disabled:opacity-60"
                                        >
                                            {leadSubmitting ? 'Aguarde...' : 'Enviar pedido'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                // limpar form
                                                setLeadName('');
                                                setLeadPhone('');
                                                setLeadVehicle('');
                                                setLeadError('');
                                                setLeadSent(false);
                                            }}
                                            className="flex-1 bg-transparent border border-yellow-400 text-yellow-400 font-semibold px-4 py-2 rounded-lg transition hover:bg-yellow-400 hover:text-black"
                                        >
                                            Limpar
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default Stock;

