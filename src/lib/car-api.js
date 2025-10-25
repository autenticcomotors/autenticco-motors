// src/lib/car-api.js
import { supabase } from './supabase';

/*
  -----------------------------
  FUNÇÕES: CARROS (cars)
  - getCars(options) => retorna array (ativos primeiro, depois vendidos)
  - addCar/updateCar/deleteCar retornam { data, error } para compatibilidade
  -----------------------------
*/

export const getCars = async (options = {}) => {
  // options: { includeSold: true/false (não usado atualmente), orderBy: { column, ascending } }
  try {
    let query = supabase.from('cars').select('*');

    // sempre traz ativos primeiro (is_sold false primeiro), depois ordena por created_at desc por padrão
    // se quiser outro comportamento, passe options.orderBy
    query = query.order('is_sold', { ascending: true });

    if (options.orderBy && options.orderBy.column) {
      query = query.order(options.orderBy.column, { ascending: !!options.orderBy.ascending });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) {
      console.error('Erro ao buscar carros:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Erro inesperado getCars:', err);
    return [];
  }
};

export const getCarById = async (id) => {
  try {
    const { data, error } = await supabase.from('cars').select('*').eq('id', id).single();
    if (error) {
      console.error('Erro ao buscar carro por id:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Erro inesperado getCarById:', err);
    return null;
  }
};

export const getCarBySlug = async (slug) => {
  try {
    const { data, error } = await supabase.from('cars').select('*').eq('slug', slug).single();
    if (error) {
      // não logar stacks demais em produção, mas manter console para debug
      console.error('Erro ao buscar carro por slug:', error);
      return null;
    }
    return data || null;
  } catch (err) {
    console.error('Erro inesperado getCarBySlug:', err);
    return null;
  }
};

export const addCar = async (carData) => {
  try {
    const carName = `${carData.brand} ${carData.model}`;
    const slug = `${carData.brand.toLowerCase().replace(/ /g, '-')}-${carData.model.toLowerCase().replace(/ /g, '-')}-${Date.now()}`;
    const payload = { ...carData, name: carName, slug };
    const { data, error } = await supabase.from('cars').insert([payload]).select().single();
    if (error) {
      console.error('Erro ao adicionar carro:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Erro inesperado addCar:', err);
    return { data: null, error: err };
  }
};

export const updateCar = async (id, carData) => {
  try {
    const { data, error } = await supabase.from('cars').update(carData).eq('id', id).select().single();
    if (error) {
      console.error('Erro ao atualizar carro:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Erro inesperado updateCar:', err);
    return { data: null, error: err };
  }
};

export const deleteCar = async (id) => {
  try {
    const { data, error } = await supabase.from('cars').delete().eq('id', id);
    if (error) {
      console.error('Erro ao deletar carro:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Erro inesperado deleteCar:', err);
    return { data: null, error: err };
  }
};

/*
  -----------------------------
  FUNÇÕES: DEPOIMENTOS (testimonials)
  -----------------------------
*/

export const getTestimonials = async () => {
  try {
    const { data, error } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Erro ao buscar depoimentos:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Erro inesperado getTestimonials:', err);
    return [];
  }
};

export const addTestimonial = async (testimonialData) => {
  try {
    const { data, error } = await supabase.from('testimonials').insert([testimonialData]).select().single();
    if (error) {
      console.error('Erro ao adicionar depoimento:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Erro inesperado addTestimonial:', err);
    return { data: null, error: err };
  }
};

export const deleteTestimonial = async (id) => {
  try {
    const { data, error } = await supabase.from('testimonials').delete().eq('id', id);
    if (error) {
      console.error('Erro ao deletar depoimento:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Erro inesperado deleteTestimonial:', err);
    return { data: null, error: err };
  }
};

/*
  -----------------------------
  FUNÇÕES: LEADS
  -----------------------------
*/

export const addLead = async (leadData) => {
  try {
    const { data, error } = await supabase.from('leads').insert([leadData]).select().single();
    if (error) {
      console.error('Erro ao adicionar lead:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Erro inesperado addLead:', err);
    return { data: null, error: err };
  }
};

export const getLeads = async (filters = {}) => {
  try {
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
    if (error) {
      console.error('Erro ao buscar leads:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Erro inesperado getLeads:', err);
    return [];
  }
};

export const updateLead = async (id, leadData) => {
  try {
    const { data, error } = await supabase.from('leads').update(leadData).eq('id', id).select().single();
    if (error) {
      console.error('Erro ao atualizar lead:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Erro inesperado updateLead:', err);
    return { data: null, error: err };
  }
};

export const deleteLead = async (id) => {
  try {
    const { data, error } = await supabase.from('leads').delete().eq('id', id);
    if (error) {
      console.error('Erro ao excluir lead:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Erro inesperado deleteLead:', err);
    return { data: null, error: err };
  }
};

/*
  -----------------------------
  FUNÇÕES: PLATAFORMAS (platforms)
  -----------------------------
*/

export const getPlatforms = async () => {
  try {
    const { data, error } = await supabase.from('platforms').select('*').order('name', { ascending: true });
    if (error) {
      console.error('Erro ao buscar plataformas:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Erro inesperado getPlatforms:', err);
    return [];
  }
};

export const addPlatform = async (name) => {
  if (!name) return null;
  try {
    const { data, error } = await supabase.from('platforms').insert([{ name }]).select().single();
    if (error) {
      console.error('Erro ao criar plataforma:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Erro inesperado addPlatform:', err);
    return null;
  }
};

/*
  -----------------------------
  FUNÇÕES: SALES (vendas)
  -----------------------------
  - markCarAsSold({ car_id, platform_id, sale_price, sale_date, notes })
  - unmarkCarAsSold(carId, { deleteLastSale })
  - getSales / getSalesByCar
  -----------------------------
*/

export const markCarAsSold = async ({ car_id, platform_id = null, sale_price = null, sale_date = null, notes = null, fipe_value = null, commission = null, other_costs = null, return_to_seller = null, platform_fee = null }) => {
  try {
    // 1) Inserir a sale
    const salePayload = {
      car_id,
      platform_id,
      sale_price: sale_price != null ? sale_price : null,
      sale_date: sale_date ? new Date(sale_date).toISOString() : new Date().toISOString(),
      notes: notes || null,
      fipe_value: fipe_value != null ? fipe_value : null,
      commission: commission != null ? commission : null,
      other_costs: other_costs != null ? other_costs : null,
      return_to_seller: return_to_seller != null ? return_to_seller : null,
      platform_fee: platform_fee != null ? platform_fee : null
    };

    const { data: saleData, error: saleError } = await supabase.from('sales').insert([salePayload]).select().single();

    if (saleError) {
      console.error('Erro ao inserir sale:', saleError);
      return { error: saleError };
    }

    // 2) Atualizar carro – usar colunas existentes no schema: is_sold, sold_at, sold_platform_id, sale_price
    const carPatch = {
      is_sold: true,
      sold_at: saleData.sale_date || salePayload.sale_date,
      sold_platform_id: platform_id || null,
      sale_price: sale_price != null ? sale_price : null,
      // opcional: guardar fipe/commission no carro também para relatório rápido
      fipe_value: fipe_value != null ? fipe_value : null,
      commission: commission != null ? commission : null,
      return_to_seller: return_to_seller != null ? return_to_seller : null,
      profit: null // cálculo de profit pode ser post-processed (ou setado aqui se desejar)
    };

    const { data: updatedCar, error: carUpdateError } = await supabase.from('cars').update(carPatch).eq('id', car_id).select().single();

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

export const unmarkCarAsSold = async (carId, { deleteLastSale = false } = {}) => {
  try {
    // 1) Atualiza o carro para desfazer a venda
    const carPatch = {
      is_sold: false,
      sold_at: null,
      sold_platform_id: null,
      sale_price: null,
      fipe_value: null,
      commission: null,
      return_to_seller: null,
      profit: null
    };

    const { data: updatedCar, error: carErr } = await supabase.from('cars').update(carPatch).eq('id', carId).select().single();

    if (carErr) {
      console.error('Erro ao atualizar carro (unmark):', carErr);
      return { error: carErr };
    }

    // 2) Se solicitado, apaga a última sale do carro (cuidado)
    if (deleteLastSale) {
      const { data: lastSale, error: lastErr } = await supabase.from('sales').select('*').eq('car_id', carId).order('created_at', { ascending: false }).limit(1);
      if (lastErr) {
        console.error('Erro ao buscar última sale:', lastErr);
      } else if (Array.isArray(lastSale) && lastSale.length > 0) {
        const { error: delErr } = await supabase.from('sales').delete().eq('id', lastSale[0].id);
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
  try {
    const { data, error } = await supabase.from('sales').select('*').eq('car_id', carId).order('created_at', { ascending: false });
    if (error) {
      console.error('Erro ao buscar sales por carro:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Erro inesperado getSalesByCar:', err);
    return [];
  }
};

export const getSales = async (filters = {}) => {
  try {
    let query = supabase.from('sales').select('*, platforms(name), cars(brand, model, year, slug)').order('sale_date', { ascending: false });

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
    if (error) {
      console.error('Erro ao buscar sales:', error);
      return [];
    }
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
  try {
    const { data, error } = await supabase.from('vehicle_publications').select('*').eq('car_id', carId).order('created_at', { ascending: false });
    if (error) {
      console.error('Erro ao buscar publicações por carro:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Erro inesperado getPublicationsByCar:', err);
    return [];
  }
};

export const addPublication = async (pub) => {
  try {
    const { data, error } = await supabase.from('vehicle_publications').insert([pub]).select().single();
    if (error) {
      console.error('Erro ao adicionar publicação:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Erro inesperado addPublication:', err);
    return { data: null, error: err };
  }
};

export const updatePublication = async (id, patch) => {
  try {
    const { data, error } = await supabase.from('vehicle_publications').update(patch).eq('id', id).select().single();
    if (error) {
      console.error('Erro ao atualizar publicação:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Erro inesperado updatePublication:', err);
    return { data: null, error: err };
  }
};

export const deletePublication = async (id) => {
  try {
    const { data, error } = await supabase.from('vehicle_publications').delete().eq('id', id);
    if (error) {
      console.error('Erro ao deletar publicação:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Erro inesperado deletePublication:', err);
    return { data: null, error: err };
  }
};

/*
  -----------------------------
  FUNÇÕES: GASTOS (vehicle_expenses)
  -----------------------------
*/

export const getExpensesByCar = async (carId) => {
  try {
    const { data, error } = await supabase.from('vehicle_expenses').select('*').eq('car_id', carId).order('incurred_at', { ascending: false });
    if (error) {
      console.error('Erro ao buscar gastos por carro:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Erro inesperado getExpensesByCar:', err);
    return [];
  }
};

export const addExpense = async (expense) => {
  try {
    const { data, error } = await supabase.from('vehicle_expenses').insert([expense]).select().single();
    if (error) {
      console.error('Erro ao adicionar gasto:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Erro inesperado addExpense:', err);
    return { data: null, error: err };
  }
};

export const updateExpense = async (id, patch) => {
  try {
    const { data, error } = await supabase.from('vehicle_expenses').update(patch).eq('id', id).select().single();
    if (error) {
      console.error('Erro ao atualizar gasto:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Erro inesperado updateExpense:', err);
    return { data: null, error: err };
  }
};

export const deleteExpense = async (id) => {
  try {
    const { data, error } = await supabase.from('vehicle_expenses').delete().eq('id', id);
    if (error) {
      console.error('Erro ao deletar gasto:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Erro inesperado deleteExpense:', err);
    return { data: null, error: err };
  }
};

/*
  -----------------------------
  FUNÇÕES: CHECKLIST (vehicle_checklists)
  -----------------------------
*/

export const getChecklistByCar = async (carId) => {
  try {
    const { data, error } = await supabase.from('vehicle_checklists').select('*').eq('car_id', carId).order('created_at', { ascending: true });
    if (error) {
      console.error('Erro ao buscar checklist:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Erro inesperado getChecklistByCar:', err);
    return [];
  }
};

export const updateChecklistItem = async (id, patch) => {
  try {
    const { data, error } = await supabase.from('vehicle_checklists').update(patch).eq('id', id).select().single();
    if (error) {
      console.error('Erro ao atualizar checklist:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Erro inesperado updateChecklistItem:', err);
    return { data: null, error: err };
  }
};

export const addChecklistItem = async (item) => {
  try {
    const { data, error } = await supabase.from('vehicle_checklists').insert([item]).select().single();
    if (error) {
      console.error('Erro ao adicionar item de checklist:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Erro inesperado addChecklistItem:', err);
    return { data: null, error: err };
  }
};

export const deleteChecklistItem = async (id) => {
  try {
    const { data, error } = await supabase.from('vehicle_checklists').delete().eq('id', id);
    if (error) {
      console.error('Erro ao deletar item checklist:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Erro inesperado deleteChecklistItem:', err);
    return { data: null, error: err };
  }
};

/*
  -----------------------------
  FUNÇÕES UTILITÁRIAS: BUSCAS EM BULK (para resumo na listagem)
  -----------------------------
*/

export const getPublicationsForCars = async (carIds = []) => {
  if (!Array.isArray(carIds) || carIds.length === 0) return [];
  try {
    const { data, error } = await supabase.from('vehicle_publications').select('*').in('car_id', carIds);
    if (error) {
      console.error('Erro ao buscar publicações (bulk):', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Erro inesperado getPublicationsForCars:', err);
    return [];
  }
};

export const getExpensesForCars = async (carIds = []) => {
  if (!Array.isArray(carIds) || carIds.length === 0) return [];
  try {
    const { data, error } = await supabase.from('vehicle_expenses').select('*').in('car_id', carIds);
    if (error) {
      console.error('Erro ao buscar gastos (bulk):', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Erro inesperado getExpensesForCars:', err);
    return [];
  }
};

