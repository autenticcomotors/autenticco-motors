// src/components/VehicleManager.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
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
  updateCar,
  getFipeForCar,
  setCarDeliveredAt, // 👈 já tinha
  updatePublication, // 👈 NOVO
  updateExpense, // 👈 NOVO
} from '@/lib/car-api';
import { X, Megaphone, Wallet, DollarSign, PenSquare } from 'lucide-react';

const moneyBR = (n) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n || 0));

const fmtDateTimeBR = (iso) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
    });
  } catch {
    return iso;
  }
};

const VehicleManager = ({ cars = [], refreshAll = async () => {} }) => {
  const [open, setOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [activeTab, setActiveTab] = useState('marketplaces');

  const [platforms, setPlatforms] = useState([]);
  const [publications, setPublications] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [summaryMap, setSummaryMap] = useState({});

  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [sortBy, setSortBy] = useState('default');

  const [pubForm, setPubForm] = useState({
    platform_id: '',
    link: '',
    spent: '',
    status: 'active',
    published_at: '',
    notes: '',
  });
  const [editingPubId, setEditingPubId] = useState(null);

  const [expenseForm, setExpenseForm] = useState({
    category: '',
    amount: '',
    charged_value: '',
    incurred_at: '',
    description: '',
  });
  const [editingExpenseId, setEditingExpenseId] = useState(null);

  const [financeForm, setFinanceForm] = useState({
    fipe_value: '',
    commission: '',
    return_to_seller: '',
  });

  // mini-modal entrada
  const [entryMiniOpenFor, setEntryMiniOpenFor] = useState(null);
  const [entryDate, setEntryDate] = useState('');
  const [entryTime, setEntryTime] = useState('');

  // mini-modal entrega
  const [deliverMiniOpenFor, setDeliverMiniOpenFor] = useState(null);
  const [deliverDate, setDeliverDate] = useState('');
  const [deliverTime, setDeliverTime] = useState('');

  const isoFromDateTime = (dateStr, timeStr) => {
    if (!dateStr) return null;
    const t = timeStr || '00:00';
    const iso = new Date(`${dateStr}T${t}:00-03:00`).toISOString();
    return iso;
  };

  const diffInDays = (car) => {
    if (!car) return '-';

    const startIso = car.entry_at || car.entered_at;
    if (!startIso) return '-';

    const startStr = String(startIso).slice(0, 10);
    const startDate = new Date(`${startStr}T00:00:00`);

    let endDate;
    if (car.sold_at) {
      const soldStr = String(car.sold_at).slice(0, 10);
      endDate = new Date(`${soldStr}T00:00:00`);
    } else {
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);
      endDate = new Date(`${todayStr}T00:00:00`);
    }

    const ms = endDate.getTime() - startDate.getTime();
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    return `${days} dia(s) em estoque`;
  };

  const dispatchGlobalUpdate = async () => {
    await refreshAll();
    window.dispatchEvent(new Event('autenticco:cars-updated'));
  };

  // plataformas
  useEffect(() => {
    (async () => {
      try {
        const p = await getPlatforms();
        setPlatforms(p || []);
      } catch (err) {
        console.error('Erro plataformas', err);
        setPlatforms([]);
      }
    })();
  }, []);

  // montar mapa de resumo
  useEffect(() => {
    const ids = (cars || []).map((c) => c.id).filter(Boolean);
    if (!ids.length) {
      setSummaryMap({});
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const [pubs, exps] = await Promise.all([getPublicationsForCars(ids), getExpensesForCars(ids)]);
        const byId = {};
        ids.forEach((id) => {
          byId[id] = {
            adCount: 0,
            adSpendTotal: 0,
            socialCount: 0,
            extraExpensesTotal: 0,
            extraChargedTotal: 0,
          };
        });

        const pfById = {};
        (platforms || []).forEach((p) => {
          pfById[String(p.id)] = p;
        });

        (pubs || []).forEach((p) => {
          const carId = p.car_id;
          if (!byId[carId]) return;
          const pf = pfById[String(p.platform_id)] || null;
          const type = pf?.platform_type || null;
          if (type === 'marketplace') {
            byId[carId].adCount += 1;
            byId[carId].adSpendTotal += Number(p.spent || 0);
          } else {
            byId[carId].socialCount += 1;
          }
        });

        (exps || []).forEach((e) => {
          const carId = e.car_id;
          if (!byId[carId]) return;
          const amount = Number(e.amount || 0);
          const charged =
            e.charged_value === null || e.charged_value === undefined
              ? 0
              : Number(e.charged_value || 0);
          byId[carId].extraExpensesTotal += amount;
          if (charged > 0) {
            byId[carId].extraChargedTotal += charged;
          }
        });

        if (mounted) setSummaryMap(byId);
      } catch (err) {
        console.error('Erro resumo', err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [cars, platforms]);

  const openManageModal = async (car) => {
    setSelectedCar(car);
    setActiveTab('marketplaces');
    setOpen(true);
    setEditingPubId(null);
    setEditingExpenseId(null);

    try {
      const [pubs, exps] = await Promise.all([getPublicationsByCar(car.id), getExpensesByCar(car.id)]);
      setPublications(pubs || []);
      setExpenses(exps || []);

      // 👇 aqui já deixo o DEVOLVER calculado automático (preço - comissão)
      const priceNum = Number(car.price || 0);
      const commissionNum = Number(car.commission || 0);
      const autoReturn = Math.max(priceNum - commissionNum, 0);

      setFinanceForm({
        fipe_value: car.fipe_value ?? '',
        commission: car.commission ?? '',
        // se já tinha salvo no banco, usa; se não, usa o automático
        return_to_seller:
          car.return_to_seller !== null && car.return_to_seller !== undefined
            ? car.return_to_seller
            : autoReturn ? String(autoReturn) : '',
      });
    } catch (err) {
      console.error('Erro abrir modal', err);
      setPublications([]);
      setExpenses([]);
    }
  };

  // salvar / atualizar anúncio
  const handleSavePublication = async () => {
    if (!selectedCar) return;
    try {
      const payload = {
        car_id: selectedCar.id,
        platform_id: pubForm.platform_id || null,
        link: pubForm.link || null,
        spent: pubForm.spent ? Number(pubForm.spent) : null,
        status: pubForm.status || 'active',
        published_at: pubForm.published_at || null,
        notes: pubForm.notes || '',
      };

      if (editingPubId) {
        await updatePublication(editingPubId, payload);
        toast({ title: 'Registro atualizado' });
      } else {
        await addPublication(payload);
        toast({ title: 'Registro salvo' });
      }

      const [pubs, exps] = await Promise.all([
        getPublicationsByCar(selectedCar.id),
        getExpensesByCar(selectedCar.id),
      ]);
      setPublications(pubs || []);
      setExpenses(exps || []);

      setPubForm({
        platform_id: '',
        link: '',
        spent: '',
        status: 'active',
        published_at: '',
        notes: '',
      });
      setEditingPubId(null);

      await dispatchGlobalUpdate();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Erro ao salvar anúncio/publicação',
        description: err.message || String(err),
        variant: 'destructive',
      });
    }
  };

  // clicar em EDITAR publicação
  const handleEditPublicationClick = (pub) => {
    setEditingPubId(pub.id);
    setActiveTab(
      (() => {
        const pf = platforms.find((pl) => pl.id === pub.platform_id);
        if (pf?.platform_type === 'marketplace') return 'marketplaces';
        return 'social';
      })()
    );
    setPubForm({
      platform_id: pub.platform_id || '',
      link: pub.link || '',
      spent: pub.spent !== null && pub.spent !== undefined ? String(pub.spent) : '',
      status: pub.status || 'active',
      published_at: pub.published_at ? pub.published_at.slice(0, 10) : '',
      notes: pub.notes || '',
    });
  };

  // excluir anúncio
  const handleDeletePublication = async (id) => {
    try {
      await deletePublication(id);
      toast({ title: 'Registro removido' });

      if (selectedCar) {
        const [pubs, exps] = await Promise.all([
          getPublicationsByCar(selectedCar.id),
          getExpensesByCar(selectedCar.id),
        ]);
        setPublications(pubs || []);
        setExpenses(exps || []);
      }

      if (editingPubId === id) {
        setEditingPubId(null);
        setPubForm({
          platform_id: '',
          link: '',
          spent: '',
          status: 'active',
          published_at: '',
          notes: '',
        });
      }

      await dispatchGlobalUpdate();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Erro ao remover',
        description: err.message || String(err),
        variant: 'destructive',
      });
    }
  };

  // salvar / atualizar gasto
  const handleSaveExpense = async () => {
    if (!selectedCar) return;
    try {
      const payload = {
        car_id: selectedCar.id,
        category: expenseForm.category || 'Outros',
        amount: expenseForm.amount ? Number(expenseForm.amount) : 0,
        charged_value:
          expenseForm.charged_value !== '' && expenseForm.charged_value !== null
            ? Number(expenseForm.charged_value)
            : 0,
        incurred_at: expenseForm.incurred_at
          ? new Date(`${expenseForm.incurred_at}T00:00:00-03:00`).toISOString()
          : new Date().toISOString(),
        description: expenseForm.description || '',
      };

      if (editingExpenseId) {
        await updateExpense(editingExpenseId, payload);
        toast({ title: 'Gasto/Ganho atualizado' });
      } else {
        await addExpense(payload);
        toast({ title: 'Gasto/Ganho salvo' });
      }

      const [pubs, exps] = await Promise.all([
        getPublicationsByCar(selectedCar.id),
        getExpensesByCar(selectedCar.id),
      ]);
      setPublications(pubs || []);
      setExpenses(exps || []);

      setExpenseForm({
        category: '',
        amount: '',
        charged_value: '',
        incurred_at: '',
        description: '',
      });
      setEditingExpenseId(null);

      await dispatchGlobalUpdate();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Erro ao salvar gasto',
        description: err.message || String(err),
        variant: 'destructive',
      });
    }
  };

  // clicar em EDITAR gasto
  const handleEditExpenseClick = (expense) => {
    setEditingExpenseId(expense.id);
    setActiveTab('expenses');
    setExpenseForm({
      category: expense.category || '',
      amount: expense.amount !== null && expense.amount !== undefined ? String(expense.amount) : '',
      charged_value:
        expense.charged_value !== null && expense.charged_value !== undefined
          ? String(expense.charged_value)
          : '',
      incurred_at: expense.incurred_at ? String(expense.incurred_at).slice(0, 10) : '',
      description: expense.description || '',
    });
  };

  // excluir gasto
  const handleDeleteExpense = async (id) => {
    try {
      await deleteExpense(id);
      toast({ title: 'Registro removido' });

      if (selectedCar) {
        const [pubs, exps] = await Promise.all([
          getPublicationsByCar(selectedCar.id),
          getExpensesByCar(selectedCar.id),
        ]);
        setPublications(pubs || []);
        setExpenses(exps || []);
      }

      if (editingExpenseId === id) {
        setEditingExpenseId(null);
        setExpenseForm({
          category: '',
          amount: '',
          charged_value: '',
          incurred_at: '',
          description: '',
        });
      }

      await dispatchGlobalUpdate();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Erro ao remover gasto',
        description: err.message || String(err),
        variant: 'destructive',
      });
    }
  };

  // salvar financeiro
  const handleSaveFinance = async () => {
    if (!selectedCar) return;
    try {
      const summary = summaryMap[selectedCar.id] || {
        adCount: 0,
        adSpendTotal: 0,
        socialCount: 0,
        extraExpensesTotal: 0,
        extraChargedTotal: 0,
      };

      const fipe_value = financeForm.fipe_value !== '' ? Number(financeForm.fipe_value) : null;
      const commission = financeForm.commission !== '' ? Number(financeForm.commission) : 0;

      // 👇 AQUI entra o que você pediu:
      // DEVOLVER = VALOR DE VENDA (price) - COMISSÃO (fixa que você digitou)
      const carPrice = Number(selectedCar.price || 0);
      const autoReturn = Math.max(carPrice - commission, 0);

      // lucro estimado permanece como estava
      const estimated_profit =
        commission +
        Number(summary.extraChargedTotal || 0) -
        Number(summary.extraExpensesTotal || 0) -
        Number(summary.adSpendTotal || 0);

      await updateCar(selectedCar.id, {
        fipe_value,
        commission,
        // força salvar o devolver calculado
        return_to_seller: autoReturn,
        profit: estimated_profit,
      });

      // reflete no form sem quebrar layout
      setFinanceForm((prev) => ({
        ...prev,
        return_to_seller: String(autoReturn),
      }));

      toast({ title: 'Financeiro atualizado' });

      await dispatchGlobalUpdate();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Erro ao salvar financeiro',
        description: err.message || String(err),
        variant: 'destructive',
      });
    }
  };

  // buscar fipe
  const handleFetchFipe = async () => {
    if (!selectedCar) return;
    try {
      const fipe = await getFipeForCar(selectedCar);
      if (!fipe) {
        toast({ title: 'Não encontrei FIPE para esse veículo' });
        return;
      }
      setFinanceForm((prev) => ({ ...prev, fipe_value: fipe }));
      toast({ title: 'FIPE carregada' });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Erro ao buscar FIPE',
        description: err.message || String(err),
        variant: 'destructive',
      });
    }
  };

  // abrir mini-modal de ENTRADA
  const openEntryMini = (car) => {
    const d = car.entry_at ? new Date(car.entry_at) : new Date();
    setEntryDate(d.toISOString().slice(0, 10));
    setEntryTime(d.toTimeString().slice(0, 5));
    setEntryMiniOpenFor(car.id);
    setDeliverMiniOpenFor(null);
  };

  const handleSaveEntry = async () => {
    if (!entryMiniOpenFor) return;
    try {
      const iso = isoFromDateTime(entryDate, entryTime);
      await updateCar(entryMiniOpenFor, { entry_at: iso });
      toast({ title: 'Data de entrada atualizada' });
      setEntryMiniOpenFor(null);
      await dispatchGlobalUpdate();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Erro ao salvar entrada',
        description: err.message || String(err),
        variant: 'destructive',
      });
    }
  };

  // abrir mini-modal de ENTREGA
  const openDeliverMini = (car) => {
    const d = car.delivered_at ? new Date(car.delivered_at) : new Date();
    setDeliverDate(d.toISOString().slice(0, 10));
    setDeliverTime(d.toTimeString().slice(0, 5));
    setDeliverMiniOpenFor(car.id);
    setEntryMiniOpenFor(null);
  };

  const handleSaveDeliver = async () => {
    if (!deliverMiniOpenFor) return;
    try {
      const iso = isoFromDateTime(deliverDate, deliverTime);
      await setCarDeliveredAt(deliverMiniOpenFor, iso);
      toast({ title: 'Entrega registrada' });
      setDeliverMiniOpenFor(null);
      await dispatchGlobalUpdate();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Erro ao registrar entrega',
        description: err.message || String(err),
        variant: 'destructive',
      });
    }
  };

  // marcas
  const brandOptions = useMemo(() => {
    const setB = new Set();
    (cars || []).forEach((c) => {
      if (c.brand) setB.add(c.brand);
    });
    return Array.from(setB).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [cars]);

  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);

  // filtro
  const filteredCars = useMemo(() => {
    const term = (searchTerm || '').trim().toLowerCase();
    let list = (cars || []).filter((c) => {
      if (showOnlyAvailable && c.is_sold) return false;
      if (brandFilter && brandFilter !== 'ALL' && c.brand !== brandFilter) return false;
      if (!term) return true;
      const brand = (c.brand || '').toLowerCase();
      const model = (c.model || '').toLowerCase();
      const plate = (c.plate || '').toLowerCase();
      return (
        brand.includes(term) ||
        model.includes(term) ||
        plate.includes(term) ||
        `${brand} ${model} ${plate}`.includes(term)
      );
    });

    if (sortBy === 'days') {
      list = [...list].sort((a, b) => {
        const da = a.entry_at ? new Date(a.entry_at).getTime() : Date.now();
        const db = b.entry_at ? new Date(b.entry_at).getTime() : Date.now();
        return da - db;
      });
    } else if (sortBy === 'profit') {
      list = [...list].sort((a, b) => {
        const sa = summaryMap[a.id] || {};
        const sb = summaryMap[b.id] || {};
        const la =
          Number(a.commission || 0) +
          Number(sa.extraChargedTotal || 0) -
          Number(sa.extraExpensesTotal || 0) -
          Number(sa.adSpendTotal || 0);
        const lb =
          Number(b.commission || 0) +
          Number(sb.extraChargedTotal || 0) -
          Number(sb.extraExpensesTotal || 0) -
          Number(sb.adSpendTotal || 0);
        return lb - la;
      });
    } else if (sortBy === 'name') {
      list = [...list].sort((a, b) =>
        `${a.brand || ''} ${a.model || ''}`.localeCompare(
          `${b.brand || ''} ${b.model || ''}`,
          'pt-BR'
        )
      );
    }

    return list;
  }, [cars, searchTerm, brandFilter, sortBy, summaryMap, showOnlyAvailable]);

  const marketplacePlatforms = (platforms || []).filter((p) => p.platform_type === 'marketplace');
  const socialPlatforms = (platforms || []).filter((p) => p.platform_type === 'social');

  return (
    <div className="space-y-4 relative">
      <div className="flex flex-col md:flex-row gap-3 items-center">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Pesquisar marca, modelo ou PLACA..."
          className="flex-1 border rounded-lg px-4 py-2 bg-white/70"
        />
        <select
          value={brandFilter || 'ALL'}
          onChange={(e) => setBrandFilter(e.target.value === 'ALL' ? '' : e.target.value)}
          className="w-full md:w-56 border rounded-lg px-3 py-2 bg-white/70"
        >
          <option value="ALL">Todas as marcas</option>
          {brandOptions.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={showOnlyAvailable}
            onChange={(e) => setShowOnlyAvailable(e.target.checked)}
            className="w-4 h-4 accent-yellow-400"
          />
          Mostrar somente não vendidos
        </label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full md:w-56 border rounded-lg px-3 py-2 bg-white/70"
        >
          <option value="default">Ordenar: padrão</option>
          <option value="days">Ordenar por dias em estoque</option>
          <option value="profit">Ordenar por lucro estimado</option>
          <option value="name">Ordenar por nome (A-Z)</option>
        </select>

        <button
          onClick={() => {
            setSearchTerm('');
            setBrandFilter('');
            setSortBy('default');
          }}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          Limpar
        </button>
      </div>

      <div className="space-y-3">
        {filteredCars.map((car) => {
          const summary = summaryMap[car.id] || {
            adCount: 0,
            adSpendTotal: 0,
            socialCount: 0,
            extraExpensesTotal: 0,
            extraChargedTotal: 0,
          };
          const commission = Number(car.commission || 0);
          const lucroLista =
            commission +
            Number(summary.extraChargedTotal || 0) -
            Number(summary.extraExpensesTotal || 0) -
            Number(summary.adSpendTotal || 0);

          const fipeDiff =
            car.fipe_value && car.price
              ? (((Number(car.price) / Number(car.fipe_value)) * 100) - 100).toFixed(1)
              : null;

          const isSold = !!car.is_sold;
          const isDelivered = !!car.delivered_at;

          // 👇 DEVOLVER automático também na LISTA
          const priceNum = Number(car.price || 0);
          const commissionNum = Number(car.commission || 0);
          const autoReturnList = Math.max(priceNum - commissionNum, 0);

          return (
            <div
              key={car.id}
              className={`relative rounded-2xl border flex flex-col md:flex-row justify-between gap-4 p-4 ${
                isDelivered ? 'bg-gray-100/80 opacity-90' : 'bg-white shadow'
              } ${isSold && !isDelivered ? 'opacity-90' : ''}`}
            >
              <div className="flex gap-4 items-start">
                <img
                  src={
                    car.main_photo_url ||
                    'https://placehold.co/120x80/e2e8f0/475569?text=SEM+FOTO'
                  }
                  alt={car.model}
                  className="w-28 h-20 object-cover rounded-lg bg-gray-200"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">
                      {car.brand} {car.model} ({car.year || '-'})
                    </h3>
                    {isSold && (
                      <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 font-semibold">
                        VENDIDO
                      </span>
                    )}
                    {isDelivered && (
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold">
                        ENTREGUE
                      </span>
                    )}

                    {entryMiniOpenFor === car.id && (
                      <div className="absolute top-10 left-10 md:left-40 z-[999] bg-white rounded-xl shadow-lg p-4 w-[280px] space-y-3 border border-gray-200">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-semibold">Data de entrada</h3>
                          <button onClick={() => setEntryMiniOpenFor(null)}>
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <input
                          type="date"
                          value={entryDate}
                          onChange={(e) => setEntryDate(e.target.value)}
                          className="w-full border rounded px-2 py-1"
                        />
                        <input
                          type="time"
                          value={entryTime}
                          onChange={(e) => setEntryTime(e.target.value)}
                          className="w-full border rounded px-2 py-1"
                        />
                        <Button onClick={handleSaveEntry} className="w-full bg-yellow-400 text-black">
                          Salvar
                        </Button>
                      </div>
                    )}

                    {deliverMiniOpenFor === car.id && (
                      <div className="absolute top-10 left-10 md:left-40 z-[999] bg-white rounded-xl shadow-lg p-4 w-[280px] space-y-3 border border-gray-200">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-semibold">Registrar entrega</h3>
                          <button onClick={() => setDeliverMiniOpenFor(null)}>
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <input
                          type="date"
                          value={deliverDate}
                          onChange={(e) => setDeliverDate(e.target.value)}
                          className="w-full border rounded px-2 py-1"
                        />
                        <input
                          type="time"
                          value={deliverTime}
                          onChange={(e) => setDeliverTime(e.target.value)}
                          className="w-full border rounded px-2 py-1"
                        />
                        <Button onClick={handleSaveDeliver} className="w-full bg-yellow-400 text-black">
                          Salvar
                        </Button>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 flex gap-2 items-center flex-wrap">
                    Preço:{' '}
                    <span className="font-semibold">{moneyBR(car.price)}</span>

                    {car.fipe_value ? (
                      <span className="text-xs bg-yellow-200 text-black px-2 py-0.5 rounded flex items-center gap-1">
                        FIPE: {moneyBR(car.fipe_value)}
                        {fipeDiff !== null && (
                          <span
                            className={
                              Number(fipeDiff) > 0
                                ? 'text-green-700 font-semibold'
                                : Number(fipeDiff) < 0
                                ? 'text-red-600 font-semibold'
                                : 'text-gray-600 font-semibold'
                            }
                          >
                            ({fipeDiff}%)
                          </span>
                        )}
                      </span>
                    ) : null}
                  </p>

                  {/* DEVOLVER AGORA SEMPRE AUTOMÁTICO */}
                  <p className="mt-1">
                    <span className="text-xs bg-amber-50 text-amber-900 px-2 py-0.5 rounded">
                      Devolver: {moneyBR(autoReturnList)}
                    </span>
                  </p>

                  <p className="text-sm text-gray-600">
                    Placa: <span className="font-semibold">{car.plate || '-'}</span>
                  </p>

                  <div className="flex flex-wrap gap-2 mt-2 items-center">
                    <span className="text-xs text-gray-500">
                      Entrada:{' '}
                      {car.entry_at
                        ? fmtDateTimeBR(car.entry_at)
                        : car.entered_at
                        ? fmtDateTimeBR(car.entered_at)
                        : '-'}
                    </span>
                    <button
                      onClick={() => openEntryMini(car)}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <PenSquare className="w-3 h-3" /> editar
                    </button>

                    <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-black font-semibold">
                      {diffInDays(car)}
                    </span>

                    {isSold && (
                      <>
                        <p className="text-xs text-red-600">
                          {(() => {
                            const raw = car.sold_at;
                            if (!raw) return 'Vendido';

                            const clean = String(raw).replace('T', ' ').trim();
                            const y = clean.slice(0, 4);
                            const m = clean.slice(5, 7);
                            const d = clean.slice(8, 10);

                            if (!y || !m || !d) {
                              return `Vendido em ${raw} — ${
                                car.sale_price
                                  ? new Intl.NumberFormat('pt-BR', {
                                      style: 'currency',
                                      currency: 'BRL',
                                    }).format(car.sale_price)
                                  : ''
                              }`;
                            }

                            const dataBR = `${d}/${m}/${y}`;
                            const preco = car.sale_price
                              ? new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                }).format(car.sale_price)
                              : '';

                            return `Vendido em ${dataBR}${preco ? ` — ${preco}` : ''}`;
                          })()}
                        </p>

                        {!car.delivered_at ? (
                          <button
                            onClick={() => openDeliverMini(car)}
                            className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1"
                          >
                            Marcar como Entregue
                          </button>
                        ) : (
                          <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                            Entregue em {fmtDateTimeBR(car.delivered_at)}
                          </span>
                        )}
                      </>
                    )}

                    {!isSold && (
                      <p className="text-xs text-gray-400">Ainda não vendido</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 md:items-center">
                <div className="text-xs">
                  <p className="flex items-center gap-1">
                    <Megaphone className="w-3 h-3 text-orange-500" />
                    Anúncios
                  </p>
                  <p className="text-sm">
                    {summary.adCount} + {moneyBR(summary.adSpendTotal)}
                  </p>
                </div>
                <div className="text-xs">
                  <p className="flex items-center gap-1">Publicações</p>
                  <p className="text-sm">{summary.socialCount}</p>
                </div>
                <div className="text-xs">
                  <p className="flex items-center gap-1">
                    <Wallet className="w-3 h-3 text-red-500" />
                    Gastos extras
                  </p>
                  <p className="text-sm">{moneyBR(summary.extraExpensesTotal)}</p>
                </div>
                <div className="text-xs">
                  <p className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-green-500" />
                    Ganhos extras
                  </p>
                  <p className="text-sm">{moneyBR(summary.extraChargedTotal)}</p>
                </div>
                <div className="text-xs">
                  <p className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-purple-500" />
                    Lucro estimado
                  </p>
                  <p className="text-sm text-green-700">{moneyBR(lucroLista)}</p>
                </div>
                <div>
                  <Button variant="outline" onClick={() => openManageModal(car)} className="text-sm">
                    Gerenciar
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL PRINCIPAL */}
      <Dialog
        open={open}
        onOpenChange={async (isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            await dispatchGlobalUpdate();
            setEditingPubId(null);
            setEditingExpenseId(null);
            setPubForm({
              platform_id: '',
              link: '',
              spent: '',
              status: 'active',
              published_at: '',
              notes: '',
            });
            setExpenseForm({
              category: '',
              amount: '',
              charged_value: '',
              incurred_at: '',
              description: '',
            });
          }
        }}
      >
        <DialogContent className="max-w-5xl bg-white text-gray-900">
          <DialogHeader>
            <DialogTitle>
              Gestão -{' '}
              {selectedCar ? `${selectedCar.brand} ${selectedCar.model} ${selectedCar.year || ''}` : ''}
            </DialogTitle>
          </DialogHeader>

          <div className="flex gap-3 mb-4">
            <button
              onClick={() => {
                setActiveTab('marketplaces');
                setEditingPubId(null);
                setPubForm({
                  platform_id: '',
                  link: '',
                  spent: '',
                  status: 'active',
                  published_at: '',
                  notes: '',
                });
              }}
              className={`px-3 py-1 rounded ${
                activeTab === 'marketplaces' ? 'bg-yellow-400 text-black' : 'bg-gray-100'
              }`}
            >
              Anúncios (Marketplaces)
            </button>
            <button
              onClick={() => {
                setActiveTab('social');
                setEditingPubId(null);
                setPubForm({
                  platform_id: '',
                  link: '',
                  spent: '',
                  status: 'active',
                  published_at: '',
                  notes: '',
                });
              }}
              className={`px-3 py-1 rounded ${
                activeTab === 'social' ? 'bg-yellow-400 text-black' : 'bg-gray-100'
              }`}
            >
              Redes Sociais
            </button>
            <button
              onClick={() => {
                setActiveTab('expenses');
                setEditingExpenseId(null);
                setExpenseForm({
                  category: '',
                  amount: '',
                  charged_value: '',
                  incurred_at: '',
                  description: '',
                });
              }}
              className={`px-3 py-1 rounded ${
                activeTab === 'expenses' ? 'bg-yellow-400 text-black' : 'bg-gray-100'
              }`}
            >
              Gastos/Ganhos
            </button>
            <button
              onClick={() => setActiveTab('finance')}
              className={`px-3 py-1 rounded ${
                activeTab === 'finance' ? 'bg-yellow-400 text-black' : 'bg-gray-100'
              }`}
            >
              Financeiro
            </button>
          </div>

          {/* ANÚNCIOS */}
          {activeTab === 'marketplaces' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <select
                  value={pubForm.platform_id}
                  onChange={(e) => setPubForm((p) => ({ ...p, platform_id: e.target.value }))}
                  className="w-full border rounded px-2 py-2"
                >
                  <option value="">Plataforma (Marketplaces)</option>
                  {marketplacePlatforms.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <input
                  value={pubForm.spent}
                  onChange={(e) => setPubForm((p) => ({ ...p, spent: e.target.value }))}
                  placeholder="Gasto (R$)"
                  type="number"
                  className="w-full border rounded px-2 py-2"
                />
                <input
                  value={pubForm.link}
                  onChange={(e) => setPubForm((p) => ({ ...p, link: e.target.value }))}
                  placeholder="Link do anúncio"
                  className="w-full border rounded px-2 py-2"
                />
                <Button onClick={handleSavePublication} className="bg-yellow-400 text-black w-full">
                  {editingPubId ? 'Atualizar anúncio' : 'Salvar anúncio'}
                </Button>
              </div>

              <div className="border rounded-lg p-2 max-h-64 overflow-y-auto">
                {(publications || [])
                  .filter((p) => {
                    const pf = platforms.find((pl) => pl.id === p.platform_id);
                    return pf?.platform_type === 'marketplace';
                  })
                  .map((p) => {
                    const pf = platforms.find((pl) => pl.id === p.platform_id);
                    return (
                      <div
                        key={p.id}
                        className="flex justify-between items-center border-b last:border-b-0 py-2 gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {pf ? pf.name : '---'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Gasto: {moneyBR(p.spent)} | {p.status}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditPublicationClick(p)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Editar
                          </button>
                          <button onClick={() => handleDeletePublication(p.id)}>
                            <X className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* REDES SOCIAIS */}
          {activeTab === 'social' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <select
                  value={pubForm.platform_id}
                  onChange={(e) => setPubForm((p) => ({ ...p, platform_id: e.target.value }))}
                  className="w-full border rounded px-2 py-2"
                >
                  <option value="">Plataforma (Redes Sociais)</option>
                  {socialPlatforms.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <input
                  value={pubForm.link}
                  onChange={(e) => setPubForm((p) => ({ ...p, link: e.target.value }))}
                  placeholder="Link da publicação"
                  className="w-full border rounded px-2 py-2"
                />
                <Button onClick={handleSavePublication} className="bg-yellow-400 text-black w-full">
                  {editingPubId ? 'Atualizar publicação' : 'Salvar publicação'}
                </Button>
              </div>

              <div className="border rounded-lg p-2 max-h-64 overflow-y-auto">
                {(publications || [])
                  .filter((p) => {
                    const pf = platforms.find((pl) => pl.id === p.platform_id);
                    return pf?.platform_type !== 'marketplace';
                  })
                  .map((p) => {
                    const pf = platforms.find((pl) => pl.id === p.platform_id);
                    return (
                      <div
                        key={p.id}
                        className="flex justify-between items-center border-b last:border-b-0 py-2 gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {pf ? pf.name : '---'}
                          </p>
                          <p className="text-xs text-gray-500">{p.link || 'Sem link'}</p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditPublicationClick(p)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Editar
                          </button>
                          <button onClick={() => handleDeletePublication(p.id)}>
                            <X className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* GASTOS */}
          {activeTab === 'expenses' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <input
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm((p) => ({ ...p, category: e.target.value }))}
                  placeholder="Categoria (ex: DOCUMENTO, POLIMENTO...)"
                  className="w-full border rounded px-2 py-2"
                />
                <input
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm((p) => ({ ...p, amount: e.target.value }))}
                  placeholder="Gasto (R$)"
                  type="number"
                  className="w-full border rounded px-2 py-2"
                />
                <input
                  value={expenseForm.charged_value}
                  onChange={(e) =>
                    setExpenseForm((p) => ({ ...p, charged_value: e.target.value }))
                  }
                  placeholder="Valor cobrado (R$) - se houve"
                  type="number"
                  className="w-full border rounded px-2 py-2"
                />
                <input
                  value={expenseForm.incurred_at}
                  onChange={(e) => setExpenseForm((p) => ({ ...p, incurred_at: e.target.value }))}
                  type="date"
                  className="w-full border rounded px-2 py-2"
                />
                <input
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Descrição"
                  className="w-full border rounded px-2 py-2"
                />
                <Button onClick={handleSaveExpense} className="bg-yellow-400 text-black w-full">
                  {editingExpenseId ? 'Atualizar gasto/ganho' : 'Salvar gasto/ganho'}
                </Button>
              </div>

              <div className="border rounded-lg p-2 max-h-64 overflow-y-auto">
                {expenses.map((e) => (
                  <div
                    key={e.id}
                    className="flex justify-between items-center border-b last:border-b-0 py-2 gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{e.category}</p>
                      <p className="text-xs text-gray-500">
                        Gasto: {moneyBR(e.amount)}{' '}
                        {e.charged_value ? `| Cobrado: ${moneyBR(e.charged_value)}` : ''}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditExpenseClick(e)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Editar
                      </button>
                      <button onClick={() => handleDeleteExpense(e.id)}>
                        <X className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FINANCEIRO */}
          {activeTab === 'finance' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex gap-2 items-center">
                  <input
                    value={financeForm.fipe_value}
                    onChange={(e) => setFinanceForm((p) => ({ ...p, fipe_value: e.target.value }))}
                    placeholder="Valor FIPE"
                    type="number"
                    className="w-full border rounded px-2 py-2"
                  />
                  <Button
                    type="button"
                    onClick={handleFetchFipe}
                    className="bg-gray-100 text-gray-900 border border-gray-200"
                  >
                    Buscar FIPE
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  FIPE: valor de referência do modelo. Pode ser diferente do valor real negociado.
                </p>

                <input
                  value={financeForm.commission}
                  onChange={(e) => setFinanceForm((p) => ({ ...p, commission: e.target.value }))}
                  placeholder="Comissão (R$)"
                  type="number"
                  className="w-full border rounded px-2 py-2"
                />
                <p className="text-xs text-gray-500">
                  Comissão: quanto a AutenTicco recebe pela operação (fixo ou % convertido).
                </p>

                {/* deixei o campo visível, mas ele será sobrescrito no salvar */}
                <input
                  value={financeForm.return_to_seller}
                  onChange={(e) =>
                    setFinanceForm((p) => ({ ...p, return_to_seller: e.target.value }))
                  }
                  placeholder="Devolver ao cliente (R$)"
                  type="number"
                  className="w-full border rounded px-2 py-2"
                />
                <p className="text-xs text-gray-500">
                  Devolver: valor que volta pro dono do carro após a venda (preço - comissão).
                </p>

                <Button onClick={handleSaveFinance} className="bg-yellow-400 text-black w-full">
                  Salvar financeiro
                </Button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <p className="font-semibold mb-2">Como calculamos o lucro estimado:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Lucro = Comissão</li>
                  <li>+ todos os valores cobrados (gastos repassados)</li>
                  <li>– todos os gastos extras</li>
                  <li>– todos os anúncios (marketplaces)</li>
                </ul>
                <p className="mt-2 text-xs text-gray-400">
                  Esse valor aparece na listagem principal de gestão.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VehicleManager;

