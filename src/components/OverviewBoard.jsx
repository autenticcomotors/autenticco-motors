// src/components/OverviewBoard.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  getCars,
  getPlatforms,
  getPublicationsForCars,
  updatePlatformOrder,
} from '@/lib/car-api';
import { Search, ArrowUp, ArrowDown, X } from 'lucide-react';

const OverviewBoard = ({ onOpenCarManager }) => {
  // dados
  const [cars, setCars] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [pubsByCar, setPubsByCar] = useState({});
  const [loading, setLoading] = useState(true);

  // UI
  const [search, setSearch] = useState('');
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderingPlatforms, setOrderingPlatforms] = useState([]);

  // carrega tudo
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [carsRes, platformsRes] = await Promise.all([
        getCars({ includeSold: true }),
        getPlatforms(),
      ]);

      const orderedPlatforms = (platformsRes || [])
        .map((p) => ({
          ...p,
          order: p.order ?? 9999,
        }))
        .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

      setCars(carsRes || []);
      setPlatforms(orderedPlatforms);

      // publicações em lote
      const carIds = (carsRes || []).map((c) => c.id);
      if (carIds.length > 0) {
        const pubs = await getPublicationsForCars(carIds);
        // agrupar por carro
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

  // filtrar carros
  const filteredCars = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return cars;
    return cars.filter((c) => {
      const full = `${c.brand || ''} ${c.model || ''} ${c.year || ''} ${c.plate || ''}`.toLowerCase();
      return full.includes(term);
    });
  }, [cars, search]);

  // helper: checar se tem publicação/plataforma
  const hasPub = useCallback(
    (carId, platformId) => {
      const arr = pubsByCar[carId];
      if (!arr || arr.length === 0) return false;
      // vehicle_publications tem platform_id OU platform_name
      return arr.some((p) => p.platform_id === platformId || p.platform_name === platforms.find((pl) => pl.id === platformId)?.name);
    },
    [pubsByCar, platforms]
  );

  // abrir modal ordenação
  const openOrderModal = () => {
    const base = platforms
      .map((p) => ({
        ...p,
      }))
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
      const temp = newArr[idx];
      newArr[idx] = newArr[newIdx];
      newArr[newIdx] = temp;
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
      // reatualiza lista principal
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

  // destacar colunas de "anúncio"
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

  // estilos inline
  const tableWrapperStyle = {
    width: '100%',
    overflowX: 'auto',
    overflowY: 'auto',
    maxHeight: '520px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    background: '#fff',
  };

  const headerCellBase = {
    position: 'sticky',
    top: 0,
    background: '#f7f7f8',
    zIndex: 15,
    fontSize: '0.7rem',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    borderBottom: '1px solid #e5e7eb',
  };

  // largura padrão das colunas fixas
  const colWidthVehicle = 280;
  const colWidthPrice = 90;
  const colWidthPlate = 80;
  const colWidthAction = 90;
  const colWidthPlatform = 110;

  return (
    <div className="space-y-4">
      {/* Topo / filtros */}
      <div className="flex items-center gap-3">
        <div className="relative w-80 max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            className="pl-9 pr-3 py-2 border rounded-md w-full text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
            placeholder="Pesquisar marca, modelo, ano ou PLACA..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={openOrderModal}
          className="bg-yellow-400 hover:bg-yellow-500 text-sm font-medium px-4 py-2 rounded-md"
        >
          Editar ordem das plataformas
        </button>
      </div>

      {/* Tabela */}
      <div style={tableWrapperStyle}>
        <table className="min-w-full text-sm" style={{ borderCollapse: 'separate' }}>
          <thead>
            <tr>
              <th
                style={{
                  ...headerCellBase,
                  left: 0,
                  zIndex: 20,
                  minWidth: 50,
                  width: 50,
                  background: '#f7f7f8',
                }}
              >
                {/* coluna da foto */}
              </th>
              <th
                style={{
                  ...headerCellBase,
                  left: 50,
                  zIndex: 20,
                  minWidth: colWidthVehicle,
                  width: colWidthVehicle,
                  background: '#f7f7f8',
                }}
              >
                Veículo
              </th>
              <th
                style={{
                  ...headerCellBase,
                  left: 50 + colWidthVehicle,
                  zIndex: 20,
                  minWidth: colWidthPrice,
                  width: colWidthPrice,
                  textAlign: 'center',
                  background: '#f7f7f8',
                }}
              >
                Preço
              </th>
              <th
                style={{
                  ...headerCellBase,
                  left: 50 + colWidthVehicle + colWidthPrice,
                  zIndex: 20,
                  minWidth: colWidthPlate,
                  width: colWidthPlate,
                  textAlign: 'center',
                  background: '#f7f7f8',
                }}
              >
                Placa
              </th>
              {platforms.map((p) => (
                <th
                  key={p.id}
                  style={{
                    ...headerCellBase,
                    minWidth: colWidthPlatform,
                    width: colWidthPlatform,
                    textAlign: 'center',
                    background: isAdPlatform(p.name) ? '#fff5dd' : '#f7f7f8',
                  }}
                >
                  {p.name}
                </th>
              ))}
              <th
                style={{
                  ...headerCellBase,
                  minWidth: colWidthAction,
                  width: colWidthAction,
                  textAlign: 'center',
                  background: '#f7f7f8',
                }}
              >
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              filteredCars.map((car) => {
                const thumb =
                  car.main_image_url ||
                  car.cover_url ||
                  car.image_url ||
                  null;
                return (
                  <tr key={car.id} className="border-b last:border-b-0 hover:bg-slate-50/60">
                    {/* foto */}
                    <td
                      style={{
                        position: 'sticky',
                        left: 0,
                        background: '#fff',
                        zIndex: 10,
                        width: 50,
                        minWidth: 50,
                      }}
                      className="py-2"
                    >
                      <div className="w-10 h-10 rounded-sm overflow-hidden bg-slate-200 flex items-center justify-center">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={car.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] text-slate-400">sem foto</span>
                        )}
                      </div>
                    </td>
                    {/* nome */}
                    <td
                      style={{
                        position: 'sticky',
                        left: 50,
                        background: '#fff',
                        zIndex: 10,
                        width: colWidthVehicle,
                        minWidth: colWidthVehicle,
                      }}
                      className="py-2 pr-2"
                    >
                      <div className="flex flex-col leading-tight">
                        <span className="font-medium text-[13px] text-slate-800">
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
                        left: 50 + colWidthVehicle,
                        background: '#fff',
                        zIndex: 10,
                        width: colWidthPrice,
                        minWidth: colWidthPrice,
                        textAlign: 'center',
                      }}
                      className="py-2 text-xs text-slate-700"
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
                        left: 50 + colWidthVehicle + colWidthPrice,
                        background: '#fff',
                        zIndex: 10,
                        width: colWidthPlate,
                        minWidth: colWidthPlate,
                        textAlign: 'center',
                      }}
                      className="py-2 text-xs text-slate-600"
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
                            minWidth: colWidthPlatform,
                            width: colWidthPlatform,
                            textAlign: 'center',
                            background: isAdPlatform(p.name)
                              ? '#fffaf0'
                              : '#fff',
                          }}
                          className="py-2"
                        >
                          <span
                            className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-medium ${
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
                    {/* ação */}
                    <td
                      style={{
                        minWidth: colWidthAction,
                        width: colWidthAction,
                        textAlign: 'center',
                        background: '#fff',
                      }}
                      className="py-2"
                    >
                      <button
                        onClick={() => onOpenCarManager && onOpenCarManager(car)}
                        className="px-3 py-1 rounded-md border text-xs font-medium hover:bg-slate-50"
                      >
                        Gerenciar
                      </button>
                    </td>
                  </tr>
                );
              })}

            {loading && (
              <tr>
                <td colSpan={4 + platforms.length + 1} className="py-6 text-center text-slate-400 text-sm">
                  Carregando veículos e publicações...
                </td>
              </tr>
            )}
            {!loading && filteredCars.length === 0 && (
              <tr>
                <td colSpan={4 + platforms.length + 1} className="py-6 text-center text-slate-400 text-sm">
                  Nenhum veículo encontrado com esse filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de ordem */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[999]">
          <div className="bg-white rounded-md shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
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
              Arraste usando os botões de subir/descer e clique em &quot;Salvar
              ordem&quot; para gravar no banco. Na próxima abertura da matriz
              elas virão nessa nova ordem.
            </p>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-semibold mb-2">Plataformas</h3>
                <div className="border rounded-md max-h-[380px] overflow-y-auto">
                  {orderingPlatforms.map((p, idx) => (
                    <div
                      key={p.id}
                      className={`flex items-center gap-2 px-3 py-2 border-b last:border-b-0 ${
                        isAdPlatform(p.name) ? 'bg-yellow-50' : 'bg-white'
                      }`}
                    >
                      <span className="text-xs text-slate-500 w-6">
                        {idx + 1}.
                      </span>
                      <span className="flex-1 text-sm">{p.name}</span>
                      <div className="flex flex-col gap-1">
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
              </div>

              <div className="rounded-md bg-slate-50 border p-3 text-xs text-slate-500 leading-relaxed">
                <p className="mb-2 font-semibold text-slate-700">
                  Dica de uso
                </p>
                <p>
                  Você pode colocar primeiro as plataformas mais usadas (OLX,
                  Webmotors, MercadoLivre). As demais ficam em seguida.
                </p>
                <p className="mt-2">
                  Essa ordem é salva no banco (tabela <code>platforms</code>),
                  então todos que abrirem a matriz verão assim.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
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

