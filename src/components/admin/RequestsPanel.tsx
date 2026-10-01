import React from 'react';

interface RequestsPanelProps {
  bookingRequests: any[];
  pendingRequestsCount: number;
  confirmBookingRequest: any;
  completeBookingRequest: any;
  deleteBookingRequest: any;
}

const RequestsPanel: React.FC<RequestsPanelProps> = ({ bookingRequests, pendingRequestsCount, confirmBookingRequest, completeBookingRequest, deleteBookingRequest }) => (

          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-[#8CFF00]/25 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold text-[#082D05]">Solicitudes de Cita</h2>
                <span className="text-xs font-semibold text-neutral-500">{pendingRequestsCount} pendiente(s)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F8EF] border-b border-neutral-200 text-[#082D05] uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="p-4">Cliente</th>
                      <th className="p-4">Contacto</th>
                      <th className="p-4">Servicio</th>
                      <th className="p-4">Fecha/Hora Preferida</th>
                      <th className="p-4">Notas</th>
                      <th className="p-4">Estado</th>
                      <th className="p-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {bookingRequests.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-neutral-400">
                          No hay solicitudes de cita todavía.
                        </td>
                      </tr>
                    ) : (
                      bookingRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-neutral-50/50 transition-colors align-top">
                          <td className="p-4 font-bold text-[#082D05]">{req.clientName}</td>
                          <td className="p-4">
                            <span className="block">{req.clientPhone}</span>
                            <span className="block text-[11px] text-neutral-500">{req.clientEmail}</span>
                          </td>
                          <td className="p-4 font-medium">{req.serviceType}</td>
                          <td className="p-4 font-medium">{req.preferredDate || '—'} {req.preferredTime ? `· ${req.preferredTime}h` : ''}</td>
                          <td className="p-4 max-w-xs truncate text-neutral-600">{req.notes || '—'}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase ${
                              req.status === 'Pendiente' ? 'bg-amber-100 text-amber-800' :
                              req.status === 'Confirmada' ? 'bg-[#8CFF00]/20 text-[#082D05]' :
                              req.status === 'Completada' ? 'bg-[#082D05] text-[#F7F8EF]' :
                              'bg-neutral-100 text-neutral-600'
                            }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2 whitespace-nowrap">
                            {req.status === 'Pendiente' && (
                              <button
                                onClick={() => confirmBookingRequest(req)}
                                className="px-2.5 py-1 bg-[#082D05] text-[#F7F8EF] rounded text-[11px] font-semibold hover:bg-[#176B00]"
                              >
                                Confirmar
                              </button>
                            )}
                            {req.status !== 'Completada' && (
                              <button
                                onClick={() => completeBookingRequest(req.id)}
                                className="px-2.5 py-1 bg-[#8CFF00]/20 text-[#082D05] rounded text-[11px] font-semibold hover:bg-[#8CFF00]/30"
                              >
                                Completar
                              </button>
                            )}
                            <button
                              onClick={() => deleteBookingRequest(req.id)}
                              className="px-2.5 py-1 bg-rose-100 text-rose-700 rounded text-[11px] font-semibold hover:bg-rose-200"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
);

export default RequestsPanel;
