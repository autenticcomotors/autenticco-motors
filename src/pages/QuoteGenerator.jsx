import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { getCars, getPublicationsByCar, getExpensesByCar } from '@/lib/car-api';
import { Printer, Plus, Copy, Trash2 } from 'lucide-react';
import { generateQuotePDF } from '@/lib/quote-print';

const currencyBR = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(isNaN(Number(v)) ? 0 : Number(v));

const DEFAULT_LABELS = ['OLX', 'Webmotors', 'MercadoLivre', 'Facebook/Instagram', 'Google Ads'];

const normalize = (s = '') => String(s || '').trim().toLowerCase();
const mapPlatformLabel = (name = '') => {
  const n = normalize(name);
  if (n.includes('olx')) return 'OLX';
  if (n.includes('webmotors')) return 'Webmotors';
  if (n.includes('mercado')) return 'MercadoLivre';
  if (n.includes('facebook') || n.includes('instagram') || n.includes('meta')) return 'Facebook/Instagram';
  if (n.includes('google')) return 'Google Ads';
  return (name || 'Anúncio').trim();
};
const mapExpenseLabel = (cat = '', desc = '') => {
  const key = `${normalize(cat)} ${normalize(desc)}`;
  if (key.includes('frete') || key.includes('transport')) return 'Frete';
  if (key.includes('lava')) return 'Lavagem';
  if (key.includes('manut') || key.includes('revis')) return 'Manutenção';
  if (key.includes('doc') || key.includes('despach')) return 'Documentos/Despachante';
  if (key.includes('laudo') || key.includes('cautel') || key.includes('ecv')) return 'Laudo Cautelar';
  if (key.includes('taxa') || key.includes('fee')) return 'Taxas';
  return cat?.trim() || 'Gastos extras';
};

const QuoteGenerator = () => {
  const [cars, setCars] = useState([]);
  const [manualVehicle, setManualVehicle] = useState(false);
  const [vehicleId, setVehicleId] = useState('');
  const [vehicleText, setVehicleText] = useState('');
  const [period, setPeriod] = useState('até vender');

  const [titleMode, setTitleMode] = useState('ads'); // ads | docs | custom
  const [customTitle, setCustomTitle] = useState('');
  const effectiveTitle = useMemo(() => {
    if (titleMode === 'ads') return 'Tabela de Custos — Anúncios e Tráfego Pago';
    if (titleMode === 'docs') return 'Documentação';
    return customTitle || 'Relatório de Custos';
  }, [titleMode, customTitle]);

  const [notes, setNotes] = useState('');

  const [items, setItems] = useState(
    DEFAULT_LABELS.map((label) => ({ id: crypto.randomUUID(), label, amount: '' }))
  );

  const total = useMemo(
    () =>
      items.reduce((acc, it) => {
        const n = Number(String(it.amount).replace(',', '.'));
        return acc + (isNaN(n) ? 0 : n);
      }, 0),
    [items]
  );

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

  const selectedCar = useMemo(
    () => (vehicleId ? (cars || []).find((c) => c.id === vehicleId) : null),
    [vehicleId, cars]
  );

  const handleItemChange = (id, field, value) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };
  const addItem = () =>
    setItems((prev) => [...prev, { id: crypto.randomUUID(), label: '', amount: '' }]);
  const removeItem = (id) => setItems((prev) => prev.filter((it) => it.id !== id));
  const duplicateItem = (id) =>
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.id === id);
      if (idx < 0) return prev;
      const dup = { ...prev[idx], id: crypto.randomUUID() };
      const clone = [...prev];
      clone.splice(idx + 1, 0, dup);
      return clone;
    });

  // PRÉ-PREENCHER — anúncios em LINHAS SEPARADAS + gastos agregados
  const preloadFromVehicle = async () => {
    const car = selectedCar;
    if (!manualVehicle && !car) {
      toast({ title: 'Selecione um veículo do estoque ou marque "Digitar manualmente".' });
      return;
    }

    if (!manualVehicle && car) {
      const name = `${car.brand || ''} ${car.model || ''} ${car.year ? `(${car.year})` : ''} ${
        car.plate ? `• ${car.plate}` : ''
      }`.trim();
      if (!vehicleText) setVehicleText(name);
    }

    let pubs = [];
    let exps = [];
    try {
      if (car?.id) {
        pubs = await getPublicationsByCar(car.id); // [{ platform_name?, title?, reference?, spent }]
        exps = await getExpensesByCar(car.id);     // [{ category, description, amount }]
      }
    } catch (e) {
      console.error('Erro ao buscar pubs/expenses:', e);
    }

    // 1) anúncios: UMA LINHA POR ANÚNCIO
    const adItems = (pubs || [])
      .map((p) => {
        const platform = mapPlatformLabel(p?.platform_name || p?.platform || p?.name);
        const labelExtra = p?.title || p?.reference || p?.listing_id || p?.id || '';
        const label =
          labelExtra && String(labelExtra).trim()
            ? `${platform} — ${String(labelExtra).trim()}`
            : platform;
        const val = Number(p?.spent || 0);
        if (!isFinite(val) || val <= 0) return null;
        return { id: crypto.randomUUID(), label, amount: String(val.toFixed(2)) };
      })
      .filter(Boolean);

    // 2) gastos: agregados por categoria legível
    const byCat = new Map();
    (exps || []).forEach((g) => {
      const label = mapExpenseLabel(g?.category, g?.description);
      const v = Number(g?.amount || g?.value || 0);
      if (!isFinite(v) || v <= 0) return;
      byCat.set(label, (byCat.get(label) || 0) + v);
    });
    const expItems = Array.from(byCat.entries()).map(([label, v]) => ({
      id: crypto.randomUUID(),
      label,
      amount: String(v.toFixed(2)),
    }));

    const merged = [...adItems, ...expItems];

    // Se não houver nada do carro, cai para labels padrão vazias
    setItems(merged.length ? merged : DEFAULT_LABELS.map((l) => ({ id: crypto.randomUUID(), label: l, amount: '' })));
    toast({ title: 'Itens carregados do veículo (editáveis).' });
  };

  const handleGenerate = async () => {
    const payload = {
      logoUrl: '/logo.png', // use sua logo pública; se não existir, só não mostra a imagem
      siteUrl: 'https://autenticcomotors.com.br',
      title: effectiveTitle,
      vehicle:
        manualVehicle || !selectedCar
          ? (vehicleText || '-')
          : `${selectedCar.brand || ''} ${selectedCar.model || ''}${selectedCar.year ? ` (${selectedCar.year})` : ''}${
              selectedCar.plate ? ` • ${selectedCar.plate}` : ''
            }`.trim(),
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
        {/* ESQUERDA */}
        <div className="space-y-4">
          <div className="border rounded-xl p-4 bg-white">
            <p className="font-semibold mb-3">Veículo</p>
            <div className="flex items-center gap-3 mb-3">
              <input
                id="manualVehicle"
                type="checkbox"
                checked={manualVehicle}
                onChange={(e) => setManualVehicle(e.target.checked)}
              />
              <label htmlFor="manualVehicle" className="text-sm">Digitar manualmente</label>
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

            <Button onClick={preloadFromVehicle} className="w-full bg-black text-white hover:bg-gray-800" type="button">
              Pré-preencher com dados do veículo
            </Button>
          </div>

          <div className="border rounded-xl p-4 bg-white">
            <p className="font-semibold mb-3">Título do documento</p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="titleMode" value="ads" checked={titleMode === 'ads'} onChange={() => setTitleMode('ads')} />
                Tabela de Custos — Anúncios e Tráfego Pago
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="titleMode" value="docs" checked={titleMode === 'docs'} onChange={() => setTitleMode('docs')} />
                Documentação
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="titleMode" value="custom" checked={titleMode === 'custom'} onChange={() => setTitleMode('custom')} />
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

          <div className="border rounded-xl p-4 bg-white">
            <p className="font-semibold mb-2">Período</p>
            <input
              className="w-full border rounded-md p-2"
              placeholder='até vender (ou edite: "27/08/2025 a 14/10/2025")'
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Deixe como “até vender” ou edite manualmente.</p>
          </div>

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

        {/* DIREITA */}
        <div className="border rounded-xl p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold">Itens do orçamento</p>
            <Button type="button" onClick={addItem} className="bg-yellow-400 text-black hover:bg-yellow-500 h-8 px-2 py-1 text-xs">
              <Plus className="h-4 w-4 mr-1" /> Adicionar item
            </Button>
          </div>

          <div className="grid grid-cols-[1fr,140px,92px] gap-2 items-center text-xs font-semibold text-gray-600 mb-2">
            <div>Item</div>
            <div>Preço (R$)</div>
            <div className="text-right">Ações</div>
          </div>

          <div className="space-y-2">
            {items.map((it) => (
              <div key={it.id} className="grid grid-cols-[1fr,140px,92px] gap-2 items-center">
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
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    title="Duplicar"
                    onClick={() => duplicateItem(it.id)}
                    className="h-8 w-8 inline-flex items-center justify-center rounded border bg-gray-100 hover:bg-gray-200"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Excluir"
                    onClick={() => removeItem(it.id)}
                    className="h-8 w-8 inline-flex items-center justify-center rounded border bg-red-500 text-white hover:bg-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div />
            <div className="text-right">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-2xl font-extrabold">{currencyBR(total)}</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={handleGenerate} className="bg-yellow-400 text-black hover:bg-yellow-500" type="button">
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

