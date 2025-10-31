// src/components/OverviewBoard.jsx
import React, { useMemo, useState } from 'react';
import { Megaphone, Share2, GripVertical, ArrowUp, ArrowDown, Check, X, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { savePlatformsOrder } from '@/lib/car-api';

/**
 * OverviewBoard
 * props:
 *  - cars: array de carros (com is_sold, is_available, sold_at, brand, model, id...)
 *  - platforms: array vindo do banco (já ordenado, mas aqui podemos reordenar)
 *  - onOpenGestaoForCar: função pra abrir gestão de um carro específico
 */
const OverviewBoard = ({ cars = [], platforms = [], onOpenGestaoForCar = () => {} }) => {
  // estado local da ordem das plataformas
  const [localPlatforms, setLocalPlatforms] = useState(() => [...platforms]);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // se o pai atualizar plataformas (ex: recarregou depois de salvar), não vamos ficar defasado
  React.useEffect(() => {
    setLocalPlatforms([...platforms]);
  }, [platforms]);

  // separa marketplace x social
  const marketplacePlatforms = useMemo(
    () => (localPlatforms || []).filter((p) => p.platform_type === 'marketplace'),
    [localPlatforms]
  );
  const socialPlatforms = useMemo(
    () => (localPlatforms || []).filter((p) => p.platform_type === 'social' || p.platform_type === 'other'),
    [localPlatforms]
  );

  // mapa rápido de publicações/gastos por carro não está aqui (isso você já controla no VehicleManager)
  // aqui vamos só mostrar contagem básica de anúncios x redes por carro usando os dados da aba gestão? -> não temos aqui,
  // então mantemos só o visual dos blocos e deixamos para o clique em "Gerenciar" levar pro modal completo.

  const moveItem = (list, index, direction) => {
    const newList = [...list];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newList.length) return newList;
    const temp = newList[index];
    newList[index] = newList[targetIndex];
    newList[targetIndex] = temp;
    return newList;
  };

  const handleMoveMarketplace = (index, direction) => {
    // precisamos mexer só nos MARKETPLACES dentro do array total
    const mpIds = new Set(marketplacePlatforms.map((p) => p.id));
    const mpList = marketplacePlatforms;
    const newMpList = moveItem(mpList, index, direction);

    // remontar o array inteiro preservando os sociais na posição deles
    const socials = socialPlatforms;
    const rebuilt = [...newMpList, ...socials];
    setLocalPlatforms(rebuilt);
  };

  const handleMoveSocial = (index, direction) => {
    const socials = socialPlatforms;
    const newSocials = moveItem(socials, index, direction);
    const mps = marketplacePlatforms;
    const rebuilt = [...mps, ...newSocials];
    setLocalPlatforms(rebuilt);
  };

  const handleSaveOrder = async () => {
    try {
      setIsSaving(true);
      // manda pro backend na ordem que está agora
      const payload = localPlatforms.map((p) => ({ id: p.id }));
      const res = await savePlatformsOrder(payload);
      if (res?.error) {
        toast({
          title: 'Erro ao salvar ordem',
          description: String(res.error),
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Ordem salva',
          description: 'A nova ordem de plataformas foi gravada no banco.',
        });
        setIsEditingOrder(false);
      }
    } catch (err) {
      toast({
        title: 'Erro ao salvar ordem',
        description: String(err),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelOrder = () => {
    // volta pra ordem que veio do pai (banco)
    setLocalPlatforms([...platforms]);
    setIsEditingOrder(false);
  };

  // lista de carros só pra mostrar embaixo
  const carsList = useMemo(() => {
    const list = [...(cars || [])];
    // ativos primeiro
    return list.sort((a, b) => {
      const aActive = a.is_available !== false && a.is_sold !== true;
      const bActive = b.is_available !== false && b.is_sold !== true;
      if (aActive !== bActive) return aActive ? -1 : 1;
      const aCreated = new Date(a.created_at || 0).getTime();
      const bCreated = new Date(b.created_at || 0).getTime();
      return bCreated - aCreated;
    });
  }, [cars]);

  return (
    <div className="space-y-6">
      {/* Header principal */}
      <div className="flex items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Matriz de Publicações</h2>
          <p className="text-sm text-gray-500">
            Controle rápido de onde cada carro foi anunciado ou publicado.
          </p>
        </div>
        {!isEditingOrder ? (
          <Button
            onClick={() => setIsEditingOrder(true)}
            className="bg-yellow-400 text-black hover:bg-yellow-500"
          >
            <GripVertical className="w-4 h-4 mr-2" />
            Editar ordem das plataformas
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={handleSaveOrder}
              disabled={isSaving}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              {isSaving ? 'Salvando...' : 'Salvar ordem'}
            </Button>
            <Button onClick={handleCancelOrder} variant="outline">
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </div>
        )}
      </div>

      {/* Blocos de plataformas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Marketplaces */}
        <div className="bg-white rounded-2xl shadow border overflow-hidden">
          <div className="bg-amber-50 border-b border-amber-100 px-4 py-3 flex items-center gap-2">
            <Megaphone className="text-amber-500" />
            <div>
              <h3 className="font-semibold text-gray-900">Anúncios / Marketplaces</h3>
              <p className="text-xs text-gray-500">
                OLX, Webmotors, MercadoLivre e afins.
              </p>
            </div>
          </div>
          <div className="divide-y">
            {marketplacePlatforms.length === 0 && (
              <div className="p-4 text-sm text-gray-400">Nenhuma plataforma de anúncio.</div>
            )}
            {marketplacePlatforms.map((p, idx) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="flex items-center gap-3">
                  {isEditingOrder && (
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleMoveMarketplace(idx, -1)}
                        disabled={idx === 0}
                        className={`p-1 rounded ${
                          idx === 0 ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMoveMarketplace(idx, +1)}
                        disabled={idx === marketplacePlatforms.length - 1}
                        className={`p-1 rounded ${
                          idx === marketplacePlatforms.length - 1
                            ? 'text-gray-300'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-400">
                      Tipo: {p.platform_type || 'marketplace'}
                    </p>
                  </div>
                </div>
                {!isEditingOrder && (
                  <span className="text-xs text-gray-400">
                    {/* aqui no futuro dá pra colocar qtos carros têm publicação nessa plataforma */}
                    ordem: {idx + 1}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Redes Sociais */}
        <div className="bg-white rounded-2xl shadow border overflow-hidden">
          <div className="bg-sky-50 border-b border-sky-100 px-4 py-3 flex items-center gap-2">
            <Share2 className="text-sky-500" />
            <div>
              <h3 className="font-semibold text-gray-900">Redes Sociais</h3>
              <p className="text-xs text-gray-500">
                Instagram, Facebook, TikTok, Catálogo WhatsApp...
              </p>
            </div>
          </div>
          <div className="divide-y">
            {socialPlatforms.length === 0 && (
              <div className="p-4 text-sm text-gray-400">Nenhuma plataforma social.</div>
            )}
            {socialPlatforms.map((p, idx) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="flex items-center gap-3">
                  {isEditingOrder && (
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleMoveSocial(idx, -1)}
                        disabled={idx === 0}
                        className={`p-1 rounded ${
                          idx === 0 ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMoveSocial(idx, +1)}
                        disabled={idx === socialPlatforms.length - 1}
                        className={`p-1 rounded ${
                          idx === socialPlatforms.length - 1
                            ? 'text-gray-300'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-400">
                      Tipo: {p.platform_type || 'social'}
                    </p>
                  </div>
                </div>
                {!isEditingOrder && (
                  <span className="text-xs text-gray-400">ordem: {idx + 1}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lista rápida de carros */}
      <div className="bg-white rounded-2xl shadow border overflow-hidden">
        <div className="bg-gray-50 border-b px-4 py-3 flex items-center gap-2">
          <Car className="text-gray-500" />
          <h3 className="font-semibold text-gray-900">Veículos</h3>
          <span className="text-xs text-gray-400">({carsList.length})</span>
        </div>
        <div className="divide-y">
          {carsList.length === 0 && (
            <div className="p-4 text-sm text-gray-400">Nenhum veículo cadastrado.</div>
          )}
          {carsList.map((car) => (
            <div
              key={car.id}
              className="flex items-center justify-between px-4 py-3 gap-2 hover:bg-gray-50"
            >
              <div>
                <p className="font-medium text-gray-800">
                  {car.brand} {car.model}{' '}
                  {car.year ? <span className="text-xs text-gray-400">({car.year})</span> : null}
                </p>
                <p className="text-xs text-gray-400">
                  {car.is_sold
                    ? `Vendido em ${
                        car.sold_at ? new Date(car.sold_at).toLocaleDateString('pt-BR') : '-'
                      }`
                    : car.is_available === false
                    ? 'Indisponível'
                    : 'Disponível'}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenGestaoForCar(car)}
                className="text-xs"
              >
                Gerenciar
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OverviewBoard;

