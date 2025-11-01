// src/pages/Checklist.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const STATUS = ['OK', 'RD', 'AD', 'DD', 'QD', 'FT'];

const BLOCO_EXTERNO = [
  'Teto',
  'Capô',
  'Para-choque dianteiro',
  'Paralama dianteiro direito',
  'Porta dianteira direita',
  'Porta traseira direita',
  'Coluna traseira direita',
  'Tampa porta-malas',
  'Para-choque traseiro',
  'Coluna traseira esquerda',
  'Porta traseira esquerda',
  'Porta dianteira esquerda',
  'Paralama dianteiro esquerdo',
  'Retrovisores',
  'Vidros',
  'Teto solar',
  'Rodas',
  'Pneus dianteiros',
  'Pneus traseiros',
  'Calotas',
  'Faróis',
  'Lanternas',
];

const BLOCO_INTERNO = [
  'Documentação',
  'IPVA',
  'Histórico de manutenção',
  'Revisões concessionária',
  'Manual',
  'Chave reserva',
  'Único dono',
  'Estepe / triângulo',
  'Macaco / chave de rodas',
  'Tapetes',
  'Bancos',
  'Forros de porta',
  'Tapeçaria teto',
  'Cinto de segurança',
  'Volante',
  'Manopla / câmbio / freio',
  'Pedais',
  'Extintor',
  'Som',
  'Multimídia',
  'Buzina',
  'Ar-condicionado',
  'Parte elétrica',
  'Trava / alarme',
  'Motor',
  'Câmbio',
  'Suspensão',
  'Freios / embreagem',
];

const Checklist = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const carParam = searchParams.get('car') || '';

  const [cars, setCars] = useState([]);
  const [carId, setCarId] = useState(carParam);
  const [car, setCar] = useState(null);

  const [itens, setItens] = useState({});
  const [observacoes, setObservacoes] = useState('');
  const [tipo, setTipo] = useState('compra');
  const [nivel, setNivel] = useState('50%');
  const [salvando, setSalvando] = useState(false);
  const [checklistId, setChecklistId] = useState(null); // 👈 pra saber se é insert ou update

  // carrega carros
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) setCars(data || []);
    })();
  }, []);

  // quando troca o carro -> carrega checklist dele
  useEffect(() => {
    if (!carId) {
      setCar(null);
      setChecklistId(null);
      return;
    }
    const found = (cars || []).find((c) => c.id === carId);
    setCar(found || null);

    (async () => {
      const { data, error } = await supabase
        .from('vehicle_checklists')
        .select('*')
        .eq('car_id', carId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setChecklistId(data.id);
        setItens(data.items || {});
        setObservacoes(data.observacoes || '');
        setTipo(data.tipo || 'compra');
        setNivel(data.nivel_combustivel || '50%');
      } else {
        // não tem, começa limpo
        setChecklistId(null);
        setItens({});
        setObservacoes('');
        setTipo('compra');
        setNivel('50%');
      }
    })();
  }, [carId, cars]);

  const marcar = (nome, valor) => {
    setItens((prev) => ({ ...prev, [nome]: valor }));
  };

  const salvar = async () => {
    if (!carId) return;
    setSalvando(true);

    const payload = {
      car_id: carId,
      items: itens,
      observacoes,
      tipo,
      nivel_combustivel: nivel,
    };

    let error = null;

    if (checklistId) {
      // UPDATE
      const { error: e } = await supabase
        .from('vehicle_checklists')
        .update(payload)
        .eq('id', checklistId);
      error = e;
    } else {
      // INSERT
      const { data, error: e } = await supabase
        .from('vehicle_checklists')
        .insert(payload)
        .select()
        .single();
      error = e;
      if (!e && data) setChecklistId(data.id);
    }

    setSalvando(false);
    if (!error) {
      alert('Checklist salvo!');
    } else {
      console.error(error);
      alert('Erro ao salvar checklist');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="sticky top-0 z-40 bg-slate-50/90 backdrop-blur border-b flex items-center gap-3 px-4 py-3">
        <h1 className="text-base md:text-lg font-bold text-slate-900 flex-1">
          Checklist de veículo
        </h1>
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard')}
          className="text-xs md:text-sm"
        >
          Voltar
        </Button>
      </div>

      <div className="max-w-5xl mx-auto mt-4 px-4 space-y-4">
        <div className="bg-white rounded-2xl border shadow-sm p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <p className="text-xs uppercase text-slate-500 mb-1">
              Selecione o veículo
            </p>
            <select
              value={carId}
              onChange={(e) => {
                setCarId(e.target.value);
                navigate(`/dashboard/checklist?car=${e.target.value}`);
              }}
              className="w-full md:w-80 border rounded-lg px-3 py-2 bg-slate-50 text-sm"
            >
              <option value="">-- escolher --</option>
              {cars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.brand} {c.model} {c.year ? `(${c.year})` : ''} — {c.plate || 'sem placa'}
                </option>
              ))}
            </select>
            {car && (
              <p className="text-xs text-slate-500 mt-2">
                FIPE:{' '}
                <b>
                  {car.fipe_value
                    ? `R$ ${Number(car.fipe_value).toLocaleString('pt-BR')}`
                    : '—'}
                </b>{' '}
                • Anúncio:{' '}
                <b>
                  {car.price
                    ? `R$ ${Number(car.price).toLocaleString('pt-BR')}`
                    : '—'}
                </b>
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="border rounded-lg px-3 py-2 bg-slate-50 text-sm"
            >
              <option value="compra">Compra</option>
              <option value="assessoria">Assessoria</option>
              <option value="entrega">Entrega</option>
            </select>
            <select
              value={nivel}
              onChange={(e) => setNivel(e.target.value)}
              className="border rounded-lg px-3 py-2 bg-slate-50 text-sm"
            >
              <option value="25%">25%</option>
              <option value="50%">50%</option>
              <option value="75%">75%</option>
              <option value="100%">100%</option>
            </select>
          </div>
        </div>

        {carId ? (
          <>
            <div className="bg-white rounded-2xl border shadow-sm p-3 text-xs text-slate-500">
              LEGENDA: <b>OK</b> = Estado adequado • <b>RD</b> = Riscado • <b>AD</b> = Amassado •{' '}
              <b>DD</b> = Danificado • <b>QD</b> = Quebrado • <b>FT</b> = Falta
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border shadow-sm p-3 space-y-2">
                <p className="text-sm font-semibold text-slate-900 mb-1">Parte externa</p>
                {BLOCO_EXTERNO.map((nome) => (
                  <div key={nome} className="flex items-center justify-between gap-2">
                    <span className="text-sm text-slate-800 w-44">{nome}</span>
                    <div className="flex gap-1 overflow-x-auto">
                      {STATUS.map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => marcar(nome, st)}
                          className={`px-2 py-1 rounded text-xs whitespace-nowrap ${
                            itens[nome] === st
                              ? st === 'OK'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border shadow-sm p-3 space-y-2">
                <p className="text-sm font-semibold text-slate-900 mb-1">Documentos / interno</p>
                {BLOCO_INTERNO.map((nome) => (
                  <div key={nome} className="flex items-center justify-between gap-2">
                    <span className="text-sm text-slate-800 w-48">{nome}</span>
                    <div className="flex gap-1 overflow-x-auto">
                      {STATUS.map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => marcar(nome, st)}
                          className={`px-2 py-1 rounded text-xs whitespace-nowrap ${
                            itens[nome] === st
                              ? st === 'OK'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border shadow-sm p-4 space-y-2">
              <label className="text-sm text-slate-700">Observações / pendências</label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50"
                placeholder="Ex.: risco porta dir., faltando estepe, dono vai mandar chave reserva..."
              />
              <div className="flex justify-end">
                <Button
                  onClick={salvar}
                  className="bg-yellow-400 text-black hover:bg-yellow-500 font-semibold"
                  disabled={salvando}
                >
                  {salvando ? 'Salvando...' : 'Salvar checklist'}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl border shadow-sm p-8 text-center text-slate-400">
            Selecione um veículo acima para começar.
          </div>
        )}
      </div>
    </div>
  );
};

export default Checklist;

