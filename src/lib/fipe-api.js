// src/lib/fipe-api.js
// Busca determinística por Marca + Modelo + (Versão) + Ano + Combustível.
// Regra especial para Porsche: permite token de 1 letra "S" (ex.: "Macan S").
// Sem fallback para outro ano/versão. Se não casar, retorna null.

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

// tokenizador com opção de manter tokens de 1 letra
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

// todos tokens requeridos precisam estar no nome FIPE
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

    const inputBrand = String(brand || '');
    const inputModel = String(model || '');
    const inputVersion = String(version || '');
    const yearStr = String(year);
    const fuelTok = fuelTokenFor(fuel);

    const brandNorm = normalize(inputBrand);
    const allowSingleLetterTokens =
      brandNorm === 'porsche'; // habilita aceitar "s" como token válido

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

    // tokens obrigatórios = modelo + versão (se houver)
    const reqTokens = [
      ...tokenize(inputModel, { allowSingles: allowSingleLetterTokens }),
      ...tokenize(inputVersion, { allowSingles: allowSingleLetterTokens })
    ];
    // se versão vier vazia, usa só os do modelo (ok para "Macan S" porque manteremos o "s" quando Porsche)
    if (reqTokens.length === 0) {
      reqTokens.push(...tokenize(inputModel, { allowSingles: allowSingleLetterTokens }));
    }

    // filtro estrito: candidato precisa conter TODOS os tokens
    let strict = modelos.filter(m =>
      containsAllTokens(m.nome || '', reqTokens, { allowSingles: allowSingleLetterTokens })
    );

    // fallback leve: se vazio, exige ao menos conter o nome base do modelo e escolhe top 3 por similaridade
    if (strict.length === 0) {
      const nmModel = normalize(inputModel);
      const candidates = modelos
        .filter(m => normalize(m.nome || '').includes(nmModel))
        .map(m => ({
          m,
          score: levRatio(normalize(m.nome || ''), normalize(`${inputModel} ${inputVersion}`.trim()))
        }))
        .sort((a,b) => b.score - a.score);
      strict = candidates.slice(0, 3).map(c => c.m);
    }

    if (strict.length === 0) {
      debug.push('Nenhum modelo compatível (após filtros).');
      return { value: null, raw: null, debug };
    }

    debug.push(`Modelos pós-filtro: ${strict.map(s => s.nome).join(' | ')}`);

    // 3) Dentro de cada modelo, exigir ANO + (COMBUSTÍVEL se informado)
    const pickByYearAndFuel = async (m) => {
      const mid = m.codigo;
      const yearsRes = await fetch(`${BASE}/${vehicleType}/marcas/${brandId}/modelos/${mid}/anos`);
      const years = await yearsRes.json();
      if (!Array.isArray(years)) return null;

      const exact = years.find(y => {
        const n = normalize(y.nome || '');
        const hasYear = n.includes(yearStr);
        const hasFuel = fuelTok ? n.includes(fuelTok) : true;
        return hasYear && hasFuel;
      });
      if (exact) return { yearMatch: exact, model: m };

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

// compat
export const fetchFipeForVehicle = getFipeValue;

