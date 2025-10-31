// src/components/OverviewBoard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Search, ExternalLink, ArrowUp, ArrowDown, X } from 'lucide-react';
import {
  getPublicationsForCars,
  getPlatforms,
  getCars,
  updatePlatformOrder,
} from '@/lib/car-api';

const EXCLUDE_COL_NAMES = ['indicação', 'indicacao'];

const Money = (v) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(v || 0));

const normalize = (s = '') => String(s || '').trim().toLowerCase();

// tenta vários campos de foto (mesma ideia que você já usa)
const getCarImage = (car) => {
  return (
    car.main_photo_url ||
    car.main_image_url ||
    car.cover_url ||
    car.image_url ||
    car.thumb_url ||
    (Array.isArray(car.images) && car.images.length > 0 ? car.images[0] : null) ||
    null
  );
};

// se for anúncio pinta amarelo
const isAdPlatformName = (name = '') => {
  const n = name.toLowerCase();
  return (
    n.includes('olx') ||
    n.includes('webmotors') ||
    n.includes('mercado') ||
    n.includes('market') ||
    n === 'outro' ||
    n === 'outros'
  );
};

const OverviewBoard = ({ onOpenGestaoForCar = () => {} }) => {
  const [cars, setCars] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [pubsMap, setPubsMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // modal de ordem
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderingPlatforms, setOrderingPlatforms] = useState([]);

  // carregar carros + plataformas
  useEffect(() => {
    const run = async () => {
      setLoading(true);

      const [carsRes, platformsRes] = await Promise.all([
        getCars({ includeSold: true }),
        getPlatforms(),
      ]);

      const sortedPlatforms = (platformsRes || [])
        .map((p) => ({ ...p, order: p.order ?? 9999 }))
        .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

      setCars(carsRes || []);
      setPlatforms(sortedPlatforms);

      // agora publicações
      const carIds = (carsRes || []).map((c) => c.id).filter(Boolean);
      if (carIds.length) {
        const pubs = await getPublicationsForCars(carIds);
        const map = {};
        carIds.forEach((id) => (map[id] = {}));

        (pubs || []).forEach((p) => {
          const cid = p.car_id;
          if (!map[cid]) map[cid] = {};

          // por id de plataforma
          if (p.platform_id) {
            const key = `platform_${p.platform_id}`;
            if (!map[cid][key]) map[cid][key] = [];
            map[cid][key].push(p);
          }

          // por nome
          if (p.platform_name) {
            const n = p.platform_name.toLowerCase();
            if (!map[cid][n]) map[cid][n] = [];
            map[cid][n].push(p);
          }

          // por link
          const link = (p.link || '').toLowerCase();
          if (link.includes('instagram'))
            (map[cid].instagram = map[cid].instagram || []).push(p);
          if (link.includes('youtube') || link.includes('youtu.be'))
            (map[cid].youtube = map[cid].youtube || []).push(p);
          if (link.includes('tiktok')) (map[cid].tiktok = map[cid].tiktok || []).push(p);
          if (link.includes('webmotors'))
            (map[cid].webmotors = map[cid].webmotors || []).push(p);
          if (link.includes('mercadolivre') || link.includes('mercado livre'))
            (map[cid].mercadolivre = map[cid].mercadolivre || []).push(p);
          if (link.includes('olx')) (map[cid].olx = map[cid].olx || []).push(p);
        });

        setPubsMap(map);
      } else {
        setPubsMap({});
      }

      setLoading(false);
    };
    run();
  }, []);

  // colunas
  const allColumns = useMemo(() => {
    const list = [];
    (platforms || []).forEach((p) => {
      const label = (p.name || '').trim();
      if (!label) return;
      const nl = normalize(label);
      if (EXCLUDE_COL_NAMES.includes(nl)) return;
      list.push({
        key: `platform_${p.id}`,
        label,
        isAd: isAdPlatformName(label),
      });
    });
    return list;
  }, [platforms]);

  // filtro
  const filteredCars = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return cars;
    return (cars || []).filter((c) => {
      const hay = `${c.brand || ''} ${c.model || ''} ${c.year || ''} ${c.plate || ''}`.toLowerCase();
      return hay.includes(term);
    });
  }, [cars, search]);

  // modal ordem
  const openOrderModal = () => {
    const base = (platforms || [])
      .map((p) => ({ ...p }))
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    setOrderingPlatforms(base);
    setOrderModalOpen(true);
  };

  const movePlatform = (id, dir) => {
    setOrderingPlatforms((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx === -1) return prev;
      const arr = [...prev];
      const newIdx = dir === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= arr.length) return prev;
      const tmp = arr[idx];
      arr[idx] = arr[newIdx];
      arr[newIdx] = tmp;
      return arr.map((p, i) => ({ ...p, order: i + 1 }));
    });
  };

  const saveOrder = async () => {
    const payload = orderingPlatforms.map((p, i) => ({
      id: p.id,
      order: i + 1,
    }));
    const { error } = await updatePlatformOrder(payload);
    if (error) {
      console.error('Erro ao salvar ordem plataformas:', error);
      alert('Não foi possível salvar a nova ordem no banco.');
      return;
    }
    const newPlatforms = orderingPlatforms
      .map((p) => ({ ...p }))
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    setPlatforms(newPlatforms);
    setOrderModalOpen(false);
  };

  // se tem publicação
  const hasPub = (car, col) => {
    const map = pubsMap[car.id] || {};
    if (map[col.key] && Array.isArray(map[col.key]) && map[col.key].length > 0) return true;
    const byName = map[col.label?.toLowerCase()];
    if (byName && Array.isArray(byName) && byName.length > 0) return true;
    return false;
  };

  // larguras
  const COL_IMG = 54; // maiorzinho
  const COL_VEHICLE = 220;
  const COL_PRICE = 82;
  const COL_PLATE = 74;
  const COL_ACTION = 90;
  const COL_PLATFORM = 78;

  return (
    <div className="w-full space-y-4">
      {/* topo */}
      <div className="flex items-center gap-3">
        <div className="relative w-80 max-w-md">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 border rounded-md w-full text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
            placeholder="Pesquisar marca, modelo, ano ou PLACA..."
          />
        </div>
        <button
          onClick={openOrderModal}
          className="bg-yellow-400 hover:bg-yellow-500 text-sm font-medium px-4 py-2 rounded-md"
        >
          Editar ordem das plataformas
        </button>
      </div>

      {/* tabela */}
      <div className="bg-white border rounded-md overflow-hidden">
        <div className="relative">
          <table
            className="text-sm"
            style={{
              width: '100%',
              tableLayout: 'fixed',
              borderCollapse: 'separate',
            }}
          >
            <thead>
              <tr>
                {/* foto */}
                <th
                  style={{
                    position: 'sticky',
                    top: 0,
                    left: 0,
                    width: COL_IMG,
                    minWidth: COL_IMG,
                    background: '#ffffff',
                    zIndex: 40,
                    borderBottom: '1px solid #e5e7eb',
                  }}
                />
                {/* veículo */}
                <th
                  style={{
                    position: 'sticky',
                    top: 0,
                    left: COL_IMG,
                    width: COL_VEHICLE,
                    minWidth: COL_VEHICLE,
                    background: '#ffffff',
                    zIndex: 40,
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'left',
                    fontSize: '0.7rem',
                    padding: '6px 8px',
                  }}
                >
                  Veículo
                </th>
                {/* preço */}
                <th
                  style={{
                    position: 'sticky',
                    top: 0,
                    left: COL_IMG + COL_VEHICLE,
                    width: COL_PRICE,
                    minWidth: COL_PRICE,
                    background: '#ffffff',
                    zIndex: 40,
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'center',
                    fontSize: '0.7rem',
                  }}
                >
                  Preço
                </th>
                {/* placa */}
                <th
                  style={{
                    position: 'sticky',
                    top: 0,
                    left: COL_IMG + COL_VEHICLE + COL_PRICE,
                    width: COL_PLATE,
                    minWidth: COL_PLATE,
                    background: '#ffffff',
                    zIndex: 40,
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'center',
                    fontSize: '0.7rem',
                  }}
                >
                  Placa
                </th>

                {/* plataformas */}
                {allColumns.map((col) => (
                  <th
                    key={col.key}
                    style={{
                      width: COL_PLATFORM,
                      minWidth: COL_PLATFORM,
                      background: col.isAd ? '#fff5dd' : '#f7f7f8',
                      borderBottom: '1px solid #e5e7eb',
                      textAlign: 'center',
                      padding: '4px 2px',
                    }}
                  >
                    <div className="text-[10px] leading-tight text-slate-700 break-words whitespace-normal">
                      {col.label}
                    </div>
                  </th>
                ))}

                {/* ações */}
                <th
                  style={{
                    position: 'sticky',
                    top: 0,
                    right: 0,
                    width: COL_ACTION,
                    minWidth: COL_ACTION,
                    background: '#ffffff',
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'center',
                    fontSize: '0.7rem',
                    zIndex: 40,
                  }}
                >
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={4 + allColumns.length + 1}
                    className="py-6 text-center text-slate-400 text-sm"
                  >
                    Carregando veículos e publicações...
                  </td>
                </tr>
              )}

              {!loading &&
                filteredCars.map((car, idx) => {
                  const img = getCarImage(car);
                  return (
                    <tr
                      key={car.id}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}
                      style={{ height: 56 }}
                    >
                      {/* foto */}
                      <td
                        style={{
                          position: 'sticky',
                          left: 0,
                          background: idx % 2 === 0 ? '#fff' : '#f8fafc',
                          width: COL_IMG,
                          minWidth: COL_IMG,
                          zIndex: 20,
                          padding: 6,
                        }}
                      >
                        <div className="w-9 h-9 rounded-md bg-slate-200 overflow-hidden flex items-center justify-center">
                          {img ? (
                            <img
                              src={img}
                              alt={car.model}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[8px] text-slate-500 text-center leading-tight px-1">
                              sem foto
                            </span>
                          )}
                        </div>
                      </td>

                      {/* veículo */}
                      <td
                        style={{
                          position: 'sticky',
                          left: COL_IMG,
                          background: idx % 2 === 0 ? '#fff' : '#f8fafc',
                          width: COL_VEHICLE,
                          minWidth: COL_VEHICLE,
                          zIndex: 20,
                          padding: '6px 8px',
                        }}
                      >
                        <div className="flex flex-col leading-tight">
                          <span className="font-medium text-[12.5px] text-slate-800 truncate">
                            {car.brand} {car.model}{' '}
                            {car.year ? (
                              <span className="text-xs text-slate-400">({car.year})</span>
                            ) : null}
                          </span>
                        </div>
                      </td>

                      {/* preço */}
                      <td
                        style={{
                          position: 'sticky',
                          left: COL_IMG + COL_VEHICLE,
                          background: idx % 2 === 0 ? '#fff' : '#f8fafc',
                          width: COL_PRICE,
                          minWidth: COL_PRICE,
                          zIndex: 20,
                          textAlign: 'center',
                          padding: '4px 2px',
                        }}
                        className="text-[11px] text-slate-700"
                      >
                        {car.price ? Money(car.price) : '--'}
                      </td>

                      {/* placa */}
                      <td
                        style={{
                          position: 'sticky',
                          left: COL_IMG + COL_VEHICLE + COL_PRICE,
                          background: idx % 2 === 0 ? '#fff' : '#f8fafc',
                          width: COL_PLATE,
                          minWidth: COL_PLATE,
                          zIndex: 20,
                          textAlign: 'center',
                          padding: '4px 2px',
                        }}
                        className="text-[11px] text-slate-600"
                      >
                        {car.plate || '--'}
                      </td>

                      {/* plataformas */}
                      {allColumns.map((col) => {
                        const ok = hasPub(car, col);
                        return (
                          <td
                            key={col.key}
                            style={{
                              width: COL_PLATFORM,
                              minWidth: COL_PLATFORM,
                              textAlign: 'center',
                              background: col.isAd
                                ? idx % 2 === 0
                                  ? '#fffaf0'
                                  : '#fff2df'
                                : idx % 2 === 0
                                ? '#fff'
                                : '#f8fafc',
                            }}
                          >
                            <span
                              className={`inline-flex items-center justify-center rounded-full text-[10px] font-semibold w-[50px] h-[20px] ${
                                ok
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {ok ? 'SIM' : 'NÃO'}
                            </span>
                          </td>
                        );
                      })}

                      {/* ações */}
                      <td
                        style={{
                          position: 'sticky',
                          right: 0,
                          background: idx % 2 === 0 ? '#fff' : '#f8fafc',
                          width: COL_ACTION,
                          minWidth: COL_ACTION,
                          textAlign: 'center',
                          zIndex: 20,
                        }}
                      >
                        <button
                          onClick={() => onOpenGestaoForCar(car)}
                          className="px-3 py-1 rounded-md border text-[11px] font-medium hover:bg-slate-50"
                        >
                          Gerenciar
                        </button>
                        <a
                          href={`/carro/${car.slug || ''}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-[10px] text-slate-400"
                        >
                          <ExternalLink size={10} /> Ver
                        </a>
                      </td>
                    </tr>
                  );
                })}

              {!loading && filteredCars.length === 0 && (
                <tr>
                  <td
                    colSpan={4 + allColumns.length + 1}
                    className="py-6 text-center text-slate-400 text-sm"
                  >
                    Nenhum veículo encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* modal de ordem */}
      {orderModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[999]">
          <div className="bg-white rounded-md shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Editar ordem das plataformas</h2>
              <button
                onClick={() => setOrderModalOpen(false)}
                className="p-1 rounded hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Use ↑ e ↓ para mudar a posição. Ao salvar grava direto na tabela{' '}
              <code>platforms</code>.
            </p>

            <div className="border rounded-md max-h-[380px] overflow-y-auto">
              {orderingPlatforms.map((p, idx) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-2 px-3 py-2 border-b last:border-b-0 ${
                    isAdPlatformName(p.name) ? 'bg-yellow-50' : 'bg-white'
                  }`}
                >
                  <span className="text-xs text-slate-500 w-6">{idx + 1}.</span>
                  <span className="flex-1 text-sm">{p.name}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => movePlatform(p.id, 'up')}
                      className="p-1 rounded bg-slate-100 hover:bg-slate-200"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={() => movePlatform(p.id, 'down')}
                      className="p-1 rounded bg-slate-100 hover:bg-slate-200"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setOrderModalOpen(false)}
                className="px-4 py-2 rounded-md border text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={saveOrder}
                className="px-5 py-2 rounded-md bg-yellow-400 hover:bg-yellow-500 text-sm font-medium"
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

