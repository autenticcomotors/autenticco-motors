// src/lib/car-api.js
import { supabase } from './supabase';

/*
  -----------------------------
  FUNÇÕES: CARROS (cars)
  -----------------------------
*/

/**
 * Busca carros.
 * Por padrão mantém o comportamento antigo: traz TUDO (inclusive vendidos).
 * Se quiser só estoque atual, chame: getCars({ includeSold: false })
 */
export const getCars = async ({ includeSold = true } = {}) => {
  let query = supabase
    .from('cars')
    .select('*')
    .order('created_at', { ascending: false });

  if (!includeSold) {
    query = query.eq('is_sold', false);
  }

  const { data, error } = await query;
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
  const slug = `${(carData.brand || '').toLowerCase().replace(/ /g, '-')}-${(carData.model || '').toLowerCase().replace(/ /g, '-')}-${Date.now()}`;
  const payload = {
    ...carData,
    name: carName,
    slug,
    is_available: true,
    is_sold: false,
    entered_at: carData.entered_at || new Date().toISOString()
  };
  const { data, error } = await supabase
    .from('cars')
    .insert([payload])
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

export const setCarEnteredAt = async (id, enteredAtISO) => {
  return updateCar(id, { entry_at: enteredAtISO });
};

export const setCarDeliveredAt = async (id, deliveredAtISO) => {
  return updateCar(id, { delivered_at: deliveredAtISO });
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

  if (filters.status) query = query.eq('status', filters.status);

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
    // agora vamos ordenar com prioridade para quem já tem platform_order
    .order('platform_order', { ascending: true, nullsFirst: false })
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

// NOVO: atualizar ordem da plataforma
// chama isso quando o usuário arrastar / mover pra cima / pra baixo
export const updatePlatformOrder = async (id, platform_order) => {
  if (!id) return { error: 'id obrigatório' };
  const { data, error } = await supabase
    .from('platforms')
    .update({ platform_order })
    .eq('id', id)
    .select()
    .single();
  if (error) {
    console.error('Erro ao atualizar ordem da plataforma:', error);
  }
  return { data, error };
};

/*
  -----------------------------
  FUNÇÕES: SALES (vendas)
  -----------------------------
*/

export const markCarAsSold = async ({ car_id, platform_id = null, sale_price = null, sale_date = null, notes = null }) => {
  try {
    const salePayload = {
      car_id,
      platform_id,
      sale_price,
      sale_date: sale_date || new Date().toISOString(),
      notes
    };

    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert([salePayload])
      .select()
      .single();

    if (saleError) {
      console.error('Erro ao inserir sale:', saleError);
      return { error: saleError };
    }

    const { data: updatedCar, error: carUpdateError } = await supabase
      .from('cars')
      .update({
        is_sold: true,
        is_available: false,
        sold_at: saleData.sale_date,
        sold_platform_id: platform_id || null,
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

export const unmarkCarAsSold = async (carId, { deleteAllSales = true } = {}) => {
  try {
    const { data: updatedCar, error: carErr } = await supabase
      .from('cars')
      .update({
        is_sold: false,
        is_available: true,
        sold_at: null,
        sold_platform_id: null,
        sale_price: null
      })
      .eq('id', carId)
      .select()
      .single();

    if (carErr) {
      console.error('Erro ao atualizar carro (unmark):', carErr);
      return { error: carErr };
    }

    if (deleteAllSales) {
      const { error: delErr } = await supabase
        .from('sales')
        .delete()
        .eq('car_id', carId);
      if (delErr) {
        console.error('Erro ao remover todas sales:', delErr);
        return { error: delErr };
      }
    } else {
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

export const getSales = async (filters = {}) => {
  try {
    let query = supabase
      .from('sales')
      .select('*, platforms(name), cars(brand, model, year, slug)')
      .order('sale_date', { ascending: false });

    if (filters.platform_id) query = query.eq('platform_id', filters.platform_id);
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
  const payload = {
    car_id: pub.car_id,
    platform_id: pub.platform_id ?? null,
    platform_name: pub.platform_name ?? null,
    platform_type: pub.platform_type ?? null,
    link: pub.link ?? null,
    status: pub.status ?? 'draft',
    spent: pub.spent ?? null,
    published_at: pub.published_at ?? null,
    notes: pub.notes ?? null
  };

  const { data, error } = await supabase
    .from('vehicle_publications')
    .insert([payload])
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
  FUNÇÕES UTILITÁRIAS: BUSCAS EM BULK
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

/*
  -----------------------------
  FUNÇÕES: FIPE (wrapper do fipe-api)
  -----------------------------
*/

import { getFipeValue } from './fipe-api';

export const getFipeForCar = async (car) => {
  if (!car) return null;
  const { brand, model, year, fuel, version, body_type } = car;
  const res = await getFipeValue({
    brand,
    model,
    year,
    fuel,
    version: version || body_type || '',
    vehicleType: 'carros'
  });
  return res?.value ?? null;
};

/*
  -----------------------------
  FUNÇÕES: CHECKLIST TEMPLATES (LEGADO)
  -----------------------------
*/

export const saveChecklistTemplate = async (name = 'Padrão', items = []) => {
  try {
    const payload = {
      name: name,
      template: items,
      created_at: new Date().toISOString()
    };
    const { data, error } = await supabase
      .from('checklist_templates')
      .insert([payload])
      .select()
      .single();
    if (error) console.error('Erro ao salvar template:', error);
    return { data, error };
  } catch (err) {
    console.error('Erro em saveChecklistTemplate:', err);
    return { error: err };
  }
};

export const getLatestChecklistTemplate = async () => {
  try {
    const { data, error } = await supabase
      .from('checklist_templates')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) {
      console.error('Erro ao buscar latest checklist template:', error);
      return { data: null, error };
    }
    const found = Array.isArray(data) && data.length > 0 ? data[0] : null;
    return { data: found, error: null };
  } catch (err) {
    console.error('Erro em getLatestChecklistTemplate:', err);
    return { data: null, error: err };
  }
};

// LEGADO
export const addChecklistItem = async (..._args) => {
  console.warn('[LEGADO] addChecklistItem chamado — checklist foi desativado. Ignorando.');
  return { data: null, error: null };
};

