// src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Car, PlusCircle, Trash2, Edit, LogOut, Download, MessageSquare, Users,
  Image as ImageIcon, FileText, Check, Star, Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { CSVLink } from 'react-csv';
import { supabase } from '@/lib/supabase';
import {
  getCars, addCar, deleteCar, updateCar,
  getTestimonials, addTestimonial, deleteTestimonial,
  getLeads, updateLead, deleteLead,
  getPlatforms, markCarAsSold, addPlatform, unmarkCarAsSold
} from '@/lib/car-api';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import BackgroundShape from '@/components/BackgroundShape';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import VehicleManager from '@/components/VehicleManager';

const FormFields = React.memo(({ carData, onChange, carOptions }) => (
  <>
    <input name="brand" value={carData.brand || ''} onChange={onChange} placeholder="Marca *" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none" />
    <input name="model" value={carData.model || ''} onChange={onChange} placeholder="Modelo *" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none" />
    <input name="year" value={carData.year || ''} onChange={onChange} placeholder="Ano" type="number" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none" />
    <input name="price" value={carData.price || ''} onChange={onChange} placeholder="Preço *" type="number" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none" />
    <input name="mileage" value={carData.mileage || ''} onChange={onChange} placeholder="Quilometragem *" type="number" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none" />
    <select name="color" value={carData.color || ''} onChange={onChange} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none">
      <option value="">Cor *</option>
      {carOptions.colors.map(c => <option key={c} value={c}>{c}</option>)}
    </select>
    <select name="fuel" value={carData.fuel || ''} onChange={onChange} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none">
      <option value="">Combustível *</option>
      {carOptions.fuels.map(f => <option key={f} value={f}>{f}</option>)}
    </select>
    <select name="transmission" value={carData.transmission || ''} onChange={onChange} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none">
      <option value="">Câmbio *</option>
      {carOptions.transmissions.map(t => <option key={t} value={t}>{t}</option>)}
    </select>
    <select name="body_type" value={carData.body_type || ''} onChange={onChange} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none">
      <option value="">Carroceria *</option>
      {carOptions.bodyTypes.map(b => <option key={b} value={b}>{b}</option>)}
    </select>
    <div className="relative md:col-span-3">
      <input name="youtube_link" value={carData.youtube_link || ''} onChange={onChange} placeholder="Link do Vídeo do YouTube" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none" />
    </div>
    <div className="relative md:col-span-3">
      <textarea name="full_description" value={carData.full_description || ''} onChange={onChange} placeholder="Descrição detalhada..." rows={4} className="w-full bg-white border border-gray-300 rounded-lg p-3 resize-none text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none" />
    </div>
  </>
));

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('leads');
  const [cars, setCars] = useState([]);
  const [leads, setLeads] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leadFilters, setLeadFilters] = useState({ status: '', startDate: '', endDate: '' });
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [newTestimonial, setNewTestimonial] = useState({ client_name: '', testimonial_text: '', car_sold: '' });
  const [newCar, setNewCar] = useState({ brand: '', model: '', year: '', price: '', mileage: '', fuel: '', photo_urls: [], youtube_link: '', full_description: '', transmission: '', body_type: '', color: '' });
  const [editingCar, setEditingCar] = useState(null);
  const [photosToUpload, setPhotosToUpload] = useState([]);
  const [photosToDelete, setPhotosToDelete] = useState([]);
  const [mainPhotoIndex, setMainPhotoIndex] = useState(0);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [carToDelete, setCarToDelete] = useState(null);
  const [markSoldModalOpen, setMarkSoldModalOpen] = useState(false);
  const [selectedCarToMark, setSelectedCarToMark] = useState(null);
  const [salePriceInput, setSalePriceInput] = useState('');
  const [saleDateInput, setSaleDateInput] = useState(new Date());
  const [salePlatformInput, setSalePlatformInput] = useState('');
  const [newPlatformName, setNewPlatformName] = useState('');
  const [isAddingPlatform, setIsAddingPlatform] = useState(false);
  const [undoSaleCarId, setUndoSaleCarId] = useState(null);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const carOptions = {
    transmissions: ['Automático', 'Manual'],
    bodyTypes: ['SUV', 'Sedan', 'Hatch', 'Picape', 'Esportivo', 'Outro'],
    fuels: ['Flex', 'Gasolina', 'Diesel', 'Elétrico', 'Híbrido'],
    colors: ['Preto', 'Branco', 'Prata', 'Cinza', 'Azul', 'Vermelho', 'Marrom', 'Verde', 'Outra']
  };
  const statusOptions = ['Novo', 'Contato Realizado', 'Em Negociação', 'Venda Concluída', 'Descartado'];

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [carsData, testimonialsData, leadsData, platformsData] = await Promise.all([
        getCars(), getTestimonials(), getLeads(leadFilters), getPlatforms()
      ]);
      setCars(carsData || []);
      setTestimonials(testimonialsData || []);
      setLeads(leadsData || []);
      setPlatforms(platformsData || []);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      toast({ title: 'Erro ao carregar dados', description: err.message || String(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [leadFilters]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  const handleStatusChange = async (leadId, newStatus) => { await updateLead(leadId, { status: newStatus }); toast({ title: 'Status do lead atualizado!' }); fetchAllData(); };
  const handleDeleteLead = async () => { if (!leadToDelete) return; await deleteLead(leadToDelete); toast({ title: 'Lead removido com sucesso.' }); setLeadToDelete(null); fetchAllData(); };
  const leadsForCSV = (leadsData) => leadsData.map(lead => ({ data_criacao: new Date(lead.created_at).toLocaleString('pt-BR'), nome_cliente: lead.client_name, contato_cliente: lead.client_contact, tipo_lead: lead.lead_type, status: lead.status, veiculo: lead.cars ? `${lead.cars.brand} ${lead.cars.model}` : (lead.car_details || 'N/A'), notas: lead.notes, }));
  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/admin'); };
  const handleInputChange = (e, setStateFunc) => { const { name, value } = e.target; setStateFunc(prev => ({ ...prev, [name]: value }));};
  const handleNewCarInputChange = useCallback((e) => handleInputChange(e, setNewCar), []);
  const handleEditingCarInputChange = useCallback((e) => handleInputChange(e, setEditingCar), []);
  const handleNewTestimonialInputChange = useCallback((e) => handleInputChange(e, setNewTestimonial), []);
  const handleToggleFeatured = async (carId, currentStatus) => { await updateCar(carId, { is_featured: !currentStatus }); toast({ title: `Veículo ${!currentStatus ? 'adicionado aos' : 'removido dos'} destaques!` }); fetchAllData(); };
  const handleAddTestimonial = async (e) => { e.preventDefault(); await addTestimonial(newTestimonial); toast({ title: 'Depoimento adicionado!' }); setNewTestimonial({ client_name: '', testimonial_text: '', car_sold: '' }); fetchAllData(); };
  const handleDeleteTestimonial = async (id) => { await deleteTestimonial(id); toast({ title: 'Depoimento removido.' }); fetchAllData(); };
  const handlePhotoUpload = (e) => { const files = Array.from(e.target.files); setPhotosToUpload(prev => [...prev, ...files]);};

  const removePhoto = (index, isExisting = false) => {
    if (isExisting && editingCar) {
      const photoUrl = editingCar.photo_urls[index];
      setPhotosToDelete(prev => [...prev, photoUrl]);
      setEditingCar(prev => ({ ...prev, photo_urls: prev.photo_urls.filter((_, i) => i !== index) }));
    } else {
      setPhotosToUpload(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleAddCar = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const photoUrls = [];
      for (const file of photosToUpload) {
        const fileName = `${newCar.brand}/${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from('car_photos').upload(fileName, file);
        if (uploadError) {
          toast({ title: 'Erro no upload.', description: uploadError.message, variant: 'destructive' });
          setLoading(false);
          return;
        }
        const { data: { publicUrl } } = supabase.storage.from('car_photos').getPublicUrl(uploadData.path);
        photoUrls.push(publicUrl);
      }

      const carData = { ...newCar, photo_urls: photoUrls, main_photo_url: photoUrls[mainPhotoIndex] || null, price: parseFloat(newCar.price) };
      const { data: addedCar, error } = await addCar(carData);
      if (error) {
        toast({ title: 'Erro ao adicionar.', description: error.message, variant: 'destructive' });
      } else {
        setCars(prevCars => [addedCar[0], ...prevCars]);
        setNewCar({ brand: '', model: '', year: '', price: '', mileage: '', fuel: '', photo_urls: [], youtube_link: '', full_description: '', transmission: '', body_type: '', color: '' });
        setPhotosToUpload([]);
        setMainPhotoIndex(0);
        if (fileInputRef.current) fileInputRef.current.value = "";
        toast({ title: 'Veículo adicionado!' });
      }
    } catch (err) {
      console.error('Erro em handleAddCar:', err);
      toast({ title: 'Erro ao adicionar veículo', description: err.message || String(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditCarClick = (car) => { setPhotosToUpload([]); setPhotosToDelete([]); setEditingCar(JSON.parse(JSON.stringify(car))); setIsEditDialogOpen(true); };

  const handleUpdateCar = async (e) => {
    e.preventDefault();
    if (!editingCar) return;
    setLoading(true);
    try {
      let finalCarData = { ...editingCar };

      if (photosToUpload.length > 0) {
        const newPhotoUrls = [];
        for (const file of photosToUpload) {
          const fileName = `${finalCarData.brand}/${Date.now()}_${file.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage.from('car_photos').upload(fileName, file);
          if (uploadError) {
            toast({ title: 'Erro no upload.', description: uploadError.message, variant: 'destructive' });
            setLoading(false);
            return;
          }
          const { data: { publicUrl } } = supabase.storage.from('car_photos').getPublicUrl(uploadData.path);
          newPhotoUrls.push(publicUrl);
        }
        finalCarData.photo_urls = [...(finalCarData.photo_urls || []), ...newPhotoUrls];
      }

      if (photosToDelete.length > 0) {
        const filePaths = photosToDelete.map(url => url.split('/car_photos/')[1]).filter(Boolean);
        if (filePaths.length > 0) {
          await supabase.storage.from('car_photos').remove(filePaths);
        }
      }

      if (!finalCarData.photo_urls || finalCarData.photo_urls.length === 0) {
        finalCarData.main_photo_url = null;
      } else if (!finalCarData.photo_urls.includes(finalCarData.main_photo_url)) {
        finalCarData.main_photo_url = finalCarData.photo_urls[0] || null;
      }

      const { error } = await updateCar(finalCarData.id, { ...finalCarData, price: parseFloat(finalCarData.price) });
      if (error) {
        toast({ title: 'Erro ao atualizar.', description: error.message || String(error), variant: 'destructive' });
      } else {
        setCars(prev => prev.map(car => car.id === finalCarData.id ? finalCarData : car));
        setIsEditDialogOpen(false);
        setEditingCar(null);
        setPhotosToUpload([]);
        setPhotosToDelete([]);
        toast({ title: 'Veículo atualizado!' });
      }
    } catch (err) {
      console.error('Erro em handleUpdateCar:', err);
      toast({ title: 'Erro ao atualizar veículo', description: err.message || String(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCar = async (id) => {
    setLoading(true);
    try {
      const carToDeleteData = cars.find(car => car.id === id);
      if (carToDeleteData && carToDeleteData.photo_urls && carToDeleteData.photo_urls.length > 0) {
        const filePaths = carToDeleteData.photo_urls.map(url => url.split('/car_photos/')[1]).filter(Boolean);
        if (filePaths.length > 0) {
          await supabase.storage.from('car_photos').remove(filePaths);
        }
      }
      const { error } = await deleteCar(id);
      if (error) {
        toast({ title: 'Erro ao remover.', variant: 'destructive' });
      } else {
        setCars(prev => prev.filter(car => car.id !== id));
        toast({ title: 'Veículo removido.' });
      }
    } catch (err) {
      console.error('Erro em handleDeleteCar:', err);
      toast({ title: 'Erro ao remover veículo', description: err.message || String(err), variant: 'destructive' });
    } finally {
      setCarToDelete(null);
      setLoading(false);
    }
  };

  // === MARCAR COMO VENDIDO
  const openMarkSoldModal = (car) => {
    setSelectedCarToMark(car);
    setSalePriceInput(car.sale_price ? String(car.sale_price) : '');
    setSaleDateInput(car.sold_at ? new Date(car.sold_at) : new Date());
    setSalePlatformInput(car.sold_platform_id || (platforms[0] ? platforms[0].id : ''));
    setMarkSoldModalOpen(true);
  };

  const handleConfirmMarkSold = async () => {
    if (!selectedCarToMark) return;
    setLoading(true);
    try {
      const salePayload = {
        car_id: selectedCarToMark.id,
        platform_id: salePlatformInput || null,
        sale_price: salePriceInput ? parseFloat(salePriceInput) : null,
        sale_date: saleDateInput ? saleDateInput.toISOString() : new Date().toISOString()
      };
      const result = await markCarAsSold(salePayload);
      if (result.error) {
        throw result.error;
      }
      toast({ title: 'Carro marcado como VENDIDO!' });
      setMarkSoldModalOpen(false);
      setSelectedCarToMark(null);
      setCars(prev => prev.map(c => c.id === salePayload.car_id ? { ...c, is_sold: true, sold_at: salePayload.sale_date, sold_platform_id: salePayload.platform_id, sale_price: salePayload.sale_price } : c));
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro ao marcar como vendido', description: err.message || String(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // === DESFAZER VENDA
  const handleConfirmUndoSale = async () => {
    if (!undoSaleCarId) return;
    setLoading(true);
    try {
      const res = await unmarkCarAsSold(undoSaleCarId, { deleteLastSale: true });
      if (res.error) throw res.error;
      setCars(prev => prev.map(c => c.id === undoSaleCarId ? { ...c, is_sold: false, sold_at: null, sold_platform_id: null, sale_price: null } : c));
      toast({ title: 'Venda revertida — veículo voltou ao estoque.' });
      setUndoSaleCarId(null);
    } catch (err) {
      console.error('Erro ao desfazer venda:', err);
      toast({ title: 'Erro ao desfazer venda', description: err.message || String(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlatformUI = async () => {
    if (!newPlatformName || newPlatformName.trim().length < 2) return;
    setIsAddingPlatform(true);
    try {
      const created = await addPlatform(newPlatformName.trim());
      if (created) {
        setPlatforms(prev => [...prev, created]);
        setNewPlatformName('');
        toast({ title: 'Plataforma criada!' });
      } else {
        toast({ title: 'Não foi possível criar a plataforma', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Erro ao criar plataforma', description: err.message || String(err), variant: 'destructive' });
    } finally {
      setIsAddingPlatform(false);
    }
  };

  // ordena carros: não vendidos primeiro, vendidos por último
  const sortedCars = [...cars].sort((a, b) => {
    if (a.is_sold === b.is_sold) return 0;
    return a.is_sold ? 1 : -1;
  });

  return (
    <div className="relative isolate min-h-screen bg-gray-50 text-gray-800 pt-28">
      <Helmet><title>Dashboard - AutenTicco Motors</title></Helmet>
      <BackgroundShape />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Painel de <span className="text-yellow-500">Controle</span></h1>
            <Button onClick={handleLogout} variant="destructive"><LogOut className="mr-2 h-4 w-4" /> Sair</Button>
          </div>

          <div className="flex space-x-4 mb-8 border-b">
            <button className={`px-4 py-2 font-semibold ${activeTab === 'leads' ? 'border-b-2 border-yellow-500 text-yellow-500' : 'text-gray-500 hover:text-gray-900'}`} onClick={() => setActiveTab('leads')}><Users className="inline mr-2" /> Leads</button>
            <button className={`px-4 py-2 font-semibold ${activeTab === 'cars' ? 'border-b-2 border-yellow-500 text-yellow-500' : 'text-gray-500 hover:text-gray-900'}`} onClick={() => setActiveTab('cars')}><Car className="inline mr-2" /> Veículos</button>
            <button className={`px-4 py-2 font-semibold ${activeTab === 'gestao' ? 'border-b-2 border-yellow-500 text-yellow-500' : 'text-gray-500 hover:text-gray-900'}`} onClick={() => setActiveTab('gestao')}><FileText className="inline mr-2" /> Gestão</button>
            <button className={`px-4 py-2 font-semibold ${activeTab === 'testimonials' ? 'border-b-2 border-yellow-500 text-yellow-500' : 'text-gray-500 hover:text-gray-900'}`} onClick={() => setActiveTab('testimonials')}><MessageSquare className="inline mr-2" /> Depoimentos</button>
          </div>

          {activeTab === 'leads' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border">
              {/* ... conteúdo de Leads (mantido) ... */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <div className="text-lg font-bold">Exibindo <span className="text-yellow-500">{leads.length}</span> lead(s)</div>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <div className='flex gap-2 items-center'>
                    <label htmlFor="startDate" className='text-sm font-medium'>De:</label>
                    <input type="date" id="startDate" name="startDate" value={leadFilters.startDate} onChange={(e) => setLeadFilters(f => ({...f, startDate: e.target.value}))} className="bg-white border-gray-300 rounded-md p-2 h-10 text-sm" />
                  </div>
                  <div className='flex gap-2 items-center'>
                    <label htmlFor="endDate" className='text-sm font-medium'>Até:</label>
                    <input type="date" id="endDate" name="endDate" value={leadFilters.endDate} onChange={(e) => setLeadFilters(f => ({...f, endDate: e.target.value}))} className="bg-white border-gray-300 rounded-md p-2 h-10 text-sm" />
                  </div>
                  <select value={leadFilters.status} onChange={(e) => setLeadFilters(f => ({...f, status: e.target.value}))} className="bg-white border-gray-300 rounded-md p-2 h-10 text-sm">
                    <option value="">Filtrar por Status</option>
                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <Button variant="outline" size="sm" asChild><CSVLink data={leadsForCSV(leads)} filename={"leads-autenticco.csv"} className="flex items-center"><Download className="mr-2 h-4 w-4" /> Exportar</CSVLink></Button>
                </div>
              </div>
              <div className="space-y-4">
                {leads.map(lead => (
                  <motion.div key={lead.id} layout className="bg-white rounded-lg p-4 shadow border">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-lg text-gray-900 truncate">{lead.client_name} - <span className="text-yellow-500 text-sm font-normal">{lead.lead_type}</span></p>
                        <p className="text-gray-600 truncate">{lead.client_contact}</p>
                        {lead.cars && lead.cars.slug && <p className="text-sm mt-2">Interesse: <Link to={`/carro/${lead.cars.slug}`} target="_blank" className="text-blue-600 hover:underline">{lead.cars.brand} {lead.cars.model}</Link></p>}
                      </div>
                      <div className="flex items-center gap-1">
                        <select value={lead.status} onChange={(e) => handleStatusChange(lead.id, e.target.value)} className="bg-gray-100 border-gray-300 rounded p-2 text-sm flex-shrink-0">
                          {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <AlertDialog open={leadToDelete === lead.id} onOpenChange={(isOpen) => !isOpen && setLeadToDelete(null)}>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setLeadToDelete(lead.id)}>
                              <Trash2 className="h-5 w-5 text-red-500 hover:text-red-400" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white">
                            <AlertDialogHeader><AlertDialogTitle>Tem certeza?</AlertDialogTitle><AlertDialogDescription>Esta ação removerá o lead permanentemente.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteLead}>Sim, Excluir</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'cars' && (
            <>
              {/* ... aba Veículos (mantida) ... */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 mb-12 shadow-xl border">
                <h2 className="text-2xl font-semibold mb-6 flex items-center"><PlusCircle className="mr-3 text-yellow-500" /> Adicionar Novo Veículo</h2>
                <form onSubmit={handleAddCar} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6"><FormFields carData={newCar} onChange={handleNewCarInputChange} carOptions={carOptions} /></div>
                  <div>
                    <Button type="button" onClick={() => fileInputRef.current && fileInputRef.current.click()}><ImageIcon className="mr-2 h-4 w-4" /> Adicionar Fotos</Button>
                    <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} multiple accept="image/*" className="hidden"/>
                    <div className="mt-4 flex flex-wrap gap-4">{photosToUpload.map((file, index) => (
                      <div key={index} className="relative cursor-pointer" onClick={() => setMainPhotoIndex(index)}>
                        <img src={URL.createObjectURL(file)} alt={`Preview ${index}`} className={`h-24 w-24 object-cover rounded-lg ${mainPhotoIndex === index ? 'ring-2 ring-yellow-500' : ''}`} />
                        {mainPhotoIndex === index && <div className="absolute top-1 right-1 bg-yellow-500 text-black rounded-full p-1"><Check className="h-3 w-3" /></div>}
                        <button type="button" onClick={(e) => { e.stopPropagation(); removePhoto(index); }} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    ))}</div>
                  </div>
                  <Button type="submit" className="w-full bg-yellow-400 text-black font-bold py-3" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Veículo'}</Button>
                </form>
              </div>

              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold flex items-center"><Car className="mr-3 text-yellow-500" /> Estoque Atual ({cars.length})</h2>
                  <Button variant="outline" size="sm" asChild><CSVLink data={cars} filename={"estoque-autenticco.csv"} className="flex items-center"><Download className="mr-2 h-4 w-4" /> Exportar para CSV</CSVLink></Button>
                </div>
                <div className="space-y-4">
                  {sortedCars && sortedCars.map(car => {
                    const sold = !!car.is_sold;
                    return (
                      <motion.div key={car.id} layout className={`bg-white rounded-2xl p-4 flex items-center justify-between shadow border ${sold ? 'opacity-80' : ''}`}>
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <img src={car.main_photo_url || 'https://placehold.co/96x64/e2e8f0/4a5568?text=Sem+Foto'} alt={`${car.brand} ${car.model}`} className={`h-16 w-24 object-cover rounded-md ${sold ? 'filter grayscale brightness-75' : ''}`} />
                            {sold && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="bg-red-600 text-white px-3 py-1 rounded-full font-bold text-sm">VENDIDO</span></div>}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">{car.brand} {car.model} ({car.year})</h3>
                            <p className="text-gray-800 font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(car.price)}</p>
                            {sold && <p className="text-sm text-red-600">Vendido em {car.sold_at ? new Date(car.sold_at).toLocaleDateString() : '—'} {car.sale_price ? `- ${new Intl.NumberFormat('pt-BR',{ style:'currency', currency:'BRL'}).format(car.sale_price)}` : ''}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleToggleFeatured(car.id, car.is_featured)} title={car.is_featured ? 'Remover dos destaques' : 'Adicionar aos destaques'}>
                            <Star className={`h-5 w-5 transition-colors ${car.is_featured ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`} />
                          </Button>

                          {!sold && <Button variant="ghost" size="icon" onClick={() => handleEditCarClick(car)}><Edit className="h-5 w-5 text-blue-500 hover:text-blue-400" /></Button>}

                          {!sold ? (
                            <Button variant="outline" size="sm" onClick={() => openMarkSoldModal(car)}><Tag className="mr-2 h-4 w-4" />Marcar como vendido</Button>
                          ) : (
                            <AlertDialog open={undoSaleCarId === car.id} onOpenChange={(isOpen) => !isOpen && setUndoSaleCarId(null)}>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setUndoSaleCarId(car.id)}>Desfazer venda</Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-white">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Desfazer venda</AlertDialogTitle>
                                  <AlertDialogDescription>Tem certeza que quer retornar este veículo ao estoque? Isso removerá o registro de venda.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleConfirmUndoSale}>Sim, retornar ao estoque</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => setCarToDelete(car)}>
                                <Trash2 className="h-5 w-5 text-red-500 hover:text-red-400" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white">
                              <AlertDialogHeader><AlertDialogTitle>Tem certeza?</AlertDialogTitle><AlertDialogDescription>Esta ação removerá o veículo.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteCar(carToDelete.id)}>Excluir</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {activeTab === 'gestao' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border">
              <VehicleManager cars={sortedCars} refreshAll={fetchAllData} />
            </div>
          )}

          {activeTab === 'testimonials' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 mb-12 shadow-xl border">
              <h2 className="text-2xl font-semibold mb-6 flex items-center"><PlusCircle className="mr-3 text-yellow-500" /> Adicionar Novo Depoimento</h2>
              <form onSubmit={handleAddTestimonial} className="space-y-6"><input name="client_name" value={newTestimonial.client_name} onChange={handleNewTestimonialInputChange} placeholder="Nome do Cliente *" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none" /><input name="car_sold" value={newTestimonial.car_sold} onChange={handleNewTestimonialInputChange} placeholder="Carro (Ex: BMW X5 2021)" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none" /><textarea name="testimonial_text" value={newTestimonial.testimonial_text} onChange={handleNewTestimonialInputChange} placeholder="Texto do depoimento *" rows={4} className="w-full p-3 bg-white border border-gray-300 rounded-lg" /><Button type="submit" className="w-full bg-yellow-400 text-black hover:bg-yellow-500 font-bold py-3">Salvar Depoimento</Button></form>
              <div className="mt-8"><h2 className="text-2xl font-semibold mb-6 flex items-center"><MessageSquare className="mr-3 text-yellow-500" /> Depoimentos Cadastrados ({testimonials.length})</h2><div className="space-y-4">{testimonials.map(item => (<motion.div key={item.id} layout className="bg-white rounded-2xl p-4 flex items-center justify-between shadow border"><div><p className="italic text-gray-600">"{item.testimonial_text}"</p><p className="font-bold mt-2 text-gray-800">{item.client_name} - <span className="text-sm font-normal text-gray-500">{item.car_sold}</span></p></div><Button variant="ghost" size="icon" onClick={() => deleteTestimonial(item.id)}><Trash2 className="h-5 w-5 text-red-500" /></Button></motion.div>))}</div></div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Dialogs manutenção (editar, vender) mantidos abaixo */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white text-gray-900">
          <DialogHeader><DialogTitle>Editar Veículo</DialogTitle></DialogHeader>
          {editingCar && (
            <form onSubmit={handleUpdateCar} className="space-y-4 max-h-[80vh] overflow-y-auto pr-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><FormFields carData={editingCar} onChange={handleEditingCarInputChange} carOptions={carOptions} /></div>
              <div className="space-y-2">
                <label className="font-medium text-sm text-gray-700">Fotos</label>
                <div className="flex flex-wrap gap-4 p-2 bg-gray-100 rounded-lg min-h-[112px]">
                  {editingCar.photo_urls && editingCar.photo_urls.map((url, index) => (
                    <div key={url} className="relative">
                      <img src={url} alt={`Foto ${index + 1}`} className="h-24 w-24 object-cover rounded-md" />
                      <button type="button" onClick={() => removePhoto(index, true)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  ))}
                  {photosToUpload.map((file, index) => (
                    <div key={index} className="relative">
                      <img src={URL.createObjectURL(file)} alt={`Preview ${index}`} className="h-24 w-24 object-cover rounded-lg" />
                      <button type="button" onClick={() => removePhoto(index)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
                <Button type="button" onClick={() => fileInputRef.current && fileInputRef.current.click()} className="bg-transparent border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black text-xs px-3 py-1.5 h-auto"><ImageIcon className="mr-2 h-4 w-4" /> Adicionar</Button>
              </div>
              <DialogFooter className="pt-4"><Button type="button" variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button><Button type="submit" className="bg-yellow-400 text-black hover:bg-yellow-500" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Alterações'}</Button></DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={markSoldModalOpen} onOpenChange={setMarkSoldModalOpen}>
        <DialogContent className="bg-white text-gray-900 w-full max-w-xl">
          <DialogHeader>
            <DialogTitle>Marcar Veículo como Vendido</DialogTitle>
            <DialogDescription>Ao marcar como vendido, o veículo ficará visível no final da lista como VENDIDO.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Veículo</label>
              <div className="mt-1 text-sm text-gray-800 font-semibold">{selectedCarToMark ? `${selectedCarToMark.brand} ${selectedCarToMark.model} (${selectedCarToMark.year})` : '—'}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Plataforma</label>
              <div className="flex gap-2 items-center mt-1">
                <select value={salePlatformInput} onChange={(e) => setSalePlatformInput(e.target.value)} className="w-full p-2 border rounded">
                  <option value="">-- selecionar --</option>
                  {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <div className="flex items-center gap-2">
                  <input placeholder="Nova plataforma" className="p-2 border rounded text-sm" value={newPlatformName} onChange={(e) => setNewPlatformName(e.target.value)} />
                  <Button size="sm" onClick={handleAddPlatformUI} disabled={isAddingPlatform}>{isAddingPlatform ? 'Salvando...' : 'Criar'}</Button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Valor final vendido</label>
              <input type="number" value={salePriceInput} onChange={(e) => setSalePriceInput(e.target.value)} className="w-full p-2 border rounded mt-1" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Data da venda</label>
              <div className="mt-1">
                <DatePicker selected={saleDateInput} onChange={(date) => setSaleDateInput(date)} className="w-full p-2 border rounded" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setMarkSoldModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleConfirmMarkSold} className="bg-red-600 text-white">{loading ? 'Processando...' : 'Confirmar Venda'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;

