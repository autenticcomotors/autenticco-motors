// src/pages/Reports.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Calendar, DollarSign, BarChart2, PieChart, TrendingUp, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BackgroundShape from '@/components/BackgroundShape';
import { getCars, getPlatforms, getPublicationsForCars, getExpensesForCars, getSales } from '@/lib/car-api';
import { format } from 'date-fns';

const Money = ({ value }) => {
  const v = Number(value || 0);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
};

const Card = ({ children, className = '' }) => (
  <motion.div initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.28 }} className={`bg-white rounded-2xl shadow-sm p-6 ${className}`}>
    {children}
  </motion.div>
);

// very small sparkline (keeps bundle light)
const Sparkline = ({ values = [] }) => {
  const width = 140, height = 44, padding = 4;
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

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [cars, setCars] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [publications, setPublications] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [sales, setSales] = useState([]);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [platformFilter, setPlatformFilter] = useState('');

  useEffect(() => {
    let mounted = true;
    const loadBase = async () => {
      setLoading(true);
      try {
        const [carsData, platformData] = await Promise.all([getCars(), getPlatforms()]);
        if (!mounted) return;
        setCars(Array.isArray(carsData) ? carsData : []);
        setPlatforms(Array.isArray(platformData) ? platformData : []);
      } catch (err) {
        console.error('Erro base fetch:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadBase();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!cars.length) return;
    let mounted = true;
    const loadRange = async () => {
      setLoading(true);
      try {
        const carIds = cars.map(c => c.id).filter(Boolean);
        const [pubs, exps] = await Promise.all([
          getPublicationsForCars(carIds),
          getExpensesForCars(carIds)
        ]);
        const salesData = await getSales({
          startDate, endDate,
          platform_id: platformFilter || undefined
        });
        if (!mounted) return;
        setPublications(Array.isArray(pubs) ? pubs : []);
        setExpenses(Array.isArray(exps) ? exps : []);
        setSales(Array.isArray(salesData) ? salesData : []);
      } catch (err) {
        console.error('Erro range fetch:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadRange();
    return () => { mounted = false; };
  }, [cars, startDate, endDate, platformFilter]);

  // Derived maps for fast lookup
  const pubMap = useMemo(() => {
    return publications.reduce((acc, p) => {
      if (!p.car_id) return acc;
      acc[p.car_id] = acc[p.car_id] || { spent: 0, count: 0 };
      acc[p.car_id].spent += Number(p.spent || 0);
      acc[p.car_id].count += 1;
      return acc;
    }, {});
  }, [publications]);

  const expMap = useMemo(() => {
    return expenses.reduce((acc, e) => {
      if (!e.car_id) return acc;
      acc[e.car_id] = acc[e.car_id] || 0;
      acc[e.car_id] += Number(e.amount || 0);
      return acc;
    }, {});
  }, [expenses]);

  const salesPerCar = useMemo(() => {
    const map = {};
    (sales || []).forEach(s => {
      if (!s.car_id) return;
      map[s.car_id] = map[s.car_id] || [];
      map[s.car_id].push(s);
    });
    return map;
  }, [sales]);

  // Totals separation: realProfit (sold cars), estimatedProfit (unsold)
  const totals = useMemo(() => {
    let totalInStock = 0;
    let totalSold = 0;
    let totalRealProfit = 0;       // lucro real de carros vendidos (com sale.profit se existir)
    let totalEstimatedProfit = 0;  // lucro estimado para carros não vendidos
    let totalAdSpend = 0;
    let totalExtra = 0;
    let totalCommission = 0;
    let totalSalesValue = 0;

    cars.forEach(car => {
      const ad = pubMap[car.id] ? pubMap[car.id].spent : 0;
      const extra = expMap[car.id] || 0;
      const commission = Number(car.commission || 0);
      totalAdSpend += ad;
      totalExtra += extra;
      totalCommission += commission;

      const soldFlag = Boolean(car.is_sold || car.is_available === false);
      if (soldFlag) {
        totalSold += 1;
        // use salesPerCar to find sale in selected range; if none, try most recent sale overall
        const carSales = salesPerCar[car.id] || [];
        let profitFromSale = 0;
        if (carSales.length > 0) {
          // sumariza lucros das vendas no período (provavelmente 1)
          carSales.forEach(s => {
            const recordedProfit = Number(s.profit || 0);
            if (recordedProfit) {
              profitFromSale += recordedProfit;
            } else {
              // fallback: sale_price - (ad + extra)
              const salePrice = Number(s.sale_price || 0);
              profitFromSale += (salePrice - (ad + extra));
            }
            totalSalesValue += Number(s.sale_price || 0);
          });
        } else {
          // se não há sale no período, mas carro marcado como vendido, tentar usar car.sale_price
          if (car.sale_price) {
            const salePrice = Number(car.sale_price || 0);
            profitFromSale += (salePrice - (ad + extra));
            totalSalesValue += salePrice;
          }
        }
        totalRealProfit += profitFromSale;
      } else {
        totalInStock += 1;
        // estimated profit according to your rule: commission - (ad + extra)
        const est = commission - (ad + extra);
        totalEstimatedProfit += est;
      }
    });

    return {
      totalInStock,
      totalSold,
      totalRealProfit,
      totalEstimatedProfit,
      totalAdSpend,
      totalExtra,
      totalCommission,
      totalSalesValue
    };
  }, [cars, pubMap, expMap, salesPerCar]);

  // best platform in range
  const bestPlatform = useMemo(() => {
    const counts = {};
    sales.forEach(s => {
      const name = (s.platforms && s.platforms.name) ? s.platforms.name : 'Outro/Indicação';
      counts[name] = (counts[name] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]);
    return sorted.length ? { platform: sorted[0][0], count: sorted[0][1] } : null;
  }, [sales]);

  // monthly series
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
      const d = new Date(s.sale_date || s.created_at || Date.now());
      const key = `${d.getFullYear()}-${d.getMonth()+1}`;
      const slot = months.find(m => m.key === key);
      if (slot) {
        slot.count += 1;
        slot.revenue += Number(s.sale_price || 0);
      }
    });
    return months;
  }, [sales, startDate, endDate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-yellow-500 font-semibold animate-pulse">Carregando relatórios...</div>
      </div>
    );
  }

  // clean / airy layout adjustments (fewer cards, more spacing)
  return (
    <div className="relative isolate min-h-screen bg-gray-50 text-gray-800 pt-28 pb-12">
      <Helmet><title>Relatórios - AutenTicco Motors</title></Helmet>
      <BackgroundShape />
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32 }}>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-1">Relatórios</h1>
          <p className="text-gray-600 mb-6">Visão limpa e direta dos números. Use os filtros para ajustar período e plataforma.</p>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row items-center gap-3 mb-6">
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

        {/* Top summary: 3 cards in a row (airy) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          <Card className="flex flex-col justify-between">
            <div className="text-sm text-gray-500">Veículos em Estoque</div>
            <div className="flex items-center justify-between mt-4">
              <div>
                <div className="text-2xl font-bold text-gray-900">{totals.totalInStock}</div>
                <div className="text-sm text-gray-500 mt-1">Ativos (não vendidos)</div>
              </div>
              <div className="text-sm text-gray-400">Atual</div>
            </div>
          </Card>

          <Card className="flex flex-col justify-between">
            <div className="text-sm text-gray-500">Veículos Vendidos</div>
            <div className="flex items-center justify-between mt-4">
              <div>
                <div className="text-2xl font-bold text-gray-900">{totals.totalSold}</div>
                <div className="text-sm text-gray-500 mt-1">Marca mais vendida: {/* small info */} {''}</div>
              </div>
              <div className="text-sm text-gray-400">No sistema</div>
            </div>
          </Card>

          <Card className="flex flex-col justify-between">
            <div className="text-sm text-gray-500">Lucro (Real / Estimado)</div>

            <div className="mt-4">
              {/* if we have real profit (sold) for the period show it first */}
              <div className="text-2xl font-bold text-gray-900">
                {totals.totalRealProfit !== 0 ? <Money value={totals.totalRealProfit} /> : <Money value={totals.totalEstimatedProfit} />}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {totals.totalRealProfit !== 0 ? 'Lucro real (apenas veículos vendidos no período)' : 'Lucro estimado (veículos não vendidos)'}
              </div>

              {/* always show the other value in smaller text under */}
              <div className="mt-3 text-sm text-gray-600">
                <div><strong>Lucro real:</strong> <span className="ml-2"><Money value={totals.totalRealProfit} /></span></div>
                <div className="mt-1"><strong>Lucro estimado:</strong> <span className="ml-2"><Money value={totals.totalEstimatedProfit} /></span></div>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><BarChart2 className="h-5 w-5 text-yellow-500" /><h3 className="font-semibold">Vendas por mês</h3></div>
              <div className="text-sm text-gray-500">Período selecionado</div>
            </div>

            <div className="mt-6 h-40 flex items-end gap-4">
              {salesSeries.map((m, idx) => {
                const maxCount = Math.max(...salesSeries.map(x => x.count), 1);
                const h = (m.count / maxCount) * 100;
                return (
                  <div key={m.key} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-yellow-200 rounded-t" style={{ height: `${Math.max(6, h)}%` }} />
                    <div className="text-xs text-gray-500 mt-2">{format(m.date, 'MMM/yy')}</div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 text-sm text-gray-600">Total de vendas no período: <strong>{sales.length}</strong></div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2"><Layers className="h-5 w-5 text-green-500" /><h3 className="font-semibold">Despesas</h3></div>
              <div className="text-sm text-gray-500">Resumo</div>
            </div>

            <div className="mt-3 space-y-3 text-sm">
              <div className="flex justify-between"><div>Gasto com anúncios</div><div className="font-semibold"><Money value={totals.totalAdSpend} /></div></div>
              <div className="flex justify-between"><div>Gastos extras</div><div className="font-semibold"><Money value={totals.totalExtra} /></div></div>
              <div className="flex justify-between"><div>Comissões</div><div className="font-semibold"><Money value={totals.totalCommission} /></div></div>
            </div>

            <div className="mt-4">
              <Sparkline values={salesSeries.map(s => s.revenue)} />
            </div>
          </Card>
        </div>

        {/* Platforms + quick summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><PieChart className="h-5 w-5 text-pink-500" /><h3 className="font-semibold">Plataformas (vendas)</h3></div>
              <div className="text-sm text-gray-500">Filtro: período atual</div>
            </div>

            <div className="text-sm text-gray-600">
              {sales.length === 0 ? <div>Sem vendas no período selecionado.</div> : (
                (() => {
                  const counts = {};
                  sales.forEach(s => {
                    const name = (s.platforms && s.platforms.name) ? s.platforms.name : 'Outro/Indicação';
                    counts[name] = (counts[name] || 0) + 1;
                  });
                  const items = Object.entries(counts).sort((a,b) => b[1]-a[1]);
                  return items.map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div className="text-sm">{name}</div>
                      <div className="font-semibold">{count}</div>
                    </div>
                  ));
                })()
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><Calendar className="h-5 w-5 text-gray-600" /><h3 className="font-semibold">Resumo Rápido</h3></div>
              <div className="text-sm text-gray-500">Totais</div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><div>Total em estoque:</div><div className="font-semibold">{totals.totalInStock}</div></div>
              <div className="flex justify-between"><div>Total vendidos:</div><div className="font-semibold">{totals.totalSold}</div></div>
              <div className="flex justify-between"><div>Receita (vendas):</div><div className="font-semibold"><Money value={totals.totalSalesValue} /></div></div>
              <div className="flex justify-between"><div>Total anúncios:</div><div className="font-semibold"><Money value={totals.totalAdSpend} /></div></div>
              <div className="flex justify-between"><div>Total gastos extras:</div><div className="font-semibold"><Money value={totals.totalExtra} /></div></div>
              <div className="flex justify-between"><div>Total comissões:</div><div className="font-semibold"><Money value={totals.totalCommission} /></div></div>
              <hr />
              <div className="flex justify-between"><div>Lucro real (período):</div><div className="font-bold"><Money value={totals.totalRealProfit} /></div></div>
              <div className="flex justify-between"><div>Lucro estimado (não vendidos):</div><div className="font-bold"><Money value={totals.totalEstimatedProfit} /></div></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Reports;

