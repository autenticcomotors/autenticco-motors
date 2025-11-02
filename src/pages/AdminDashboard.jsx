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
  Users,
  Image as ImageIcon,
  FileText,
  BarChart2,
  Shield,
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
  getPublicationsForCars,
  getExpensesForCars,
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
import AccessControl from '@/pages/AccessControl'; // vamos navegar pra ele
// ======================================================
// FORM FIELDS (inclui PLACA)
// ======================================================
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
  // abas
  const [activeTab, setActiveTab] = useState('leads');

  // dados base
  const [cars, setCars] = useState([]);
  const [leads, setLeads] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [platforms, setPlatforms] = useState([]);

  // pedidos / oferecidos
  const [requestsOffers, setRequestsOffers] = useState([]);
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);
  const [editingReq, setEditingReq] = useState(null);
  const [reqFilterType, setReqFilterType] = useState('all');
  const [reqSearch, setReqSearch] = useState('');

  // match popup
  const [matchModal, setMatchModal] = useState({
    open: false,
    matches: [],
    car: null,
  });

  // usuário atual / permissões
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserPerms, setCurrentUserPerms] = useState({
    roles: [],
    permissions: [],
  });

  const [loading, setLoading] = useState(true);
  const [leadFilters, setLeadFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
  });
  const [leadToDelete, setLeadToDelete] = useState(null);

  // carro novo / edição
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
  const fileInputRef = useRef(null);

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

  // filtros de carros
  const [carSearch, setCarSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('');

  // para overview / gestão direta
  const [selectedCar, setSelectedCar] = useState(null);
  const [isGestaoOpen, setIsGestaoOpen] = useState(false);

  const navigate = useNavigate();

  // opções fixas
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

  // ============================================================
  // CARREGA USUÁRIO E PERMISSÕES
  // ============================================================
  useEffect(() => {
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser(user);
          const { data: permData } = await supabase
            .from('vw_app_user_permissions')
            .select('*')
            .eq('user_id', user.id);
          const row = Array.isArray(permData) ? permData[0] : permData;
          if (row) {
            setCurrentUserPerms({
              roles: row.roles || [],
              permissions: row.permissions || [],
            });
          }
        }
      } catch (err) {
        console.error('Erro carregando usuário/permissões:', err);
      }
    })();
  }, []);

  const canSeeAccessTab =
    (currentUserPerms.permissions || []).includes('admin:full') ||
    (currentUserPerms.roles || []).includes('super_admin');

  // ============================================================
  // FETCH PRINCIPAL
  // ============================================================
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
        const [
          carsData,
          testimonialsData,
          leadsData,
          platformsData,
          reqOffData,
        ] = await Promise.all([
          getCars(),
          getTestimonials(),
          getLeads(leadFilters),
          getPlatforms(),
          supabase
            .from('client_requests_offers')
            .select('*')
            .order('created_at', { ascending: false }),
        ]);

        setCars(sortCarsActiveFirst(carsData || []));
        setTestimonials(testimonialsData || []);
        setLeads(leadsData || []);
        setPlatforms(platformsData || []);
        setRequestsOffers(reqOffData.data || []);
      } catch (err) {
        console.error('Erro fetchAllData:', err);
        setCars([]);
        setTestimonials([]);
        setLeads([]);
        setPlatforms([]);
        setRequestsOffers([]);
      } finally {
        if (opts.showLoading) setLoading(false);
      }
    },
    [leadFilters]
  );

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // ============================================================
  // LEADS
  // ============================================================
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

  // ============================================================
  // LOGOUT
  // ============================================================
  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('autenticco_admin_login_at');
    navigate('/admin');
  };

  // ============================================================
  // INPUTS GENÉRICOS
  // ============================================================
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

  // ============================================================
  // TESTIMONIALS
  // ============================================================
  const [newTestimonial, setNewTestimonial] = useState({
    client_name: '',
    testimonial_text: '',
    car_sold: '',
  });
  const handleNewTestimonialInputChange = useCallback(
    (e) => handleInputChange(e, setNewTestimonial),
    []
  );

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

  // ============================================================
  // FOTOS
  // ============================================================
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

  // ============================================================
  // MATCH DE PEDIDOS/OFERECIDOS AO CADASTRAR CARRO
  // ============================================================
  const checkMatchForNewCar = async (car) => {
    try {
      // pega todos os pedidos/oferecidos
      const { data: reqs } = await supabase
        .from('client_requests_offers')
        .select('*');

      if (!reqs || reqs.length === 0) return;

      // regra bem simples de match
      const matches = reqs
        .map((r) => {
          let score = 0;

          if (
            r.brand &&
            car.brand &&
            r.brand.trim().toLowerCase() === car.brand.trim().toLowerCase()
          ) {
            score += 30;
          }
          if (
            r.model &&
            car.model &&
            r.model.trim().toLowerCase() === car.model.trim().toLowerCase()
          ) {
            score += 30;
          }
          if (r.body_type && car.body_type && r.body_type === car.body_type) {
            score += 15;
          }
          if (r.fuel && car.fuel && r.fuel === car.fuel) {
            score += 10;
          }
          if (r.transmission && car.transmission && r.transmission === car.transmission) {
            score += 10;
          }
          // ano
          if (r.type === 'pedido') {
            // pedido → tem faixa
            const ano = Number(car.year);
            const min = r.year_min ? Number(r.year_min) : null;
            const max = r.year_max ? Number(r.year_max) : null;
            if (ano) {
              if ((min && ano < min) || (max && ano > max)) {
                // fora da faixa
              } else {
                score += 10;
              }
            }
          } else if (r.type === 'oferecido') {
            // oferecido → ano exato
            if (r.year_exact && car.year && Number(r.year_exact) === Number(car.year)) {
              score += 10;
            }
          }

          return { ...r, score };
        })
        .filter((m) => m.score >= 50)
        .sort((a, b) => b.score - a.score);

      if (matches.length > 0) {
        setMatchModal({
          open: true,
          matches,
          car,
        });
      }
    } catch (err) {
      console.error('Erro checkMatchForNewCar:', err);
    }
  };

  // ============================================================
  // ADD CAR
  // ============================================================
  const handleAddCar = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // upload fotos
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
        // atualiza lista
        setCars((prevCars) =>
          sortCarsActiveFirst([...(prevCars || []), addedCar])
        );
        // limpa form
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

        // checar MATCH
        await checkMatchForNewCar(addedCar);
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

  // ============================================================
  // EDIT CAR
  // ============================================================
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

  // ============================================================
  // DELETE CAR
  // ============================================================
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

  // ============================================================
  // MARCAR COMO VENDIDO
  // ============================================================
  const openSaleDialog = (car) => {
    setCarToSell(car);
    setSaleForm({
      platform_id:
        car.sold_platform_id || (platforms[0] && platforms[0].id) || '',
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

  // ============================================================
  // FILTROS (carros)
  // ============================================================
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

  // ============================================================
  // PEDIDOS / OFERECIDOS - FUNÇÕES
  // ============================================================
  const openNewRequest = () => {
    setEditingReq({
      type: 'pedido',
      client_name: '',
      client_contact: '',
      brand: '',
      model: '',
      version: '',
      transmission: '',
      body_type: '',
      fuel: '',
      year_min: '',
      year_max: '',
      year_exact: '',
      price_min: '',
      price_max: '',
      lead_date: new Date().toISOString().slice(0, 10),
      lead_source: '',
      notes: '',
    });
    setIsReqModalOpen(true);
  };

  const saveRequestOffer = async () => {
    if (!editingReq) return;
    try {
      const payload = {
        ...editingReq,
      };
      // normaliza
      if (payload.type === 'oferecido') {
        // ano exato
        payload.year_min = null;
        payload.year_max = null;
      }
      if (payload.type === 'pedido') {
        payload.year_exact = null;
      }

      if (editingReq.id) {
        const { error } = await supabase
          .from('client_requests_offers')
          .update(payload)
          .eq('id', editingReq.id);
        if (error) {
          toast({
            title: 'Erro ao atualizar registro',
            description: error.message,
            variant: 'destructive',
          });
          return;
        }
        toast({ title: 'Registro atualizado!' });
      } else {
        const { error } = await supabase
          .from('client_requests_offers')
          .insert([payload]);
        if (error) {
          toast({
            title: 'Erro ao salvar registro',
            description: error.message,
            variant: 'destructive',
          });
          return;
        }
        toast({ title: 'Registro criado!' });
      }
      setIsReqModalOpen(false);
      setEditingReq(null);
      fetchAllData({ showLoading: false });
    } catch (err) {
      toast({
        title: 'Erro ao salvar',
        description: String(err),
        variant: 'destructive',
      });
    }
  };

  const deleteRequestOffer = async (id) => {
    try {
      const { error } = await supabase
        .from('client_requests_offers')
        .delete()
        .eq('id', id);
      if (error) {
        toast({
          title: 'Erro ao excluir',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }
      toast({ title: 'Excluído!' });
      fetchAllData({ showLoading: false });
    } catch (err) {
      toast({
        title: 'Erro ao excluir',
        description: String(err),
        variant: 'destructive',
      });
    }
  };

  const filteredRequestsOffers = useMemo(() => {
    let list = requestsOffers || [];
    if (reqFilterType !== 'all') {
      list = list.filter((r) => r.type === reqFilterType);
    }
    if (reqSearch.trim() !== '') {
      const term = reqSearch.trim().toLowerCase();
      list = list.filter((r) => {
        return (
          (r.client_name || '').toLowerCase().includes(term) ||
          (r.brand || '').toLowerCase().includes(term) ||
          (r.model || '').toLowerCase().includes(term) ||
          (r.client_contact || '').toLowerCase().includes(term)
        );
      });
    }
    return list;
  }, [requestsOffers, reqFilterType, reqSearch]);

  // ============================================================
  // RENDER
  // ============================================================
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

  return (
    <div className="relative isolate min-h-screen bg-gray-50 text-gray-800 pt-28">
      <Helmet>
        <title>Dashboard - AutenTicco Motors</title>
      </Helmet>
      <BackgroundShape />

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-12 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* TOPO */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Painel de <span className="text-yellow-500">Controle</span>
              </h1>
              {currentUser && (
                <p className="text-xs text-gray-500 mt-1">
                  Logado como {currentUser.email}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              {canSeeAccessTab && (
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard/acessos')}
                  className="flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" /> Acessos
                </Button>
              )}
              <Button onClick={handleLogout} variant="destructive">
                <LogOut className="mr-2 h-4 w-4" /> Sair
              </Button>
            </div>
          </div>

          {/* ABAS */}
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
                activeTab === 'pedidos'
                  ? 'border-b-2 border-yellow-500 text-yellow-500'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('pedidos')}
            >
              <MessageSquare className="inline mr-2" /> Pedidos / Oferecidos
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
          </div>

          {/* LEADS */}
          {activeTab === 'leads' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <div className="text-lg font-bold">
                  Exibindo{' '}
                  <span className="text-yellow-500">{leads.length}</span>{' '}
                  lead(s)
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <div className="flex gap-2 items-center">
                    <label
                      htmlFor="startDate"
                      className="text-sm font-medium"
                    >
                      De:
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={leadFilters.startDate}
                      onChange={(e) =>
                        setLeadFilters((f) => ({
                          ...f,
                          startDate: e.target.value,
                        }))
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
                        setLeadFilters((f) => ({
                          ...f,
                          endDate: e.target.value,
                        }))
                      }
                      className="bg-white border-gray-300 rounded-md p-2 h-10 text-sm"
                    />
                  </div>
                  <select
                    value={leadFilters.status}
                    onChange={(e) =>
                      setLeadFilters((f) => ({
                        ...f,
                        status: e.target.value,
                      }))
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
                        <p className="text-gray-600 truncate">
                          {lead.client_contact}
                        </p>
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
                          onChange={(e) =>
                            handleStatusChange(lead.id, e.target.value)
                          }
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
                          onOpenChange={(isOpen) =>
                            !isOpen && setLeadToDelete(null)
                          }
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
                              <AlertDialogTitle>
                                Tem certeza?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação removerá o lead permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                Cancelar
                              </AlertDialogCancel>
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
                  <PlusCircle className="mr-3 text-yellow-500" /> Adicionar
                  Novo Veículo
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
                      onClick={() =>
                        fileInputRef.current && fileInputRef.current.click()
                      }
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
                              mainPhotoIndex === index
                                ? 'ring-2 ring-yellow-500'
                                : ''
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

              {/* CONTROLES DE FILTRO */}
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
                    setBrandFilter(
                      e.target.value === 'ALL' ? '' : e.target.value
                    )
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
                            Placa:{' '}
                            <span className="font-medium">
                              {car.plate || '-'}
                            </span>
                          </p>

                          {car.is_available === false && (
                            <p className="text-sm text-red-600 mt-1">
                              {(() => {
                                const raw = car.sold_at;
                                if (!raw) {
                                  return 'Vendido -';
                                }
                                const clean = String(raw)
                                  .replace('T', ' ')
                                  .trim();
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
                          onClick={() =>
                            updateCar(car.id, {
                              is_featured: !car.is_featured,
                            }).then(() => fetchAllData({ showLoading: false }))
                          }
                          title={
                            car.is_featured
                              ? 'Remover dos destaques'
                              : 'Adicionar aos destaques'
                          }
                        >
                          <svg
                            className={`h-5 w-5 transition-colors ${
                              car.is_featured
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-gray-400 hover:text-yellow-500'
                            }`}
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.402c.499.036.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.5a.562.562 0 01-.84-.61l1.285-5.386a.563.563 0 00-.182-.557L3.04 10.345a.563.563 0 01.321-.988l5.518-.402a.563.563 0 00.475-.345l2.125-5.111z"
                            />
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
                              <AlertDialogTitle>
                                Tem certeza?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação removerá o veículo.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                Cancelar
                              </AlertDialogCancel>
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

          {/* RELATÓRIOS */}
          {activeTab === 'reports' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border">
              <Reports />
            </div>
          )}

          {/* PEDIDOS / OFERECIDOS */}
          {activeTab === 'pedidos' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-semibold flex items-center gap-2">
                    <MessageSquare className="text-yellow-500" />
                    Pedidos / Oferecidos
                  </h2>
                  <p className="text-xs text-gray-500">
                    Clientes que pediram carro e pessoas que ofereceram carro.
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={reqSearch}
                      onChange={(e) => setReqSearch(e.target.value)}
                      placeholder="Buscar por cliente, modelo..."
                      className="pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm"
                    />
                  </div>
                  <select
                    value={reqFilterType}
                    onChange={(e) => setReqFilterType(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">Todos</option>
                    <option value="pedido">Pedidos</option>
                    <option value="oferecido">Oferecidos</option>
                  </select>
                  <Button onClick={openNewRequest}>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Novo
                  </Button>
                </div>
              </div>

              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-2">
                {filteredRequestsOffers.map((r) => (
                  <div
                    key={r.id}
                    className="border rounded-xl p-4 flex items-center justify-between gap-4 bg-white"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        {r.client_name || 'Sem nome'}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] uppercase ${
                            r.type === 'pedido'
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-green-50 text-green-600'
                          }`}
                        >
                          {r.type}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">
                        {r.client_contact || '-'}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {r.brand} {r.model}{' '}
                        {r.version ? `- ${r.version}` : ''}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1 flex gap-2 flex-wrap">
                        {r.body_type && <span>Carroceria: {r.body_type}</span>}
                        {r.fuel && <span>Combustível: {r.fuel}</span>}
                        {r.transmission && <span>Câmbio: {r.transmission}</span>}
                        {r.type === 'pedido' && (r.year_min || r.year_max) && (
                          <span>
                            Ano: {r.year_min || '-'} até {r.year_max || '-'}
                          </span>
                        )}
                        {r.type === 'oferecido' && r.year_exact && (
                          <span>Ano: {r.year_exact}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditingReq(r);
                          setIsReqModalOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4 text-blue-500" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteRequestOffer(r.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}

                {filteredRequestsOffers.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-10">
                    Nenhum registro ainda.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* DEPOIMENTOS */}
          {activeTab === 'testimonials' && (
            <>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 mb-12 shadow-xl border">
                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                  <PlusCircle className="mr-3 text-yellow-500" /> Adicionar Novo
                  Depoimento
                </h2>
                <form
                  onSubmit={handleAddTestimonial}
                  className="space-y-6"
                >
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
                  <MessageSquare className="mr-3 text-yellow-500" /> Depoimentos
                  Cadastrados ({testimonials.length})
                </h2>
                <div className="space-y-4">
                  {testimonials.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      className="bg-white rounded-2xl p-4 flex items-center justify-between shadow border"
                    >
                      <div>
                        <p className="italic text-gray-600">
                          "{item.testimonial_text}"
                        </p>
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
        </motion.div>
      </div>

      {/* EDIT DIALOG */}
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
                <label className="font-medium text-sm text-gray-700">
                  Fotos
                </label>
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
                  onClick={() =>
                    fileInputRef.current && fileInputRef.current.click()
                  }
                  className="bg-transparent border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black text-xs px-3 py-1.5 h-auto"
                >
                  <ImageIcon className="mr-2 h-4 w-4" /> Adicionar
                </Button>
              </div>
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsEditDialogOpen(false)}
                >
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
          <form
            onSubmit={(e) => e.preventDefault()}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Veículo
              </label>
              <div className="mt-1 text-sm">
                {carToSell
                  ? `${carToSell.brand} ${carToSell.model} (${carToSell.year})`
                  : '-'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Plataforma
              </label>
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
                <label className="block text-sm font-medium text-gray-700">
                  Data da venda
                </label>
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
              <label className="block text-sm font-medium text-gray-700">
                Notas (opcional)
              </label>
              <textarea
                name="notes"
                value={saleForm.notes}
                onChange={handleSaleFormChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSaleDialogOpen(false)}
              >
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

      {/* MODAL PEDIDOS/OFER - FORM */}
      <Dialog open={isReqModalOpen} onOpenChange={setIsReqModalOpen}>
        <DialogContent className="bg-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingReq?.id ? 'Editar registro' : 'Novo pedido / oferecido'}
            </DialogTitle>
          </DialogHeader>
          {editingReq && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Tipo</label>
                <select
                  value={editingReq.type}
                  onChange={(e) =>
                    setEditingReq((prev) => ({ ...prev, type: e.target.value }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="pedido">Pedido (cliente quer comprar)</option>
                  <option value="oferecido">Oferecido (cliente tem carro)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Data do lead</label>
                <input
                  type="date"
                  value={editingReq.lead_date || ''}
                  onChange={(e) =>
                    setEditingReq((prev) => ({
                      ...prev,
                      lead_date: e.target.value,
                    }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Cliente</label>
                <input
                  value={editingReq.client_name || ''}
                  onChange={(e) =>
                    setEditingReq((prev) => ({
                      ...prev,
                      client_name: e.target.value,
                    }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Nome"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Contato</label>
                <input
                  value={editingReq.client_contact || ''}
                  onChange={(e) =>
                    setEditingReq((prev) => ({
                      ...prev,
                      client_contact: e.target.value,
                    }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="WhatsApp / Tel"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Marca</label>
                <input
                  value={editingReq.brand || ''}
                  onChange={(e) =>
                    setEditingReq((prev) => ({
                      ...prev,
                      brand: e.target.value,
                    }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Modelo</label>
                <input
                  value={editingReq.model || ''}
                  onChange={(e) =>
                    setEditingReq((prev) => ({
                      ...prev,
                      model: e.target.value,
                    }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Versão</label>
                <input
                  value={editingReq.version || ''}
                  onChange={(e) =>
                    setEditingReq((prev) => ({
                      ...prev,
                      version: e.target.value,
                    }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Carroceria</label>
                <input
                  value={editingReq.body_type || ''}
                  onChange={(e) =>
                    setEditingReq((prev) => ({
                      ...prev,
                      body_type: e.target.value,
                    }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="SUV, Sedan..."
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Combustível</label>
                <input
                  value={editingReq.fuel || ''}
                  onChange={(e) =>
                    setEditingReq((prev) => ({
                      ...prev,
                      fuel: e.target.value,
                    }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Flex, Gasolina..."
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Câmbio</label>
                <input
                  value={editingReq.transmission || ''}
                  onChange={(e) =>
                    setEditingReq((prev) => ({
                      ...prev,
                      transmission: e.target.value,
                    }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Automático, Manual"
                />
              </div>

              {/* ano pedido */}
              {editingReq.type === 'pedido' && (
                <>
                  <div>
                    <label className="text-xs text-gray-500">
                      Ano mínimo
                    </label>
                    <input
                      type="number"
                      value={editingReq.year_min || ''}
                      onChange={(e) =>
                        setEditingReq((prev) => ({
                          ...prev,
                          year_min: e.target.value,
                        }))
                      }
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">
                      Ano máximo
                    </label>
                    <input
                      type="number"
                      value={editingReq.year_max || ''}
                      onChange={(e) =>
                        setEditingReq((prev) => ({
                          ...prev,
                          year_max: e.target.value,
                        }))
                      }
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </>
              )}

              {/* ano oferecido */}
              {editingReq.type === 'oferecido' && (
                <div>
                  <label className="text-xs text-gray-500">
                    Ano do carro
                  </label>
                  <input
                    type="number"
                    value={editingReq.year_exact || ''}
                    onChange={(e) =>
                      setEditingReq((prev) => ({
                        ...prev,
                        year_exact: e.target.value,
                      }))
                    }
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="text-xs text-gray-500">Observações</label>
                <textarea
                  value={editingReq.notes || ''}
                  onChange={(e) =>
                    setEditingReq((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setIsReqModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={saveRequestOffer}
              className="bg-yellow-400 text-black hover:bg-yellow-500"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: MATCH DESTACADO */}
      {matchModal.open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-6 border-4 border-yellow-400 animate-pulse">
            <h2 className="text-2xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              🎉 MATCH ENCONTRADO!
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              O veículo <strong>{matchModal.car?.brand} {matchModal.car?.model}</strong> bateu com os seguintes pedidos/ofertas:
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {matchModal.matches.map((m) => (
                <div
                  key={m.id}
                  className="border rounded-lg p-3 bg-yellow-50 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold">{m.client_name}</p>
                    <p className="text-xs text-gray-600">{m.client_contact}</p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {m.type} — {m.brand} {m.model}
                    </p>
                  </div>
                  <span className="text-xs bg-yellow-400 text-black px-3 py-1 rounded-full font-bold">
                    {m.score}%
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-5 text-right">
              <Button
                onClick={() =>
                  setMatchModal({ open: false, matches: [], car: null })
                }
                className="bg-yellow-400 text-black hover:bg-yellow-500"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

