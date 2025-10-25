// src/pages/Reports.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Calendar, DollarSign, BarChart2, PieChart, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BackgroundShape from '@/components/BackgroundShape';
import { format, startOfWeek, startOfMonth, endOfMonth, startOfYear } from 'date-fns';
import { getCars, getPublicationsForCars, getExpensesForCars, getSales } from '@/lib/car-api';

const Money = ({ value }) => {
  const v = Number(value || 0);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
};

const Card = ({ children, className = '' }) => (
  <motion.div initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.28 }} className={`bg-white rounded-2xl shadow-sm p-6 ${className}`}>
    {children}
  </motion.div>
);

// tiny sparkline (svg) — lightweight
const Sparkline = ({ values = [] }) => {
  const width = 160, height = 44, padding = 6;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => {
    const x = padding + (i / Math.max(1, values.length - 1)) * (width - padding * 2);
    const y = height - padding - (v / max) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline fill="none" stroke="#f59e0b" strokeWidth="2" points={pts} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [cars, setCars] = useState([]);
  const [publications, setPublications] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [sales, setSales] = useState([]);

  // Inicial: últimos 3 meses
  const initialEnd = new Date();
  const initialStart = new Date();
  initialStart.setMonth(initialStart.getMonth() - 3);

  const [startDate, setStartDate] = useState(initialStart.toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(initialEnd.toISOString().slice(0, 10));

  // car IDs array helper
  useEffect(() => {
    let mounted = true;
    const loadCars = async () => {
      setLoading(true);
      try {
        const cs = await getCars();
        if (!mounted) return;
        setCars(Array.isArray(cs) ? cs : []);
      } catch (err) {
        console.error('Erro ao buscar carros:', err);
        setCars([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadCars();
    return () => { mounted = false; };
  }, []);

  // quando listagem de carros estiver pronta ou datas mudarem, buscar publicações, gastos e vendas
  useEffect(() => {
    if (!cars.length) return;
    let mounted = true;
    const loadRangeData = async () => {
      setLoading(true);
      try {
        const carIds = cars.map(c => c.id).filter(Boolean);
        // publications & expenses: buscamos tudo para esses carros (controle por veículo)
        const [pubs, exps] = await Promise.all([
          getPublicationsForCars(carIds),
          getExpensesForCars(carIds)
        ]);
        // sales: filtradas por período
        const salesData = await getSales({ startDate, endDate });

        if (!mounted) return;
        setPublications(Array.isArray(pubs) ? pubs : []);
        setExpenses(Array.isArray(exps) ? exps : []);
        setSales(Array.isArray(salesData) ? salesData : []);
      } catch (err) {
        console.error('Erro fetch range:', err);
        if (mounted) {
          setPublications([]);
          setExpenses([]);
          setSales([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadRangeData();
    return () => { mounted = false; };
  }, [cars, startDate, endDate]);

  // maps para lookup rápido por car_id
  const pubMap = useMemo(() => {
    return (publications || []).reduce((acc, p) => {
      if (!p.car_id) return acc;
      acc[p.car_id] = acc[p.car_id] || { spent: 0, count: 0 };
      acc[p.car_id].spent += Number(p.spent ?? p.amount ?? 0);
      acc[p.car_id].count += 1;
      return acc;
    }, {});
  }, [publications]);

  const expMap = useMemo(() => {
    return (expenses || []).reduce((acc, e) => {
      if (!e.car_id) return acc;
      acc[e.car_id] = (acc[e.car_id] || 0) + Number(e.amount ?? e.value ?? 0);
      return acc;
    }, {});
  }, [expenses]);

  // vendas por carro (no período pesquisado)
  const salesPerCar = useMemo(() => {
    const map = {};
    (sales || []).forEach(s => {
      if (!s.car_id) return;
      map[s.car_id] = map[s.car_id] || [];
      map[s.car_id].push(s);
    });
    return map;
  }, [sales]);

  // totais: estoque independente do período, lucro real calculado só com vendas do período
  const totals = useMemo(() => {
    let totalInStock = 0;
    let totalSold = 0;
    let totalRealProfit = 0;
    let totalEstimatedProfit = 0;
    let totalAdSpend = 0;
    let totalExtra = 0;
    let totalCommission = 0;
    let totalSalesValue = 0;

    cars.forEach(car => {
      const ad = pubMap[car.id] ? pubMap[car.id].spent : 0;
      const extra = expMap[car.id] || 0;
      const commission = Number(car.commission ?? 0);
      totalAdSpend += ad;
      totalExtra += extra;
      totalCommission += commission;

      // estoque atual (independente do filtro de data)
      const soldFlag = Boolean(car.is_sold || car.is_available === false);
      if (soldFlag) {
        totalSold += 1;
      } else {
        totalInStock += 1;
        // estimated profit for unsold car (current)
        totalEstimatedProfit += (commission - (ad + extra));
      }
    });

    // Real profit: sumarizar vendas retornadas no período (sales)
    (sales || []).forEach(s => {
      const recordedProfit = Number(s.profit ?? 0);
      if (recordedProfit && recordedProfit !== 0) {
        totalRealProfit += recordedProfit;
      } else {
        // fallback: sale_price - (ad + extra)
        const ad = pubMap[s.car_id] ? pubMap[s.car_id].spent : 0;
        const extra = expMap[s.car_id] || 0;
        const salePrice = Number(s.sale_price ?? 0);
        totalRealProfit += (salePrice - (ad + extra));
      }
      totalSalesValue += Number(s.sale_price ?? 0);
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
  }, [cars, pubMap, expMap, sales]);

  // vendas por mês (para sparkline / barras)
  const salesSeries = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = [];
    const pointer = new Date(start.getFullYear(), start.getMonth(), 1);
    while (pointer <= end) {
      months.push({ key: `${pointer.getFullYear()}-${pointer.getMonth()+1}`, date: new Date(pointer), count: 0, revenue: 0 });
      pointer.setMonth(pointer.getMonth() + 1);
    }
    (sales || []).forEach(s => {
      const d = new Date(s.sale_date ?? s.created_at ?? Date.now());
      const key = `${d.getFullYear()}-${d.getMonth()+1}`;
      const slot = months.find(m => m.key === key);
      if (slot) {
        slot.count += 1;
        slot.revenue += Number(s.sale_price ?? 0);
      }
    });
    return months;
  }, [sales, startDate, endDate]);

  // atalhos de período
  const setShortcut = (type) => {
    const now = new Date();
    if (type === 'week') {
      const s = startOfWeek(now, { weekStartsOn: 1 }); // segunda
      setStartDate(s.toISOString().slice(0,10));
      setEndDate(now.toISOString().slice(0,10));
    } else if (type === 'month') {
      const s = startOfMonth(now);
      setStartDate(s.toISOString().slice(0,10));
      setEndDate(now.toISOString().slice(0,10));
    } else if (type === '3months') {
      const s = new Date(); s.setMonth(s.getMonth() - 3);
      setStartDate(s.toISOString().slice(0,10));
      setEndDate(now.toISOString().slice(0,10));
    } else if (type === 'year') {
      const s = startOfYear(now);
      setStartDate(s.toISOString().slice(0,10));
      setEndDate(now.toISOString().slice(0,10));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-yellow-500 font-semibold animate-pulse">Carregando relatórios...</div>
      </div>
    );
  }

  return (
    <div className="relative isolate min-h-screen bg-gray-50 text-gray-800 pt-28 pb-12">
      <Helmet><title>Relatórios - AutenTicco Motors</title></Helmet>
      <BackgroundShape />
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-1">Relatórios</h1>
          <p className="text-gray-600 mb-6">Visão limpa dos números. Use os filtros de data ou atalhos rápidos.</p>
        </motion.div>

        {/* filtros: somente data + atalhos */}
        <div className="flex flex-col md:flex-row items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Período:</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="p-2 border rounded" />
            <span className="text-gray-400">até</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="p-2 border rounded" />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button variant="ghost" onClick={() => setShortcut('week')}>Esta semana</Button>
            <Button variant="ghost" onClick={() => setShortcut('month')}>Este mês</Button>
            <Button variant="ghost" onClick={() => setShortcut('3months')}>Últimos 3 meses</Button>
            <Button variant="ghost" onClick={() => setShortcut('year')}>Este ano</Button>
          </div>
        </div>

        {/* topo resumido: 3 cards limpos */}
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
            <div className="text-sm text-gray-500">Veículos Vendidos (período)</div>
            <div className="flex items-center justify-between mt-4">
              <div>
                <div className="text-2xl font-bold text-gray-900">{sales.length}</div>
                <div className="text-sm text-gray-500 mt-1">Vendas registradas no período</div>
              </div>
              <div className="text-sm text-gray-400">Período</div>
            </div>
          </Card>

          <Card className="flex flex-col justify-between">
            <div className="text-sm text-gray-500">Lucro</div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-gray-900">
                <Money value={totals.totalRealProfit} />
              </div>
              <div className="text-sm text-gray-500 mt-1">Lucro real (vendas no período)</div>

              <div className="mt-3 text-sm text-gray-600">
                <div><strong className="text-gray-800">Lucro estimado:</strong> <span className="ml-2"><Money value={totals.totalEstimatedProfit} /></span></div>
                <div className="mt-1 text-xs text-gray-400">Estimado para veículos não vendidos (comissão - anúncios - extras)</div>
              </div>
            </div>
          </Card>
        </div>

        {/* gráficos / despesas */}
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

        {/* plataformas e resumo rápido */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><PieChart className="h-5 w-5 text-pink-500" /><h3 className="font-semibold">Plataformas (vendas)</h3></div>
              <div className="text-sm text-gray-500">Período: {format(new Date(startDate), 'dd/MM/yyyy')} — {format(new Date(endDate), 'dd/MM/yyyy')}</div>
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
              <div className="flex justify-between"><div>Total vendidos (período):</div><div className="font-semibold">{sales.length}</div></div>
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

