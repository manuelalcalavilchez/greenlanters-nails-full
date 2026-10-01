import React from 'react';
import { Filter } from 'lucide-react';

interface AppointmentsPanelProps {
  appointments: any[];
  filteredAppointments: any[];
  specialists: any[];
  services: any[];
  selectedTech: string;
  totalBilling: number;
  completedCount: number;
  setSelectedTech: any;
  updateAppointmentStatus: any;
}

const AppointmentsPanel: React.FC<AppointmentsPanelProps> = ({ appointments, filteredAppointments, specialists, services, selectedTech, totalBilling, completedCount, setSelectedTech, updateAppointmentStatus }) => (

          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-[#8CFF00]/30 shadow-sm">
                <span className="text-xs font-semibold text-neutral-500 block mb-1">Facturación Acumulada</span>
                <span className="font-display text-3xl font-bold text-[#082D05]">{totalBilling}€</span>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-[#8CFF00]/30 shadow-sm">
                <span className="text-xs font-semibold text-neutral-500 block mb-1">Citas Totales</span>
                <span className="font-display text-3xl font-bold text-[#082D05]">{appointments.length}</span>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-[#8CFF00]/30 shadow-sm">
                <span className="text-xs font-semibold text-neutral-500 block mb-1">Citas Completadas</span>
                <span className="font-display text-3xl font-bold text-[#8CFF00]">{completedCount}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              <span className="text-xs font-semibold text-[#082D05] flex items-center gap-1.5 shrink-0">
                <Filter className="w-3.5 h-3.5" /> Filtrar:
              </span>
              {[{ id: 'all', name: 'Todas' }, ...specialists.map(s => ({ id: s.id, name: s.name }))].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTech(t.id)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all shrink-0 ${
                    selectedTech === t.id ? 'bg-[#082D05] text-[#F7F8EF] border-[#082D05]' : 'bg-white text-[#082D05] border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-3xl border border-[#8CFF00]/25 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F8EF] border-b border-neutral-200 text-[#082D05] uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="p-4">Localizador</th>
                      <th className="p-4">Cliente</th>
                      <th className="p-4">Servicios</th>
                      <th className="p-4">Especialista</th>
                      <th className="p-4">Fecha & Hora</th>
                      <th className="p-4">Total</th>
                      <th className="p-4">Estado</th>
                      <th className="p-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredAppointments.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-neutral-400">
                          No hay citas con este filtro.
                        </td>
                      </tr>
                    ) : (
                      filteredAppointments.map((appt) => {
                        const staffObj = specialists.find(s => s.id === appt.specialistId);
                        const serviceNames = appt.serviceIds.map((id: string) => services.find(s => s.id === id)?.name).join(', ');

                        return (
                          <tr key={appt.id} className="hover:bg-neutral-50/50 transition-colors">
                            <td className="p-4 font-mono font-bold text-[#8CFF00]">{appt.locator}</td>
                            <td className="p-4">
                              <span className="font-bold block text-[#082D05]">{appt.clientName}</span>
                              <span className="text-[11px] text-neutral-500">{appt.clientPhone}</span>
                            </td>
                            <td className="p-4 max-w-xs truncate text-neutral-700">{serviceNames}</td>
                            <td className="p-4 font-medium">{staffObj?.name || 'Cualquiera'}</td>
                <td className="p-4 font-medium">{appt.date} · {appt.time}h</td>
                            <td className="p-4 font-bold font-display">{appt.totalPrice}€</td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase ${
                                appt.status === 'Confirmada' ? 'bg-[#8CFF00]/20 text-[#082D05]' :
                                appt.status === 'Completada' ? 'bg-[#082D05] text-[#F7F8EF]' :
                                'bg-rose-100 text-rose-700'
                              }`}>
                                {appt.status}
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-2">
                              {appt.status !== 'Completada' && (
                                <button
                                  onClick={() => updateAppointmentStatus(appt.id, 'Completada')}
                                  className="px-2.5 py-1 bg-[#082D05] text-[#F7F8EF] rounded text-[11px] font-semibold hover:bg-[#176B00]"
                                >
                                  Completar
                                </button>
                              )}
                              {appt.status !== 'Cancelada' && (
                                <button
                                  onClick={() => updateAppointmentStatus(appt.id, 'Cancelada')}
                                  className="px-2.5 py-1 bg-neutral-200 text-neutral-800 rounded text-[11px] font-semibold hover:bg-neutral-300"
                                >
                                  Cancelar
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
);

export default AppointmentsPanel;
