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
} from '@/lib/car-api';
import { X, Megaphone, Wallet, DollarSign, PenSquare } from 'lucide-react';

const moneyBR = (n) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n || 0));

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

  const [pubForm, setPubForm] = useState({
    platform_id: '',
    link: '',
    spent: '',
    status: 'active',
    published_at: '',
    notes: '',
  });

  const [expenseForm, setExpenseForm] = useState({
    category: '',
    amount: '',
    charged_value: '',
    incurred_at: '',
    description: '',
  });

  const [financeForm, setFinanceForm] = useState({
    fipe_value: '',
    commission: '',
    return_to_seller: '',
  });

  // mini-modal entrada
  const [entryMiniOpenFor, setEntryMiniOpenFor] = useState(null);
  const [entryDate, setEntryDate] = useState('');
  const [entryTime, setEntryTime] = useState('');
  const [entryPos, setEntryPos] = useState({ top: 0, left: 0 });

  // mini-modal entrega
  const [deliverMiniOpenFor, setDeliverMiniOpenFor] = useState(null);
  const [deliverDate, setDeliverDate] = useState('');
  const [deliverTime, setDeliverTime] = useState('');
  const [deliverPos, setDeliverPos] = useState({ top: 0, left: 0 });

  const isoFromDateTime = (dateStr, timeStr) => {
    if (!dateStr) return null;
    const t = timeStr || '00:00';
    return new Date(`${dateStr}T${t}:00`).toISOString();
  };

  const diffInDays = (startIso) => {
    if (!startIso) return '-';
    const start = new Date(startIso);
    const now = new Date();
    const ms = now.getTime() - start.getTime();
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    return `${days} dia(s) em estoque`;
  };

  const dispatchGlobalUpdate = async () => {
    await refreshAll();
    window.dispatchEvent(new Event('autenticco:cars-updated'));
  };

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
          const charged = Number(e.charged_value || 0);
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

    try {
      const [pubs, exps] = await Promise.all([
        getPublicationsByCar(car.id),
        getExpensesByCar(car.id),
      ]);
      setPublications(pubs || []);
      setExpenses(exps || []);
      setFinanceForm({
        fipe_value: car.fipe_value ?? '',
        commission: car.commission ?? '',
        return_to_seller: car.return_to_seller ?? '',
      });
    } catch (err) {
      console.error('Erro abrir modal', err);
      setPublications([]);
      setExpenses([]);
    }
  };

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
      await addPublication(payload);
      toast({ title: 'Registro salvo' });

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

  const handleSaveExpense = async () => {
    if (!selectedCar) return;
    try {
      const payload = {
        car_id: selectedCar.id,
        category: expenseForm.category || 'Outros',
        amount: expenseForm.amount ? Number(expenseForm.amount) : 0,
        charged_value: expenseForm.charged_value ? Number(expenseForm.charged_value) : null,
        incurred_at: expenseForm.incurred_at
          ? new Date(expenseForm.incurred_at).toISOString()
          : new Date().toISOString(),
        description: expenseForm.description || '',
      };

      await addExpense(payload);
      toast({ title: 'Gasto/Ganho salvo' });

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
      const return_to_seller =
        financeForm.return_to_seller !== '' ? Number(financeForm.return_to_seller) : 0;

      const estimated_profit =
        commission +
        Number(summary.extraChargedTotal || 0) -
        Number(summary.extraExpensesTotal || 0) -
        Number(summary.adSpendTotal || 0);

      await updateCar(selectedCar.id, {
        fipe_value,
        commission,
        return_to_seller,
        profit: estimated_profit,
      });

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

  // abrir mini-modal de entrada (com posição)
  const openEntryMini = (car, e) => {
    const d = car.entry_at ? new Date(car.entry_at) : new Date();
    setEntryDate(d.toISOString().slice(0, 10));
    setEntryTime(d.toTimeString().slice(0, 5));

    // posição do botão
    const rect = e.currentTarget.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const modalWidth = 280;
    let left = rect.left;
    if (left + modalWidth + 12 > viewportWidth) {
      left = viewportWidth - modalWidth - 12;
    }
    const top = rect.top + window.scrollY + 30;

    setEntryPos({ top, left });
    setEntryMiniOpenFor(car.id);
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

  // abrir mini-modal de entrega (com posição)
  const openDeliverMini = (car, e) => {
    const d = new Date();
    setDeliverDate(d.toISOString().slice(0, 10));
    setDeliverTime(d.toTimeString().slice(0, 5));

    const rect = e.currentTarget.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const modalWidth = 280;
    let left = rect.left;
    if (left + modalWidth + 12 > viewportWidth) {
      left = viewportWidth - modalWidth - 12;
    }
    const top = rect.top + window.scrollY + 30;

    setDeliverPos({ top, left });
    setDeliverMiniOpenFor(car.id);
  };

  const handleSaveDeliver = async () => {
    if (!deliverMiniOpenFor) return;
    try {
      const iso = isoFromDateTime(deliverDate, deliverTime);
      await updateCar(deliverMiniOpenFor, { delivered_at: iso });
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

  const brandOptions = useMemo(() => {
    const setB = new Set();
    (cars || []).forEach((c) => {
      if (c.brand) setB.add(c.brand);
    });
    return Array.from(setB).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [cars]);

  const filteredCars = useMemo(() => {
    const term = (searchTerm || '').trim().toLowerCase();
    return (cars || []).filter((c) => {
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
  }, [cars, searchTerm, brandFilter]);

  const marketplacePlatforms = (platforms || []).filter((p) => p.platform_type === 'marketplace');
  const socialPlatforms = (platforms || []).filter((p) => p.platform_type === 'social');

  return (
    <div className="space-y-4">
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
        <button
          onClick={() => {
            setSearchTerm('');
            setBrandFilter('');
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

          return (
            <div
              key={car.id}
              className="bg-white rounded-2xl shadow border flex flex-col md:flex-row justify-between gap-4 p-4"
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
                    {car.fipe_value ? (
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                        vs FIPE:{' '}
                        {(
                          (Number(car.price || 0) / Number(car.fipe_value)) * 100 -
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-gray-600">
                    Preço: <span className="font-semibold">{moneyBR(car.price)}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Placa: <span className="font-semibold">{car.plate || '-'}</span>
                  </p>

                  <div className="flex flex-wrap gap-2 mt-2 items-center">
                    <span className="text-xs text-gray-500">
                      Entrada: {car.entry_at ? new Date(car.entry_at).toLocaleString('pt-BR') : '-'}
                    </span>
                    <button
                      onClick={(e) => openEntryMini(car, e)}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <PenSquare className="w-3 h-3" /> editar
                    </button>
                    <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded">
                      {diffInDays(car.entry_at)}
                    </span>
                    <button
                      onClick={(e) => openDeliverMini(car, e)}
                      className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1"
                    >
                      Marcar como Entregue
                    </button>
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

      <Dialog
        open={open}
        onOpenChange={async (isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            await dispatchGlobalUpdate();
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
              onClick={() => setActiveTab('marketplaces')}
              className={`px-3 py-1 rounded ${
                activeTab === 'marketplaces' ? 'bg-yellow-400 text-black' : 'bg-gray-100'
              }`}
            >
              Anúncios (Marketplaces)
            </button>
            <button
              onClick={() => setActiveTab('social')}
              className={`px-3 py-1 rounded ${
                activeTab === 'social' ? 'bg-yellow-400 text-black' : 'bg-gray-100'
              }`}
            >
              Redes Sociais
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
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
                  Salvar anúncio
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
                        className="flex justify-between items-center border-b last:border-b-0 py-2"
                      >
                        <div>
                          <p className="text-sm font-semibold">{pf ? pf.name : '---'}</p>
                          <p className="text-xs text-gray-500">
                            Gasto: {moneyBR(p.spent)} | {p.status}
                          </p>
                        </div>
                        <button onClick={() => handleDeletePublication(p.id)}>
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

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
                  Salvar publicação
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
                        className="flex justify-between items-center border-b last:border-b-0 py-2"
                      >
                        <div>
                          <p className="text-sm font-semibold">{pf ? pf.name : '---'}</p>
                          <p className="text-xs text-gray-500">{p.link || 'Sem link'}</p>
                        </div>
                        <button onClick={() => handleDeletePublication(p.id)}>
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

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
                  onChange={(e) => setExpenseForm((p) => ({ ...p, charged_value: e.target.value }))}
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
                  Salvar gasto/ganho
                </Button>
              </div>

              <div className="border rounded-lg p-2 max-h-64 overflow-y-auto">
                {expenses.map((e) => (
                  <div
                    key={e.id}
                    className="flex justify-between items-center border-b last:border-b-0 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold">{e.category}</p>
                      <p className="text-xs text-gray-500">
                        Gasto: {moneyBR(e.amount)}{' '}
                        {e.charged_value ? `| Cobrado: ${moneyBR(e.charged_value)}` : ''}
                      </p>
                    </div>
                    <button onClick={() => handleDeleteExpense(e.id)}>
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <input
                  value={financeForm.fipe_value}
                  onChange={(e) => setFinanceForm((p) => ({ ...p, fipe_value: e.target.value }))}
                  placeholder="Valor FIPE"
                  type="number"
                  className="w-full border rounded px-2 py-2"
                />
                <input
                  value={financeForm.commission}
                  onChange={(e) => setFinanceForm((p) => ({ ...p, commission: e.target.value }))}
                  placeholder="Comissão (R$)"
                  type="number"
                  className="w-full border rounded px-2 py-2"
                />
                <input
                  value={financeForm.return_to_seller}
                  onChange={(e) =>
                    setFinanceForm((p) => ({ ...p, return_to_seller: e.target.value }))
                  }
                  placeholder="Devolver ao cliente (R$)"
                  type="number"
                  className="w-full border rounded px-2 py-2"
                />
                <Button onClick={handleSaveFinance} className="bg-yellow-400 text-black w-full">
                  Salvar financeiro
                </Button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <p className="font-semibold mb-2">Observação</p>
                <p>
                  Lucro estimado = Comissão + (soma de todos os <b>valores cobrados</b>) – Gastos
                  extras – Anúncios.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* mini-modal entrada (posicionado) */}
      {entryMiniOpenFor && (
        <div
          className="fixed z-[9999] bg-white rounded-xl shadow-lg p-4 w-[280px] space-y-3 border border-gray-200"
          style={{
            top: `${entryPos.top}px`,
            left: `${entryPos.left}px`,
          }}
        >
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

      {/* mini-modal entrega (posicionado) */}
      {deliverMiniOpenFor && (
        <div
          className="fixed z-[9999] bg-white rounded-xl shadow-lg p-4 w-[280px] space-y-3 border border-gray-200"
          style={{
            top: `${deliverPos.top}px`,
            left: `${deliverPos.left}px`,
          }}
        >
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
  );
};

export default VehicleManager;

