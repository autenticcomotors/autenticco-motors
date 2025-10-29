// src/components/VehicleManager.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Check, Trash2, Megaphone, Wallet, DollarSign, Instagram, Youtube, Globe, Music2 } from 'lucide-react';
import {
  getPublicationsByCar, addPublication, deletePublication,
  getExpensesByCar, addExpense, deleteExpense,
  getPlatforms,
  getPublicationsForCars, getExpensesForCars,
  updateCar
} from '@/lib/car-api';
import { getFipeValue } from '@/lib/fipe-api';

const Money = ({ value }) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));

// ícone social
const SocialIcon = ({ name = '', link = '' }) => {
  const n = String(name || '').toLowerCase();
  const l = String(link || '').toLowerCase();
  if (n.includes('insta') || l.includes('instagram')) return <Instagram className="h-4 w-4 text-pink-600" />;
  if (n.includes('you') || l.includes('youtube')) return <Youtube className="h-4 w-4 text-red-600" />;
  if (n.includes('tiktok') || l.includes('tiktok')) return <Music2 className="h-4 w-4" />;
  return <Globe className="h-4 w-4" />;
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
  const [tab, setTab] = useState('publications_market'); // publications_market | publications_social | expenses | finance
  const [platforms, setPlatforms] = useState(externalPlatforms || []);

  const [publications, setPublications] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [summaryMap, setSummaryMap] = useState({});

  const [pubForm, setPubForm] = useState({ platform_id: '', link: '', spent: '', status: 'active', published_at: '', notes: '' });
  const [expenseForm, setExpenseForm] = useState({ category: '', amount: '', charged_value: '', description: '', incurred_at: '' });
  const [financeForm, setFinanceForm] = useState({ fipe_value: '', commission: '', return_to_seller: '' });

  // plataformas
  useEffect(() => {
    (async () => {
      try {
        const p = externalPlatforms?.length ? externalPlatforms : await getPlatforms();
        setPlatforms(p || []);
      } catch (err) {
        console.error('Erro carregar platforms:', err);
        setPlatforms([]);
      }
    })();
  }, [externalPlatforms]);

  // lookup platform
  const pfById = useMemo(() => {
    const map = {};
    (platforms || []).forEach(p => (map[String(p.id)] = p));
    return map;
  }, [platforms]);

  const marketplacePlatforms = (platforms || []).filter(p => p.platform_type === 'marketplace');
  const socialPlatforms = (platforms || []).filter(p => p.platform_type === 'social');

  // agrega resumos por carro (REGRAS CORRETAS)
  useEffect(() => {
    const carIds = (cars || []).map(c => c.id).filter(Boolean);
    if (carIds.length === 0) { setSummaryMap({}); return; }

    let mounted = true;
    (async () => {
      try {
        const [pubs, exps] = await Promise.all([
          getPublicationsForCars(carIds),
          getExpensesForCars(carIds)
        ]);

        const sum = {};
        carIds.forEach(id => {
          sum[id] = {
            adsCount: 0,            // QTD de anúncios (marketplace)
            adSpendTotal: 0,        // soma do spent (marketplace)
            socialCount: 0,         // QTD de publicações (redes)
            socialSet: new Set(),   // nomes únicos das redes
            extraExpensesTotal: 0,  // gastos extras (vehicle_expenses.amount)
            extraChargedTotal: 0    // ganhos extras (vehicle_expenses.charged_value)
          };
        });

        (pubs || []).forEach(p => {
          const id = p.car_id;
          if (!sum[id]) return;

          const pf = p.platform_id ? pfById[String(p.platform_id)] : null;
          const link = String(p.link || '').toLowerCase();

          const isMarketplace = pf?.platform_type === 'marketplace';
          const isSocial =
            pf?.platform_type === 'social' ||
            (!pf && (link.includes('instagram.com') || link.includes('youtu.be') || link.includes('youtube.com') || link.includes('tiktok.com') || link.includes('facebook.com')));

          // Anúncios = somente marketplace
          if (isMarketplace) {
            sum[id].adsCount += 1;
            sum[id].adSpendTotal += Number(p.spent || 0);
          }

          // Publicações = somente redes sociais
          if (isSocial) {
            sum[id].socialCount += 1;
            const name = pf?.name ||
              (link.includes('instagram') ? 'Instagram' :
               link.includes('youtube') || link.includes('youtu.be') ? 'YouTube' :
               link.includes('tiktok') ? 'TikTok' :
               link.includes('facebook') ? 'Facebook' : 'Social');
            sum[id].socialSet.add(name.toLowerCase());
          }
        });

        (exps || []).forEach(e => {
          const id = e.car_id;
          if (!sum[id]) return;
          sum[id].extraExpensesTotal += Number(e.amount || 0);
          sum[id].extraChargedTotal += Number(e.charged_value || 0);
        });

        const finalMap = {};
        Object.keys(sum).forEach(id => {
          finalMap[id] = {
            adsCount: sum[id].adsCount,
            adSpendTotal: sum[id].adSpendTotal,
            socialCount: sum[id].socialCount,
            socialList: Array.from(sum[id].socialSet),
            extraExpensesTotal: sum[id].extraExpensesTotal,
            extraChargedTotal: sum[id].extraChargedTotal
          };
        });

        if (mounted) setSummaryMap(finalMap);
      } catch (err) {
        console.error('Erro ao agregar resumos:', err);
      }
    })();

    return () => { mounted = false; };
  }, [cars, pfById]);

  // abrir via "abrir carro" externo
  useEffect(() => {
    if (openCar?.id) {
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

  // buscar dados do carro
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

  // abrir modal por botão da lista
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

  // PUBLICAÇÕES - salvar/remover
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
        toast({ title: 'Registro salvo' });
      }
      await fetchAll(selectedCar.id);
      if (refreshAll) refreshAll();
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro ao salvar', description: err.message || String(err), variant: 'destructive' });
    }
  };

  const removePublication = async (id) => {
    try {
      await deletePublication(id);
      setPublications(prev => prev.filter(p => p.id !== id));
      toast({ title: 'Registro removido' });
      await fetchAll(selectedCar.id);
      if (refreshAll) refreshAll();
    } catch (err) {
      toast({ title: 'Erro ao remover', description: err.message || String(err), variant: 'destructive' });
    }
  };

  // GASTOS (inclui charged_value para ganhos extras)
  const submitExpense = async () => {
    if (!selectedCar) return;
    try {
      const payload = {
        car_id: selectedCar.id,
        category: expenseForm.category || 'Outros',
        amount: expenseForm.amount ? parseFloat(expenseForm.amount) : 0,
        charged_value: expenseForm.charged_value ? parseFloat(expenseForm.charged_value) : 0,
        description: expenseForm.description || '',
        incurred_at: expenseForm.incurred_at || new Date().toISOString()
      };
      const { data } = await addExpense(payload);
      if (data) {
        setExpenses(prev => [data, ...prev]);
        setExpenseForm({ category: '', amount: '', charged_value: '', description: '', incurred_at: '' });
        toast({ title: 'Gasto/Ganho registrado' });
      }
      await fetchAll(selectedCar.id);
      if (refreshAll) refreshAll();
    } catch (err) {
      toast({ title: 'Erro ao salvar', description: err.message || String(err), variant: 'destructive' });
    }
  };

  const removeExpense = async (id) => {
    try {
      await deleteExpense(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
      toast({ title: 'Registro removido' });
      await fetchAll(selectedCar.id);
      if (refreshAll) refreshAll();
    } catch (err) {
      toast({ title: 'Erro ao remover', description: err.message || String(err), variant: 'destructive' });
    }
  };

  // FINANCEIRO
  const computeProfitForSelected = () => {
    if (!selectedCar) return 0;
    const s = summaryMap[selectedCar.id] || { adSpendTotal: 0, extraExpensesTotal: 0, extraChargedTotal: 0 };
    const commission = Number(financeForm.commission || selectedCar.commission || 0);
    // Lucro Estimado = Comissão + (Ganhos extras) - (Gastos extras) - (Anúncios)
    return commission + Number(s.extraChargedTotal) - Number(s.extraExpensesTotal) - Number(s.adSpendTotal);
  };

  const saveFinance = async () => {
    if (!selectedCar) return;
    try {
      const s = summaryMap[selectedCar.id] || { adSpendTotal: 0, extraExpensesTotal: 0, extraChargedTotal: 0 };
      const fipe_value = financeForm.fipe_value !== '' ? parseFloat(financeForm.fipe_value) : null;
      const commission = financeForm.commission !== '' ? parseFloat(financeForm.commission) : 0;
      const return_to_seller = financeForm.return_to_seller !== '' ? parseFloat(financeForm.return_to_seller) : 0;

      const profit = commission + Number(s.extraChargedTotal) - (Number(s.adSpendTotal) + Number(s.extraExpensesTotal));

      const patch = { fipe_value, commission, return_to_seller, profit, profit_percent: null };
      const { error } = await updateCar(selectedCar.id, patch);
      if (error) throw error;

      setSelectedCar(prev => ({ ...(prev || {}), ...patch }));
      toast({ title: 'Financeiro atualizado' });
      await fetchAll(selectedCar.id);
      if (refreshAll) refreshAll();
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
        toast({ title: 'FIPE atualizada', description: Money({ value: res.value }) });
      } else {
        toast({ title: 'Não encontrado na FIPE', description: (res?.debug || []).join(' • '), variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Erro ao consultar FIPE', description: String(e), variant: 'destructive' });
    }
  };

  const getSummary = (carId) =>
    summaryMap[carId] || { adsCount: 0, adSpendTotal: 0, socialCount: 0, socialList: [], extraExpensesTotal: 0, extraChargedTotal: 0 };

  // filtros da listagem
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const filteredCars = useMemo(() => {
    const term = (searchTerm || '').trim().toLowerCase();
    return (cars || []).filter(c => {
      if (brandFilter && brandFilter !== 'ALL' && String((c.brand || '')).toLowerCase() !== String(brandFilter).toLowerCase()) return false;
      if (!term) return true;
      const brand = (c.brand || '').toLowerCase();
      const model = (c.model || '').toLowerCase();
      const plate = (c.plate || '').toLowerCase();
      return brand.includes(term) || model.includes(term) || plate.includes(term) || `${brand} ${model} ${plate}`.includes(term);
    });
  }, [cars, searchTerm, brandFilter]);

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
        {filteredCars.map(car => {
          const s = getSummary(car.id);
          const sold = !!car.is_sold || car.is_available === false;

          // diferença vs FIPE
          const fipe = Number(car.fipe_value || 0);
          const price = Number(car.price || 0);
          const diffPct = fipe > 0 ? ((price - fipe) / fipe) * 100 : null;

          // lucro estimado (exibição)
          const estimatedProfit = (car.commission ?? 0) + s.extraChargedTotal - (s.adSpendTotal + s.extraExpensesTotal);

          return (
            <div key={car.id} className={`bg-white rounded-xl p-4 flex items-center justify-between shadow transition hover:shadow-lg ${sold ? 'opacity-80' : ''}`}>
              <div className="flex items-start gap-4">
                <img src={car.main_photo_url || 'https://placehold.co/96x64/e2e8f0/4a5568?text=Sem+Foto'} alt={`${car.brand} ${car.model}`} className={`h-20 w-28 object-cover rounded-md ${sold ? 'filter grayscale brightness-75' : ''}`} />
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div>
                      <div className="font-bold text-lg">{car.brand} {car.model} <span className="text-sm text-gray-500">({car.year})</span></div>
                      <div className="text-sm text-gray-600">
                        Preço: <span className="font-semibold">{Money({ value: car.price })}</span>
                        {diffPct !== null && (
                          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${diffPct >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            vs FIPE: {diffPct >= 0 ? '+' : ''}{diffPct.toFixed(1)}%
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Placa: <strong>{car.plate || '-'}</strong></div>
                    </div>
                    {sold && <span className="ml-2 text-sm bg-red-600 text-white px-2 py-0.5 rounded-full font-semibold">VENDIDO</span>}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-6 text-sm text-gray-600">
                    {/* Anúncios (marketplaces) */}
                    <div className="flex items-center gap-2">
                      <Megaphone className="h-4 w-4 text-yellow-500" />
                      <div>
                        <div className="text-xs">Anúncios</div>
                        <div className="font-medium">{s.adsCount} • {Money({ value: s.adSpendTotal })}</div>
                      </div>
                    </div>

                    {/* Publicações (redes sociais) */}
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1">
                        {s.socialList.slice(0,3).map((nm, i) => (
                          <div key={`${nm}-${i}`} className="inline-flex items-center">
                            <SocialIcon name={nm} />
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className="text-xs">Publicações</div>
                        <div className="font-medium">{s.socialCount}</div>
                      </div>
                    </div>

                    {/* Gastos extras */}
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-green-500" />
                      <div>
                        <div className="text-xs">Gastos extras</div>
                        <div className="font-medium">{Money({ value: s.extraExpensesTotal })}</div>
                      </div>
                    </div>

                    {/* Ganhos extras */}
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-indigo-600" />
                      <div>
                        <div className="text-xs">Ganhos extras</div>
                        <div className="font-medium">{Money({ value: s.extraChargedTotal })}</div>
                      </div>
                    </div>

                    {/* Lucro estimado */}
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-indigo-600" />
                      <div>
                        <div className="text-xs">Lucro estimado</div>
                        <div className={`font-semibold ${estimatedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{Money({ value: estimatedProfit })}</div>
                      </div>
                    </div>

                    {/* FIPE / Comissão / Devolver */}
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

      {/* MODAL */}
      <Dialog
        open={open}
        onOpenChange={(o) => {
          // ao fechar, atualiza a aba Gestão (sem F5)
          if (!o) {
            if (refreshAll) refreshAll();
            setSelectedCar(null);
          }
          setOpen(o);
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Gestão - {selectedCar ? `${selectedCar.brand} ${selectedCar.model}` : ''}</DialogTitle>
            <DialogDescription>Publicações, gastos e financeiro por veículo</DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <div className="flex gap-2 mb-4">
              <button onClick={() => setTab('publications_market')} className={`px-3 py-1 rounded ${tab === 'publications_market' ? 'bg-yellow-400 text-black' : 'bg-gray-100'}`}>Anúncios (Marketplaces)</button>
              <button onClick={() => setTab('publications_social')} className={`px-3 py-1 rounded ${tab === 'publications_social' ? 'bg-yellow-400 text-black' : 'bg-gray-100'}`}>Redes Sociais</button>
              <button onClick={() => setTab('expenses')} className={`px-3 py-1 rounded ${tab === 'expenses' ? 'bg-yellow-400 text-black' : 'bg-gray-100'}`}>Gastos/Ganhos</button>
              <button onClick={() => setTab('finance')} className={`px-3 py-1 rounded ${tab === 'finance' ? 'bg-yellow-400 text-black' : 'bg-gray-100'}`}>Financeiro</button>
            </div>

            {/* MARKETPLACES */}
            {tab === 'publications_market' && (
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

                <div className="space-y-2 max-h-64 overflow-auto">
                  {publications
                    .filter(p => pfById[String(p.platform_id)]?.platform_type === 'marketplace')
                    .map(pub => {
                      const pf = pfById[String(pub.platform_id)];
                      return (
                        <div key={pub.id} className="bg-white p-3 border rounded flex items-center justify-between">
                          <div>
                            <div className="font-medium">{pf?.name || '(sem título)'}</div>
                            <div className="text-xs text-gray-500">{pub.link ? <a className="text-blue-600" href={pub.link} target="_blank" rel="noreferrer">Ver anúncio</a> : 'Sem link'}</div>
                            <div className="text-xs text-gray-500">{pub.status} • Gasto: {Money({ value: pub.spent })}</div>
                          </div>
                          <button onClick={() => removePublication(pub.id)} className="text-red-600"><Trash2 /></button>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* REDES SOCIAIS */}
            {tab === 'publications_social' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <select value={pubForm.platform_id} onChange={(e) => setPubForm(f => ({ ...f, platform_id: e.target.value }))} className="w-full p-2 border rounded">
                    <option value="">Plataforma (Redes Sociais)</option>
                    {socialPlatforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input placeholder="Link (post / reel / vídeo)" value={pubForm.link} onChange={(e) => setPubForm(f => ({ ...f, link: e.target.value }))} className="w-full p-2 border rounded" />
                  <input placeholder="Observações" value={pubForm.notes} onChange={(e) => setPubForm(f => ({ ...f, notes: e.target.value }))} className="w-full p-2 border rounded" />
                  <div className="flex gap-2 items-center">
                    <select value={pubForm.status} onChange={(e) => setPubForm(f => ({ ...f, status: e.target.value }))} className="p-2 border rounded">
                      <option value="active">Publicado</option>
                      <option value="draft">Rascunho</option>
                    </select>
                    <Button size="sm" onClick={submitPublication}>Salvar publicação</Button>
                  </div>
                </div>

                <div className="space-y-2 max-h-64 overflow-auto">
                  {publications
                    .filter(p => {
                      const pf = pfById[String(p.platform_id)];
                      const link = String(p.link || '').toLowerCase();
                      return pf?.platform_type === 'social' ||
                        (!pf && (link.includes('instagram.com') || link.includes('youtube.com') || link.includes('youtu.be') || link.includes('tiktok.com') || link.includes('facebook.com')));
                    })
                    .map(pub => {
                      const pf = pfById[String(pub.platform_id)];
                      return (
                        <div key={pub.id} className="bg-white p-3 border rounded flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <SocialIcon name={pf?.name} link={pub.link} />
                            <div>
                              <div className="font-medium">{pf?.name || '(sem título)'}</div>
                              <div className="text-xs text-gray-500">{pub.link ? <a className="text-blue-600" href={pub.link} target="_blank" rel="noreferrer">Ver post</a> : 'Sem link'}</div>
                              <div className="text-xs text-gray-500">{pub.status}</div>
                            </div>
                          </div>
                          <button onClick={() => removePublication(pub.id)} className="text-red-600"><Trash2 /></button>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* GASTOS / GANHOS */}
            {tab === 'expenses' && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input placeholder="Categoria (ex: Documentação)" value={expenseForm.category} onChange={(e) => setExpenseForm(f => ({ ...f, category: e.target.value }))} className="p-2 border rounded" />
                  <input placeholder="Gasto (R$)" type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm(f => ({ ...f, amount: e.target.value }))} className="p-2 border rounded" />
                  <input placeholder="Valor Cobrado (R$)" type="number" value={expenseForm.charged_value} onChange={(e) => setExpenseForm(f => ({ ...f, charged_value: e.target.value }))} className="p-2 border rounded" />
                  <input placeholder="Data" type="date" value={expenseForm.incurred_at ? expenseForm.incurred_at.slice(0,10) : ''} onChange={(e) => setExpenseForm(f => ({ ...f, incurred_at: e.target.value ? new Date(e.target.value).toISOString() : '' }))} className="p-2 border rounded" />
                  <input placeholder="Descrição" value={expenseForm.description} onChange={(e) => setExpenseForm(f => ({ ...f, description: e.target.value }))} className="p-2 border rounded md:col-span-2" />
                  <div className="col-span-full flex gap-2">
                    <Button onClick={submitExpense}>Salvar</Button>
                  </div>
                </div>

                <div className="space-y-2 max-h-64 overflow-auto">
                  {expenses.map(exp => (
                    <div key={exp.id} className="bg-white p-3 border rounded flex items-center justify-between">
                      <div>
                        <div className="font-medium">{exp.category} — Gasto: {Money({ value: exp.amount })} • Cobrado: {Money({ value: exp.charged_value })}</div>
                        <div className="text-xs text-gray-500">{exp.description}</div>
                        <div className="text-xs text-gray-400">{exp.incurred_at ? new Date(exp.incurred_at).toLocaleDateString() : ''}</div>
                      </div>
                      <button onClick={() => removeExpense(exp.id)} className="text-red-600"><Trash2 /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FINANCEIRO */}
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
                  <div className="text-sm text-gray-600">Resumo</div>
                  <div className="mt-2 flex gap-4 flex-wrap">
                    <div className="text-sm">Gasto com anúncios: <strong>{Money({ value: (summaryMap[selectedCar.id] || {}).adSpendTotal || 0 })}</strong></div>
                    <div className="text-sm">Gastos extras: <strong>{Money({ value: (summaryMap[selectedCar.id] || {}).extraExpensesTotal || 0 })}</strong></div>
                    <div className="text-sm">Ganhos extras: <strong>{Money({ value: (summaryMap[selectedCar.id] || {}).extraChargedTotal || 0 })}</strong></div>
                    <div className="text-sm">Lucro estimado: <strong className={`${computeProfitForSelected() >= 0 ? 'text-green-600' : 'text-red-600'}`}>{Money({ value: computeProfitForSelected() })}</strong></div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setOpen(false)}>Fechar</Button>
                  <Button onClick={saveFinance}>Salvar Financeiro</Button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VehicleManager;

