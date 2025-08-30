import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Car, PlusCircle, Trash2, Edit, LogOut, Youtube, DollarSign, Image as ImageIcon, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const AdminDashboard = () => {
  const [cars, setCars] = useState([]);
  const [newCar, setNewCar] = useState({
    brand: '', model: '', year: '', price: '', photos: [], youtubeLink: '', description: ''
  });
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  useEffect(() => {
    const storedCars = localStorage.getItem('cars');
    if (storedCars) {
      setCars(JSON.parse(storedCars));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/admin');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCar({ ...newCar, [name]: value });
  };
  
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const newPhotoPreviews = [];
    const newPhotos = [];

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        newPhotos.push(event.target.result);
        newPhotoPreviews.push(event.target.result);
        if (newPhotos.length === files.length) {
          setNewCar(prev => ({...prev, photos: [...prev.photos, ...newPhotos]}));
          setPhotoPreviews(prev => [...prev, ...newPhotoPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
      setNewCar(prev => ({...prev, photos: prev.photos.filter((_, i) => i !== index)}));
      setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };


  const addCar = (e) => {
    e.preventDefault();
    if (newCar.brand && newCar.model && newCar.price) {
      const updatedCars = [...cars, { ...newCar, id: Date.now() }];
      setCars(updatedCars);
      localStorage.setItem('cars', JSON.stringify(updatedCars));
      setNewCar({ brand: '', model: '', year: '', price: '', photos: [], youtubeLink: '', description: '' });
      setPhotoPreviews([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast({ title: 'Veículo adicionado com sucesso!' });
    } else {
      toast({ title: 'Preencha os campos obrigatórios.', variant: 'destructive' });
    }
  };

  const deleteCar = (id) => {
    const updatedCars = cars.filter(car => car.id !== id);
    setCars(updatedCars);
    localStorage.setItem('cars', JSON.stringify(updatedCars));
    toast({ title: 'Veículo removido com sucesso.' });
  };

  return (
    <>
      <Helmet>
        <title>Dashboard - AutenTicco Motors</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-gray-900 pt-20 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">
                Painel de <span className="gradient-text">Controle</span>
              </h1>
              <Button onClick={handleLogout} variant="destructive">
                <LogOut className="mr-2 h-4 w-4" /> Sair
              </Button>
            </div>

            {/* Adicionar Veículo */}
            <div className="glass-effect rounded-2xl p-8 mb-12">
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <PlusCircle className="mr-3 text-yellow-400" /> Adicionar Novo Veículo
              </h2>
              <form onSubmit={addCar} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <input name="brand" value={newCar.brand} onChange={handleInputChange} placeholder="Marca *" className="bg-black/50 border border-gray-700 rounded-lg p-3 focus:border-yellow-400 focus:outline-none" />
                  <input name="model" value={newCar.model} onChange={handleInputChange} placeholder="Modelo *" className="bg-black/50 border border-gray-700 rounded-lg p-3 focus:border-yellow-400 focus:outline-none" />
                  <input name="year" value={newCar.year} onChange={handleInputChange} placeholder="Ano" type="number" className="bg-black/50 border border-gray-700 rounded-lg p-3 focus:border-yellow-400 focus:outline-none" />
                  <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input name="price" value={newCar.price} onChange={handleInputChange} placeholder="Preço *" className="pl-10 w-full bg-black/50 border border-gray-700 rounded-lg p-3 focus:border-yellow-400 focus:outline-none" />
                  </div>
                   <div className="relative col-span-1 md:col-span-2">
                    <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input name="youtubeLink" value={newCar.youtubeLink} onChange={handleInputChange} placeholder="Link do Vídeo do YouTube" className="pl-10 w-full bg-black/50 border border-gray-700 rounded-lg p-3 focus:border-yellow-400 focus:outline-none" />
                  </div>
                </div>

                <div className="relative">
                  <FileText className="absolute left-3 top-5 text-gray-400 w-5 h-5" />
                  <textarea name="description" value={newCar.description} onChange={handleInputChange} placeholder="Descrição detalhada do veículo..." rows={4} className="pl-10 w-full bg-black/50 border border-gray-700 rounded-lg p-3 resize-none focus:border-yellow-400 focus:outline-none" />
                </div>
                
                <div>
                   <Button type="button" onClick={() => fileInputRef.current.click()} className="bg-transparent border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black">
                     <ImageIcon className="mr-2 h-4 w-4" />
                     Adicionar Fotos
                   </Button>
                   <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} multiple accept="image/*" className="hidden"/>
                   <div className="mt-4 flex flex-wrap gap-4">
                     {photoPreviews.map((src, index) => (
                       <div key={index} className="relative">
                         <img-replace src={src} alt={`Preview ${index}`} className="h-24 w-24 object-cover rounded-lg" />
                         <button type="button" onClick={() => removePhoto(index)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1">
                            <Trash2 className="h-3 w-3" />
                         </button>
                       </div>
                     ))}
                   </div>
                </div>

                <Button type="submit" className="w-full bg-yellow-400 text-black hover:bg-yellow-500 font-bold py-3 mt-4">
                  Salvar Veículo
                </Button>
              </form>
            </div>

            {/* Lista de Veículos */}
            <div>
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <Car className="mr-3 text-yellow-400" /> Estoque Atual
              </h2>
              <div className="space-y-4">
                {cars.length > 0 ? cars.map(car => (
                  <motion.div
                    key={car.id}
                    layout
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    className="glass-effect rounded-2xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      {car.photos && car.photos.length > 0 ? (
                        <img-replace src={car.photos[0]} alt={`${car.brand} ${car.model}`} className="h-16 w-24 object-cover rounded-md" />
                      ) : (
                         <div className="h-16 w-24 bg-gray-800 rounded-md flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-lg">{car.brand} {car.model} ({car.year})</h3>
                        <p className="text-yellow-400 font-semibold">{car.price}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button variant="ghost" size="icon" onClick={() => toast({title: "🚧 Edição em desenvolvimento!"})}>
                        <Edit className="h-5 w-5 text-blue-400 hover:text-blue-300" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteCar(car.id)}>
                        <Trash2 className="h-5 w-5 text-red-500 hover:text-red-400" />
                      </Button>
                    </div>
                  </motion.div>
                )) : (
                  <p className="text-center text-gray-400 py-8">Nenhum veículo cadastrado no momento.</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
