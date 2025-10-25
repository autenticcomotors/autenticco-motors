// src/components/VehicleManager.jsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Check, Trash2, Megaphone, Wallet, DollarSign } from 'lucide-react';
import {
  getPublicationsByCar, addPublication, deletePublication,
  getExpensesByCar, addExpense, deleteExpense,
  getChecklistByCar, updateChecklistItem, addChecklistItem, deleteChecklistItem,
  getPlatforms, addPlatform,
  getPublicationsForCars, getExpensesForCars,
  updateCar
} from '@/lib/car-api';
import { supabase } from '@/lib/supabase';

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

const genItemKey = () => `item_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;

const VehicleManager = ({ cars = [], refreshAll }) => {
  const [selectedCar, setSelectedCar] = useState(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('checklist'); // checklist | publications | expenses | finance
  const [platforms, setPlatforms] = useState([]);

  const [checklist, setChecklist] = useState([]);
  const [publications, setPublications] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [summaryMap, setSummaryMap] = useState({});

  const [pubForm, setPubForm] = useState({ platform_id: '', link: '', budget: '', spent: '', status: 'draft', published_at: '' });
  const [expenseForm, setExpenseForm] = useState({ category: '', amount: '', description: '', incurred_at: '' });
  const [financeForm, setFinanceForm] = useState({ fipe_value: '', commission: '', return_to_seller: '' });
  const [newPlatformName, setNewPlatformName] = useState('');

  const [newChecklistLabel, setNewChecklistLabel] = useState('');
  const [newChecklistNotes, setNewChecklistNotes] = useState('');

  // drag state
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  useEffect(() => {
    (async () => {
      const p = await getPlatforms();
      setPlatforms(p || []);
    })();
  }, []);

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

  const openFor = async (car) => {
    setSelectedCar(car);
    setOpen(true);
    setTab('checklist');
    await fetchAll(car.id);
    setFinanceForm({
      fipe_value: car.fipe_value ?? '',
      commission: car.commission ?? '',
      return_to_seller: car.return_to_seller ?? ''
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

      // ensure order by ord if present
      const orderedChecklist = (cl || []).slice().sort((a, b) => {
        const ai = typeof a.ord === 'number' ? a.ord : 0;
        const bi = typeof b.ord === 'number' ? b.ord : 0;
        return ai - bi;
      });

      setChecklist(orderedChecklist);
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
      await fetchAll(selectedCar.id);
    } catch (err) {
      toast({ title: 'Erro ao atualizar checklist', description: err.message || String(err), variant: 'destructive' });
    }
  };

  const submitChecklistItem = async () => {
    if (!selectedCar) return;
    if (!newChecklistLabel || newChecklistLabel.trim().length === 0) {
      toast({ title: 'Informe o nome do item', variant: 'destructive' });
      return;
    }
    try {
      const payload = {
        car_id: selectedCar.id,
        label: newChecklistLabel.trim(),
        notes: newChecklistNotes || '',
        checked: false,
        item_key: genItemKey()
      };
      const { data } = await addChecklistItem(payload);
      if (data) {
        setChecklist(prev => [data, ...prev]);
      }
      setNewChecklistLabel('');
      setNewChecklistNotes('');
      toast({ title: 'Item de checklist adicionado' });
      await fetchAll(selectedCar.id);
    } catch (err) {
      console.error('Erro add checklist:', err);
      toast({ title: 'Erro ao adicionar item', description: err.message || String(err), variant: 'destructive' });
    }
  };

  const removeChecklistItem = async (id) => {
    try {
      await deleteChecklistItem(id);
      setChecklist(prev => prev.filter(i => i.id !== id));
      toast({ title: 'Item removido' });
      await fetchAll(selectedCar.id);
    } catch (err) {
      console.error('Erro delete checklist:', err);
      toast({ title: 'Erro ao remover item', description: err.message || String(err), variant: 'destructive' });
    }
  };

  // --- Drag & Drop handlers (fixed) ---

  const handleDragStart = (e, index) => {
    setDraggingIndex(index);
    try { e.dataTransfer.setData('text/plain', String(index)); } catch (err) { /* ignore */ }
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    // show placeholder at this index (before the item)
    setDragOverIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const saveChecklistOrder = async (newList) => {
    try {
      // update ord for every item to match index
      await Promise.all(
        newList.map((it, idx) => {
          if (!it || !it.id) return Promise.resolve(null);
          return updateChecklistItem(it.id, { ord: idx });
        })
      );
      toast({ title: 'Ordem do checklist salva' });
    } catch (err) {
      console.error('Erro ao salvar ordem do checklist:', err);
      toast({ title: 'Erro ao salvar ordem', variant: 'destructive' });
      // not re-fetch here — keep local order as user expects immediate feedback
    }
  };

  const handleDrop = async (e, dropIndexCandidate) => {
    e.preventDefault();

    // prefer the react state if set, otherwise fallback to value passed
    const dropIndex = typeof dragOverIndex === 'number' ? dragOverIndex : dropIndexCandidate;
    const dragIndex = typeof draggingIndex === 'number'
      ? draggingIndex
      : Number(e.dataTransfer.getData('text/plain'));

    if (isNaN(dragIndex) || dragIndex === null || dragIndex === undefined) {
      handleDragEnd();
      return;
    }

    // Build new list: remove dragged item and insert at computed position
    const working = Array.from(checklist);
    const [moved] = working.splice(dragIndex, 1);

    // If user dropped at end placeholder, dropIndex can be checklist.length
    let insertIndex = dropIndex;
    // When dragging downwards, after removing the item the array shifts left,
    // so the insert position must be reduced by 1.
    if (dragIndex < dropIndex) {
      insertIndex = dropIndex - 1;
    }

    if (insertIndex < 0) insertIndex = 0;
    if (insertIndex > working.length) insertIndex = working.length;

    // If no change in position, just cleanup
    if (insertIndex === dragIndex) {
      handleDragEnd();
      return;
    }

    working.splice(insertIndex, 0, moved);

    // immediate visual feedback
    setChecklist(working);
    handleDragEnd();

    // try to persist the order (graceful on error)
    await saveChecklistOrder(working);

    // refresh server list to ensure consistency (optional)
    if (selectedCar) {
      await fetchAll(selectedCar.id);
    }
  };

  // cria checklist padrão (itens default) PARA O VEÍCULO aberto
  const createDefaultChecklist = async () => {
    if (!selectedCar) return;
    try {
      const created = [];
      for (const it of defaultChecklistItems) {
        const payload = { car_id: selectedCar.id, label: it.label, notes: it.notes, checked: false, item_key: genItemKey() };
        const { data } = await addChecklistItem(payload);
        if (data) created.push(data);
      }
      if (created.length > 0) {
        await fetchAll(selectedCar.id);
        toast({ title: 'Checklist padrão criado para este veículo' });
      } else {
        toast({ title: 'Nenhum item criado', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Erro criar checklist padrão:', err);
      toast({ title: 'Erro ao criar checklist padrão', description: err.message || String(err), variant: 'destructive' });
    }
  };

  // SALVAR checklist atual como TEMPLATE GLOBAL (usando Supabase diretamente)
  const saveChecklistAsTemplate = async (templateName = 'Padrão') => {
    try {
      if (!checklist || checklist.length === 0) {
        toast({ title: 'Checklist vazio. Nada a salvar.', variant: 'destructive' });
        return;
      }
      const itemsPayload = (checklist || []).map((it, idx) => ({
        item_key: it.item_key || genItemKey(),
        label: it.label || `Item ${idx+1}`,
        notes: it.notes || '',
        ord: idx
      }));

      // insere novo template
      const { data, error } = await supabase
        .from('checklist_templates')
        .insert([{ name: templateName, items: itemsPayload }])
        .select()
        .single();

      if (error) throw error;
      toast({ title: 'Checklist salvo como padrão global' });
    } catch (err) {
      console.error('Erro ao salvar template:', err);
      toast({ title: 'Erro ao salvar checklist como padrão', description: err.message || String(err), variant: 'destructive' });
    }
  };

  // Aplicar template existente ao veículo aberto (buscar latest)
  const applyLatestTemplateToVehicle = async () => {
    if (!selectedCar) return;
    try {
      const { data: tplData, error } = await supabase
        .from('checklist_templates')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (!tplData || tplData.length === 0) {
        toast({ title: 'Nenhum template disponível', variant: 'destructive' });
        return;
      }

      const items = tplData[0].items || [];
      if (items.length === 0) {
        toast({ title: 'Template sem itens', variant: 'destructive' });
        return;
      }

      // criar itens para o veículo
      const created = [];
      for (const it of items) {
        const payload = {
          car_id: selectedCar.id,
          label: it.label,
          notes: it.notes || '',
          checked: false,
          item_key: it.item_key || genItemKey()
        };
        const { data } = await addChecklistItem(payload);
        if (data) created.push(data);
      }

      if (created.length > 0) {
        await fetchAll(selectedCar.id);
        toast({ title: 'Template aplicado ao veículo' });
      } else {
        toast({ title: 'Erro ao aplicar template', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Erro aplicar template:', err);
      toast({ title: 'Erro ao aplicar template', description: err.message || String(err), variant: 'destructive' });
    }
  };

  // PUBLICAÇÕES / ANÚNCIOS
  const submitPublication = async () => {
    if (!selectedCar) return;
    try {
      const platform = platforms.find(p => String(p.id) === String(pubForm.platform_id));
      const titleFromPlatform = platform ? platform.name : '(Plataforma)';
      const payload = {
        car_id: selectedCar.id,
        platform_id: pubForm.platform_id || null,
        title: titleFromPlatform,
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
        setPubForm({ platform_id: '', link: '', budget: '', spent: '', status: 'draft', published_at: '' });
        toast({ title: 'Anúncio adicionado' });
      }
      await fetchAll(selectedCar.id);
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro ao salvar anúncio', description: err.message || String(err), variant: 'destructive' });
    }
  };

  const removePublication = async (id) => {
    try {
      await deletePublication(id);
      setPublications(prev => prev.filter(p => p.id !== id));
      toast({ title: 'Anúncio removido' });
      await fetchAll(selectedCar.id);
    } catch (err) {
      toast({ title: 'Erro ao remover anúncio', description: err.message || String(err), variant: 'destructive' });
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
    } catch (err) {
      toast({ title: 'Erro ao salvar gasto', description: err.message || String(err), variant: 'destructive' });
    }
  };

  const removeExpense = async (id) => {
    try {
      await deleteExpense(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
      toast({ title: 'Gasto removido' });
      await fetchAll(selectedCar.id);
    } catch (err) {
      toast({ title: 'Erro ao remover gasto', description: err.message || String(err), variant: 'destructive' });
    }
  };

  // plataforma
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

  // FINANCEIRO
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
            <DialogDescription>Checklist, anúncios, gastos e financeiro por veículo</DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <div className="flex gap-2 mb-4">
              <button onClick={() => setTab('checklist')} className={`px-3 py-1 rounded ${tab === 'checklist' ? 'bg-yellow-400 text-black' : 'bg-gray-100'}`}>Checklist</button>
              <button onClick={() => setTab('publications')} className={`px-3 py-1 rounded ${tab === 'publications' ? 'bg-yellow-400 text-black' : 'bg-gray-100'}`}>Anúncios</button>
              <button onClick={() => setTab('expenses')} className={`px-3 py-1 rounded ${tab === 'expenses' ? 'bg-yellow-400 text-black' : 'bg-gray-100'}`}>Gastos</button>
              <button onClick={() => setTab('finance')} className={`px-3 py-1 rounded ${tab === 'finance' ? 'bg-yellow-400 text-black' : 'bg-gray-100'}`}>Financeiro</button>
            </div>

            {tab === 'checklist' && (
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <div className="text-sm text-gray-600">Itens do checklist</div>
                  <div className="ml-auto flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => createDefaultChecklist()}>Criar checklist padrão</Button>
                    <Button size="sm" variant="outline" onClick={() => applyLatestTemplateToVehicle()}>Aplicar checklist padrão</Button>
                    <Button size="sm" onClick={() => saveChecklistAsTemplate('Padrão')}>Salvar checklist atual como padrão</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {/* Render with placeholders */}
                  {checklist.map((item, idx) => (
                    <React.Fragment key={item.id}>
                      {/* placeholder before item when dragOverIndex === idx */}
                      {dragOverIndex === idx && (
                        <div className="h-12 rounded-md border-2 border-dashed border-yellow-400 bg-yellow-50 transition-all" />
                      )}

                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragEnter={(e) => handleDragEnter(e, idx)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, idx)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center justify-between bg-white p-3 border rounded mb-2 shadow-sm transition-transform duration-150
                          ${draggingIndex === idx ? 'opacity-70 scale-98 border-yellow-200' : 'hover:shadow-md'}`}
                        style={{ cursor: 'grab', userSelect: 'none' }}
                      >
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
                    </React.Fragment>
                  ))}

                  {/* placeholder at end if dragging to after last item */}
                  {dragOverIndex === checklist.length && (
                    <div className="h-12 rounded-md border-2 border-dashed border-yellow-400 bg-yellow-50 transition-all" />
                  )}

                  {/* Add a drop target at the end (so user can drop after last item) */}
                  <div
                    onDragEnter={(e) => handleDragEnter(e, checklist.length)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, checklist.length)}
                    className="h-0"
                  />

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

