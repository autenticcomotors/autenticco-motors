// src/components/OverviewBoard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CSVLink } from 'react-csv';
import { getPlatforms, getPublicationsForCars } from '@/lib/car-api';

const MoneyFallback = ({ value }) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));

const OverviewBoard = ({ cars = [], platforms = [], onOpenGestaoForCar = (car) => {} }) => {
  const [pubsMap, setPubsMap] = useState({});
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [enabledCols, setEnabledCols] = useState({});
  const [loading, setLoading] = useState(false);
  const [allPlatforms, setAllPlatforms] = useState(platforms || []);

  useEffect(() => {
    setAllPlatforms(platforms || []);
    const defaults = {};
    (platforms || []).forEach(pp => { defaults[`platform_${pp.id}`] = true; });
    ['instagram','youtube','tiktok','facebook','whatsapp','site','mercadolivre','olx','webmotors'].forEach(k => { if (!(k in defaults)) defaults[k] = true; });
    setEnabledCols(prev => ({ ...defaults, ...prev }));
  }, [platforms]);

  useEffect(() => {
    const fetch = async () => {
      const carIds = (cars || []).map(c => c.id).filter(Boolean);
      if (carIds.length === 0) { setPubsMap({}); return; }
      setLoading(true);
      try {
        const pubs = await getPublicationsForCars(carIds);
        const map = {};
        carIds.forEach(id => { map[id] = {}; });
        (pubs || []).forEach(p => {
          const id = p.car_id;
          if (!map[id]) map[id] = {};
          const platformKey = p.platform_id ? `platform_${p.platform_id}` : (p.platform_name || '').toLowerCase();
          if (!map[id][platformKey]) map[id][platformKey] = [];
          map[id][platformKey].push(p);

          const l = (p.link || '').toLowerCase();
          if (l.includes('instagram.com')) { map[id]['instagram'] = map[id]['instagram'] || []; map[id]['instagram'].push(p); }
          if (l.includes('youtube.com') || l.includes('youtu.be')) { map[id]['youtube'] = map[id]['youtube'] || []; map[id]['youtube'].push(p); }
          if (l.includes('olx')) { map[id]['olx'] = map[id]['olx'] || []; map[id]['olx'].push(p); }
          if (l.includes('webmotors')) { map[id]['webmotors'] = map[id]['webmotors'] || []; map[id]['webmotors'].push(p); }
          if (l.includes('mercadolivre') || l.includes('mercado livre')) { map[id]['mercadolivre'] = map[id]['mercadolivre'] || []; map[id]['mercadolivre'].push(p); }
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

  const allColumnKeys = useMemo(() => {
    const keys = [];
    (allPlatforms || []).forEach(p => keys.push({ key: `platform_${p.id}`, label: p.name, type: p.platform_type || 'other' }));
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
    extras.forEach(e => { if (!keys.find(k => k.key === e.key)) keys.push(e); });
    return keys;
  }, [allPlatforms]);

  const toggleCol = (key) => {
    setEnabledCols(prev => {
      const next = { ...prev, [key]: !prev[key] };
      try { window.localStorage.setItem('overview_enabled_cols', JSON.stringify(next)); } catch (e) {}
      return next;
    });
  };

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem('overview_enabled_cols') || '{}');
      if (saved && Object.keys(saved).length) setEnabledCols(prev => ({ ...prev, ...saved }));
    } catch (e) {}
  }, []);

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

  return (
    <div className="bg-white p-6 rounded-2xl shadow">
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex items-center gap-3">
          <input placeholder="Pesquisar marca ou modelo..." value={search} onChange={(e) => setSearch(e.target.value)} className="p-2 border rounded w-64" />
          <select value={brandFilter || 'ALL'} onChange={(e) => setBrandFilter(e.target.value === 'ALL' ? '' : e.target.value)} className="p-2 border rounded">
            <option value="ALL">Todas as marcas</option>
            {brandOptions.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <Button variant="outline" size="sm" onClick={() => { setSearch(''); setBrandFilter(''); }}>Limpar</Button>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="text-sm text-gray-600">Colunas:</div>
          <div className="flex gap-2 items-center overflow-x-auto">
            {allColumnKeys.map(c => (
              <label key={c.key} className="flex items-center gap-2 text-sm bg-gray-50 border p-1 rounded">
                <input type="checkbox" checked={!!enabledCols[c.key]} onChange={() => toggleCol(c.key)} />
                <span className="whitespace-nowrap">{c.label}</span>
              </label>
            ))}
          </div>

          <CSVLink data={csvData} filename="matriz_veiculos.csv" className="ml-2">
            <Button variant="outline" size="sm">Exportar CSV</Button>
          </CSVLink>
        </div>
      </div>

      <div className="overflow-auto border rounded">
        <table className="w-full table-fixed min-w-[900px]">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="p-3 text-left">Veículo</th>
              <th className="p-3 text-left">Preço</th>
              {marketplaceCols.length > 0 && <th className="p-3 text-center" colSpan={marketplaceCols.length}>Anúncios</th>}
              {socialCols.length > 0 && <th className="p-3 text-center" colSpan={socialCols.length}>Redes Sociais</th>}
              <th className="p-3 text-center">Ações</th>
            </tr>
            <tr>
              <th className="p-2" />
              <th className="p-2" />
              {marketplaceCols.map(col => <th key={col.key} className="p-2 text-center text-xs">{col.label}</th>)}
              {socialCols.map(col => <th key={col.key} className="p-2 text-center text-xs">{col.label}</th>)}
              <th className="p-2" />
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={4 + marketplaceCols.length + socialCols.length} className="p-6 text-center text-sm text-gray-500">Carregando dados...</td>
              </tr>
            )}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={4 + marketplaceCols.length + socialCols.length} className="p-6 text-center text-sm text-gray-500">Nenhum veículo encontrado.</td>
              </tr>
            )}

            {!loading && filtered.map(car => {
              const map = pubsMap[car.id] || {};
              return (
                <tr key={car.id} className="odd:bg-white even:bg-gray-50 border-b">
                  <td className="p-3">
                    <div className="font-semibold">{car.brand} {car.model} <span className="text-xs text-gray-500">({car.year})</span></div>
                    <div className="text-xs text-gray-500">{car.mileage ? `${car.mileage} km` : ''} {car.is_blindado ? ' • BLINDADO' : ''}</div>
                  </td>
                  <td className="p-3"><MoneyFallback value={car.price} /></td>

                  {marketplaceCols.map(col => {
                    const exists = Array.isArray(map[col.key]) && map[col.key].length > 0;
                    return (
                      <td key={col.key} className="p-2 text-center">
                        {exists ? <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded inline-block">SIM</div> : <div className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded inline-block">NÃO</div>}
                      </td>
                    );
                  })}

                  {socialCols.map(col => {
                    const exists = Array.isArray(map[col.key]) && map[col.key].length > 0;
                    return (
                      <td key={col.key} className="p-2 text-center">
                        {exists ? <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded inline-block">SIM</div> : <div className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded inline-block">NÃO</div>}
                      </td>
                    );
                  })}

                  <td className="p-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => onOpenGestaoForCar(car)}>Gerenciar</Button>
                    </div>
                    <div className="text-xs text-gray-400 mt-1 text-right">Atualizado: {car.updated_at ? new Date(car.updated_at).toLocaleDateString() : '-'}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OverviewBoard;

