// src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Users,
  Image as ImageIcon,
  FileText,
  Check,
  Star,
  BarChart2,
  Shield,
  AlertCircle,
  Search,
  Filter,
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

// ---------- FORM FIELDS (inclui PLACA) ----------
const FormFields = React.memo(({ carData, onChange, carOptions }) => (
  <>
    <input
      name="brand"
      value={carData.brand || ''}
      onChange={onChange}
      placeholder="Marca *"
      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none"
    />
    <input
      name="model"
      value={carData.model || ''}
      onChange={onChange}
      placeholder="Modelo *"
      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none"
    />
    <input
      name="year"
      value={carData.year || ''}
      onChange={onChange}
      placeholder="Ano"
      type="number"
      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none"
    />

    {/* PLACA */}
    <input
      name="plate"
      value={carData.plate || ''}
      onChange={onChange}
      placeholder="Placa (ex: ABC1D23)"
      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none"
    />

    <input
      name="price"
      value={carData.price || ''}
      onChange={onChange}
      placeholder="Preço *"
      type="number"
      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none"
    />
    <input
      name="mileage"
      value={carData.mileage || ''}
      onChange={onChange}
      placeholder="Quilometragem *"
      type="number"
      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none"
    />
    <select
      name="color"
      value={carData.color || ''}
      onChange={onChange}
      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none"
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
      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none"
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
      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none"
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
      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none"
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
        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none"
      />
    </div>
    <div className="relative md:col-span-3">
      <textarea
        name="full_description"
        value={carData.full_description || ''}
        onChange={onChange}
        placeholder="Descrição detalhada..."
        rows={4}
        className="w-full bg-white border border-gray-300 rounded-lg p-3 resize-none text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none"
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

  // MATRIZ -> abrir gestão (mantive)
  const [selectedCar, setSelectedCar] = useState(null);
  const [isGestaoOpen, setIsGestaoOpen] = useState(false);

  // PERMISSÃO
  const [currentUser, setCurrentUser] = useState(null);
  const [isMaster, setIsMaster] = useState(false);

  // PEDIDOS / OFERECIDOS
  const [customerRequests, setCustomerRequests] = useState([]);
  const [requestFilterType, setRequestFilterType] = useState('all'); // all | pedido | oferecido
  const [requestSearch, setRequestSearch] = useState('');
  const [requestOrder, setRequestOrder] = useState('newest'); // newest | oldest | price

  // MATCH POPUP
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [matchResults, setMatchResults] = useState([]);

  const carOptions = {
    transmissions: ['Automático', 'Manual'],
    bodyTypes: ['SUV', 'Sedan', 'Hatch', 'Picape', 'Esportivo', 'Outro'],
    fuels: ['Flex', 'Gasolina', 'Diesel', 'Elétrico', 'Híbrido'],
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

  const fetchCustomerRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('customer_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Erro ao buscar customer_requests:', error);
        setCustomerRequests([]);
      } else {
        setCustomerRequests(data || []);
      }
    } catch (err) {
      console.error('Erro geral ao buscar customer_requests:', err);
      setCustomerRequests([]);
    }
  }, []);

  const fetchAllData = useCallback(
    async (opts = { showLoading: true }) => {
      if (opts.showLoading) setLoading(true);
      try {
        const [carsData, testimonialsData, leadsData, platformsData] =
          await Promise.all([
            getCars(),
            getTestimonials(),
            getLeads(leadFilters),
            getPlatforms(),
          ]);
        setCars(sortCarsActiveFirst(carsData || []));
        setTestimonials(testimonialsData || []);
        setLeads(leadsData || []);
        setPlatforms(platformsData || []);
        await fetchCustomerRequests();
      } catch (err) {
        console.error('Erro fetchAllData:', err);
        setCars([]);
        setTestimonials([]);
        setLeads([]);
        setPlatforms([]);
      } finally {
        if (opts.showLoading) setLoading(false);
      }
    },
    [leadFilters, fetchCustomerRequests]
  );

  // pega usuário e papel
  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        setCurrentUser(auth.user);
        // pega papel
        const { data: roleRows } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', auth.user.id)
          .limit(1)
          .maybeSingle();
        if (roleRows) {
          setIsMaster(roleRows.role_slug === 'admin' || roleRows.is_master === true);
        } else {
          // se não tiver registro de papel, considera master (pra não travar você)
          setIsMaster(true);
        }
      } else {
        setCurrentUser(null);
        setIsMaster(false);
      }
    })();
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

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
    fetchAllData();
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
    fetchAllData();
  };
  const handleDeleteTestimonial = async (id) => {
    await deleteTestimonial(id);
    toast({ title: 'Depoimento removido.' });
    fetchAllData();
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

  // === MATCH LOGIC ===
  const normalize = (s) =>
    String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

  const findMatchesForCar = (car, requests = []) => {
    const nBrand = normalize(car.brand);
    const nModel = normalize(car.model);
    const year = car.year ? Number(car.year) : null;
    const body = normalize(car.body_type);
    const fuel = normalize(car.fuel);
    const transmission = normalize(car.transmission);

    const matches = [];
    for (const req of requests) {
      if (!req) continue;
      // só dá match automático em "pedido"
      if (req.type !== 'pedido') continue;

      let score = 0;

      const reqBrand = normalize(req.brand);
      const reqModel = normalize(req.model);
      const reqBody = normalize(req.body_type);
      const reqFuel = normalize(req.fuel);
      const reqTrans = normalize(req.transmission);

      // marca
      if (reqBrand && reqBrand === nBrand) score += 30;
      else if (!reqBrand) score += 5; // não colocou marca

      // modelo
      if (reqModel && reqModel === nModel) score += 40;
      else if (!reqModel) score += 5;

      // ano
      const reqYearMin = req.year_min ? Number(req.year_min) : null;
      const reqYearMax = req.year_max ? Number(req.year_max) : null;
      const reqYearExact = req.year_exact ? Number(req.year_exact) : null;
      let yearOk = true;
      if (reqYearExact && year) {
        yearOk = year === reqYearExact;
      } else if (year && (reqYearMin || reqYearMax)) {
        if (reqYearMin && year < reqYearMin) yearOk = false;
        if (reqYearMax && year > reqYearMax) yearOk = false;
      }
      if (yearOk) score += 15;

      // carroceria
      if (reqBody && reqBody === body) score += 5;

      // combustível
      if (reqFuel && reqFuel === fuel) score += 5;

      // câmbio
      if (reqTrans && reqTrans === transmission) score += 5;

      if (score >= 40) {
        matches.push({ ...req, match_score: score });
      }
    }
    return matches.sort((a, b) => b.match_score - a.match_score);
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
        price: parseFloat(newCar.price || 0),
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
        // MATCH: checa pedidos
        const matches = findMatchesForCar(addedCar, customerRequests);
        if (matches.length > 0) {
          setMatchResults(matches);
          setMatchModalOpen(true);
        }
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
        price: parseFloat(finalCarData.price || 0),
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

  // --- FILTROS (Admin - VEÍCULOS) — inclui PLACA
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

  // FILTROS PEDIDOS / OFERECIDOS
  const filteredRequests = (customerRequests || [])
    .filter((r) => {
      if (requestFilterType === 'all') return true;
      return r.type === requestFilterType;
    })
    .filter((r) => {
      if (!requestSearch) return true;
      const s = requestSearch.toLowerCase();
      return (
        (r.client_name || '').toLowerCase().includes(s) ||
        (r.brand || '').toLowerCase().includes(s) ||
        (r.model || '').toLowerCase().includes(s) ||
        (r.lead_source || '').toLowerCase().includes(s)
      );
    })
    .sort((a, b) => {
      if (requestOrder === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (requestOrder === 'price') {
        return (b.price_max || 0) - (a.price_max || 0);
      }
      // newest
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

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

          {/* MENU EM ORDEM CERTA */}
          <div className="flex flex-wrap gap-2 mb-8 border-b pb-2">
            <button
              className={`px-4 py-2 font-semibold rounded-t-lg ${
                activeTab === 'leads'
                  ? 'border-b-2 border-yellow-500 text-yellow-500 bg-white'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('leads')}
            >
              <Users className="inline mr-2" /> Leads
            </button>
            <button
              className={`px-4 py-2 font-semibold rounded-t-lg ${
                activeTab === 'cars'
                  ? 'border-b-2 border-yellow-500 text-yellow-500 bg-white'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('cars')}
            >
              <Car className="inline mr-2" /> Veículos
            </button>
            <button
              className={`px-4 py-2 font-semibold rounded-t-lg ${
                activeTab === 'testimonials'
                  ? 'border-b-2 border-yellow-500 text-yellow-500 bg-white'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('testimonials')}
            >
              <MessageSquare className="inline mr-2" /> Depoimentos
            </button>
            <button
              className={`px-4 py-2 font-semibold rounded-t-lg ${
                activeTab === 'gestao'
                  ? 'border-b-2 border-yellow-500 text-yellow-500 bg-white'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('gestao')}
            >
              <FileText className="inline mr-2" /> Gestão
            </button>
            <button
              className={`px-4 py-2 font-semibold rounded-t-lg ${
                activeTab === 'matriz'
                  ? 'border-b-2 border-yellow-500 text-yellow-500 bg-white'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('matriz')}
            >
              <BarChart2 className="inline mr-2" /> Matriz
            </button>
            <button
              className={`px-4 py-2 font-semibold rounded-t-lg ${
                activeTab === 'requests'
                  ? 'border-b-2 border-yellow-500 text-yellow-500 bg-white'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('requests')}
            >
              <AlertCircle className="inline mr-2" /> Pedidos / Oferecidos
            </button>
            <button
              className={`px-4 py-2 font-semibold rounded-t-lg ${
                activeTab === 'reports'
                  ? 'border-b-2 border-yellow-500 text-yellow-500 bg-white'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('reports')}
            >
              <BarChart2 className="inline mr-2" /> Relatórios
            </button>

            {/* aparece só se for master */}
            {isMaster && (
              <button
                className={`px-4 py-2 font-semibold rounded-t-lg ${
                  activeTab === 'access'
                    ? 'border-b-2 border-yellow-500 text-yellow-500 bg-white'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                onClick={() => navigate('/dashboard/acessos')}
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
                      <ImageIcon className="mr-2 h-4 w-4" /> Adicionar Fotos
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
                              <Check className="h-3 w-3" />
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

              {/* NOVO BLOCO: Estoque / Vendidos */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-semibold flex items-center">
                    <Car className="mr-3 text-yellow-500" />
                    Estoque Atual ({estoqueAtualCount})
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Veículos vendidos:{' '}
                    <span className="font-semibold text-red-500">
                      {vendidosCount}
                    </span>
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

              {/* CONTROLES DE FILTRO — inclui PLACA */}
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
                          <Star
                            className={`h-5 w-5 transition-colors ${
                              car.is_featured
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-gray-400 hover:text-yellow-500'
                            }`}
                          />
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
                            <svg
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M3 12h18"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            Marcar como vendido
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                unmarkCarAsSold(car.id, {
                                  deleteAllSales: true,
                                }).then(() => fetchAllData())
                              }
                              title="Reverter venda"
                            >
                              <svg
                                className="h-4 w-4 text-gray-600"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <path
                                  d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h7"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </Button>
                          </div>
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
                  setSelectedCar(car);
                  setIsGestaoOpen(true);
                  setTimeout(() => {
                    toast({
                      title: `Abrindo gestão do veículo ${car.brand} ${car.model}`,
                    });
                  }, 300);
                }}
              />
            </div>
          )}

          {/* PEDIDOS / OFERECIDOS */}
          {activeTab === 'requests' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border">
              <div className="flex flex-wrap gap-3 items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold flex items-center gap-2">
                    <AlertCircle className="text-yellow-500" /> Pedidos / Oferecidos
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {customerRequests.length} registro(s) encontrados
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="h-4 w-4 text-gray-400 absolute left-2 top-2.5" />
                    <input
                      value={requestSearch}
                      onChange={(e) => setRequestSearch(e.target.value)}
                      placeholder="Buscar cliente, modelo, fonte..."
                      className="pl-8 pr-2 py-1.5 border rounded-md text-sm"
                    />
                  </div>
                  <select
                    value={requestFilterType}
                    onChange={(e) => setRequestFilterType(e.target.value)}
                    className="border rounded-md text-sm py-1.5 px-2"
                  >
                    <option value="all">Todos</option>
                    <option value="pedido">Somente pedidos</option>
                    <option value="oferecido">Somente oferecidos</option>
                  </select>
                  <select
                    value={requestOrder}
                    onChange={(e) => setRequestOrder(e.target.value)}
                    className="border rounded-md text-sm py-1.5 px-2"
                  >
                    <option value="newest">Mais recentes</option>
                    <option value="oldest">Mais antigos</option>
                    <option value="price">Maior valor</option>
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      fetchCustomerRequests();
                      toast({ title: 'Atualizado.' });
                    }}
                  >
                    <Filter className="h-4 w-4 mr-1" /> Atualizar
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredRequests.map((req) => (
                  <div
                    key={req.id}
                    className={`rounded-2xl border shadow-sm p-4 bg-white/90 ${
                      req.type === 'pedido'
                        ? 'border-yellow-400/80'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          req.type === 'pedido'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {req.type === 'pedido' ? 'PEDIDO' : 'OFERECIDO'}
                      </span>
                      {req.match_score ? (
                        <span className="text-xs font-semibold text-green-600">
                          MATCH {req.match_score}%
                        </span>
                      ) : null}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {req.client_name || '—'}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">
                      {req.client_contact || '—'}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">Carro: </span>
                      {req.brand || '—'} {req.model || ''}{' '}
                      {req.version ? `(${req.version})` : ''}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">Carroceria: </span>
                      {req.body_type || '—'}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">Combustível: </span>
                      {req.fuel || '—'}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">Câmbio: </span>
                      {req.transmission || '—'}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">Ano: </span>
                      {req.year_exact
                        ? req.year_exact
                        : req.year_min || req.year_max
                        ? `${req.year_min || '...'} → ${req.year_max || '...'}`
                        : '—'}
                    </p>
                    <p className="text-sm mt-2">
                      <span className="font-medium text-gray-700">Valor: </span>
                      {req.price_min || req.price_max
                        ? `R$ ${req.price_min || '...'} → R$ ${req.price_max || '...'}`
                        : '—'}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Fonte: {req.lead_source || '—'} |{' '}
                      {req.created_at
                        ? new Date(req.created_at).toLocaleString('pt-BR')
                        : '—'}
                    </p>
                  </div>
                ))}
              </div>

              {filteredRequests.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-sm">
                  Nenhum pedido / oferecido encontrado.
                </div>
              )}
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
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none"
                  />
                  <input
                    name="car_sold"
                    value={newTestimonial.car_sold}
                    onChange={handleNewTestimonialInputChange}
                    placeholder="Carro (Ex: BMW X5 2021)"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 focus:outline-none"
                  />
                  <textarea
                    name="testimonial_text"
                    value={newTestimonial.testimonial_text}
                    onChange={handleNewTestimonialInputChange}
                    placeholder="Texto do depoimento *"
                    rows={4}
                    className="w-full p-3 bg-white border border-gray-300 rounded-lg"
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

          {/* RELATÓRIOS */}
          {activeTab === 'reports' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border">
              <Reports />
            </div>
          )}
        </motion.div>
      </div>

      {/* EDIT DIALOG (usa FormFields com PLACA) */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white text-gray-900 max-w-4xl">
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
                  <ImageIcon className="mr-2 h-4 w-4" /> Adicionar
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
                      await fetchAllData();
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

      {/* MATCH MODAL */}
      <Dialog open={matchModalOpen} onOpenChange={setMatchModalOpen}>
        <DialogContent className="bg-white text-gray-900 max-w-3xl border-4 border-yellow-400 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600 text-2xl">
              <AlertCircle className="text-yellow-500" /> Encontramos cliente(s) para esse carro!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {matchResults.map((m) => (
              <div
                key={m.id}
                className="border rounded-xl p-3 bg-yellow-50/70 flex justify-between items-center"
              >
                <div>
                  <p className="font-bold text-gray-900">
                    {m.client_name} — {m.client_contact}
                  </p>
                  <p className="text-sm text-gray-600">
                    Procurava: {m.brand} {m.model}{' '}
                    {m.year_exact
                      ? `(${m.year_exact})`
                      : m.year_min || m.year_max
                      ? `(de ${m.year_min || '...'} até ${m.year_max || '...'})`
                      : ''}
                  </p>
                </div>
                <span className="text-sm font-bold text-green-700">
                  {m.match_score}% match
                </span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setMatchModalOpen(false)}
              className="bg-yellow-400 text-black hover:bg-yellow-500"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;

