// src/components/VehicleManager.jsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Check, Trash2, Edit, Megaphone, Wallet, ClipboardCheck, FileText, DollarSign } from 'lucide-react';
import {
  getPublicationsByCar, addPublication, deletePublication,
  getExpensesByCar, addExpense, deleteExpense,
  getChecklistByCar, updateChecklistItem, addChecklistItem, deleteChecklistItem,
  getPlatforms, addPlatform,
  getPublicationsForCars, getExpensesForCars,
  updateCar
} from '@/lib/car-api';

// Small money formatter component
const Money = ({ value }) => {
  const v = Number(value || 0);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
};

const defaultChecklistItems = [
  { label: 'Lavagem e estética', notes: '' },
  { label: 'Revisão básica', notes: '' },
  { label: 'Fotos profissionais', notes: '' },
  { label: 'Documentação conferida', notes: '' },
];

const VehicleManager = ({ cars = [], refreshAll }) => {
  const [selectedCar, setSelectedCar] = useState(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('checklist'); // checklist | publications | expenses | finance
  const [platforms, setPlatforms] = useState([]);

  const [checklist, setChecklist] = useState([]);
  const [publications, setPublications] = useState([]);
  const [expenses, setExpenses] = useState([]);

  // aggregate summary (pubCount, adSpendTotal, extraExpensesTotal)
  const [summaryMap, setSummaryMap] = useState({});

  // forms
  const [pubForm, setPubForm] = useState({ title: '', platform_id: '', link: '', budget: '', spent: '', status: 'draft', published_at: '' });
  const [expenseForm, setExpenseForm] = useState({ category: '', amount: '', description: '', incurred_at: '' });
  const [financeForm, setFinanceForm] = useState({ fipe_value: '', commission: '', return_to_seller: '', sale_price: '' });
  const [newPlatformName, setNewPlatformName] = useState('');

  // checklist add form
  const [newChecklistLabel, setNewChecklistLabel] = useState('');
  const [newChecklistNotes, setNewChecklistNotes] = useState('');

  useEffect(() => {
    (async () => {
      const p = await getPlatforms();
      setPlatforms(p || []);
    })();
  }, []);

  // prefetch summaries for all cars (publications + expenses)
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

  // open modal and fetch details for selected car
  const openFor = async (car) => {
    setSelectedCar(car);
    setOpen(true);
    setTab('checklist');
    await fetchAll(car.id);
    // prefill finance form with car values
    setFinanceForm({
      fipe_value: car.fipe_value ?? '',
      commission: car.commission ?? '',
      return_to_seller: car.return_to_seller ?? '',
      sale_price: car.sale_price ?? car.price ?? ''
    });
  };

  const fetchAll = async (carId) => {
    if (!carId) return;
    try {
      const [cl, pu, ex] = await Promise.all([
        getChecklistByCar(carId),
        getPublicationsByCar(carId),
        getExpensesByCar(carId)
      ]);
      setChecklist(cl || []);
      setPublications(pu || []);
      setExpenses(ex || []);
    } catch (err) {
      console.error('Erro fetchAll:', err);
      setChecklist([]);
      setPublications([]);
      setExpenses([]);
    }
  };

  // checklist toggle
  const toggleChecklist = async (item) => {
    try {
      const patched = { checked: !item.checked, updated_at: new Date().toISOString() };
      await updateChecklistItem(item.id, patched);
      setChecklist(prev => prev.map(i => i.id === item.id ? { ...i, ...patched } : i));
      toast({ title: 'Checklist atualizado' });
      refreshAll && refreshAll();
    } catch (err) {
      toast({ title: 'Erro ao atualizar checklist', description: err.message || String(err), variant: 'destructive' });
    }
  };

  // checklist: add new item
  const submitChecklistItem = async () => {
    if (!selectedCar) return;
    if (!newChecklistLabel || newChecklistLabel.trim().length < 1) {
      toast({ title: 'Informe o nome do item', variant: 'destructive' });
      return;
    }
    try {
      const payload = {
        car_id: selectedCar.id,
        label: newChecklistLabel.trim(),
        notes: newChecklistNotes || '',
        checked: false
      };
      const { data, error } = await addChecklistItem(payload);
      if (error) throw error;
      setChecklist(prev => [data, ...prev]);
      setNewChecklistLabel('');
      setNewChecklistNotes('');
      toast({ title: 'Item de checklist adicionado' });
      refreshAll && refreshAll();
    } catch (err) {
      console.error('Erro add checklist:', err);
      toast({ title: 'Erro ao adicionar item', description: err.message || String(err), variant: 'destructive' });
    }
  };

  // checklist: delete item
  const removeChecklistItem = async (id) => {
    try {
      await deleteChecklistItem(id);
      setChecklist(prev => prev.filter(i => i.id !== id));
      toast({ title: 'Item removido' });
      refreshAll && refreshAll();
    } catch (err) {
      console.error('Erro delete checklist:', err);
      toast({ title: 'Erro ao remover item', description: err.message || String(err), variant: 'destructive' });
    }
  };

  // create default checklist (useful when none exists)
  const createDefaultChecklist = async () => {
    if (!selectedCar) return;
    try {
      const created = [];
      for (const it of defaultChecklistItems) {
        const payload = { car_id: selectedCar.id, label: it.label, notes: it.notes, checked: false };
        const { data, error } = await addChecklistItem(payload);
        if (!error && data) created.push(data);
      }
      if (created.length > 0) {
        setChecklist(prev => [...created, ...prev]);
        toast({ title: 'Checklist padrão criado' });
        refreshAll && refreshAll();
      } else {
        toast({ title: 'Nenhum item criado', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Erro criar checklist padrão:', err);
      toast({ title: 'Erro ao criar checklist padrão', description: err.message || String(err), variant: 'destructive' });
    }
  };

  // publications
  const submitPublication = async () => {
    if (!selectedCar) return;
    try {
      const payload = {
        car_id: selectedCar.id,
        platform_id: pubForm.platform_id || null,
        title: pubForm.title,
        link: pubForm.link,
        status: pubForm.status,
        budget: pubForm.budget ? parseFloat(pubForm.budget) : null,
        spent: pubForm.spent ? parseFloat(pubForm.spent) : null,
        published_at: pubForm.published_at || null,
        notes: ''
      };
      const { data } = await addPublication(payload);
      if (data) {
        setPublications(prev => [data, ...prev]);
        setSummaryMap(prev => {
          const clone = { ...prev };
          clone[selectedCar.id] = clone[selectedCar.id] || { pubCount: 0, adSpendTotal: 0, extraExpensesTotal: 0 };
          clone[selectedCar.id].pubCount += 1;
          clone[selectedCar.id].adSpendTotal += Number(payload.spent || 0);
          return clone;
        });
        setPubForm({ title: '', platform_id: '', link: '', budget: '', spent: '', status: 'draft', published_at: '' });
        toast({ title: 'Publicação adicionada' });
        refreshAll && refreshAll();
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro ao salvar publicação', description: err.message || String(err), variant: 'destructive' });
    }
  };

  const removePublication = async (id) => {
    try {
      const removed = publications.find(p => p.id === id);
      await deletePublication(id);
      setPublications(prev => prev.filter(p => p.id !== id));
      if (removed) {
        setSummaryMap(prev => {
          const clone = { ...prev };
          const rec = clone[selectedCar.id] || { pubCount: 0, adSpendTotal: 0, extraExpensesTotal: 0 };
          rec.pubCount = Math.max(0, rec.pubCount - 1);
          rec.adSpendTotal = Math.max(0, rec.adSpendTotal - Number(removed.spent || 0));
          clone[selectedCar.id] = rec;
          return clone;
        });
      }
      toast({ title: 'Publicação removida' });
      refreshAll && refreshAll();
    } catch (err) {
      toast({ title: 'Erro ao remover publicação', description: err.message || String(err), variant: 'destructive' });
    }
  };

  // expenses
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
        setSummaryMap(prev => {
          const clone = { ...prev };
          clone[selectedCar.id] = clone[selectedCar.id] || { pubCount: 0, adSpendTotal: 0, extraExpensesTotal: 0 };
          clone[selectedCar.id].extraExpensesTotal += Number(payload.amount || 0);
          return clone;
        });
        setExpenseForm({ category: '', amount: '', description: '', incurred_at: '' });
        toast({ title: 'Gasto registrado' });
        refreshAll && refreshAll();
      }
    } catch (err) {
      toast({ title: 'Erro ao salvar gasto', description: err.message || String(err), variant: 'destructive' });
    }
  };

  const removeExpense = async (id) => {
    try {
      const removed = expenses.find(e => e.id === id);
      await deleteExpense(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
      if (removed) {
        setSummaryMap(prev => {
          const clone = { ...prev };
          const rec = clone[selectedCar.id] || { pubCount: 0, adSpendTotal: 0, extraExpensesTotal: 0 };
          rec.extraExpensesTotal = Math.max(0, rec.extraExpensesTotal - Number(removed.amount || 0));
          clone[selectedCar.id] = rec;
          return clone;
        });
      }
      toast({ title: 'Gasto removido' });
      refreshAll && refreshAll();
    } catch (err) {
      toast({ title: 'Erro ao remover gasto', description: err.message || String(err), variant: 'destructive' });
    }
  };

  // platform create
  const handleAddPlatform = async () => {
    if (!newPlatformName || newPlatformName.trim().length < 2) return;
    try {
      const created = await addPlatform(newPlatformName.trim());
      if (created) {
        setPlatforms(prev => [...prev, created]);
        setNewPlatformName('');
        toast({ title: 'Plataforma criada' });
      }
    } catch (err) {
      toast({ title: 'Erro ao criar plataforma', description: err.message || String(err), variant: 'destructive' });
    }
  };

  // FINANCE: compute profit and save to cars table
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
      const sale_price = financeForm.sale_price ? parseFloat(financeForm.sale_price) : (selectedCar.sale_price || selectedCar.price || null);

      const adSpendTotal = Number(summary.adSpendTotal || 0);
      const extraExpensesTotal = Number(summary.extraExpensesTotal || 0);

      const profit = commission - (adSpendTotal + extraExpensesTotal);
      const profit_percent = sale_price ? (profit / Number(sale_price || 1)) * 100 : null;

      const patch = {
        fipe_value,
        commission,
        return_to_seller,
        sale_price,
        profit,
        profit_percent
      };

      const { data, error } = await updateCar(selectedCar.id, patch);
      if (error) {
        throw error;
      }

      // update local selectedCar and inform user
      const updated = { ...(selectedCar || {}), ...patch };
      setSelectedCar(updated);

      toast({ title: 'Financeiro atualizado com sucesso' });
      refreshAll && refreshAll();
    } catch (err) {
      console.error('Erro ao salvar financeiro:', err);
      toast({ title: 'Erro ao salvar financeiro', description: err.message || String(err), variant: 'destructive' });
    }
  };

  // small helper to get summary for card
  const getSummary = (carId) => summaryMap[carId] || { pubCount: 0, adSpendTotal: 0, extraExpensesTotal: 0 };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Gestão de Veículos</h2>

      <div className="space-y-4">
        {Array.isArray(cars) && cars.map(car => {
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

                    {/* Removed the "Checklist Abrir para ver" element here per request (keeps modal access only) */}

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
                  <Button size="sm" variant="outline" onClick={() => openFor(car)}>Gerenciar</Button>
                </div>
                <div className="text-xs text-gray-500">Última atualização: {car.updated_at ? new Date(car.updated_at).toLocaleDateString() : '-'}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <Dialog open={open} onOpenChange={(o) => { if (!o) { setSelectedCar(null); } setOpen(o); }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Gestão - {selectedCar ? `${selectedCar.brand} ${selectedCar.model}` : ''}</DialogTitle>
            <DialogDescription>Checklist, publicações, gastos e financeiro por veículo</DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <div className="flex gap-2 mb-4">
              <button onClick={() => setTab('checklist')} className={`px-3 py-1 rounded ${tab === 'checklist' ? 'bg-yellow-400 text-black' : 'bg-gray-100'}`}>Checklist</button>
              <button onClick={() => setTab('publications')} className={`px-3 py-1 rounded ${tab === 'publications' ? 'bg-yellow-400 text-black' : 'bg-gray-100'}`}>Publicações</button>
              <button onClick={() => setTab('expenses')} className={`px-3 py-1 rounded ${tab === 'expenses' ? 'bg-yellow-400 text-black' : 'bg-gray-100'}`}>Gastos</button>
              <button onClick={() => setTab('finance')} className={`px-3 py-1 rounded ${tab === 'finance' ? 'bg-yellow-400 text-black' : 'bg-gray-100'}`}>Financeiro</button>
            </div>

            {tab === 'checklist' && (
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <div className="text-sm text-gray-600">Itens do checklist</div>
                  <div className="ml-auto flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => createDefaultChecklist()}>Criar checklist padrão</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {checklist.map(item => (
                    <div key={item.id} className="flex items-center justify-between bg-white p-3 border rounded mb-2">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={!!item.checked} onChange={() => toggleChecklist(item)} />
                        <div>
                          <div className="font-medium">{item.label}</div>
                          {item.notes && <div className="text-xs text-gray-500">{item.notes}</div>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-gray-400 mr-4">{item.updated_at ? new Date(item.updated_at).toLocaleString() : ''}</div>
                        <button onClick={() => removeChecklistItem(item.id)} className="text-red-600"><Trash2 /></button>
                      </div>
                    </div>
                  ))}

                  {/* add new */}
                  <div className="bg-gray-50 p-3 border rounded">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input placeholder="Novo item" value={newChecklistLabel} onChange={(e) => setNewChecklistLabel(e.target.value)} className="p-2 border rounded col-span-2" />
                      <input placeholder="Notas (opcional)" value={newChecklistNotes} onChange={(e) => setNewChecklistNotes(e.target.value)} className="p-2 border rounded" />
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" onClick={submitChecklistItem}>Adicionar item</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'publications' && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <input placeholder="Título do anúncio" value={pubForm.title} onChange={(e) => setPubForm(f => ({ ...f, title: e.target.value }))} className="w-full p-2 border rounded" />
                    <select value={pubForm.platform_id} onChange={(e) => setPubForm(f => ({ ...f, platform_id: e.target.value }))} className="w-full p-2 border rounded">
                      <option value="">Plataforma</option>
                      {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <input placeholder="Orçamento" type="number" value={pubForm.budget} onChange={(e) => setPubForm(f => ({ ...f, budget: e.target.value }))} className="w-1/2 p-2 border rounded" />
                      <input placeholder="Gasto" type="number" value={pubForm.spent} onChange={(e) => setPubForm(f => ({ ...f, spent: e.target.value }))} className="w-1/2 p-2 border rounded" />
                    </div>
                    <input placeholder="Link" value={pubForm.link} onChange={(e) => setPubForm(f => ({ ...f, link: e.target.value }))} className="w-full p-2 border rounded" />
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
                      <Button size="sm" onClick={handleAddPlatform}>Criar</Button>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-auto">
                      {publications.map(pub => (
                        <div key={pub.id} className="bg-white p-3 border rounded flex items-center justify-between">
                          <div>
                            <div className="font-medium">{pub.title || '(sem título)'}</div>
                            <div className="text-xs text-gray-500">{pub.link ? <a className="text-blue-600" href={pub.link} target="_blank" rel="noreferrer">Ver anúncio</a> : 'Sem link'}</div>
                            <div className="text-xs text-gray-500">{pub.status} • {pub.published_at ? new Date(pub.published_at).toLocaleDateString() : ''} • Gasto: {Money({ value: pub.spent })}</div>
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
                        <button onClick={() => removeExpense(exp.id)} className="text-red-600"><Trash2 /></button>
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

                  <div>
                    <label className="text-sm text-gray-700">Valor final vendido (R$)</label>
                    <input type="number" step="0.01" value={financeForm.sale_price ?? ''} onChange={(e) => setFinanceForm(f => ({ ...f, sale_price: e.target.value }))} className="w-full p-2 border rounded" />
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

