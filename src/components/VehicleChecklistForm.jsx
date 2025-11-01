// src/components/VehicleChecklistForm.jsx
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const STATUS = [
  { code: 'OK', label: 'OK' },
  { code: 'RD', label: 'RD' }, // riscado
  { code: 'AD', label: 'AD' }, // amassado
  { code: 'DD', label: 'DD' }, // danificado
  { code: 'QD', label: 'QD' }, // quebrado
  { code: 'FT', label: 'FT' }, // falta
];

// template padrão baseado no print enviado
const DEFAULT_TEMPLATE = [
  {
    group: 'Identificação / Documentos',
    items: [
      { key: 'marca', label: 'MARCA' },
      { key: 'modelo', label: 'MODELO' },
      { key: 'placa', label: 'PLACA' },
      { key: 'ano', label: 'ANO' },
      { key: 'cor', label: 'COR' },
      { key: 'km', label: 'KM' },
      { key: 'fipe', label: 'FIPE' },
      { key: 'doc', label: 'DOCUMENTAÇÃO' },
      { key: 'ipva', label: 'IPVA' },
      { key: 'historico_manut', label: 'HISTÓRICO DE MANU' },
      { key: 'revisoes_conc', label: 'REVISÕES CONCESS.' },
      { key: 'manual', label: 'MANUAL' },
      { key: 'chave_reserva', label: 'CHAVE RESERVA' },
      { key: 'unico_dono', label: 'ÚNICO DONO' },
    ],
  },
  {
    group: 'Lataria / Externo',
    items: [
      { key: 'teto', label: 'TETO' },
      { key: 'capo', label: 'CAPÔ' },
      { key: 'parachoque_diant', label: 'PARA-CHOQUE DIANTEIRO' },
      { key: 'paralama_diant_dir', label: 'PARA-LAMA DIANT. DIREITO' },
      { key: 'porta_diant_dir', label: 'PORTA DIANTEIRA DIREITA' },
      { key: 'porta_traseira_dir', label: 'PORTA TRASEIRA DIREITA' },
      { key: 'coluna_traseira_dir', label: 'COLUNA TRASEIRA DIREITA' },
      { key: 'tampa_porta_malas', label: 'TAMPA PORTA MALAS' },
      { key: 'parachoque_tras', label: 'PARA-CHOQUE TRASEIRO' },
      { key: 'coluna_traseira_esq', label: 'COLUNA TRASEIRA ESQUERDA' },
      { key: 'porta_traseira_esq', label: 'PORTA TRASEIRA ESQUERDA' },
      { key: 'porta_diant_esq', label: 'PORTA DIANTEIRA ESQUERDA' },
      { key: 'paralama_diant_esq', label: 'PARA-LAMA DIANT. ESQUERDO' },
      { key: 'retrovisores', label: 'RETROVISORES' },
      { key: 'vidros', label: 'VIDROS' },
      { key: 'teto_solar', label: 'TETO SOLAR' },
      { key: 'rodas', label: 'RODAS' },
      { key: 'pneus_diant', label: 'PNEUS DIANTEIROS' },
      { key: 'pneus_tras', label: 'PNEUS TRASEIROS' },
      { key: 'calotas', label: 'CALOTAS' },
      { key: 'farois', label: 'FARÓIS' },
      { key: 'lanternas', label: 'LANTERNAS' },
      { key: 'reparo_pintura', label: 'RETOQUE PINTURA' },
    ],
  },
  {
    group: 'Interior / Itens',
    items: [
      { key: 'estepe_triangulo', label: 'ESTEPE / TRIÂNGULO' },
      { key: 'macaco_chaves', label: 'MACACO / CHAVE DE RODAS' },
      { key: 'tapetes', label: 'TAPETES' },
      { key: 'bancos', label: 'BANCOS' },
      { key: 'forros_porta', label: 'FORROS DE PORTA' },
      { key: 'tapecaria_teto', label: 'TAPEÇARIA TETO' },
      { key: 'cinto_seguranca', label: 'CINTO DE SEGURANÇA' },
      { key: 'volante', label: 'VOLANTE' },
      { key: 'manopla', label: 'MANOPLA CÂMBIO/FREIO' },
      { key: 'pedais', label: 'PEDAIS' },
      { key: 'extintor', label: 'EXTINTOR' },
      { key: 'som', label: 'SOM' },
      { key: 'multimidia', label: 'MULTIMÍDIA' },
      { key: 'buzina', label: 'BUZINA' },
      { key: 'ar_condicionado', label: 'AR CONDICIONADO' },
    ],
  },
  {
    group: 'Mecânica / Elétrica',
    items: [
      { key: 'parte_eletrica', label: 'PARTE ELÉTRICA' },
      { key: 'travas_alarme', label: 'TRAVAS / ALARME' },
      { key: 'motor', label: 'MOTOR' },
      { key: 'cambio', label: 'CÂMBIO' },
      { key: 'direcao', label: 'CAIXA DE DIREÇÃO' },
      { key: 'suspensao', label: 'SUSPENSÃO' },
      { key: 'freios', label: 'FREIOS / EMBREAGEM' },
    ],
  },
];

const VehicleChecklistForm = ({
  car,
  initialData = null,
  onCancel = () => {},
  onSave = () => {},
  templateFromDb = null,
}) => {
  const tpl = templateFromDb?.template || DEFAULT_TEMPLATE;

  // monta estado inicial
  const buildInitialState = () => {
    if (initialData && initialData.data) {
      return initialData.data;
    }
    const obj = {};
    tpl.forEach((group) => {
      group.items.forEach((item) => {
        obj[item.key] = null;
      });
    });
    return obj;
  };

  const [statusMap, setStatusMap] = useState(buildInitialState);
  const [fuel, setFuel] = useState(initialData?.fuel_level ?? 50);
  const [inspector, setInspector] = useState(initialData?.inspector_name || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSetStatus = (itemKey, code) => {
    setStatusMap((prev) => ({
      ...prev,
      [itemKey]: prev[itemKey] === code ? null : code,
    }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = {
        car_id: car.id,
        inspector_name: inspector || null,
        fuel_level: fuel,
        notes: notes || null,
        data: statusMap,
      };
      await onSave(payload, initialData?.id || null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 flex justify-center items-center">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl">
        {/* topo */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-yellow-400 to-yellow-300">
          <div>
            <p className="text-xs uppercase tracking-wide text-black/80">Checklist de veículo</p>
            <h2 className="text-lg font-bold text-black">
              {car.brand} {car.model} {car.year ? `(${car.year})` : ''}
            </h2>
            <p className="text-xs text-black/70">
              Placa: {car.plate || '-'} • FIPE:{' '}
              {car.fipe_value
                ? new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(car.fipe_value)
                : '—'}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-black" />
          </button>
        </div>

        {/* corpo scrollável */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* dados rápidos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Vistoriador</label>
              <input
                value={inspector}
                onChange={(e) => setInspector(e.target.value)}
                placeholder="Quem vistoriou"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                Nível de combustível
              </label>
              <select
                value={fuel}
                onChange={(e) => setFuel(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value={25}>25%</option>
                <option value={50}>50%</option>
                <option value={75}>75%</option>
                <option value={100}>100%</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                Observações gerais
              </label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: riscos leves no para-choque dianteiro..."
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* grupos */}
          {tpl.map((group) => (
            <div key={group.group} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-800">{group.group}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {group.items.map((item) => (
                  <div
                    key={item.key}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 bg-white rounded-xl p-3 border"
                  >
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    <div className="flex gap-1 flex-wrap">
                      {STATUS.map((st) => (
                        <button
                          key={st.code}
                          type="button"
                          onClick={() => handleSetStatus(item.key, st.code)}
                          className={`text-xs px-2 py-1 rounded-md border ${
                            statusMap[item.key] === st.code
                              ? st.code === 'OK'
                                ? 'bg-emerald-500 text-white border-emerald-500'
                                : 'bg-black text-white border-black'
                              : 'bg-gray-50 text-gray-700 border-gray-200'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* legenda */}
          <div className="text-xs text-gray-500">
            <strong>LEGENDA:</strong> OK = Estado adequado | RD = Riscado | AD = Amassado | DD =
            Danificado | QD = Quebrado | FT = Falta
          </div>
        </div>

        {/* footer */}
        <div className="p-4 border-t bg-white flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-yellow-400 text-black text-sm font-bold disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Salvar checklist'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleChecklistForm;

