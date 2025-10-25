// src/lib/fipe-api.js
// Versão reforçada: valida marca + modelo + ano + combustível buscando entre "anos" do modelo.

const BASE = 'https://parallelum.com.br/fipe/api/v1';

const normalize = (s = '') =>
  String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const tokenize = (s = '') => normalize(s).split(' ').filter(Boolean);

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

// Mapeamento simples de combustíveis (normaliza termos)
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

// função principal exportada
export const getFipeValue = async ({ brand, model, year, fuel } = {}) => {
  const debug = [];
  try {
    if (!brand || !model || !year) {
      debug.push('Parâmetros insuficientes: brand/model/year são obrigatórios.');
      return { value: null, raw: null, debug };
    }

    const inputBrand = String(brand || '');
    const inputModel = String(model || '');
    const yearStr = String(year);
    const fuelTok = fuelTokenFor(fuel);

    debug.push(`Entrada: brand="${inputBrand}", model="${inputModel}", year=${yearStr}, fuel="${fuelTok}"`);

    // 1) buscar marcas e encontrar a melhor
    const brandsRes = await fetch(`${BASE}/carros/marcas`);
    const brands = await brandsRes.json();
    const normBrand = normalize(inputBrand);
    let brandMatch = brands.find(b => normalize(b.nome) === normBrand)
      || brands.find(b => normalize(b.nome).includes(normBrand) || normBrand.includes(normalize(b.nome)))
      || brands.find(b => normalize(b.nome).startsWith(normBrand.slice(0,3)));

    if (!brandMatch) {
      // tentativa fuzzy por levenshtein
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
    debug.push(`Marca encontrada: ${brandMatch.nome} (codigo=${brandMatch.codigo})`);

    const brandId = brandMatch.codigo;

    // 2) buscar modelos da marca
    const modelsRes = await fetch(`${BASE}/carros/marcas/${brandId}/modelos`);
    const modelsObj = await modelsRes.json();
    const modelos = Array.isArray(modelsObj) ? modelsObj : (modelsObj.modelos || []);
    debug.push(`Modelos carregados: ${modelos.length}`);

    const normModel = normalize(inputModel);
    // construir candidatos com score token_overlap + levRatio
    const inputTokens = tokenize(normModel);

    const candidates = modelos.map(m => {
      const mname = m.nome || '';
      const nm = normalize(mname);
      const tokensM = tokenize(nm);
      const overlap = tokensM.filter(t => inputTokens.includes(t)).length;
      const overlapScore = overlap / Math.max(tokensM.length, 1);
      const lev = levRatio(nm, normModel);
      // score ponderado (overlap tem peso maior)
      const score = overlapScore * 0.6 + lev * 0.4;
      return { modelo: m, score, nm, tokensM, overlapScore, lev };
    }).sort((a,b) => b.score - a.score);

    debug.push('Top candidatos (modelo - score):');
    candidates.slice(0,6).forEach((c, i) => debug.push(`${i+1}. ${c.modelo.nome} (score ${c.score.toFixed(3)})`));

    // função que verifica anos para um modelo e procura correspondência exata de year+fuel
    const checkModelForYearAndFuel = async (modelCandidate) => {
      try {
        const mid = modelCandidate.modelo.codigo;
        const yearsRes = await fetch(`${BASE}/carros/marcas/${brandId}/modelos/${mid}/anos`);
        const years = await yearsRes.json();
        if (!Array.isArray(years)) return null;
        // procura por ano que contenha o anoStr e (se fuelTok presente) contenha token de fuel
        const match = years.find(y => {
          const n = normalize(y.nome || '');
          const hasYear = n.includes(yearStr);
          const hasFuel = fuelTok ? n.includes(fuelTok) : true;
          return hasYear && hasFuel;
        });
        if (match) return { yearMatch: match, years };
        // se não achar com fuel, tenta apenas por year (sem fuel)
        const match2 = years.find(y => normalize(y.nome || '').includes(yearStr));
        if (match2) return { yearMatch: match2, years };
        // fallback: retorna null (não bateu ano)
        return null;
      } catch (err) {
        return null;
      }
    };

    // 3) para os top candidates, verificar anos (somente topN para evitar muitas chamadas)
    const TOP_N = Math.min(8, Math.max(3, Math.floor(candidates.length * 0.1) + 3)); // até 8
    let chosen = null;
    for (let i = 0; i < Math.min(TOP_N, candidates.length); i++) {
      const cand = candidates[i];
      const res = await checkModelForYearAndFuel(cand);
      if (res && res.yearMatch) {
        chosen = { candidate: cand, yearMatch: res.yearMatch };
        debug.push(`Escolhido candidato #${i+1} ${cand.modelo.nome} por encontrar ano+fuel: ${res.yearMatch.nome}`);
        break;
      }
    }

    // 4) se não encontrou, tentar expandir: olhar mais candidatos (até 40) e pegar melhor por ano
    if (!chosen) {
      for (let i = TOP_N; i < Math.min(40, candidates.length); i++) {
        const cand = candidates[i];
        const res = await checkModelForYearAndFuel(cand);
        if (res && res.yearMatch) {
          chosen = { candidate: cand, yearMatch: res.yearMatch };
          debug.push(`Escolhido candidato expandido #${i+1} ${cand.modelo.nome} por ano encontrado: ${res.yearMatch.nome}`);
          break;
        }
      }
    }

    // 5) ainda não encontrou: tentar pegar melhor candidato e escolher ano numericamente mais próximo
    if (!chosen && candidates.length > 0) {
      const cand = candidates[0];
      // buscar anos do candidato top
      const mid = cand.modelo.codigo;
      const yearsRes = await fetch(`${BASE}/carros/marcas/${brandId}/modelos/${mid}/anos`);
      const years = await yearsRes.json();
      // tentar achar ano que contenha yearStr
      let yearMatch = (years || []).find(y => normalize(y.nome || '').includes(yearStr));
      if (!yearMatch) {
        // escolher ano com ano numérico mais próximo
        let best = null, bestDiff = Infinity;
        for (const y of (years || [])) {
          const found = String(y.nome).match(/\d{4}/);
          if (found) {
            const ynum = Number(found[0]);
            const diff = Math.abs(ynum - Number(yearStr));
            if (diff < bestDiff) { bestDiff = diff; best = y; }
          }
        }
        yearMatch = best || null;
      }
      if (yearMatch) {
        chosen = { candidate: cand, yearMatch };
        debug.push(`Fallback por proximidade numérica no melhor candidato: ${cand.modelo.nome} -> ${yearMatch.nome}`);
      }
    }

    if (!chosen) {
      debug.push('Nenhum modelo/ano compatível encontrado após tentativas.');
      return { value: null, raw: null, debug, candidates: candidates.slice(0,8).map(c=>c.modelo.nome) };
    }

    // 6) buscar preço para o modelo+ano selecionado
    const modelId = chosen.candidate.modelo.codigo;
    const yearCode = chosen.yearMatch.codigo;
    debug.push(`Consultando preço -> modelo="${chosen.candidate.modelo.nome}" modelId=${modelId}, year="${chosen.yearMatch.nome}" yearCode=${yearCode}`);

    const priceRes = await fetch(`${BASE}/carros/marcas/${brandId}/modelos/${modelId}/anos/${encodeURIComponent(yearCode)}`);
    const priceObj = await priceRes.json();
    const value = parseValueString(priceObj.Valor || priceObj.valor || priceObj.Valor);

    if (!value) {
      debug.push('Erro ao parsear valor FIPE retornado.');
      return { value: null, raw: priceObj, debug };
    }

    debug.push(`Valor encontrado: ${value}`);
    return { value, raw: priceObj, debug };
  } catch (err) {
    return { value: null, raw: null, debug: ['Erro: ' + String(err)] };
  }
};

// compatibilidade com import antigo
export const fetchFipeForVehicle = getFipeValue;

