// lib/car-api.js
import { supabase } from './supabase';

// --- FUNÇÕES DE CARROS ---

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

// --- FUNÇÕES DE DEPOIMENTOS ---

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

// --- FUNÇÕES DE LEADS ---

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
    
    // Lógica de data robusta que respeita o fuso horário
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

/* ======================================================
   Novas funções: plataformas + marcação de venda (sales)
   ====================================================== */

/**
 * Buscar plataformas (OLX, Webmotors, MercadoLivre...)
 */
export const getPlatforms = async () => {
    const { data, error } = await supabase.from('platforms').select('*').order('name', { ascending: true });
    if (error) console.error('Erro ao buscar plataformas:', error);
    return data || [];
};

/**
 * Criar nova plataforma (nome único)
 */
export const addPlatform = async (name) => {
    if (!name || String(name).trim().length < 1) {
        console.error('Nome de plataforma inválido');
        return null;
    }
    const { data, error } = await supabase.from('platforms').insert([{ name: String(name).trim() }]).select().single();
    if (error) {
        console.error('Erro ao criar plataforma:', error);
        return null;
    }
    return data;
};

/**
 * Marcar carro como vendido.
 * salePayload: {
 *   car_id, platform_id, sale_price, sale_date,
 *   fipe_value, ipva, platform_fee, commission, other_costs, return_to_seller, profit, notes
 * }
 *
 * Retorna { data: saleRecord } em caso de sucesso, ou { error } em caso de erro.
 */
export const markCarAsSold = async (salePayload) => {
    const {
        car_id, platform_id = null, sale_price = null, sale_date = null,
        fipe_value = null, ipva = null, platform_fee = null, commission = null, other_costs = null, return_to_seller = null, profit = null, notes = null
    } = salePayload || {};

    if (!car_id) {
        const err = new Error('car_id é obrigatório para marcar venda');
        console.error(err);
        return { error: err };
    }

    try {
        // 1) Atualiza cars
        const { data: updatedCar, error: errUpdate } = await supabase
            .from('cars')
            .update({
                is_sold: true,
                sold_at: sale_date || new Date().toISOString(),
                sold_platform_id: platform_id || null,
                sale_price: sale_price || null
            })
            .eq('id', car_id)
            .select()
            .single();

        if (errUpdate) {
            console.error('Erro ao atualizar cars:', errUpdate);
            return { error: errUpdate };
        }

        // 2) Insere histórico em sales
        const { data: saleRecord, error: errInsert } = await supabase
            .from('sales')
            .insert([{
                car_id,
                platform_id: platform_id || null,
                sale_price: sale_price || null,
                sale_date: sale_date || new Date().toISOString(),
                fipe_value,
                ipva,
                platform_fee,
                commission,
                other_costs,
                return_to_seller,
                profit,
                notes
            }])
            .select()
            .single();

        if (errInsert) {
            console.error('Erro ao inserir em sales. Tentando reverter atualização em cars...', errInsert);
            // tenta reverter a atualização para manter consistência
            try {
                await supabase.from('cars').update({
                    is_sold: false,
                    sold_at: null,
                    sold_platform_id: null,
                    sale_price: null
                }).eq('id', car_id);
            } catch (revertErr) {
                console.error('Falha ao reverter atualização em cars:', revertErr);
            }
            return { error: errInsert };
        }

        return { data: saleRecord };
    } catch (err) {
        console.error('Erro inesperado em markCarAsSold:', err);
        return { error: err };
    }
};

/**
 * Desmarcar carro como vendido.
 * options: { deleteLastSale: boolean } - se true, tenta apagar o último registro de sale desse carro.
 * Retorna { data: true } ou { error }.
 */
export const unmarkCarAsSold = async (carId, options = { deleteLastSale: false }) => {
    if (!carId) {
        const err = new Error('carId é obrigatório');
        console.error(err);
        return { error: err };
    }

    try {
        // 1) Atualiza cars para reverter flags de venda
        const { error: errUpdate } = await supabase
            .from('cars')
            .update({
                is_sold: false,
                sold_at: null,
                sold_platform_id: null,
                sale_price: null
            })
            .eq('id', carId);

        if (errUpdate) {
            console.error('Erro ao desmarcar carro como vendido:', errUpdate);
            return { error: errUpdate };
        }

        // 2) Opcional: apagar o último registro de venda
        if (options.deleteLastSale) {
            try {
                const { data: lastSale, error: errLast } = await supabase
                    .from('sales')
                    .select('*')
                    .eq('car_id', carId)
                    .order('sale_date', { ascending: false })
                    .limit(1)
                    .single();

                if (errLast && errLast.code !== 'PGRST116') { // ignore "no rows" behavior
                    console.error('Erro ao buscar última sale:', errLast);
                } else if (lastSale && lastSale.id) {
                    const { error: errDel } = await supabase.from('sales').delete().eq('id', lastSale.id);
                    if (errDel) {
                        console.error('Erro ao deletar último sale:', errDel);
                        // não falha o processo principal, apenas reporta
                        return { error: errDel };
                    }
                }
            } catch (err) {
                console.error('Erro inesperado ao tentar apagar último sale:', err);
                return { error: err };
            }
        }

        return { data: true };
    } catch (err) {
        console.error('Erro inesperado em unmarkCarAsSold:', err);
        return { error: err };
    }
};

