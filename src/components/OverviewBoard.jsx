// src/components/OverviewBoard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { CSVLink } from 'react-csv';
import { Button } from '@/components/ui/button';
import { getPublicationsForCars } from '@/lib/car-api';
import { Search, SlidersHorizontal, RefreshCcw, ExternalLink, FileSpreadsheet } from 'lucide-react';

/**
 * OverviewBoard — versão visual melhorada
 * - ocupa largura total disponível (max-w-full)
 * - filtros em card moderno
 * - tabela com header sticky, linhas alternadas, badges compactas
 * - colunas dinâmicas (marketplaces + redes sociais)
 *
 * Props:
 * - cars: array de veículos
 * - platforms: array de plataformas
 * - onOpenGestaoForCar(car) => abre modal de gestão (opcional)
 */

const Badge = ({ text, positive }) => (
  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${positive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
    {text}
  </span>
);

const Money = ({ value }) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));

const OverviewBoard = ({ cars = [], platforms = [], onOpenGestaoForCar = () => {} }) => {
  const [pubsMap, setPubsMap] = useState({});
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [enabledCols, setEnabledCols] = useState({});
  const [loading, setLoading] = useState(false);

  // build platform columns (marketplaces + social extras)
  const allPlatforms = platforms || [];
  const extras = [
    { key: 'instagram', label: 'Instagram', type: 'social' },
    { key: 'youtube', label: 'YouTube', type: 'social' },
    { key: 'tiktok', label: 'TikTok', type: 'social' },
    { key: 'facebook', label: 'Facebook', type: 'social' },
    { key: 'whatsapp', label: 'WhatsApp', type: 'social' },
    { key: 'site', label: 'Site', type: 'social' },
    { key: 'mercadolivre', label: 'MercadoLivre', type: 'marketplace' },
    { key: 'olx', label: 'OLX', type: 'marketplace' },
    { key: 'webmotors', label: 'Webmotors', type: 'marketplace' }
  ];

  const allColumnKeys = useMemo(() => {
    const fromPlatforms = (allPlatforms || []).map(p => ({ key: `platform_${p.id}`, label: p.name, type: p.platform_type || 'other' }));
    // merge and avoid duplicates
    const merged = [...fromPlatforms];
    extras.forEach(e => { if (!merged.find(m => m.key === e.key)) merged.push(e); });
    return merged;
  }, [allPlatforms]);

  // init enabled cols from localStorage or defaults
  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem('overview_enabled_cols') || '{}');
      if (saved && Object.keys(saved).length) {
        setEnabledCols(prev => ({ ...prev, ...saved }));
        return;
      }
    } catch (e) {}
    const defaults = {};
    allColumnKeys.forEach(k => { defaults[k.key] = true; });
    setEnabledCols(defaults);
  }, [allColumnKeys]);

  // fetch publications for cars and build map
  useEffect(() => {
    const fetch = async () => {
      const carIds = (cars || []).map(c => c.id).filter(Boolean);
      if (carIds.length === 0) { setPubsMap({}); return; }
      setLoading(true);
      try {
        const pubs = await getPublicationsForCars(carIds);
        const map = {};
        carIds.forEach(id => (map[id] = {}));
        (pubs || []).forEach(p => {
          const id = p.car_id;
          if (!map[id]) map[id] = {};
          const platformKey = p.platform_id ? `platform_${p.platform_id}` : (p.platform_name || '').toLowerCase();
          if (!map[id][platformKey]) map[id][platformKey] = [];
          map[id][platformKey].push(p);

          const link = (p.link || '').toLowerCase();
          if (link.includes('instagram.com')) map[id].instagram = map[id].instagram || [], map[id].instagram.push(p);
          if (link.includes('youtube.com') || link.includes('youtu.be')) map[id].youtube = map[id].youtube || [], map[id].youtube.push(p);
          if (link.includes('tiktok')) map[id].tiktok = map[id].tiktok || [], map[id].tiktok.push(p);
          if (link.includes('webmotors')) map[id].webmotors = map[id].webmotors || [], map[id].webmotors.push(p);
          if (link.includes('olx')) map[id].olx = map[id].olx || [], map[id].olx.push(p);
          if (link.includes('mercadolivre') || link.includes('mercado livre')) map[id].mercadolivre = map[id].mercadolivre || [], map[id].mercadolivre.push(p);
        });
        setPubsMap(map);
      } catch (err) {
        console.error('Erro fetch pubs:', err);
        setPubsMap({});
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [cars]);

  const brandOptions = useMemo(() => {
    const setB = new Set((cars || []).map(c => (c.brand || '').trim()).filter(Boolean));
    return Array.from(setB).sort((a,b) => a.localeCompare(b, 'pt-BR'));
  }, [cars]);

  const filtered = useMemo(() => {
    const term = (search || '').trim().toLowerCase();
    return (cars || []).filter(c => {
      if (brandFilter && brandFilter !== 'ALL' && (c.brand || '').toLowerCase() !== brandFilter.toLowerCase()) return false;
      if (!term) return true;
      const combined = `${c.brand || ''} ${c.model || ''} ${c.year || ''}`.toLowerCase();
      return combined.includes(term);
    });
  }, [cars, search, brandFilter]);

  const marketplaceCols = allColumnKeys.filter(c => enabledCols[c.key] && c.type === 'marketplace');
  const socialCols = allColumnKeys.filter(c => enabledCols[c.key] && c.type === 'social');

  // CSV
  const csvData = useMemo(() => {
    const header = ['Marca', 'Modelo', 'Ano', 'Preco', ...[...marketplaceCols, ...socialCols].map(c => c.label)];
    const rows = (filtered || []).map(car => {
      const row = [car.brand || '', car.model || '', car.year || '', car.price || ''];
      const map = pubsMap[car.id] || {};
      [...marketplaceCols, ...socialCols].forEach(col => {
        const exists = Array.isArray(map[col.key]) && map[col.key].length > 0;
        row.push(exists ? 'SIM' : 'NÃO');
      });
      return row;
    });
    return [header, ...rows];
  }, [filtered, marketplaceCols, socialCols, pubsMap]);

  const toggleCol = (key) => {
    setEnabledCols(prev => {
      const next = { ...prev, [key]: !prev[key] };
      try { window.localStorage.setItem('overview_enabled_cols', JSON.stringify(next)); } catch (e) {}
      return next;
    });
  };

  const resetColumns = () => {
    const defaults = {};
    allColumnKeys.forEach(k => defaults[k.key] = true);
    setEnabledCols(defaults);
    try { window.localStorage.setItem('overview_enabled_cols', JSON.stringify(defaults)); } catch (e) {}
  };

  return (
    <div className="w-full max-w-full mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Matriz de Publicações</h3>
          <p className="text-sm text-gray-500 mt-1">Visão rápida de anúncios e publicações por veículo. Use os filtros para refinar.</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => { setSearch(''); setBrandFilter(''); }} title="Reset filtros" className="inline-flex items-center gap-2 px-3 py-2 bg-white border rounded shadow-sm hover:shadow-md text-sm">
            <RefreshCcw className="h-4 w-4" /> Limpar
          </button>

          <CSVLink data={csvData} filename="matriz_veiculos.csv" className="inline-flex">
            <button className="inline-flex items-center gap-2 px-3 py-2 bg-yellow-500 text-black rounded shadow-sm hover:brightness-95 text-sm">
              <FileSpreadsheet className="h-4 w-4" /> Exportar
            </button>
          </CSVLink>
        </div>
      </div>

      {/* Filters card */}
      <div className="bg-white rounded-2xl shadow-lg border p-4 mb-6 flex flex-col md:flex-row gap-4 items-start">
        <div className="flex items-center gap-3 w-full md:w-1/2">
          <div className="relative w-full">
            <Search className="absolute left-3 top-3 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar marca, modelo ou ano..."
              className="pl-10 pr-4 py-3 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-300"
            />
          </div>

          <select value={brandFilter || 'ALL'} onChange={(e) => setBrandFilter(e.target.value === 'ALL' ? '' : e.target.value)} className="p-3 rounded-lg border bg-white text-sm">
            <option value="ALL">Todas as marcas</option>
            {brandOptions.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <SlidersHorizontal className="text-gray-500" />
            <div className="text-sm font-medium text-gray-700">Colunas visíveis</div>
            <div className="ml-auto text-xs text-gray-400">Salvar seleção local</div>
          </div>

          <div className="flex flex-wrap gap-2">
            {allColumnKeys.map(col => (
              <button
                key={col.key}
                onClick={() => toggleCol(col.key)}
                className={`text-sm px-3 py-1 rounded-full border transition inline-flex items-center gap-2 ${enabledCols[col.key] ? 'bg-yellow-50 border-yellow-300 text-yellow-800' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                {enabledCols[col.key] ? '✓' : '○'} <span className="whitespace-nowrap">{col.label}</span>
              </button>
            ))}
            <button onClick={resetColumns} className="ml-1 text-sm px-3 py-1 rounded-full border border-dashed text-gray-600">Reset</button>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
        <div className="overflow-auto">
          <table className="w-full border-collapse min-w-[900px]">
            <thead className="bg-gradient-to-r from-gray-50 to-white sticky top-0 z-20">
              <tr>
                <th className="p-3 text-left w-72">Veículo</th>
                <th className="p-3 text-left w-36">Preço</th>
                {marketplaceCols.length > 0 && <th className="p-3 text-center" colSpan={marketplaceCols.length}>Anúncios</th>}
                {socialCols.length > 0 && <th className="p-3 text-center" colSpan={socialCols.length}>Redes Sociais</th>}
                <th className="p-3 text-center w-32">Ações</th>
              </tr>

              <tr className="text-xs text-gray-600">
                <th className="p-2" />
                <th className="p-2" />
                {marketplaceCols.map(col => <th key={col.key} className="p-2 text-center">{col.label}</th>)}
                {socialCols.map(col => <th key={col.key} className="p-2 text-center">{col.label}</th>)}
                <th className="p-2" />
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4 + marketplaceCols.length + socialCols.length} className="p-6 text-center text-sm text-gray-500">Carregando...</td>
                </tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={4 + marketplaceCols.length + socialCols.length} className="p-6 text-center text-sm text-gray-500">Nenhum veículo encontrado.</td>
                </tr>
              )}

              {!loading && filtered.map((car, idx) => {
                const map = pubsMap[car.id] || {};
                return (
                  <tr key={car.id} className={`border-t last:border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="p-4 align-top">
                      <div className="flex items-start gap-3">
                        <img src={car.main_photo_url || 'https://placehold.co/96x64/e2e8f0/4a5568?text=Sem+Foto'} alt={`${car.brand} ${car.model}`} className="h-20 w-28 object-cover rounded-md shadow-sm" />
                        <div>
                          <div className="font-semibold text-gray-800">{car.brand} <span className="text-gray-700">{car.model}</span></div>
                          <div className="text-xs text-gray-500 mt-1">{car.year ? `${car.year} • ${car.mileage ? `${car.mileage} km` : ''}` : ''} {car.is_blindado ? ' • BLINDADO' : ''}</div>
                          {car.updated_at && <div className="text-xs text-gray-400 mt-2">Atualizado: {new Date(car.updated_at).toLocaleDateString()}</div>}
                        </div>
                      </div>
                    </td>

                    <td className="p-4 align-top">
                      <div className="font-semibold">{Money({ value: car.price })}</div>
                      {car.is_available === false && <div className="text-xs text-red-600 mt-1 font-medium">VENDIDO</div>}
                    </td>

                    {marketplaceCols.map(col => {
                      const exists = Array.isArray(map[col.key]) && map[col.key].length > 0;
                      return (
                        <td key={col.key} className="p-2 text-center align-top">
                          <div className="flex items-center justify-center">
                            <Badge text={exists ? 'SIM' : 'NÃO'} positive={exists} />
                          </div>
                        </td>
                      );
                    })}

                    {socialCols.map(col => {
                      const exists = Array.isArray(map[col.key]) && map[col.key].length > 0;
                      return (
                        <td key={col.key} className="p-2 text-center align-top">
                          <div className="flex items-center justify-center gap-1">
                            <Badge text={exists ? 'SIM' : 'NÃO'} positive={exists} />
                          </div>
                        </td>
                      );
                    })}

                    <td className="p-4 align-top text-right">
                      <div className="flex flex-col items-end gap-2">
                        <button onClick={() => onOpenGestaoForCar(car)} className="text-sm px-3 py-1 rounded bg-yellow-400 text-black font-semibold hover:brightness-95">Gerenciar</button>
                        <a href={`/carro/${car.slug || ''}`} target="_blank" rel="noreferrer" className="text-xs text-gray-500 inline-flex items-center gap-1"><ExternalLink className="h-3 w-3" /> Ver</a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OverviewBoard;

