// src/pages/Stock.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getCars } from '@/lib/car-api';
import { ArrowRight, Gauge, Droplet, Calendar, Cog } from 'lucide-react';
import BackgroundShape from '@/components/BackgroundShape';
import CarFilter from '@/components/CarFilter';

const WHATSAPP_NUMBER = '5511975071300'; // número em formato internacional (sem +, sem espaços)

const Stock = () => {
    const [allCars, setAllCars] = useState([]);
    const [filteredCars, setFilteredCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        model: '', price: '', year: '', fuel: '', color: '',
        transmission: '', bodyType: '', mileage: ''
    });

    // estados do formulário simplificado (quando nada é encontrado)
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [brand, setBrand] = useState('');
    const [modelRequest, setModelRequest] = useState('');
    const [yearRequest, setYearRequest] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [sent, setSent] = useState(false);

    useEffect(() => {
        const fetchCars = async () => {
            try {
                setLoading(true);
                const data = await getCars();
                const safe = Array.isArray(data) ? data : [];
                // garantir que ativos venham primeiro (is_available !== false)
                const sorted = [...safe].sort((a, b) => {
                    const aActive = a.is_available === false ? 0 : 1;
                    const bActive = b.is_available === false ? 0 : 1;
                    if (aActive !== bActive) return bActive - aActive; // ativos primeiro
                    const aTime = new Date(a.created_at || 0).getTime();
                    const bTime = new Date(b.created_at || 0).getTime();
                    return bTime - aTime;
                });
                setAllCars(sorted);
                setFilteredCars(sorted);
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
        
        if (filters.is_blindado) {
           carsToFilter = carsToFilter.filter(car => !!car.is_blindado);
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

    // abre WhatsApp com mensagem pronta
    const openWhatsApp = (message) => {
        const encoded = encodeURIComponent(message);
        const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
        window.open(url, '_blank');
    };

    // validação simples do telefone (mínimo 8 dígitos numéricos)
    const isPhoneValid = (p) => {
        if (!p) return false;
        const digits = p.replace(/\D/g, '');
        return digits.length >= 8;
    };

    // handler do envio do formulário clean
    const handleSubmit = (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSent(false);

        if (!brand.trim() || !modelRequest.trim()) {
            setErrorMsg('Por favor informe a marca e o modelo do veículo que procura.');
            return;
        }

        if (!isPhoneValid(phone)) {
            setErrorMsg('Informe um telefone válido para contato (mínimo 8 dígitos).');
            return;
        }

        setSubmitting(true);

        const messageLines = [
            `Olá, sou ${name.trim() || 'Cliente'}.`,
            `Procuro: ${brand.trim()} ${modelRequest.trim()}${yearRequest ? `, ${yearRequest}` : ''}.`,
            `Telefone: ${phone.trim()}.`,
            `Favor entrar em contato, por favor.`
        ];
        const finalMessage = messageLines.join('\n');

        try {
            openWhatsApp(finalMessage);
            setSent(true);
            // limpando (opcional) após abertura
            setTimeout(() => {
                setSubmitting(false);
                setName('');
                setPhone('');
                setBrand('');
                setModelRequest('');
                setYearRequest('');
            }, 600);
        } catch (err) {
            console.error(err);
            setErrorMsg('Erro ao abrir o WhatsApp. Tente novamente.');
            setSubmitting(false);
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
                            className={`bg-white rounded-2xl overflow-hidden shadow-lg border flex flex-col transition-transform duration-300 hover:-translate-y-2 ${car.is_available === false ? 'opacity-90' : ''}`}
                            variants={itemVariants}
                            layout
                        >
                            <div className="relative">
                                <img src={car.main_photo_url || 'https://placehold.co/400x300/e2e8f0/4a5568?text=Sem+Foto'} alt={`${car.brand} ${car.model}`} className={`w-full h-56 object-cover ${car.is_available === false ? 'filter grayscale contrast-90' : ''}`} />
                                <div className="absolute top-4 right-4 flex items-center gap-2">
                                  <div className="bg-black/50 text-white text-xs font-bold py-1 px-3 rounded-full flex items-center gap-1.5">
                                    <Droplet size={12} />
                                    <span>{car.fuel}</span>
                                  </div>
                                  {car.is_blindado && (
                                    <div className="bg-yellow-400 text-black text-xs font-bold py-1 px-3 rounded-full">BLINDADO</div>
                                  )}
                                </div>
                                {car.is_available === false && (
                                    <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold py-1 px-3 rounded-full">VENDIDO</div>
                                )}
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
                                    {car.is_available === false ? (
                                        <div className="w-full inline-flex items-center justify-center text-center bg-gray-200 text-gray-600 font-semibold py-3 px-4 rounded-lg">
                                            Veículo Vendido
                                        </div>
                                    ) : (
                                        <Link to={`/carro/${car.slug}`} className="group w-full inline-flex items-center justify-center text-center bg-yellow-400 text-black font-bold py-3 px-4 rounded-lg hover:bg-yellow-500 transition-all duration-300 transform hover:scale-105">
                                            Ver Detalhes
                                            <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
                
                {Array.isArray(filteredCars) && filteredCars.length === 0 && !loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16">
                        <div className="max-w-3xl mx-auto text-center">
                            <h3 className="text-2xl font-bold text-gray-800">Nenhum veículo encontrado</h3>
                            <p className="text-gray-600 mt-2 mb-8">Preencha o formulário abaixo com os dados do veículo que você procura — nós encontraremos para você e vamos entrar em contato.</p>

                            {/* cartão clean e centralizado com o formulário simplificado */}
                            <div className="mx-auto bg-white rounded-2xl p-6 md:p-8 shadow-lg max-w-2xl">
                                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="text-sm text-gray-700 block mb-1">Nome (opcional)</label>
                                        <input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Seu nome"
                                            className="w-full rounded-md px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm text-gray-700 block mb-1">Telefone</label>
                                        <input
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="+55 (11) 9xxxx-xxxx"
                                            className="w-full rounded-md px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                            required
                                            type="tel"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-sm text-gray-700 block mb-1">Marca</label>
                                            <input
                                                value={brand}
                                                onChange={(e) => setBrand(e.target.value)}
                                                placeholder="Ex: Fiat"
                                                className="w-full rounded-md px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-700 block mb-1">Modelo</label>
                                            <input
                                                value={modelRequest}
                                                onChange={(e) => setModelRequest(e.target.value)}
                                                placeholder="Ex: Uno"
                                                className="w-full rounded-md px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm text-gray-700 block mb-1">Ano (opcional)</label>
                                        <input
                                            value={yearRequest}
                                            onChange={(e) => setYearRequest(e.target.value)}
                                            placeholder="Ex: 2016"
                                            className="w-full rounded-md px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                        />
                                    </div>

                                    {errorMsg && <div className="text-sm text-red-600">{errorMsg}</div>}
                                    {sent && <div className="text-sm text-green-600">Abrindo WhatsApp — verifique seu aplicativo.</div>}

                                    <div className="flex items-center justify-start gap-3 mt-2">
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="inline-block bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-2.5 rounded-md shadow transition disabled:opacity-60"
                                            aria-label="Enviar pedido de busca"
                                        >
                                            {submitting ? 'Enviando...' : 'Enviar'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setName('');
                                                setPhone('');
                                                setBrand('');
                                                setModelRequest('');
                                                setYearRequest('');
                                                setErrorMsg('');
                                                setSent(false);
                                            }}
                                            className="inline-block border border-gray-300 text-gray-700 px-4 py-2.5 rounded-md hover:bg-gray-50 transition"
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

