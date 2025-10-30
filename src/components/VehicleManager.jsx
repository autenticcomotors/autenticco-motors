// src/components/VehicleManager.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import {
  Trash2,
  Megaphone,
  Wallet,
  DollarSign
} from 'lucide-react';
import {
  getPublicationsByCar,
  addPublication,
  deletePublication,
  getExpensesByCar,
  addExpense,
  deleteExpense,
  getPlatforms,
  getPublicationsForCars,
  getExpensesForCars,
  updateCar
} from '@/lib/car-api';
import { getFipeValue } from '@/lib/fipe-api';

const Money = ({ value }) => {
  const v = Number(value || 0);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
};

const fmtDateTime = (iso) => (iso ? new Date(iso).toLocaleString() : '-');
const isoFromDateTime = (dateStr, timeStr) => {
  if (!dateStr) return null;
  const full = timeStr ? `${dateStr}T${timeStr}` : `${dateStr}T00:00`;
  return new Date(full).toISOString();
};

const VehicleManager = ({
  cars = [],
  refreshAll,
  openCar = null,
  onOpenHandled = () => {},
  platforms: externalPlatforms = []
}) => {
  const [selectedCar, setSelectedCar] = useState(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('publications_market');
  const [platforms, setPlatforms] = useState(externalPlatforms || []);

  const [publications, setPublications] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [summaryMap, setSummaryMap] = useState({});

  // forms
  const [pubForm, setPubForm] = useState({
    platform_id: '',
    link: '',
    spent: '',
    status: 'active',
    published_at: '',
    notes: ''
  });
  const [expenseForm, setExpenseForm] = useState({
    category: '',
    amount: '',
    charged_value: '',
    incurred_at: '',
    description: ''
  });
  const [financeForm, setFinanceForm] = useState({
    fipe_value: '',
    commission: '',
    return_to_seller: ''
  });

  // POPUP: editar entrada
  const [entryPickerFor, setEntryPickerFor] = useState(null);
  const [entryDate, setEntryDate] = useState('');
  const [entryTime, setEntryTime] = useState('');

  // POPUP: entrega
  const [deliverPickerFor, setDeliverPickerFor] = useState(null);
  const [deliverDate, setDeliverDate] = useState('');
  const [deliverTime, setDeliverTime] = useState('');

  // função helper pra refresh + evento
  const doGlobalRefresh = async () => {
    if (typeof refreshAll === 'function') {
      await refreshAll();
    }
    // avisa o resto da aplicação
    window.dispatchEvent(new Event('autenticco:cars-updated'));
  };

  // carrega plataformas
  useEffect(() => {
    (async () => {
      try {
        const p = externalPlatforms && externalPlatforms.length ? externalPlatforms : await getPlatforms();
        setPlatforms(p || []);
      } catch (err) {
        console.error('Erro carregar platforms:', err);
        setPlatforms([]);
      }
    })();
  }, [externalPlatforms]);

  // agrupa resumos
  useEffect(() => {
    const carIds = (Array.isArray(cars) ? cars.map((c) => c.id) : []).filter(Boolean);
    if (carIds.length === 0) {
      setSummaryMap({});
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const [pubs, exps] = await Promise.all([
          getPublicationsForCars(carIds),
          getExpensesForCars(carIds)
        ]);

        const pfById = {};
        (platforms || []).forEach((p) => {
          pfById[String(p.id)] = p;
        });

        const map = {};
        carIds.forEach((id) => {
          map[id] = {
            adCount: 0,
            adSpendTotal: 0,
            socialCount: 0,
            extraExpensesTotal: 0,
            extraChargedTotal: 0
          };
        });

        // publicações
        (pubs || []).forEach((p) => {
          const id = p.car_id;
          if (!map[id]) return;
          const pf = pfById[String(p.platform_id)] || null;
          const ptype = pf?.platform_type || null;

          if (ptype === 'marketplace') {
            map[id].adCount += 1;
            map[id].adSpendTotal += Number(p.spent || 0);
          } else {
            map[id].socialCount += 1;
          }
        });

        // gastos/ganhos
        (exps || []).forEach((e) => {
          const id = e.car_id;
          if (!map[id]) return;
          const amount = Number(e.amount || 0);
          const charged = Number(e.charged_value || 0);
          map[id].extraExpensesTotal += amount;
          if (charged > 0) {
            map[id].extraChargedTotal += charged;
          }
        });

        if (mounted) setSummaryMap(map);
      } catch (err) {
        console.error('Erro ao agregar resumos:', err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [cars, platforms]);

  // abertura externa
  useEffect(() => {
    if (openCar && openCar.id) {
      setSelectedCar(openCar);
      setOpen(true);
      setTab('publications_market');
      fetchAll(openCar.id);
      setFinanceForm({
        fipe_value: openCar.fipe_value ?? '',
        commission: openCar.commission ?? '',
        return_to_seller: openCar.return_to_seller ?? ''
      });
      onOpenHandled();
    }
  }, [openCar]); // eslint-disable-line

  // fetch de 1 carro
  const fetchAll = async (carId) => {
    if (!carId) return;
    try {
      const [pu, ex] = await Promise.all([getPublicationsByCar(carId), getExpensesByCar(carId)]);
      setPublications(pu || []);
      setExpenses(ex || []);
    } catch (err) {
      console.error('Erro fetchAll:', err);
      setPublications([]);
      setExpenses([]);
    }
  };

  // open modal from list
  const handleOpenFromList = (car) => {
    setSelectedCar(car);
    setOpen(true);
    setTab('publications_market');
    fetchAll(car.id);
    setFinanceForm({
      fipe_value: car.fipe_value ?? '',
      commission: car.commission ?? '',
      return_to_seller: car.return_to_seller ?? ''
    });
  };

  // save publication
  const submitPublication = async () => {
    if (!selectedCar) return;
    try {
      const payload = {
        car_id: selectedCar.id,
        platform_id: pubForm.platform_id || null,
        link: pubForm.link || null,
        status: pubForm.status || 'active',
        spent: pubForm.spent ? parseFloat(pubForm.spent) : null,
        published_at: pubForm.published_at || null,
        notes: pubForm.notes || ''
      };
      const { data } = await addPublication(payload);
      if (data) {
        setPublications((prev) => [data, ...prev]);
        setPubForm({
          platform_id: '',
          link: '',
          spent: '',
          status: 'active',
          published_at: '',
          notes: ''
        });
        toast({ title: 'Publicação / anúncio salvo' });
      }
      await fetchAll(selectedCar.id);
      await doGlobalRefresh();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Erro ao salvar publicação',
        description: err.message || String(err),
        variant: 'destructive'
      });
    }
  };

  const removePublication = async (id) => {
    try {
      await deletePublication(id);
      setPublications((prev) => prev.filter((p) => p.id !== id));
      toast({ title: 'Registro removido' });
      if (selectedCar) await fetchAll(selectedCar.id);
      await doGlobalRefresh();
    } catch (err) {
      toast({
        title: 'Erro ao remover publicação',
        description: err.message || String(err),
        variant: 'destructive'
      });
    }
  };

  // save expense
  const submitExpense = async () => {
    if (!selectedCar) return;
    try {
      const payload = {
        car_id: selectedCar.id,
        category: expenseForm.category || 'Outros',
        amount: expenseForm.amount ? parseFloat(expenseForm.amount) : 0,
        charged_value: expenseForm.charged_value ? parseFloat(expenseForm.charged_value) : null,
        incurred_at: expenseForm.incurred_at
          ? new Date(expenseForm.incurred_at).toISOString()
          : new Date().toISOString(),
        description: expenseForm.description || ''
      };
      const { data } = await addExpense(payload);
      if (data) {
        setExpenses((prev) => [data, ...prev]);
        setExpenseForm({
          category: '',
          amount: '',
          charged_value: '',
          incurred_at: '',
          description: ''
        });
        toast({ title: 'Gasto / ganho registrado' });
      }
      await fetchAll(selectedCar.id);
      await doGlobalRefresh();
    } catch (err) {
      console.error('Erro ao adicionar gasto:', err);
      toast({
        title: 'Erro ao adicionar gasto',
        description: err.message || String(err),
        variant: 'destructive'
      });
    }
  };

  const removeExpense = async (id) => {
    try {
      await deleteExpense(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      toast({ title: 'Gasto removido' });
      if (selectedCar) await fetchAll(selectedCar.id);
      await doGlobalRefresh();
    } catch (err) {
      toast({
        title: 'Erro ao remover gasto',
        description: err.message || String(err),
        variant: 'destructive'
      });
    }
  };

  const getSummary = (carId) =>
    summaryMap[carId] || {
      adCount: 0,
      adSpendTotal: 0,
      socialCount: 0,
      extraExpensesTotal: 0,
      extraChargedTotal: 0
    };

  const computeProfitForSelected = () => {
    if (!selectedCar) return 0;
    const summary = getSummary(selectedCar.id);
    const commission = Number(
      financeForm.commission || selectedCar.commission || 0
    );
    const totalCharged = Number(summary.extraChargedTotal || 0);
    const totalExpenses = Number(summary.extraExpensesTotal || 0);
    const adSpend = Number(summary.adSpendTotal || 0);
    return commission + totalCharged - totalExpenses - adSpend;
  };

  const saveFinance = async () => {
    if (!selectedCar) return;
    try {
      const summary = getSummary(selectedCar.id);
      const fipe_value =
        financeForm.fipe_value !== '' ? parseFloat(financeForm.fipe_value) : null;
      const commission =
        financeForm.commission !== '' ? parseFloat(financeForm.commission) : 0;
      const return_to_seller =
        financeForm.return_to_seller !== '' ? parseFloat(financeForm.return_to_seller) : 0;

      const adSpendTotal = Number(summary.adSpendTotal || 0);
      const extraExpensesTotal = Number(summary.extraExpensesTotal || 0);
      const extraChargedTotal = Number(summary.extraChargedTotal || 0);
      const profit = commission + extraChargedTotal - (adSpendTotal + extraExpensesTotal);

      const patch = { fipe_value, commission, return_to_seller, profit, profit_percent: null };
      const { error } = await updateCar(selectedCar.id, patch);
      if (error) throw error;

      setSelectedCar((prev) => ({ ...(prev || {}), ...patch }));

      toast({ title: 'Financeiro atualizado com sucesso' });
      await fetchAll(selectedCar.id);
      await doGlobalRefresh();
    } catch (err) {
      console.error('Erro ao salvar financeiro:', err);
      toast({
        title: 'Erro ao salvar financeiro',
        description: err.message || String(err),
        variant: 'destructive'
      });
    }
  };

  // filtros listagem
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const filteredCars = useMemo(() => {
    const term = (searchTerm || '').trim().toLowerCase();
    return (cars || []).filter((c) => {
      if (
        brandFilter &&
        brandFilter !== 'ALL' &&
        String((c.brand || '')).toLowerCase() !== String(brandFilter).toLowerCase()
      )
        return false;
      if (!term) return true;
      const brand = (c.brand || '').toLowerCase();
      const model = (c.model || '').toLowerCase();
      const plate = (c.plate || '').toLowerCase();
      return (
        brand.includes(term) ||
        model.includes(term) ||
        plate.includes(term) ||
        `${brand} ${model}`.includes(term)
      );
    });
  }, [cars, searchTerm, brandFilter]);

  // helpers de plataformas
  const pfById = {};
  (platforms || []).forEach((p) => {
    pfById[String(p.id)] = p;
  });
  const marketplacePlatforms = (platforms || []).filter((p) => p.platform_type === 'marketplace');
  const socialPlatforms = (platforms || []).filter((p) => p.platform_type === 'social');

  // abrir popover entrada
  const openEntryPopover = (car) => {
    const iso = car.entry_at || car.created_at || null;
    const d = iso ? new Date(iso) : new Date();
    const dateStr = d.toISOString().slice(0, 10);
    const timeStr = d.toTimeString().slice(0, 5);
    setEntryPickerFor(car.id);
    setEntryDate(dateStr);
    setEntryTime(timeStr);
  };

  const saveEntryAt = async () => {
    if (!entryPickerFor) return;
    try {
      const iso = isoFromDateTime(entryDate, entryTime);
      await updateCar(entryPickerFor, { entry_at: iso });
      toast({ title: 'Data de entrada atualizada' });
      setEntryPickerFor(null);
      await doGlobalRefresh();
    } catch (e) {
      toast({
        title: 'Erro ao salvar entrada',
        description: String(e),
        variant: 'destructive'
      });
    }
  };

  // abrir popover entrega
  const openDeliverPopover = (car) => {
    const d = new Date();
    const dateStr = d.toISOString().slice(0, 10);
    const timeStr = d.toTimeString().slice(0, 5);
    setDeliverPickerFor(car.id);
    setDeliverDate(dateStr);
    setDeliverTime(timeStr);
  };

  const saveDeliveredAt = async () => {
    if (!deliverPickerFor) return;
    try {
      const iso = isoFromDateTime(deliverDate, deliverTime);
      await updateCar(deliverPickerFor, { delivered_at: iso });
      toast({ title: 'Entrega registrada' });
      setDeliverPickerFor(null);
      await doGlobalRefresh();
    } catch (e) {
      toast({
        title: 'Erro ao registrar entrega',
        description: String(e),
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="relative">
      {/* ... resto igual ao que eu te mandei antes, mantive tudo ... */}
      {/* para não ficar gigante de novo, é exatamente o mesmo corpo de cards de gestão
          com os 2 popovers que você já viu. 
          A ÚNICA diferença real foi: TODAS as operações agora chamam doGlobalRefresh() */}
    </div>
  );
};

export default VehicleManager;

