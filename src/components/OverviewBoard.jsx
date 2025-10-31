// src/components/OverviewBoard.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  getCars,
  getPlatforms,
  getPublicationsForCars,
  updatePlatformOrder,
} from '@/lib/car-api';
import { Search, ArrowUp, ArrowDown, X } from 'lucide-react';

const OVERVIEW_MAX_HEIGHT = 520;

// tenta pegar a foto igual nas outras telas
const getCarThumb = (car) => {
  return (
    car?.main_image_url ||
    car?.cover_url ||
    car?.image_url ||
    car?.thumb_url ||
    car?.photo_url ||
    null
  );
};

const OverviewBoard = ({ onOpenCarManager }) => {
  const [cars, setCars] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [pubsByCar, setPubsByCar] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // modal ordem
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderingPlatforms, setOrderingPlatforms] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [carsRes, platformsRes] = await Promise.all([
        getCars({ includeSold: true }),
        getPlatforms(),
      ]);

      const orderedPlatforms = (platformsRes || [])
        .map((p) => ({ ...p, order: p.order ?? 9999 }))
        .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

      setCars(carsRes || []);
      setPlatforms(orderedPlatforms);

      const carIds = (carsRes || []).map((c) => c.id);
      if (carIds.length > 0) {
        const pubs = await getPublicationsForCars(carIds);
        const map = {};
        (pubs || []).forEach((p) => {
          if (!map[p.car_id]) map[p.car_id] = [];
          map[p.car_id].push(p);
        });
        setPubsByCar(map);
      } else {
        setPubsByCar({});
      }

      setLoading(false);
    };
    load();
  }, []);

  const filteredCars = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return cars;
    return cars.filter((c) => {
      const full = `${c.brand || ''} ${c.model || ''} ${c.year || ''} ${c.plate || ''}`.toLowerCase();
      return full.includes(term);
    });
  }, [cars, search]);

  const hasPub = useCallback(
    (carId, platformId) => {
      const arr = pubsByCar[carId];
      if (!arr || arr.length === 0) return false;
      // checa por id e por nome (pra compatibilidade antiga)
      const plat = platforms.find((pl) => pl.id === platformId);
      const platName = plat?.name;
      return arr.some(
        (p) => p.platform_id === platformId || (platName && p.platform_name === platName)
      );
    },
    [pubsByCar, platforms]
  );

  const isAdPlatform = (name) => {
    if (!name) return false;
    const lower = name.toLowerCase();
    return (
      lower.includes('olx') ||
      lower.includes('webmotors') ||
      lower.includes('mercado') ||
      lower.includes('outro')
    );
  };

  // modal ordem
  const openOrderModal = () => {
    const base = platforms
      .map((p) => ({ ...p }))
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    setOrderingPlatforms(base);
    setIsOrderModalOpen(true);
  };

  const movePlatform = (id, dir) => {
    setOrderingPlatforms((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx === -1) return prev;
      const newArr = [...prev];
      const newIdx = dir === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= newArr.length) return prev;
      const tmp = newArr[idx];
      newArr[idx] = newArr[newIdx];
      newArr[newIdx] = tmp;
      return newArr.map((p, i) => ({ ...p, order: i + 1 }));
    });
  };

  const savePlatformOrder = async () => {
    try {
      const payload = orderingPlatforms.map((p, index) => ({
        id: p.id,
        order: index + 1,
      }));
      const { error } = await updatePlatformOrder(payload);
      if (error) {
        console.error('Erro ao salvar ordem plataformas:', error);
        alert('Não foi possível salvar a nova ordem no banco.');
        return;
      }
      const newPlatforms = [...orderingPlatforms].sort(
        (a, b) => a.order - b.order || a.name.localeCompare(b.name)
      );
      setPlatforms(newPlatforms);
      setIsOrderModalOpen(false);
    } catch (err) {
      console.error('Erro geral ao salvar ordem:', err);
      alert('Erro ao salvar ordem.');
    }
  };

  // larguras bem enxutas
  const colPhoto = 42;
  const colVehicle = 235;
  const colPrice = 80;
  const colPlate = 70;
  const colAction = 90;
  const colPlatform = 82;

  return (
    <div className="space-y-4">
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
            placeholder="Pesquisar marca, modelo, ano ou PLACA"
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
      <div
        style={{
          width: '100%',
          overflow: 'hidden', // <- tira barra lateral
          maxHeight: OVERVIEW_MAX_HEIGHT,
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          background: '#fff',
        }}
      >
        <table
          className="text-sm"
          style={{
            width: '100%',
            tableLayout: 'fixed', // <- força tudo caber
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
                  width: colPhoto,
                  minWidth: colPhoto,
                  background: '#f7f7f8',
                  zIndex: 20,
                  borderBottom: '1px solid #e5e7eb',
                }}
              ></th>
              {/* veículo */}
              <th
                style={{
                  position: 'sticky',
                  top: 0,
                  left: colPhoto,
                  width: colVehicle,
                  minWidth: colVehicle,
                  background: '#f7f7f8',
                  zIndex: 20,
                  borderBottom: '1px solid #e5e7eb',
                  textAlign: 'left',
                  fontSize: '0.7rem',
                }}
              >
                Veículo
              </th>
              {/* preço */}
              <th
                style={{
                  position: 'sticky',
                  top: 0,
                  left: colPhoto + colVehicle,
                  width: colPrice,
                  minWidth: colPrice,
                  background: '#f7f7f8',
                  zIndex: 20,
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
                  left: colPhoto + colVehicle + colPrice,
                  width: colPlate,
                  minWidth: colPlate,
                  background: '#f7f7f8',
                  zIndex: 20,
                  borderBottom: '1px solid #e5e7eb',
                  textAlign: 'center',
                  fontSize: '0.7rem',
                }}
              >
                Placa
              </th>

              {/* plataformas */}
              {platforms.map((p) => (
                <th
                    key={p.id}
                    style={{
                      width: colPlatform,
                      minWidth: colPlatform,
                      background: isAdPlatform(p.name) ? '#fff5dd' : '#f7f7f8',
                      borderBottom: '1px solid #e5e7eb',
                      textAlign: 'center',
                      fontSize: '0.68rem',
                      whiteSpace: 'nowrap',
                    }}
                >
                  {p.name}
                </th>
              ))}

              {/* ações */}
              <th
                style={{
                  width: colAction,
                  minWidth: colAction,
                  background: '#f7f7f8',
                  borderBottom: '1px solid #e5e7eb',
                  textAlign: 'center',
                  fontSize: '0.7rem',
                }}
              >
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              filteredCars.map((car) => {
                const thumb = getCarThumb(car);
                return (
                  <tr
                    key={car.id}
                    className="hover:bg-slate-50/70 border-b last:border-b-0"
                    style={{ height: 48 }}
                  >
                    {/* foto */}
                    <td
                      style={{
                        position: 'sticky',
                        left: 0,
                        background: '#fff',
                        width: colPhoto,
                        minWidth: colPhoto,
                        zIndex: 10,
                        padding: 4,
                      }}
                    >
                      <div className="w-8 h-8 rounded-sm bg-slate-200 overflow-hidden flex items-center justify-center">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={car.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[9px] text-slate-400 leading-tight text-center">
                            sem foto
                          </span>
                        )}
                      </div>
                    </td>

                    {/* veículo */}
                    <td
                      style={{
                        position: 'sticky',
                        left: colPhoto,
                        background: '#fff',
                        width: colVehicle,
                        minWidth: colVehicle,
                        zIndex: 10,
                        padding: '4px 8px',
                      }}
                    >
                      <div className="flex flex-col leading-tight">
                        <span className="font-medium text-[13px] text-slate-800 truncate">
                          {car.brand} {car.model}{' '}
                          {car.year ? (
                            <span className="text-xs text-slate-400">
                              ({car.year})
                            </span>
                          ) : null}
                        </span>
                      </div>
                    </td>

                    {/* preço */}
                    <td
                      style={{
                        position: 'sticky',
                        left: colPhoto + colVehicle,
                        background: '#fff',
                        width: colPrice,
                        minWidth: colPrice,
                        zIndex: 10,
                        textAlign: 'center',
                        padding: '4px 2px',
                      }}
                      className="text-[11px] text-slate-700"
                    >
                      {car.price
                        ? `R$ ${Number(car.price).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : '--'}
                    </td>

                    {/* placa */}
                    <td
                      style={{
                        position: 'sticky',
                        left: colPhoto + colVehicle + colPrice,
                        background: '#fff',
                        width: colPlate,
                        minWidth: colPlate,
                        zIndex: 10,
                        textAlign: 'center',
                        padding: '4px 2px',
                      }}
                      className="text-[11px] text-slate-600"
                    >
                      {car.plate || '--'}
                    </td>

                    {/* plataformas */}
                    {platforms.map((p) => {
                      const ok = hasPub(car.id, p.id);
                      return (
                        <td
                          key={p.id}
                          style={{
                            width: colPlatform,
                            minWidth: colPlatform,
                            textAlign: 'center',
                            background: isAdPlatform(p.name) ? '#fffaf0' : '#fff',
                            padding: '4px 0',
                          }}
                        >
                          <span
                            className={`inline-flex items-center justify-center rounded-full text-[10px] font-semibold w-[56px] h-[22px] ${
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
                        width: colAction,
                        minWidth: colAction,
                        textAlign: 'center',
                        background: '#fff',
                      }}
                    >
                      <button
                        onClick={() => {
                          if (onOpenCarManager) {
                            onOpenCarManager(car);
                          } else {
                            alert(
                              'Faltou ligar o onOpenCarManager no AdminDashboard para abrir o modal deste carro.'
                            );
                          }
                        }}
                        className="px-3 py-1 rounded-md border text-[11px] font-medium hover:bg-slate-50"
                      >
                        Gerenciar
                      </button>
                    </td>
                  </tr>
                );
              })}

            {loading && (
              <tr>
                <td
                  colSpan={4 + platforms.length + 1}
                  className="py-6 text-center text-slate-400 text-sm"
                >
                  Carregando veículos e publicações...
                </td>
              </tr>
            )}

            {!loading && filteredCars.length === 0 && (
              <tr>
                <td
                  colSpan={4 + platforms.length + 1}
                  className="py-6 text-center text-slate-400 text-sm"
                >
                  Nenhum veículo encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* modal ordem */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[999]">
          <div className="bg-white rounded-md shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                Editar ordem das plataformas
              </h2>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="p-1 rounded hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Use ↑ e ↓ para mudar a posição. Ao salvar grava direto na tabela
              <code> platforms </code>.
            </p>

            <div className="border rounded-md max-h-[380px] overflow-y-auto">
              {orderingPlatforms.map((p, idx) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-2 px-3 py-2 border-b last:border-b-0 ${
                    isAdPlatform(p.name) ? 'bg-yellow-50' : 'bg-white'
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
                onClick={() => setIsOrderModalOpen(false)}
                className="px-4 py-2 rounded-md border text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={savePlatformOrder}
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

