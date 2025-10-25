// src/lib/fipe-api.js
// Wrapper simples para consultar a API FIPE pública (Parallelum).
// Retorna { value: number|null, formatted: string|null, raw: object|null }

const API_BASE = 'https://parallelum.com.br/fipe/api/v1';

function parseFipeCurrency(valueStr) {
  if (!valueStr || typeof valueStr !== 'string') return null;
  // Ex: "R$ 47.456,00" -> 47456.00
  const cleaned = valueStr.replace(/[^\d.,-]/g, '').trim();
  // remove thousands dots, swap comma to dot
  const noThousands = cleaned.replace(/\.(?=\d{3}(?:[.,]|$))/g, '');
  const normalized = noThousands.replace(',', '.');
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : null;
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} - ${txt}`);
  }
  return res.json();
}

/**
 * Busca FIPE para um veículo.
 * @param {object} params
 * @param {string} params.brand - marca (ex: "Ford" ou "Volkswagen")
 * @param {string} params.model - modelo (ex: "Ka")
 * @param {string|number} params.year - ano (ex: "2018" ou 2018)
 * @param {string} params.fuel - combustível (opcional, ex: "Flex","Gasolina")
 * @returns {Promise<{value:number|null, formatted:string|null, raw:object|null}>}
 */
export async function fetchFipeForVehicle({ brand = '', model = '', year = '', fuel = '' } = {}) {
  try {
    if (!brand || !model || !year) {
      throw new Error('Parâmetros insuficientes (brand, model, year são necessários).');
    }

    // 1) marcas
    const marcas = await fetchJson(`${API_BASE}/carros/marcas`);
    const marcaObj = marcas.find(m => (m.nome || '').toLowerCase().includes(String(brand).toLowerCase()));
    if (!marcaObj) {
      // tentativa de correspondência simples: tirar acentos e comparar startsWith/contains
      const alt = marcas.find(m => (m.nome || '').toLowerCase().indexOf(String(brand).toLowerCase()) !== -1);
      if (!alt) return { value: null, formatted: null, raw: null, error: 'Marca não encontrada' };
    }
    const marcaCodigo = (marcaObj && marcaObj.codigo) || (alt && alt.codigo);

    // 2) modelos
    const modelosData = await fetchJson(`${API_BASE}/carros/marcas/${marcaCodigo}/modelos`);
    // alguns providers retornam { modelos: [...] }, outros retornam lista direta
    const modelos = modelosData.modelos || modelosData;
    const modeloObj = modelos.find(m => (m.nome || '').toLowerCase().includes(String(model).toLowerCase()));
    if (!modeloObj) return { value: null, formatted: null, raw: null, error: 'Modelo não encontrado' };
    const modeloCodigo = modeloObj.codigo;

    // 3) anos (versões)
    const anos = await fetchJson(`${API_BASE}/carros/marcas/${marcaCodigo}/modelos/${modeloCodigo}/anos`);
    // anos é array: { codigo: "2014-1", nome: "2014 Gasolina" }
    const desiredYear = String(year);
    const desiredFuel = (fuel || '').toLowerCase();

    let anoObj = anos.find(a => {
      const nome = (a.nome || '').toLowerCase();
      return nome.includes(desiredYear) && (desiredFuel ? nome.includes(desiredFuel) : true);
    });

    // fallback: se não encontrou por combustível, buscar só por ano exato
    if (!anoObj) {
      anoObj = anos.find(a => (a.nome || '').toLowerCase().includes(desiredYear));
    }

    if (!anoObj) {
      return { value: null, formatted: null, raw: null, error: 'Ano/versão não encontrada' };
    }
    const anoCodigo = anoObj.codigo;

    // 4) valor
    const valorRaw = await fetchJson(`${API_BASE}/carros/marcas/${marcaCodigo}/modelos/${modeloCodigo}/anos/${anoCodigo}`);
    // resposta costuma ter campo "Valor" (string formatada)
    const formatted = valorRaw && (valorRaw.Valor || valorRaw.Valor || valorRaw.value || null);
    const parsed = parseFipeCurrency(formatted || valorRaw.Valor || valorRaw.value || '');

    return { value: parsed, formatted: formatted || null, raw: valorRaw, error: null };
  } catch (err) {
    return { value: null, formatted: null, raw: null, error: String(err && err.message ? err.message : err) };
  }
}

export default fetchFipeForVehicle;

