import React from 'react';
import { CustomDesign } from '../../types';

interface DesignsPanelProps {
  customDesigns: CustomDesign[];
  selectedDesignModal: CustomDesign | null;
  updateDesignStatus: any;
  setSelectedDesignModal: any;
}

const DesignsPanel: React.FC<DesignsPanelProps> = ({ customDesigns, selectedDesignModal, updateDesignStatus, setSelectedDesignModal }) => (

          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-[#082D05]">Diseños del Atelier</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {customDesigns.length === 0 ? (
                <div className="col-span-full py-16 text-center text-neutral-400 bg-white rounded-3xl border border-neutral-200">
                  No hay diseños personalizados creados.
                </div>
              ) : (
                customDesigns.map((des) => (
                  <div key={des.id} className="bg-white rounded-2xl overflow-hidden border border-[#8CFF00]/30 shadow-sm flex flex-col">
                    <div className="aspect-[4/3] bg-neutral-900 relative overflow-hidden flex items-center justify-center p-4">
                      <img 
                        src={des.imageBase64} 
                        alt="Boceto uña" 
                        className="max-h-full object-contain rounded-lg shadow-md border border-[#8CFF00]/40" 
                      />
                      <span className="absolute top-3 left-3 px-2.5 py-1 bg-[#082D05] text-[#F7F8EF] font-mono text-[10px] rounded-md">
                        {des.code}
                      </span>
                    </div>

                    <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-display font-bold text-[#082D05]">{des.clientName}</h3>
                        </div>
                        <p className="text-xs text-neutral-600 bg-neutral-50 p-2.5 rounded-xl border border-neutral-200 italic">
                          "{des.notes}"
                        </p>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-neutral-100">
                        <select
                          value={des.status}
                          onChange={(e) => updateDesignStatus(des.id, e.target.value as any)}
                          className="w-full text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#F7F8EF] border border-[#8CFF00]/40 text-[#082D05]"
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="Preparado en cabina">Preparado en cabina</option>
                          <option value="Realizado">Realizado</option>
                        </select>

                        <button
                          onClick={() => setSelectedDesignModal(des)}
                          className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 text-[#082D05] text-xs font-semibold rounded-xl"
                        >
                          Ver Detalles
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
);

export default DesignsPanel;
