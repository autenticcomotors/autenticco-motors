// src/pages/Checklist.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  getCars,
  getVehicleChecklists,
  addVehicleChecklist,
  updateVehicleChecklist,
  getLatestChecklistTemplate,
} from '@/lib/car-api';
import VehicleChecklistForm from '@/components/VehicleChecklistForm';

const moneyBR = (n) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n || 0));

const ChecklistPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const selectedCarId = params.get('car') || '';
  const selectedChecklistId = params.get('checklist') || '';

  const [cars, setCars] = useState([]);
  const [car, setCar] = useState(null);
  const [checklists, setChecklists] = useState([]);
  const [editingChecklist, setEditingChecklist] = useState(null);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  // carrega carros + template
  useEffect(() => {
    (async () => {
      setLoading(true);
      const [cs, tpl] = await Promise.all([
        getCars({ includeSold: false }),
        getLatestChecklistTemplate(),
      ]);
      setCars(cs || []);
      setTemplate(tpl?.data || null);
      setLoading(false);
    })();
  }, []);

  // quando tiver carId na url, busca checklists
  useEffect(() => {
    if (!selectedCarId) {
      setCar(null);
      setChecklists([]);
      setEditingChecklist(null);
      return;
    }
    const found = (cars || []).find((c) => c.id === selectedCarId);
    setCar(found || null);
    if (found) {
      (async () => {
        const v = await getVehicleChecklists(found.id);
        setChecklists(v || []);
        if (selectedChecklistId) {
          const ck = (v || []).find((x) => x.id === selectedChecklistId);
          setEditingChecklist(ck || null);
        } else {
          setEditingChecklist(null);
        }
      })();
    }
  }, [selectedCarId, cars, selectedChecklistId]);

  const handleSelectCar = (id) => {
    navigate(`/dashboard/checklist?car=${id}`);
  };

  const handleSaveChecklist = async (payload, checklistId = null) => {
    if (!car) return;
    if (checklistId) {
      await updateVehicleChecklist(checklistId, payload);
    } else {
      await addVehicleChecklist(payload);
    }
    const v = await getVehicleChecklists(car.id);
    setChecklists(v || []);
    setEditingChecklist(null);
    navigate(`/dashboard/checklist?car=${car.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-600">
        Carregando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* topo fixo */}
      <header className="w-full bg-white border-b px-4 py-3 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Checklist de Vistoria</h1>
          <p className="text-xs text-gray-500">
            Selecione um veículo e preencha. Página feita para celular. 📱
          </p>
        </div>
        <a
          href="/dashboard"
          className="text-xs px-3 py-1 rounded bg-yellow-400 text-black font-semibold"
        >
          Voltar ao painel
        </a>
      </header>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* coluna de veículos */}
        <aside className="w-full md:w-72 border-r bg-white max-h-[calc(100vh-56px)] overflow-y-auto">
          <div className="p-3">
            <p className="text-xs text-gray-500 mb-2">Veículos em estoque</p>
            <div className="space-y-2">
              {cars.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCar(c.id)}
                  className={`w-full text-left p-3 rounded-lg border ${
                    selectedCarId === c.id ? 'border-yellow-400 bg-yellow-50' : 'border-gray-100'
                  }`}
                >
                  <p className="text-sm font-semibold">
                    {c.brand} {c.model}
                  </p>
                  <p className="text-xs text-gray-500 flex gap-1">
                    {c.year} • {c.plate || 'sem placa'}
                  </p>
                  {c.fipe_value ? (
                    <p className="text-xs text-gray-600">{moneyBR(c.fipe_value)}</p>
                  ) : null}
                </button>
              ))}
              {cars.length === 0 && (
                <p className="text-xs text-gray-400">Nenhum veículo em estoque.</p>
              )}
            </div>
          </div>
        </aside>

        {/* área do formulário */}
        <main className="flex-1 p-3 flex flex-col gap-3 max-h-[calc(100vh-56px)]">
          {!car && (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Selecione um veículo ao lado.
            </div>
          )}

          {car && (
            <>
              {/* lista de checklists já feitos */}
              <div className="bg-white rounded-xl border p-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-900">
                    Checklists deste veículo ({checklists.length})
                  </h2>
                  <button
                    onClick={() => setEditingChecklist(null)}
                    className="text-xs px-3 py-1 rounded bg-yellow-400 text-black font-semibold"
                  >
                    + Novo checklist
                  </button>
                </div>
                <div className="mt-2 flex gap-2 flex-wrap">
                  {checklists.map((ck) => (
                    <button
                      key={ck.id}
                      onClick={() =>
                        navigate(`/dashboard/checklist?car=${car.id}&checklist=${ck.id}`)
                      }
                      className={`text-xs px-3 py-1 rounded border ${
                        selectedChecklistId === ck.id
                          ? 'border-yellow-400 bg-yellow-50'
                          : 'border-gray-200'
                      }`}
                    >
                      {new Date(ck.filled_at).toLocaleString('pt-BR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}{' '}
                      — {ck.inspector_name || 'sem nome'}
                    </button>
                  ))}
                  {checklists.length === 0 && (
                    <p className="text-xs text-gray-400">Nenhum checklist ainda.</p>
                  )}
                </div>
              </div>

              {/* formulário */}
              <div className="flex-1 min-h-0">
                <VehicleChecklistForm
                  car={car}
                  initialData={editingChecklist}
                  templateFromDb={template}
                  onCancel={() => {
                    setEditingChecklist(null);
                    navigate(`/dashboard/checklist?car=${car.id}`);
                  }}
                  onSave={handleSaveChecklist}
                  showClose={false}
                />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ChecklistPage;

