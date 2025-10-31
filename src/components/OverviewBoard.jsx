// src/components/OverviewBoard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Search, ExternalLink, ArrowUp, ArrowDown, X, SlidersHorizontal } from 'lucide-react';
import {
  getCars,
  getPlatforms,
  getPublicationsForCars,
  updatePlatformOrder,
  getPublicationsByCar,
  getExpensesByCar,
  addPublication,
  addExpense,
  updateCar,
  getFipeForCar,
} from '@/lib/car-api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const EXCLUDE_COL_NAMES = ['indicação', 'indicacao'];

const Money = (v) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(v || 0));

const normalize = (s = '') => String(s || '').trim().toLowerCase();

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

const OverviewBoard = () => {
  const [cars, setCars] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [pubsMap, setPubsMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderingPlatforms, setOrderingPlatforms] = useState([]);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [stockFilter, setStockFilter] = useState('all'); // all | stock | sold
  const [platformFilterId, setPlatformFilterId] = useState('');

  const [gestaoOpen, setGestaoOpen] = useState(false);
  const [gestaoTab, setGestaoTab] = useState('marketplaces');
  const [gestaoCar, setGestaoCar] = useState(null);
  const [gestaoPubs, setGestaoPubs] = useState([]);
  const [gestaoExps, setGestaoExps] = useState([]);
  const [gestaoFinance, setGestaoFinance] = useState({
    fipe_value: '',
    commission: '',
    return_to_seller: '',
  });

  const [pubForm, setPubForm] = useState({
    platform_id: '',
    link: '',
    spent: '',
    status: 'active',
    published_at: '',
    notes: '',
  });
  const [expForm, setExpForm] = useState({
    category: '',
    amount: '',
    charged_value: '',
    incurred_at: '',
    description: '',
  });

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

      const carIds = (carsRes || []).map((c) => c.id).filter(Boolean);
      if (carIds.length) {
        const pubs = await getPublicationsForCars(carIds);
        const map = {};
        carIds.forEach((id) => (map[id] = {}));
        (pubs || []).forEach((p) => {
          const cid = p.car_id;
          if (!map[cid]) map[cid] = {};

          if (p.platform_id) {
            const key = `platform_${p.platform_id}`;
            if (!map[cid][key]) map[cid][key] = [];
            map[cid][key].push(p);
          }

          if (p.platform_name) {
            const n = p.platform_name.toLowerCase();
            if (!map[cid][n]) map[cid][n] = [];
            map[cid][n].push(p);
          }

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
        id: p.id,
      });
    });
    return list;
  }, [platforms]);

  const filteredCars = useMemo(() => {
    let base = cars || [];

    if (stockFilter === 'stock') {
      base = base.filter((c) => !c.is_sold);
    } else if (stockFilter === 'sold') {
      base = base.filter((c) => !!c.is_sold);
    }

    if (platformFilterId) {
      const col = allColumns.find((c) => String(c.id) === String(platformFilterId));
      if (col) {
        base = base.filter((car) => {
          const map = pubsMap[car.id] || {};
          const has =
            (map[col.key] && Array.isArray(map[col.key]) && map[col.key].length > 0) ||
            (map[col.label?.toLowerCase()] &&
              Array.isArray(map[col.label?.toLowerCase()]) &&
              map[col.label?.toLowerCase()].length > 0);
          return !has;
        });
      }
    }

    const term = search.trim().toLowerCase();
    if (!term) return base;
    return base.filter((c) => {
      const hay = `${c.brand || ''} ${c.model || ''} ${c.year || ''} ${c.plate || ''}`.toLowerCase();
      return hay.includes(term);
    });
  }, [cars, search, stockFilter, platformFilterId, allColumns, pubsMap]);

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

  const hasPub = (car, col) => {
    const map = pubsMap[car.id] || {};
    if (map[col.key] && Array.isArray(map[col.key]) && map[col.key].length > 0) return true;
    const byName = map[col.label?.toLowerCase()];
    if (byName && Array.isArray(byName) && byName.length > 0) return true;
    return false;
  };

  // LARGURAS (aqui o ajuste)
  const COL_IMG = 130;
  const COL_VEHICLE = 220;
  const COL_PRICE = 88;
  const COL_PLATE = 78;
  const COL_ACTION = 96;
  const COL_GHOST = 30; // AUMENTEI
  const COL_PLATFORM = 80; // +2 pra dar respiro

  const marketplacePlatforms = (platforms || []).filter(
    (p) => p.platform_type === 'marketplace'
  );
  const socialPlatforms = (platforms || []).filter((p) => p.platform_type === 'social');

  const openGestao = async (car) => {
    setGestaoCar(car);
    setGestaoTab('marketplaces');
    setGestaoOpen(true);

    try {
      const [pubs, exps] = await Promise.all([
        getPublicationsByCar(car.id),
        getExpensesByCar(car.id),
      ]);
      setGestaoPubs(pubs || []);
      setGestaoExps(exps || []);
      setGestaoFinance({
        fipe_value: car.fipe_value ?? '',
        commission: car.commission ?? '',
        return_to_seller: car.return_to_seller ?? '',
      });
      setPubForm({
        platform_id: '',
        link: '',
        spent: '',
        status: 'active',
        published_at: '',
        notes: '',
      });
      setExpForm({
        category: '',
        amount: '',
        charged_value: '',
        incurred_at: '',
        description: '',
      });
    } catch (err) {
      console.error(err);
      setGestaoPubs([]);
      setGestaoExps([]);
    }
  };

  const reloadSingleCarData = async (carId) => {
    const [carsRes, pubs] = await Promise.all([
      getCars({ includeSold: true }),
      getPublicationsForCars([carId]),
    ]);
    setCars(carsRes || []);
    if (pubs && pubs.length) {
      setPubsMap((prev) => ({
        ...prev,
        [carId]: {
          ...(prev[carId] || {}),
          ...pubs.reduce((acc, p) => {
            if (p.platform_id) {
              const key = `platform_${p.platform_id}`;
              if (!acc[key]) acc[key] = [];
              acc[key].push(p);
            }
            return acc;
          }, {}),
        },
      }));
    }
  };

  const handleSavePub = async () => {
    if (!gestaoCar) return;
    try {
      const payload = {
        car_id: gestaoCar.id,
        platform_id: pubForm.platform_id || null,
        link: pubForm.link || null,
        spent: pubForm.spent ? Number(pubForm.spent) : null,
        status: pubForm.status || 'active',
        published_at: pubForm.published_at || null,
        notes: pubForm.notes || '',
      };
      await addPublication(payload);
      toast({ title: 'Registro salvo' });

      const [pubs, exps] = await Promise.all([
        getPublicationsByCar(gestaoCar.id),
        getExpensesByCar(gestaoCar.id),
      ]);
      setGestaoPubs(pubs || []);
      setGestaoExps(exps || []);

      setPubForm({
        platform_id: '',
        link: '',
        spent: '',
        status: 'active',
        published_at: '',
        notes: '',
      });

      await reloadSingleCarData(gestaoCar.id);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Erro ao salvar publicação',
        description: err.message || String(err),
        variant: 'destructive',
      });
    }
  };

  const handleSaveExp = async () => {
    if (!gestaoCar) return;
    try {
      const payload = {
        car_id: gestaoCar.id,
        category: expForm.category || 'Outros',
        amount: expForm.amount ? Number(expForm.amount) : 0,
        charged_value:
          expForm.charged_value !== '' && expForm.charged_value !== null
            ? Number(expForm.charged_value)
            : 0,
        incurred_at: expForm.incurred_at
          ? new Date(`${expForm.incurred_at}T00:00:00-03:00`).toISOString()
          : new Date().toISOString(),
        description: expForm.description || '',
      };
      await addExpense(payload);
      toast({ title: 'Gasto/Ganho salvo' });

      const [pubs, exps] = await Promise.all([
        getPublicationsByCar(gestaoCar.id),
        getExpensesByCar(gestaoCar.id),
      ]);
      setGestaoPubs(pubs || []);
      setGestaoExps(exps || []);

      setExpForm({
        category: '',
        amount: '',
        charged_value: '',
        incurred_at: '',
        description: '',
      });

      await reloadSingleCarData(gestaoCar.id);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Erro ao salvar gasto/ganho',
        description: err.message || String(err),
        variant: 'destructive',
      });
    }
  };

  const handleSaveFinance = async () => {
    if (!gestaoCar) return;
    try {
      await updateCar(gestaoCar.id, {
        fipe_value:
          gestaoFinance.fipe_value !== '' ? Number(gestaoFinance.fipe_value) : null,
        commission: gestaoFinance.commission
          ? Number(gestaoFinance.commission)
          : null,
        return_to_seller: gestaoFinance.return_to_seller
          ? Number(gestaoFinance.return_to_seller)
          : null,
      });
      toast({ title: 'Financeiro atualizado' });
      await reloadSingleCarData(gestaoCar.id);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Erro ao salvar financeiro',
        description: err.message || String(err),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* topo */}
      <div className="flex flex-wrap items-center gap-3">
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
        <button
          onClick={() => setFiltersOpen(true)}
          className="flex items-center gap-2 bg-white border px-3 py-2 rounded-md text-sm hover:bg-slate-50"
        >
          <SlidersHorizontal size={14} /> Filtros
        </button>
        {(stockFilter !== 'all' || platformFilterId) && (
          <span className="text-xs text-slate-500">
            Filtros ativos:
            {stockFilter === 'stock' && ' só em estoque'}
            {stockFilter === 'sold' && ' só vendidos'}
            {platformFilterId &&
              ` | faltando: ${
                (allColumns.find((c) => String(c.id) === String(platformFilterId)) || {}).label || ''
              }`}
            <button
              onClick={() => {
                setStockFilter('all');
                setPlatformFilterId('');
              }}
              className="ml-2 text-[10px] text-red-500 underline"
            >
              limpar
            </button>
          </span>
        )}
      </div>

      {/* tabela */}
      <div className="bg-white border rounded-md overflow-hidden">
        <div
          className="relative"
          style={{
            maxHeight: '72vh',
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingRight: '2.75rem', // espaço pro sticky e pra última coluna
          }}
        >
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
                    zIndex: 50,
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
                    zIndex: 50,
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'left',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    padding: '8px 10px',
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
                    zIndex: 50,
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 500,
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
                    zIndex: 50,
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 500,
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
                      padding: '4px 3px',
                      position: 'sticky',
                      top: 0,
                      zIndex: 25,
                    }}
                  >
                    <div className="text-[11px] leading-tight text-slate-700 break-words whitespace-normal">
                      {col.label}
                    </div>
                  </th>
                ))}

                {/* colunas fantasmas */}
                <th
                  style={{
                    width: COL_GHOST,
                    minWidth: COL_GHOST,
                    background: '#ffffff',
                    borderBottom: '1px solid #e5e7eb',
                  }}
                />
                <th
                  style={{
                    width: COL_GHOST,
                    minWidth: COL_GHOST,
                    background: '#ffffff',
                    borderBottom: '1px solid #e5e7eb',
                  }}
                />

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
                    fontSize: '0.75rem',
                    zIndex: 60,
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
                    colSpan={5 + allColumns.length + 3}
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
                      style={{ height: 80 }}
                    >
                      {/* foto */}
                      <td
                        style={{
                          position: 'sticky',
                          left: 0,
                          background: idx % 2 === 0 ? '#fff' : '#f8fafc',
                          width: COL_IMG,
                          minWidth: COL_IMG,
                          zIndex: 40,
                          padding: '6px 6px',
                        }}
                      >
                        <div className="w-[116px] h-[78px] rounded-md bg-slate-200 overflow-hidden flex items-center justify-center">
                          {img ? (
                            <img
                              src={img}
                              alt={car.model}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[9px] text-slate-500 text-center leading-tight px-1">
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
                          zIndex: 40,
                          padding: '7px 10px',
                        }}
                      >
                        <div className="flex flex-col leading-tight">
                          <span className="font-medium text-[13px] text-slate-800 truncate">
                            {car.brand} {car.model}{' '}
                            {car.year ? (
                              <span className="text-xs text-slate-400">({car.year})</span>
                            ) : null}
                          </span>
                          {car.is_sold ? (
                            <span className="text-[10.5px] text-red-500 font-semibold mt-0.5">
                              VENDIDO
                            </span>
                          ) : null}
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
                          zIndex: 40,
                          textAlign: 'center',
                          padding: '4px 2px',
                        }}
                        className="text-[11.5px] text-slate-700"
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
                          zIndex: 40,
                          textAlign: 'center',
                          padding: '4px 2px',
                        }}
                        className="text-[11.5px] text-slate-600"
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
                              padding: '5px 3px',
                            }}
                          >
                            <span
                              className={`inline-flex items-center justify-center rounded-full text-[11px] font-semibold w-[56px] h-[22px] ${
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

                      {/* 2 células fantasmas */}
                      <td
                        style={{
                          width: COL_GHOST,
                          minWidth: COL_GHOST,
                          background: idx % 2 === 0 ? '#fff' : '#f8fafc',
                        }}
                      />
                      <td
                        style={{
                          width: COL_GHOST,
                          minWidth: COL_GHOST,
                          background: idx % 2 === 0 ? '#fff' : '#f8fafc',
                        }}
                      />

                      {/* ações */}
                      <td
                        style={{
                          position: 'sticky',
                          right: 0,
                          background: idx % 2 === 0 ? '#fff' : '#f8fafc',
                          width: COL_ACTION,
                          minWidth: COL_ACTION,
                          textAlign: 'center',
                          zIndex: 40,
                        }}
                      >
                        <button
                          onClick={() => openGestao(car)}
                          className="px-3 py-1 rounded-md border text-[11px] font-medium hover:bg-slate-50"
                        >
                          Gerenciar
                        </button>
                        <a
                          href={`/carro/${car.slug || ''}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-[10.5px] text-slate-400"
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
                    colSpan={5 + allColumns.length + 3}
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

      {/* modal ordem */}
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

      {/* modal filtros */}
      {filtersOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[999]">
          <div className="bg-white rounded-md shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Filtros da Matriz</h2>
              <button
                onClick={() => setFiltersOpen(false)}
                className="p-1 rounded hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-2">Status do veículo</p>
                <div className="flex flex-col gap-1 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="stockFilter"
                      value="all"
                      checked={stockFilter === 'all'}
                      onChange={() => setStockFilter('all')}
                    />
                    Mostrar todos
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="stockFilter"
                      value="stock"
                      checked={stockFilter === 'stock'}
                      onChange={() => setStockFilter('stock')}
                    />
                    Somente em estoque (não vendidos)
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="stockFilter"
                      value="sold"
                      checked={stockFilter === 'sold'}
                      onChange={() => setStockFilter('sold')}
                    />
                    Somente vendidos
                  </label>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-2">
                  Plataforma (mostrar só veículos que AINDA NÃO estão nessa plataforma)
                </p>
                <select
                  value={platformFilterId}
                  onChange={(e) => setPlatformFilterId(e.target.value)}
                  className="w-full border rounded-md px-2 py-2 text-sm"
                >
                  <option value="">— não filtrar por plataforma —</option>
                  {allColumns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setStockFilter('all');
                  setPlatformFilterId('');
                }}
                className="text-sm text-slate-500 underline"
              >
                Limpar tudo
              </button>
              <button
                onClick={() => setFiltersOpen(false)}
                className="px-4 py-2 rounded-md bg-yellow-400 hover:bg-yellow-500 text-sm font-medium"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewBoard;

