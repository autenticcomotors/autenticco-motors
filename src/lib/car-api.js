// src/lib/car-api.js
import { supabase } from './supabase';

/* -------------------------
   FUNÇÕES DE CARROS (EXISTENTES)
   ------------------------- */

export const getCars = async () => {
  const { data, error } = await supabase.from('cars').select('*').order('created_at', { ascending: false });
  if (error) console.error('Erro ao buscar carros:', error);
  return data;
};

export const getFeaturedCars = async () => {
  const { data, error } = await supabase.from('cars').select('*').eq('is_featured', true).order('created_at', { ascending: false }).limit(4);
  if (error) console.error('Erro ao buscar carros em destaque:', error);
  return data;
};

export const getCarBySlug = async (slug) => {
  const { data, error } = await supabase.from('cars').select('*').eq('slug', slug).single();
  if (error) { console.error('Erro ao buscar carro:', error); return null; }
  return data;
};

export const addCar = async (carData) => {
  const carName = `${carData.brand} ${carData.model}`;
  const slug = `${carData.brand.toLowerCase().replace(/ /g, '-')}-${carData.model.toLowerCase().replace(/ /g, '-')}-${Date.now()}`;
  return await supabase.from('cars').insert([{ ...carData, name: carName, slug }]).select();
};

export const updateCar = async (id, carData) => {
  return await supabase.from('cars').update(carData).eq('id', id);
};

export const deleteCar = async (id) => {
  return await supabase.from('cars').delete().eq('id', id);
};

/* -------------------------
   FUNÇÕES DE DEPOIMENTOS
   ------------------------- */

export const getTestimonials = async () => {
  const { data, error } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false });
  if (error) console.error('Erro ao buscar depoimentos:', error);
  return data;
};

export const addTestimonial = async (testimonialData) => {
  return await supabase.from('testimonials').insert([testimonialData]);
};

export const deleteTestimonial = async (id) => {
  return await supabase.from('testimonials').delete().eq('id', id);
};

/* -------------------------
   FUNÇÕES DE LEADS
   ------------------------- */

export const addLead = async (leadData) => {
  const { error } = await supabase.from('leads').insert([leadData]);
  if (error) console.error('Erro ao adicionar lead:', error);
  return { error };
};

export const getLeads = async (filters = {}) => {
  let query = supabase.from('leads').select(`*, cars(slug, brand, model)`).order('created_at', { ascending: false });

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
  return data;
};

export const updateLead = async (id, leadData) => {
  return await supabase.from('leads').update(leadData).eq('id', id);
};

export const deleteLead = async (id) => {
  return await supabase.from('leads').delete().eq('id', id);
};

/* -------------------------
   NOVAS FUNÇÕES: PLATAFORMAS, VENDAS, PUBLICAÇÕES, GASTOS, CHECKLIST
   ------------------------- */

/* PLATAFORMAS */
export const getPlatforms = async () => {
  const { data, error } = await supabase.from('platforms').select('*').order('name', { ascending: true });
  if (error) console.error('Erro ao buscar plataformas:', error);
  return data;
};

export const addPlatform = async (name) => {
  if (!name) return null;
  const { data, error } = await supabase.from('platforms').insert([{ name }]).select().single();
  if (error) { console.error('Erro ao criar plataforma:', error); return null; }
  return data;
};

/* SALES (histórico de vendas) */
export const markCarAsSold = async ({ car_id, platform_id = null, sale_price = null, sale_date = null, notes = null }) => {
  try {
    const { data: saleData, error: saleError } = await supabase.from('sales').insert([{
      car_id,
      platform_id,
      sale_price,
      sale_date: sale_date || new Date().toISOString(),
      notes
    }]).select().single();

    if (saleError) {
      console.error('Erro ao inserir sale:', saleError);
      return { error: saleError };
    }

    const { error: carUpdateError } = await supabase.from('cars').update({
      is_sold: true,
      sold_at: saleData.sale_date,
      sold_platform_id: platform_id || null,
      sale_price: sale_price || null
    }).eq('id', car_id);

    if (carUpdateError) {
      console.error('Erro ao atualizar carro após venda:', carUpdateError);
      return { error: carUpdateError };
    }

    return { sale: saleData };
  } catch (err) {
    console.error('Erro em markCarAsSold:', err);
    return { error: err };
  }
};

export const unmarkCarAsSold = async (carId, { deleteLastSale = false } = {}) => {
  try {
    const { error: carErr } = await supabase.from('cars').update({
      is_sold: false,
      sold_at: null,
      sold_platform_id: null,
      sale_price: null
    }).eq('id', carId);

    if (carErr) {
      console.error('Erro ao atualizar carro (unmark):', carErr);
      return { error: carErr };
    }

    if (deleteLastSale) {
      const { data: lastSale, error: lastErr } = await supabase.from('sales').select('*').eq('car_id', carId).order('created_at', { ascending: false }).limit(1);
      if (lastErr) {
        console.error('Erro ao buscar última sale:', lastErr);
        // continue, não fatal
      } else if (Array.isArray(lastSale) && lastSale.length > 0) {
        const { error: delErr } = await supabase.from('sales').delete().eq('id', lastSale[0].id);
        if (delErr) {
          console.error('Erro ao remover last sale:', delErr);
          return { error: delErr };
        }
      }
    }

    return { ok: true };
  } catch (err) {
    console.error('Erro em unmarkCarAsSold:', err);
    return { error: err };
  }
};

/* PUBLICAÇÕES (vehicle_publications) */
export const getPublicationsByCar = async (carId) => {
  const { data, error } = await supabase.from('vehicle_publications').select('*').eq('car_id', carId).order('created_at', { ascending: false });
  if (error) console.error('Erro ao buscar publicações:', error);
  return data;
};

export const addPublication = async (pub) => {
  const { data, error } = await supabase.from('vehicle_publications').insert([pub]).select().single();
  if (error) console.error('Erro ao adicionar publicação:', error);
  return { data, error };
};

export const updatePublication = async (id, patch) => {
  const { data, error } = await supabase.from('vehicle_publications').update(patch).eq('id', id);
  if (error) console.error('Erro ao atualizar publicação:', error);
  return { data, error };
};

export const deletePublication = async (id) => {
  const { error } = await supabase.from('vehicle_publications').delete().eq('id', id);
  if (error) console.error('Erro ao deletar publicação:', error);
  return { error };
};

/* GASTOS (vehicle_expenses) */
export const getExpensesByCar = async (carId) => {
  const { data, error } = await supabase.from('vehicle_expenses').select('*').eq('car_id', carId).order('incurred_at', { ascending: false });
  if (error) console.error('Erro ao buscar gastos:', error);
  return data;
};

export const addExpense = async (expense) => {
  const { data, error } = await supabase.from('vehicle_expenses').insert([expense]).select().single();
  if (error) console.error('Erro ao adicionar gasto:', error);
  return { data, error };
};

export const updateExpense = async (id, patch) => {
  const { data, error } = await supabase.from('vehicle_expenses').update(patch).eq('id', id);
  if (error) console.error('Erro ao atualizar gasto:', error);
  return { data, error };
};

export const deleteExpense = async (id) => {
  const { error } = await supabase.from('vehicle_expenses').delete().eq('id', id);
  if (error) console.error('Erro ao deletar gasto:', error);
  return { error };
};

/* CHECKLIST (vehicle_checklists) */
export const getChecklistByCar = async (carId) => {
  const { data, error } = await supabase.from('vehicle_checklists').select('*').eq('car_id', carId).order('created_at', { ascending: true });
  if (error) console.error('Erro ao buscar checklist:', error);
  return data;
};

export const updateChecklistItem = async (id, patch) => {
  const { data, error } = await supabase.from('vehicle_checklists').update(patch).eq('id', id);
  if (error) console.error('Erro ao atualizar checklist:', error);
  return { data, error };
};

export const addChecklistItem = async (item) => {
  const { data, error } = await supabase.from('vehicle_checklists').insert([item]).select().single();
  if (error) console.error('Erro ao adicionar item de checklist:', error);
  return { data, error };
};

export const deleteChecklistItem = async (id) => {
  const { error } = await supabase.from('vehicle_checklists').delete().eq('id', id);
  if (error) console.error('Erro ao deletar item checklist:', error);
  return { error };
};

