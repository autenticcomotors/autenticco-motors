// src/components/VehicleManager.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Check, Trash2, Edit, Megaphone, Wallet, ClipboardCheck, FileText } from 'lucide-react';
import {
  getPublicationsByCar, addPublication, updatePublication, deletePublication,
  getExpensesByCar, addExpense, updateExpense, deleteExpense,
  getChecklistByCar, updateChecklistItem, addChecklistItem,
  getPlatforms, addPlatform,
  getPublicationsForCars, getExpensesForCars
} from '@/lib/car-api';

// Helper de formatação
const Money = ({ value }) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));

const VehicleManager = ({ cars = [], refreshAll }) => {
  const [selectedCar, setSelectedCar] = useState(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('checklist'); // checklist | publications | expenses
  const [platforms, setPlatforms] = useState([]);

  const [checklist, setChecklist] = useState([]);
  const [publications, setPublications] = useState([]);
  const [expenses, setExpenses] = useState([]);

  // resumo agregado para a lista principal
  const [summaryMap, setSummaryMap] = useState({}); // { [carId]: { pubCount, adSpendTotal, extraExpensesTotal } }

  // forms locais (mantidos similares ao que você tinha)
  const [pubForm, setPubForm] = useState({ title: '', platform_id: '', link: '', budget: '', spent: '', status: 'draft', published_at: '' });
  const [expenseForm, setExpenseForm] = useState({ category: '', amount: '', description: '', incurred_at: '' });
  const [newPlatformName, setNewPlatformName] = useState('');

  useEffect(() => {
    (async () => {
      const p = await getPlatforms();
      setPlatforms(p || []);
    })();
  }, []);

  // quando receber lista de cars, prefetch publications + expenses em bulk para montar resumo
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
        // inicializa map
        const map = {};
        for (const id of carIds) map[id] = { pubCount: 0, adSpendTotal: 0, extraExpensesTotal: 0 };

        // publications: pub.spent contributes to adSpendTotal
        (pubs || []).forEach(p => {
          const id = p.car_id;
          if (!map[id]) map[id] = { pubCount: 0, adSpendTotal: 0, extraExpensesTotal: 0 };
          map[id].pubCount += 1;
          map[id].adSpendTotal += Number(p.spent || 0);
        });

        // expenses: all go to extraExpensesTotal (we consider ad spend is recorded in publications)
        (exps || []).forEach(ex => {
          const id = ex.car_id;
          if (!map[id]) map[id] = { pubCount: 0, adSpendTotal: 0, extraExpensesTotal: 0 };
          map[id].extraExpensesTotal += Number(ex.amount || 0);
        });

        if (mounted) setSummaryMap(map);
      } catch (err) {
        console.error('Erro ao agregar resumos:', err);
      }
    })();

    return () => { mounted = false; };
  }, [cars]);

  // abrir modal e carregar dados do carro selecionado
  const openFor = async (car) => {
    setSelectedCar(car);
    setOpen(true);
    setTab('checklist');
    await fetchAll(car.id);
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

  // CHECKLIST
  const toggleChecklist = async (item) => {
    try {
      const updated = { checked: !item.checked, updated_at: new Date().toISOString() };
      await updateChecklistItem(item.id, updated);
      setChecklist(prev => prev.map(i => i.id === item.id ? { ...i, ...updated } : i));
      toast({ title: 'Checklist atualizado' });
    } catch (err) {
      toast({ title: 'Erro ao atualizar checklist', description: err.message || String(err), variant: 'destructive' });
    }
  };

  // PUBLICAÇÕES
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
      const { data, error } = await addPublication(payload);
      if (error) throw error;
      setPublications(prev => [data, ...prev]);
      // atualizar resumo global
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
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro ao salvar publicação', description: err.message || String(err), variant: 'destructive' });
    }
  };

  const removePublication = async (id) => {
    try {
      await deletePublication(id);
      // atualizar lista local e resumo
      const removed = publications.find(p => p.id === id);
      setPublications(prev => prev.filter(p => p.id !== id));
      if (removed) {
        setSummaryMap(prev => {
          const clone = { ...prev };
          const rec = clone[selectedCar.id] || { pubCount: 0, adSpendTotal: 0, extraExpensesTotal: 0 };
          rec.pubCount = Math.max(0, rec.pubCount - 1);
          rec.adSpendTotal = Math.max(0, rec.adSpendTotal - (Number(removed.spent || 0)));
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
      const { data, error } = await addExpense(payload);
      if (error) throw error;
      setExpenses(prev => [data, ...prev]);
      // atualizar resumo global
      setSummaryMap(prev => {
        const clone = { ...prev };
        clone[selectedCar.id] = clone[selectedCar.id] || { pubCount: 0, adSpendTotal: 0, extraExpensesTotal: 0 };
        clone[selectedCar.id].extraExpensesTotal += Number(payload.amount || 0);
        return clone;
      });
      setExpenseForm({ category: '', amount: '', description: '', incurred_at: '' });
      toast({ title: 'Gasto registrado' });
      refreshAll && refreshAll();
    } catch (err) {
      toast({ title: 'Erro ao salvar gasto', description: err.message || String(err), variant: 'destructive' });
    }
  };

  const removeExpense = async (id) => {
    try {
      await deleteExpense(id);
      const removed = expenses.find(e => e.id === id);
      setExpenses(prev => prev.filter(e => e.id !== id));
      if (removed) {
        setSummaryMap(prev => {
          const clone = { ...prev };
          const rec = clone[selectedCar.id] || { pubCount: 0, adSpendTotal: 0, extraExpensesTotal: 0 };
          rec.extraExpensesTotal = Math.max(0, rec.extraExpensesTotal - (Number(removed.amount || 0)));
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

  // utilitário para mostrar resumo por carro
  const getSummary = (carId) => {
    return summaryMap[carId] || { pubCount: 0, adSpendTotal: 0, extraExpensesTotal: 0 };
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Gestão de Veículos</h2>

      <div className="space-y-4">
        {Array.isArray(cars) && cars.map(car => {
          const summary = getSummary(car.id);
          const sold = !!car.is_sold;
          // pequena lógica para destacar lucro se existir
          const maybeProfit = car.profit ? Number(car.profit) : null;

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

                  <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
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
                      <ClipboardCheck className="h-4 w-4 text-blue-500" />
                      <div>
                        <div className="text-xs">Checklist</div>
                        <div className="font-medium">Abrir para ver</div>
                      </div>
                    </div>

                    {maybeProfit !== null && (
                      <div className="ml-3">
                        <div className="text-xs">Lucro</div>
                        <div className={`font-semibold ${maybeProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{Money({ value: maybeProfit })}</div>
                      </div>
                    )}
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

      {/* Modal detalhado (abre ao clicar "Gerenciar") */}
      <Dialog open={open} onOpenChange={(o) => { if (!o) { setSelectedCar(null); } setOpen(o); }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Gestão - {selectedCar ? `${selectedCar.brand} ${selectedCar.model}` : ''}</DialogTitle>
            <DialogDescription>Checklist, publicações e gastos por veículo</DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <div className="flex gap-2 mb-4">
              <button onClick={() => setTab('checklist')} className={`px-3 py-1 rounded ${tab === 'checklist' ? 'bg-yellow-400 text-black' : 'bg-gray-100'}`}>Checklist</button>
              <button onClick={() => setTab('publications')} className={`px-3 py-1 rounded ${tab === 'publications' ? 'bg-yellow-400 text-black' : 'bg-gray-100'}`}>Publicações</button>
              <button onClick={() => setTab('expenses')} className={`px-3 py-1 rounded ${tab === 'expenses' ? 'bg-yellow-400 text-black' : 'bg-gray-100'}`}>Gastos</button>
            </div>

            {/* Conteúdos idênticos ao que você já tem (Checklist / Publications / Expenses) */}
            {tab === 'checklist' && (
              <div>{/* CHECKLIST UI (igual ao que implementou) */}
                {checklist.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-white p-3 border rounded mb-2">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={!!item.checked} onChange={() => toggleChecklist(item)} />
                      <div>
                        <div className="font-medium">{item.label}</div>
                        {item.notes && <div className="text-xs text-gray-500">{item.notes}</div>}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">{item.updated_at ? new Date(item.updated_at).toLocaleString() : ''}</div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'publications' && (
              <div>{/* PUBLICATIONS UI */}
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

                    <div className="space-y-2">
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
              <div>{/* EXPENSES UI */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input placeholder="Categoria (ex: Lavagem)" value={expenseForm.category} onChange={(e) => setExpenseForm(f => ({ ...f, category: e.target.value }))} className="p-2 border rounded" />
                  <input placeholder="Valor (R$)" type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm(f => ({ ...f, amount: e.target.value }))} className="p-2 border rounded" />
                  <input placeholder="Data" type="date" value={expenseForm.incurred_at ? (new Date(expenseForm.incurred_at).toISOString().slice(0,10)) : ''} onChange={(e) => setExpenseForm(f => ({ ...f, incurred_at: e.target.value ? new Date(e.target.value).toISOString() : '' }))} className="p-2 border rounded" />
                  <input placeholder="Descrição" value={expenseForm.description} onChange={(e) => setExpenseForm(f => ({ ...f, description: e.target.value }))} className="p-2 border rounded" />
                  <div className="col-span-full flex gap-2">
                    <Button onClick={submitExpense}>Registrar gasto</Button>
                  </div>
                </div>

                <div className="space-y-2">
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

