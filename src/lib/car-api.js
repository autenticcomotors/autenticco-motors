// src/lib/car-api.js
import { supabase } from './supabase';

/*
  -----------------------------
  FUNÇÕES: CARROS (cars)
  -----------------------------
*/

export const getCars = async () => {
  // Ordena veículos ativos primeiro (is_sold false) e vendidos por último.
  // Em seguida ordena por created_at decrescente para mostrar os mais recentes primeiro.
  const { data, error } = await supabase
    .from('cars')
    .select('*')
    .order('is_sold', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) console.error('Erro ao buscar carros:', error);
  return data || [];
};

export const getFeaturedCars = async () => {
  const { data, error } = await supabase
    .from('cars')
    .select('*')
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(4);
  if (error) console.error('Erro ao buscar carros em destaque:', error);
  return data || [];
};

export const getCarBySlug = async (slug) => {
  const { data, error } = await supabase
    .from('cars')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error) {
    console.error('Erro ao buscar carro por slug:', error);
    return null;
  }
  return data;
};

export const getCarById = async (id) => {
  const { data, error } = await supabase
    .from('cars')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    console.error('Erro ao buscar carro por id:', error);
    return null;
  }
  return data;
};

export const addCar = async (carData) => {
  const carName = `${carData.brand} ${carData.model}`;
  const slug = `${carData.brand.toLowerCase().replace(/ /g, '-')}-${carData.model.toLowerCase().replace(/ /g, '-')}-${Date.now()}`;
  const { data, error } = await supabase
    .from('cars')
    .insert([{ ...carData, name: carName, slug }])
    .select()
    .single();
  if (error) console.error('Erro ao adicionar carro:', error);
  return { data, error };
};

export const updateCar = async (id, carData) => {
  const { data, error } = await supabase
    .from('cars')
    .update(carData)
    .eq('id', id)
    .select()
    .single();
  if (error) console.error('Erro ao atualizar carro:', error);
  return { data, error };
};

export const deleteCar = async (id) => {
  const { data, error } = await supabase
    .from('cars')
    .delete()
    .eq('id', id);
  if (error) console.error('Erro ao deletar carro:', error);
  return { data, error };
};

/*
  -----------------------------
  FUNÇÕES: DEPOIMENTOS (testimonials)
  -----------------------------
*/

export const getTestimonials = async () => {
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) console.error('Erro ao buscar depoimentos:', error);
  return data || [];
};

export const addTestimonial = async (testimonialData) => {
  const { data, error } = await supabase
    .from('testimonials')
    .insert([testimonialData])
    .select()
    .single();
  if (error) console.error('Erro ao adicionar depoimento:', error);
  return { data, error };
};

export const deleteTestimonial = async (id) => {
  const { data, error } = await supabase
    .from('testimonials')
    .delete()
    .eq('id', id);
  if (error) console.error('Erro ao deletar depoimento:', error);
  return { data, error };
};

/*
  -----------------------------
  FUNÇÕES: LEADS
  -----------------------------
*/

export const addLead = async (leadData) => {
  const { data, error } = await supabase
    .from('leads')
    .insert([leadData])
    .select()
    .single();
  if (error) console.error('Erro ao adicionar lead:', error);
  return { data, error };
};

export const getLeads = async (filters = {}) => {
  let query = supabase
    .from('leads')
    .select(`*, cars(slug, brand, model)`)
    .order('created_at', { ascending: false });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.startDate) {
    const startDate = new Date(filters.startDate);
    startDate.setUTCHours(0, 0, 0, 0);
    query = query.gte('created_at', startDate.toISOString());
  }
  if (filters.endDate) {
    const endDate = new Date(filters.endDate);
    endDate.setUTCHours(23, 59, 59, 999);
    query = query.lte('created_at', endDate.toISOString());
  }

  const { data, error } = await query;
  if (error) console.error('Erro ao buscar leads:', error);
  return data || [];
};

export const updateLead = async (id, leadData) => {
  const { data, error } = await supabase
    .from('leads')
    .update(leadData)
    .eq('id', id)
    .select()
    .single();
  if (error) console.error('Erro ao atualizar lead:', error);
  return { data, error };
};

export const deleteLead = async (id) => {
  const { data, error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id);
  if (error) console.error('Erro ao excluir lead:', error);
  return { data, error };
};

/*
  -----------------------------
  FUNÇÕES: PLATAFORMAS (platforms)
  -----------------------------
*/

export const getPlatforms = async () => {
  const { data, error } = await supabase
    .from('platforms')
    .select('*')
    .order('name', { ascending: true });
  if (error) console.error('Erro ao buscar plataformas:', error);
  return data || [];
};

export const addPlatform = async (name) => {
  if (!name) return null;
  const { data, error } = await supabase
    .from('platforms')
    .insert([{ name }])
    .select()
    .single();
  if (error) {
    console.error('Erro ao criar plataforma:', error);
    return null;
  }
  return data;
};

/*
  -----------------------------
  FUNÇÕES: SALES (vendas)
  -----------------------------
*/

/**
 * markCarAsSold
 * insere uma linha em `sales` e atualiza o carro em `cars` com os campos corretos do schema.
 * Recebe um objeto com:
 *   { car_id, platform_id, sale_price, sale_date, fipe_value, ipva, platform_fee, commission, other_costs, return_to_seller, notes }
 */
export const markCarAsSold = async ({
  car_id,
  platform_id = null,
  sale_price = null,
  sale_date = null,
  fipe_value = null,
  ipva = null,
  platform_fee = null,
  commission = null,
  other_costs = null,
  return_to_seller = null,
  notes = null
}) => {
  try {
    const payload = {
      car_id,
      platform_id,
      sale_price,
      sale_date: sale_date || new Date().toISOString(),
      fipe_value,
      ipva,
      platform_fee,
      commission,
      other_costs,
      return_to_seller,
      notes
    };

    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert([payload])
      .select()
      .single();

    if (saleError) {
      console.error('Erro ao inserir sale:', saleError);
      return { error: saleError };
    }

    // cálculo de lucro simples (se tivermos comissão e custos)
    let profit = null;
    let profit_percent = null;
    if (commission != null) {
      const totalCosts = (Number(platform_fee || 0) + Number(other_costs || 0) + Number(ipva || 0) + Number(return_to_seller || 0));
      profit = Number(commission) - Number(totalCosts);
      if (sale_price != null && Number(sale_price) > 0) {
        profit_percent = (profit / Number(sale_price)) * 100;
      }
    }

    const carUpdatePayload = {
      is_sold: true,
      sold_at: saleData.sale_date, // atenção: campo do schema 'sold_at'
      sold_platform_id: platform_id || null,
      sale_price: sale_price || null,
      fipe_value: fipe_value || null,
      commission: commission || null,
      return_to_seller: return_to_seller || null,
      profit: profit !== null ? Number(profit.toFixed(2)) : null,
      profit_percent: profit_percent !== null ? Number(profit_percent.toFixed(2)) : null
    };

    const { data: updatedCar, error: carUpdateError } = await supabase
      .from('cars')
      .update(carUpdatePayload)
      .eq('id', car_id)
      .select()
      .single();

    if (carUpdateError) {
      console.error('Erro ao atualizar carro após venda:', carUpdateError);
      return { error: carUpdateError };
    }

    return { sale: saleData, updatedCar, profit };
  } catch (err) {
    console.error('Erro em markCarAsSold:', err);
    return { error: err };
  }
};

/**
 * unmarkCarAsSold
 * desfaz a venda no carro e (opcional) remove a última sale relacionada.
 * options: { deleteLastSale = true }  --> deletará a última sale (mais recente) para esse carro
 */
export const unmarkCarAsSold = async (carId, { deleteLastSale = true } = {}) => {
  try {
    const { data: updatedCar, error: carErr } = await supabase
      .from('cars')
      .update({
        is_sold: false,
        sold_at: null,
        sold_platform_id: null,
        sale_price: null,
        fipe_value: null,
        commission: null,
        return_to_seller: null,
        profit: null,
        profit_percent: null
      })
      .eq('id', carId)
      .select()
      .single();

    if (carErr) {
      console.error('Erro ao atualizar carro (unmark):', carErr);
      return { error: carErr };
    }

    if (deleteLastSale) {
      const { data: lastSale, error: lastErr } = await supabase
        .from('sales')
        .select('*')
        .eq('car_id', carId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (lastErr) {
        console.error('Erro ao buscar última sale:', lastErr);
      } else if (Array.isArray(lastSale) && lastSale.length > 0) {
        const { error: delErr } = await supabase
          .from('sales')
          .delete()
          .eq('id', lastSale[0].id);
        if (delErr) {
          console.error('Erro ao remover last sale:', delErr);
          return { error: delErr };
        }
      }
    }

    return { ok: true, updatedCar };
  } catch (err) {
    console.error('Erro em unmarkCarAsSold:', err);
    return { error: err };
  }
};

export const getSalesByCar = async (carId) => {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .eq('car_id', carId)
    .order('created_at', { ascending: false });
  if (error) console.error('Erro ao buscar sales por carro:', error);
  return data || [];
};

// Busca de sales com filtros (usado pelo Reports)
export const getSales = async (filters = {}) => {
  try {
    let query = supabase
      .from('sales')
      .select('*, platforms(name), cars(brand, model, year, slug)')
      .order('sale_date', { ascending: false });

    if (filters.platform_id) {
      query = query.eq('platform_id', filters.platform_id);
    }
    if (filters.startDate) {
      const start = new Date(filters.startDate);
      start.setUTCHours(0, 0, 0, 0);
      query = query.gte('sale_date', start.toISOString());
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setUTCHours(23, 59, 59, 999);
      query = query.lte('sale_date', end.toISOString());
    }

    const { data, error } = await query;
    if (error) console.error('Erro ao buscar sales:', error);
    return data || [];
  } catch (err) {
    console.error('Erro em getSales:', err);
    return [];
  }
};

/*
  -----------------------------
  FUNÇÕES: PUBLICAÇÕES (vehicle_publications)
  -----------------------------
*/

export const getPublicationsByCar = async (carId) => {
  const { data, error } = await supabase
    .from('vehicle_publications')
    .select('*')
    .eq('car_id', carId)
    .order('created_at', { ascending: false });
  if (error) console.error('Erro ao buscar publicações por carro:', error);
  return data || [];
};

export const addPublication = async (pub) => {
  const { data, error } = await supabase
    .from('vehicle_publications')
    .insert([pub])
    .select()
    .single();
  if (error) console.error('Erro ao adicionar publicação:', error);
  return { data, error };
};

export const updatePublication = async (id, patch) => {
  const { data, error } = await supabase
    .from('vehicle_publications')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) console.error('Erro ao atualizar publicação:', error);
  return { data, error };
};

export const deletePublication = async (id) => {
  const { data, error } = await supabase
    .from('vehicle_publications')
    .delete()
    .eq('id', id);
  if (error) console.error('Erro ao deletar publicação:', error);
  return { data, error };
};

/*
  -----------------------------
  FUNÇÕES: GASTOS (vehicle_expenses)
  -----------------------------
*/

export const getExpensesByCar = async (carId) => {
  const { data, error } = await supabase
    .from('vehicle_expenses')
    .select('*')
    .eq('car_id', carId)
    .order('incurred_at', { ascending: false });
  if (error) console.error('Erro ao buscar gastos por carro:', error);
  return data || [];
};

export const addExpense = async (expense) => {
  const { data, error } = await supabase
    .from('vehicle_expenses')
    .insert([expense])
    .select()
    .single();
  if (error) console.error('Erro ao adicionar gasto:', error);
  return { data, error };
};

export const updateExpense = async (id, patch) => {
  const { data, error } = await supabase
    .from('vehicle_expenses')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) console.error('Erro ao atualizar gasto:', error);
  return { data, error };
};

export const deleteExpense = async (id) => {
  const { data, error } = await supabase
    .from('vehicle_expenses')
    .delete()
    .eq('id', id);
  if (error) console.error('Erro ao deletar gasto:', error);
  return { data, error };
};

/*
  -----------------------------
  FUNÇÕES: CHECKLIST (vehicle_checklists)
  -----------------------------
*/

export const getChecklistByCar = async (carId) => {
  const { data, error } = await supabase
    .from('vehicle_checklists')
    .select('*')
    .eq('car_id', carId)
    .order('created_at', { ascending: true });
  if (error) console.error('Erro ao buscar checklist:', error);
  return data || [];
};

export const updateChecklistItem = async (id, patch) => {
  const { data, error } = await supabase
    .from('vehicle_checklists')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) console.error('Erro ao atualizar checklist:', error);
  return { data, error };
};

export const addChecklistItem = async (item) => {
  const { data, error } = await supabase
    .from('vehicle_checklists')
    .insert([item])
    .select()
    .single();
  if (error) console.error('Erro ao adicionar item de checklist:', error);
  return { data, error };
};

export const deleteChecklistItem = async (id) => {
  const { data, error } = await supabase
    .from('vehicle_checklists')
    .delete()
    .eq('id', id);
  if (error) console.error('Erro ao deletar item checklist:', error);
  return { data, error };
};

/*
  -----------------------------
  FUNÇÕES UTILITÁRIAS: BUSCAS EM BULK (para resumo na listagem)
  -----------------------------
*/

export const getPublicationsForCars = async (carIds = []) => {
  if (!Array.isArray(carIds) || carIds.length === 0) return [];
  const { data, error } = await supabase
    .from('vehicle_publications')
    .select('*')
    .in('car_id', carIds);
  if (error) console.error('Erro ao buscar publicações (bulk):', error);
  return data || [];
};

export const getExpensesForCars = async (carIds = []) => {
  if (!Array.isArray(carIds) || carIds.length === 0) return [];
  const { data, error } = await supabase
    .from('vehicle_expenses')
    .select('*')
    .in('car_id', carIds);
  if (error) console.error('Erro ao buscar gastos (bulk):', error);
  return data || [];
};

