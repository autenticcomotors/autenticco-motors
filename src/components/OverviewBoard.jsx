// src/components/OverviewBoard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  getCars,
  getPlatforms,
  getPublicationsForCars,
  getExpensesForCars,
  updatePlatformOrder,
} from '@/lib/car-api';
import { Search, Filter, X, ArrowUp, ArrowDown, Image as ImageIcon } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const MARKETPLACE_TYPES = ['marketplace'];
const SOCIAL_TYPES = ['social'];

const OverviewBoard = () => {
  const [cars, setCars] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [publications, setPublications] = useState([]);
  const [expensesByCar, setExpensesByCar] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [showColumnsModal, setShowColumnsModal] = useState(false);

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderingMarketplace, setOrderingMarketplace] = useState([]);
  const [orderingSocial, setOrderingSocial] = useState([]);
  const [savingOrder, setSavingOrder] = useState(false);

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);
        const [carsData, platformsData] = await Promise.all([
          getCars({ includeSold: true }),
          getPlatforms(),
        ]);

        setCars(carsData || []);

        const orderedPlatforms = [...(platformsData || [])].sort((a, b) => {
          if (a.order != null && b.order != null) return a.order - b.order;
          if (a.order != null) return -1;
          if (b.order != null) return 1;
          return (a.name || '').localeCompare(b.name || '');
        });
        setPlatforms(orderedPlatforms);

        const carIds = (carsData || []).map((c) => c.id);
        if (carIds.length > 0) {
          const [pubs, exps] = await Promise.all([
            getPublicationsForCars(carIds),
            getExpensesForCars(carIds),
          ]);
          setPublications(pubs || []);
          setExpensesByCar(exps || []);
        } else {
          setPublications([]);
          setExpensesByCar([]);
        }
      } catch (err) {
        console.error('Erro ao carregar matriz:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  const { marketplacePlatforms, socialPlatforms } = useMemo(() => {
    const m = [];
    const s = [];
    (platforms || []).forEach((p) => {
      if (MARKETPLACE_TYPES.includes(p.platform_type)) {
        m.push(p);
      } else if (SOCIAL_TYPES.includes(p.platform_type)) {
        s.push(p);
      } else {
        s.push(p);
      }
    });
    return { marketplacePlatforms: m, socialPlatforms: s };
  }, [platforms]);

  const filteredCars = useMemo(() => {
    let list = [...(cars || [])];

    if (searchTerm.trim() !== '') {
      const term = searchTerm.trim().toLowerCase();
      list = list.filter((car) => {
        const base =
          `${car.brand || ''} ${car.model || ''} ${car.year || ''} ${car.plate || ''}`.toLowerCase();
        return base.includes(term);
      });
    }

    return list;
  }, [cars, searchTerm]);

  const getCarPublicationOnPlatform = (carId, platformId) => {
    return (publications || []).find(
      (pub) => pub.car_id === carId && pub.platform_id === platformId
    );
  };

  const togglePlatformFilter = (platformId) => {
    setSelectedPlatforms((prev) => {
      if (prev.includes(platformId)) {
        return prev.filter((id) => id !== platformId);
      }
      return [...prev, platformId];
    });
  };

  const resetPlatformFilter = () => {
    setSelectedPlatforms([]);
  };

  const openOrderModal = () => {
    const mk = [...marketplacePlatforms].map((p) => ({ ...p }));
    const sc = [...socialPlatforms].map((p) => ({ ...p }));
    setOrderingMarketplace(mk);
    setOrderingSocial(sc);
    setShowOrderModal(true);
  };

  const moveItem = (listName, index, direction) => {
    const isMarketplace = listName === 'marketplace';
    const list = isMarketplace ? [...orderingMarketplace] : [...orderingSocial];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= list.length) return;
    const tmp = list[index];
    list[index] = list[newIndex];
    list[newIndex] = tmp;
    if (isMarketplace) {
      setOrderingMarketplace(list);
    } else {
      setOrderingSocial(list);
    }
  };

  const handleSaveOrder = async () => {
    try {
      setSavingOrder(true);

      const finalArr = [];
      orderingMarketplace.forEach((p, idx) => {
        finalArr.push({ id: p.id, order: idx + 1 });
      });
      const startSocial = orderingMarketplace.length + 1;
      orderingSocial.forEach((p, idx) => {
        finalArr.push({ id: p.id, order: startSocial + idx });
      });

      const { error } = await updatePlatformOrder(finalArr);
      if (error) {
        console.error('Erro ao salvar ordem plataformas:', error);
        toast({
          title: 'Erro ao salvar ordem',
          description: 'Não foi possível salvar a nova ordem no banco.',
          variant: 'destructive',
        });
        return;
      }

      const newPlats = await getPlatforms();
      const orderedAgain = [...(newPlats || [])].sort((a, b) => {
        if (a.order != null && b.order != null) return a.order - b.order;
        if (a.order != null) return -1;
        if (b.order != null) return 1;
        return (a.name || '').localeCompare(b.name || '');
      });
      setPlatforms(orderedAgain);

      setShowOrderModal(false);
      toast({
        title: 'Ordem salva',
        description: 'As plataformas foram reordenadas com sucesso.',
      });
    } catch (err) {
      console.error('Erro geral ao salvar ordem:', err);
      toast({
        title: 'Erro ao salvar ordem',
        description: 'Verifique o console do navegador.',
        variant: 'destructive',
      });
    } finally {
      setSavingOrder(false);
    }
  };

  // cor base que você usa bastante
  const amber = '#F5C301';

  return (
    <div className="mt-6">
      {/* título igual dashboard */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Matriz de Publicações</h2>
        <p className="text-sm text-gray-500">
          Controle rápido de onde cada carro foi anunciado ou publicado.
        </p>
      </div>

      {/* cards de cima, 2 colunas, iguais ao que você tinha */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="rounded-lg border bg-[#fffef7] border-[#fce59c]">
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Anúncios / Marketplaces</p>
              <p className="text-xs text-gray-500">OLX, Webmotors, MercadoLivre e afins.</p>
            </div>
            <span className="text-xs text-gray-400">
              {marketplacePlatforms.length} cad.
            </span>
          </div>
        </div>
        <div className="rounded-lg border bg-[#f3f8ff] border-[#cce3ff]">
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Redes Sociais</p>
              <p className="text-xs text-gray-500">Instagram, Facebook, TikTok, Catálogo WhatsApp...</p>
            </div>
            <span className="text-xs text-gray-400">
              {socialPlatforms.length} cad.
            </span>
          </div>
        </div>
      </div>

      {/* barra de filtros visual igual dash */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-md border min-w-[280px] shadow-sm">
          <Search size={16} className="text-gray-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar marca, modelo, ano ou PLACA..."
            className="outline-none text-sm flex-1"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowColumnsModal(true)}
          className="flex items-center gap-2 px-3 py-2 bg-white border rounded-md text-sm shadow-sm hover:bg-gray-50"
        >
          <Filter size={14} />
          Colunas visíveis
        </button>

        <button
          type="button"
          onClick={openOrderModal}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold shadow-sm"
          style={{ backgroundColor: amber, color: '#000' }}
        >
          <span className="inline-block w-2 h-2 bg-black rounded-sm" />
          Editar ordem das plataformas
        </button>

        <button
          type="button"
          onClick={resetPlatformFilter}
          className="text-xs px-3 py-2 border rounded-md hover:bg-gray-100"
        >
          Limpar
        </button>
      </div>

      {/* chips do topo (iguais ao que você costuma usar) */}
      <div className="flex flex-wrap gap-2 mb-4">
        {platforms.map((p) => (
          <button
            key={p.id}
            onClick={() => togglePlatformFilter(p.id)}
            className={`px-3 py-1 text-xs rounded-full border transition ${
              selectedPlatforms.includes(p.id)
                ? 'bg-[#ffe082] border-[#ffc400] text-gray-900'
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            {p.name}
          </button>
        ))}
        {platforms.length > 0 && (
          <button
            onClick={resetPlatformFilter}
            className="px-3 py-1 text-xs rounded-full bg-gray-200 hover:bg-gray-300"
          >
            Reset
          </button>
        )}
      </div>

      {/* tabela */}
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left w-[280px] text-xs font-semibold text-gray-500">
                  Veículo
                </th>
                <th className="px-4 py-3 text-left w-[110px] text-xs font-semibold text-gray-500">
                  Preço
                </th>
                <th className="px-4 py-3 text-left w-[90px] text-xs font-semibold text-gray-500">
                  Placa
                </th>
                {marketplacePlatforms.map((p) => {
                  if (selectedPlatforms.length > 0 && !selectedPlatforms.includes(p.id)) return null;
                  return (
                    <th
                      key={p.id}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap"
                    >
                      {p.name}
                    </th>
                  );
                })}
                {socialPlatforms.map((p) => {
                  if (selectedPlatforms.length > 0 && !selectedPlatforms.includes(p.id)) return null;
                  return (
                    <th
                      key={p.id}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap"
                    >
                      {p.name}
                    </th>
                  );
                })}
                <th className="px-4 py-3 text-left w-[90px] text-xs font-semibold text-gray-500">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    Carregando matriz...
                  </td>
                </tr>
              ) : filteredCars.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    Nenhum veículo encontrado.
                  </td>
                </tr>
              ) : (
                filteredCars.map((car, idx) => {
                  // imagem que você já costuma usar
                  const img =
                    car.main_image_url ||
                    car.image_url ||
                    car.cover_url ||
                    car.photo_url ||
                    null;

                  return (
                    <tr key={car.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                      <td className="px-4 py-3">
                        <div className="flex gap-3 items-center">
                          <div className="w-16 h-10 rounded-md overflow-hidden bg-gray-200 flex items-center justify-center">
                            {img ? (
                              <img
                                src={img}
                                alt={car.model || 'Veículo'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 leading-tight text-sm">
                              {car.brand} {car.model}{' '}
                              {car.year ? (
                                <span className="text-gray-400 text-xs">({car.year})</span>
                              ) : null}
                            </div>
                            <div className="text-xs text-gray-400 flex gap-2">
                              <span>{car.status_text || 'Disponível'}</span>
                              {car.plate ? <span>• Placa: {car.plate}</span> : null}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {car.price ? (
                          <span>
                            R${' '}
                            {Number(car.price).toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {car.plate || <span className="text-gray-400 text-xs">---</span>}
                      </td>

                      {marketplacePlatforms.map((p) => {
                        if (selectedPlatforms.length > 0 && !selectedPlatforms.includes(p.id))
                          return null;
                        const pub = getCarPublicationOnPlatform(car.id, p.id);
                        return (
                          <td key={p.id} className="px-4 py-3">
                            {pub ? (
                              <span className="inline-flex px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                SIM
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                                NÃO
                              </span>
                            )}
                          </td>
                        );
                      })}

                      {socialPlatforms.map((p) => {
                        if (selectedPlatforms.length > 0 && !selectedPlatforms.includes(p.id))
                          return null;
                        const pub = getCarPublicationOnPlatform(car.id, p.id);
                        return (
                          <td key={p.id} className="px-4 py-3">
                            {pub ? (
                              <span className="inline-flex px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                SIM
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                                NÃO
                              </span>
                            )}
                          </td>
                        );
                      })}

                      <td className="px-4 py-3">
                        <button className="text-xs text-[#d3a301] hover:underline">Ver</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* modal colunas */}
      {showColumnsModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-5 relative">
            <button
              onClick={() => setShowColumnsModal(false)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Colunas visíveis</h3>
            <p className="text-xs text-gray-500 mb-4">
              Selecione quais plataformas quer enxergar na matriz.
            </p>
            <div className="flex flex-wrap gap-2 mb-5">
              {platforms.map((p) => (
                <button
                  key={p.id}
                  onClick={() => togglePlatformFilter(p.id)}
                  className={`px-3 py-1 rounded-full text-xs border ${
                    selectedPlatforms.includes(p.id)
                      ? 'bg-[#ffe082] border-[#ffc400]'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setSelectedPlatforms([]);
                  setShowColumnsModal(false);
                }}
                className="px-4 py-2 text-sm rounded border"
              >
                Limpar
              </button>
              <button
                onClick={() => setShowColumnsModal(false)}
                className="px-4 py-2 text-sm rounded"
                style={{ backgroundColor: amber }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* modal ordem */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/25 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-5 relative">
            <button
              onClick={() => setShowOrderModal(false)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
            <h3 className="text-lg font-semibold mb-2 text-gray-900">
              Editar ordem das plataformas
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Arraste usando os botões de subir/descer e clique em &ldquo;Salvar ordem&rdquo; para
              gravar no banco.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 border rounded-md">
                <div className="px-3 py-2 border-b">
                  <h4 className="text-sm font-semibold text-gray-800">Marketplaces</h4>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {orderingMarketplace.length === 0 ? (
                    <div className="text-xs text-gray-400 p-3">Nenhum marketplace cadastrado.</div>
                  ) : (
                    orderingMarketplace.map((p, idx) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between px-3 py-2 border-b last:border-b-0 bg-white/70"
                      >
                        <span className="text-sm text-gray-800">{p.name}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => moveItem('marketplace', idx, -1)}
                            className="p-1 rounded bg-gray-100 hover:bg-gray-200"
                            title="Subir"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            onClick={() => moveItem('marketplace', idx, +1)}
                            className="p-1 rounded bg-gray-100 hover:bg-gray-200"
                            title="Descer"
                          >
                            <ArrowDown size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="bg-gray-50 border rounded-md">
                <div className="px-3 py-2 border-b">
                  <h4 className="text-sm font-semibold text-gray-800">Redes sociais / outros</h4>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {orderingSocial.length === 0 ? (
                    <div className="text-xs text-gray-400 p-3">
                      Nenhuma rede social / outro cadastrado.
                    </div>
                  ) : (
                    orderingSocial.map((p, idx) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between px-3 py-2 border-b last:border-b-0 bg-white/70"
                      >
                        <span className="text-sm text-gray-800">{p.name}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => moveItem('social', idx, -1)}
                            className="p-1 rounded bg-gray-100 hover:bg-gray-200"
                            title="Subir"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            onClick={() => moveItem('social', idx, +1)}
                            className="p-1 rounded bg-gray-100 hover:bg-gray-200"
                            title="Descer"
                          >
                            <ArrowDown size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowOrderModal(false)}
                className="px-4 py-2 rounded border text-sm"
                disabled={savingOrder}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveOrder}
                className="px-4 py-2 rounded text-sm"
                style={{ backgroundColor: amber }}
                disabled={savingOrder}
              >
                {savingOrder ? 'Salvando...' : 'Salvar ordem'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewBoard;

