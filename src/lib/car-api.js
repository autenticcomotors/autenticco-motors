// src/lib/car-api.js
import { supabase } from './supabase';

/*
  -----------------------------
  FUNÇÕES: CARROS (cars)
  -----------------------------
*/

export const getCars = async () => {
  const { data, error } = await supabase
    .from('cars')
    .select('*')
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
  const { data, error } = await supabase.from('leads').insert([leadData]).select().single();
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
 * Insere um registro na tabela `sales`.
 * Esta função apenas cria a entrada em sales e retorna o resultado.
 * (Não altera o registro em `cars` — use markCarAsSold se quiser inserir e atualizar o carro)
 */
export const addSale = async (sale) => {
  // sale: { car_id, platform_id, sale_price, sale_date, notes }
  try {
    const payload = {
      ...sale,
      sale_date: sale.sale_date || new Date().toISOString()
    };
    const { data, error } = await supabase
      .from('sales')
      .insert([payload])
      .select()
      .single();
    if (error) {
      console.error('Erro ao inserir sale:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Erro em addSale:', err);
    return { data: null, error: err };
  }
};

/**
 * Deleta todas as sales associadas a um car_id.
 * Útil para reverter vendas em massa daquele veículo.
 */
export const deleteSalesByCar = async (carId) => {
  try {
    const { data, error } = await supabase
      .from('sales')
      .delete()
      .eq('car_id', carId);
    if (error) {
      console.error('Erro ao deletar sales por carro:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Erro em deleteSalesByCar:', err);
    return { data: null, error: err };
  }
};

/**
 * Marca carro como vendido: cria sale e atualiza o carro (is_available = false).
 * Mantive esta função caso você queira um único passo que insere e atualiza.
 */
export const markCarAsSold = async ({ car_id, platform_id = null, sale_price = null, sale_date = null, notes = null }) => {
  try {
    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert([{
        car_id,
        platform_id,
        sale_price,
        sale_date: sale_date || new Date().toISOString(),
        notes
      }])
      .select()
      .single();

    if (saleError) {
      console.error('Erro ao inserir sale:', saleError);
      return { error: saleError };
    }

    // Atualiza o carro para ficar fora do estoque (is_available = false)
    const { data: updatedCar, error: carUpdateError } = await supabase
      .from('cars')
      .update({
        is_available: false,
        sale_date: saleData.sale_date,
        sale_platform_id: platform_id || null,
        sale_price: sale_price || null
      })
      .eq('id', car_id)
      .select()
      .single();

    if (carUpdateError) {
      console.error('Erro ao atualizar carro após venda:', carUpdateError);
      return { error: carUpdateError };
    }

    return { sale: saleData, updatedCar };
  } catch (err) {
    console.error('Erro em markCarAsSold:', err);
    return { error: err };
  }
};

/**
 * Desmarca carro como vendido: atualiza o carro (is_available = true) e opcionalmente remove a última sale
 */
export const unmarkCarAsSold = async (carId, { deleteLastSale = false } = {}) => {
  try {
    const { data: updatedCar, error: carErr } = await supabase
      .from('cars')
      .update({
        is_available: true,
        sale_date: null,
        sale_platform_id: null,
        sale_price: null
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

