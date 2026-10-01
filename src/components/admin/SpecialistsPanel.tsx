import React from 'react';
import { Plus } from 'lucide-react';
import { apiService } from '../../data/api';

interface SpecialistsPanelProps {
  specialists: any[];
  editingSpecialist: any | null;
  setSpecialists: React.Dispatch<React.SetStateAction<any[]>>;
  setEditingSpecialist: React.Dispatch<React.SetStateAction<any | null>>;
  addSpecialist: () => Promise<void>;
}

const SpecialistsPanel: React.FC<SpecialistsPanelProps> = ({ specialists, editingSpecialist, setSpecialists, setEditingSpecialist, addSpecialist }) => (

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-display text-2xl font-bold text-[#082D05]">Equipo de Especialistas</h2>
              <button
                onClick={addSpecialist}
                className="px-4 py-2 bg-[#082D05] text-[#F7F8EF] text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-[#176B00]"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Especialista</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {specialists.map(spec => (
                <div key={spec.id} className="bg-white rounded-2xl border border-[#8CFF00]/30 p-6 space-y-4">
                  <div className="text-4xl text-center mb-3">{spec.photo}</div>
                  {editingSpecialist?.id === spec.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editingSpecialist.name}
                        onChange={(e) => setEditingSpecialist({...editingSpecialist, name: e.target.value})}
                        placeholder="Nombre"
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        value={editingSpecialist.role}
                        onChange={(e) => setEditingSpecialist({...editingSpecialist, role: e.target.value})}
                        placeholder="Cargo"
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            const saved = await apiService.updateSpecialist(editingSpecialist.id, editingSpecialist);
                            if (saved?.success) {
                              setSpecialists(prev => prev.map(s => s.id === editingSpecialist.id ? editingSpecialist : s));
                              setEditingSpecialist(null);
                            }
                          }}
                          className="flex-1 px-3 py-2 bg-[#082D05] text-[#F7F8EF] rounded-lg text-xs font-bold hover:bg-[#176B00]"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingSpecialist(null)}
                          className="flex-1 px-3 py-2 bg-neutral-200 text-neutral-700 rounded-lg text-xs font-bold"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h3 className="font-bold text-[#082D05] text-center">{spec.name}</h3>
                        <p className="text-xs text-neutral-500 text-center">{spec.role}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingSpecialist(spec)}
                          className="flex-1 px-3 py-2 bg-neutral-100 text-[#082D05] rounded-lg text-xs font-bold hover:bg-neutral-200"
                        >
                          Editar
                        </button>
                        <button
                          onClick={async () => {
                            const deleted = await apiService.deleteSpecialist(spec.id);
                            if (deleted?.success) setSpecialists(prev => prev.filter(s => s.id !== spec.id));
                          }}
                          className="flex-1 px-3 py-2 bg-rose-100 text-rose-700 rounded-lg text-xs font-bold hover:bg-rose-200"
                        >
                          Eliminar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
);

export default SpecialistsPanel;
