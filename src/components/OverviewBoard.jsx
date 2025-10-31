// src/components/OverviewBoard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  getCars,
  getPlatforms,
  getPublicationsForCars,
  getExpensesForCars,
  updatePlatformOrder,
  addPublication,
  deletePublication,
} from '@/lib/car-api';
import {
  Search,
  X,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const AMBER = '#F5C301';

const OverviewBoard = () => {
  const [cars, setCars] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [publications, setPublications] = useState([]);
  const [expensesByCar, setExpensesByCar] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');

  // modal ordem
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderingList, setOrderingList] = useState([]);
  const [savingOrder, setSavingOrder] = useState(false);

  // modal gerenciar
  const [showManageModal, setShowManageModal] = useState(false);
  const [manageCar, setManageCar] = useState(null);
  const [manageTab, setManageTab] = useState('marketplace');
  const [selectedPlatformId, setSelectedPlatformId] = useState('');
  const [manageLink, setManageLink] = useState('');
  const [manageSpent, setManageSpent] = useState('');

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

  const filteredCars = useMemo(() => {
    let list = [...(cars || [])];
    if (searchTerm.trim() !== '') {
      const t = searchTerm.trim().toLowerCase();
      list = list.filter((car) => {
        const base = `${car.brand || ''} ${car.model || ''} ${car.year || ''} ${car.plate || ''}`.toLowerCase();
        return base.includes(t);
      });
    }
    return list;
  }, [cars, searchTerm]);

  const getCarPublicationOnPlatform = (carId, platformId) => {
    return (publications || []).find(
      (pub) => pub.car_id === carId && pub.platform_id === platformId
    );
  };

  const openOrderModal = () => {
    setOrderingList([...platforms].map((p) => ({ ...p })));
    setShowOrderModal(true);
  };

  const moveItem = (index, direction) => {
    const list = [...orderingList];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= list.length) return;
    const tmp = list[index];
    list[index] = list[newIndex];
    list[newIndex] = tmp;
    setOrderingList(list);
  };

  const handleSaveOrder = async () => {
    try {
      setSavingOrder(true);
      const updates = orderingList.map((p, idx) => ({
        id: p.id,
        order: idx + 1,
      }));

      const { error } = await updatePlatformOrder(updates);
      if (error) {
        console.error('Erro ao salvar ordem plataformas:', error);
        toast({
          title: 'Erro ao salvar ordem',
          description: 'Não foi possível salvar a nova ordem no banco.',
          variant: 'destructive',
        });
        return;
      }

      const refreshed = await getPlatforms();
      const reordered = [...(refreshed || [])].sort((a, b) => {
        if (a.order != null && b.order != null) return a.order - b.order;
        if (a.order != null) return -1;
        if (b.order != null) return 1;
        return (a.name || '').localeCompare(b.name || '');
      });
      setPlatforms(reordered);

      setShowOrderModal(false);
      toast({
        title: 'Ordem salva',
        description: 'Plataformas reordenadas com sucesso.',
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

  const openManage = (car) => {
    setManageCar(car);
    setManageTab('marketplace');
    setSelectedPlatformId('');
    setManageLink('');
    setManageSpent('');
    setShowManageModal(true);
  };

  const handleSavePublication = async () => {
    if (!manageCar || !selectedPlatformId) {
      toast({
        title: 'Selecione a plataforma',
        description: 'Escolha uma plataforma para salvar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const plat = platforms.find((p) => p.id === selectedPlatformId);
      const payload = {
        car_id: manageCar.id,
        platform_id: selectedPlatformId,
        platform_name: plat?.name ?? null,
        platform_type: plat?.platform_type ?? null,
        link: manageLink || null,
        spent: manageTab === 'marketplace' && manageSpent ? Number(manageSpent) : null,
        status: 'active',
      };

      const { error } = await addPublication(payload);
      if (error) {
        console.error('Erro ao adicionar publicação:', error);
        toast({
          title: 'Erro ao adicionar',
          description: 'Não foi possível salvar esse registro.',
          variant: 'destructive',
        });
        return;
      }

      const carIds = (cars || []).map((c) => c.id);
      if (carIds.length > 0) {
        const pubs = await getPublicationsForCars(carIds);
        setPublications(pubs || []);
      }

      toast({
        title: 'Salvo',
        description: 'Publicação registrada.',
      });

      setSelectedPlatformId('');
      setManageLink('');
      setManageSpent('');
    } catch (err) {
      console.error('Erro geral ao salvar publicação:', err);
      toast({
        title: 'Erro ao salvar',
        description: 'Verifique o console.',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePublication = async (pubId) => {
    try {
      const { error } = await deletePublication(pubId);
      if (error) {
        console.error('Erro ao excluir publicação:', error);
        toast({
          title: 'Erro ao excluir',
          description: 'Não foi possível remover esse registro.',
          variant: 'destructive',
        });
        return;
      }

      const carIds = (cars || []).map((c) => c.id);
      if (carIds.length > 0) {
        const pubs = await getPublicationsForCars(carIds);
        setPublications(pubs || []);
      }

      toast({
        title: 'Excluído',
        description: 'Registro removido.',
      });
    } catch (err) {
      console.error('Erro geral ao excluir publicação:', err);
      toast({
        title: 'Erro ao excluir',
        description: 'Verifique o console.',
        variant: 'destructive',
      });
    }
  };

  // >>>>>>>>>>>> FOTO igual gestão
  const getCarImage = (car) => {
    return (
      car.main_image_url ||
      car.image_url ||
      car.cover_url ||
      car.photo_url ||
      car.featured_image ||
      (Array.isArray(car.images) && car.images.length > 0 ? car.images[0] : null) ||
      (Array.isArray(car.photos) && car.photos.length > 0 ? car.photos[0] : null) ||
      null
    );
  };

  return (
    <div className="mt-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Matriz de Publicações</h2>
        <p className="text-sm text-gray-500">
          Visão rápida de anúncios e publicações por veículo.
        </p>
      </div>

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
          onClick={openOrderModal}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold shadow-sm"
          style={{ backgroundColor: AMBER, color: '#000' }}
        >
          Editar ordem das plataformas
        </button>
      </div>

      {/* tabela */}
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <div
          className="max-h-[540px] overflow-y-auto overflow-x-hidden"
          style={{ scrollbarWidth: 'thin' }}
        >
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-20">
              <tr>
                <th className="px-4 py-3 text-left w-[260px] text-xs font-semibold text-gray-500 bg-gray-50">
                  Veículo
                </th>
                <th className="px-3 py-3 text-left w-[90px] text-xs font-semibold text-gray-500 bg-gray-50">
                  Preço
                </th>
                <th className="px-3 py-3 text-left w-[80px] text-xs font-semibold text-gray-500 bg-gray-50">
                  Placa
                </th>
                {platforms.map((p) => (
                  <th
                    key={p.id}
                    className="px-2 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap"
                    style={{
                      minWidth: 70,
                      backgroundColor:
                        p.platform_type === 'marketplace'
                          ? 'rgba(245, 195, 1, 0.16)'
                          : '#f9fafb',
                    }}
                  >
                    {p.name}
                  </th>
                ))}
                <th className="px-3 py-3 text-left w-[90px] text-xs font-semibold text-gray-500 bg-gray-50">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                    Carregando matriz...
                  </td>
                </tr>
              ) : filteredCars.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                    Nenhum veículo encontrado.
                  </td>
                </tr>
              ) : (
                filteredCars.map((car, idx) => {
                  const img = getCarImage(car);
                  return (
                    <tr key={car.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                      <td className="px-4 py-3">
                        <div className="flex gap-3 items-center">
                          <div className="w-14 h-11 rounded-md overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
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
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 leading-tight text-sm truncate">
                              {car.brand} {car.model}{' '}
                              {car.year ? (
                                <span className="text-gray-400 text-xs">({car.year})</span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {car.price ? (
                          <>
                            R{'$ '}
                            {Number(car.price).toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                            })}
                          </>
                        ) : (
                          <span className="text-gray-400 text-xs">--</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-900">
                        {car.plate || <span className="text-gray-400 text-xs">---</span>}
                      </td>

                      {platforms.map((p) => {
                        const pub = getCarPublicationOnPlatform(car.id, p.id);
                        return (
                          <td
                            key={p.id}
                            className="px-2 py-3"
                            style={{
                              backgroundColor:
                                p.platform_type === 'marketplace'
                                  ? 'rgba(245, 195, 1, 0.06)'
                                  : 'transparent',
                            }}
                          >
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

                      <td className="px-3 py-3">
                        <button
                          onClick={() => openManage(car)}
                          className="text-xs text-[#d3a301] hover:underline"
                        >
                          Gerenciar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL ORDEM */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/25 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-5 relative">
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
              Suba ou desça os itens e clique em &ldquo;Salvar ordem&rdquo; para gravar no banco.
            </p>

            <div className="max-h-80 overflow-y-auto border rounded-md">
              {orderingList.length === 0 ? (
                <div className="p-3 text-xs text-gray-400">Nenhuma plataforma cadastrada.</div>
              ) : (
                orderingList.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-3 py-2 border-b last:border-b-0 bg-white/70"
                  >
                    <span className="text-sm text-gray-800 truncate">{p.name}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => moveItem(idx, -1)}
                        className="p-1 rounded bg-gray-100 hover:bg-gray-200"
                        title="Subir"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        onClick={() => moveItem(idx, +1)}
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
                style={{ backgroundColor: AMBER }}
                disabled={savingOrder}
              >
                {savingOrder ? 'Salvando...' : 'Salvar ordem'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GERENCIAR */}
      {showManageModal && manageCar && (
        <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-5 relative">
            <button
              onClick={() => setShowManageModal(false)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>

            <h3 className="text-lg font-semibold mb-1 text-gray-900">
              Gestão – {manageCar.brand} {manageCar.model}{' '}
              {manageCar.year ? `(${manageCar.year})` : ''}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Cadastre anúncios e publicações desse veículo sem sair da matriz.
            </p>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setManageTab('marketplace')}
                className={`px-4 py-2 text-sm rounded ${
                  manageTab === 'marketplace'
                    ? 'bg-[#ffe082] text-gray-900'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                Anúncios (Marketplaces)
              </button>
              <button
                onClick={() => setManageTab('social')}
                className={`px-4 py-2 text-sm rounded ${
                  manageTab === 'social'
                    ? 'bg-[#ffe082] text-gray-900'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                Redes Sociais
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">
                  Plataforma ({manageTab === 'marketplace' ? 'Marketplaces' : 'Redes / Outros'})
                </label>
                <select
                  value={selectedPlatformId}
                  onChange={(e) => setSelectedPlatformId(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="">Selecione</option>
                  {platforms
                    .filter((p) =>
                      manageTab === 'marketplace'
                        ? p.platform_type === 'marketplace'
                        : p.platform_type !== 'marketplace'
                    )
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>

                {manageTab === 'marketplace' && (
                  <>
                    <label className="text-xs text-gray-600 mt-3 mb-1 block">Gasto (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={manageSpent}
                      onChange={(e) => setManageSpent(e.target.value)}
                      className="w-full border rounded px-3 py-2 text-sm"
                      placeholder="0,00"
                    />
                  </>
                )}

                <label className="text-xs text-gray-600 mt-3 mb-1 block">
                  Link do anúncio / publicação
                </label>
                <input
                  value={manageLink}
                  onChange={(e) => setManageLink(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="https://..."
                />

                <button
                  onClick={handleSavePublication}
                  className="mt-4 px-4 py-2 rounded text-sm"
                  style={{ backgroundColor: AMBER }}
                >
                  Salvar {manageTab === 'marketplace' ? 'anúncio' : 'publicação'}
                </button>
              </div>

              <div>
                <p className="text-xs text-gray-600 mb-2">
                  Já cadastrados ({manageTab === 'marketplace' ? 'marketplaces' : 'redes/outras'}):
                </p>
                <div className="max-h-60 overflow-y-auto border rounded">
                  {(publications || [])
                    .filter(
                      (pub) =>
                        pub.car_id === manageCar.id &&
                        (manageTab === 'marketplace'
                          ? pub.platform_type === 'marketplace'
                          : pub.platform_type !== 'marketplace')
                    )
                    .map((pub) => (
                      <div
                        key={pub.id}
                        className="flex items-center justify-between px-3 py-2 border-b last:border-b-0"
                      >
                        <div>
                          <div className="text-sm text-gray-900">{pub.platform_name || '---'}</div>
                          <div className="text-xs text-gray-400">
                            {pub.link ? pub.link : 'Sem link'}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeletePublication(pub.id)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          x
                        </button>
                      </div>
                    ))}
                  {(publications || []).filter(
                    (pub) =>
                      pub.car_id === manageCar.id &&
                      (manageTab === 'marketplace'
                        ? pub.platform_type === 'marketplace'
                        : pub.platform_type !== 'marketplace')
                  ).length === 0 && (
                    <div className="p-3 text-xs text-gray-400">Nenhum registro.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-5">
              <button
                onClick={() => setShowManageModal(false)}
                className="px-4 py-2 border rounded text-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewBoard;

