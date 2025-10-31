// src/pages/Reports.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  getCars,
  getPlatforms,
  getSales,
  getPublicationsForCars,
  getExpensesForCars,
} from '@/lib/car-api';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  RefreshCw,
  PieChart as PieIcon,
  BarChart3,
  LineChart as LineIcon,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const CHART_COLORS = ['#FACC15', '#0F172A', '#6366F1', '#F97316', '#22C55E', '#EC4899', '#0EA5E9', '#F43F5E'];

const moneyBR = (n) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n || 0));

const getCarEntryDate = (car) => car.entry_at || car.stock_entry_at || car.created_at;

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [cars, setCars] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [sales, setSales] = useState([]);
  const [publications, setPublications] = useState([]);
  const [expenses, setExpenses] = useState([]);

  // filtros
  const today = new Date();
  const firstDayMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const todayIso = today.toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(firstDayMonth);
  const [endDate, setEndDate] = useState(todayIso);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  // carregar tudo
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [carsData, platformsData, salesData] = await Promise.all([
          getCars(), // traz todos
          getPlatforms(),
          getSales(), // já traz sales com platforms(name)
        ]);

        setCars(carsData || []);
        setPlatforms(platformsData || []);
        setSales(salesData || []);

        const carIds = (carsData || []).map((c) => c.id).filter(Boolean);
        if (carIds.length) {
          const [pubs, exps] = await Promise.all([
            getPublicationsForCars(carIds),
            getExpensesForCars(carIds),
          ]);
          setPublications(pubs || []);
          setExpenses(exps || []);
        } else {
          setPublications([]);
          setExpenses([]);
        }
      } catch (err) {
        console.error('Erro carregando dados para relatórios:', err);
        setCars([]);
        setPlatforms([]);
        setSales([]);
        setPublications([]);
        setExpenses([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // anos disponíveis (de vendas e entradas)
  const availableYears = useMemo(() => {
    const yearSet = new Set();
    (sales || []).forEach((s) => {
      if (s.sale_date) {
        yearSet.add(new Date(s.sale_date).getFullYear());
      }
    });
    (cars || []).forEach((c) => {
      const d = getCarEntryDate(c);
      if (d) yearSet.add(new Date(d).getFullYear());
    });
    const arr = Array.from(yearSet);
    if (!arr.includes(today.getFullYear())) arr.push(today.getFullYear());
    return arr.sort((a, b) => b - a);
  }, [sales, cars, today]);

  // aplicar ano direto
  const handleSelectYear = (year) => {
    setSelectedYear(year);
    const start = new Date(year, 0, 1).toISOString().slice(0, 10);
    const end = new Date(year, 11, 31).toISOString().slice(0, 10);
    setStartDate(start);
    setEndDate(end);
  };

  // dados filtrados por período
  const {
    estoqueAtual,
    entradasPeriodo,
    vendidosPeriodo,
    faturamentoPeriodo,
    lucroPeriodo,
    anunciosTotal,
    gastosExtrasTotal,
    ganhosExtrasTotal,
    resultadoExtra,
    lucroEstimadoEstoque,
    vendasPorMes,
    vendasPorPlataforma,
    gastosPorPlataforma,
    gastosPorCategoria,
  } = useMemo(() => {
    if (!cars.length) {
      return {
        estoqueAtual: 0,
        entradasPeriodo: 0,
        vendidosPeriodo: 0,
        faturamentoPeriodo: 0,
        lucroPeriodo: 0,
        anunciosTotal: 0,
        gastosExtrasTotal: 0,
        ganhosExtrasTotal: 0,
        resultadoExtra: 0,
        lucroEstimadoEstoque: 0,
        vendasPorMes: [],
        vendasPorPlataforma: [],
        gastosPorPlataforma: [],
        gastosPorCategoria: [],
      };
    }

    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');

    // estoque atual (não vendidos)
    const estoqueAtualCars = cars.filter((c) => !c.is_sold && c.is_available !== false);
    const estoqueAtual = estoqueAtualCars.length;

    // entradas no período
    const entradasPeriodo = cars.filter((c) => {
      const d = getCarEntryDate(c);
      if (!d) return false;
      const dt = new Date(d);
      return dt >= start && dt <= end;
    }).length;

    // vendas no período
    const vendasPeriodo = (sales || []).filter((s) => {
      if (!s.sale_date) return false;
      const dt = new Date(s.sale_date);
      return dt >= start && dt <= end;
    });

    const vendidosPeriodo = vendasPeriodo.length;
    const faturamentoPeriodo = vendasPeriodo.reduce(
      (acc, s) => acc + Number(s.sale_price || 0),
      0
    );

    // lucro baseado no que vc já salva no carro (commission + extras - gastos - anuncios)
    // mas pro período vamos pegar só as vendas do período e somar comissão/impostos do carro vendido
    // simplificado: lucroPeriodo = soma das commissions dos carros vendidos no período
    const vendasCarIds = new Set(vendasPeriodo.map((s) => s.car_id));
    const lucroPeriodo = cars
      .filter((c) => vendasCarIds.has(c.id))
      .reduce((acc, c) => acc + Number(c.commission || 0), 0);

    // anúncios do período (marketplace)
    const pfById = {};
    (platforms || []).forEach((p) => {
      pfById[String(p.id)] = p;
    });

    const anunciosPeriodo = (publications || []).filter((p) => {
      const baseDate = p.published_at || p.created_at;
      if (!baseDate) return false;
      const dt = new Date(baseDate);
      return dt >= start && dt <= end;
    });

    const anunciosTotal = anunciosPeriodo.reduce((acc, p) => acc + Number(p.spent || 0), 0);

    // gastos/ganhos extras do período
    const expensesPeriodo = (expenses || []).filter((e) => {
      const baseDate = e.incurred_at || e.created_at;
      if (!baseDate) return false;
      const dt = new Date(baseDate);
      return dt >= start && dt <= end;
    });

    const gastosExtrasTotal = expensesPeriodo.reduce((acc, e) => acc + Number(e.amount || 0), 0);
    const ganhosExtrasTotal = expensesPeriodo.reduce(
      (acc, e) => acc + Number(e.charged_value || 0),
      0
    );
    const resultadoExtra = ganhosExtrasTotal - gastosExtrasTotal - anunciosTotal;

    // lucro estimado do estoque (igual VehicleManager)
    // pra isso precisamos montar mapa por carro
    const byCar = {};
    cars.forEach((c) => {
      byCar[c.id] = {
        adSpend: 0,
        extraExpenses: 0,
        extraCharged: 0,
      };
    });

    (publications || []).forEach((p) => {
      const carId = p.car_id;
      if (!byCar[carId]) return;
      const pf = pfById[String(p.platform_id)];
      const type = pf?.platform_type || 'social';
      if (type === 'marketplace') {
        byCar[carId].adSpend += Number(p.spent || 0);
      }
    });

    (expenses || []).forEach((e) => {
      const carId = e.car_id;
      if (!byCar[carId]) return;
      byCar[carId].extraExpenses += Number(e.amount || 0);
      byCar[carId].extraCharged += Number(e.charged_value || 0);
    });

    const lucroEstimadoEstoque = estoqueAtualCars.reduce((acc, c) => {
      const entry = byCar[c.id] || { adSpend: 0, extraExpenses: 0, extraCharged: 0 };
      const lucro =
        Number(c.commission || 0) +
        Number(entry.extraCharged || 0) -
        Number(entry.extraExpenses || 0) -
        Number(entry.adSpend || 0);
      return acc + lucro;
    }, 0);

    // vendas por mês (do ano selecionado)
    const vendasPorMes = Array.from({ length: 12 }).map((_, idx) => ({
      mes: MONTHS_PT[idx],
      vendas: 0,
      valor: 0,
    }));

    (sales || []).forEach((s) => {
      if (!s.sale_date) return;
      const d = new Date(s.sale_date);
      if (d.getFullYear() !== selectedYear) return;
      const m = d.getMonth();
      vendasPorMes[m].vendas += 1;
      vendasPorMes[m].valor += Number(s.sale_price || 0);
    });

    // vendas por plataforma (pizza)
    const vendasPorPlataformaMap = {};
    vendasPeriodo.forEach((s) => {
      const name = s.platforms?.name || 'Outras';
      if (!vendasPorPlataformaMap[name]) {
        vendasPorPlataformaMap[name] = { name, vendas: 0, valor: 0 };
      }
      vendasPorPlataformaMap[name].vendas += 1;
      vendasPorPlataformaMap[name].valor += Number(s.sale_price || 0);
    });
    const vendasPorPlataforma = Object.values(vendasPorPlataformaMap).sort(
      (a, b) => b.vendas - a.vendas
    );

    // gastos por plataforma (anúncios) - período
    const gastosPorPlataformaMap = {};
    anunciosPeriodo.forEach((p) => {
      const pf = pfById[String(p.platform_id)];
      const name = pf?.name || 'Outras';
      if (!gastosPorPlataformaMap[name]) {
        gastosPorPlataformaMap[name] = { name, gasto: 0 };
      }
      gastosPorPlataformaMap[name].gasto += Number(p.spent || 0);
    });
    const gastosPorPlataforma = Object.values(gastosPorPlataformaMap).sort(
      (a, b) => b.gasto - a.gasto
    );

    // gastos por categoria (veículo)
    const gastosPorCategoriaMap = {};
    expensesPeriodo.forEach((e) => {
      const cat = e.category || 'Outros';
      if (!gastosPorCategoriaMap[cat]) {
        gastosPorCategoriaMap[cat] = { name: cat, gasto: 0 };
      }
      gastosPorCategoriaMap[cat].gasto += Number(e.amount || 0);
    });
    const gastosPorCategoria = Object.values(gastosPorCategoriaMap).sort(
      (a, b) => b.gasto - a.gasto
    );

    return {
      estoqueAtual,
      entradasPeriodo,
      vendidosPeriodo,
      faturamentoPeriodo,
      lucroPeriodo,
      anunciosTotal,
      gastosExtrasTotal,
      ganhosExtrasTotal,
      resultadoExtra,
      lucroEstimadoEstoque,
      vendasPorMes,
      vendasPorPlataforma,
      gastosPorPlataforma,
      gastosPorCategoria,
    };
  }, [
    cars,
    platforms,
    sales,
    publications,
    expenses,
    startDate,
    endDate,
    selectedYear,
  ]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-yellow-500 text-lg font-semibold">
        Carregando painel de relatórios...
      </div>
    );
  }

  return (
    <div className="min-h-[62vh] w-full space-y-6">
      {/* filtros */}
      <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200/70 p-4 flex flex-wrap gap-3 items-center justify-between shadow-sm">
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-sm outline-none"
            />
            <span className="text-slate-400 text-xs">até</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-sm outline-none"
            />
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-yellow-50"
              onClick={() => {
                const fm = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
                const td = new Date().toISOString().slice(0, 10);
                setStartDate(fm);
                setEndDate(td);
                setSelectedYear(today.getFullYear());
              }}
            >
              Mês atual
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-yellow-50"
              onClick={() => handleSelectYear(today.getFullYear())}
            >
              Ano atual
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-yellow-50"
              onClick={() => {
                const d30 = new Date();
                d30.setDate(d30.getDate() - 30);
                setStartDate(d30.toISOString().slice(0, 10));
                setEndDate(new Date().toISOString().slice(0, 10));
              }}
            >
              Últimos 30d
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Ano:</span>
            <select
              value={selectedYear}
              onChange={(e) => handleSelectYear(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button
          size="sm"
          className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 rounded-xl gap-2"
          onClick={() => {
            // só refaz os cálculos, já tá tudo em memória
            setStartDate((s) => s);
          }}
        >
          <RefreshCw className="w-4 h-4" /> Aplicar
        </Button>
      </div>

      {/* cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden">
          <p className="text-sm text-slate-200/90">Estoque atual</p>
          <h2 className="text-4xl font-bold mt-2">{estoqueAtual}</h2>
          <p className="text-xs text-slate-200/60 mt-2">
            veículos disponíveis
          </p>
          <LineIcon className="w-12 h-12 text-slate-200/20 absolute -right-4 -bottom-2" />
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <p className="text-sm text-slate-500">Entradas no período</p>
          <div className="flex items-center gap-2 mt-2">
            <h2 className="text-3xl font-bold text-slate-900">{entradasPeriodo}</h2>
            <span className="text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full text-xs flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> +{entradasPeriodo}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">carros que entraram em {startDate} — {endDate}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <p className="text-sm text-slate-500">Vendidos no período</p>
          <div className="flex items-center gap-2 mt-2">
            <h2 className="text-3xl font-bold text-slate-900">{vendidosPeriodo}</h2>
            <span className="text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full text-xs flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> {vendidosPeriodo}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">veículos entregues/vendidos</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <p className="text-sm text-slate-500">Faturamento no período</p>
          <h2 className="text-3xl font-bold text-slate-900 mt-2">{moneyBR(faturamentoPeriodo)}</h2>
          <p className="text-xs text-slate-400 mt-2">
            Lucro (comissão): <span className="text-slate-900 font-semibold">{moneyBR(lucroPeriodo)}</span>
          </p>
        </div>
      </div>

      {/* linha de cards secundários */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <p className="text-sm text-slate-500 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-slate-400" /> Anúncios (marketplaces)
          </p>
          <h2 className="text-2xl font-bold text-slate-900 mt-2">{moneyBR(anunciosTotal)}</h2>
          <p className="text-xs text-slate-400 mt-1">investidos no período</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <p className="text-sm text-slate-500">Gastos extras</p>
          <h2 className="text-2xl font-bold text-red-600 mt-2">{moneyBR(gastosExtrasTotal)}</h2>
          <p className="text-xs text-slate-400 mt-1">lançados em veículos</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <p className="text-sm text-slate-500">Ganhos extras (repasses)</p>
          <h2 className="text-2xl font-bold text-emerald-600 mt-2">{moneyBR(ganhosExtrasTotal)}</h2>
          <p className="text-xs text-slate-400 mt-1">que você cobrou</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <p className="text-sm text-slate-500 flex items-center gap-1">
            <Wallet className="w-4 h-4 text-slate-400" /> Resultado extra
          </p>
          <h2
            className={`text-2xl font-bold mt-2 ${
              resultadoExtra >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {moneyBR(resultadoExtra)}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            base = ganhos + comissão - gastos - anúncios
          </p>
        </div>
      </div>

      {/* bloco com gráfico de vendas por mês + pizza de vendas por plataforma */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <LineIcon className="w-4 h-4 text-yellow-400" /> Vendas por mês — {selectedYear}
            </h3>
            <span className="text-xs text-slate-400">
              {vendasPorMes.reduce((acc, m) => acc + m.vendas, 0)} venda(s) no ano
            </span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={vendasPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="mes" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip formatter={(value, name) => (name === 'valor' ? moneyBR(value) : value)} />
                <Line
                  type="monotone"
                  dataKey="vendas"
                  stroke="#FACC15"
                  strokeWidth={3}
                  dot={{ r: 3, strokeWidth: 1, stroke: '#0F172A', fill: '#FACC15' }}
                />
                <Line type="monotone" dataKey="valor" stroke="#0F172A" strokeWidth={2} yAxisId={1} />
                <YAxis yAxisId={1} orientation="right" stroke="#94A3B8" hide />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-yellow-400" /> Vendas por plataforma
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vendasPorPlataforma.length ? vendasPorPlataforma : [{ name: 'Sem vendas', vendas: 1 }]}
                  dataKey="vendas"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {(vendasPorPlataforma.length ? vendasPorPlataforma : [{ name: 'Sem vendas', vendas: 1 }]).map(
                    (entry, index) => (
                      <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    )
                  )}
                </Pie>
                <Legend layout="vertical" align="right" verticalAlign="middle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* bloco com gastos por plataforma e gastos por categoria */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-yellow-400" /> Gastos por plataforma (anúncios)
            </h3>
            <span className="text-xs text-slate-400">{moneyBR(anunciosTotal)} no período</span>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gastosPorPlataforma}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip formatter={(value) => moneyBR(value)} />
                <Bar dataKey="gasto" radius={[8, 8, 0, 0]} fill="#FACC15" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-yellow-400" /> Gastos por tipo (veículo)
            </h3>
            <span className="text-xs text-slate-400">{moneyBR(gastosExtrasTotal)} no período</span>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gastosPorCategoria}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip formatter={(value) => moneyBR(value)} />
                <Bar dataKey="gasto" radius={[8, 8, 0, 0]} fill="#0F172A" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* bloco final - lucro estimado do estoque */}
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-2xl p-5 flex items-center justify-between shadow-lg">
        <div>
          <p className="text-sm text-slate-800/80">Lucro estimado do estoque (todos os carros disponíveis)</p>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-2">{moneyBR(lucroEstimadoEstoque)}</h2>
          <p className="text-xs text-slate-800/80 mt-2">
            baseado em: comissão + repasses - gastos - anúncios (por veículo)
          </p>
        </div>
        <div className="hidden md:flex gap-2">
          <div className="bg-white/25 backdrop-blur rounded-xl px-4 py-2 text-sm text-slate-900 flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4" /> {estoqueAtual} veículos
          </div>
          <div className="bg-white/25 backdrop-blur rounded-xl px-4 py-2 text-sm text-slate-900 flex items-center gap-2">
            <ArrowDownRight className="w-4 h-4" /> anúncios: {moneyBR(anunciosTotal)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;

