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
  Users,
  Image as ImageIcon,
  Check,
  ListChecks,
  X,
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
  // pedidos / oferecidos
  getClientRequests,
  addClientRequest,
  updateClientRequest,
  deleteClientRequest,
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

  // carro novo (inclui placa)
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

  // filtros de veículos
  const [carSearch, setCarSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('');

  // matriz / gestão
  const [selectedCar, setSelectedCar] = useState(null);
  const [isGestaoOpen, setIsGestaoOpen] = useState(false);

  // pedidos / oferecidos
  const [clientRequests, setClientRequests] = useState([]);
  const [isReqDialogOpen, setIsReqDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);

  // filtros da lista de pedidos/oferecidos
  const [reqFilterType, setReqFilterType] = useState('all'); // all | pedido | oferecido
  const [reqSearch, setReqSearch] = useState('');
  const [reqSort, setReqSort] = useState('desc'); // desc = mais novos primeiro

  // popup de match
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [matchModalPayload, setMatchModalPayload] = useState(null);

  const carOptions = {
    transmissions: ['Automático', 'Manual'],
    bodyTypes: ['SUV', 'Sedan', 'Hatch', 'Picape', 'Esportivo', 'Outro'],
    fuels: ['Flex', 'Gasolina', 'Diesel', 'Elétrico', 'Híbrido', 'GNV'],
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

  const norm = (v) =>
    String(v || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();

  // regra de match
  const doesRequestMatchCar = (req, car) => {
    if (!req || !car) return false;
    if (car.is_sold) return false;

    if (req.brand && norm(req.brand) !== norm(car.brand)) return false;
    if (req.model) {
      const rm = norm(req.model);
      const cm = norm(car.model);
      if (!(cm === rm || cm.includes(rm) || rm.includes(cm))) return false;
    }

    if (req.body_type && norm(req.body_type) !== norm(car.body_type)) return false;
    if (req.fuel && norm(req.fuel) !== norm(car.fuel)) return false;
    if (req.transmission && norm(req.transmission) !== norm(car.transmission))
      return false;

    const carYear = car.year ? Number(car.year) : null;
    const reqYearExact = req.year_exact ? Number(req.year_exact) : null;
    const reqYearMin = req.year_min ? Number(req.year_min) : null;
    const reqYearMax = req.year_max ? Number(req.year_max) : null;

    if (reqYearExact && carYear && carYear !== reqYearExact) return false;

    if (!reqYearExact) {
      if (reqYearMin && carYear && carYear < reqYearMin) return false;
      if (reqYearMax && carYear && carYear > reqYearMax) return false;
    }

    const carPrice = car.price ? Number(car.price) : null;
    const reqMin = req.price_min ? Number(req.price_min) : null;
    const reqMax = req.price_max ? Number(req.price_max) : null;
    if (reqMin && carPrice && carPrice < reqMin) return false;
    if (reqMax && carPrice && carPrice > reqMax) return false;

    return true;
  };

  const fetchAllData = useCallback(
    async (opts = { showLoading: true }) => {
      if (opts.showLoading) setLoading(true);
      try {
        const [carsData, testimonialsData, leadsData, platformsData, clientReqs] =
          await Promise.all([
            getCars(),
            getTestimonials(),
            getLeads(leadFilters),
            getPlatforms(),
            getClientRequests(),
          ]);
        setCars(sortCarsActiveFirst(carsData || []));
        setTestimonials(testimonialsData || []);
        setLeads(leadsData || []);
        setPlatforms(platformsData || []);
        setClientRequests(clientReqs || []);
      } catch (err) {
        console.error('Erro fetchAllData:', err);
        setCars([]);
        setTestimonials([]);
        setLeads([]);
        setPlatforms([]);
        setClientRequests([]);
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

  // adicionar veículo
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
        const newList = sortCarsActiveFirst([...(cars || []), addedCar]);
        setCars(newList);
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

        // MATCH com pedidos
        const pendingReqs = (clientRequests || []).filter(
          (r) => !r.matched_car_id && r.type === 'pedido'
        );
        const matchedNow = pendingReqs.filter((req) =>
          doesRequestMatchCar(req, addedCar)
        );

        if (matchedNow.length > 0) {
          for (const m of matchedNow) {
            await updateClientRequest(m.id, { matched_car_id: addedCar.id });
          }
          setMatchModalPayload({
            mode: 'car',
            car: addedCar,
            requests: matchedNow,
          });
          setMatchModalOpen(true);
          const ref = await getClientRequests();
          setClientRequests(ref || []);
        }
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

  // venda
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

  // filtros de veículos
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

  // pedidos / oferecidos — modelo em branco
  const blankRequest = {
    type: 'pedido',
    client_name: '',
    client_contact: '',
    brand: '',
    model: '',
    body_type: '',
    fuel: '',
    transmission: '',
    price_min: '',
    price_max: '',
    year_min: '',
    year_max: '',
    year_exact: '',
    lead_date: new Date().toISOString().slice(0, 10),
    lead_source: '',
    notes: '',
  };

  const openNewRequestDialog = () => {
    setEditingRequest({ ...blankRequest });
    setIsReqDialogOpen(true);
  };

  const handleReqChange = (e) => {
    const { name, value } = e.target;
    setEditingRequest((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const saveRequest = async () => {
    if (!editingRequest) return;
    const payload = {
      ...editingRequest,
      price_min: editingRequest.price_min
        ? Number(editingRequest.price_min)
        : null,
      price_max: editingRequest.price_max
        ? Number(editingRequest.price_max)
        : null,
      year_min: editingRequest.year_min ? Number(editingRequest.year_min) : null,
      year_max: editingRequest.year_max ? Number(editingRequest.year_max) : null,
      year_exact: editingRequest.year_exact
        ? Number(editingRequest.year_exact)
        : null,
    };

    if (!editingRequest.id) {
      const { data, error } = await addClientRequest(payload);
      if (error) {
        toast({
          title: 'Erro ao salvar pedido/oferecido',
          description: String(error.message || error),
          variant: 'destructive',
        });
      } else {
        // match imediato
        const stock = cars || [];
        const matchedCar = stock.find((c) => doesRequestMatchCar(data, c));
        if (matchedCar) {
          await updateClientRequest(data.id, { matched_car_id: matchedCar.id });
          setMatchModalPayload({
            mode: 'request',
            request: data,
            car: matchedCar,
          });
          setMatchModalOpen(true);
        }
        const refreshed = await getClientRequests();
        setClientRequests(refreshed || []);
        toast({ title: 'Registro salvo!' });
      }
    } else {
      const { error } = await updateClientRequest(editingRequest.id, payload);
      if (error) {
        toast({
          title: 'Erro ao atualizar pedido/oferecido',
          description: String(error.message || error),
          variant: 'destructive',
        });
      } else {
        const refreshed = await getClientRequests();
        setClientRequests(refreshed || []);
        toast({ title: 'Registro atualizado!' });
      }
    }

    setIsReqDialogOpen(false);
    setEditingRequest(null);
  };

  const deleteRequest = async (id) => {
    await deleteClientRequest(id);
    const refreshed = await getClientRequests();
    setClientRequests(refreshed || []);
    toast({ title: 'Registro removido.' });
  };

  // aplica os filtros da aba de pedidos
  const filteredRequests = useMemo(() => {
    let list = [...(clientRequests || [])];

    if (reqFilterType === 'pedido') {
      list = list.filter((r) => r.type === 'pedido');
    } else if (reqFilterType === 'oferecido') {
      list = list.filter((r) => r.type === 'oferecido');
    }

    const term = norm(reqSearch);
    if (term) {
      list = list.filter((r) => {
        const txt = [
          r.client_name,
          r.client_contact,
          r.brand,
          r.model,
          r.lead_source,
          r.notes,
        ]
          .map((x) => norm(x))
          .join(' ');
        return txt.includes(term);
      });
    }

    list.sort((a, b) => {
      const da = a.lead_date ? new Date(a.lead_date).getTime() : 0;
      const db = b.lead_date ? new Date(b.lead_date).getTime() : 0;
      return reqSort === 'desc' ? db - da : da - db;
    });

    return list;
  }, [clientRequests, reqFilterType, reqSearch, reqSort]);

  // =========== RENDER ===========
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-yellow-500 text-xl animate-pulse">
          Carregando painel...
        </div>
      </div>
    );
  }

  const estoqueAtualCount = (cars || []).filter(
    (c) => c.is_sold !== true && c.is_available !== false
  ).length;
  const vendidosCount = (cars || []).filter((c) => c.is_sold === true).length;

  const pedidosCount = (clientRequests || []).filter(
    (r) => r.type === 'pedido'
  ).length;
  const oferecidosCount = (clientRequests || []).filter(
    (r) => r.type === 'oferecido'
  ).length;
  const matchCount = (clientRequests || []).filter((r) => r.matched_car_id).length;

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

          {/* abas */}
          <div className="flex space-x-4 mb-8 border-b overflow-x-auto">
            <button
              className={`px-4 py-2 font-semibold ${
                activeTab === 'leads'
                  ? 'border-b-2 border-yellow-500 text-yellow-500'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('leads')}
            >
              <Users className="inline mr-2" /> Leads
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
                activeTab === 'reports'
                  ? 'border-b-2 border-yellow-500 text-yellow-500'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('reports')}
            >
              <BarChart2 className="inline mr-2" /> Relatórios
            </button>
            <button
              className={`px-4 py-2 font-semibold ${
                activeTab === 'requests'
                  ? 'border-b-2 border-yellow-500 text-yellow-500'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('requests')}
            >
              <ListChecks className="inline mr-2" /> Pedidos / Oferecidos
            </button>
          </div>

          {/* LEADS */}
          {activeTab === 'leads' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <div className="text-lg font-bold">
                  Exibindo <span className="text-yellow-500">{leads.length}</span>{' '}
                  lead(s)
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

              {/* estoque */}
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

              {/* filtros veículos */}
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
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-5 w-5 transition-colors ${
                              car.is_featured
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-gray-400 hover:text-yellow-500'
                            }`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
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
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
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

          {/* PEDIDOS / OFERECIDOS */}
          {activeTab === 'requests' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <ListChecks className="text-yellow-500" />
                    Pedidos / Oferecidos
                  </h2>
                  <p className="text-sm text-gray-500">
                    Registre quem pediu carro e quem ofereceu carro. Match é automático.
                  </p>
                </div>
                <Button
                  onClick={openNewRequestDialog}
                  className="bg-yellow-400 text-black hover:bg-yellow-500"
                >
                  + Novo
                </Button>
              </div>

              {/* cards de total */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="border rounded-xl p-4 bg-white">
                  <p className="text-xs text-gray-500">TOTAL</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {clientRequests.length}
                  </p>
                </div>
                <div className="border rounded-xl p-4 bg-white">
                  <p className="text-xs text-gray-500">PEDIDOS</p>
                  <p className="text-2xl font-bold text-gray-900">{pedidosCount}</p>
                </div>
                <div className="border rounded-xl p-4 bg-white">
                  <p className="text-xs text-gray-500">OFERECIDOS</p>
                  <p className="text-2xl font-bold text-gray-900">{oferecidosCount}</p>
                </div>
                <div className="border rounded-xl p-4 bg-white">
                  <p className="text-xs text-gray-500">COM MATCH</p>
                  <p className="text-2xl font-bold text-green-600">{matchCount}</p>
                </div>
              </div>

              {/* filtros da lista */}
              <div className="flex flex-col lg:flex-row gap-3 mb-4 items-center lg:items-end justify-between">
                <div className="flex gap-2 w-full lg:w-auto">
                  <select
                    value={reqFilterType}
                    onChange={(e) => setReqFilterType(e.target.value)}
                    className="border rounded px-3 py-2 text-sm"
                  >
                    <option value="all">Todos</option>
                    <option value="pedido">Só pedidos</option>
                    <option value="oferecido">Só oferecidos</option>
                  </select>
                  <button
                    onClick={() =>
                      setReqSort((prev) => (prev === 'desc' ? 'asc' : 'desc'))
                    }
                    className="border rounded px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100"
                  >
                    {reqSort === 'desc' ? 'Mais recentes' : 'Mais antigos'}
                  </button>
                </div>
                <input
                  value={reqSearch}
                  onChange={(e) => setReqSearch(e.target.value)}
                  placeholder="Buscar por nome, contato, modelo, origem..."
                  className="w-full lg:w-1/2 border rounded px-3 py-2 text-sm"
                />
              </div>

              <div className="overflow-x-auto rounded-xl border bg-white">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">
                        Tipo
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">
                        Cliente
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">
                        Contato
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">
                        Marca/Modelo
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">
                        Faixa Valor
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">
                        Data
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">
                        Origem
                      </th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-700">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRequests.map((req) => (
                      <tr
                        key={req.id}
                        className={
                          req.matched_car_id ? 'bg-green-50/70 animate-pulse' : ''
                        }
                      >
                        <td className="px-4 py-2">
                          <select
                            value={req.type || 'pedido'}
                            onChange={async (e) => {
                              await updateClientRequest(req.id, { type: e.target.value });
                              const refreshed = await getClientRequests();
                              setClientRequests(refreshed || []);
                            }}
                            className={`text-xs rounded-full px-3 py-1 border ${
                              req.type === 'pedido'
                                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            <option value="pedido">Pedido (procura carro)</option>
                            <option value="oferecido">Oferecido (tem carro)</option>
                          </select>
                        </td>
                        <td className="px-4 py-2">{req.client_name || '-'}</td>
                        <td className="px-4 py-2">{req.client_contact || '-'}</td>
                        <td className="px-4 py-2">
                          {req.brand || req.model
                            ? `${req.brand || ''} ${req.model || ''}`
                            : '-'}
                        </td>
                        <td className="px-4 py-2">
                          {req.price_min || req.price_max
                            ? `R$ ${req.price_min || 0} — R$ ${req.price_max || '∞'}`
                            : '-'}
                        </td>
                        <td className="px-4 py-2">
                          {req.lead_date
                            ? new Date(req.lead_date).toISOString().slice(0, 10)
                            : '-'}
                        </td>
                        <td className="px-4 py-2">{req.lead_source || '-'}</td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingRequest(req);
                                setIsReqDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteRequest(req.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredRequests.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-6 text-center text-gray-400 text-sm"
                        >
                          Nenhum pedido ou carro oferecido encontrado com esse filtro.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
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

      {/* DIALOG de pedido/oferecido */}
      <Dialog open={isReqDialogOpen} onOpenChange={setIsReqDialogOpen}>
        <DialogContent className="max-w-3xl bg-white text-gray-900">
          <DialogHeader>
            <DialogTitle>Novo pedido / oferecido</DialogTitle>
          </DialogHeader>
          {editingRequest && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select
                  name="type"
                  value={editingRequest.type || 'pedido'}
                  onChange={handleReqChange}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="pedido">Pedido (procura carro)</option>
                  <option value="oferecido">Oferecido (tem carro)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contato</label>
                <input
                  name="client_contact"
                  value={editingRequest.client_contact || ''}
                  onChange={handleReqChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cliente</label>
                <input
                  name="client_name"
                  value={editingRequest.client_name || ''}
                  onChange={handleReqChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div />
              <div>
                <label className="block text-sm font-medium mb-1">Marca</label>
                <input
                  name="brand"
                  value={editingRequest.brand || ''}
                  onChange={handleReqChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Modelo</label>
                <input
                  name="model"
                  value={editingRequest.model || ''}
                  onChange={handleReqChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Carroceria</label>
                <select
                  name="body_type"
                  value={editingRequest.body_type || ''}
                  onChange={handleReqChange}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">—</option>
                  <option value="SUV">SUV</option>
                  <option value="Sedan">Sedan</option>
                  <option value="Hatch">Hatch</option>
                  <option value="Picape">Picape</option>
                  <option value="Esportivo">Esportivo</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Combustível</label>
                <select
                  name="fuel"
                  value={editingRequest.fuel || ''}
                  onChange={handleReqChange}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">—</option>
                  <option value="Flex">Flex</option>
                  <option value="Gasolina">Gasolina</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Elétrico">Elétrico</option>
                  <option value="Híbrido">Híbrido</option>
                  <option value="GNV">GNV</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Câmbio</label>
                <select
                  name="transmission"
                  value={editingRequest.transmission || ''}
                  onChange={handleReqChange}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">—</option>
                  <option value="Automático">Automático</option>
                  <option value="Manual">Manual</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Valor mín (R$)</label>
                <input
                  name="price_min"
                  value={editingRequest.price_min || ''}
                  onChange={handleReqChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Valor máx (R$)</label>
                <input
                  name="price_max"
                  value={editingRequest.price_max || ''}
                  onChange={handleReqChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              {editingRequest.type === 'oferecido' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Ano exato</label>
                    <input
                      name="year_exact"
                      value={editingRequest.year_exact || ''}
                      onChange={handleReqChange}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div />
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Ano mín</label>
                    <input
                      name="year_min"
                      value={editingRequest.year_min || ''}
                      onChange={handleReqChange}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Ano máx</label>
                    <input
                      name="year_max"
                      value={editingRequest.year_max || ''}
                      onChange={handleReqChange}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Data</label>
                <input
                  type="date"
                  name="lead_date"
                  value={editingRequest.lead_date || ''}
                  onChange={handleReqChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Origem</label>
                <input
                  name="lead_source"
                  value={editingRequest.lead_source || ''}
                  onChange={handleReqChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Observações</label>
                <textarea
                  name="notes"
                  value={editingRequest.notes || ''}
                  onChange={handleReqChange}
                  className="w-full border rounded px-3 py-2 h-20"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsReqDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-yellow-400 text-black hover:bg-yellow-500"
              onClick={saveRequest}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* POPUP DE MATCH */}
      {matchModalOpen && matchModalPayload && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-[95%] overflow-hidden border-4 border-yellow-400 animate-pulse">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 py-4 px-6 flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-black flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500 animate-ping"></span>
                ⚡ MATCH ENCONTRADO!
              </h3>
              <button
                onClick={() => {
                  setMatchModalOpen(false);
                  setMatchModalPayload(null);
                }}
                className="text-black/60 hover:text-black"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 bg-white">
              {matchModalPayload.mode === 'request' && (
                <>
                  <p className="text-gray-700">
                    O pedido de <b>{matchModalPayload.request.client_name}</b> bateu
                    com um carro que já está no estoque.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4 border">
                      <p className="text-xs text-gray-500 mb-1">Cliente</p>
                      <p className="font-bold text-gray-900">
                        {matchModalPayload.request.client_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {matchModalPayload.request.client_contact || '-'}
                      </p>
                      <p className="text-sm mt-2 text-gray-600">
                        Procurando: {matchModalPayload.request.brand}{' '}
                        {matchModalPayload.request.model}
                      </p>
                    </div>
                    <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                      <p className="text-xs text-gray-600 mb-1">Carro compatível</p>
                      <p className="font-bold text-gray-900">
                        {matchModalPayload.car.brand} {matchModalPayload.car.model}{' '}
                        ({matchModalPayload.car.year})
                      </p>
                      <p className="text-sm text-gray-700">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(matchModalPayload.car.price || 0)}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {matchModalPayload.mode === 'car' && (
                <>
                  <p className="text-gray-700">
                    O veículo <b>{matchModalPayload.car.brand}</b>{' '}
                    <b>{matchModalPayload.car.model}</b> que você acabou de cadastrar
                    bateu com <b>{matchModalPayload.requests.length}</b>{' '}
                    {matchModalPayload.requests.length === 1 ? 'pedido' : 'pedidos'} de
                    cliente.
                  </p>
                  <div className="bg-gray-50 rounded-xl p-4 border space-y-2 max-h-52 overflow-y-auto">
                    {matchModalPayload.requests.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between gap-4 border-b last:border-b-0 py-1"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">
                            {r.client_name || 'Sem nome'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {r.client_contact || '-'}
                          </p>
                        </div>
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                          Pedido
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="flex justify-end">
                <Button
                  className="bg-yellow-400 text-black hover:bg-yellow-500"
                  onClick={() => {
                    setMatchModalOpen(false);
                    setMatchModalPayload(null);
                    setActiveTab('requests');
                  }}
                >
                  Ver na aba de Pedidos
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

