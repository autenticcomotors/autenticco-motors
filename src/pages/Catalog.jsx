import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, Filter, Phone, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const Catalog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [yearRange, setYearRange] = useState('');

  const handleWhatsApp = () => {
    toast({
      title: "🚧 Esta funcionalidade ainda não foi implementada—mas não se preocupe! Você pode solicitá-la no seu próximo prompt! 🚀"
    });
  };

  const handleFavorite = () => {
    toast({
      title: "🚧 Esta funcionalidade ainda não foi implementada—mas não se preocupe! Você pode solicitá-la no seu próximo prompt! 🚀"
    });
  };

  const cars = [
    {
      id: 1,
      brand: "BMW",
      model: "X5 M Sport",
      year: 2022,
      price: "R$ 450.000",
      mileage: "25.000 km",
      fuel: "Gasolina",
      image: "Luxurious BMW X5 M Sport in metallic gray"
    },
    {
      id: 2,
      brand: "Mercedes",
      model: "C300 AMG",
      year: 2023,
      price: "R$ 320.000",
      mileage: "15.000 km",
      fuel: "Gasolina",
      image: "Elegant Mercedes C300 AMG in pearl white"
    },
    {
      id: 3,
      brand: "Audi",
      model: "Q7 Prestige",
      year: 2022,
      price: "R$ 380.000",
      mileage: "30.000 km",
      fuel: "Gasolina",
      image: "Premium Audi Q7 Prestige in midnight black"
    },
    {
      id: 4,
      brand: "Porsche",
      model: "Cayenne Turbo",
      year: 2023,
      price: "R$ 650.000",
      mileage: "12.000 km",
      fuel: "Gasolina",
      image: "Sporty Porsche Cayenne Turbo in racing red"
    },
    {
      id: 5,
      brand: "BMW",
      model: "M4 Competition",
      year: 2022,
      price: "R$ 520.000",
      mileage: "18.000 km",
      fuel: "Gasolina",
      image: "High-performance BMW M4 Competition in alpine white"
    },
    {
      id: 6,
      brand: "Mercedes",
      model: "GLE 450 Coupe",
      year: 2023,
      price: "R$ 480.000",
      mileage: "22.000 km",
      fuel: "Gasolina",
      image: "Luxury Mercedes GLE 450 Coupe in obsidian black"
    }
  ];

  const brands = ['BMW', 'Mercedes', 'Audi', 'Porsche'];
  const priceRanges = [
    'Até R$ 200.000',
    'R$ 200.000 - R$ 400.000',
    'R$ 400.000 - R$ 600.000',
    'Acima de R$ 600.000'
  ];
  const yearRanges = ['2020-2021', '2022', '2023', '2024'];

  const filteredCars = cars.filter(car => {
    const matchesSearch = car.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         car.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = !selectedBrand || car.brand === selectedBrand;
    
    return matchesSearch && matchesBrand;
  });

  return (
    <>
      <Helmet>
        <title>Catálogo de Veículos Premium - AutenTicco Motors</title>
        <meta name="description" content="Explore nossa seleção premium de veículos verificados. BMW, Mercedes, Audi, Porsche e mais marcas de luxo com procedência garantida." />
        <meta property="og:title" content="Catálogo de Veículos Premium - AutenTicco Motors" />
        <meta property="og:description" content="Explore nossa seleção premium de veículos verificados. BMW, Mercedes, Audi, Porsche e mais marcas de luxo com procedência garantida." />
      </Helmet>

      <div className="pt-16 min-h-screen bg-black">
        {/* Header */}
        <section className="py-20 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Catálogo <span className="gradient-text">Premium</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Veículos selecionados com procedência verificada e qualidade garantida
              </p>
            </motion.div>

            {/* Filtros */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="glass-effect rounded-2xl p-6 mb-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar marca ou modelo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-yellow-400 focus:outline-none"
                  />
                </div>

                {/* Marca */}
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                >
                  <option value="">Todas as marcas</option>
                  {brands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>

                {/* Preço */}
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                >
                  <option value="">Faixa de preço</option>
                  {priceRanges.map(range => (
                    <option key={range} value={range}>{range}</option>
                  ))}
                </select>

                {/* Ano */}
                <select
                  value={yearRange}
                  onChange={(e) => setYearRange(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                >
                  <option value="">Ano</option>
                  {yearRanges.map(range => (
                    <option key={range} value={range}>{range}</option>
                  ))}
                </select>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Grid de Veículos */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <p className="text-gray-400">
                {filteredCars.length} veículos encontrados
              </p>
              <Button 
                className="bg-yellow-400 text-black hover:bg-yellow-500 font-semibold"
                onClick={handleWhatsApp}
              >
                <Phone className="w-4 h-4 mr-2" />
                Falar com Assessor
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCars.map((car, index) => (
                <motion.div
                  key={car.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="glass-effect rounded-2xl overflow-hidden card-hover group"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img  
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      alt={`${car.brand} ${car.model} ${car.year}`}
                     src="https://images.unsplash.com/photo-1597081194888-8f9d600b3ab5" />
                    <button
                      onClick={handleFavorite}
                      className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-yellow-400 hover:text-black transition-colors"
                    >
                      <Heart className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold mb-1">{car.brand} {car.model}</h3>
                        <p className="text-gray-400">{car.year}</p>
                      </div>
                      <span className="text-2xl font-bold text-yellow-400">{car.price}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                      <div>
                        <span className="text-gray-400">Quilometragem</span>
                        <p className="font-semibold">{car.mileage}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Combustível</span>
                        <p className="font-semibold">{car.fuel}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button 
                        className="flex-1 bg-yellow-400 text-black hover:bg-yellow-500 font-semibold"
                        onClick={handleWhatsApp}
                      >
                        Ver Detalhes
                      </Button>
                      <Button 
                        variant="outline" 
                        className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
                        onClick={handleWhatsApp}
                      >
                        <Phone className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredCars.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">
                  Nenhum veículo encontrado com os filtros selecionados.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
};

export default Catalog;
