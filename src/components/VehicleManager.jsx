// src/components/VehicleManager.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Check, Trash2, Megaphone, Wallet, DollarSign, Instagram, Youtube, Globe, Music2, Pencil } from 'lucide-react';
import {
  getPublicationsByCar, addPublication, deletePublication, updatePublication,
  getExpensesByCar, addExpense, deleteExpense, updateExpense,
  getPlatforms,
  getPublicationsForCars, getExpensesForCars,
  updateCar, markCarAsDelivered
} from '@/lib/car-api';
import { supabase } from '@/lib/supabase';
import { getFipeValue } from '@/lib/fipe-api';

const Money = ({ value }) => {
  const v = Number(value || 0);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
};

// mapeia social icon
const SocialIcon = ({ name = '', link = '' }) => {
  const n = String(name || '').toLowerCase();
  const l = String(link || '').toLowerCase();
  if (n.includes('insta') || l.includes('instagram')) return <Instagram className="h-4 w-4 text-pink-600" />;
  if (n.includes('you') || l.includes('youtube')) return <Youtube className="h-4 w-4 text-red-600" />;
  if (n.includes('tiktok') || l.includes('tiktok')) return <Music2 className="h-4 w-4" />;
  return <Globe className="h-4 w-4" />;
};

const VehicleManager = ({ cars = [], refreshAll, openCar = null, onOpenHandled = () => {}, platforms: externalPlatforms = [] }) => {
  const [selectedCar, setSelectedCar] = useState(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('publications_market'); // publications_market | publications_social | expenses | finance
  const [platforms, setPlatforms] = useState(externalPlatforms || []);

  const [publications, setPublications] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [summaryMap, setSummaryMap] = useState({});

  const [pubForm, setPubForm] = useState({ platform_id: '', link: '', spent: '', status: 'active', published_at: '', notes: '' });
  const [expenseForm, setExpenseForm] = useState({ category: '', amount: '', charged_amount: '', description: '', incurred_at: '' });
  const [financeForm, setFinanceForm] = useState({ fipe_value: '', commission: '', return_to_seller: '' });

  // edição inline
  const [editingPubId, setEditingPubId] = useState(null);
  const [pubEdit, setPubEdit] = useState({});
  const [editingExpId, setEditingExpId] = useState(null);
  const [expEdit, setExpEdit] = useState({});

  // entrega
  const [deliverModal, setDeliverModal] = useState({ open: false, iso: '' });

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

  // agrega resumos
  useEffect(() => {
    const carIds = (Array.isArray(cars) ? cars.map(c => c.id) : []).filter(Boolean);
    if (carIds.length === 0) { setSummaryMap({}); return; }

    let mounted = true;
    (async () => {
      try {
        const [pubs, exps] = await Promise.all([
          getPublicationsForCars(carIds),
          getExpensesForCars(carIds)
        ]);

        const pfById = {};
        (platforms || []).forEach(p => { pfById[String(p.id)] = p; });

        const map = {};
        carIds.forEach(id => {
          map[id] = {
            adsCount: 0,
            adSpendTotal: 0,
            socialCount: 0,
            socialSet: new Set(),
            extraExpensesTotal: 0,
            extraGainsTotal: 0,
          };
        });

        (pubs || []).forEach(p => {
          const id = p.car_id;
          if (!map[id]) return;
          const pf = pfById[String(p.platform_id)] || null;
          const ptype = pf?.platform_type || null;

          if (ptype === 'marketplace') {
            map[id].adsCount += 1;
            map[id].adSpendTotal += Number(p.spent || 0);
          } else {
            map[id].socialCount += 1;
            const guessName = pf?.name || (p.link || '').split('/')[2] || 'rede';
            map[id].socialSet.add(guessName.toLowerCase());
          }
        });

        (exps || []).forEach(e => {
          const id = e.car_id;
          if (!map[id]) return;
          const amount = Number(e.amount || 0);
          const charged = Number(e.charged_amount || 0);
          map[id].extraExpensesTotal += amount;
          const diff = charged - amount;
          if (diff > 0) map[id].extraGainsTotal += diff;
        });

        const finalMap = {};
        Object.keys(map).forEach(id => {
          finalMap[id] = {
            adsCount: map[id].adsCount,
            adSpendTotal: map[id].adSpendTotal,
            socialCount: map[id].socialCount,
            socialList: Array.from(map[id].socialSet || []),
            extraExpensesTotal: map[id].extraExpensesTotal,
            extraGainsTotal: map[id].extraGainsTotal,
          };
        });

        if (mounted) setSummaryMap(finalMap);
      } catch (err) {
        console.error('Erro ao agregar resumos:', err);
      }
    })();

    return () => { mounted = false; };
  }, [cars, platforms]);

  // abertura via "abrir carro" externo
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

  const fetchAll = async (carId) => {
    if (!carId) return;
    try {
      const [pu, ex] = await Promise.all([
        getPublicationsByCar(carId),
        getExpensesByCar(carId)
      ]);
      setPublications(pu || []);
      setExpenses(ex || []);
    } catch (err) {
      console.error('Erro fetchAll:', err);
      setPublications([]);
      setExpenses([]);
    }
  };

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

  // PUBLICAÇÕES
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
        setPublications(prev => [data, ...prev]);
        setPubForm({ platform_id: '', link: '', spent: '', status: 'active', published_at: '', notes: '' });
        toast({ title: 'Publicação salva' });
      }
      await fetchAll(selectedCar.id);
      refreshAll && refreshAll();
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro ao salvar publicação', description: err.message || String(err), variant: 'destructive' });
    }
  };

  const startEditPub = (p) => {
    setEditingPubId(p.id);
    setPubEdit({
      platform_id: p.platform_id || '',
      link: p.link || '',
      status: p.status || 'active',
      spent: p.spent || '',
      published_at: p.published_at ? p.published_at.slice(0,10) : '',
      notes: p.notes || ''
    });
  };
  const saveEditPub = async () => {
    try {
      const patch = {
        platform_id: pubEdit.platform_id || null,
        link: pubEdit.link || null,
        status: pubEdit.status || 'active',
        spent: pubEdit.spent !== '' ? parseFloat(pubEdit.spent) : null,
        published_at: pubEdit.published_at ? new Date(pubEdit.published_at).toISOString() : null,
        notes: pubEdit.notes || null
      };
      await updatePublication(editingPubId, patch);
      toast({ title: 'Publicação atualizada' });
      setEditingPubId(null);
      await fetchAll(selectedCar.id);
      refreshAll && refreshAll();
    } catch (e) {
      toast({ title: 'Erro ao atualizar', description: String(e), variant: 'destructive' });
    }
  };

  const removePublication = async (id) => {
    try {
      await deletePublication(id);
      setPublications(prev => prev.filter(p => p.id !== id));
      toast({ title: 'Publicação removida' });
      await fetchAll(selectedCar.id);
      refreshAll && refreshAll();
    } catch (err) {
      toast({ title: 'Erro ao remover publicação', description: err.message || String(err), variant: 'destructive' });
    }
  };

  // GASTOS
  const submitExpense = async () => {
    if (!selectedCar) return;
    try {
      const payload = {
        car_id: selectedCar.id,
        category: expenseForm.category || 'Outros',
        amount: expenseForm.amount ? parseFloat(expenseForm.amount) : 0,
        charged_amount: expenseForm.charged_amount ? parseFloat(expenseForm.charged_amount) : null,
        description: expenseForm.description || '',
        incurred_at: expenseForm.incurred_at || new Date().toISOString()
      };
      const { data } = await addExpense(payload);
      if (data) {
        setExpenses(prev => [data, ...prev]);
        setExpenseForm({ category: '', amount: '', charged_amount: '', description: '', incurred_at: '' });
        toast({ title: 'Gasto registrado' });
      }
      await fetchAll(selectedCar.id);
      refreshAll && refreshAll();
    } catch (err) {
      toast({ title: 'Erro ao salvar gasto', description: err.message || String(err), variant: 'destructive' });
    }
  };

  const startEditExp = (e) => {
    setEditingExpId(e.id);
    setExpEdit({
      category: e.category || '',
      amount: e.amount || '',
      charged_amount: e.charged_amount || '',
      description: e.description || '',
      incurred_at: e.incurred_at ? e.incurred_at.slice(0,10) : ''
    });
  };
  const saveEditExp = async () => {
    try {
      const patch = {
        category: expEdit.category || 'Outros',
        amount: expEdit.amount !== '' ? parseFloat(expEdit.amount) : 0,
        charged_amount: expEdit.charged_amount !== '' ? parseFloat(expEdit.charged_amount) : null,
        description: expEdit.description || null,
        incurred_at: expEdit.incurred_at ? new Date(expEdit.incurred_at).toISOString() : null
      };
      await updateExpense(editingExpId, patch);
      toast({ title: 'Gasto atualizado' });
      setEditingExpId(null);
      await fetchAll(selectedCar.id);
      refreshAll && refreshAll();
    } catch (e) {
      toast({ title: 'Erro ao atualizar gasto', description: String(e), variant: 'destructive' });
    }
  };

  const removeExpense = async (id) => {
    try {
      await deleteExpense(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
      toast({ title: 'Gasto removido' });
      await fetchAll(selectedCar.id);
      refreshAll && refreshAll();
    } catch (err) {
      toast({ title: 'Erro ao remover gasto', description: err.message || String(err), variant: 'destructive' });
    }
  };

  // FINANCEIRO
  const computeProfitForSelected = () => {
    if (!selectedCar) return 0;
    const summary = summaryMap[selectedCar.id] || { adSpendTotal: 0, extraExpensesTotal: 0, extraGainsTotal: 0 };
    const comm = Number(financeForm.commission || selectedCar.commission || 0);
    const ad = Number(summary.adSpendTotal || 0);
    const extras = Number(summary.extraExpensesTotal || 0);
    const gains = Number(summary.extraGainsTotal || 0);
    const profit = comm + gains - (ad + extras);
    return profit;
  };

  const saveFinance = async () => {
    if (!selectedCar) return;
    try {
      const summary = summaryMap[selectedCar.id] || { adSpendTotal: 0, extraExpensesTotal: 0, extraGainsTotal: 0 };
      const fipe_value = financeForm.fipe_value !== '' ? parseFloat(financeForm.fipe_value) : null;
      const commission = financeForm.commission !== '' ? parseFloat(financeForm.commission) : 0;
      const return_to_seller = financeForm.return_to_seller !== '' ? parseFloat(financeForm.return_to_seller) : 0;

      const profit = commission + Number(summary.extraGainsTotal || 0) - ((summary.adSpendTotal || 0) + (summary.extraExpensesTotal || 0));

      const patch = { fipe_value, commission, return_to_seller, profit, profit_percent: null };
      const { error } = await updateCar(selectedCar.id, patch);
      if (error) throw error;

      setSelectedCar(prev => ({ ...(prev || {}), ...patch }));
      toast({ title: 'Financeiro atualizado com sucesso' });
      await fetchAll(selectedCar.id);
      refreshAll && refreshAll();
    } catch (err) {
      console.error('Erro ao salvar financeiro:', err);
      toast({ title: 'Erro ao salvar financeiro', description: err.message || String(err), variant: 'destructive' });
    }
  };

  const lookupFIPE = async () => {
    if (!selectedCar) return;
    try {
      const { brand, model, year, fuel } = selectedCar || {};
      const res = await getFipeValue({ brand, model, year, fuel });
      if (res?.value) {
        setFinanceForm(f => ({ ...f, fipe_value: res.value }));
        toast({ title: 'FIPE atualizada', description: `Valor: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(res.value)}` });
      } else {
        toast({ title: 'Não encontrado na FIPE', description: (res?.debug || []).join(' • '), variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Erro ao consultar FIPE', description: String(e), variant: 'destructive' });
    }
  };

  const getSummary = (carId) => summaryMap[carId] || { adsCount: 0, adSpendTotal: 0, socialCount: 0, socialList: [], extraExpensesTotal: 0, extraGainsTotal: 0 };

  // filtros listagem
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const filteredCars = useMemo(() => {
    const term = (searchTerm || '').trim().toLowerCase();
    return (cars || []).filter(c => {
      if (brandFilter && brandFilter !== 'ALL' && String((c.brand || '')).toLowerCase() !== String(brandFilter).toLowerCase()) return false;
      if (!term) return c.is_available !== false; // só estoque atual
      const brand = (c.brand || '').toLowerCase();
      const model = (c.model || '').toLowerCase();
      const plate = (c.plate || '').toLowerCase();
      const combo = `${brand} ${model} ${plate}`;
      return (c.is_available !== false) && (brand.includes(term) || model.includes(term) || plate.includes(term) || combo.includes(term));
    });
  }, [cars, searchTerm, brandFilter]);

  // plataformas
  const pfById = {};
  (platforms || []).forEach(p => { pfById[String(p.id)] = p; });
  const marketplacePlatforms = (platforms || []).filter(p => p.platform_type === 'marketplace');
  const socialPlatforms = (platforms || []).filter(p => p.platform_type === 'social');

  // helpers de datas estoque/entrega
  const formatDateTime = (iso) => {
    try { return new Date(iso).toLocaleString('pt-BR'); } catch { return '-'; }
  };
  const daysInStock = (car) => {
    const base = car?.stock_entry_at ? new Date(car.stock_entry_at) : (car?.created_at ? new Date(car.created_at) : null);
    if (!base) return '-';
    const diff = (Date.now() - base.getTime()) / (1000 * 60 * 60 * 24);
    return `${Math.max(0, Math.floor(diff))} dia(s) em estoque`;
  };

  // UI
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Gestão de Veículos</h2>

      <div className="mb-4 flex flex-col md:flex-row gap-2 items-center">
        <input placeholder="Pesquisar marca, modelo ou PLACA..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full md:w-1/2 p-2 border rounded" />
        <select value={brandFilter || 'ALL'} onChange={(e) => setBrandFilter(e.target.value === 'ALL' ? '' : e.target.value)} className="w-full md:w-1/4 p-2 border rounded">
          <option value="ALL">Todas as marcas</option>
          {Array.from(new Set((cars || []).map(c => (c.brand || '').trim()).filter(Boolean))).map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <div className="ml-auto">
          <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setBrandFilter(''); }}>Limpar</Button>
        </div>
      </div>

      <div className="space-y-4">
        {Array.isArray(filteredCars) && filteredCars.map(car => {
          const summary = getSummary(car.id);
          const sold = !!car.is_sold || car.is_available === false;
          const profit = Number((car.commission ?? 0) + (summary.extraGainsTotal || 0) - ((summary.adSpendTotal || 0) + (summary.extraExpensesTotal || 0)));
          const fipe = Number(car.fipe_value || 0);
          const price = Number(car.price || 0);
          const diffPct = fipe > 0 ? ((price - fipe) / fipe) * 100 : null;

          // edição de "entrada" (stock_entry_at)
          const [editingEntry, setEditingEntry] = useState(false);
          const [entryDate, setEntryDate] = useState(car.stock_entry_at ? car.stock_entry_at.slice(0,16) : '');

          const saveEntry = async () => {
            try {
              const iso = entryDate ? new Date(entryDate).toISOString() : new Date().toISOString();
              await updateCar(car.id, { stock_entry_at: iso });
              toast({ title: 'Data de entrada atualizada' });
              setEditingEntry(false);
              refreshAll && refreshAll();
            } catch (e) {
              toast({ title: 'Erro ao salvar entrada', description: String(e), variant: 'destructive' });
            }
          };

          return (
            <div key={car.id} className={`bg-white rounded-xl p-4 flex items-center justify-between shadow transition hover:shadow-lg ${sold ? 'opacity-80' : ''}`}>
              <div className="flex items-start gap-4">
                <img src={car.main_photo_url || 'https://placehold.co/96x64/e2e8f0/4a5568?text=Sem+Foto'} alt={`${car.brand} ${car.model}`} className={`h-20 w-28 object-cover rounded-md ${sold ? 'filter grayscale brightness-75' : ''}`} />
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div>
                      <div className="font-bold text-lg">{car.brand} {car.model} <span className="text-sm text-gray-500">({car.year})</span></div>
                      <div className="text-xs text-gray-600">{car.plate ? `Placa: ${car.plate}` : 'Placa: -'}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Preço: <span className="font-semibold">{Money({ value: car.price })}</span>
                        {diffPct !== null && (
                          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${diffPct >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            vs FIPE: {diffPct >= 0 ? '+' : ''}{diffPct.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    {sold && <span className="ml-2 text-sm bg-red-600 text-white px-2 py-0.5 rounded-full font-semibold">VENDIDO</span>}
                  </div>

                  {/* Entrada / dias / entregue */}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                    <span>Entrada: {formatDateTime(car.stock_entry_at || car.created_at)}</span>
                    {!editingEntry ? (
                      <button className="text-blue-600 underline" onClick={() => {
                        const base = (car.stock_entry_at || car.created_at) ? new Date(car.stock_entry_at || car.created_at) : new Date();
                        const local = new Date(base.getTime() - base.getTimezoneOffset()*60000).toISOString().slice(0,16);
                        setEntryDate(local);
                        setEditingEntry(true);
                      }}>editar</button>
                    ) : (
                      <span className="flex items-center gap-2">
                        <input type="datetime-local" value={entryDate} onChange={(e)=>setEntryDate(e.target.value)} className="border rounded px-1 py-0.5"/>
                        <Button size="xs" onClick={saveEntry}>Salvar</Button>
                        <Button size="xs" variant="ghost" onClick={()=>setEditingEntry(false)}>Cancelar</Button>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{daysInStock(car)}</span>

                    <Button size="xs" className="bg-green-600 text-white hover:brightness-95" onClick={()=>{
                      const nowLocal = new Date(Date.now() - new Date().getTimezoneOffset()*60000).toISOString().slice(0,16);
                      setDeliverModal({ open: true, iso: nowLocal }); setSelectedCar(car);
                    }}>Marcar como Entregue</Button>
                    {car.delivered_at && <span className="text-gray-500">Entregue: {formatDateTime(car.delivered_at)}</span>}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Megaphone className="h-4 w-4 text-yellow-500" />
                      <div>
                        <div className="text-xs">Anúncios</div>
                        <div className="font-medium">{summary.adsCount} • {Money({ value: summary.adSpendTotal })}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1">
                        {summary.socialList.slice(0,3).map((nm, i) => (
                          <div key={`${nm}-${i}`} className="inline-flex items-center">
                            <SocialIcon name={nm} />
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className="text-xs">Publicações</div>
                        <div className="font-medium">{summary.socialCount}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-red-500" />
                      <div>
                        <div className="text-xs">Gastos extras</div>
                        <div className="font-medium">{Money({ value: summary.extraExpensesTotal })}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-green-600" />
                      <div>
                        <div className="text-xs">Ganhos extras</div>
                        <div className="font-medium">{Money({ value: summary.extraGainsTotal })}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-indigo-600" />
                      <div>
                        <div className="text-xs">Lucro estimado</div>
                        <div className={`font-semibold ${(profit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{Money({ value: profit })}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs">FIPE</div>
                      <div className="font-medium">{car.fipe_value ? Money({ value: car.fipe_value }) : '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs">Comissão</div>
                      <div className="font-medium">{car.commission ? Money({ value: car.commission }) : '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs">Devolver</div>
                      <div className="font-medium">{car.return_to_seller ? Money({ value: car.return_to_seller }) : '-'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleOpenFromList(car)}>Gerenciar</Button>
                </div>
                <div className="text-xs text-gray-500">Última atualização: {car.updated_at ? new Date(car.updated_at).toLocaleDateString() : '-'}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL PRINCIPAL */}
      <Dialog open={open} onOpenChange={(o) => { 
        if (!o) { setSelectedCar(null); refreshAll && refreshAll(); }
        setOpen(o); 
      }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Gestão - {selectedCar ? `${selectedCar.brand} ${selectedCar.model} ${selectedCar.plate ? `(${selectedCar.plate})` : ''}` : ''}</DialogTitle>
            <DialogDescription>Publicações, gastos e financeiro por veículo</DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <div className="flex gap-2 mb-4">
              <button onClick={() => setTab('publications_market')} className={`px-3 py-1 rounded ${tab === 'publications_market' ? 'bg-yellow-400 text-black' : 'bg-gray-100'}`}>Anúncios (Marketplaces)</button>
              <button onClick={() => setTab('publications_social')} className={`px-3 py-1 rounded ${tab === 'publications_social' ? 'bg-yellow-400 text-black' : 'bg-gray-100'}`}>Redes Sociais</button>
              <button onClick={() => setTab('expenses')} className={`px-3 py-1 rounded ${tab === 'expenses' ? 'bg-yellow-400 text-black' : 'bg-gray-100'}`}>Gastos</button>
              <button onClick={() => setTab('finance')} className={`px-3 py-1 rounded ${tab === 'finance' ? 'bg-yellow-400 text-black' : 'bg-gray-100'}`}>Financeiro</button>
            </div>

            {tab === 'publications_market' && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <select value={pubForm.platform_id} onChange={(e) => setPubForm(f => ({ ...f, platform_id: e.target.value }))} className="w-full p-2 border rounded">
                      <option value="">Plataforma (Marketplaces)</option>
                      {marketplacePlatforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input placeholder="Gasto (R$)" type="number" value={pubForm.spent} onChange={(e) => setPubForm(f => ({ ...f, spent: e.target.value }))} className="w-full p-2 border rounded" />
                    <input placeholder="Link do anúncio" value={pubForm.link} onChange={(e) => setPubForm(f => ({ ...f, link: e.target.value }))} className="w-full p-2 border rounded" />
                    <div className="flex gap-2 items-center">
                      <select value={pubForm.status} onChange={(e) => setPubForm(f => ({ ...f, status: e.target.value }))} className="p-2 border rounded">
                        <option value="active">Ativo</option>
                        <option value="paused">Pausado</option>
                        <option value="finished">Finalizado</option>
                        <option value="draft">Rascunho</option>
                      </select>
                      <Button size="sm" onClick={submitPublication}>Salvar anúncio</Button>
                    </div>
                  </div>

                  <div>
                    <div className="space-y-2 max-h-64 overflow-auto">
                      {publications
                        .filter(p => {
                          const pf = pfById[String(p.platform_id)];
                          return (pf?.platform_type === 'marketplace');
                        })
                        .map(pub => {
                          const pf = pfById[String(pub.platform_id)];
                          const isEditing = editingPubId === pub.id;
                          return (
                            <div key={pub.id} className="bg-white p-3 border rounded">
                              {!isEditing ? (
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium">{pf?.name || '(sem título)'}</div>
                                    <div className="text-xs text-gray-500">{pub.link ? <a className="text-blue-600" href={pub.link} target="_blank" rel="noreferrer">Ver anúncio</a> : 'Sem link'}</div>
                                    <div className="text-xs text-gray-500">{pub.status} • Gasto: {Money({ value: pub.spent })}</div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => startEditPub(pub)} className="text-gray-700"><Pencil /></button>
                                    <button onClick={() => removePublication(pub.id)} className="text-red-600"><Trash2 /></button>
                                  </div>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                                  <select value={pubEdit.platform_id} onChange={(e)=>setPubEdit(v=>({...v, platform_id: e.target.value}))} className="p-2 border rounded md:col-span-2">
                                    <option value="">Plataforma</option>
                                    {marketplacePlatforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                  </select>
                                  <input placeholder="Link" value={pubEdit.link} onChange={(e)=>setPubEdit(v=>({...v, link: e.target.value}))} className="p-2 border rounded md:col-span-2"/>
                                  <select value={pubEdit.status} onChange={(e)=>setPubEdit(v=>({...v, status: e.target.value}))} className="p-2 border rounded">
                                    <option value="active">Ativo</option>
                                    <option value="paused">Pausado</option>
                                    <option value="finished">Finalizado</option>
                                    <option value="draft">Rascunho</option>
                                  </select>
                                  <input type="number" placeholder="Gasto" value={pubEdit.spent} onChange={(e)=>setPubEdit(v=>({...v, spent: e.target.value}))} className="p-2 border rounded"/>
                                  <input type="date" value={pubEdit.published_at} onChange={(e)=>setPubEdit(v=>({...v, published_at: e.target.value}))} className="p-2 border rounded"/>
                                  <input placeholder="Notas" value={pubEdit.notes} onChange={(e)=>setPubEdit(v=>({...v, notes: e.target.value}))} className="p-2 border rounded md:col-span-3"/>
                                  <div className="flex gap-2 justify-end md:col-span-5">
                                    <Button size="sm" onClick={saveEditPub}>Salvar</Button>
                                    <Button size="sm" variant="ghost" onClick={()=>setEditingPubId(null)}>Cancelar</Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'publications_social' && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <select value={pubForm.platform_id} onChange={(e) => setPubForm(f => ({ ...f, platform_id: e.target.value }))} className="w-full p-2 border rounded">
                      <option value="">Plataforma (Redes Sociais)</option>
                      {socialPlatforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input placeholder="Link (post / reel / video)" value={pubForm.link} onChange={(e) => setPubForm(f => ({ ...f, link: e.target.value }))} className="w-full p-2 border rounded" />
                    <input placeholder="Observações" value={pubForm.notes} onChange={(e) => setPubForm(f => ({ ...f, notes: e.target.value }))} className="w-full p-2 border rounded" />
                    <div className="flex gap-2 items-center">
                      <select value={pubForm.status} onChange={(e) => setPubForm(f => ({ ...f, status: e.target.value }))} className="p-2 border rounded">
                        <option value="active">Publicado</option>
                        <option value="draft">Rascunho</option>
                      </select>
                      <Button size="sm" onClick={submitPublication}>Salvar publicação</Button>
                    </div>
                  </div>

                  <div>
                    <div className="space-y-2 max-h-64 overflow-auto">
                      {publications
                        .filter(p => {
                          const pf = pfById[String(p.platform_id)];
                          return (pf?.platform_type === 'social');
                        })
                        .map(pub => {
                          const pf = pfById[String(pub.platform_id)];
                          const isEditing = editingPubId === pub.id;
                          return (
                            <div key={pub.id} className="bg-white p-3 border rounded">
                              {!isEditing ? (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <SocialIcon name={pf?.name} link={pub.link} />
                                    <div>
                                      <div className="font-medium">{pf?.name || '(sem título)'}</div>
                                      <div className="text-xs text-gray-500">{pub.link ? <a className="text-blue-600" href={pub.link} target="_blank" rel="noreferrer">Ver post</a> : 'Sem link'}</div>
                                      <div className="text-xs text-gray-500">{pub.status}</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => startEditPub(pub)} className="text-gray-700"><Pencil /></button>
                                    <button onClick={() => removePublication(pub.id)} className="text-red-600"><Trash2 /></button>
                                  </div>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                                  <select value={pubEdit.platform_id} onChange={(e)=>setPubEdit(v=>({...v, platform_id: e.target.value}))} className="p-2 border rounded md:col-span-2">
                                    <option value="">Plataforma</option>
                                    {socialPlatforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                  </select>
                                  <input placeholder="Link" value={pubEdit.link} onChange={(e)=>setPubEdit(v=>({...v, link: e.target.value}))} className="p-2 border rounded md:col-span-2"/>
                                  <select value={pubEdit.status} onChange={(e)=>setPubEdit(v=>({...v, status: e.target.value}))} className="p-2 border rounded">
                                    <option value="active">Publicado</option>
                                    <option value="draft">Rascunho</option>
                                  </select>
                                  <input placeholder="Notas" value={pubEdit.notes} onChange={(e)=>setPubEdit(v=>({...v, notes: e.target.value}))} className="p-2 border rounded md:col-span-4"/>
                                  <div className="flex gap-2 justify-end md:col-span-5">
                                    <Button size="sm" onClick={saveEditPub}>Salvar</Button>
                                    <Button size="sm" variant="ghost" onClick={()=>setEditingPubId(null)}>Cancelar</Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'expenses' && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input placeholder="Categoria (ex: Documentação)" value={expenseForm.category} onChange={(e) => setExpenseForm(f => ({ ...f, category: e.target.value }))} className="p-2 border rounded" />
                  <input placeholder="Valor gasto (R$)" type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm(f => ({ ...f, amount: e.target.value }))} className="p-2 border rounded" />
                  <input placeholder="Valor cobrado (R$)" type="number" value={expenseForm.charged_amount} onChange={(e) => setExpenseForm(f => ({ ...f, charged_amount: e.target.value }))} className="p-2 border rounded" />
                  <input placeholder="Data" type="date" value={expenseForm.incurred_at ? expenseForm.incurred_at.slice(0,10) : ''} onChange={(e) => setExpenseForm(f => ({ ...f, incurred_at: e.target.value ? new Date(e.target.value).toISOString() : '' }))} className="p-2 border rounded" />
                  <input placeholder="Descrição" value={expenseForm.description} onChange={(e) => setExpenseForm(f => ({ ...f, description: e.target.value }))} className="p-2 border rounded md:col-span-2" />
                  <div className="col-span-full flex gap-2">
                    <Button onClick={submitExpense}>Registrar gasto</Button>
                  </div>
                </div>

                <div className="space-y-2 max-h-64 overflow-auto">
                  {expenses.map(exp => {
                    const isEditing = editingExpId === exp.id;
                    const diff = Number(exp.charged_amount || 0) - Number(exp.amount || 0);
                    return (
                      <div key={exp.id} className="bg-white p-3 border rounded">
                        {!isEditing ? (
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{exp.category} — {Money({ value: exp.amount })}{typeof exp.charged_amount === 'number' ? ` • Cobrado: ${Money({ value: exp.charged_amount })}` : ''}</div>
                              <div className="text-xs text-gray-500">{exp.description}</div>
                              <div className="text-xs text-gray-400">{exp.incurred_at ? new Date(exp.incurred_at).toLocaleDateString() : ''} {diff>0 ? `• Ganho: ${Money({ value: diff })}` : ''}</div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => startEditExp(exp)} className="text-gray-700"><Pencil /></button>
                              <button onClick={() => removeExpense(exp.id)} className="text-red-600"><Trash2 /></button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
                            <input placeholder="Categoria" value={expEdit.category} onChange={(e)=>setExpEdit(v=>({...v, category: e.target.value}))} className="p-2 border rounded"/>
                            <input type="number" placeholder="Gasto" value={expEdit.amount} onChange={(e)=>setExpEdit(v=>({...v, amount: e.target.value}))} className="p-2 border rounded"/>
                            <input type="number" placeholder="Cobrado" value={expEdit.charged_amount} onChange={(e)=>setExpEdit(v=>({...v, charged_amount: e.target.value}))} className="p-2 border rounded"/>
                            <input type="date" value={expEdit.incurred_at} onChange={(e)=>setExpEdit(v=>({...v, incurred_at: e.target.value}))} className="p-2 border rounded"/>
                            <input placeholder="Descrição" value={expEdit.description} onChange={(e)=>setExpEdit(v=>({...v, description: e.target.value}))} className="p-2 border rounded md:col-span-2"/>
                            <div className="flex gap-2 justify-end md:col-span-6">
                              <Button size="sm" onClick={saveEditExp}>Salvar</Button>
                              <Button size="sm" variant="ghost" onClick={()=>setEditingExpId(null)}>Cancelar</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {tab === 'finance' && selectedCar && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm text-gray-700">Valor FIPE</label>
                    <div className="flex gap-2">
                      <input type="number" step="0.01" value={financeForm.fipe_value ?? ''} onChange={(e) => setFinanceForm(f => ({ ...f, fipe_value: e.target.value }))} className="w-full p-2 border rounded" />
                      <Button variant="outline" onClick={lookupFIPE}>Buscar na FIPE</Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-700">Comissão (R$)</label>
                    <input type="number" step="0.01" value={financeForm.commission ?? ''} onChange={(e) => setFinanceForm(f => ({ ...f, commission: e.target.value }))} className="w-full p-2 border rounded" />
                  </div>

                  <div>
                    <label className="text-sm text-gray-700">Devolver ao vendedor (R$)</label>
                    <input type="number" step="0.01" value={financeForm.return_to_seller ?? ''} onChange={(e) => setFinanceForm(f => ({ ...f, return_to_seller: e.target.value }))} className="w-full p-2 border rounded" />
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-600">Resumo de gastos registrados para este veículo</div>
                  <div className="mt-2 flex gap-4 flex-wrap">
                    <div className="text-sm">Gasto com anúncios: <strong>{Money({ value: (summaryMap[selectedCar.id] || {}).adSpendTotal || 0 })}</strong></div>
                    <div className="text-sm">Gastos extras: <strong>{Money({ value: (summaryMap[selectedCar.id] || {}).extraExpensesTotal || 0 })}</strong></div>
                    <div className="text-sm">Ganhos extras: <strong>{Money({ value: (summaryMap[selectedCar.id] || {}).extraGainsTotal || 0 })}</strong></div>
                    <div className="text-sm">Lucro calculado: <strong className={`${computeProfitForSelected() >= 0 ? 'text-green-600' : 'text-red-600'}`}>{Money({ value: computeProfitForSelected() })}</strong></div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => { setOpen(false); setSelectedCar(null); refreshAll && refreshAll(); }}>Fechar</Button>
                  <Button onClick={saveFinance}>Salvar Financeiro</Button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setOpen(false); setSelectedCar(null); refreshAll && refreshAll(); }}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL ENTREGA */}
      <Dialog open={deliverModal.open} onOpenChange={(o)=>setDeliverModal(s=>({...s, open:o}))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar entrega</DialogTitle>
            <DialogDescription>Informe data e hora da entrega do veículo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <input type="datetime-local" value={deliverModal.iso} onChange={(e)=>setDeliverModal(s=>({...s, iso:e.target.value}))} className="border rounded px-2 py-2 w-full"/>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={()=>setDeliverModal({open:false, iso:''})}>Cancelar</Button>
              <Button onClick={async ()=>{
                try{
                  const iso = new Date(deliverModal.iso).toISOString();
                  await markCarAsDelivered(selectedCar.id, iso);
                  toast({ title: 'Entrega registrada' });
                  setDeliverModal({open:false, iso:''});
                  refreshAll && refreshAll();
                }catch(e){
                  toast({ title: 'Erro ao marcar entregue', description: String(e), variant:'destructive' });
                }
              }}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VehicleManager;

