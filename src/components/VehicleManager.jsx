// src/components/VehicleManager.jsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Check, Trash2, Edit } from 'lucide-react';
import {
  getPublicationsByCar, addPublication, updatePublication, deletePublication,
  getExpensesByCar, addExpense, updateExpense, deleteExpense,
  getChecklistByCar, updateChecklistItem, addChecklistItem,
  getPlatforms, addPlatform
} from '@/lib/car-api';

const Money = ({ value }) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));

const VehicleManager = ({ cars = [], refreshAll }) => {
  const [selectedCar, setSelectedCar] = useState(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('checklist'); // checklist | publications | expenses
  const [platforms, setPlatforms] = useState([]);

  const [checklist, setChecklist] = useState([]);
  const [publications, setPublications] = useState([]);
  const [expenses, setExpenses] = useState([]);

  // publication form
  const [pubForm, setPubForm] = useState({ title: '', platform_id: '', link: '', budget: '', spent: '', status: 'draft', published_at: '' });
  const [expenseForm, setExpenseForm] = useState({ category: '', amount: '', description: '', incurred_at: '' });
  const [newPlatformName, setNewPlatformName] = useState('');

  useEffect(() => {
    (async () => {
      const p = await getPlatforms();
      setPlatforms(p || []);
    })();
  }, []);

  const openFor = async (car) => {
    setSelectedCar(car);
    setOpen(true);
    setTab('checklist');
    await fetchAll(car.id);
  };

  const fetchAll = async (carId) => {
    if (!carId) return;
    const [cList, pubs, exps] = await Promise.all([
      getChecklistByCar(carId),
      getPublicationsByCar(carId),
      getExpensesByCar(carId)
    ].map(p => p.catch ? p : p)); // no-op; we call functions individually below
    // instead call serially to handle errors cleanly:
    try {
      const cl = await getChecklistByCar(carId);
      setChecklist(cl || []);
    } catch (err) {
      console.error('err checklist', err);
      setChecklist([]);
    }
    try {
      const pu = await getPublicationsByCar(carId);
      setPublications(pu || []);
    } catch (err) {
      console.error('err pubs', err);
      setPublications([]);
    }
    try {
      const ex = await getExpensesByCar(carId);
      setExpenses(ex || []);
    } catch (err) {
      console.error('err expenses', err);
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

  // PUBLICACOES
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
      setPublications(prev => prev.filter(p => p.id !== id));
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
      setExpenses(prev => prev.filter(e => e.id !== id));
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

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Gestão de Veículos</h2>

      <div className="space-y-4">
        {Array.isArray(cars) && cars.map(car => (
          <div key={car.id} className="bg-white rounded-xl p-4 flex items-center justify-between shadow">
            <div className="flex items-center gap-4">
              <img src={car.main_photo_url || 'https://placehold.co/96x64/e2e8f0/4a5568?text=Sem+Foto'} alt={`${car.brand} ${car.model}`} className="h-16 w-24 object-cover rounded-md" />
              <div>
                <div className="font-bold">{car.brand} {car.model} ({car.year})</div>
                <div className="text-sm text-gray-600">Preço: {Money(car.price)}</div>
                <div className="text-xs text-gray-500">{car.is_sold ? 'VENDIDO' : 'Em estoque'}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => openFor(car)} size="sm">Gerenciar</Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={(o) => { if (!o) setSelectedCar(null); setOpen(o); }}>
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

            {tab === 'checklist' && (
              <div>
                <div className="grid grid-cols-1 gap-2">
                  {checklist.map(item => (
                    <div key={item.id} className="flex items-center justify-between bg-white p-3 border rounded">
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

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input placeholder="Nova plataforma" value={newPlatformName} onChange={(e) => setNewPlatformName(e.target.value)} className="w-full p-2 border rounded" />
                      <Button size="sm" onClick={() => handleAddPlatform()}>Criar</Button>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm font-medium mb-2">Anúncios</div>
                      <div className="space-y-2">
                        {publications.map(pub => (
                          <div key={pub.id} className="bg-white p-3 border rounded flex items-center justify-between">
                            <div>
                              <div className="font-medium">{pub.title || '(sem título)'}</div>
                              <div className="text-xs text-gray-500">{pub.link ? <a className="text-blue-600" href={pub.link} target="_blank" rel="noreferrer">Ver anúncio</a> : 'Sem link'}</div>
                              <div className="text-xs text-gray-500">{pub.status} • {pub.published_at ? new Date(pub.published_at).toLocaleDateString() : ''}</div>
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
              </div>
            )}

            {tab === 'expenses' && (
              <div>
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
                        <div className="font-medium">{exp.category} — {Money(exp.amount)}</div>
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

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setOpen(false); setSelectedCar(null); }}>Fechar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VehicleManager;

