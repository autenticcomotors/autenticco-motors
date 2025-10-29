// src/components/VehicleManager.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Trash2, Megaphone, Wallet, DollarSign } from 'lucide-react';
import {
  getPublicationsByCar, addPublication, deletePublication,
  getExpensesByCar, addExpense, deleteExpense,
  getPlatforms, addPlatform,
  getPublicationsForCars, getExpensesForCars,
  updateCar
} from '@/lib/car-api';
import { supabase } from '@/lib/supabase';

const Money = ({ value }) => {
  const v = Number(value || 0);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
};

const VehicleManager = ({ cars = [], refreshAll, openCar = null, onOpenHandled = () => {}, platforms: externalPlatforms = [] }) => {
  const [selectedCar, setSelectedCar] = useState(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('publications_market'); // publications_market | publications_social | expenses | finance
  const [platforms, setPlatforms] = useState(externalPlatforms || []);

  const [publications, setPublications] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [summaryMap, setSummaryMap] = useState({});

  // formulário de publicações (sem orçamento)
  const [pubForm, setPubForm] = useState({ platform_id: '', platform_type: '', link: '', spent: '', status: 'draft', published_at: '', notes: '' });
  const [expenseForm, setExpenseForm] = useState({ category: '', amount: '', description: '', incurred_at: '' });
  const [financeForm, setFinanceForm] = useState({ fipe_value: '', commission: '', return_to_seller: '' });
  const [newPlatformName, setNewPlatformName] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('');

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

  useEffect(() => {
    const carIds = (Array.isArray(cars) ? cars.map(c => c.id) : []).filter(Boolean);
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

        const map = {};
        carIds.forEach(id => { map[id] = { pubCount: 0, adSpendTotal: 0, extraExpensesTotal: 0 }; });

        (pubs || []).forEach(p => {
          const id = p.car_id;
          if (!map[id]) map[id] = { pubCount: 0, adSpendTotal: 0, extraExpensesTotal: 0 };
          map[id].pubCount += 1;
          map[id].adSpendTotal += Number(p.spent || 0);
        });

        (exps || []).forEach(e => {
          const id = e.car_id;
          if (!map[id]) map[id] = { pubCount: 0, adSpendTotal: 0, extraExpensesTotal: 0 };
          map[id].extraExpensesTotal += Number(e.amount || 0);
        });

        if (mounted) setSummaryMap(map);
      } catch (err) {
        console.error('Erro ao agregar resumos:', err);
      }
    })();

    return () => { mounted = false; };
  }, [cars]);

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

  // PUBLICAÇÕES
  const submitPublication = async () => {
    if (!selectedCar) return;
    try {
      const platform = platforms.find(p => String(p.id) === String(pubForm.platform_id));
      const payload = {
        car_id: selectedCar.id,
        platform_id: pubForm.platform_id || null,
        platform_name: platform ? platform.name : null,
        platform_type: platform ? platform.platform_type : (pubForm.platform_type || null),
        link: pubForm.link || null,
        status: pubForm.status || 'draft',
        spent: pubForm.spent ? parseFloat(pubForm.spent) : null,
        published_at: pubForm.published_at || null,
        notes: pubForm.notes || null
      };
      const { data, error } = await addPublication(payload);
      if (error) throw error;
      if (data) {
        setPublications(prev => [data, ...prev]);
        setPubForm({ platform_id: '', platform_type: '', link: '', spent: '', status: 'draft', published_at: '', notes: '' });
        toast({ title: 'Publicação adicionada' });
      }
      await fetchAll(selectedCar.id);
      if (refreshAll) refreshAll();
    } catch (err) {
      console.error('Erro ao adicionar publicação:', err);
      toast({ title: 'Erro ao salvar publicação', description: err.message || String(err), variant: 'destructive' });
    }
  };

  const removePublication = async (id) => {
    try {
      await deletePublication(id);
      setPublications(prev => prev.filter(p => p.id !== id));
      toast({ title: 'Publicação removida' });
      await fetchAll(selectedCar.id);
      if (refreshAll) refreshAll();
    } catch (err) {
      toast({ title: 'Erro ao remover publicação', description: err.message || String(err), variant: 'destructive' });
    }
  };

  // EXPENSES
  const submitExpense = async () => {
    if (!selectedCar) return;
    try {
      const payload = {
        car_id: selectedCar.id,
        category: expenseForm.category || 'Outros',
        amount: expenseForm.amount ? parseFloat(expenseForm.amount) : 0,
        description: expenseForm.description || '',
        incurred_at: expenseForm.incurred_at || new Date().toISOString()
      };
      const { data } = await addExpense(payload);
      if (data) {
        setExpenses(prev => [data, ...prev]);
        setExpenseForm({ category: '', amount: '', description: '', incurred_at: '' });
        toast({ title: 'Gasto registrado' });
      }
      await fetchAll(selectedCar.id);
      if (refreshAll) refreshAll();
    } catch (err) {
      console.error('Erro ao salvar gasto:', err);
      toast({ title: 'Erro ao salvar gasto', description: err.message || String(err), variant: 'destructive' });
    }
  };

  // FINANCE
  const computeProfitForSelected = () => {
    if (!selectedCar) return 0;
    const summary = summaryMap[selectedCar.id] || { adSpendTotal: 0, extraExpensesTotal: 0 };
    const comm = Number(financeForm.commission || selectedCar.commission || 0);
    const ad = Number(summary.adSpendTotal || 0);
    const extras = Number(summary.extraExpensesTotal || 0);
    const profit = comm - (ad + extras);
    return profit;
  };

  const saveFinance = async () => {
    if (!selectedCar) return;
    try {
      const summary = summaryMap[selectedCar.id] || { adSpendTotal: 0, extraExpensesTotal: 0 };
      const fipe_value = financeForm.fipe_value ? parseFloat(financeForm.fipe_value) : null;
      const commission = financeForm.commission ? parseFloat(financeForm.commission) : 0;
      const return_to_seller = financeForm.return_to_seller ? parseFloat(financeForm.return_to_seller) : 0;

      const adSpendTotal = Number(summary.adSpendTotal || 0);
      const extraExpensesTotal = Number(summary.extraExpensesTotal || 0);

      const profit = commission - (adSpendTotal + extraExpensesTotal);
      const patch = {
        fipe_value,
        commission,
        return_to_seller,
        profit,
        profit_percent: null
      };

      const { data, error } = await updateCar(selectedCar.id, patch);
      if (error) throw error;

      const updated = { ...(selectedCar || {}), ...patch };
      setSelectedCar(updated);

      toast({ title: 'Financeiro atualizado com sucesso' });
      await fetchAll(selectedCar.id);
      if (refreshAll) refreshAll();
    } catch (err) {
      console.error('Erro ao salvar financeiro:', err);
      toast({ title: 'Erro ao salvar financeiro', description: err.message || String(err), variant: 'destructive' });
    }
  };

  const getSummary = (carId) => summaryMap[carId] || { pubCount: 0, adSpendTotal: 0, extraExpensesTotal: 0 };

  const marketplacePlatforms = (platforms || []).filter(p => p.platform_type === 'marketplace');
  const socialPlatforms = (platforms || []).filter(p => p.platform_type === 'social');

  const filteredCars = useMemo(() => {
    const term = (searchTerm || '').trim().toLowerCase();
    return (cars || []).filter(c => {
      if (brandFilter && brandFilter !== 'ALL' && String((c.brand || '')).toLowerCase() !== String(brandFilter).toLowerCase()) return false;
      if (!term) return true;
      const brand = (c.brand || '').toLowerCase();
      const model = (c.model || '').toLowerCase();
      return brand.includes(term) || model.includes(term) || `${brand} ${model}`.includes(term);
    });
  }, [cars, searchTerm, brandFilter]);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Gestão de Veículos</h2>

      <div className="mb-4 flex flex-col md:flex-row gap-2 items-center">
        <input placeholder="Pesquisar marca ou modelo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full md:w-1/2 p-2 border rounded" />
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
          const profit = Number(car.profit ?? ((car.commission ?? 0) - (summary.adSpendTotal + summary.extraExpensesTotal)));
          const profitDisplay = Number.isFinite(profit) ? profit : null;

          return (
            <div key={car.id} className={`bg-white rounded-xl p-4 flex items-center justify-between shadow transition hover:shadow-lg ${sold ? 'opacity-80' : ''}`}>
              <div className="flex items-start gap-4">
                <img src={car.main_photo_url || 'https://placehold.co/96x64/e2e8f0/4a5568?text=Sem+Foto'} alt={`${car.brand} ${car.model}`} className={`h-20 w-28 object-cover rounded-md ${sold ? 'filter grayscale brightness-75' : ''}`} />
                <div>
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-bold text-lg">{car.brand} {car.model} <span className="text-sm text-gray-500">({car.year})</span></div>
                      <div className="text-sm text-gray-600">Preço: <span className="font-semibold">{Money({ value: car.price })}</span></div>
                    </div>
                    {sold && <span className="ml-2 text-sm bg-red-600 text-white px-2 py-0.5 rounded-full font-semibold">VENDIDO</span>}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Megaphone className="h-4 w-4 text-yellow-500" />
                      <div>
                        <div className="text-xs">Anúncios</div>
                        <div className="font-medium">{summary.pubCount} • {Money({ value: summary.adSpendTotal })}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-green-500" />
                      <div>
                        <div className="text-xs">Gastos extras</div>
                        <div className="font-medium">{Money({ value: summary.extraExpensesTotal })}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-indigo-600" />
                      <div>
                        <div className="text-xs">Lucro estimado</div>
                        <div className={`font-semibold ${profitDisplay >= 0 ? 'text-green-600' : 'text-red-600'}`}>{profitDisplay !== null ? Money({ value: profitDisplay }) : '-'}</div>
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
                  <Button size="sm" variant="outline" onClick={() => { setSelectedCar(car); setOpen(true); setTab('publications_market'); fetchAll(car.id); }}>Gerenciar</Button>
                </div>
                <div className="text-xs text-gray-500">Última atualização: {car.updated_at ? new Date(car.updated_at).toLocaleDateString() : '-'}</div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={(o) => { if (!o) { setSelectedCar(null); } setOpen(o); }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Gestão - {selectedCar ? `${selectedCar.brand} ${selectedCar.model}` : ''}</DialogTitle>
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
                        <option value="draft">Rascunho</option>
                        <option value="active">Ativo</option>
                        <option value="paused">Pausado</option>
                        <option value="finished">Finalizado</option>
                      </select>
                      <Button size="sm" onClick={submitPublication}>Salvar anúncio</Button>
                    </div>
                  </div>

                  <div>
                    <div className="flex gap-2 mb-3">
                      <input placeholder="Nova plataforma" value={newPlatformName} onChange={(e) => setNewPlatformName(e.target.value)} className="w-full p-2 border rounded" />
                      <Button size="sm" onClick={async () => {
                        const created = await addPlatform(newPlatformName.trim());
                        if (created) {
                          setPlatforms(prev => [...prev, created]);
                          setNewPlatformName('');
                          toast({ title: 'Plataforma criada' });
                        }
                      }}>Criar</Button>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-auto">
                      {publications.filter(p => (p.platform_type === 'marketplace' || (p.platform_id && marketplacePlatforms.find(mp => String(mp.id) === String(p.platform_id))))).map(pub => (
                        <div key={pub.id} className="bg-white p-3 border rounded flex items-center justify-between">
                          <div>
                            <div className="font-medium">{pub.platform_name || '(sem título)'}</div>
                            <div className="text-xs text-gray-500">{pub.link ? <a className="text-blue-600" href={pub.link} target="_blank" rel="noreferrer">Ver anúncio</a> : 'Sem link'}</div>
                            <div className="text-xs text-gray-500">{pub.status || '—'} • {pub.published_at ? new Date(pub.published_at).toLocaleDateString() : ''} • Gasto: {Money({ value: pub.spent })}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => removePublication(pub.id)} className="text-red-600"><Trash2 /></button>
                          </div>
                        </div>
                      ))}
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
                        <option value="draft">Rascunho</option>
                        <option value="active">Publicado</option>
                      </select>
                      <Button size="sm" onClick={submitPublication}>Salvar publicação</Button>
                    </div>
                  </div>

                  <div>
                    <div className="space-y-2 max-h-64 overflow-auto">
                      {publications.filter(p => (p.platform_type === 'social' || (p.link && (p.link.includes('instagram') || p.link.includes('youtube') || p.link.includes('tiktok'))))).map(pub => (
                        <div key={pub.id} className="bg-white p-3 border rounded flex items-center justify-between">
                          <div>
                            <div className="font-medium">{pub.platform_name || '(sem título)'}</div>
                            <div className="text-xs text-gray-500">{pub.link ? <a className="text-blue-600" href={pub.link} target="_blank" rel="noreferrer">Ver post</a> : 'Sem link'}</div>
                            <div className="text-xs text-gray-500">{pub.status || '—'} • {pub.published_at ? new Date(pub.published_at).toLocaleDateString() : ''}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => removePublication(pub.id)} className="text-red-600"><Trash2 /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'expenses' && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input placeholder="Categoria (ex: Lavagem)" value={expenseForm.category} onChange={(e) => setExpenseForm(f => ({ ...f, category: e.target.value }))} className="p-2 border rounded" />
                  <input placeholder="Valor (R$)" type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm(f => ({ ...f, amount: e.target.value }))} className="p-2 border rounded" />
                  <input placeholder="Data" type="date" value={expenseForm.incurred_at ? expenseForm.incurred_at.slice(0,10) : ''} onChange={(e) => setExpenseForm(f => ({ ...f, incurred_at: e.target.value ? new Date(e.target.value).toISOString() : '' }))} className="p-2 border rounded" />
                  <input placeholder="Descrição" value={expenseForm.description} onChange={(e) => setExpenseForm(f => ({ ...f, description: e.target.value }))} className="p-2 border rounded" />
                  <div className="col-span-full flex gap-2">
                    <Button onClick={submitExpense}>Registrar gasto</Button>
                  </div>
                </div>

                <div className="space-y-2 max-h-64 overflow-auto">
                  {expenses.map(exp => (
                    <div key={exp.id} className="bg-white p-3 border rounded flex items-center justify-between">
                      <div>
                        <div className="font-medium">{exp.category} — {Money({ value: exp.amount })}</div>
                        <div className="text-xs text-gray-500">{exp.description}</div>
                        <div className="text-xs text-gray-400">{exp.incurred_at ? new Date(exp.incurred_at).toLocaleDateString() : ''}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => removePublication(exp.id)} className="text-red-600 hidden" />
                        <button onClick={() => {
                          // simples exclusão:
                          deleteExpense(exp.id).then(() => {
                            setExpenses(prev => prev.filter(e => e.id !== exp.id));
                            toast({ title: 'Gasto removido' });
                          }).catch(err => {
                            toast({ title: 'Erro ao remover gasto', description: String(err), variant: 'destructive' });
                          });
                        }} className="text-red-600"><Trash2 /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'finance' && selectedCar && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm text-gray-700">Valor FIPE</label>
                    <input type="number" step="0.01" value={financeForm.fipe_value ?? ''} onChange={(e) => setFinanceForm(f => ({ ...f, fipe_value: e.target.value }))} className="w-full p-2 border rounded" />
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
                    <div className="text-sm">Lucro calculado: <strong className={` ${computeProfitForSelected() >= 0 ? 'text-green-600' : 'text-red-600'}`}>{Money({ value: computeProfitForSelected() })}</strong></div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => { setOpen(false); setSelectedCar(null); }}>Cancelar</Button>
                  <Button onClick={saveFinance}>Salvar Financeiro</Button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setOpen(false); setSelectedCar(null); }}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VehicleManager;

