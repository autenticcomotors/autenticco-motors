// src/components/OverviewBoard.jsx
import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { savePlatformsOrder } from '@/lib/car-api';
import { GripVertical } from 'lucide-react';

/**
 * Regras que estamos aplicando aqui:
 * - Recebe TODAS as plataformas que vierem do banco (marketplace, social, other)
 * - Separa em 2 colunas visuais:
 *   1) Anúncios / Marketplaces  -> platform_type === 'marketplace'
 *   2) Redes Sociais            -> platform_type === 'social'  (todo o resto pode ir pra baixo também)
 * - Ordenação dentro de cada grupo:
 *   - primeiro as que têm "order" (1,2,3...)
 *   - depois as sem "order" (null/undefined) em ordem alfabética de name
 * - Quando clica em "Editar ordem das plataformas" entra no modo edição
 *   - mostra as duas listas, cada item com "grip" para arrastar
 *   - ao salvar, manda UMA LISTA ÚNICA com todas as plataformas na ordem nova
 *     (primeiro as do grupo marketplace, na ordem que o usuário deixou,
 *      depois as do grupo social, na ordem que o usuário deixou)
 */

const sortPlatformsGroup = (list = []) => {
  // 1) com ordem
  const withOrder = list
    .filter((p) => typeof p.order === 'number' || typeof p.order === 'bigint')
    .sort((a, b) => Number(a.order) - Number(b.order));
  // 2) sem ordem
  const withoutOrder = list
    .filter((p) => p.order === null || p.order === undefined)
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'));

  return [...withOrder, ...withoutOrder];
};

const OverviewBoard = ({ cars = [], platforms = [], onOpenGestaoForCar }) => {
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [editingMarket, setEditingMarket] = useState([]);
  const [editingSocial, setEditingSocial] = useState([]);

  // monta grupos SEM editar
  const { marketplaces, socials } = useMemo(() => {
    const mk = platforms.filter((p) => (p.platform_type || 'marketplace') === 'marketplace');
    const sc = platforms.filter((p) => (p.platform_type || 'marketplace') === 'social');

    return {
      marketplaces: sortPlatformsGroup(mk),
      socials: sortPlatformsGroup(sc),
    };
  }, [platforms]);

  // quando entra no modo edição, copiamos o estado atual
  const handleEnterEdit = () => {
    setEditingMarket(marketplaces.map((p) => ({ ...p })));
    setEditingSocial(socials.map((p) => ({ ...p })));
    setIsEditingOrder(true);
  };

  // mover item dentro do grupo (drag simples por botões ↑ ↓)
  const moveItem = (list, index, direction) => {
    const newList = [...list];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= newList.length) return newList;
    const temp = newList[index];
    newList[index] = newList[newIndex];
    newList[newIndex] = temp;
    return newList;
  };

  const handleMoveMarket = (idx, dir) => {
    setEditingMarket((prev) => moveItem(prev, idx, dir));
  };
  const handleMoveSocial = (idx, dir) => {
    setEditingSocial((prev) => moveItem(prev, idx, dir));
  };

  const handleSaveOrder = async () => {
    try {
      // vamos montar uma lista ÚNICA com marketplace primeiro e depois social
      const finalList = [
        ...editingMarket.map((p, i) => ({ id: p.id, order: i + 1 })),
        ...editingSocial.map((p, i) => ({ id: p.id, order: editingMarket.length + i + 1 })),
      ];

      const { error } = await savePlatformsOrder(finalList);
      if (error) {
        console.error('Erro ao salvar ordem das plataformas:', error);
        toast({
          title: 'Erro ao salvar ordem',
          description: error.message || String(error),
          variant: 'destructive',
        });
        return;
      }

      toast({ title: 'Ordem das plataformas salva.' });
      setIsEditingOrder(false);
    } catch (err) {
      console.error('Erro geral ao salvar ordem:', err);
      toast({
        title: 'Erro ao salvar ordem',
        description: err.message || String(err),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Matriz de Publicações</h2>
          <p className="text-sm text-gray-500">
            Controle rápido de onde cada carro foi anunciado ou publicado.
          </p>
        </div>
        {!isEditingOrder ? (
          <Button
            onClick={handleEnterEdit}
            className="bg-yellow-400 text-black hover:bg-yellow-500 flex items-center gap-2"
          >
            <GripVertical className="w-4 h-4" />
            Editar ordem das plataformas
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditingOrder(false)}
              className="text-gray-700"
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveOrder} className="bg-emerald-500 hover:bg-emerald-600">
              Salvar ordem
            </Button>
          </div>
        )}
      </div>

      {/* TOPO: duas colunas de plataformas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* COLUNA 1 - MARKETPLACES */}
        <div className="border rounded-xl overflow-hidden bg-yellow-50/40">
          <div className="px-4 py-3 bg-yellow-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Anúncios / Marketplaces</h3>
              <p className="text-xs text-gray-600">OLX, Webmotors, MercadoLivre e afins.</p>
            </div>
            <span className="text-xs text-gray-500">{marketplaces.length} cad.</span>
          </div>
          <div className="divide-y">
            {!isEditingOrder &&
              marketplaces.map((p, idx) => (
                <div key={p.id} className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-400">
                    Tipo: {p.platform_type || 'marketplace'} • ordem:{' '}
                    {p.order ? p.order : `s/ordem (${idx + 1})`}
                  </p>
                </div>
              ))}

            {isEditingOrder &&
              editingMarket.map((p, idx) => (
                <div
                  key={p.id}
                  className="px-4 py-3 flex items-center justify-between gap-3 bg-white/60"
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400">marketplace</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleMoveMarket(idx, -1)}
                      disabled={idx === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleMoveMarket(idx, +1)}
                      disabled={idx === editingMarket.length - 1}
                    >
                      ↓
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* COLUNA 2 - REDES SOCIAIS */}
        <div className="border rounded-xl overflow-hidden bg-sky-50/40">
          <div className="px-4 py-3 bg-sky-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Redes Sociais</h3>
              <p className="text-xs text-gray-600">Instagram, Facebook, TikTok, Catálogo WhatsApp…</p>
            </div>
            <span className="text-xs text-gray-500">{socials.length} cad.</span>
          </div>
          <div className="divide-y">
            {!isEditingOrder &&
              socials.map((p, idx) => (
                <div key={p.id} className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-400">
                    Tipo: {p.platform_type || 'social'} • ordem:{' '}
                    {p.order ? p.order : `s/ordem (${idx + 1})`}
                  </p>
                </div>
              ))}

            {isEditingOrder &&
              editingSocial.map((p, idx) => (
                <div
                  key={p.id}
                  className="px-4 py-3 flex items-center justify-between gap-3 bg-white/60"
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.platform_type || 'social'}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleMoveSocial(idx, -1)}
                      disabled={idx === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleMoveSocial(idx, +1)}
                      disabled={idx === editingSocial.length - 1}
                    >
                      ↓
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* ABAIXO DA MATRIZ: lista de veículos (como já tinha) */}
      <div className="mt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Veículos</h3>
        <div className="space-y-2">
          {(cars || []).map((car) => (
            <div
              key={car.id}
              className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border"
            >
              <div>
                <p className="font-medium text-gray-900">
                  {car.brand} {car.model}{' '}
                  {car.year ? <span className="text-xs text-gray-400">({car.year})</span> : null}
                </p>
                <p className="text-xs text-gray-500">
                  {car.is_sold ? 'Vendido' : 'Disponível'} • Placa: {car.plate || '-'}
                </p>
              </div>
              {onOpenGestaoForCar && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenGestaoForCar(car)}
                  className="text-xs"
                >
                  Gerenciar
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OverviewBoard;

