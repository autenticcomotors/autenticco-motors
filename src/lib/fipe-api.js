// src/lib/fipe-api.js
// Busca determinística por Marca + Modelo + (Versão) + Ano + Combustível,
// com compat extra para "Flex" (Gasolina/Álcool/Etanol) e token "S" da Porsche.

const BASE = 'https://parallelum.com.br/fipe/api/v1';

const normalize = (s = '') =>
  String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const STOP = new Set(['de','da','do','e','com','para','por','the','and']);

const tokenize = (s = '', { allowSingles = false } = {}) =>
  normalize(s)
    .split(' ')
    .filter(t => t && !STOP.has(t) && (allowSingles ? t.length >= 1 : t.length >= 2));

const levenshtein = (a, b) => {
  a = String(a || ''); b = String(b || '');
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const v0 = new Array(n + 1), v1 = new Array(n + 1);
  for (let j = 0; j <= n; j++) v0[j] = j;
  for (let i = 0; i < m; i++) {
    v1[0] = i + 1;
    for (let j = 0; j < n; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    for (let j = 0; j <= n; j++) v0[j] = v1[j];
  }
  return v1[n];
};

const levRatio = (a, b) => {
  const d = levenshtein(a, b);
  const max = Math.max(String(a).length, String(b).length, 1);
  return 1 - d / max;
};

const parseValueString = (valorStr) => {
  if (!valorStr) return null;
  const cleaned = String(valorStr).replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

const fuelTokenFor = (fuel) => {
  if (!fuel) return '';
  const n = normalize(fuel);
  if (n.includes('flex')) return 'flex';
  if (n.includes('gas')) return 'gasolina';
  if (n.includes('alcool') || n.includes('etanol')) return 'alcool';
  if (n.includes('diesel')) return 'diesel';
  if (n.includes('eletr') || n.includes('electric')) return 'eletrico';
  if (n.includes('hibrid')) return 'hibrido';
  return n.split(' ')[0] || n;
};

// Combustível: trata "flex" como Gasolina/Álcool/Etanol também
const matchFuel = (yearNameNorm, fuelTok) => {
  if (!fuelTok) return true;
  if (fuelTok === 'flex') {
    if (yearNameNorm.includes('flex')) return true;
    const hasGas = yearNameNorm.includes('gasolina');
    const hasAlc = yearNameNorm.includes('alcool') || yearNameNorm.includes('etanol');
    if (hasGas && hasAlc) return true;
    // alguns retornam "bicombustivel"
    if (yearNameNorm.includes('bi combustivel') || yearNameNorm.includes('bicombustivel')) return true;
    return false;
  }
  return yearNameNorm.includes(fuelTok);
};

const containsAllTokens = (candidateName, requiredTokens, { allowSingles = false } = {}) => {
  const candTokens = new Set(tokenize(candidateName, { allowSingles }));
  return requiredTokens.every(t => candTokens.has(t));
};

export const getFipeValue = async ({
  brand,
  model,
  year,
  fuel,
  version = '',
  vehicleType = 'carros'
} = {}) => {
  const debug = [];
  try {
    if (!brand || !model || !year) {
      debug.push('Parâmetros insuficientes: brand/model/year são obrigatórios.');
      return { value: null, raw: null, debug };
    }

    // Entrada
    const inputBrand = String(brand || '');
    const inputModel = String(model || '');
    const inputVersion = String(version || '');
    const yearStr = String(year);
    const fuelTok = fuelTokenFor(fuel);

    const brandNorm = normalize(inputBrand);
    const allowSingleLetterTokens = (brandNorm === 'porsche'); // aceita "S"

    debug.push(`Entrada: brand="${inputBrand}", model="${inputModel}", version="${inputVersion}", year=${yearStr}, fuel="${fuelTok}", type=${vehicleType}`);

    // 1) Marca
    const brandsRes = await fetch(`${BASE}/${vehicleType}/marcas`);
    const brands = await brandsRes.json();

    let brandMatch =
      brands.find(b => normalize(b.nome) === brandNorm) ||
      brands.find(b => normalize(b.nome).includes(brandNorm) || brandNorm.includes(normalize(b.nome))) ||
      null;

    if (!brandMatch) {
      let best = null, bestScore = 0;
      for (const b of brands) {
        const score = levRatio(normalize(b.nome), brandNorm);
        if (score > bestScore) { best = b; bestScore = score; }
      }
      if (bestScore >= 0.9) brandMatch = best;
    }
    if (!brandMatch) {
      debug.push(`Marca não encontrada: ${inputBrand}`);
      return { value: null, raw: null, debug };
    }
    const brandId = brandMatch.codigo;
    debug.push(`Marca: ${brandMatch.nome} (codigo=${brandId})`);

    // 2) Modelos
    const modelsRes = await fetch(`${BASE}/${vehicleType}/marcas/${brandId}/modelos`);
    const modelsObj = await modelsRes.json();
    const modelos = Array.isArray(modelsObj) ? modelsObj : (modelsObj.modelos || []);
    debug.push(`Modelos carregados: ${modelos.length}`);

    // tokens obrigatórios (modelo + versão se vier junto no mesmo campo também pega)
    const reqTokens = [
      ...tokenize(inputModel,   { allowSingles: allowSingleLetterTokens }),
      ...tokenize(inputVersion, { allowSingles: allowSingleLetterTokens })
    ];

    // Filtro estrito por tokens
    let strict = modelos.filter(m =>
      containsAllTokens(m.nome || '', reqTokens, { allowSingles: allowSingleLetterTokens })
    );

    // Fallback rankeado por similaridade (pega top 6 mais parecidos)
    if (strict.length === 0) {
      const needle = normalize(`${inputModel} ${inputVersion}`.trim());
      const ranked = modelos
        .map(m => ({ m, score: levRatio(normalize(m.nome || ''), needle) }))
        .sort((a,b) => b.score - a.score)
        .slice(0, 6)
        .map(x => x.m);
      strict = ranked;
    }

    if (strict.length === 0) {
      debug.push('Nenhum modelo compatível (após filtros).');
      return { value: null, raw: null, debug };
    }

    debug.push(`Modelos pós-filtro: ${strict.map(s => s.nome).join(' | ')}`);

    // 3) Dentro de cada modelo, exigir ANO + COMBUSTÍVEL
    const pickByYearAndFuel = async (m) => {
      const mid = m.codigo;
      const yearsRes = await fetch(`${BASE}/${vehicleType}/marcas/${brandId}/modelos/${mid}/anos`);
      const years = await yearsRes.json();
      if (!Array.isArray(years)) return null;

      const exact = years.find(y => {
        const n = normalize(y.nome || '');
        const hasYear = n.includes(yearStr);
        const okFuel = matchFuel(n, fuelTok);
        return hasYear && okFuel;
      });
      if (exact) return { yearMatch: exact, model: m };

      // se não informou combustível, deixa cair num match apenas por ano
      if (!fuelTok) {
        const onlyYear = years.find(y => normalize(y.nome || '').includes(yearStr));
        if (onlyYear) return { yearMatch: onlyYear, model: m };
      }
      return null;
    };

    let chosen = null;
    for (const m of strict) {
      const res = await pickByYearAndFuel(m);
      if (res) { chosen = res; break; }
    }

    if (!chosen) {
      debug.push('Não encontrou ANO+COMBUSTÍVEL dentro dos modelos filtrados.');
      return { value: null, raw: null, debug };
    }

    // 4) Preço
    const modelId = chosen.model.codigo;
    const yearCode = chosen.yearMatch.codigo;

    const priceRes = await fetch(`${BASE}/${vehicleType}/marcas/${brandId}/modelos/${modelId}/anos/${encodeURIComponent(yearCode)}`);
    const priceObj = await priceRes.json();
    const value = parseValueString(priceObj.Valor || priceObj.valor || priceObj.Valor);

    if (!value) {
      debug.push('Erro ao parsear valor FIPE.');
      return { value: null, raw: priceObj, debug };
    }

    debug.push(`Valor FIPE: ${value}`);
    return { value, raw: priceObj, debug };
  } catch (err) {
    return { value: null, raw: null, debug: ['Erro: ' + String(err)] };
  }
};

// compat antigo
export const fetchFipeForVehicle = getFipeValue;

