// src/components/OverviewBoard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  getCars,
  getPlatforms,
  getPublicationsForCars,
  getExpensesForCars,
  updatePlatformOrder,
} from '@/lib/car-api';
import { Search, Filter, X, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const MARKETPLACE_TYPES = ['marketplace']; // no banco vem 'marketplace'
const SOCIAL_TYPES = ['social']; // no banco vem 'social'

const OverviewBoard = () => {
  const [cars, setCars] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [publications, setPublications] = useState([]);
  const [expensesByCar, setExpensesByCar] = useState([]);
  const [loading, setLoading] = useState(true);

  // filtros da matriz
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState([]); // filtros por coluna
  const [showColumnsModal, setShowColumnsModal] = useState(false);

  // modal de EDIÇÃO DE ORDEM
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderingMarketplace, setOrderingMarketplace] = useState([]);
  const [orderingSocial, setOrderingSocial] = useState([]);
  const [savingOrder, setSavingOrder] = useState(false);

  // carregar dados base
  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);
        const [carsData, platformsData] = await Promise.all([
          getCars({ includeSold: true }),
          getPlatforms(),
        ]);

        setCars(carsData || []);

        // ordenar no front:
        const orderedPlatforms = [...(platformsData || [])].sort((a, b) => {
          // se os dois tem order
          if (a.order != null && b.order != null) {
            return a.order - b.order;
          }
          // se só um tem order, o que tem order vem primeiro
          if (a.order != null) return -1;
          if (b.order != null) return 1;
          // fallback por nome
          return (a.name || '').localeCompare(b.name || '');
        });
        setPlatforms(orderedPlatforms);

        // pegar publicações e gastos em bulk
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

  // separa plataformas em 2 blocos para exibir acima da matriz
  const { marketplacePlatforms, socialPlatforms } = useMemo(() => {
    const m = [];
    const s = [];
    (platforms || []).forEach((p) => {
      if (MARKETPLACE_TYPES.includes(p.platform_type)) {
        m.push(p);
      } else if (SOCIAL_TYPES.includes(p.platform_type)) {
        s.push(p);
      } else {
        // se não for marketplace nem social, vamos jogar no bloco social/outros
        s.push(p);
      }
    });
    return { marketplacePlatforms: m, socialPlatforms: s };
  }, [platforms]);

  // carros filtrados
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

  // helper: ver se carro tem publicação naquela plataforma
  const getCarPublicationOnPlatform = (carId, platformId) => {
    return (publications || []).find(
      (pub) => pub.car_id === carId && pub.platform_id === platformId
    );
  };

  // toggle de colunas visíveis (só front, igual você já tinha)
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

  // abrir modal de ordem
  const openOrderModal = () => {
    // quando abrir o modal, copia o estado atual já separado
    const mk = [...marketplacePlatforms].map((p) => ({ ...p }));
    const sc = [...socialPlatforms].map((p) => ({ ...p }));
    setOrderingMarketplace(mk);
    setOrderingSocial(sc);
    setShowOrderModal(true);
  };

  const moveItem = (listName, index, direction) => {
    // direction: -1 = sobe, +1 = desce
    const isMarketplace = listName === 'marketplace';
    const list = isMarketplace ? [...orderingMarketplace] : [...orderingSocial];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= list.length) return;
    const temp = list[index];
    list[index] = list[newIndex];
    list[newIndex] = temp;
    if (isMarketplace) {
      setOrderingMarketplace(list);
    } else {
      setOrderingSocial(list);
    }
  };

  const handleSaveOrder = async () => {
    try {
      setSavingOrder(true);

      // montar array na ordem final (1,2,3,...)
      const finalArr = [];
      orderingMarketplace.forEach((p, idx) => {
        finalArr.push({
          id: p.id,
          order: idx + 1,
        });
      });
      // para as sociais, continua a sequência
      const startSocial = orderingMarketplace.length + 1;
      orderingSocial.forEach((p, idx) => {
        finalArr.push({
          id: p.id,
          order: startSocial + idx,
        });
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

      // recarregar plataformas do banco para refletir nova ordem
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

  // render
  return (
    <div className="mt-6">
      {/* Cabeçalho da matriz */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <div>
          <h2 className="text-lg font-semibold">Matriz de Publicações</h2>
          <p className="text-sm text-gray-500">
            Visão rápida de anúncios e publicações por veículo.
          </p>
        </div>
        <div className="flex gap-2">
          {/* botão limpar filtro */}
          <button
            type="button"
            onClick={resetPlatformFilter}
            className="text-xs px-3 py-2 border rounded-md hover:bg-gray-100"
          >
            Limpar
          </button>
          {/* botão exportar (mantive, mesmo que ainda não esteja implementado no seu front) */}
          <button className="text-xs px-3 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600">
            Exportar
          </button>
        </div>
      </div>

      {/* Filtros superiores */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        {/* busca */}
        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-md border min-w-[260px]">
          <Search size={16} className="text-gray-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar marca, modelo, ano ou PLACA..."
            className="outline-none text-sm flex-1"
          />
        </div>

        {/* filtro por marca (aqui vou deixar igual com botão simples, você já tinha uns chips de plataforma) */}
        <button
          type="button"
          onClick={() => setShowColumnsModal(true)}
          className="flex items-center gap-2 px-3 py-2 bg-white border rounded-md text-sm"
        >
          <Filter size={14} />
          Colunas visíveis
        </button>

        {/* botão editar ordem */}
        <button
          type="button"
          onClick={openOrderModal}
          className="flex items-center gap-2 px-3 py-2 bg-amber-400 hover:bg-amber-500 text-sm font-semibold rounded-md"
        >
          <span className="inline-block w-2 h-2 bg-black rounded-sm" />
          Editar ordem das plataformas
        </button>

        {/* chips de filtro rápido por plataforma */}
        <div className="flex flex-wrap gap-2">
          {platforms.map((p) => (
            <button
              key={p.id}
              onClick={() => togglePlatformFilter(p.id)}
              className={`px-3 py-1 text-xs rounded-full border ${
                selectedPlatforms.includes(p.id)
                  ? 'bg-amber-400 border-amber-400 text-black'
                  : 'bg-white hover:bg-gray-100'
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
      </div>

      {/* tabela principal */}
      <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-3 text-left w-[280px]">Veículo</th>
              <th className="px-4 py-3 text-left w-[110px]">Preço</th>
              <th className="px-4 py-3 text-left w-[90px]">Placa</th>
              {/* blocos de plataformas */}
              {marketplacePlatforms.map((p) => {
                if (selectedPlatforms.length > 0 && !selectedPlatforms.includes(p.id)) {
                  return null;
                }
                return (
                  <th key={p.id} className="px-4 py-3 text-left">
                    {p.name}
                  </th>
                );
              })}
              {socialPlatforms.map((p) => {
                if (selectedPlatforms.length > 0 && !selectedPlatforms.includes(p.id)) {
                  return null;
                }
                return (
                  <th key={p.id} className="px-4 py-3 text-left">
                    {p.name}
                  </th>
                );
              })}
              <th className="px-4 py-3 text-left w-[120px]">Ações</th>
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
              filteredCars.map((car) => (
                <tr key={car.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="font-semibold">
                      {car.brand} {car.model}{' '}
                      {car.year ? <span className="text-gray-400 text-xs">({car.year})</span> : null}
                    </div>
                    <div className="text-xs text-gray-400">
                      {car.status_text || 'Disponível'} • Placa: {car.plate || '---'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {car.price ? (
                      <span>
                        R$ {Number(car.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">--</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{car.plate || '---'}</td>

                  {/* marketplaces */}
                  {marketplacePlatforms.map((p) => {
                    if (selectedPlatforms.length > 0 && !selectedPlatforms.includes(p.id)) {
                      return null;
                    }
                    const pub = getCarPublicationOnPlatform(car.id, p.id);
                    const hasPub = !!pub;
                    return (
                      <td key={p.id} className="px-4 py-3">
                        {hasPub ? (
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

                  {/* sociais */}
                  {socialPlatforms.map((p) => {
                    if (selectedPlatforms.length > 0 && !selectedPlatforms.includes(p.id)) {
                      return null;
                    }
                    const pub = getCarPublicationOnPlatform(car.id, p.id);
                    const hasPub = !!pub;
                    return (
                      <td key={p.id} className="px-4 py-3">
                        {hasPub ? (
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
                    <button className="text-xs text-amber-600 hover:underline">Ver</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* modal de colunas visíveis (simples) */}
      {showColumnsModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-5 relative">
            <button
              onClick={() => setShowColumnsModal(false)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
            <h3 className="text-lg font-semibold mb-4">Colunas visíveis</h3>
            <p className="text-xs text-gray-500 mb-3">
              Selecione quais plataformas quer enxergar na matriz.
            </p>
            <div className="flex flex-wrap gap-2 mb-5">
              {platforms.map((p) => (
                <button
                  key={p.id}
                  onClick={() => togglePlatformFilter(p.id)}
                  className={`px-3 py-1 rounded-full text-xs border ${
                    selectedPlatforms.includes(p.id)
                      ? 'bg-amber-400 border-amber-400'
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
                className="px-4 py-2 text-sm rounded bg-amber-500 text-white"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* modal de ordem */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-5 relative">
            <button
              onClick={() => setShowOrderModal(false)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
            <h3 className="text-lg font-semibold mb-2">Editar ordem das plataformas</h3>
            <p className="text-xs text-gray-500 mb-4">
              Dica: as plataformas que já existem no banco aparecem aqui. Só arraste para cima/baixo
              (usando os botões) e salve. Na próxima abertura da matriz elas vêm nessa nova ordem.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Marketplaces</h4>
                <div className="border rounded-md max-h-72 overflow-y-auto">
                  {orderingMarketplace.length === 0 ? (
                    <div className="text-xs text-gray-400 p-3">Nenhum marketplace cadastrado.</div>
                  ) : (
                    orderingMarketplace.map((p, idx) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between px-3 py-2 border-b last:border-b-0"
                      >
                        <span className="text-sm">{p.name}</span>
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
              <div>
                <h4 className="text-sm font-semibold mb-2">Redes sociais / outros</h4>
                <div className="border rounded-md max-h-72 overflow-y-auto">
                  {orderingSocial.length === 0 ? (
                    <div className="text-xs text-gray-400 p-3">
                      Nenhuma rede social / outro cadastrado.
                    </div>
                  ) : (
                    orderingSocial.map((p, idx) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between px-3 py-2 border-b last:border-b-0"
                      >
                        <span className="text-sm">{p.name}</span>
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
                className="px-4 py-2 rounded bg-amber-500 text-white text-sm"
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

