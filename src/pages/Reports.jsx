// src/pages/Reports.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Calendar, DollarSign, BarChart2, PieChart, TrendingUp, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BackgroundShape from '@/components/BackgroundShape';
import { getCars, getPlatforms, getPublicationsForCars, getExpensesForCars, getSales } from '@/lib/car-api';
import { format, parseISO } from 'date-fns';

// ---- Small UI helpers ----
const Money = ({ value }) => {
  const v = Number(value || 0);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
};

const Card = ({ children, className = '' }) => (
  <motion.div initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.35 }} className={`bg-white rounded-2xl shadow p-4 ${className}`}>
    {children}
  </motion.div>
);

// Simple sparkline (array of numbers)
const Sparkline = ({ values = [] }) => {
  const width = 120, height = 40, padding = 2;
  const max = Math.max(...values, 1);
  const points = values.map((v, i) => {
    const x = (i / Math.max(1, values.length - 1)) * (width - padding * 2) + padding;
    const y = height - padding - (v / max) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
      <polyline fill="none" stroke="#f59e0b" strokeWidth="2" points={points} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// Tiny horizontal bar for proportions
const TinyBar = ({ value = 0, max = 1, color = '#10B981' }) => {
  const pct = Math.max(0, Math.min(1, (max === 0 ? 0 : value / max)));
  return (
    <div className="w-40 bg-gray-100 rounded-full h-2 overflow-hidden">
      <div style={{ width: `${pct * 100}%`, background: color, height: '100%' }} />
    </div>
  );
};

// ---- Main Reports component ----
const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [cars, setCars] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [publications, setPublications] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [sales, setSales] = useState([]);

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3); // default last 3 months
    return d.toISOString().slice(0,10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0,10));
  const [platformFilter, setPlatformFilter] = useState('');

  // Fetch base data
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [carsData, platformData] = await Promise.all([getCars(), getPlatforms()]);
        if (!mounted) return;
        setCars(Array.isArray(carsData) ? carsData : []);
        setPlatforms(Array.isArray(platformData) ? platformData : []);
      } catch (err) {
        console.error('Erro ao buscar base data:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // When date or platform filter changes, fetch related tables (publications, expenses, sales) in that window
  useEffect(() => {
    const fetchRangeData = async () => {
      setLoading(true);
      try {
        const carIds = cars.map(c => c.id).filter(Boolean);
        // publications and expenses endpoints exist as bulk getters
        const [pubs, exps] = await Promise.all([
          getPublicationsForCars ? getPublicationsForCars(carIds) : Promise.resolve([]),
          getExpensesForCars ? getExpensesForCars(carIds) : Promise.resolve([])
        ]);
        setPublications(pubs || []);
        setExpenses(exps || []);

        // sales with filters
        const salesData = await getSales({
          startDate, endDate,
          platform_id: platformFilter || undefined
        });
        setSales(Array.isArray(salesData) ? salesData : []);
      } catch (err) {
        console.error('Erro fetching range data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (cars.length > 0) fetchRangeData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cars, startDate, endDate, platformFilter]);

  // --- Derived metrics ---
  const totals = useMemo(() => {
    const totalInStock = cars.filter(c => !c.is_sold).length;
    const totalSold = cars.filter(c => !!c.is_sold).length;

    // financial tallies
    // Prefer profit column if available, otherwise compute: commission - (adSpend + extras)
    let totalProfit = 0;
    let totalCommission = 0;
    let totalAdSpend = 0;
    let totalExtra = 0;
    let totalSalesValue = 0;

    const pubMap = publications.reduce((acc, p) => {
      if (!p.car_id) return acc;
      acc[p.car_id] = acc[p.car_id] || { spent: 0, count: 0 };
      acc[p.car_id].spent += Number(p.spent || 0);
      acc[p.car_id].count += 1;
      return acc;
    }, {});

    const expMap = expenses.reduce((acc, e) => {
      if (!e.car_id) return acc;
      acc[e.car_id] = acc[e.car_id] || 0;
      acc[e.car_id] += Number(e.amount || 0);
      return acc;
    }, {});

    // For sales aggregated in selected date range
    const salesPerCar = {};
    (sales || []).forEach(s => {
      if (!s.car_id) return;
      salesPerCar[s.car_id] = salesPerCar[s.car_id] || [];
      salesPerCar[s.car_id].push(s);
      totalSalesValue += Number(s.sale_price || 0);
    });

    cars.forEach(car => {
      const ad = pubMap[car.id] ? pubMap[car.id].spent : 0;
      const extra = expMap[car.id] || 0;
      const comm = Number(car.commission || 0);
      const profit = (Number(car.profit) || (comm - (ad + extra)));
      totalAdSpend += ad;
      totalExtra += extra;
      totalCommission += comm;
      totalProfit += profit;
    });

    return {
      totalInStock,
      totalSold,
      totalProfit,
      totalCommission,
      totalAdSpend,
      totalExtra,
      totalSalesValue
    };
  }, [cars, publications, expenses, sales]);

  // Top brand by sold count (within all time)
  const topBrand = useMemo(() => {
    const counts = {};
    cars.forEach(c => {
      const brand = (c.brand || '—').trim();
      counts[brand] = counts[brand] || 0;
      if (c.is_sold) counts[brand] += 1;
    });
    const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]);
    return sorted[0] ? { brand: sorted[0][0], count: sorted[0][1] } : null;
  }, [cars]);

  // Best platform for sales (based on sales fetched in range or all time if no filter)
  const bestPlatform = useMemo(() => {
    const counts = {};
    sales.forEach(s => {
      const p = (s.platforms && s.platforms.name) ? s.platforms.name : 'Indefinida';
      counts[p] = (counts[p] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]);
    return sorted[0] ? { platform: sorted[0][0], count: sorted[0][1] } : null;
  }, [sales]);

  // build monthly sales series (between startDate and endDate)
  const salesSeries = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = [];
    const pointer = new Date(start.getFullYear(), start.getMonth(), 1);
    while (pointer <= end) {
      months.push({ key: `${pointer.getFullYear()}-${pointer.getMonth()+1}`, date: new Date(pointer), count: 0, revenue: 0 });
      pointer.setMonth(pointer.getMonth()+1);
    }
    sales.forEach(s => {
      const d = new Date(s.sale_date || s.created_at || s.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()+1}`;
      const slot = months.find(m => m.key === key);
      if (slot) {
        slot.count += 1;
        slot.revenue += Number(s.sale_price || 0);
      }
    });
    return months;
  }, [sales, startDate, endDate]);

  // quick pie data for expense breakdown
  const expenseBreakdown = useMemo(() => {
    return [
      { label: 'Anúncios', value: totals.totalAdSpend },
      { label: 'Extras', value: totals.totalExtra },
      { label: 'Comissão', value: totals.totalCommission }
    ];
  }, [totals]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-yellow-500 font-semibold animate-pulse">Carregando relatórios...</div>
      </div>
    );
  }

  // ---- UI ----
  return (
    <div className="relative isolate min-h-screen bg-gray-50 text-gray-800 pt-28 pb-12">
      <Helmet><title>Relatórios - AutenTicco Motors</title></Helmet>
      <BackgroundShape />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Relatórios</h1>
          <p className="text-gray-600 mb-6">Visão completa dos números da operação. Use os filtros abaixo para ajustar o período e a plataforma.</p>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 items-center mb-6">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Período:</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="p-2 border rounded" />
            <span className="text-gray-400">até</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="p-2 border rounded" />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Plataforma:</label>
            <select className="p-2 border rounded" value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}>
              <option value="">Todas</option>
              {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="ml-auto">
            <Button onClick={() => { setStartDate(new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().slice(0,10)); setEndDate(new Date().toISOString().slice(0,10)); }}>Últimos 3 meses</Button>
          </div>
        </div>

        {/* Top summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart2 className="h-6 w-6 text-yellow-500" />
                <div>
                  <div className="text-xs text-gray-500">Veículos em Estoque</div>
                  <div className="text-xl font-bold">{totals.totalInStock}</div>
                </div>
              </div>
              <div className="text-sm text-gray-500">Atual</div>
            </div>
            <div className="mt-3 text-sm text-gray-600">Mostra quantos veículos estão ativos (não vendidos)</div>
          </Card>

          <Card className="flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PieChart className="h-6 w-6 text-pink-500" />
                <div>
                  <div className="text-xs text-gray-500">Veículos Vendidos</div>
                  <div className="text-xl font-bold">{totals.totalSold}</div>
                </div>
              </div>
              <div className="text-sm text-gray-500">No sistema</div>
            </div>
            <div className="mt-3 text-sm text-gray-600">{topBrand ? `Marca mais vendida: ${topBrand.brand} (${topBrand.count})` : 'Sem dados'}</div>
          </Card>

          <Card className="flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className="h-6 w-6 text-green-500" />
                <div>
                  <div className="text-xs text-gray-500">Lucro Total</div>
                  <div className="text-xl font-bold"><Money value={totals.totalProfit} /></div>
                </div>
              </div>
              <div className="text-sm text-gray-500">Período</div>
            </div>
            <div className="mt-3 text-sm text-gray-600">Lucro estimado: comissão menos (anúncios + extras)</div>
          </Card>

          <Card className="flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-indigo-500" />
                <div>
                  <div className="text-xs text-gray-500">Receita de Vendas</div>
                  <div className="text-xl font-bold"><Money value={totals.totalSalesValue} /></div>
                </div>
              </div>
              <div className="text-sm text-gray-500">{bestPlatform ? bestPlatform.platform : '-'}</div>
            </div>
            <div className="mt-3 text-sm text-gray-600">Melhor plataforma no período (por vendas)</div>
          </Card>
        </div>

        {/* Charts + breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Sales Over Time (bar) */}
          <Card className="col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><BarChart2 className="h-5 w-5 text-yellow-500" /><h3 className="font-semibold">Vendas por mês</h3></div>
              <div className="text-sm text-gray-500">Período selecionado</div>
            </div>

            <div className="w-full h-40 flex items-end gap-3">
              {salesSeries.map((m, idx) => {
                const maxCount = Math.max(...salesSeries.map(x => x.count), 1);
                const h = (m.count / maxCount) * 100;
                return (
                  <div key={m.key} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-yellow-200 rounded-t" style={{ height: `${Math.max(6, h)}%` }} />
                    <div className="text-xs text-gray-600 mt-2">{format(m.date, 'MMM/yy')}</div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 text-sm text-gray-600">Total de vendas no período: <strong>{sales.length}</strong></div>
          </Card>

          {/* Expense Breakdown + sparkline */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><Layers className="h-5 w-5 text-green-500" /><h3 className="font-semibold">Despesas</h3></div>
              <div className="text-sm text-gray-500">Resumo</div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">Gasto com anúncios</div>
                <div className="text-sm font-bold"><Money value={totals.totalAdSpend} /></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">Gastos extras</div>
                <div className="text-sm font-bold"><Money value={totals.totalExtra} /></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">Comissões</div>
                <div className="text-sm font-bold"><Money value={totals.totalCommission} /></div>
              </div>

              <div className="mt-2">
                <Sparkline values={salesSeries.map(s => s.revenue)} />
              </div>
            </div>
          </Card>
        </div>

        {/* Platforms ranking + details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><PieChart className="h-5 w-5 text-pink-500" /><h3 className="font-semibold">Plataformas (vendas)</h3></div>
              <div className="text-sm text-gray-500">Filtro: período atual</div>
            </div>

            <div className="space-y-3">
              {(() => {
                const counts = {};
                sales.forEach(s => {
                  const name = (s.platforms && s.platforms.name) ? s.platforms.name : 'Indicação/Outro';
                  counts[name] = (counts[name] || 0) + 1;
                });
                const items = Object.entries(counts).sort((a,b) => b[1]-a[1]);
                const max = items[0] ? items[0][1] : 1;
                return items.length ? items.map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{name}</div>
                      <div className="text-xs text-gray-500">{count} venda(s)</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <TinyBar value={count} max={max} color="#f43f5e" />
                      <div className="text-sm font-semibold">{count}</div>
                    </div>
                  </div>
                )) : <div className="text-sm text-gray-500">Sem vendas no período selecionado.</div>;
              })()}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><Calendar className="h-5 w-5 text-gray-600" /><h3 className="font-semibold">Resumo Rápido</h3></div>
              <div className="text-sm text-gray-500">Totais</div>
            </div>

            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex justify-between"><div>Total em estoque:</div><div className="font-semibold">{totals.totalInStock}</div></div>
              <div className="flex justify-between"><div>Total vendidos:</div><div className="font-semibold">{totals.totalSold}</div></div>
              <div className="flex justify-between"><div>Receita (vendas):</div><div className="font-semibold"><Money value={totals.totalSalesValue} /></div></div>
              <div className="flex justify-between"><div>Total anúncios:</div><div className="font-semibold"><Money value={totals.totalAdSpend} /></div></div>
              <div className="flex justify-between"><div>Total gastos extras:</div><div className="font-semibold"><Money value={totals.totalExtra} /></div></div>
              <div className="flex justify-between"><div>Total comissões:</div><div className="font-semibold"><Money value={totals.totalCommission} /></div></div>
              <hr />
              <div className="flex justify-between"><div>Lucro estimado (soma):</div><div className="font-bold"><Money value={totals.totalProfit} /></div></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Reports;

