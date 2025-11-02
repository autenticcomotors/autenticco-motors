// src/pages/AdminDashboard.jsx
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Car,
  PlusCircle,
  Trash2,
  Edit,
  LogOut,
  Download,
  MessageSquare,
  FileText,
  BarChart2,
  Shield,
  ListChecks,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { CSVLink } from 'react-csv';
import { supabase } from '@/lib/supabase';
import {
  getCars,
  addCar,
  deleteCar,
  updateCar,
  getTestimonials,
  addTestimonial,
  deleteTestimonial,
  getLeads,
  updateLead,
  deleteLead,
  getPlatforms,
  markCarAsSold,
  unmarkCarAsSold,
  getCustomerDemandsOffers,
  addCustomerDemandOffer,
  updateCustomerDemandOffer,
  deleteCustomerDemandOffer,
} from '@/lib/car-api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import BackgroundShape from '@/components/BackgroundShape';
import VehicleManager from '@/components/VehicleManager';
import Reports from '@/pages/Reports';
import OverviewBoard from '@/components/OverviewBoard';
import AccessControl from '@/pages/AccessControl'; // 👈 nova aba

// ---------- FORM FIELDS (inclui PLACA) ----------
const FormFields = React.memo(({ carData, onChange, carOptions }) => (
  <>
    <input
      name="brand"
      value={carData.brand || ''}
      onChange={onChange}
      placeholder="Marca *"
      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none"
    />
    <input
      name="model"
      value={carData.model || ''}
      onChange={onChange}
      placeholder="Modelo *"
      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none"
    />
    <input
      name="year"
      value={carData.year || ''}
      onChange={onChange}
      placeholder="Ano"
      type="number"
      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none"
    />

    {/* PLACA */}
    <input
      name="plate"
      value={carData.plate || ''}
      onChange={onChange}
      placeholder="Placa (ex: ABC1D23)"
      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none"
    />

    <input
      name="price"
      value={carData.price || ''}
      onChange={onChange}
      placeholder="Preço *"
      type="number"
      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none"
    />
    <input
      name="mileage"
      value={carData.mileage || ''}
      onChange={onChange}
      placeholder="Quilometragem *"
      type="number"
      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none"
    />
    <select
      name="color"
      value={carData.color || ''}
      onChange={onChange}
      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none"
    >
      <option value="">Cor *</option>
      {carOptions.colors.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
    <select
      name="fuel"
      value={carData.fuel || ''}
      onChange={onChange}
      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none"
    >
      <option value="">Combustível *</option>
      {carOptions.fuels.map((f) => (
        <option key={f} value={f}>
          {f}
        </option>
      ))}
    </select>
    <select
      name="transmission"
      value={carData.transmission || ''}
      onChange={onChange}
      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none"
    >
      <option value="">Câmbio *</option>
      {carOptions.transmissions.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
    <select
      name="body_type"
      value={carData.body_type || ''}
      onChange={onChange}
      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none"
    >
      <option value="">Carroceria *</option>
      {carOptions.bodyTypes.map((b) => (
        <option key={b} value={b}>
          {b}
        </option>
      ))}
    </select>
    <div className="relative md:col-span-3">
      <input
        name="youtube_link"
        value={carData.youtube_link || ''}
        onChange={onChange}
        placeholder="Link do Vídeo do YouTube"
        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none"
      />
    </div>
    <div className="relative md:col-span-3">
      <textarea
        name="full_description"
        value={carData.full_description || ''}
        onChange={onChange}
        placeholder="Descrição detalhada..."
        rows={4}
        className="w-full bg-white border border-gray-200 rounded-lg p-3 resize-none text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none"
      />
    </div>

    <div className="flex items-center gap-3">
      <input
        id="is_blindado"
        name="is_blindado"
        type="checkbox"
        checked={!!carData.is_blindado}
        onChange={onChange}
        className="h-4 w-4"
      />
      <label htmlFor="is_blindado" className="text-sm font-medium text-gray-700">
        Blindado
      </label>
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
  const [leadFilters, setLeadFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
  });
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [newTestimonial, setNewTestimonial] = useState({
    client_name: '',
    testimonial_text: '',
    car_sold: '',
  });

  const [demands, setDemands] = useState([]);
  const [demandsFilter, setDemandsFilter] = useState({
    q: '',
    type: 'all',
    order: 'desc',
  });
  const [isDemandModalOpen, setIsDemandModalOpen] = useState(false);
  const [editingDemand, setEditingDemand] = useState(null);

  const [currentAdminUser, setCurrentAdminUser] = useState(null);

  // inclui plate no estado do novo carro
  const [newCar, setNewCar] = useState({
    brand: '',
    model: '',
    year: '',
    plate: '',
    price: '',
    mileage: '',
    fuel: '',
    photo_urls: [],
    youtube_link: '',
    full_description: '',
    transmission: '',
    body_type: '',
    color: '',
    is_blindado: false,
  });

  const [editingCar, setEditingCar] = useState(null);
  const [photosToUpload, setPhotosToUpload] = useState([]);
  const [photosToDelete, setPhotosToDelete] = useState([]);
  const [mainPhotoIndex, setMainPhotoIndex] = useState(0);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [carToDelete, setCarToDelete] = useState(null);
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [carToSell, setCarToSell] = useState(null);
  const [saleForm, setSaleForm] = useState({
    platform_id: '',
    sale_price: '',
    sale_date: '',
    notes: '',
  });
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // filtros (VEÍCULOS)
  const [carSearch, setCarSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('');

  const carOptions = {
    transmissions: ['Automático', 'Manual'],
    bodyTypes: ['SUV', 'Sedan', 'Hatch', 'Picape', 'Esportivo', 'Outro'],
    fuels: ['Flex', 'Gasolina', 'Diesel', 'Elétrico', 'Híbrido', '-'],
    colors: [
      'Preto',
      'Branco',
      'Prata',
      'Cinza',
      'Azul',
      'Vermelho',
      'Marrom',
      'Verde',
      'Outra',
    ],
  };
  const statusOptions = [
    'Novo',
    'Contato Realizado',
    'Em Negociação',
    'Venda Concluída',
    'Descartado',
  ];

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

  const fetchAllData = useCallback(
    async (opts = { showLoading: true }) => {
      if (opts.showLoading) setLoading(true);
      try {
        const session = await supabase.auth.getSession();
        const email = session?.data?.session?.user?.email || null;

        let adminRow = null;
        if (email) {
          const { data: adminData } = await supabase
            .from('admin_users')
            .select('*, access_roles:role_id(*)')
            .eq('email', email)
            .maybeSingle();
          adminRow = adminData;
          setCurrentAdminUser(adminData || null);
        }

        const [carsData, testimonialsData, leadsData, platformsData, demandsData] =
          await Promise.all([
            getCars(),
            getTestimonials(),
            getLeads(leadFilters),
            getPlatforms(),
            getCustomerDemandsOffers(),
          ]);
        setCars(sortCarsActiveFirst(carsData || []));
        setTestimonials(testimonialsData || []);
        setLeads(leadsData || []);
        setPlatforms(platformsData || []);
        setDemands(demandsData || []);
      } catch (err) {
        console.error('Erro fetchAllData:', err);
        setCars([]);
        setTestimonials([]);
        setLeads([]);
        setPlatforms([]);
        setDemands([]);
      } finally {
        if (opts.showLoading) setLoading(false);
      }
    },
    [leadFilters]
  );

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleStatusChange = async (leadId, newStatus) => {
    await updateLead(leadId, { status: newStatus });
    toast({ title: 'Status do lead atualizado!' });
    fetchAllData({ showLoading: false });
  };

  const handleDeleteLead = async () => {
    if (!leadToDelete) return;
    await deleteLead(leadToDelete);
    toast({ title: 'Lead removido com sucesso.' });
    setLeadToDelete(null);
    fetchAllData({ showLoading: false });
  };

  const leadsForCSV = (leadsData) =>
    (leadsData || []).map((lead) => ({
      data_criacao: new Date(lead.created_at).toLocaleString('pt-BR'),
      nome_cliente: lead.client_name,
      contato_cliente: lead.client_contact,
      tipo_lead: lead.lead_type,
      status: lead.status,
      veiculo: lead.cars
        ? `${lead.cars.brand} ${lead.cars.model}`
        : lead.car_details || 'N/A',
      notas: lead.notes,
    }));

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin');
  };

  // input genérico (suporta checkbox)
  const handleInputChange = (e, setStateFunc) => {
    const { name, type, checked, value } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;
    setStateFunc((prev) => ({ ...prev, [name]: finalValue }));
  };
  const handleNewCarInputChange = useCallback(
    (e) => handleInputChange(e, setNewCar),
    []
  );
  const handleEditingCarInputChange = useCallback(
    (e) => handleInputChange(e, setEditingCar),
    []
  );
  const handleNewTestimonialInputChange = useCallback(
    (e) => handleInputChange(e, setNewTestimonial),
    []
  );

  const handleToggleFeatured = async (carId, currentStatus) => {
    await updateCar(carId, { is_featured: !currentStatus });
    toast({
      title: `Veículo ${
        !currentStatus ? 'adicionado aos' : 'removido dos'
      } destaques!`,
    });
    fetchAllData({ showLoading: false });
  };

  const handleAddTestimonial = async (e) => {
    e.preventDefault();
    await addTestimonial(newTestimonial);
    toast({ title: 'Depoimento adicionado!' });
    setNewTestimonial({
      client_name: '',
      testimonial_text: '',
      car_sold: '',
    });
    fetchAllData({ showLoading: false });
  };
  const handleDeleteTestimonial = async (id) => {
    await deleteTestimonial(id);
    toast({ title: 'Depoimento removido.' });
    fetchAllData({ showLoading: false });
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    setPhotosToUpload((prev) => [...prev, ...files]);
  };

  const removePhoto = (index, isExisting = false) => {
    if (isExisting && editingCar) {
      const photoUrl = editingCar.photo_urls[index];
      setPhotosToDelete((prev) => [...prev, photoUrl]);
      setEditingCar((prev) => ({
        ...prev,
        photo_urls: prev.photo_urls.filter((_, i) => i !== index),
      }));
    } else {
      setPhotosToUpload((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleAddCar = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const photoUrls = [];
      for (const file of photosToUpload) {
        const fileName = `${newCar.brand}/${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage
          .from('car_photos')
          .upload(fileName, file);
        if (error) {
          toast({
            title: 'Erro no upload.',
            description: error.message,
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
        const {
          data: { publicUrl },
        } = supabase.storage.from('car_photos').getPublicUrl(data.path);
        photoUrls.push(publicUrl);
      }
      const carData = {
        ...newCar,
        photo_urls: photoUrls,
        main_photo_url: photoUrls[mainPhotoIndex] || null,
        price: newCar.price ? Number(newCar.price) : 0,
        is_available: true,
      };
      const { data: addedCar, error } = await addCar(carData);
      if (error) {
        toast({
          title: 'Erro ao adicionar.',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setCars((prevCars) =>
          sortCarsActiveFirst([...(prevCars || []), addedCar])
        );
        setNewCar({
          brand: '',
          model: '',
          year: '',
          plate: '',
          price: '',
          mileage: '',
          fuel: '',
          photo_urls: [],
          youtube_link: '',
          full_description: '',
          transmission: '',
          body_type: '',
          color: '',
          is_blindado: false,
        });
        setPhotosToUpload([]);
        setMainPhotoIndex(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
        toast({ title: 'Veículo adicionado!' });
      }
    } catch (err) {
      console.error('Erro handleAddCar:', err);
      toast({
        title: 'Erro ao adicionar veículo',
        description: err.message || String(err),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditCarClick = (car) => {
    setPhotosToUpload([]);
    setPhotosToDelete([]);
    setEditingCar(JSON.parse(JSON.stringify(car)));
    setIsEditDialogOpen(true);
  };

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
          const { data, error } = await supabase.storage
            .from('car_photos')
            .upload(fileName, file);
          if (error) {
            toast({
              title: 'Erro no upload.',
              description: error.message,
              variant: 'destructive',
            });
            setLoading(false);
            return;
          }
          const {
            data: { publicUrl },
          } = supabase.storage.from('car_photos').getPublicUrl(data.path);
          newPhotoUrls.push(publicUrl);
        }
        finalCarData.photo_urls = [
          ...(finalCarData.photo_urls || []),
          ...newPhotoUrls,
        ];
      }
      if (photosToDelete.length > 0) {
        const filePaths = photosToDelete
          .map((url) => url.split('/car_photos/')[1])
          .filter(Boolean);
        if (filePaths.length > 0)
          await supabase.storage.from('car_photos').remove(filePaths);
      }
      if (
        !finalCarData.photo_urls ||
        !finalCarData.photo_urls.includes(finalCarData.main_photo_url)
      ) {
        finalCarData.main_photo_url =
          (finalCarData.photo_urls && finalCarData.photo_urls[0]) || null;
      }
      const { error } = await updateCar(finalCarData.id, {
        ...finalCarData,
        price: finalCarData.price ? Number(finalCarData.price) : 0,
      });
      if (error) {
        toast({
          title: 'Erro ao atualizar.',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setCars((prev) =>
          prev.map((c) => (c.id === finalCarData.id ? finalCarData : c))
        );
        setIsEditDialogOpen(false);
        setEditingCar(null);
        toast({ title: 'Veículo atualizado!' });
      }
    } catch (err) {
      console.error('Erro handleUpdateCar:', err);
      toast({
        title: 'Erro ao atualizar veículo',
        description: err.message || String(err),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCar = async (id) => {
    setLoading(true);
    try {
      const carToDeleteData = cars.find((car) => car.id === id);
      if (
        carToDeleteData &&
        carToDeleteData.photo_urls &&
        carToDeleteData.photo_urls.length > 0
      ) {
        const filePaths = carToDeleteData.photo_urls
          .map((url) => url.split('/car_photos/')[1])
          .filter(Boolean);
        if (filePaths.length > 0)
          await supabase.storage.from('car_photos').remove(filePaths);
      }
      const { error } = await deleteCar(id);
      if (error) {
        toast({ title: 'Erro ao remover.', variant: 'destructive' });
      } else {
        setCars(cars.filter((car) => car.id !== id));
        toast({ title: 'Veículo removido.' });
      }
    } catch (err) {
      console.error('Erro handleDeleteCar:', err);
      toast({
        title: 'Erro ao remover veículo',
        description: err.message || String(err),
        variant: 'destructive',
      });
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
      sale_date: car.sold_at
        ? car.sold_at.slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      notes: '',
    });
    setSaleDialogOpen(true);
  };

  const handleSaleFormChange = (e) => {
    const { name, value } = e.target;
    setSaleForm((prev) => ({ ...prev, [name]: value }));
  };

  // FILTROS (Admin - VEÍCULOS)
  const brandOptions = useMemo(() => {
    const brands = Array.from(
      new Set(
        (cars || [])
          .map((c) => (c.brand || '').trim())
          .filter(Boolean)
      )
    );
    brands.sort((a, b) => a.localeCompare(b, 'pt-BR'));
    return brands;
  }, [cars]);

  const filteredCars = useMemo(() => {
    const term = (carSearch || '').trim().toLowerCase();
    return (cars || []).filter((c) => {
      if (
        brandFilter &&
        brandFilter !== 'ALL' &&
        String((c.brand || '')).toLowerCase() !==
          String(brandFilter).toLowerCase()
      )
        return false;
      if (!term) return true;
      const brand = (c.brand || '').toLowerCase();
      const model = (c.model || '').toLowerCase();
      const plate = (c.plate || '').toLowerCase();
      const combined = `${brand} ${model} ${plate}`;
      return (
        brand.includes(term) ||
        model.includes(term) ||
        plate.includes(term) ||
        combined.includes(term)
      );
    });
  }, [cars, carSearch, brandFilter]);

  // DEMANDS filtrados
  const filteredDemands = useMemo(() => {
    let list = [...(demands || [])];
    if (demandsFilter.type !== 'all') {
      list = list.filter((d) => d.type === demandsFilter.type);
    }
    if (demandsFilter.q) {
      const q = demandsFilter.q.toLowerCase();
      list = list.filter((d) => {
        const txt = `${d.client_name || ''} ${d.brand || ''} ${
          d.model || ''
        } ${d.lead_source || ''}`.toLowerCase();
        return txt.includes(q);
      });
    }
    list.sort((a, b) => {
      if (demandsFilter.order === 'asc') {
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
    return list;
  }, [demands, demandsFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-yellow-500 text-xl animate-pulse">
          Carregando painel...
        </div>
      </div>
    );
  }

  // contagens
  const estoqueAtualCount = (cars || []).filter(
    (c) => c.is_sold !== true && c.is_available !== false
  ).length;
  const vendidosCount = (cars || []).filter((c) => c.is_sold === true).length;

  const isAdminLike =
    currentAdminUser &&
    currentAdminUser.access_roles &&
    ['admin', 'owner'].includes(currentAdminUser.access_roles.slug);

  // ---------------------- RENDER -------------------------
  return (
    <div className="relative isolate min-h-screen bg-gray-50 text-gray-800 pt-28">
      <Helmet>
        <title>Dashboard - AutenTicco Motors</title>
      </Helmet>
      <BackgroundShape />

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-12 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Painel de <span className="text-yellow-500">Controle</span>
            </h1>
            <Button onClick={handleLogout} variant="destructive">
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </Button>
          </div>

          {/* TABS ORDENADAS */}
          <div className="flex flex-wrap gap-4 mb-8 border-b">
            <button
              className={`px-4 py-2 font-semibold ${
                activeTab === 'leads'
                  ? 'border-b-2 border-yellow-500 text-yellow-500'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('leads')}
            >
              <MessageSquare className="inline mr-2" /> Leads
            </button>
            <button
              className={`px-4 py-2 font-semibold ${
                activeTab === 'cars'
                  ? 'border-b-2 border-yellow-500 text-yellow-500'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('cars')}
            >
              <Car className="inline mr-2" /> Veículos
            </button>
            <button
              className={`px-4 py-2 font-semibold ${
                activeTab === 'testimonials'
                  ? 'border-b-2 border-yellow-500 text-yellow-500'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('testimonials')}
            >
              <MessageSquare className="inline mr-2" /> Depoimentos
            </button>
            <button
              className={`px-4 py-2 font-semibold ${
                activeTab === 'gestao'
                  ? 'border-b-2 border-yellow-500 text-yellow-500'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('gestao')}
            >
              <FileText className="inline mr-2" /> Gestão
            </button>
            <button
              className={`px-4 py-2 font-semibold ${
                activeTab === 'matriz'
                  ? 'border-b-2 border-yellow-500 text-yellow-500'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('matriz')}
            >
              <BarChart2 className="inline mr-2" /> Matriz
            </button>
            <button
              className={`px-4 py-2 font-semibold ${
                activeTab === 'demands'
                  ? 'border-b-2 border-yellow-500 text-yellow-500'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('demands')}
            >
              <ListChecks className="inline mr-2" /> Pedidos / Oferecidos
            </button>
            <button
              className={`px-4 py-2 font-semibold ${
                activeTab === 'reports'
                  ? 'border-b-2 border-yellow-500 text-yellow-500'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('reports')}
            >
              <BarChart2 className="inline mr-2" /> Relatórios
            </button>
            {isAdminLike && (
              <button
                className={`px-4 py-2 font-semibold ${
                  activeTab === 'access'
                    ? 'border-b-2 border-yellow-500 text-yellow-500'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                onClick={() => setActiveTab('access')}
              >
                <Shield className="inline mr-2" /> Gestão de acessos
              </button>
            )}
          </div>

          {/* LEADS */}
          {activeTab === 'leads' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <div className="text-lg font-bold">
                  Exibindo <span className="text-yellow-500">{leads.length}</span> lead(s)
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <div className="flex gap-2 items-center">
                    <label htmlFor="startDate" className="text-sm font-medium">
                      De:
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={leadFilters.startDate}
                      onChange={(e) =>
                        setLeadFilters((f) => ({ ...f, startDate: e.target.value }))
                      }
                      className="bg-white border-gray-300 rounded-md p-2 h-10 text-sm"
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    <label htmlFor="endDate" className="text-sm font-medium">
                      Até:
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={leadFilters.endDate}
                      onChange={(e) =>
                        setLeadFilters((f) => ({ ...f, endDate: e.target.value }))
                      }
                      className="bg-white border-gray-300 rounded-md p-2 h-10 text-sm"
                    />
                  </div>
                  <select
                    value={leadFilters.status}
                    onChange={(e) =>
                      setLeadFilters((f) => ({ ...f, status: e.target.value }))
                    }
                    className="bg-white border-gray-300 rounded-md p-2 h-10 text-sm"
                  >
                    <option value="">Filtrar por Status</option>
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <Button variant="outline" size="sm" asChild>
                    <CSVLink
                      data={leadsForCSV(leads)}
                      filename={'leads-autenticco.csv'}
                      className="flex items-center"
                    >
                      <Download className="mr-2 h-4 w-4" /> Exportar
                    </CSVLink>
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {leads.map((lead) => (
                  <motion.div
                    key={lead.id}
                    layout
                    className="bg-white rounded-lg p-4 shadow border"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-lg text-gray-900 truncate">
                          {lead.client_name} -{' '}
                          <span className="text-yellow-500 text-sm font-normal">
                            {lead.lead_type}
                          </span>
                        </p>
                        <p className="text-gray-600 truncate">{lead.client_contact}</p>
                        {lead.cars && lead.cars.slug && (
                          <p className="text-sm mt-2">
                            Interesse:{' '}
                            <Link
                              to={`/carro/${lead.cars.slug}`}
                              target="_blank"
                              className="text-blue-600 hover:underline"
                            >
                              {lead.cars.brand} {lead.cars.model}
                            </Link>
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                          className="bg-gray-100 border-gray-300 rounded p-2 text-sm flex-shrink-0"
                        >
                          {statusOptions.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <AlertDialog
                          open={leadToDelete === lead.id}
                          onOpenChange={(isOpen) => !isOpen && setLeadToDelete(null)}
                        >
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setLeadToDelete(lead.id)}
                            >
                              <Trash2 className="h-5 w-5 text-red-500 hover:text-red-400" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação removerá o lead permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteLead}>
                                Sim, Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* VEÍCULOS */}
          {activeTab === 'cars' && (
            <>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 mb-6 shadow-xl border">
                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                  <PlusCircle className="mr-3 text-yellow-500" /> Adicionar Novo Veículo
                </h2>
                <form onSubmit={handleAddCar} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormFields
                      carData={newCar}
                      onChange={handleNewCarInputChange}
                      carOptions={carOptions}
                    />
                  </div>
                  <div>
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    >
                      Adicionar Fotos
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoUpload}
                      multiple
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="mt-4 flex flex-wrap gap-4">
                      {photosToUpload.map((file, index) => (
                        <div
                          key={index}
                          className="relative cursor-pointer"
                          onClick={() => setMainPhotoIndex(index)}
                        >
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index}`}
                            className={`h-24 w-24 object-cover rounded-lg ${
                              mainPhotoIndex === index ? 'ring-2 ring-yellow-500' : ''
                            }`}
                          />
                          {mainPhotoIndex === index && (
                            <div className="absolute top-1 right-1 bg-yellow-500 text-black rounded-full p-1">
                              ✔
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removePhoto(index);
                            }}
                            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-yellow-400 text-black font-bold py-3"
                    disabled={loading}
                  >
                    {loading ? 'Salvando...' : 'Salvar Veículo'}
                  </Button>
                </form>
              </div>

              {/* Estoque */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-semibold flex items-center">
                    <Car className="mr-3 text-yellow-500" />
                    Estoque Atual ({estoqueAtualCount})
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Veículos vendidos:{' '}
                    <span className="font-semibold text-red-500">{vendidosCount}</span>
                  </p>
                </div>

                <Button variant="outline" size="sm" asChild>
                  <CSVLink
                    data={cars}
                    filename={'estoque-autenticco.csv'}
                    className="flex items-center"
                  >
                    <Download className="mr-2 h-4 w-4" /> Exportar para CSV
                  </CSVLink>
                </Button>
              </div>

              {/* Filtros veículos */}
              <div className="flex flex-col md:flex-row gap-3 items-center mb-4">
                <input
                  placeholder="Pesquisar marca, modelo ou PLACA..."
                  value={carSearch}
                  onChange={(e) => setCarSearch(e.target.value)}
                  className="w-full md:w-1/2 p-2 border rounded"
                />
                <select
                  value={brandFilter || 'ALL'}
                  onChange={(e) =>
                    setBrandFilter(e.target.value === 'ALL' ? '' : e.target.value)
                  }
                  className="w-full md:w-1/4 p-2 border rounded"
                >
                  <option value="ALL">Todas as marcas</option>
                  {brandOptions.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCarSearch('');
                    setBrandFilter('');
                  }}
                >
                  Limpar
                </Button>
              </div>

              <div className="space-y-4">
                {filteredCars &&
                  filteredCars.map((car) => (
                    <motion.div
                      key={car.id}
                      layout
                      className={`bg-white rounded-2xl p-4 flex items-center justify-between shadow border ${
                        car.is_available === false ? 'opacity-90' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img
                            src={
                              car.main_photo_url ||
                              'https://placehold.co/96x64/e2e8f0/4a5568?text=Sem+Foto'
                            }
                            alt={`${car.brand} ${car.model}`}
                            className={`h-16 w-24 object-cover rounded-md ${
                              car.is_available === false
                                ? 'filter grayscale contrast-90'
                                : ''
                            }`}
                          />
                          {car.is_available === false && (
                            <div className="absolute top-1 left-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                              VENDIDO
                            </div>
                          )}
                          {car.is_blindado && (
                            <div className="absolute top-1 right-1 bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                              BLINDADO
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">
                            {car.brand} {car.model} ({car.year})
                          </h3>
                          <p className="text-gray-800 font-semibold">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(car.price || 0)}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Placa: <span className="font-medium">{car.plate || '-'}</span>
                          </p>

                          {car.is_available === false && (
                            <p className="text-sm text-red-600 mt-1">
                              {(() => {
                                const raw = car.sold_at;
                                if (!raw) {
                                  return 'Vendido -';
                                }
                                const clean = String(raw).replace('T', ' ').trim();
                                const y = clean.slice(0, 4);
                                const m = clean.slice(5, 7);
                                const d = clean.slice(8, 10);
                                if (!y || !m || !d) {
                                  return `Vendido em ${raw} - ${
                                    car.sale_price
                                      ? new Intl.NumberFormat('pt-BR', {
                                          style: 'currency',
                                          currency: 'BRL',
                                        }).format(car.sale_price)
                                      : '-'
                                  }`;
                                }
                                const dataBR = `${d}/${m}/${y}`;
                                const preco = car.sale_price
                                  ? new Intl.NumberFormat('pt-BR', {
                                      style: 'currency',
                                      currency: 'BRL',
                                    }).format(car.sale_price)
                                  : '-';
                                return `Vendido em ${dataBR} - ${preco}`;
                              })()}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleFeatured(car.id, car.is_featured)}
                          title={
                            car.is_featured
                              ? 'Remover dos destaques'
                              : 'Adicionar aos destaques'
                          }
                        >
                          <span
                            className={`inline-block h-5 w-5 rounded-full ${
                              car.is_featured
                                ? 'bg-yellow-400'
                                : 'bg-gray-200 hover:bg-yellow-200'
                            }`}
                          ></span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditCarClick(car)}
                        >
                          <Edit className="h-5 w-5 text-blue-500 hover:text-blue-400" />
                        </Button>
                        {car.is_available === true ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openSaleDialog(car)}
                            className="flex items-center gap-2"
                          >
                            Marcar como vendido
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              unmarkCarAsSold(car.id, {
                                deleteAllSales: true,
                              }).then(() => fetchAllData({ showLoading: false }))
                            }
                            title="Reverter venda"
                          >
                            Reabrir
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setCarToDelete(car)}
                            >
                              <Trash2 className="h-5 w-5 text-red-500 hover:text-red-400" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação removerá o veículo.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCar(carToDelete?.id)}
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </>
          )}

          {/* GESTÃO */}
          {activeTab === 'gestao' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border">
              <VehicleManager
                cars={cars}
                refreshAll={() => fetchAllData({ showLoading: false })}
              />
            </div>
          )}

          {/* MATRIZ */}
          {activeTab === 'matriz' && (
            <div className="mb-8">
              <OverviewBoard
                cars={cars}
                platforms={platforms}
                onOpenGestaoForCar={(car) => {
                  toast({
                    title: `Abrindo gestão do veículo ${car.brand} ${car.model}`,
                  });
                  setActiveTab('gestao');
                }}
              />
            </div>
          )}

          {/* DEPOIMENTOS */}
          {activeTab === 'testimonials' && (
            <>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 mb-12 shadow-xl border">
                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                  <PlusCircle className="mr-3 text-yellow-500" /> Adicionar Novo Depoimento
                </h2>
                <form onSubmit={handleAddTestimonial} className="space-y-6">
                  <input
                    name="client_name"
                    value={newTestimonial.client_name}
                    onChange={handleNewTestimonialInputChange}
                    placeholder="Nome do Cliente *"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none"
                  />
                  <input
                    name="car_sold"
                    value={newTestimonial.car_sold}
                    onChange={handleNewTestimonialInputChange}
                    placeholder="Carro (Ex: BMW X5 2021)"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none"
                  />
                  <textarea
                    name="testimonial_text"
                    value={newTestimonial.testimonial_text}
                    onChange={handleNewTestimonialInputChange}
                    placeholder="Texto do depoimento *"
                    rows={4}
                    className="w-full p-3 bg-white border border-gray-200 rounded-lg"
                  />
                  <Button className="w-full bg-yellow-400 text-black hover:bg-yellow-500 font-bold py-3">
                    Salvar Depoimento
                  </Button>
                </form>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                  <MessageSquare className="mr-3 text-yellow-500" /> Depoimentos Cadastrados (
                  {testimonials.length})
                </h2>
                <div className="space-y-4">
                  {testimonials.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      className="bg-white rounded-2xl p-4 flex items-center justify-between shadow border"
                    >
                      <div>
                        <p className="italic text-gray-600">"{item.testimonial_text}"</p>
                        <p className="font-bold mt-2 text-gray-800">
                          {item.client_name} -{' '}
                          <span className="text-sm font-normal text-gray-500">
                            {item.car_sold}
                          </span>
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTestimonial(item.id)}
                      >
                        <Trash2 className="h-5 w-5 text-red-500" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* PEDIDOS / OFERECIDOS */}
          {activeTab === 'demands' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <ListChecks className="text-yellow-500" />
                    Pedidos / Oferecidos
                  </h2>
                  <p className="text-sm text-gray-500">
                    Registre quem pediu carro e quem ofereceu. Match é automático.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="flex items-center gap-2">
                    <Search className="text-gray-400 w-4 h-4" />
                    <input
                      value={demandsFilter.q}
                      onChange={(e) =>
                        setDemandsFilter((prev) => ({ ...prev, q: e.target.value }))
                      }
                      className="border rounded px-2 py-1 text-sm"
                      placeholder="Buscar cliente, modelo, fonte..."
                    />
                  </div>
                  <select
                    value={demandsFilter.type}
                    onChange={(e) =>
                      setDemandsFilter((prev) => ({ ...prev, type: e.target.value }))
                    }
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="all">Todos</option>
                    <option value="pedido">Somente pedidos</option>
                    <option value="oferecido">Somente oferecidos</option>
                  </select>
                  <select
                    value={demandsFilter.order}
                    onChange={(e) =>
                      setDemandsFilter((prev) => ({ ...prev, order: e.target.value }))
                    }
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="desc">Mais recentes</option>
                    <option value="asc">Mais antigos</option>
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchAllData({ showLoading: false })}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingDemand(null);
                      setIsDemandModalOpen(true);
                    }}
                    className="bg-yellow-400 text-black hover:bg-yellow-500"
                  >
                    + Novo
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="bg-white rounded-xl border p-4">
                  <p className="text-xs text-gray-500">TOTAL</p>
                  <p className="text-2xl font-bold text-gray-900">{demands.length}</p>
                </div>
                <div className="bg-white rounded-xl border p-4">
                  <p className="text-xs text-gray-500">PEDIDOS</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {demands.filter((d) => d.type === 'pedido').length}
                  </p>
                </div>
                <div className="bg-white rounded-xl border p-4">
                  <p className="text-xs text-gray-500">OFERECIDOS</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {demands.filter((d) => d.type === 'oferecido').length}
                  </p>
                </div>
                <div className="bg-white rounded-xl border p-4">
                  <p className="text-xs text-gray-500">COM MATCH</p>
                  <p className="text-2xl font-bold text-green-600">
                    {demands.filter((d) => d.matched_car_id).length}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border">
                <table className="min-w-full bg-white rounded-xl">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 uppercase bg-gray-50">
                      <th className="py-3 px-4">Tipo</th>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">Contato</th>
                      <th className="py-3 px-4">Marca/Modelo</th>
                      <th className="py-3 px-4">Faixa Valor</th>
                      <th className="py-3 px-4">Data</th>
                      <th className="py-3 px-4">Origem</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDemands.length === 0 && (
                      <tr>
                        <td
                          colSpan="8"
                          className="py-6 text-center text-sm text-gray-500"
                        >
                          Nenhum pedido / oferecido encontrado.
                        </td>
                      </tr>
                    )}
                    {filteredDemands.map((d) => (
                      <tr key={d.id} className="border-t">
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 text-xs rounded-full ${
                              d.type === 'pedido'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {d.type === 'pedido'
                              ? 'Pedido (procura carro)'
                              : 'Oferecido (quer vender)'}
                          </span>
                        </td>
                        <td className="py-3 px-4">{d.client_name}</td>
                        <td className="py-3 px-4">{d.client_contact}</td>
                        <td className="py-3 px-4">
                          {d.brand} {d.model}
                        </td>
                        <td className="py-3 px-4">
                          {d.price_min || d.price_max
                            ? `${d.price_min ? `R$ ${d.price_min}` : ''}${
                                d.price_min && d.price_max ? ' - ' : ''
                              }${d.price_max ? `R$ ${d.price_max}` : ''}`
                            : '-'}
                        </td>
                        <td className="py-3 px-4">
                          {d.lead_date
                            ? new Date(d.lead_date).toISOString().slice(0, 10)
                            : '-'}
                        </td>
                        <td className="py-3 px-4">{d.lead_source || '-'}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => {
                                setEditingDemand(d);
                                setIsDemandModalOpen(true);
                              }}
                              className="text-blue-600 hover:underline text-sm"
                            >
                              Editar
                            </button>
                            <button
                              onClick={async () => {
                                await deleteCustomerDemandOffer(d.id);
                                toast({ title: 'Registro removido.' });
                                fetchAllData({ showLoading: false });
                              }}
                              className="text-red-500 hover:underline text-sm"
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MODAL DE CADASTRO DE DEMAND */}
              <Dialog open={isDemandModalOpen} onOpenChange={setIsDemandModalOpen}>
                <DialogContent className="max-w-3xl bg-white text-gray-900">
                  <DialogHeader>
                    <DialogTitle>
                      {editingDemand ? 'Editar pedido / oferecido' : 'Novo pedido / oferecido'}
                    </DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const formData = new FormData(e.target);
                      const payload = {
                        type: formData.get('type') || 'pedido',
                        client_name: formData.get('client_name') || null,
                        client_contact: formData.get('client_contact') || null,
                        brand: formData.get('brand') || null,
                        model: formData.get('model') || null,
                        body_type: formData.get('body_type') || null,
                        fuel: formData.get('fuel') || null,
                        transmission: formData.get('transmission') || null,
                        price_min: formData.get('price_min')
                          ? Number(formData.get('price_min'))
                          : null,
                        price_max: formData.get('price_max')
                          ? Number(formData.get('price_max'))
                          : null,
                        year_min: formData.get('year_min')
                          ? Number(formData.get('year_min'))
                          : null,
                        year_max: formData.get('year_max')
                          ? Number(formData.get('year_max'))
                          : null,
                        year_exact: formData.get('year_exact')
                          ? Number(formData.get('year_exact'))
                          : null,
                        lead_date: formData.get('lead_date') || null,
                        lead_source: formData.get('lead_source') || null,
                        notes: formData.get('notes') || null,
                      };
                      if (payload.type === 'oferecido') {
                        // oferecido tem ano exato
                        payload.year_min = null;
                        payload.year_max = null;
                      }

                      if (editingDemand) {
                        await updateCustomerDemandOffer(editingDemand.id, payload);
                        toast({ title: 'Registro atualizado.' });
                      } else {
                        await addCustomerDemandOffer(payload);
                        toast({ title: 'Registro criado.' });
                      }
                      setIsDemandModalOpen(false);
                      setEditingDemand(null);
                      fetchAllData({ showLoading: false });
                    }}
                    className="space-y-4 max-h-[70vh] overflow-y-auto"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Tipo</label>
                        <select
                          name="type"
                          defaultValue={editingDemand?.type || 'pedido'}
                          className="w-full border rounded px-2 py-2"
                        >
                          <option value="pedido">Pedido (procura carro)</option>
                          <option value="oferecido">Oferecido (tem o carro)</option>
                        </select>
                      </div>
                      <div></div>
                      <div>
                        <label className="text-sm font-medium">Cliente</label>
                        <input
                          name="client_name"
                          defaultValue={editingDemand?.client_name || ''}
                          className="w-full border rounded px-2 py-2"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Contato</label>
                        <input
                          name="client_contact"
                          defaultValue={editingDemand?.client_contact || ''}
                          className="w-full border rounded px-2 py-2"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Marca</label>
                        <input
                          name="brand"
                          defaultValue={editingDemand?.brand || ''}
                          className="w-full border rounded px-2 py-2"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Modelo</label>
                        <input
                          name="model"
                          defaultValue={editingDemand?.model || ''}
                          className="w-full border rounded px-2 py-2"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Carroceria</label>
                        <select
                          name="body_type"
                          defaultValue={editingDemand?.body_type || ''}
                          className="w-full border rounded px-2 py-2"
                        >
                          <option value="">-</option>
                          <option value="SUV">SUV</option>
                          <option value="Sedan">Sedan</option>
                          <option value="Hatch">Hatch</option>
                          <option value="Picape">Picape</option>
                          <option value="Esportivo">Esportivo</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Combustível</label>
                        <select
                          name="fuel"
                          defaultValue={editingDemand?.fuel || ''}
                          className="w-full border rounded px-2 py-2"
                        >
                          <option value="">-</option>
                          <option value="Flex">Flex</option>
                          <option value="Gasolina">Gasolina</option>
                          <option value="Diesel">Diesel</option>
                          <option value="Elétrico">Elétrico</option>
                          <option value="Híbrido">Híbrido</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Câmbio</label>
                        <select
                          name="transmission"
                          defaultValue={editingDemand?.transmission || ''}
                          className="w-full border rounded px-2 py-2"
                        >
                          <option value="">-</option>
                          <option value="Automático">Automático</option>
                          <option value="Manual">Manual</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Valor mín (R$)</label>
                        <input
                          name="price_min"
                          type="number"
                          defaultValue={editingDemand?.price_min || ''}
                          className="w-full border rounded px-2 py-2"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Valor máx (R$)</label>
                        <input
                          name="price_max"
                          type="number"
                          defaultValue={editingDemand?.price_max || ''}
                          className="w-full border rounded px-2 py-2"
                        />
                      </div>

                      {/* se for pedido: ano min/max. se for oferecido: ano exato. vamos mostrar os 3 e tratar no submit */}
                      <div>
                        <label className="text-sm font-medium">Ano mín</label>
                        <input
                          name="year_min"
                          type="number"
                          defaultValue={editingDemand?.year_min || ''}
                          className="w-full border rounded px-2 py-2"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Ano máx</label>
                        <input
                          name="year_max"
                          type="number"
                          defaultValue={editingDemand?.year_max || ''}
                          className="w-full border rounded px-2 py-2"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Ano exato</label>
                        <input
                          name="year_exact"
                          type="number"
                          defaultValue={editingDemand?.year_exact || ''}
                          className="w-full border rounded px-2 py-2"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Data</label>
                        <input
                          name="lead_date"
                          type="date"
                          defaultValue={
                            editingDemand?.lead_date
                              ? editingDemand.lead_date.slice(0, 10)
                              : new Date().toISOString().slice(0, 10)
                          }
                          className="w-full border rounded px-2 py-2"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium">Origem</label>
                        <input
                          name="lead_source"
                          defaultValue={editingDemand?.lead_source || ''}
                          className="w-full border rounded px-2 py-2"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium">Observações</label>
                        <textarea
                          name="notes"
                          defaultValue={editingDemand?.notes || ''}
                          rows={3}
                          className="w-full border rounded px-2 py-2"
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsDemandModalOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        className="bg-yellow-400 text-black hover:bg-yellow-500"
                      >
                        Salvar
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* RELATÓRIOS */}
          {activeTab === 'reports' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border">
              <Reports />
            </div>
          )}

          {/* GESTÃO DE ACESSOS */}
          {activeTab === 'access' && isAdminLike && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border">
              <AccessControl />
            </div>
          )}
        </motion.div>
      </div>

      {/* EDIT CAR DIALOG */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white text-gray-900">
          <DialogHeader>
            <DialogTitle>Editar Veículo</DialogTitle>
          </DialogHeader>
          {editingCar && (
            <form
              onSubmit={handleUpdateCar}
              className="space-y-4 max-h-[80vh] overflow-y-auto pr-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormFields
                  carData={editingCar}
                  onChange={handleEditingCarInputChange}
                  carOptions={carOptions}
                />
              </div>
              <div className="space-y-2">
                <label className="font-medium text-sm text-gray-700">Fotos</label>
                <div className="flex flex-wrap gap-4 p-2 bg-gray-100 rounded-lg min-h-[112px]">
                  {editingCar.photo_urls &&
                    editingCar.photo_urls.map((url, index) => (
                      <div key={url} className="relative">
                        <img
                          src={url}
                          alt={`Foto ${index + 1}`}
                          className="h-24 w-24 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index, true)}
                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  {photosToUpload.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index}`}
                        className="h-24 w-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className="bg-transparent border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black text-xs px-3 py-1.5 h-auto"
                >
                  Adicionar
                </Button>
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-yellow-400 text-black hover:bg-yellow-500"
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* SALE DIALOG */}
      <Dialog open={saleDialogOpen} onOpenChange={setSaleDialogOpen}>
        <DialogContent className="bg-white text-gray-900">
          <DialogHeader>
            <DialogTitle>Registrar Venda</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Veículo</label>
              <div className="mt-1 text-sm">
                {carToSell
                  ? `${carToSell.brand} ${carToSell.model} (${carToSell.year})`
                  : '-'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Plataforma</label>
              <select
                name="platform_id"
                value={saleForm.platform_id}
                onChange={handleSaleFormChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
              >
                <option value="">-- Selecione --</option>
                {platforms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Preço final (R$)
                </label>
                <input
                  name="sale_price"
                  value={saleForm.sale_price}
                  onChange={handleSaleFormChange}
                  type="number"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Data da venda</label>
                <input
                  name="sale_date"
                  value={saleForm.sale_date}
                  onChange={handleSaleFormChange}
                  type="date"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Notas (opcional)</label>
              <textarea
                name="notes"
                value={saleForm.notes}
                onChange={handleSaleFormChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setSaleDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  try {
                    const payload = {
                      car_id: carToSell.id,
                      platform_id: saleForm.platform_id || null,
                      sale_price: saleForm.sale_price
                        ? parseFloat(saleForm.sale_price)
                        : null,
                      sale_date: saleForm.sale_date || null,
                      notes: saleForm.notes || null,
                    };
                    const res = await markCarAsSold(payload);
                    if (res?.error) {
                      toast({
                        title: 'Erro ao marcar como vendido',
                        description: String(res.error),
                        variant: 'destructive',
                      });
                    } else {
                      toast({ title: 'Veículo marcado como vendido!' });
                      await fetchAllData({ showLoading: false });
                      setSaleDialogOpen(false);
                      setCarToSell(null);
                    }
                  } catch (err) {
                    toast({
                      title: 'Erro ao marcar como vendido',
                      description: String(err),
                      variant: 'destructive',
                    });
                  }
                }}
                className="bg-yellow-400 text-black hover:bg-yellow-500"
                disabled={loading}
              >
                {loading ? 'Registrando...' : 'Confirmar Venda'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;

