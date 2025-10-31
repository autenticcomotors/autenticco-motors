// src/components/OverviewBoard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { CSVLink } from 'react-csv';
import {
  RefreshCcw,
  FileSpreadsheet,
  Search,
  SlidersHorizontal,
  ExternalLink,
  ListChecks,
  ArrowUp,
  ArrowDown,
  X,
} from 'lucide-react';
import { getPublicationsForCars, updatePlatformOrder } from '@/lib/car-api';

// nomes que não viram coluna (case-insensitive)
const EXCLUDE_COL_NAMES = ['indicação', 'indicacao', 'outro', 'outros'];

const Badge = ({ text, positive }) => (
  <span
    className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
      positive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`}
  >
    {text}
  </span>
);

const Money = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0));

const normalize = (s = '') => String(s || '').trim().toLowerCase();

const OverviewBoard = ({ cars = [], platforms = [], onOpenGestaoForCar = () => {} }) => {
  const [pubsMap, setPubsMap] = useState({});
  const [loading, setLoading] = useState(false);

  // filtros
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('');

  // controle de colunas visíveis
  const [enabledCols, setEnabledCols] = useState({});

  // estado do modal de ordem
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editablePlatforms, setEditablePlatforms] = useState([]);

  // extras fixos (precisam existir para o VehicleManager continuar funcionando)
  const extras = useMemo(
    () => [
      { key: 'instagram', label: 'Instagram', type: 'social' },
      { key: 'youtube', label: 'YouTube', type: 'social' },
      { key: 'tiktok', label: 'TikTok', type: 'social' },
      { key: 'facebook', label: 'Facebook', type: 'social' },
      { key: 'whatsapp', label: 'WhatsApp', type: 'social' },
      { key: 'site', label: 'Site', type: 'social' },
      { key: 'mercadolivre', label: 'MercadoLivre', type: 'marketplace' },
      { key: 'olx', label: 'OLX', type: 'marketplace' },
      { key: 'webmotors', label: 'Webmotors', type: 'marketplace' },
    ],
    []
  );

  // montar lista de colunas: plataformas do banco + extras (sem duplicar e excluindo nomes banidos)
  const allColumnKeys = useMemo(() => {
    const seen = new Set();
    const out = [];

    // 1) plataformas do banco
    // garantir que venham TODAS (inclusive as que não têm order)
    const sortedDbPlatforms = [...(platforms || [])].sort((a, b) => {
      const ao = typeof a.platform_order === 'number' ? a.platform_order : 9999;
      const bo = typeof b.platform_order === 'number' ? b.platform_order : 9999;
      if (ao !== bo) return ao - bo;
      return (a.name || '').localeCompare(b.name || '', 'pt-BR');
    });

    sortedDbPlatforms.forEach((p) => {
      const label = (p.name || '').trim();
      if (!label) return;
      const nl = normalize(label);
      if (EXCLUDE_COL_NAMES.includes(nl)) return;
      if (seen.has(nl)) return;
      seen.add(nl);
      out.push({
        key: `platform_${p.id}`,
        label,
        type: p.platform_type || 'other',
        platform_id: p.id,
        platform_order: p.platform_order,
      });
    });

    // 2) extras fixos (não podem sumir)
    extras.forEach((e) => {
      const nl = normalize(e.label);
      if (EXCLUDE_COL_NAMES.includes(nl)) return;
      if (seen.has(nl)) return;
      seen.add(nl);
      out.push({ key: e.key, label: e.label, type: e.type });
    });

    return out;
  }, [platforms, extras]);

  // carregar seleção de colunas (ou default = todas)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('overview_enabled_cols') || '{}');
      if (saved && Object.keys(saved).length) {
        const filtered = {};
        Object.keys(saved).forEach((k) => {
          if (allColumnKeys.find((c) => c.key === k)) filtered[k] = !!saved[k];
        });
        if (Object.keys(filtered).length) {
          setEnabledCols(filtered);
          return;
        }
      }
    } catch (_e) {}
    const defaults = {};
    allColumnKeys.forEach((k) => (defaults[k.key] = true));
    setEnabledCols(defaults);
  }, [allColumnKeys]);

  const toggleCol = (key) => {
    setEnabledCols((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('overview_enabled_cols', JSON.stringify(next));
      } catch (_e) {}
      return next;
    });
  };

  const resetColumns = () => {
    const defaults = {};
    allColumnKeys.forEach((k) => (defaults[k.key] = true));
    setEnabledCols(defaults);
    try {
      localStorage.setItem('overview_enabled_cols', JSON.stringify(defaults));
    } catch (_e) {}
  };

  // buscar publicações agrupadas por carro (igual ao que o VehicleManager espera)
  useEffect(() => {
    const run = async () => {
      const carIds = (cars || []).map((c) => c.id).filter(Boolean);
      if (carIds.length === 0) {
        setPubsMap({});
        return;
      }
      setLoading(true);
      try {
        const pubs = await getPublicationsForCars(carIds);
        const map = {};
        carIds.forEach((id) => (map[id] = {}));
        (pubs || []).forEach((p) => {
          const id = p.car_id;
          if (!map[id]) map[id] = {};

          // 1) chave do banco: platform_{id}
          const platformKey = p.platform_id
            ? `platform_${p.platform_id}`
            : (p.platform_name || '').toLowerCase();

          if (!map[id][platformKey]) map[id][platformKey] = [];
          map[id][platformKey].push(p);

          // 2) chaves "inteligentes" pra bater com extras (isso aqui é o que o VehicleManager usa!)
          const link = (p.link || '').toLowerCase();
          if (link.includes('instagram.com'))
            (map[id].instagram = map[id].instagram || []).push(p);
          if (link.includes('youtube.com') || link.includes('youtu.be'))
            (map[id].youtube = map[id].youtube || []).push(p);
          if (link.includes('tiktok')) (map[id].tiktok = map[id].tiktok || []).push(p);
          if (link.includes('webmotors'))
            (map[id].webmotors = map[id].webmotors || []).push(p);
          if (link.includes('olx')) (map[id].olx = map[id].olx || []).push(p);
          if (link.includes('mercadolivre') || link.includes('mercado livre'))
            (map[id].mercadolivre = map[id].mercadolivre || []).push(p);
        });
        setPubsMap(map);
      } catch (err) {
        console.error('Erro fetch pubs:', err);
        setPubsMap({});
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [cars]);

  // marcas para o select
  const brandOptions = useMemo(() => {
    const setB = new Set((cars || []).map((c) => (c.brand || '').trim()).filter(Boolean));
    return Array.from(setB).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [cars]);

  // aplicar filtros (inclui PLACA na busca)
  const filteredCars = useMemo(() => {
    const term = (search || '').trim().toLowerCase();
    return (cars || []).filter((c) => {
      if (
        brandFilter &&
        brandFilter !== 'ALL' &&
        (c.brand || '').toLowerCase() !== brandFilter.toLowerCase()
      )
        return false;
      if (!term) return true;
      const hay = `${c.brand || ''} ${c.model || ''} ${c.year || ''} ${c.plate || ''}`.toLowerCase();
      return hay.includes(term);
    });
  }, [cars, search, brandFilter]);

  // separar colunas por tipo
  const marketplaceCols = allColumnKeys.filter(
    (c) =>
      enabledCols[c.key] &&
      (c.type === 'marketplace' ||
        (c.type === 'other' && /(mercado|olx|webmotor)/i.test(c.label)))
  );
  const socialCols = allColumnKeys.filter((c) => enabledCols[c.key] && c.type === 'social');

  // CSV
  const csvData = useMemo(() => {
    const header = [
      'Marca',
      'Modelo',
      'Ano',
      'Preço',
      'Placa',
      ...[...marketplaceCols, ...socialCols].map((c) => c.label),
    ];
    const rows = (filteredCars || []).map((car) => {
      const row = [
        car.brand || '',
        car.model || '',
        car.year || '',
        car.price || '',
        car.plate || '',
      ];
      const map = pubsMap[car.id] || {};
      [...marketplaceCols, ...socialCols].forEach((col) => {
        const ok = Array.isArray(map[col.key]) && map[col.key].length > 0;
        row.push(ok ? 'SIM' : 'NÃO');
      });
      return row;
    });
    return [header, ...rows];
  }, [filteredCars, marketplaceCols, socialCols, pubsMap]);

  // abrir modal de ordem
  const openOrderModal = () => {
    const list = [...(platforms || [])]
      .map((p) => ({
        id: p.id,
        name: p.name,
        platform_type: p.platform_type,
        platform_order: typeof p.platform_order === 'number' ? p.platform_order : 9999,
      }))
      .sort((a, b) => {
        if (a.platform_order !== b.platform_order) return a.platform_order - b.platform_order;
        return (a.name || '').localeCompare(b.name || '', 'pt-BR');
      });
    setEditablePlatforms(list);
    setIsOrderModalOpen(true);
  };

  const movePlatform = (index, dir) => {
    setEditablePlatforms((prev) => {
      const arr = [...prev];
      const target = index + dir;
      if (target < 0 || target >= arr.length) return prev;
      const tmp = arr[index];
      arr[index] = arr[target];
      arr[target] = tmp;
      return arr;
    });
  };

  const savePlatformOrder = async () => {
    try {
      // renumera 1,2,3...
      const toSave = editablePlatforms.map((p, idx) => ({
        ...p,
        platform_order: idx + 1,
      }));

      // salva um por um
      for (const p of toSave) {
        if (!p.id || !p.name) continue; // evita o erro de name null
        await updatePlatformOrder(p.id, p.platform_order);
      }

      // fecha modal
      setIsOrderModalOpen(false);
      // força reload visual: como o AdminDashboard passa platforms já carregados,
      // aqui só avisamos que mudou; o dono já está recarregando manualmente na página.
      // (se quiser, dá pra dar um window.dispatchEvent aqui)
      window.dispatchEvent(new Event('autenticco:platforms-updated'));
    } catch (err) {
      console.error('Erro ao salvar ordem das plataformas:', err);
      alert(
        'Erro ao salvar ordem das plataformas. Veja o console do navegador para detalhes.'
      );
    }
  };

  return (
    <div className="w-full">
      {/* header / ações */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Matriz de Publicações</h3>
          <p className="text-sm text-gray-500 mt-1">
            Visão rápida de anúncios e publicações por veículo.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSearch('');
              setBrandFilter('');
            }}
            title="Reset filtros"
            className="inline-flex items-center gap-2 px-3 py-2 bg-white border rounded shadow-sm text-sm"
          >
            <RefreshCcw className="h-4 w-4" /> Limpar
          </button>
          <CSVLink data={csvData} filename="matriz_veiculos.csv" className="inline-flex">
            <button className="inline-flex items-center gap-2 px-3 py-2 bg-yellow-500 text-black rounded shadow-sm text-sm">
              <FileSpreadsheet className="h-4 w-4" /> Exportar
            </button>
          </CSVLink>
        </div>
      </div>

      {/* filtros */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-3 w-full md:w-1/3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-3 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar marca, modelo, ano ou PLACA..."
                className="pl-10 pr-4 py-3 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-300 text-sm"
              />
            </div>
            <select
              value={brandFilter || 'ALL'}
              onChange={(e) => setBrandFilter(e.target.value === 'ALL' ? '' : e.target.value)}
              className="p-3 rounded-lg border bg-white text-sm"
            >
              <option value="ALL">Todas as marcas</option>
              {brandOptions.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <SlidersHorizontal className="text-gray-500" />
              <div className="text-sm font-medium text-gray-700">Colunas visíveis</div>
              <button
                onClick={openOrderModal}
                className="ml-2 inline-flex items-center gap-1 text-xs px-2 py-1 border rounded bg-yellow-50 border-yellow-300 text-yellow-900 hover:bg-yellow-100"
              >
                <ListChecks className="h-3 w-3" />
                Editar ordem
              </button>
              <div className="ml-auto text-xs text-gray-400">Seleção salva localmente</div>
            </div>

            <div className="flex flex-wrap gap-2 max-h-[72px] overflow-hidden">
              {allColumnKeys.map((col) => (
                <button
                  key={col.key}
                  onClick={() => toggleCol(col.key)}
                  className={`text-xs px-2 py-1 rounded-full border inline-flex items-center gap-2 ${
                    enabledCols[col.key]
                      ? 'bg-yellow-50 border-yellow-300 text-yellow-800'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {enabledCols[col.key] ? '✓' : '○'}{' '}
                  <span className="whitespace-nowrap">{col.label}</span>
                </button>
              ))}
              <button
                onClick={resetColumns}
                className="text-xs px-2 py-1 rounded-full border border-dashed text-gray-600"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* tabela (thead sticky) */}
      <div className="bg-white rounded-lg border overflow-auto max-h-[60vh]">
        <table className="w-full border-collapse min-w-[1100px]">
          <thead className="sticky top-0 z-20 shadow-sm">
            <tr>
              <th className="p-3 text-left w-80 bg-white">Veículo</th>
              <th className="p-3 text-left w-36 bg-white">Preço</th>
              <th className="p-3 text-left w-28 bg-white">Placa</th>

              {marketplaceCols.length > 0 && (
                <th className="p-3 text-center bg-yellow-50" colSpan={marketplaceCols.length}>
                  Anúncios
                </th>
              )}
              {socialCols.length > 0 && (
                <th className="p-3 text-center bg-blue-50" colSpan={socialCols.length}>
                  Redes Sociais
                </th>
              )}
              <th className="p-3 text-center w-32 bg-white">Ações</th>
            </tr>

            <tr className="text-xs text-gray-600 sticky top-[42px] z-20">
              <th className="p-2 bg-white" />
              <th className="p-2 bg-white" />
              <th className="p-2 bg-white" />
              {marketplaceCols.map((col) => (
                <th key={col.key} className="p-2 text-center bg-yellow-25/10 bg-yellow-50/40">
                  {col.label}
                </th>
              ))}
              {socialCols.map((col) => (
                <th key={col.key} className="p-2 text-center bg-blue-25/10 bg-blue-50/40">
                  {col.label}
                </th>
              ))}
              <th className="p-2 bg-white" />
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={5 + marketplaceCols.length + socialCols.length}
                  className="p-6 text-center text-sm text-gray-500"
                >
                  Carregando...
                </td>
              </tr>
            )}

            {!loading && filteredCars.length === 0 && (
              <tr>
                <td
                  colSpan={5 + marketplaceCols.length + socialCols.length}
                  className="p-6 text-center text-sm text-gray-500"
                >
                  Nenhum veículo encontrado.
                </td>
              </tr>
            )}

            {!loading &&
              filteredCars.map((car, idx) => {
                const map = pubsMap[car.id] || {};
                return (
                  <tr key={car.id} className={`border-t ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="p-4 align-top">
                      <div className="flex items-start gap-3">
                        <img
                          src={
                            car.main_photo_url ||
                            'https://placehold.co/96x64/e2e8f0/4a5568?text=Sem+Foto'
                          }
                          alt={`${car.brand} ${car.model}`}
                          className="h-20 w-28 object-cover rounded-md shadow-sm"
                        />
                        <div>
                          <div className="font-semibold text-gray-800">
                            {car.brand}{' '}
                            <span className="text-gray-700">{car.model}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {car.year ? `${car.year}` : ''}{' '}
                            {car.is_blindado ? ' • BLINDADO' : ''}
                          </div>
                          {car.updated_at && (
                            <div className="text-xs text-gray-400 mt-2">
                              Atualizado: {new Date(car.updated_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="p-4 align-top">
                      <div className="font-semibold">{Money(car.price)}</div>
                      {car.is_available === false && (
                        <div className="text-xs text-red-600 mt-1 font-medium">VENDIDO</div>
                      )}
                    </td>

                    <td className="p-4 align-top">
                      <div className="text-sm font-medium text-gray-700">
                        {car.plate || '-'}
                      </div>
                    </td>

                    {marketplaceCols.map((col) => {
                      const exists = Array.isArray(map[col.key]) && map[col.key].length > 0;
                      return (
                        <td key={col.key} className="p-2 text-center align-top">
                          <div className="flex items-center justify-center">
                            <Badge text={exists ? 'SIM' : 'NÃO'} positive={exists} />
                          </div>
                        </td>
                      );
                    })}

                    {socialCols.map((col) => {
                      const exists = Array.isArray(map[col.key]) && map[col.key].length > 0;
                      return (
                        <td key={col.key} className="p-2 text-center align-top">
                          <div className="flex items-center justify-center">
                            <Badge text={exists ? 'SIM' : 'NÃO'} positive={exists} />
                          </div>
                        </td>
                      );
                    })}

                    <td className="p-4 align-top text-right">
                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => onOpenGestaoForCar(car)}
                          className="text-sm px-3 py-1 rounded bg-yellow-400 text-black font-semibold hover:brightness-95"
                        >
                          Gerenciar
                        </button>
                        <a
                          href={`/carro/${car.slug || ''}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-gray-500 inline-flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" /> Ver
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* MODAL DE ORDEM DE PLATAFORMAS */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-[999] flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="font-semibold text-gray-800">
                Editar ordem das plataformas
              </h2>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <p className="text-xs text-gray-500 mb-3">
                Dica: as plataformas que já existem no banco aparecem aqui. Só arraste para cima/baixo
                (usando os botões) e salve. Na próxima abertura da matriz elas vêm nessa nova ordem.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold mb-2">Marketplaces</h3>
                  {editablePlatforms
                    .filter((p) => p.platform_type === 'marketplace')
                    .map((p, index) => {
                      const globalIndex = editablePlatforms.findIndex((x) => x.id === p.id);
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between border rounded px-3 py-2 mb-2"
                        >
                          <div>
                            <div className="text-sm font-medium">{p.name}</div>
                            <div className="text-[10px] text-gray-400">
                              ordem atual: {globalIndex + 1}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => movePlatform(globalIndex, -1)}
                              className="p-1 rounded bg-gray-100 hover:bg-gray-200"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => movePlatform(globalIndex, 1)}
                              className="p-1 rounded bg-gray-100 hover:bg-gray-200"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-2">Redes sociais / outros</h3>
                  {editablePlatforms
                    .filter((p) => p.platform_type !== 'marketplace')
                    .map((p, index) => {
                      const globalIndex = editablePlatforms.findIndex((x) => x.id === p.id);
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between border rounded px-3 py-2 mb-2"
                        >
                          <div>
                            <div className="text-sm font-medium">{p.name}</div>
                            <div className="text-[10px] text-gray-400">
                              ordem atual: {globalIndex + 1}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => movePlatform(globalIndex, -1)}
                              className="p-1 rounded bg-gray-100 hover:bg-gray-200"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => movePlatform(globalIndex, 1)}
                              className="p-1 rounded bg-gray-100 hover:bg-gray-200"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t">
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="px-4 py-2 rounded bg-gray-100 text-gray-700 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={savePlatformOrder}
                className="px-4 py-2 rounded bg-yellow-400 text-black text-sm font-semibold"
              >
                Salvar ordem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewBoard;

