// src/lib/fipe-api.js
// Versão melhorada: fuzzy + token overlap + aliases + debug detalhado
const BASE = 'https://parallelum.com.br/fipe/api/v1';

const BRAND_ALIASES = {
  // atalhos comuns — adicione conforme precisar
  vw: 'volkswagen',
  'volks wag': 'volkswagen',
  mercedes: 'mercedes-benz',
  mb: 'mercedes-benz',
  fiat: 'fiat',
  chevrolet: 'chevrolet',
  gm: 'chevrolet',
  'peugeot': 'peugeot',
  citroen: 'citroen',
  'bmw': 'bmw',
  'mini': 'mini'
};

const normalize = (s = '') =>
  String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const tokenize = (s = '') =>
  normalize(s).split(' ').filter(Boolean);

// remove tokens que atrapalham correspondência
const stripModelTokens = (model) => {
  if (!model) return model;
  const tokens = [
    'lx','ex','advance','sport','sle','lt','ltz','lxi','tsi','gti','gt','sedan','hatch',
    'automatico','automático','aut','manual','flex','2.0','1.6','2.4','1.8','1.0','4x2','4x4',
    'touring','style','limited','edition','premium','comfort','plus','1.4','1.2','1.3','1.5'
  ];
  let m = model;
  tokens.forEach(t => {
    const re = new RegExp(`\\b${t}\\b`, 'ig');
    m = m.replace(re, ' ');
  });
  return m.replace(/\s+/g, ' ').trim();
};

// Levenshtein distance
const levenshtein = (a, b) => {
  a = String(a || '');
  b = String(b || '');
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const v0 = new Array(n + 1);
  const v1 = new Array(n + 1);
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

// similarity ratio (0..1) via levenshtein normalized by max length
const levRatio = (a, b) => {
  const d = levenshtein(a, b);
  const max = Math.max(String(a).length, String(b).length, 1);
  return 1 - d / max;
};

const parseValueString = (valorStr) => {
  if (!valorStr) return null;
  const cleaned = valorStr.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

const getBrandAlias = (b) => {
  if (!b) return b;
  const n = normalize(b);
  if (BRAND_ALIASES[n]) return BRAND_ALIASES[n];
  return b;
};

export const getFipeValue = async ({ brand, model, year, fuel } = {}) => {
  const debug = [];
  try {
    if (!brand || !model || !year) {
      debug.push('Parâmetros insuficientes (brand/model/year).');
      return { value: null, raw: null, debug };
    }

    // normalizações iniciais
    const inputBrand = String(brand || '');
    const inputModel = String(model || '');
    const normBrand = normalize(getBrandAlias(inputBrand));
    const normModel = normalize(inputModel);
    const strippedModel = normalize(stripModelTokens(inputModel));
    debug.push(`Entrada normalizada: brand="${normBrand}" model="${normModel}" stripped="${strippedModel}" year=${year}`);

    // 1) marcas
    const brandsRes = await fetch(`${BASE}/carros/marcas`);
    const brands = await brandsRes.json();
    debug.push(`Marcas carregadas: ${brands.length}`);

    // procurar marca por igualdade -> includes -> alias startsWith -> fuzzy by levRatio
    let brandMatch = brands.find(b => normalize(b.nome) === normBrand);
    if (!brandMatch) brandMatch = brands.find(b => normalize(b.nome).includes(normBrand) || normBrand.includes(normalize(b.nome)));
    if (!brandMatch) {
      brandMatch = brands.find(b => normalize(b.nome).startsWith(normBrand.slice(0,3)));
    }
    if (!brandMatch) {
      // tentar por similaridade (lev)
      let best = null, bestScore = 0;
      for (const b of brands) {
        const score = levRatio(normalize(b.nome), normBrand);
        if (score > bestScore) { best = b; bestScore = score; }
      }
      if (bestScore >= 0.7) brandMatch = best;
    }
    if (!brandMatch) {
      debug.push(`Marca não encontrada: ${inputBrand}`);
      return { value: null, raw: null, debug };
    }
    const brandId = brandMatch.codigo;
    debug.push(`Marca: ${brandMatch.nome} (id=${brandId})`);

    // 2) modelos
    const modelsRes = await fetch(`${BASE}/carros/marcas/${brandId}/modelos`);
    const modelsObj = await modelsRes.json();
    const modelos = Array.isArray(modelsObj) ? modelsObj : (modelsObj.modelos || []);
    debug.push(`Modelos da marca: ${modelos.length}`);

    // list de candidatos com pontuação
    const candidates = [];
    const inputTokens = tokenize(normModel);
    const inputStrippedTokens = tokenize(strippedModel);

    for (const m of modelos) {
      const mName = m.nome || '';
      const normM = normalize(mName);
      const strippedM = normalize(stripModelTokens(mName));

      // token overlap (quantidade de tokens em comum / total tokens)
      const tokensM = tokenize(normM);
      const overlap = tokensM.filter(t => inputTokens.includes(t)).length;
      const overlapStripped = tokenize(strippedM).filter(t => inputStrippedTokens.includes(t)).length;
      const overlapScore = Math.max(overlap / Math.max(tokensM.length,1), overlapStripped / Math.max(tokenize(strippedM).length,1));

      // levenshtein ratios (original and stripped)
      const lev1 = levRatio(normM, normModel);
      const lev2 = levRatio(strippedM, strippedModel);

      // final score: combinação ponderada (overlap muito importante)
      const score = (overlapScore * 0.55) + (Math.max(lev1, lev2) * 0.45);

      candidates.push({ modelo: m, score, normM, strippedM, overlapScore, lev1, lev2 });
    }

    // ordenar por score decrescente
    candidates.sort((a,b) => b.score - a.score);

    // registrar top candidates para debug
    debug.push('Top modelos candidatos:');
    candidates.slice(0,6).forEach((c, idx) => {
      debug.push(`${idx+1}. "${c.modelo.nome}" score=${c.score.toFixed(3)} overlap=${c.overlapScore.toFixed(3)} lev1=${c.lev1.toFixed(3)} lev2=${c.lev2.toFixed(3)}`);
    });

    // tentativa 1: candidato exato (score muito alto)
    let modelMatch = null;
    if (candidates.length > 0 && candidates[0].score >= 0.75) {
      modelMatch = candidates[0].modelo;
      debug.push(`Escolhido por score alto: ${modelMatch.nome} (score ${candidates[0].score.toFixed(3)})`);
    } else {
      // tentativa 2: equals / includes direto
      modelMatch = modelos.find(m => normalize(m.nome) === normModel);
      if (!modelMatch) modelMatch = modelos.find(m => normalize(m.nome).includes(normModel) || normModel.includes(normalize(m.nome)));
      if (!modelMatch) {
        modelMatch = modelos.find(m => normalize(stripModelTokens(m.nome)).includes(strippedModel) || strippedModel.includes(normalize(stripModelTokens(m.nome))));
      }
      if (!modelMatch && candidates.length > 0) {
        // pegar o melhor candidato mesmo que score menor (mas só se tiver some overlap)
        if (candidates[0].score >= 0.45) {
          modelMatch = candidates[0].modelo;
          debug.push(`Escolhido por melhor candidato (score baixo): ${modelMatch.nome} (score ${candidates[0].score.toFixed(3)})`);
        }
      }
    }

    if (!modelMatch) {
      debug.push('Nenhum modelo compatível encontrado.');
      return { value: null, raw: null, debug };
    }

    const modelId = modelMatch.codigo;
    debug.push(`Modelo final: ${modelMatch.nome} (id=${modelId})`);

    // 3) anos
    const yearsRes = await fetch(`${BASE}/carros/marcas/${brandId}/modelos/${modelId}/anos`);
    const years = await yearsRes.json();
    debug.push(`Anos retornados: ${Array.isArray(years) ? years.length : 0}`);

    const yearStr = String(year);
    let yearMatch = (years || []).find(y => String(y.nome).startsWith(yearStr));
    if (!yearMatch) {
      // tentar contain do ano
      yearMatch = (years || []).find(y => String(y.nome).indexOf(yearStr) !== -1);
    }
    if (!yearMatch && fuel) {
      const nfuel = normalize(fuel || '');
      yearMatch = (years || []).find(y => normalize(y.nome || '').startsWith(yearStr) && normalize(y.nome || '').includes(nfuel));
    }
    if (!yearMatch) {
      // fallback: pegar item cujo nome contenha o ano (regex)
      yearMatch = (years || []).find(y => (String(y.nome || '') || '').match(new RegExp(`\\b${yearStr}\\b`)));
    }

    if (!yearMatch && (years || []).length > 0) {
      // pega o item com ano numérico mais próximo (ex: "2017 Gasolina" -> parsea 2017)
      let best = null, bestDiff = Infinity;
      for (const y of years) {
        const found = String(y.nome).match(/\d{4}/);
        if (found) {
          const ynum = Number(found[0]);
          const diff = Math.abs(ynum - Number(yearStr));
          if (diff < bestDiff) { bestDiff = diff; best = y; }
        }
      }
      if (best) {
        yearMatch = best;
        debug.push(`Fallback ano por proximidade: ${yearMatch.nome}`);
      }
    }

    if (!yearMatch) {
      debug.push('Ano não encontrado entre opções do modelo.');
      return { value: null, raw: null, debug, candidates: candidates.slice(0,6) };
    }

    const yearCode = yearMatch.codigo;
    debug.push(`Ano escolhido: ${yearMatch.nome} (codigo=${yearCode})`);

    // 4) buscar preço
    const priceRes = await fetch(`${BASE}/carros/marcas/${brandId}/modelos/${modelId}/anos/${encodeURIComponent(yearCode)}`);
    const priceObj = await priceRes.json();
    debug.push('Consulta FIPE realizada.');

    const value = parseValueString(priceObj.Valor || priceObj.valor || priceObj.Valor);
    if (!value) {
      debug.push('Não foi possível parsear valor retornado.');
      return { value: null, raw: priceObj, debug, candidates: candidates.slice(0,6) };
    }

    // opcional: expõe candidatos para ajudar debug na UI
    return { value, raw: priceObj, debug, candidates: candidates.slice(0,6) };
  } catch (err) {
    return { value: null, raw: null, debug: ['Erro: ' + String(err)] };
  }
};

// compatibilidade com import existente em VehicleManager.jsx
export const fetchFipeForVehicle = getFipeValue;


