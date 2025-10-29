// src/lib/fipe-api.js
// Busca determinística por Marca + Modelo + (Versão) + Ano + Combustível.
// Sem fallback “pro ano mais próximo”. Evita tokens de 1 letra (ex.: "S").
// Se não achar combinação exata (ano+combustível) dentro do modelo escolhido, retorna null.

const BASE = 'https://parallelum.com.br/fipe/api/v1';

const normalize = (s = '') =>
  String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

// tokens >= 2 chars; remove “palavras vazias” comuns
const STOP = new Set(['de','da','do','e','com','para','por','the','and']);
const tokenize = (s = '') =>
  normalize(s)
    .split(' ')
    .filter(t => t && t.length >= 2 && !STOP.has(t));

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

// normaliza combustível
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

// regra: TODOS os tokens de modelo+versão devem existir no nome FIPE (subset)
// (ignorando tokens muito curtos, o que já filtramos acima)
const containsAllTokens = (candidateName, requiredTokens) => {
  const candTokens = new Set(tokenize(candidateName));
  return requiredTokens.every(t => candTokens.has(t));
};

// função principal
export const getFipeValue = async ({
  brand,
  model,
  year,
  fuel,
  version = '',      // <<< novo: versão ajuda a cravar modelo certo (ex.: "S 3.0 V6 PDK 4WD")
  vehicleType = 'carros' // 'carros' | 'motos' | 'caminhoes'
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

    debug.push(`Entrada: brand="${inputBrand}", model="${inputModel}", version="${inputVersion}", year=${yearStr}, fuel="${fuelTok}", type=${vehicleType}`);

    // 1) marca
    const brandsRes = await fetch(`${BASE}/${vehicleType}/marcas`);
    const brands = await brandsRes.json();
    const normBrand = normalize(inputBrand);

    let brandMatch =
      brands.find(b => normalize(b.nome) === normBrand) ||
      brands.find(b => normalize(b.nome).includes(normBrand) || normBrand.includes(normalize(b.nome))) ||
      null;

    if (!brandMatch) {
      // fallback um pouco fuzzy, mas alto
      let best = null, bestScore = 0;
      for (const b of brands) {
        const score = levRatio(normalize(b.nome), normBrand);
        if (score > bestScore) { best = b; bestScore = score; }
      }
      if (bestScore >= 0.9) brandMatch = best; // exigente
    }

    if (!brandMatch) {
      debug.push(`Marca não encontrada: ${inputBrand}`);
      return { value: null, raw: null, debug };
    }
    debug.push(`Marca: ${brandMatch.nome} (codigo=${brandMatch.codigo})`);
    const brandId = brandMatch.codigo;

    // 2) modelos
    const modelsRes = await fetch(`${BASE}/${vehicleType}/marcas/${brandId}/modelos`);
    const modelsObj = await modelsRes.json();
    const modelos = Array.isArray(modelsObj) ? modelsObj : (modelsObj.modelos || []);
    debug.push(`Modelos carregados: ${modelos.length}`);

    // tokens de cravação = modelo + versão
    const requiredTokens = [...tokenize(inputModel), ...tokenize(inputVersion)];
    // se só tiver “macan” e “s”, “s” cai fora por ter 1 char. bom.

    // primeiro: filtro estrito (todos tokens precisam existir no nome do FIPE)
    let strict = modelos.filter(m => containsAllTokens(m.nome || '', requiredTokens));

    // se o strict zerar (ex.: não tem "versão" no cadastro do carro), cai para filtro por modelo apenas
    if (strict.length === 0) {
      const onlyModelTokens = tokenize(inputModel);
      strict = modelos.filter(m => containsAllTokens(m.nome || '', onlyModelTokens));
    }

    // se ainda assim ficar vazio, como última chance (sem quebrar), usa top por similaridade MAS ainda exigindo que contenha o nome base do modelo
    if (strict.length === 0) {
      const nmModel = normalize(inputModel);
      const candidates = modelos
        .filter(m => normalize(m.nome || '').includes(nmModel)) // precisa conter o nome base
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

    // 3) dentro de cada modelo compatível, procurar ANO + COMBUSTÍVEL
    const pickByYearAndFuel = async (m) => {
      const mid = m.codigo;
      const yearsRes = await fetch(`${BASE}/${vehicleType}/marcas/${brandId}/modelos/${mid}/anos`);
      const years = await yearsRes.json();
      if (!Array.isArray(years)) return null;

      // match EXATO por ano e combustível (quando fuelTok informado)
      const exact = years.find(y => {
        const n = normalize(y.nome || '');
        const hasYear = n.includes(yearStr);
        const hasFuel = fuelTok ? n.includes(fuelTok) : true;
        return hasYear && hasFuel;
      });
      if (exact) return { yearMatch: exact, model: m };

      // se não informou combustível no cadastro, aceita só ano
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

    // 4) preço FIPE para o par modelo/ano
    const modelId = chosen.model.codigo;
    const yearCode = chosen.yearMatch.codigo;
    debug.push(`Modelo escolhido: "${chosen.model.nome}" | YearCode="${chosen.yearMatch.nome}"`);

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

// alias compat
export const fetchFipeForVehicle = getFipeValue;

