// src/pages/QuoteGenerator.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import {
  getCars,
  getPublicationsByCar,
  getExpensesByCar,
  getPlatforms,
} from '@/lib/car-api';
import { openQuotePrint } from '@/lib/quote-print';

const Money = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(Number(v || 0));

const normalize = (s = '') => String(s || '').toLowerCase();

const GROUP_IS_AD = (platformName = '') => {
  const n = normalize(platformName);
  return (
    n.includes('olx') ||
    n.includes('webmotors') ||
    n.includes('mercado') ||
    n.includes('icarros') ||
    n.includes('usados') ||
    n.includes('market')
  );
};

const DEFAULT_DOC_LINES = [
  { label: 'Pesquisa de débitos', amount: '' },
  { label: 'Laudo Cautelar', amount: '' },
  { label: 'Laudo ECV', amount: '' },
  { label: 'Taxa de transferência', amount: '' },
  { label: 'Despachante', amount: '' },
  { label: 'Logística / Frete', amount: '' },
];

const GuessTrafficBucket = (s = '') => {
  const n = normalize(s);
  if (n.includes('google')) return 'Google Ads';
  if (n.includes('facebook') || n.includes('instagram') || n.includes('meta')) {
    return 'Facebook/Instagram';
  }
  return null;
};

const QuoteGenerator = () => {
  const [loading, setLoading] = useState(false);

  // Dados base
  const [cars, setCars] = useState([]);
  const [platforms, setPlatforms] = useState([]);

  // Veículo (dropdown) OU manual
  const [useManualVehicle, setUseManualVehicle] = useState(false);
  const [selectedCarId, setSelectedCarId] = useState('');
  const [manualVehicle, setManualVehicle] = useState('');

  // Título
  const [titleMode, setTitleMode] = useState('ads'); // 'ads' | 'docs' | 'custom'
  const [customTitle, setCustomTitle] = useState('');

  // Período (pré "até vender")
  const [periodText, setPeriodText] = useState('até vender');

  // Itens do orçamento
  const [items, setItems] = useState([
    // { label:'', amount:'' }
  ]);

  // Observações (opcional)
  const [notes, setNotes] = useState('');

  // Carregado de pubs/expenses quando seleciona veículo
  const total = useMemo(
    () =>
      items.reduce((acc, it) => {
        const v = Number(
          String(it.amount || '').replace('.', '').replace(',', '.'),
        );
        return acc + (isFinite(v) ? v : 0);
      }, 0),
    [items],
  );

  // Carrega base
  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const [carsRes, platformsRes] = await Promise.all([
          getCars({ includeSold: true }),
          getPlatforms(),
        ]);
        setCars(carsRes || []);
        setPlatforms(platformsRes || []);
      } catch (e) {
        console.error(e);
        toast({
          title: 'Erro ao carregar dados',
          description: e.message || String(e),
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  // Troca de preset: preenche linhas padrão de Documentação
  useEffect(() => {
    if (titleMode === 'docs') {
      setItems([...DEFAULT_DOC_LINES]);
    }
    if (titleMode === 'ads') {
      // ao alternar para ADS, não mexe nos itens ainda; o botão "Pré-preencher" faz isso
      if (items.length === 0) {
        setItems([
          { label: 'Facebook/Instagram', amount: '' },
          { label: 'Google Ads', amount: '' },
        ]);
      }
    }
  }, [titleMode]); // eslint-disable-line

  const selectedCar = useMemo(
    () => (cars || []).find((c) => String(c.id) === String(selectedCarId)) || null,
    [cars, selectedCarId],
  );

  const handleAddItem = () => {
    setItems((prev) => [...prev, { label: '', amount: '' }]);
  };

  const handleDupItem = (idx) => {
    setItems((prev) => {
      const at = prev[idx];
      if (!at) return prev;
      const copy = { ...at };
      const arr = [...prev];
      arr.splice(idx + 1, 0, copy);
      return arr;
    });
  };

  const handleDelItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleChangeItem = (idx, patch) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const handlePrefillFromData = async () => {
    if (!selectedCar && !useManualVehicle) {
      toast({
        title: 'Selecione um veículo',
        description: 'Ou alterne para “Digitar manualmente”.',
      });
      return;
    }
    if (!selectedCar && useManualVehicle) {
      // Modo manual: só garante linhas iniciais de tráfego
      setItems([
        { label: 'Facebook/Instagram', amount: '' },
        { label: 'Google Ads', amount: '' },
      ]);
      toast({ title: 'Linhas de tráfego adicionadas (editáveis).' });
      return;
    }

    try {
      setLoading(true);

      const [pubs, exps] = await Promise.all([
        getPublicationsByCar(selectedCar.id),
        getExpensesByCar(selectedCar.id),
      ]);

      // 1) Publicações (anúncios) -> somar por plataforma “de anúncio”
      const pubsByPlatform = {};
      (pubs || []).forEach((p) => {
        const pf = (platforms || []).find((pl) => pl.id === p.platform_id);
        const name = pf?.name || 'Outro';
        if (!GROUP_IS_AD(name)) return; // só marketplaces/anúncios
        const spent = Number(p.spent || 0);
        if (!pubsByPlatform[name]) pubsByPlatform[name] = 0;
        pubsByPlatform[name] += isFinite(spent) ? spent : 0;
      });

      // 2) Gastos -> buckets de tráfego e outros custos relevantes
      let trafficBuckets = { 'Facebook/Instagram': 0, 'Google Ads': 0 };
      const otherCosts = {}; // ex.: lavagem, frete, manutenção etc.

      (exps || []).forEach((e) => {
        const cat = e.category || '';
        const desc = e.description || '';
        const bucket = GuessTrafficBucket(`${cat} ${desc}`);
        const val = Number(e.amount || 0);
        if (bucket) {
          trafficBuckets[bucket] += isFinite(val) ? val : 0;
          return;
        }
        // tenta agrupar “outros” por palavras-chave simples
        const n = normalize(`${cat} ${desc}`);
        let key = null;
        if (n.includes('lavag')) key = 'Lavagem';
        else if (n.includes('frete') || n.includes('logist')) key = 'Logística / Frete';
        else if (n.includes('laudo') && n.includes('ecv')) key = 'Laudo ECV';
        else if (n.includes('laudo')) key = 'Laudo Cautelar';
        else if (n.includes('manuten') || n.includes('oficina')) key = 'Manutenção';
        else if (n.includes('despach')) key = 'Despachante';
        else if (n.includes('taxa') || n.includes('tarifa')) key = 'Taxas';
        if (!key) return;
        if (!otherCosts[key]) otherCosts[key] = 0;
        otherCosts[key] += isFinite(val) ? val : 0;
      });

      // Monta array de itens (editável)
      const next = [];

      // Período textual já está no topo (“até vender” editável), não entra como item.

      // Anúncios por plataforma
      Object.entries(pubsByPlatform).forEach(([name, val]) => {
        next.push({ label: String(name), amount: String(val.toFixed(2)).replace('.', ',') });
      });

      // Tráfego
      Object.entries(trafficBuckets).forEach(([name, val]) => {
        if (val > 0) {
          next.push({ label: name, amount: String(val.toFixed(2)).replace('.', ',') });
        } else {
          // ainda assim incluir as linhas pré-preenchidas (valor em branco) para edição
          next.push({ label: name, amount: '' });
        }
      });

      // Outros custos mapeados por keywords
      Object.entries(otherCosts).forEach(([name, val]) => {
        next.push({ label: name, amount: String(val.toFixed(2)).replace('.', ',') });
      });

      // Se preset “Documentação”, substitui pelas linhas padrão (você pode alternar depois)
      if (titleMode === 'docs') {
        setItems([...DEFAULT_DOC_LINES]);
      } else {
        setItems(next.length ? next : [{ label: 'Facebook/Instagram', amount: '' }, { label: 'Google Ads', amount: '' }]);
      }

      toast({ title: 'Itens carregados do veículo (editáveis).' });
    } catch (e) {
      console.error(e);
      toast({
        title: 'Erro ao pré-preencher',
        description: e.message || String(e),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resolvedTitle = useMemo(() => {
    if (titleMode === 'ads') return 'Tabela de Custos — Anúncios e Tráfego Pago';
    if (titleMode === 'docs') return 'Documentação';
    return customTitle || 'Orçamento';
  }, [titleMode, customTitle]);

  const resolvedVehicleLabel = useMemo(() => {
    if (useManualVehicle) return manualVehicle || '';
    if (!selectedCar) return '';
    const parts = [
      selectedCar.brand,
      selectedCar.model,
      selectedCar.year ? `• ${selectedCar.year}` : '',
      selectedCar.plate ? `• Placa: ${selectedCar.plate}` : '',
    ].filter(Boolean);
    return parts.join(' ');
  }, [useManualVehicle, manualVehicle, selectedCar]);

  const handleGenerate = () => {
    if (!resolvedTitle?.trim()) {
      toast({ title: 'Defina um título para o documento.' });
      return;
    }
    if (!resolvedVehicleLabel?.trim()) {
      toast({ title: 'Informe o veículo (selecione ou digite manualmente).' });
      return;
    }
    if (!items.length) {
      toast({ title: 'Inclua pelo menos um item.' });
      return;
    }

    const doc = {
      title: resolvedTitle,
      vehicle: resolvedVehicleLabel,
      periodText: periodText || '',
      items: items.map((it) => ({
        label: String(it.label || '').trim(),
        amountNumber: Number(String(it.amount || '').replace('.', '').replace(',', '.')) || 0,
      })),
      total,
      // Cabeçalho/Rodapé
      brand: 'AutenTicco Motors',
      site: 'www.autenticcomotors.com',
      whatsapp: '(11) 97507-1300',
      instagram: '@autenticcomotors',
      // ID + data
      docId: `#${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`,
      dateBR: new Date().toLocaleDateString('pt-BR'),
    };

    openQuotePrint(doc);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Gerar Orçamento • AutenTicco Motors</title>
      </Helmet>

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
            Gerar Orçamento / Relatório de Custos
          </h1>
          <Button
            onClick={handleGenerate}
            className="bg-yellow-400 text-black hover:bg-yellow-500 font-bold"
            disabled={loading}
          >
            GERAR DOCUMENTO
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna esquerda: Configurações */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow border p-4">
              <p className="text-sm font-semibold mb-3">Veículo</p>

              <div className="flex items-center gap-2 mb-3">
                <input
                  id="useManual"
                  type="checkbox"
                  checked={useManualVehicle}
                  onChange={(e) => setUseManualVehicle(e.target.checked)}
                />
                <label htmlFor="useManual" className="text-sm">
                  Digitar manualmente
                </label>
              </div>

              {!useManualVehicle ? (
                <div className="space-y-2">
                  <select
                    value={selectedCarId}
                    onChange={(e) => setSelectedCarId(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">Selecione um veículo</option>
                    {(cars || []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.brand} {c.model} {c.year ? `• ${c.year}` : ''}{' '}
                        {c.plate ? `• ${c.plate}` : ''}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={handlePrefillFromData}
                    className="w-full bg-gray-900 text-white hover:bg-black"
                    disabled={!selectedCarId || loading}
                  >
                    Pré-preencher com dados do veículo
                  </Button>
                </div>
              ) : (
                <input
                  value={manualVehicle}
                  onChange={(e) => setManualVehicle(e.target.value)}
                  placeholder="Ex.: Nissan Kicks 2022 • Placa ABC1D23"
                  className="w-full border rounded-lg px-3 py-2"
                />
              )}
            </div>

            <div className="bg-white rounded-2xl shadow border p-4">
              <p className="text-sm font-semibold mb-3">Título do documento</p>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="titleMode"
                    checked={titleMode === 'ads'}
                    onChange={() => setTitleMode('ads')}
                  />
                  Tabela de Custos — Anúncios e Tráfego Pago
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="titleMode"
                    checked={titleMode === 'docs'}
                    onChange={() => setTitleMode('docs')}
                  />
                  Documentação
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="titleMode"
                    checked={titleMode === 'custom'}
                    onChange={() => setTitleMode('custom')}
                  />
                  Personalizado
                </label>
                {titleMode === 'custom' && (
                  <input
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Digite o título"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow border p-4">
              <p className="text-sm font-semibold mb-3">Período</p>
              <input
                value={periodText}
                onChange={(e) => setPeriodText(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="até vender"
              />
              <p className="text-xs text-gray-500 mt-2">
                Deixe como “até vender” ou edite manualmente (ex.: 27/08/2025 a 14/10/2025).
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow border p-4">
              <p className="text-sm font-semibold mb-3">Observações (opcional)</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Ex.: Valores referentes ao período informado. Cotações sujeitas a atualização."
              />
            </div>
          </div>

          {/* Coluna direita: Itens + Total */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow border p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Itens do orçamento</h2>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddItem}
                    className="bg-yellow-400 text-black hover:bg-yellow-500"
                  >
                    + Adicionar item
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg divide-y">
                {items.length === 0 && (
                  <p className="p-4 text-sm text-gray-500">Sem itens ainda.</p>
                )}
                {items.map((it, idx) => (
                  <div key={idx} className="p-3 grid grid-cols-12 gap-2">
                    <input
                      value={it.label}
                      onChange={(e) =>
                        handleChangeItem(idx, { label: e.target.value })
                      }
                      className="col-span-7 md:col-span-8 border rounded-lg px-3 py-2"
                      placeholder="Descrição (ex.: Webmotors, Facebook/Instagram, Despachante...)"
                    />
                    <input
                      value={it.amount}
                      onChange={(e) =>
                        handleChangeItem(idx, { amount: e.target.value })
                      }
                      className="col-span-3 md:col-span-2 border rounded-lg px-3 py-2 text-right"
                      placeholder="0,00"
                    />
                    <div className="col-span-2 flex justify-end gap-2">
                      <Button
                        onClick={() => handleDupItem(idx)}
                        className="bg-gray-100 text-gray-800 hover:bg-gray-200"
                      >
                        Duplicar
                      </Button>
                      <Button
                        onClick={() => handleDelItem(idx)}
                        className="bg-red-500 text-white hover:bg-red-600"
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-end">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-2xl font-extrabold">{Money(total)}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end">
              <Button
                onClick={handleGenerate}
                className="bg-yellow-400 text-black hover:bg-yellow-500 font-bold"
                disabled={loading}
              >
                GERAR DOCUMENTO
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteGenerator;

