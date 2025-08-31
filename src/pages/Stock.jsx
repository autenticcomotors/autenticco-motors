import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getCars } from '@/lib/car-api';
import { ArrowRight, Gauge, Droplet, Calendar, Cog } from 'lucide-react';
import BackgroundShape from '@/components/BackgroundShape';
import CarFilter from '@/components/CarFilter';

const Stock = () => {
    const [allCars, setAllCars] = useState([]);
    const [filteredCars, setFilteredCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        model: '', price: '', year: '', fuel: '', color: '',
        transmission: '', bodyType: '', mileage: ''
    });

    useEffect(() => {
        const fetchCars = async () => {
            setLoading(true);
            const carsData = await getCars();
            setAllCars(carsData);
            setFilteredCars(carsData);
            setLoading(false);
        };
        fetchCars();
    }, []);

    const filterOptions = useMemo(() => {
        const years = [...new Set(allCars.map(car => car.year))].sort((a, b) => b - a);
        const fuels = [...new Set(allCars.map(car => car.fuel).filter(Boolean))];
        const colors = [...new Set(allCars.map(car => car.color).filter(Boolean))];
        const transmissions = [...new Set(allCars.map(car => car.transmission).filter(Boolean))];
        const bodyTypes = [...new Set(allCars.map(car => car.body_type).filter(Boolean))];
        return { years, fuels, colors, transmissions, bodyTypes };
    }, [allCars]);

    useEffect(() => {
        let carsToFilter = [...allCars];

        if (filters.model) {
            carsToFilter = carsToFilter.filter(car =>
                (car.brand && car.brand.toLowerCase().includes(filters.model.toLowerCase())) ||
                (car.model && car.model.toLowerCase().includes(filters.model.toLowerCase()))
            );
        }

        if (filters.price) {
            const [min, max] = filters.price.split('-').map(Number);
            carsToFilter = carsToFilter.filter(car => car.price >= min && (max ? car.price <= max : true));
        }
        
        if (filters.mileage) {
            const [min, max] = filters.mileage.split('-').map(Number);
            carsToFilter = carsToFilter.filter(car => car.mileage >= min && (max ? car.mileage <= max : true));
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
                
                <p className="mb-6 text-gray-600 font-medium">{filteredCars.length} veículo(s) encontrado(s)</p>

                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {filteredCars.map(car => (
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
                                <p className="text-2xl font-bold text-gray-800 my-2">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(car.price)}</p>
                                
                                {/* LAYOUT AJUSTADO PARA FONTE MAIOR E ESPAÇAMENTO OTIMIZADO */}
                                <div className="grid grid-cols-3 gap-3 text-sm text-gray-600 my-4 border-t border-b py-4">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar size={16} className="text-yellow-500 flex-shrink-0" /> 
                                        <span className="truncate">{car.year}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Gauge size={16} className="text-yellow-500 flex-shrink-0" /> 
                                        <span className="truncate">{new Intl.NumberFormat('pt-BR').format(car.mileage)} km</span>
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
                
                {filteredCars.length === 0 && !loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                        <h3 className="text-2xl font-bold text-gray-800">Nenhum veículo encontrado</h3>
                        <p className="text-gray-600 mt-2">Tente ajustar os filtros ou clique em "Limpar Filtros" para ver todo o nosso estoque.</p>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default Stock;
