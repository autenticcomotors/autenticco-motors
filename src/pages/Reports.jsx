// src/pages/Reports.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Calendar, Filter, LineChart, PieChart as PieIcon, Wallet, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BackgroundShape from '@/components/BackgroundShape';
import { format, startOfWeek, startOfMonth, startOfYear } from 'date-fns';
import { getCars, getPublicationsForCars, getExpensesForCars, getSales, getPlatforms } from '@/lib/car-api';

const moneyBR = (n) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n || 0));

const Reports = () => {
  // dados
  const [loading, setLoading] = useState(true);
  const [cars, setCars] = useState([]);
  const [publications, setPublications] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [sales, setSales] = useState([]);
  const [platforms, setPlatforms] = useState([]);

  // filtros
  const today = new Date();
  const [startDate, setStartDate] = useState(() => {
    const s = new Date();
    s.setMonth(s.getMonth() - 2);
    return s.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(today.toISOString().slice(0, 10));
  const [selectedPlatform, setSelectedPlatform] = useState('ALL');

  // 1) carregar carros e plataformas
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [cs, pls] = await Promise.all([getCars(), getPlatforms()]);
        if (!mounted) return;
        setCars(Array.isArray(cs) ? cs : []);
        setPlatforms(Array.isArray(pls) ? pls : []);
      } catch (err) {
        console.error('Erro ao carregar base:', err);
        if (mounted) {
          setCars([]);
          setPlatforms([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // 2) quando tiver carros OU mudar data, buscar publicações+gastos+vendas
  useEffect(() => {
    if (!cars.length) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const carIds = cars.map((c) => c.id).filter(Boolean);
        const [pubs, exps, salesData] = await Promise.all([
          getPublicationsForCars(carIds),
          getExpensesForCars(carIds),
          getSales({
            startDate,
            endDate,
            ...(selectedPlatform !== 'ALL' ? { platform_id: selectedPlatform } : {}),
          }),
        ]);
        if (!mounted) return;
        setPublications(Array.isArray(pubs) ? pubs : []);
        setExpenses(Array.isArray(exps) ? exps : []);
        setSales(Array.isArray(salesData) ? salesData : []);
      } catch (err) {
        console.error('Erro ao carregar dados do período:', err);
        if (mounted) {
          setPublications([]);
          setExpenses([]);
          setSales([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [cars, startDate, endDate, selectedPlatform]);

  // mapas auxiliares
  const adMap = useMemo(() => {
    const map = {};
    (publications || []).forEach((p) => {
      if (!p.car_id) return;
      const spent = Number(p.spent || 0);
      const isAd = !!p.platform_id; // marketplace ou rede, mas vamos contar tudo aqui
      if (!map[p.car_id]) {
        map[p.car_id] = {
          adSpend: 0,
        };
      }
      if (isAd) {
        map[p.car_id].adSpend += spent;
      }
    });
    return map;
  }, [publications]);

  const expMap = useMemo(() => {
    const map = {};
    (expenses || []).forEach((e) => {
      if (!e.car_id) return;
      const amt = Number(e.amount || 0);
      const charged = Number(e.charged_value || 0);
      if (!map[e.car_id]) {
        map[e.car_id] = { expenses: 0, gains: 0 };
      }
      map[e.car_id].expenses += amt;
      map[e.car_id].gains += charged;
    });
    return map;
  }, [expenses]);

  // totais de cartão principal
  const dashboard = useMemo(() => {
    let estoqueAtual = 0;
    let entradasPeriodo = 0;
    let vendidosPeriodo = 0;
    let faturamentoPeriodo = 0;
    let lucroPeriodo = 0;
    let anunciosPeriodo = 0;
    let gastosExtrasPeriodo = 0;
    let ganhosExtrasPeriodo = 0;

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59`);

    // estoque atual (independe de data)
    cars.forEach((c) => {
      const disponivel = c.is_sold !== true && c.is_available !== false;
      if (disponivel) estoqueAtual += 1;
      // entradas no período -> entry_at / stock_entry_at / created_at
      const entryIso = c.entry_at || c.stock_entry_at || c.created_at;
      if (entryIso) {
        const dt = new Date(entryIso);
        if (dt >= start && dt <= end) {
          entradasPeriodo += 1;
        }
      }
    });

    // vendas no período
    (sales || []).forEach((s) => {
      const saleDt = new Date(s.sale_date || s.created_at || new Date());
      if (saleDt >= start && saleDt <= end) {
        vendidosPeriodo += 1;
        const salePrice = Number(s.sale_price || 0);
        faturamentoPeriodo += salePrice;

        // lucro real da venda:
        // base = commission (da sale) se tiver, senão commission do carro
        const car = cars.find((c) => c.id === s.car_id);
        const carCommission = car ? Number(car.commission || 0) : 0;
        const saleCommission = Number(s.commission || 0);
        const base = saleCommission > 0 ? saleCommission : carCommission;
        // custos do carro
        const ad = adMap[s.car_id] ? adMap[s.car_id].adSpend : 0;
        const ex = expMap[s.car_id] ? expMap[s.car_id].expenses : 0;
        const gn = expMap[s.car_id] ? expMap[s.car_id].gains : 0;
        const lucro = base + gn - ex - ad;
        lucroPeriodo += lucro;
      }
    });

    // anúncios / gastos / ganhos no período (por data do registro)
    (publications || []).forEach((p) => {
      const dt = p.published_at || p.created_at;
      if (!dt) return;
      const d = new Date(dt);
      if (d >= start && d <= end) {
        anunciosPeriodo += Number(p.spent || 0);
      }
    });

    (expenses || []).forEach((e) => {
      const dt = e.incurred_at || e.created_at;
      if (!dt) return;
      const d = new Date(dt);
      if (d >= start && d <= end) {
        gastosExtrasPeriodo += Number(e.amount || 0);
        ganhosExtrasPeriodo += Number(e.charged_value || 0);
      }
    });

    // lucro estimado do estoque atual (independe de data)
    let lucroEstimadoEstoque = 0;
    let carrosNoEstimado = 0;
    cars.forEach((c) => {
      const disponivel = c.is_sold !== true && c.is_available !== false;
      if (!disponivel) return;
      const ad = adMap[c.id] ? adMap[c.id].adSpend : 0;
      const ex = expMap[c.id] ? expMap[c.id].expenses : 0;
      const gn = expMap[c.id] ? expMap[c.id].gains : 0;
      const base = Number(c.commission || 0);
      const estimado = base + gn - ex - ad;
      lucroEstimadoEstoque += estimado;
      carrosNoEstimado += 1;
    });

    const resultadoExtra = ganhosExtrasPeriodo - gastosExtrasPeriodo - anunciosPeriodo;

    return {
      estoqueAtual,
      entradasPeriodo,
      vendidosPeriodo,
      faturamentoPeriodo,
      lucroPeriodo,
      anunciosPeriodo,
      gastosExtrasPeriodo,
      ganhosExtrasPeriodo,
      resultadoExtra,
      lucroEstimadoEstoque,
      carrosNoEstimado,
    };
  }, [cars, sales, publications, expenses, startDate, endDate, adMap, expMap]);

  // vendas por mês (gráfico)
  const vendasPorMes = useMemo(() => {
    // criar range de meses entre start e end
    const start = new Date(startDate);
    const end = new Date(endDate);
    const list = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cursor <= end) {
      list.push({
        key: `${cursor.getFullYear()}-${cursor.getMonth() + 1}`,
        label: format(cursor, 'MMM/yy'),
        count: 0,
        total: 0,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    (sales || []).forEach((s) => {
      const d = new Date(s.sale_date || s.created_at || new Date());
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const item = list.find((x) => x.key === key);
      if (item) {
        item.count += 1;
        item.total += Number(s.sale_price || 0);
      }
    });

    return list;
  }, [sales, startDate, endDate]);

  // vendas por plataforma (pizza fake estilizada)
  const vendasPorPlataforma = useMemo(() => {
    const counts = {};
    (sales || []).forEach((s) => {
      const name =
        (s.platforms && s.platforms.name) ||
        (platforms.find((p) => p.id === s.platform_id)?.name ?? 'Outro');
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [sales, platforms]);

  const setShortcut = (type) => {
    const now = new Date();
    if (type === 'week') {
      const s = startOfWeek(now, { weekStartsOn: 1 });
      setStartDate(s.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
    } else if (type === 'month') {
      const s = startOfMonth(now);
      setStartDate(s.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
    } else if (type === '3months') {
      const s = new Date();
      s.setMonth(s.getMonth() - 2);
      setStartDate(s.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
    } else if (type === 'year') {
      const s = startOfYear(now);
      setStartDate(s.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-yellow-500 font-semibold animate-pulse">Carregando números...</div>
      </div>
    );
  }

  return (
    <div className="relative isolate min-h-screen bg-gray-50 text-gray-900 pt-28 pb-12">
      <Helmet>
        <title>Relatórios - AutenTicco Motors</title>
      </Helmet>
      <BackgroundShape />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 space-y-6">
        {/* título + filtros */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Relatórios</h1>
            <p className="text-sm text-gray-500 -mt-1">
              Visão financeira em tempo real da operação.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm border">
              <Calendar className="w-4 h-4 text-yellow-500" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-sm outline-none"
              />
              <span className="text-gray-300">—</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-sm outline-none"
              />
            </div>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="bg-white border rounded-xl px-3 py-2 text-sm shadow-sm"
            >
              <option value="ALL">Todas as plataformas</option>
              {platforms.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => setShortcut('week')}>
                Semana
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShortcut('month')}>
                Mês
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShortcut('3months')}>
                3 meses
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShortcut('year')}>
                Ano
              </Button>
            </div>
          </div>
        </div>

        {/* cards principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* estoque */}
          <motion.div
            whileHover={{ y: -2 }}
            className="bg-white/90 rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-2"
          >
            <span className="text-xs uppercase tracking-wide text-gray-400">Estoque atual</span>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold">{dashboard.estoqueAtual}</span>
              <span className="text-xs text-gray-400 pb-1">veículos</span>
            </div>
            <p className="text-xs text-gray-400">
              Dentro do estoque (não vendidos)
            </p>
          </motion.div>

          {/* entradas */}
          <motion.div
            whileHover={{ y: -2 }}
            className="bg-white/90 rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-2"
          >
            <span className="text-xs uppercase tracking-wide text-gray-400">Entradas no período</span>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold">{dashboard.entradasPeriodo}</span>
            </div>
            <p className="text-xs text-gray-400">
              {format(new Date(startDate), 'dd/MM')} — {format(new Date(endDate), 'dd/MM')}
            </p>
          </motion.div>

          {/* vendidos */}
          <motion.div
            whileHover={{ y: -2 }}
            className="bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm p-5 flex flex-col gap-2"
          >
            <span className="text-xs uppercase tracking-wide text-emerald-500">
              Vendidos no período
            </span>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-emerald-800">{dashboard.vendidosPeriodo}</span>
            </div>
            <p className="text-xs text-emerald-500">
              Faturamento: {moneyBR(dashboard.faturamentoPeriodo)}
            </p>
          </motion.div>

          {/* faturamento / lucro */}
          <motion.div
            whileHover={{ y: -2 }}
            className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl shadow-sm p-5 text-black flex flex-col gap-2"
          >
            <span className="text-xs uppercase tracking-wide text-black/80">
              Lucro real do período
            </span>
            <div className="text-3xl font-extrabold leading-tight">
              {moneyBR(dashboard.lucroPeriodo)}
            </div>
            <p className="text-xs text-black/60">
              Base = comissão + ganhos – gastos – anúncios
            </p>
          </motion.div>
        </div>

        {/* cards de custos/ganhos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border p-4">
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Wallet className="w-4 h-4 text-yellow-400" /> Anúncios (marketplaces)
            </p>
            <p className="text-2xl font-semibold mt-2">{moneyBR(dashboard.anunciosPeriodo)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border p-4">
            <p className="text-xs text-gray-400">Gastos extras</p>
            <p className="text-2xl font-semibold text-red-500 mt-2">
              {moneyBR(dashboard.gastosExtrasPeriodo)}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border p-4">
            <p className="text-xs text-gray-400">Ganhos extras</p>
            <p className="text-2xl font-semibold text-emerald-500 mt-2">
              {moneyBR(dashboard.ganhosExtrasPeriodo)}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border p-4">
            <p className="text-xs text-gray-400">Resultado extra (ganhos - gastos - anúncios)</p>
            <p
              className={`text-2xl font-semibold mt-2 ${
                dashboard.resultadoExtra >= 0 ? 'text-emerald-500' : 'text-red-500'
              }`}
            >
              {moneyBR(dashboard.resultadoExtra)}
            </p>
          </div>
        </div>

        {/* lucro estimado */}
        <div className="bg-white rounded-2xl shadow-sm border p-5 flex items-center justify-between gap-6">
          <div>
            <p className="text-xs text-gray-400">Lucro estimado do estoque</p>
            <p className="text-3xl font-bold mt-1">{moneyBR(dashboard.lucroEstimadoEstoque)}</p>
            <p className="text-xs text-gray-400 mt-1">
              {dashboard.carrosNoEstimado} veículos no cálculo (não vendidos)
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3 text-sm text-gray-500">
            <LineChart className="w-7 h-7 text-yellow-400" />
            Estimativa baseada em: comissão + ganhos – gastos – anúncios
          </div>
        </div>

        {/* gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* vendas por mês */}
          <div className="bg-white rounded-2xl shadow-sm border p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <LineChart className="w-5 h-5 text-yellow-400" />
                <h3 className="font-semibold">Vendas por mês</h3>
              </div>
              <p className="text-xs text-gray-400">Período selecionado</p>
            </div>
            <div className="flex gap-3 items-end min-h-[140px]">
              {vendasPorMes.length === 0 ? (
                <p className="text-sm text-gray-400">Sem vendas neste recorte.</p>
              ) : (
                vendasPorMes.map((m) => {
                  const max = Math.max(...vendasPorMes.map((x) => x.count), 1);
                  const height = (m.count / max) * 100;
                  return (
                    <div key={m.key} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full bg-gradient-to-t from-yellow-200 to-yellow-400 rounded-t-2xl shadow-sm flex items-end justify-center"
                        style={{ height: `${Math.max(18, height)}%` }}
                      >
                        <span className="text-xs font-semibold text-yellow-900 mb-2">
                          {m.count}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">{m.label}</div>
                      <div className="text-[10px] text-gray-300">{moneyBR(m.total)}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* vendas por plataforma */}
          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-pink-400" />
                <h3 className="font-semibold">Vendas por plataforma</h3>
              </div>
              <span className="text-xs text-gray-400">
                {sales.length} venda(s)
              </span>
            </div>

            <div className="space-y-3">
              {vendasPorPlataforma.length === 0 ? (
                <p className="text-sm text-gray-400">Sem vendas no período.</p>
              ) : (
                vendasPorPlataforma.map((item, idx) => {
                  const total = vendasPorPlataforma.reduce((acc, it) => acc + it.count, 0);
                  const pct = Math.round((item.count / total) * 100);
                  return (
                    <div key={item.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-gray-400">
                          {item.count} — {pct}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            idx % 3 === 0
                              ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                              : idx % 3 === 1
                              ? 'bg-gradient-to-r from-pink-400 to-rose-500'
                              : 'bg-gradient-to-r from-emerald-400 to-green-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;

