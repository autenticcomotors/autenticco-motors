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
        // Converte a data de início para o início do dia (00:00:00) no fuso local
        const startDate = new Date(filters.startDate);
        startDate.setUTCHours(0, 0, 0, 0); // Usa UTC para consistência
        query = query.gte('created_at', startDate.toISOString());
    }
    if (filters.endDate) {
        // Converte a data de fim para o final do dia (23:59:59) no fuso local
        const endDate = new Date(filters.endDate);
        endDate.setUTCHours(23, 59, 59, 999); // Usa UTC para consistência
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
