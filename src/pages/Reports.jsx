// src/pages/Reports.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { getCars, getPlatforms, getPublicationsForCars, getExpensesForCars, getSales } from '@/lib/car-api';
import { Calendar, RefreshCw } from 'lucide-react';

const moneyBR = (n) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n || 0));

const toISODate = (d) => {
  if (!d) return null;
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString();
};

const Reports = () => {
  const [cars, setCars] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [publications, setPublications] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [sales, setSalesData] = useState([]);

  // filtros
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  const [startDate, setStartDate] = useState(startOfMonth.toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(today.toISOString().slice(0, 10));
  const [filterPlatform, setFilterPlatform] = useState('');
  const [loading, setLoading] = useState(false);

  // busca tudo
  const fetchAll = async (opts = {}) => {
    setLoading(true);
    try {
      const [carsData, platformsData] = await Promise.all([getCars(), getPlatforms()]);
      const carIds = (carsData || []).map((c) => c.id);
      const [pubsData, expsData] = await Promise.all([
        getPublicationsForCars(carIds),
        getExpensesForCars(carIds),
      ]);

      // vendas com filtro de data
      const salesFilters = {
        startDate,
        endDate,
      };
      if (filterPlatform) {
        salesFilters.platform_id = filterPlatform;
      }
      const salesData = await getSales(salesFilters);

      setCars(carsData || []);
      setPlatforms(platformsData || []);
      setPublications(pubsData || []);
      setExpenses(expsData || []);
      setSalesData(salesData || []);
    } catch (err) {
      console.error('Erro ao carregar relatórios:', err);
      setCars([]);
      setPlatforms([]);
      setPublications([]);
      setExpenses([]);
      setSalesData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sempre que mudar filtro → recarrega vendas/publicações/gastos com o mesmo conjunto
  const handleApplyFilters = async () => {
    await fetchAll({ force: true });
  };

  // datas ISO pro cálculo
  const startISO = toISODate(startDate);
  const endISO = toISODate(endDate);

  // map de plataforma
  const platformById = useMemo(() => {
    const m = {};
    (platforms || []).forEach((p) => {
      m[p.id] = p;
    });
    return m;
  }, [platforms]);

  // 1) estoque atual (independe de data)
  const estoqueAtual = useMemo(() => {
    return (cars || []).filter((c) => c.is_sold !== true && c.is_available !== false).length;
  }, [cars]);

  // 2) entradas no período
  const entradasPeriodo = useMemo(() => {
    if (!startISO || !endISO) return 0;
    return (cars || []).filter((c) => {
      const entry =
        c.entry_at || c.entered_at || c.stock_entry_at || c.created_at;
      if (!entry) return false;
      const e = new Date(entry).toISOString();
      return e >= startISO && e <= endISO;
    }).length;
  }, [cars, startISO, endISO]);

  // 3) vendidos no período (usa sales)
  const vendidosPeriodo = useMemo(() => {
    return (sales || []).length;
  }, [sales]);

  // 4) faturamento (somar sale_price no período)
  const faturamentoPeriodo = useMemo(() => {
    return (sales || []).reduce((acc, s) => acc + Number(s.sale_price || 0), 0);
  }, [sales]);

  // 5) anúncios (gasto) no período
  const anunciosGastosPeriodo = useMemo(() => {
    if (!startISO || !endISO) return 0;
    return (publications || []).reduce((acc, p) => {
      const pf = platformById[p.platform_id];
      const isMarketplace = pf?.platform_type === 'marketplace';
      if (!isMarketplace) return acc;
      const adDate = (p.published_at || p.created_at);
      if (!adDate) return acc;
      const d = new Date(adDate).toISOString();
      if (d < startISO || d > endISO) return acc;
      return acc + Number(p.spent || 0);
    }, 0);
  }, [publications, platformById, startISO, endISO]);

  // 6) gastos extras e ganhos extras no período
  const { gastosExtrasPeriodo, ganhosExtrasPeriodo, resultadoExtrasPeriodo } = useMemo(() => {
    if (!startISO || !endISO) {
      return { gastosExtrasPeriodo: 0, ganhosExtrasPeriodo: 0, resultadoExtrasPeriodo: 0 };
    }
    let g = 0;
    let c = 0;
    (expenses || []).forEach((e) => {
      const d = new Date(e.incurred_at).toISOString();
      if (d < startISO || d > endISO) return;
      g += Number(e.amount || 0);
      c += Number(e.charged_value || 0);
    });
    return {
      gastosExtrasPeriodo: g,
      ganhosExtrasPeriodo: c,
      resultadoExtrasPeriodo: c - g,
    };
  }, [expenses, startISO, endISO]);

  // 7) lucro do período (regra igual VehicleManager)
  // lucroVenda = comissão da venda (se tiver) SENÃO comissão do carro (se tiver) SENÃO 0
  // depois desconta anuncios + gastos extras e soma ganhos extras do mesmo carro no período
  const lucroPeriodo = useMemo(() => {
    if (!startISO || !endISO) return 0;

    // indexa gastos/ganhos por carro
    const extrasByCar = {};
    (expenses || []).forEach((e) => {
      const d = new Date(e.incurred_at).toISOString();
      if (d < startISO || d > endISO) return;
      if (!extrasByCar[e.car_id]) {
        extrasByCar[e.car_id] = { gastos: 0, ganhos: 0 };
      }
      extrasByCar[e.car_id].gastos += Number(e.amount || 0);
      extrasByCar[e.car_id].ganhos += Number(e.charged_value || 0);
    });

    // indexa anúncios por carro
    const adsByCar = {};
    (publications || []).forEach((p) => {
      const pf = platformById[p.platform_id];
      const isMarketplace = pf?.platform_type === 'marketplace';
      if (!isMarketplace) return;
      const d = new Date(p.published_at || p.created_at).toISOString();
      if (d < startISO || d > endISO) return;
      if (!adsByCar[p.car_id]) {
        adsByCar[p.car_id] = 0;
      }
      adsByCar[p.car_id] += Number(p.spent || 0);
    });

    let total = 0;

    (sales || []).forEach((s) => {
      const car = (cars || []).find((c) => c.id === s.car_id);
      const baseLucro =
        Number(s.profit || 0) ||
        Number(s.commission || 0) ||
        Number(car?.commission || 0) ||
        0;

      const extras = extrasByCar[s.car_id] || { gastos: 0, ganhos: 0 };
      const ads = adsByCar[s.car_id] || 0;

      const lucroFinal = baseLucro + extras.ganhos - extras.gastos - ads;
      total += lucroFinal;
    });

    return total;
  }, [sales, cars, expenses, publications, platformById, startISO, endISO]);

  // 8) vendas por mês (gráfico simples por enquanto)
  const vendasPorMes = useMemo(() => {
    const map = {};
    (sales || []).forEach((s) => {
      if (!s.sale_date) return;
      const d = new Date(s.sale_date);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[k]) map[k] = { key: k, count: 0, total: 0 };
      map[k].count += 1;
      map[k].total += Number(s.sale_price || 0);
    });
    return Object.values(map).sort((a, b) => (a.key > b.key ? 1 : -1));
  }, [sales]);

  // 9) vendas por plataforma (pizza)
  const vendasPorPlataforma = useMemo(() => {
    const map = {};
    (sales || []).forEach((s) => {
      const name = s.platforms?.name || s.platform_name || 'Sem plataforma';
      if (!map[name]) map[name] = { name, count: 0, total: 0 };
      map[name].count += 1;
      map[name].total += Number(s.sale_price || 0);
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [sales]);

  // 10) lucro estimado do ESTOQUE (sem data)
  const lucroEstimadoEstoque = useMemo(() => {
    // indexa extras SEM filtro de data (estoque é sempre)
    const extrasAllByCar = {};
    (expenses || []).forEach((e) => {
      if (!extrasAllByCar[e.car_id]) {
        extrasAllByCar[e.car_id] = { gastos: 0, ganhos: 0 };
      }
      extrasAllByCar[e.car_id].gastos += Number(e.amount || 0);
      extrasAllByCar[e.car_id].ganhos += Number(e.charged_value || 0);
    });

    // indexa anúncios SEM filtro de data
    const adsAllByCar = {};
    (publications || []).forEach((p) => {
      const pf = platformById[p.platform_id];
      const isMarketplace = pf?.platform_type === 'marketplace';
      if (!isMarketplace) return;
      if (!adsAllByCar[p.car_id]) adsAllByCar[p.car_id] = 0;
      adsAllByCar[p.car_id] += Number(p.spent || 0);
    });

    let total = 0;
    let usados = 0;

    (cars || []).forEach((c) => {
      if (c.is_sold) return; // só estoque
      const base = Number(c.commission || 0);
      const extras = extrasAllByCar[c.id] || { gastos: 0, ganhos: 0 };
      const ads = adsAllByCar[c.id] || 0;
      const lucro = base + extras.ganhos - extras.gastos - ads;
      total += lucro;
      usados += 1;
    });

    return { total, usados };
  }, [cars, expenses, publications, platformById]);

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Relatórios - AutenTicco Motors</title>
      </Helmet>

      {/* filtros */}
      <div className="bg-white rounded-2xl p-4 flex flex-wrap gap-3 items-center justify-between border">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            />
            <span className="text-gray-400">até</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            />
          </div>
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="">Todas as plataformas</option>
            {platforms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setStartDate(startOfMonth.toISOString().slice(0, 10));
                setEndDate(today.toISOString().slice(0, 10));
              }}
            >
              Mês atual
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setStartDate(startOfYear.toISOString().slice(0, 10));
                setEndDate(today.toISOString().slice(0, 10));
              }}
            >
              Ano
            </Button>
          </div>
        </div>
        <Button
          type="button"
          className="bg-yellow-400 text-black flex items-center gap-2"
          onClick={handleApplyFilters}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Aplicar
        </Button>
      </div>

      {/* cards topo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-gray-500 text-sm">Estoque atual</p>
          <p className="text-3xl font-bold mt-2">{estoqueAtual}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-gray-500 text-sm">Entradas no período</p>
          <p className="text-3xl font-bold mt-2">{entradasPeriodo}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-gray-500 text-sm">Vendidos no período</p>
          <p className="text-3xl font-bold mt-2 text-emerald-600">{vendidosPeriodo}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-gray-500 text-sm">Faturamento no período</p>
          <p className="text-2xl font-bold mt-2">{moneyBR(faturamentoPeriodo)}</p>
          <p className="text-xs text-gray-400 mt-1">
            Lucro: <span className="text-gray-900 font-semibold">{moneyBR(lucroPeriodo)}</span>
          </p>
        </div>
      </div>

      {/* bloco financeiro rápido */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-gray-500 text-sm">Anúncios (marketplaces)</p>
          <p className="text-xl font-bold mt-2">{moneyBR(anunciosGastosPeriodo)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-gray-500 text-sm">Gastos extras</p>
          <p className="text-xl font-bold mt-2 text-red-500">{moneyBR(gastosExtrasPeriodo)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-gray-500 text-sm">Ganhos extras</p>
          <p className="text-xl font-bold mt-2 text-emerald-500">{moneyBR(ganhosExtrasPeriodo)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-gray-500 text-sm">Resultado extra</p>
          <p
            className={`text-xl font-bold mt-2 ${
              resultadoExtrasPeriodo >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {moneyBR(resultadoExtrasPeriodo)}
          </p>
        </div>
      </div>

      {/* estoque estimado */}
      <div className="bg-white rounded-xl p-4 border">
        <div className="flex items-center justify-between mb-2">
          <p className="text-gray-500 text-sm">Lucro estimado do estoque</p>
          <p className="text-xs text-gray-400">
            base = comissão + ganhos - gastos - anúncios
          </p>
        </div>
        <p className="text-2xl font-bold">{moneyBR(lucroEstimadoEstoque.total)}</p>
        <p className="text-xs text-gray-500 mt-1">{lucroEstimadoEstoque.usados} veículos no cálculo</p>
      </div>

      {/* vendas por mês */}
      <div className="bg-white rounded-xl p-4 border">
        <p className="text-gray-700 font-semibold mb-3">Vendas por mês</p>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {vendasPorMes.map((m) => (
            <div key={m.key} className="min-w-[120px] bg-gray-50 rounded-lg p-3 border">
              <p className="text-sm text-gray-500">{m.key}</p>
              <p className="text-2xl font-bold">{m.count}</p>
              <p className="text-xs text-gray-400 mt-1">{moneyBR(m.total)}</p>
            </div>
          ))}
          {!vendasPorMes.length && <p className="text-sm text-gray-400">Sem vendas no período.</p>}
        </div>
      </div>

      {/* vendas por plataforma */}
      <div className="bg-white rounded-xl p-4 border">
        <p className="text-gray-700 font-semibold mb-3">Vendas por plataforma</p>
        <div className="flex flex-wrap gap-3">
          {vendasPorPlataforma.map((p) => (
            <div key={p.name} className="bg-gray-50 rounded-lg p-3 border flex-1 min-w-[160px]">
              <p className="text-sm text-gray-600">{p.name}</p>
              <p className="text-2xl font-bold mt-1">{p.count}</p>
              <p className="text-xs text-gray-400 mt-1">{moneyBR(p.total)}</p>
            </div>
          ))}
          {!vendasPorPlataforma.length && <p className="text-sm text-gray-400">Sem vendas no período.</p>}
        </div>
      </div>
    </div>
  );
};

export default Reports;

