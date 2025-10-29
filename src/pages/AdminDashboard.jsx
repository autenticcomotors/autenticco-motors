// src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Car, PlusCircle, Trash2, Megaphone, Wallet, DollarSign, Edit, LogOut, Download, MessageSquare, Users, Image as ImageIcon, FileText, Check, Star, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { CSVLink } from 'react-csv';
import { supabase } from '@/lib/supabase';
import {
  getCars, addCar, deleteCar, updateCar, getTestimonials, addTestimonial, deleteTestimonial,
  getLeads, updateLead, deleteLead, getPlatforms, markCarAsSold, unmarkCarAsSold,
  addChecklistItem, getLatestChecklistTemplate
} from '@/lib/car-api';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import BackgroundShape from '@/components/BackgroundShape';
import VehicleManager from '@/components/VehicleManager';
import Reports from '@/pages/Reports';
import OverviewBoard from '@/components/OverviewBoard';

// FormFields agora inclui o campo Blindado (checkbox)
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

    {/* CHECKBOX: Blindado */}
    <div className="flex items-center gap-3">
      <input id="is_blindado" name="is_blindado" type="checkbox" checked={!!carData.is_blindado} onChange={onChange} className="h-4 w-4" />
      <label htmlFor="is_blindado" className="text-sm font-medium text-gray-700">Blindado</label>
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
  const [newCar, setNewCar] = useState({ brand: '', model: '', year: '', price: '', mileage: '', fuel: '', photo_urls: [], youtube_link: '', full_description: '', transmission: '', body_type: '', color: '', is_blindado: false });
  const [editingCar, setEditingCar] = useState(null);
  const [photosToUpload, setPhotosToUpload] = useState([]);
  const [photosToDelete, setPhotosToDelete] = useState([]);
  const [mainPhotoIndex, setMainPhotoIndex] = useState(0);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [carToDelete, setCarToDelete] = useState(null);
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [carToSell, setCarToSell] = useState(null);
  const [saleForm, setSaleForm] = useState({ platform_id: '', sale_price: '', sale_date: '', notes: '' });
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // >>> NOVO: controle para abrir VehicleManager a partir da Matriz
  const [openCarForManager, setOpenCarForManager] = useState(null);

  // novos states de filtro de veiculos
  const [carSearch, setCarSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('');

  const carOptions = {
    transmissions: ['Automático', 'Manual'],
    bodyTypes: ['SUV', 'Sedan', 'Hatch', 'Picape', 'Esportivo', 'Outro'],
    fuels: ['Flex', 'Gasolina', 'Diesel', 'Elétrico', 'Híbrido'],
    colors: ['Preto', 'Branco', 'Prata', 'Cinza', 'Azul', 'Vermelho', 'Marrom', 'Verde', 'Outra']
  };
  const statusOptions = ['Novo', 'Contato Realizado', 'Em Negociação', 'Venda Concluída', 'Descartado'];

  const sortCarsActiveFirst = (list = []) => {
    return [...list].sort((a, b) => {
      const aActive = a.is_available === false ? 0 : 1;
      const bActive = b.is_available === false ? 0 : 1;
      if (aActive !== bActive) return bActive - aActive;
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      return bTime - aTime;
    });
  };

  // fetchAllData now accepts options to avoid showing full-screen loading (used by VehicleManager)
  const fetchAllData = useCallback(async (opts = { showLoading: true }) => {
    if (opts.showLoading) setLoading(true);
    try {
      const [carsData, testimonialsData, leadsData, platformsData] = await Promise.all([
        getCars(), getTestimonials(), getLeads(leadFilters), getPlatforms()
      ]);
      setCars(sortCarsActiveFirst(carsData || []));
      setTestimonials(testimonialsData || []);
      setLeads(leadsData || []);
      setPlatforms(platformsData || []);
    } catch (err) {
      console.error('Erro fetchAllData:', err);
      setCars([]);
      setTestimonials([]);
      setLeads([]);
      setPlatforms([]);
    } finally {
      if (opts.showLoading) setLoading(false);
    }
  }, [leadFilters]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  const handleStatusChange = async (leadId, newStatus) => {
    await updateLead(leadId, { status: newStatus });
    toast({ title: 'Status do lead atualizado!' });
    fetchAllData();
  };

  const handleDeleteLead = async () => {
    if (!leadToDelete) return;
    await deleteLead(leadToDelete);
    toast({ title: 'Lead removido com sucesso.' });
    setLeadToDelete(null);
    fetchAllData();
  };

  const leadsForCSV = (leadsData) => (leadsData || []).map(lead => ({
    data_criacao: new Date(lead.created_at).toLocaleString('pt-BR'),
    nome_cliente: lead.client_name,
    contato_cliente: lead.client_contact,
    tipo_lead: lead.lead_type,
    status: lead.status,
    veiculo: lead.cars ? `${lead.cars.brand} ${lead.cars.model}` : (lead.car_details || 'N/A'),
    notas: lead.notes,
  }));

  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/admin'); };

  // handleInputChange agora suporta checkbox corretamente
  const handleInputChange = (e, setStateFunc) => {
    const { name, type, checked, value } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;
    setStateFunc(prev => ({ ...prev, [name]: finalValue }));
  };
  const handleNewCarInputChange = useCallback((e) => handleInputChange(e, setNewCar), []);
  const handleEditingCarInputChange = useCallback((e) => handleInputChange(e, setEditingCar), []);
  const handleNewTestimonialInputChange = useCallback((e) => handleInputChange(e, setNewTestimonial), []);

  const handleToggleFeatured = async (carId, currentStatus) => {
    await updateCar(carId, { is_featured: !currentStatus });
    toast({ title: `Veículo ${!currentStatus ? 'adicionado aos' : 'removido dos'} destaques!` });
    fetchAllData();
  };

  const handleAddTestimonial = async (e) => {
    e.preventDefault();
    await addTestimonial(newTestimonial);
    toast({ title: 'Depoimento adicionado!' });
    setNewTestimonial({ client_name: '', testimonial_text: '', car_sold: '' });
    fetchAllData();
  };
  const handleDeleteTestimonial = async (id) => { await deleteTestimonial(id); toast({ title: 'Depoimento removido.' }); fetchAllData(); };

  const handlePhotoUpload = (e) => { const files = Array.from(e.target.files || []); setPhotosToUpload(prev => [...prev, ...files]); };
  const removePhoto = (index, isExisting = false) => {
    if (isExisting && editingCar) {
      const photoUrl = editingCar.photo_urls[index];
      setPhotosToDelete(prev => [...prev, photoUrl]);
      setEditingCar(prev => ({ ...prev, photo_urls: prev.photo_urls.filter((_, i) => i !== index) }));
    } else {
      setPhotosToUpload(prev => prev.filter((_, i) => i !== index));
    }
  };

  const DEFAULT_CHECKLIST = [
    { label: 'Fotos & Documentos', checked: false, notes: '' },
    { label: 'Revisão Mecânica', checked: false, notes: '' },
    { label: 'Limpeza e Higienização', checked: false, notes: '' }
  ];

  const handleAddCar = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const photoUrls = [];
      for (const file of photosToUpload) {
        const fileName = `${newCar.brand}/${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage.from('car_photos').upload(fileName, file);
        if (error) { toast({ title: 'Erro no upload.', description: error.message, variant: 'destructive' }); setLoading(false); return; }
        const { data: { publicUrl } } = supabase.storage.from('car_photos').getPublicUrl(data.path);
        photoUrls.push(publicUrl);
      }
      const carData = { ...newCar, photo_urls: photoUrls, main_photo_url: photoUrls[mainPhotoIndex] || null, price: parseFloat(newCar.price || 0), is_available: true };
      const { data: addedCar, error } = await addCar(carData);
      if (error) { toast({ title: 'Erro ao adicionar.', description: error.message, variant: 'destructive' }); }
      else {
        // try to apply latest checklist template (global) to new car, fallback to DEFAULT_CHECKLIST
        try {
          const { data: tplArr, error: tplErr } = await getLatestChecklistTemplate();
          let itemsToCreate = DEFAULT_CHECKLIST;
          if (!tplErr && tplArr && tplArr.template && Array.isArray(tplArr.template) && tplArr.template.length > 0) {
            itemsToCreate = tplArr.template.map(it => ({ label: it.label || it.label, notes: it.notes || '', checked: false }));
          }
          for (const item of itemsToCreate) {
            await addChecklistItem({ car_id: addedCar.id, label: item.label, checked: item.checked || false, notes: item.notes || '' });
          }
        } catch (err) {
          console.warn('Erro ao criar checklist padrão:', err);
        }

        // prepend active car to UI (and resort)
        setCars(prevCars => sortCarsActiveFirst([...(prevCars || []), addedCar]));
        setNewCar({ brand: '', model: '', year: '', price: '', mileage: '', fuel: '', photo_urls: [], youtube_link: '', full_description: '', transmission: '', body_type: '', color: '', is_blindado: false });
        setPhotosToUpload([]);
        setMainPhotoIndex(0);
        if (fileInputRef.current) fileInputRef.current.value = "";
        toast({ title: 'Veículo adicionado!' });
      }
    } catch (err) {
      console.error('Erro handleAddCar:', err);
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
          const { data, error } = await supabase.storage.from('car_photos').upload(fileName, file);
          if (error) { toast({ title: 'Erro no upload.', description: error.message, variant: 'destructive' }); setLoading(false); return; }
          const { data: { publicUrl } } = supabase.storage.from('car_photos').getPublicUrl(data.path);
          newPhotoUrls.push(publicUrl);
        }
        finalCarData.photo_urls = [...(finalCarData.photo_urls || []), ...newPhotoUrls];
      }
      if (photosToDelete.length > 0) {
        const filePaths = photosToDelete.map(url => url.split('/car_photos/')[1]).filter(Boolean);
        if (filePaths.length > 0) await supabase.storage.from('car_photos').remove(filePaths);
      }
      if (!finalCarData.photo_urls || !finalCarData.photo_urls.includes(finalCarData.main_photo_url)) {
        finalCarData.main_photo_url = (finalCarData.photo_urls && finalCarData.photo_urls[0]) || null;
      }
      const { error } = await updateCar(finalCarData.id, { ...finalCarData, price: parseFloat(finalCarData.price || 0) });
      if (error) { toast({ title: 'Erro ao atualizar.', description: error.message, variant: 'destructive' }); }
      else {
        setCars(prev => prev.map(c => c.id === finalCarData.id ? finalCarData : c));
        setIsEditDialogOpen(false);
        setEditingCar(null);
        toast({ title: 'Veículo atualizado!' });
      }
    } catch (err) {
      console.error('Erro handleUpdateCar:', err);
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
        if (filePaths.length > 0) await supabase.storage.from('car_photos').remove(filePaths);
      }
      const { data, error } = await deleteCar(id);
      if (error) { toast({ title: 'Erro ao remover.', variant: 'destructive' }); }
      else { setCars(cars.filter(car => car.id !== id)); toast({ title: 'Veículo removido.' }); }
    } catch (err) {
      console.error('Erro handleDeleteCar:', err);
      toast({ title: 'Erro ao remover veículo', description: err.message || String(err), variant: 'destructive' });
    } finally {
      setCarToDelete(null);
      setLoading(false);
    }
  };

  // --- VENDAS: abrir modal
  const openSaleDialog = (car) => {
    setCarToSell(car);
    setSaleForm({
      platform_id: car.sold_platform_id || (platforms[0] && platforms[0].id) || '',
      sale_price: car.sale_price || '',
      sale_date: car.sold_at ? car.sold_at.slice(0,10) : new Date().toISOString().slice(0, 10),
      notes: ''
    });
    setSaleDialogOpen(true);
  };

  const handleSaleFormChange = (e) => {
    const { name, value } = e.target;
    setSaleForm(prev => ({ ...prev, [name]: value }));
  };

  const handleConfirmSell = async (e) => {
    e?.preventDefault();
    if (!carToSell) return;
    setLoading(true);
    try {
      const payload = {
        car_id: carToSell.id,
        platform_id: saleForm.platform_id || null,
        sale_price: saleForm.sale_price ? parseFloat(saleForm.sale_price) : null,
        sale_date: saleForm.sale_date || null,
        notes: saleForm.notes || null
      };
      const res = await markCarAsSold(payload);
      if (res?.error) {
        toast({ title: 'Erro ao marcar como vendido', description: String(res.error), variant: 'destructive' });
      } else {
        toast({ title: 'Veículo marcado como vendido!' });
        await fetchAllData();
        setSaleDialogOpen(false);
        setCarToSell(null);
      }
    } catch (err) {
      console.error('Erro handleConfirmSell:', err);
      toast({ title: 'Erro ao marcar como vendido', description: err.message || String(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleUndoSale = async (car) => {
    if (!car) return;
    setLoading(true);
    try {
      const res = await unmarkCarAsSold(car.id, { deleteAllSales: true });
      if (res?.error) {
        toast({ title: 'Erro ao reverter venda', description: String(res.error), variant: 'destructive' });
      } else {
        toast({ title: 'Venda revertida — carro voltou ao estoque.' });
        await fetchAllData();
      }
    } catch (err) {
      console.error('Erro handleUndoSale:', err);
      toast({ title: 'Erro ao reverter venda', description: err.message || String(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // --- FILTROS (Admin - VEÍCULOS)
  const brandOptions = useMemo(() => {
    const brands = Array.from(new Set((cars || []).map(c => (c.brand || '').trim()).filter(Boolean)));
    brands.sort((a,b) => a.localeCompare(b, 'pt-BR'));
    return brands;
  }, [cars]);

  const filteredCars = useMemo(() => {
    const term = (carSearch || '').trim().toLowerCase();
    return (cars || []).filter(c => {
      if (brandFilter && brandFilter !== 'ALL' && String((c.brand || '')).toLowerCase() !== String(brandFilter).toLowerCase()) return false;
      if (!term) return true;
      const brand = (c.brand || '').toLowerCase();
      const model = (c.model || '').toLowerCase();
      const combined = `${brand} ${model}`;
      return brand.includes(term) || model.includes(term) || combined.includes(term);
    });
  }, [cars, carSearch, brandFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-yellow-500 text-xl animate-pulse">Carregando painel...</div>
      </div>
    );
  }

  return (
    <div className="relative isolate min-h-screen bg-gray-50 text-gray-800 pt-28">
      <Helmet><title>Dashboard - AutenTicco Motors</title></Helmet>
      <BackgroundShape />

      {/* >>> VehicleManager global: abre modal a partir da Matriz sem trocar de aba */}
      <VehicleManager
        cars={cars}
        platforms={platforms}
        openCar={openCarForManager}
        onOpenHandled={() => setOpenCarForManager(null)}
        refreshAll={() => fetchAllData({ showLoading: false })}
      />

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-12 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Painel de <span className="text-yellow-500">Controle</span></h1>
            <Button onClick={handleLogout} variant="destructive"><LogOut className="mr-2 h-4 w-4" /> Sair</Button>
          </div>

          <div className="flex space-x-4 mb-8 border-b">
            <button className={`px-4 py-2 font-semibold ${activeTab === 'leads' ? 'border-b-2 border-yellow-500 text-yellow-500' : 'text-gray-500 hover:text-gray-900'}`} onClick={() => setActiveTab('leads')}><Users className="inline mr-2" /> Leads</button>
            <button className={`px-4 py-2 font-semibold ${activeTab === 'cars' ? 'border-b-2 border-yellow-500 text-yellow-500' : 'text-gray-500 hover:text-gray-900'}`} onClick={() => setActiveTab('cars')}><Car className="inline mr-2" /> Veículos</button>
            <button className={`px-4 py-2 font-semibold ${activeTab === 'testimonials' ? 'border-b-2 border-yellow-500 text-yellow-500' : 'text-gray-500 hover:text-gray-900'}`} onClick={() => setActiveTab('testimonials')}><MessageSquare className="inline mr-2" /> Depoimentos</button>
            <button className={`px-4 py-2 font-semibold ${activeTab === 'gestao' ? 'border-b-2 border-yellow-500 text-yellow-500' : 'text-gray-500 hover:text-gray-900'}`} onClick={() => setActiveTab('gestao')}><FileText className="inline mr-2" /> Gestão</button>
            <button className={`px-4 py-2 font-semibold ${activeTab === 'matriz' ? 'border-b-2 border-yellow-500 text-yellow-500' : 'text-gray-500 hover:text-gray-900'}`} onClick={() => setActiveTab('matriz')}><BarChart2 className="inline mr-2" /> Matriz</button>
            <button className={`px-4 py-2 font-semibold ${activeTab === 'reports' ? 'border-b-2 border-yellow-500 text-yellow-500' : 'text-gray-500 hover:text-gray-900'}`} onClick={() => setActiveTab('reports')}><BarChart2 className="inline mr-2" /> Relatórios</button>
          </div>

          {/* LEADS */}
          {activeTab === 'leads' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border">
              {/* ... (sem alterações) ... */}
              {/* (conteúdo existente dos LEADS permanece) */}
            </div>
          )}

          {/* VEÍCULOS */}
          {activeTab === 'cars' && (
            <>
              {/* ... (sem alterações) ... */}
              {/* (conteúdo existente dos VEÍCULOS permanece) */}
            </>
          )}

          {/* GESTÃO (VehicleManager) */}
          {activeTab === 'gestao' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border">
              <VehicleManager cars={cars} refreshAll={() => fetchAllData({ showLoading: false })} />
            </div>
          )}

          {/* MATRIZ (OverviewBoard) */}
          {activeTab === 'matriz' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border">
              {/* Wrapper com rolagem + cabeçalho sticky */}
              <div className="matrix-scroll max-h-[70vh] overflow-auto rounded-xl">
                <OverviewBoard
                  cars={cars}
                  platforms={platforms}
                  onOpenGestaoForCar={(car) => {
                    // agora abre o MODAL da gestão aqui mesmo
                    setOpenCarForManager(car);
                  }}
                />
              </div>

              {/* Estilo local para fixar o cabeçalho da tabela da Matriz */}
              <style>{`
                .matrix-scroll thead th {
                  position: sticky;
                  top: 0;
                  z-index: 30;
                  background: #f9fafb; /* cinza claro para destacar o header */
                  box-shadow: inset 0 -1px 0 rgba(0,0,0,0.06);
                }
                /* Se sua primeira coluna tiver classe .sticky-col, isso fixa ela também (opcional e não quebra nada se não existir) */
                .matrix-scroll .sticky-col {
                  position: sticky;
                  left: 0;
                  z-index: 31;
                  background: #ffffff;
                }
              `}</style>
            </div>
          )}

          {/* DEPOIMENTOS */}
          {activeTab === 'testimonials' && (
            <>
              {/* ... (sem alterações) ... */}
            </>
          )}

          {/* RELATÓRIOS */}
          {activeTab === 'reports' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border">
              <Reports />
            </div>
          )}
        </motion.div>
      </div>

      {/* EDIT DIALOG */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white text-gray-900">
          <DialogHeader><DialogTitle>Editar Veículo</DialogTitle></DialogHeader>
          {/* ... (sem alterações no formulário de edição) ... */}
        </DialogContent>
      </Dialog>

      {/* SALE DIALOG */}
      <Dialog open={saleDialogOpen} onOpenChange={setSaleDialogOpen}>
        <DialogContent className="bg-white text-gray-900">
          <DialogHeader><DialogTitle>Registrar Venda</DialogTitle></DialogHeader>
          {/* ... (sem alterações no modal de venda) ... */}
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default AdminDashboard;

