import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, Heart, ChevronLeft, ChevronRight, Youtube, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { FaWhatsapp } from 'react-icons/fa';

const PhotoGallery = ({ photos, carName }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const goToPrevious = () => {
        setCurrentIndex((prevIndex) => (prevIndex === 0 ? photos.length - 1 : prevIndex - 1));
    };

    const goToNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex === photos.length - 1 ? 0 : prevIndex + 1));
    };

    if (!photos || photos.length === 0) {
        return (
            <div className="aspect-video bg-gray-800 flex items-center justify-center rounded-t-2xl">
                <span className="text-gray-500">Sem fotos</span>
            </div>
        );
    }
    
    return (
        <div className="relative aspect-video overflow-hidden">
            <img 
                src={photos[currentIndex]}
                alt={`${carName} - Imagem ${currentIndex + 1}`} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
            />
            {photos.length > 1 && (
                <>
                    <button onClick={goToPrevious} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full text-white hover:bg-yellow-400 hover:text-black">
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button onClick={goToNext} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full text-white hover:bg-yellow-400 hover:text-black">
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </>
            )}
        </div>
    );
};

const Stock = () => {
  const [allCars, setAllCars] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [yearRange, setYearRange] = useState('');
  const [selectedCar, setSelectedCar] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const storedCars = JSON.parse(localStorage.getItem('cars') || '[]');
    setAllCars(storedCars);
    setFilteredCars(storedCars);
  }, []);
  
  useEffect(() => {
    let carsToFilter = [...allCars];
    
    if(searchTerm) {
      carsToFilter = carsToFilter.filter(car => 
        car.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.model.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if(selectedBrand) {
      carsToFilter = carsToFilter.filter(car => car.brand === selectedBrand);
    }
    
    setFilteredCars(carsToFilter);

  }, [searchTerm, selectedBrand, allCars]);

  const whatsappLink = "https://wa.me/5511975071300";

  const handleFavorite = () => {
    toast({
      title: "🚧 Esta funcionalidade ainda não foi implementada—mas não se preocupe! Você pode solicitá-la no seu próximo prompt! 🚀"
    });
  };

  const openCarDetails = (car) => {
    setSelectedCar(car);
    setIsModalOpen(true);
  };
  
  const getYoutubeEmbedUrl = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };


  const uniqueBrands = [...new Set(allCars.map(car => car.brand))];
  const priceRanges = [
    'Até R$ 200.000',
    'R$ 200.000 - R$ 400.000',
    'R$ 400.000 - R$ 600.000',
    'Acima de R$ 600.000'
  ];
  const yearRanges = ['2020-2021', '2022', '2023', '2024'];

  return (
    <>
      <Helmet>
        <title>Estoque de Veículos Premium - AutenTicco Motors</title>
        <meta name="description" content="Explore nosso estoque de veículos verificados. BMW, Mercedes, Audi, Porsche e mais marcas de luxo com procedência garantida." />
        <meta property="og:title" content="Estoque de Veículos Premium - AutenTicco Motors" />
        <meta property="og:description" content="Explore nosso estoque de veículos verificados. BMW, Mercedes, Audi, Porsche e mais marcas de luxo com procedência garantida." />
      </Helmet>

      <div className="pt-20 min-h-screen bg-black">
        <section className="py-20 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Nosso <span className="gradient-text">Estoque</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Veículos selecionados com procedência verificada e qualidade garantida
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="glass-effect rounded-2xl p-6 mb-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                >
                  <option value="">Todas as marcas</option>
                  {uniqueBrands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
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

        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <p className="text-gray-400">
                {filteredCars.length} veículos encontrados
              </p>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <Button className="bg-yellow-400 text-black hover:bg-yellow-500 font-semibold">
                  <FaWhatsapp className="w-4 h-4 mr-2" />
                  Fale Conosco
                </Button>
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCars.map((car, index) => (
                <motion.div
                  key={car.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="glass-effect rounded-2xl overflow-hidden card-hover group flex flex-col"
                >
                  <PhotoGallery photos={car.photos} carName={`${car.brand} ${car.model}`} />
                  
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold mb-1">{car.brand} {car.model}</h3>
                        <p className="text-gray-400">{car.year}</p>
                      </div>
                      <span className="text-2xl font-bold text-yellow-400">{car.price}</span>
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-6 flex-grow line-clamp-2">
                        {car.description || "Veículo em excelente estado, com todas as revisões em dia."}
                    </p>
                    
                    <div className="flex gap-3 mt-auto">
                      <Button onClick={() => openCarDetails(car)} className="w-full bg-yellow-400 text-black hover:bg-yellow-500 font-semibold">
                          Ver Detalhes
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredCars.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">
                  {allCars.length > 0 ? "Nenhum veículo encontrado com os filtros selecionados." : "Nenhum veículo cadastrado no momento."}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
      
      {selectedCar && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-4xl p-0">
                <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="relative">
                       <PhotoGallery photos={selectedCar.photos} carName={`${selectedCar.brand} ${selectedCar.model}`} />
                       <Button onClick={() => setIsModalOpen(false)} variant="ghost" size="icon" className="absolute top-2 right-2 bg-black/50 rounded-full">
                           <X className="h-5 w-5"/>
                       </Button>
                    </div>
                    <div className="p-6 flex flex-col">
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-bold gradient-text">{selectedCar.brand} {selectedCar.model}</DialogTitle>
                            <p className="text-lg text-gray-400">{selectedCar.year}</p>
                        </DialogHeader>
                        <p className="text-3xl font-bold text-yellow-400 my-4">{selectedCar.price}</p>
                        
                        <DialogDescription className="text-gray-300 mb-6 flex-grow max-h-48 overflow-y-auto scrollbar-hide">
                          {selectedCar.description || "Entre em contato para mais detalhes sobre este veículo."}
                        </DialogDescription>
                        
                        {getYoutubeEmbedUrl(selectedCar.youtubeLink) && (
                          <div className="mb-6">
                            <h4 className="font-semibold mb-2 text-lg flex items-center"><Youtube className="text-red-500 mr-2"/> Vídeo de Apresentação</h4>
                             <div className="aspect-video">
                                 <iframe
                                      src={getYoutubeEmbedUrl(selectedCar.youtubeLink)}
                                      title="YouTube video player"
                                      frameBorder="0"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                      className="w-full h-full rounded-lg"
                                ></iframe>
                             </div>
                          </div>
                        )}

                        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="mt-auto">
                            <Button className="w-full bg-green-500 text-white hover:bg-green-600 text-lg py-6 font-bold">
                                <FaWhatsapp className="w-6 h-6 mr-3"/> Falar com um Assessor
                            </Button>
                        </a>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
      )}

    </>
  );
};

export default Stock;
