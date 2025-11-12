import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { getCars } from '@/lib/car-api';
import { Printer, Plus, Copy, Trash2 } from 'lucide-react';
import { generateQuotePDF } from '@/lib/quote-print';

const currencyBR = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(isNaN(Number(v)) ? 0 : Number(v));

const DEFAULT_LABELS = ['OLX', 'Webmotors', 'MercadoLivre', 'Facebook/Instagram', 'Google Ads'];

// ——— helper robusto: extrai custos do objeto do carro por chaves comuns
function extractCostsFromCar(car) {
  if (!car) return [];

  // mapeamento amigável por “palavras” na chave
  const map = [
    { match: ['olx'], label: 'OLX' },
    { match: ['webmotors'], label: 'Webmotors' },
    { match: ['mercadolivre', 'ml'], label: 'MercadoLivre' },
    { match: ['facebook', 'instagram', 'meta'], label: 'Facebook/Instagram' },
    { match: ['google'], label: 'Google Ads' },
    { match: ['frete', 'transport'], label: 'Frete' },
    { match: ['lavag'], label: 'Lavagem' },
    { match: ['manut', 'revis'], label: 'Manutenção' },
    { match: ['doc', 'despach'], label: 'Documentos/Despachante' },
    { match: ['laudo', 'cautel'], label: 'Laudo Cautelar' },
    { match: ['taxa', 'fee'], label: 'Taxas' },
    { match: ['extra'], label: 'Gastos extras' },
  ];

  const out = {};
  const add = (label, amount) => {
    const v = Number(amount);
    if (!isFinite(v) || v === 0) return;
    out[label] = (out[label] || 0) + v;
  };

  // 1) varre chaves numéricas do objeto
  for (const [k, v] of Object.entries(car)) {
    const n = Number(v);
    if (!isFinite(n) || n === 0) continue;
    const key = String(k).toLowerCase();
    const hit = map.find((m) => m.match.some((w) => key.includes(w)));
    if (hit) add(hit.label, n);
  }

  // 2) arrays comuns: costs / expenses / ad_costs
  const arrays = ['costs', 'expenses', 'ad_costs', 'gastos', 'custos'];
  arrays.forEach((arrKey) => {
    const arr = car[arrKey];
    if (Array.isArray(arr)) {
      arr.forEach((item) => {
        const label = String(item?.label || item?.name || '').trim();
        const amount = Number(item?.amount ?? item?.value ?? 0);
        if (label && isFinite(amount)) add(label, amount);
      });
    }
  });

  // 3) retorna como lista ordenada
  return Object.entries(out)
    .map(([label, amount]) => ({ id: crypto.randomUUID(), label, amount }))
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
}

const QuoteGenerator = () => {
  // ====== Dados do veículo / cabeçalho ======
  const [cars, setCars] = useState([]);
  const [manualVehicle, setManualVehicle] = useState(false);
  const [vehicleId, setVehicleId] = useState('');
  const [vehicleText, setVehicleText] = useState('');
  const [period, setPeriod] = useState('até vender'); // pré-preenchido

  // título
  const [titleMode, setTitleMode] = useState('custom'); // ads | docs | custom
  const [customTitle, setCustomTitle] = useState('');
  const effectiveTitle = useMemo(() => {
    if (titleMode === 'ads') return 'Tabela de Custos — Anúncios e Tráfego Pago';
    if (titleMode === 'docs') return 'Documentação';
    return customTitle || 'Relatório de Custos';
  }, [titleMode, customTitle]);

  // observações
  const [notes, setNotes] = useState('');

  // ====== Itens / valores ======
  const [items, setItems] = useState(
    DEFAULT_LABELS.map((label) => ({ id: crypto.randomUUID(), label, amount: '' }))
  );

  // total
  const total = useMemo(
    () =>
      items.reduce((acc, it) => {
        const n = Number(String(it.amount).replace(',', '.'));
        return acc + (isNaN(n) ? 0 : n);
      }, 0),
    [items]
  );

  // ====== Carrega carros ======
  useEffect(() => {
    (async () => {
      try {
        const data = await getCars();
        setCars((data || []).filter(Boolean));
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  // ====== Helpers ======
  const selectedCar = useMemo(
    () => (vehicleId ? (cars || []).find((c) => c.id === vehicleId) : null),
    [vehicleId, cars]
  );

  const handleItemChange = (id, field, value) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };

  const addItem = () => {
    setItems((prev) => [...prev, { id: crypto.randomUUID(), label: '', amount: '' }]);
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const duplicateItem = (id) => {
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.id === id);
      if (idx < 0) return prev;
      const base = prev[idx];
      const dup = { ...base, id: crypto.randomUUID() };
      const clone = [...prev];
      clone.splice(idx + 1, 0, dup);
      return clone;
    });
  };

  // Pré-preenche com dados do veículo — AGORA SUBSTITUI A LISTA ATUAL
  const preloadFromVehicle = () => {
    const car = selectedCar;
    if (!manualVehicle && !car) {
      toast({ title: 'Selecione um veículo do estoque ou marque "Digitar manualmente".' });
      return;
    }

    if (!manualVehicle && car) {
      const name = `${car.brand || ''} ${car.model || ''} ${
        car.year ? `(${car.year})` : ''
      } ${car.plate ? `• ${car.plate}` : ''}`.trim();
      if (!vehicleText) setVehicleText(name);
    }

    const extracted = extractCostsFromCar(car || {});
    // sempre garante as labels padrão no topo (vazias se não vierem do carro)
    const baseTraffic = DEFAULT_LABELS.map((l) => {
      const found = extracted.find((e) => e.label.toLowerCase() === l.toLowerCase());
      return { id: crypto.randomUUID(), label: l, amount: found ? String(found.amount) : '' };
    });

    // merge: padrões + demais custos únicos (sem duplicar)
    const rest = extracted.filter(
      (e) => !DEFAULT_LABELS.some((l) => l.toLowerCase() === e.label.toLowerCase())
    ).map((e) => ({ id: crypto.randomUUID(), label: e.label, amount: String(e.amount) }));

    const merged = [...baseTraffic, ...rest];

    // *** SUBSTITUI lista atual ***
    setItems(merged.length ? merged : baseTraffic);
    toast({ title: 'Itens carregados do veículo (editáveis).' });
  };

  // ====== PDF ======
  const handleGenerate = async () => {
    const payload = {
      logoUrl: '/logo.png', // ajuste se necessário
      siteUrl: 'https://autenticcomotors.com.br',
      social: ['Instagram', 'Facebook', 'YouTube', 'TikTok'],
      title: effectiveTitle,
      vehicle:
        manualVehicle || !selectedCar
          ? vehicleText
          : `${selectedCar.brand || ''} ${selectedCar.model || ''}${
              selectedCar.year ? ` (${selectedCar.year})` : ''
            }${selectedCar.plate ? ` • ${selectedCar.plate}` : ''}`.trim(),
      period,
      notes,
      items: items.map((it) => ({
        label: it.label || '',
        amount: Number(String(it.amount).replace(',', '.')) || 0,
      })),
      total,
      theme: { primary: '#FACC15', dark: '#111111' },
    };

    try {
      await generateQuotePDF(payload);
    } catch (e) {
      console.error(e);
      toast({
        title: 'Falha ao gerar PDF',
        description: String(e?.message || e),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-[70vh]">
      <Helmet>
        <title>Gerar Orçamento / Relatório de Custos • AutenTicco Motors</title>
      </Helmet>

      <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-6">
        Gerar Orçamento / Relatório de Custos
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ====== COL ESQUERDA ====== */}
        <div className="space-y-4">
          {/* veículo */}
          <div className="border rounded-xl p-4 bg-white">
            <p className="font-semibold mb-3">Veículo</p>
            <div className="flex items-center gap-3 mb-3">
              <input
                id="manualVehicle"
                type="checkbox"
                checked={manualVehicle}
                onChange={(e) => setManualVehicle(e.target.checked)}
              />
              <label htmlFor="manualVehicle" className="text-sm">
                Digitar manualmente
              </label>
            </div>

            {!manualVehicle ? (
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full border rounded-md p-2 mb-3"
              >
                <option value="">Selecione um veículo do estoque</option>
                {(cars || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.brand} {c.model} {c.year ? `(${c.year})` : ''} {c.plate ? `• ${c.plate}` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="w-full border rounded-md p-2 mb-3"
                placeholder="Ex.: Volkswagen T-Cross Highline 1.4 (2020)"
                value={vehicleText}
                onChange={(e) => setVehicleText(e.target.value)}
              />
            )}

            <Button
              onClick={preloadFromVehicle}
              className="w-full bg-black text-white hover:bg-gray-800"
              type="button"
            >
              Pré-preencher com dados do veículo
            </Button>
          </div>

          {/* título */}
          <div className="border rounded-xl p-4 bg-white">
            <p className="font-semibold mb-3">Título do documento</p>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="titleMode"
                  value="ads"
                  checked={titleMode === 'ads'}
                  onChange={() => setTitleMode('ads')}
                />
                Tabela de Custos — Anúncios e Tráfego Pago
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="titleMode"
                  value="docs"
                  checked={titleMode === 'docs'}
                  onChange={() => setTitleMode('docs')}
                />
                Documentação
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="titleMode"
                  value="custom"
                  checked={titleMode === 'custom'}
                  onChange={() => setTitleMode('custom')}
                />
                Personalizado
              </label>
            </div>

            <input
              className="mt-3 w-full border rounded-md p-2"
              placeholder="Digite o título"
              disabled={titleMode !== 'custom'}
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
            />
          </div>

          {/* período */}
          <div className="border rounded-xl p-4 bg-white">
            <p className="font-semibold mb-2">Período</p>
            <input
              className="w-full border rounded-md p-2"
              placeholder='até vender (ou edite: "27/08/2025 a 14/10/2025")'
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Deixe como “até vender” ou edite manualmente (ex.: 27/08/2025 a 14/10/2025).
            </p>
          </div>

          {/* observações */}
          <div className="border rounded-xl p-4 bg-white">
            <p className="font-semibold mb-2">Observações (opcional)</p>
            <textarea
              className="w-full border rounded-md p-2 h-28"
              placeholder="Ex.: Valores referentes ao período informado. Cotações sujeitas a atualização."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* ====== COL DIREITA ====== */}
        <div className="border rounded-xl p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold">Itens do orçamento</p>
            <Button
              type="button"
              onClick={addItem}
              className="bg-yellow-400 text-black hover:bg-yellow-500 h-8 px-2 py-1 text-xs"
            >
              <Plus className="h-4 w-4 mr-1" /> Adicionar item
            </Button>
          </div>

          {/* Cabeçalho das colunas */}
          <div className="grid grid-cols-[1fr,160px,152px] gap-2 items-center text-xs font-semibold text-gray-600 mb-2">
            <div>Item</div>
            <div>Preço (R$)</div>
            <div className="text-right">Ações</div>
          </div>

          {/* Linhas */}
          <div className="space-y-2">
            {items.map((it) => (
              <div
                key={it.id}
                className="grid grid-cols-[1fr,160px,152px] gap-2 items-center"
              >
                <input
                  className="border rounded-md p-2 text-sm"
                  value={it.label}
                  onChange={(e) => handleItemChange(it.id, 'label', e.target.value)}
                  placeholder="Descrição do item"
                />
                <input
                  className="border rounded-md p-2 text-sm text-right"
                  value={it.amount}
                  onChange={(e) => handleItemChange(it.id, 'amount', e.target.value)}
                  placeholder="0,00"
                  inputMode="decimal"
                />
                <div className="flex justify-end gap-2 whitespace-nowrap">
                  <Button
                    type="button"
                    onClick={() => duplicateItem(it.id)}
                    className="h-8 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-800"
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Duplicar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => removeItem(it.id)}
                    className="h-8 px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Excluir
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-6 flex items-center justify-between">
            <div />
            <div className="text-right">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-2xl font-extrabold">{currencyBR(total)}</p>
            </div>
          </div>

          {/* Ação principal */}
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleGenerate}
              className="bg-yellow-400 text-black hover:bg-yellow-500"
              type="button"
            >
              <Printer className="w-4 h-4 mr-2" />
              GERAR DOCUMENTO
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteGenerator;

