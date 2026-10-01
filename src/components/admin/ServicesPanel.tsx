import React from 'react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { apiService } from '../../data/api';

interface ServicesPanelProps {
  services: any[];
  editingService: any | null;
  setServices: React.Dispatch<React.SetStateAction<any[]>>;
  setEditingService: React.Dispatch<React.SetStateAction<any | null>>;
  addService: () => Promise<void>;
}

const ServicesPanel: React.FC<ServicesPanelProps> = ({ services, editingService, setServices, setEditingService, addService }) => (

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-display text-2xl font-bold text-[#082D05]">Servicios & Precios</h2>
              <button
                onClick={addService}
                className="px-4 py-2 bg-[#082D05] text-[#F7F8EF] text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-[#176B00]"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Servicio</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#8CFF00]/25 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-[#F7F8EF] border-b border-neutral-200 text-[#082D05] uppercase font-semibold">
                    <tr>
                      <th className="p-4 text-left">Servicio</th>
                      <th className="p-4 text-center">Duración (min)</th>
                      <th className="p-4 text-center">Precio (€)</th>
                      <th className="p-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {services.map(svc => (
                      <tr key={svc.id} className="hover:bg-neutral-50">
                        <td className="p-4">
                          {editingService?.id === svc.id ? (
                            <input
                              type="text"
                              value={editingService.name}
                              onChange={(e) => setEditingService({...editingService, name: e.target.value})}
                              className="px-3 py-2 border border-neutral-300 rounded-lg text-xs w-full"
                            />
                          ) : (
                            <span className="font-semibold text-[#082D05]">{svc.name}</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {editingService?.id === svc.id ? (
                            <input
                              type="number"
                              value={editingService.duration}
                              onChange={(e) => setEditingService({...editingService, duration: parseInt(e.target.value)})}
                              className="px-3 py-2 border border-neutral-300 rounded-lg text-xs w-20 mx-auto"
                            />
                          ) : (
                            svc.duration == null ? '-' : svc.duration
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {editingService?.id === svc.id ? (
                            <input
                              type="number"
                              value={editingService.price}
                              onChange={(e) => setEditingService({...editingService, price: parseFloat(e.target.value)})}
                              className="px-3 py-2 border border-neutral-300 rounded-lg text-xs w-20 mx-auto"
                            />
                          ) : (
                            <span className="font-bold text-[#8CFF00]">{svc.price}€</span>
                          )}
                        </td>
                        <td className="p-4 text-center space-x-2">
                          {editingService?.id === svc.id ? (
                            <>
                              <button
                                onClick={async () => {
                                  const saved = await apiService.updateService(editingService.id, editingService);
                                  if (saved?.success) {
                                    setServices(prev => prev.map(s => s.id === editingService.id ? editingService : s));
                                    setEditingService(null);
                                  }
                                }}
                                className="px-2 py-1 bg-[#082D05] text-[#F7F8EF] rounded text-[10px] font-bold hover:bg-[#176B00]"
                              >
                                Guardar
                              </button>
                              <button
                                onClick={() => setEditingService(null)}
                                className="px-2 py-1 bg-neutral-200 text-neutral-700 rounded text-[10px] font-bold hover:bg-neutral-300"
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditingService(svc)}
                                className="px-2 py-1 bg-neutral-100 text-[#082D05] rounded text-[10px] font-bold hover:bg-neutral-200"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={async () => {
                                  const deleted = await apiService.deleteService(svc.id);
                                  if (deleted?.success) setServices(prev => prev.filter(s => s.id !== svc.id));
                                }}
                                className="px-2 py-1 bg-rose-100 text-rose-700 rounded text-[10px] font-bold hover:bg-rose-200"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
);

export default ServicesPanel;
