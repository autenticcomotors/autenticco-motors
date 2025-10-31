import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getCarBySlug } from '@/lib/car-api';
import {
  Calendar,
  Gauge,
  Droplet,
  Video,
  ArrowRight,
  Cog,
  Palette,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import BackgroundShape from '@/components/BackgroundShape';
import InterestModal from '@/components/InterestModal';
import Seo from '@/components/Seo';

// FUNÇÃO 100% CORRIGIDA E FINAL
const getYouTubeEmbedUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  let videoId;
  try {
    const match = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    videoId = match && match[1];
  } catch (e) {
    console.error('Erro ao extrair ID do vídeo:', e);
    return null;
  }

  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  return null;
};

const makeAbsoluteUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  try {
    return `${window.location.origin}${path.startsWith('/') ? '' : '/'}${path}`;
  } catch (e) {
    return path;
  }
};

const CarDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState('');
  const [isInterestModalOpen, setIsInterestModalOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchCar = async () => {
      setLoading(true);
      const carData = await getCarBySlug(slug);
      if (!carData) {
        navigate('/estoque');
      } else {
        setCar(carData);
        setSelectedImage(
          carData.main_photo_url ||
            (carData.photo_urls && carData.photo_urls[0]) ||
            ''
        );
      }
      setLoading(false);
    };
    fetchCar();
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-yellow-500 text-xl">Carregando...</div>
      </div>
    );
  }
  if (!car) return null;

  const youtubeEmbedUrl = getYouTubeEmbedUrl(car.youtube_link);
  const formattedMileage = Number.isNaN(parseInt(car.mileage, 10))
    ? car.mileage
    : new Intl.NumberFormat('pt-BR').format(car.mileage);

  const specs = [
    { icon: Calendar, label: 'Ano', value: car.year },
    { icon: Gauge, label: 'KM', value: `${formattedMileage} km` },
    { icon: Droplet, label: 'Combustível', value: car.fuel },
    { icon: Cog, label: 'Câmbio', value: car.transmission },
    { icon: Palette, label: 'Cor', value: car.color },
  ];

  // SEO
  const seoTitle = `${car.brand} ${car.model} - AutenTicco Motors`;
  const priceFormatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(car.price);
  const seoDescription = `${car.brand} ${car.model} ${car.year} • ${formattedMileage} km • ${priceFormatted}. Reserve com depósito ou agende test-drive.`;
  const seoImage = makeAbsoluteUrl(
    selectedImage ||
      car.main_photo_url ||
      (car.photo_urls && car.photo_urls[0]) ||
      ''
  );
  const seoUrl = `${window.location.origin}/veiculo/${car.slug || slug}`;

  // COMPARTILHAR
  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${car.brand} ${car.model}`,
          text: 'Dá uma olhada nesse carro 👇',
          url,
        });
        return;
      } catch (e) {
        // cancelou, segue pro fallback
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setShareMessage('Link copiado!');
      setTimeout(() => setShareMessage(''), 3000);
    } catch (e) {
      setShareMessage('Não deu pra copiar, copie manualmente.');
      setTimeout(() => setShareMessage(''), 3000);
    }
  };

  return (
    <>
      <Seo
        title={seoTitle}
        description={seoDescription}
        image={seoImage}
        url={seoUrl}
      />

      <div className="relative isolate min-h-screen bg-white text-gray-800 pt-28">
        <BackgroundShape />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* TOPO COM PREÇO + COMPARTILHAR */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                {car.brand} <span className="font-light">{car.model}</span>
              </h1>

              <div className="flex items-center gap-3">
                <span className="text-3xl md:text-4xl font-bold text-gray-900">
                  {priceFormatted}
                </span>

                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="flex items-center gap-2 border-gray-200 hover:border-yellow-400 hover:text-yellow-600"
                >
                  <Share2 className="w-4 h-4" />
                  Compartilhar
                </Button>
              </div>
            </div>

            {shareMessage ? (
              <p className="mb-6 text-sm text-green-600 bg-green-50 inline-block px-3 py-1 rounded">
                {shareMessage}
              </p>
            ) : null}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
              {/* FOTOS */}
              <div className="lg:col-span-3">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedImage}
                    className="mb-4 rounded-xl overflow-hidden bg-white shadow-2xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <img
                      src={selectedImage}
                      alt="Imagem principal do veículo"
                      className="w-full h-auto object-cover"
                    />
                  </motion.div>
                </AnimatePresence>

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {car.photo_urls.map((url, index) => (
                    <div
                      key={index}
                      className={`rounded-lg overflow-hidden cursor-pointer ring-2 ${
                        selectedImage === url
                          ? 'ring-yellow-400'
                          : 'ring-transparent'
                      }`}
                      onClick={() => setSelectedImage(url)}
                    >
                      <img
                        src={url}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-24 object-cover transition-transform duration-300 hover:scale-110"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* LATERAL */}
              <div className="lg:col-span-2 flex flex-col gap-8 sticky top-28">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Especificações Rápidas
                  </h2>
                  <div className="space-y-4 mb-8">
                    {specs.map(
                      (spec) =>
                        spec.value && (
                          <div
                            key={spec.label}
                            className="flex items-center justify-between text-base"
                          >
                            <div className="flex items-center">
                              <spec.icon className="w-5 h-5 text-yellow-500 mr-3" />
                              <span className="text-gray-600">
                                {spec.label}
                              </span>
                            </div>
                            <span className="font-semibold text-gray-800">
                              {spec.value}
                            </span>
                          </div>
                        )
                    )}
                  </div>
                  <Button
                    onClick={() => setIsInterestModalOpen(true)}
                    className="w-full bg-yellow-400 text-black font-bold py-6 text-lg hover:bg-yellow-500 transition-all duration-300 transform hover:scale-105 group"
                  >
                    Tenho Interesse{' '}
                    <ArrowRight className="ml-3 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border flex-grow">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Sobre o Veículo
                  </h2>
                  <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                    {car.full_description}
                  </p>
                </div>
              </div>
            </div>

            {/* VÍDEO */}
            {youtubeEmbedUrl && (
              <motion.div
                className="mt-16 bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-2xl border"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center">
                  <Video className="mr-3 text-yellow-500" /> Tour em Vídeo
                </h2>
                <div
                  className="w-full overflow-hidden rounded-xl"
                  style={{ aspectRatio: '16 / 9' }}
                >
                  <iframe
                    src={youtubeEmbedUrl}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        <AnimatePresence>
          {isInterestModalOpen && (
            <InterestModal
              car={car}
              onClose={() => setIsInterestModalOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default CarDetail;

