import React from 'react';
import { Save } from 'lucide-react';
import { SalonConfig } from './adminTypes';

interface StaffConfigPanelProps {
  editingConfig: SalonConfig;
  setEditingConfig: React.Dispatch<React.SetStateAction<SalonConfig>>;
  setSalonConfig: React.Dispatch<React.SetStateAction<SalonConfig>>;
  updateConfig: (config: SalonConfig) => Promise<boolean>;
  handleConfigImageUpload: (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'coverPhoto') => void;
}

const StaffConfigPanel: React.FC<StaffConfigPanelProps> = ({ editingConfig, setEditingConfig, setSalonConfig, updateConfig }) => (

          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-[#8CFF00]/25 p-8">
              <h2 className="font-display text-2xl font-bold text-[#082D05] mb-6">Datos del Salón</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-[#082D05] mb-2 uppercase">Nombre</label>
                    <input
                      type="text"
                      value={editingConfig.name}
                      onChange={(e) => setEditingConfig({...editingConfig, name: e.target.value})}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8CFF00]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#082D05] mb-2 uppercase">Email</label>
                    <input
                      type="email"
                      value={editingConfig.email}
                      onChange={(e) => setEditingConfig({...editingConfig, email: e.target.value})}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8CFF00]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-[#082D05] mb-2 uppercase">Teléfono</label>
                    <input
                      type="tel"
                      value={editingConfig.phone}
                      onChange={(e) => setEditingConfig({...editingConfig, phone: e.target.value})}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8CFF00]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#082D05] mb-2 uppercase">Dirección</label>
                    <input
                      type="text"
                      value={editingConfig.address}
                      onChange={(e) => setEditingConfig({...editingConfig, address: e.target.value})}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8CFF00]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#082D05] mb-2 uppercase">Descripción</label>
                  <textarea
                    value={editingConfig.description}
                    onChange={(e) => setEditingConfig({...editingConfig, description: e.target.value})}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8CFF00] min-h-24"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#082D05] mb-2 uppercase">Horarios</label>
                  <textarea
                    value={editingConfig.hours}
                    onChange={(e) => setEditingConfig({...editingConfig, hours: e.target.value})}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8CFF00] min-h-20"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-[#082D05] mb-2 uppercase">WhatsApp</label>
                    <input
                      type="tel"
                      value={editingConfig.whatsapp}
                      onChange={(e) => setEditingConfig({...editingConfig, whatsapp: e.target.value})}
                      placeholder="+34 600 000 000"
                      className="w-full px-4 py-3 border border-neutral-300 rounded-xl"
                    />
                  </div>
                  <label className="flex items-center gap-3 rounded-xl border border-neutral-200 p-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingConfig.calendarPublic}
                      onChange={(e) => setEditingConfig({...editingConfig, calendarPublic: e.target.checked})}
                      className="w-5 h-5 accent-[#082D05]"
                    />
                    <span>
                      <span className="block text-xs font-bold text-[#082D05] uppercase">Mostrar disponibilidad</span>
                      <span className="block text-[11px] text-neutral-500">Permite que el calendario público muestre disponibilidad.</span>
                    </span>
                  </label>
                </div>

                <div className="rounded-2xl border border-neutral-200 p-5 space-y-4">
                  <div>
              <h3 className="text-sm font-bold text-[#082D05]">Horario operativo por día</h3>
              <p className="text-[11px] text-neutral-500">La cabina podrá usar esta configuración para calcular disponibilidad.</p>
                  </div>
                  <div className="space-y-2">
                    {editingConfig.workingHours.map((item, index) => (
                      <div key={item.day} className="grid grid-cols-[90px_1fr_1fr_auto] gap-2 items-center">
                        <span className="text-xs font-semibold">{item.day}</span>
                        <input type="time" value={item.open} disabled={!item.enabled}
                          onChange={(e) => setEditingConfig(prev => ({...prev, workingHours: prev.workingHours.map((h,i) => i===index ? {...h, open:e.target.value} : h)}))}
                          className="px-2 py-2 border rounded-lg text-xs disabled:bg-neutral-100" />
                        <input type="time" value={item.close} disabled={!item.enabled}
                          onChange={(e) => setEditingConfig(prev => ({...prev, workingHours: prev.workingHours.map((h,i) => i===index ? {...h, close:e.target.value} : h)}))}
                          className="px-2 py-2 border rounded-lg text-xs disabled:bg-neutral-100" />
                        <input type="checkbox" checked={item.enabled}
                          onChange={(e) => setEditingConfig(prev => ({...prev, workingHours: prev.workingHours.map((h,i) => i===index ? {...h, enabled:e.target.checked} : h)}))}
                          className="w-4 h-4 accent-[#082D05]" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-[#082D05] mb-2 uppercase">Bloqueos de agenda</label>
                    <textarea
                      value={editingConfig.blockedSlots.join('\n')}
                      onChange={(e) => setEditingConfig({...editingConfig, blockedSlots: e.target.value.split('\n').map(v => v.trim()).filter(Boolean)})}
                      placeholder="2026-10-02 14:00-16:00\n2026-10-05"
                      className="w-full px-4 py-3 border rounded-xl min-h-24 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#082D05] mb-2 uppercase">Vacaciones / días cerrados</label>
                    <textarea
                      value={editingConfig.vacations.join('\n')}
                      onChange={(e) => setEditingConfig({...editingConfig, vacations: e.target.value.split('\n').map(v => v.trim()).filter(Boolean)})}
                      placeholder="2026-08-10\n2026-08-11"
                      className="w-full px-4 py-3 border rounded-xl min-h-24 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-neutral-200 p-5 space-y-4">
                  <h3 className="text-sm font-bold text-[#082D05]">Catálogo de cabina</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      ['Formas', 'nailShapes'],
                      ['Largos', 'nailLengths'],
                      ['Estilos', 'nailStyles'],
                      ['Productos', 'products']
                    ].map(([label, key]) => (
                      <div key={key}>
                        <label className="block text-[11px] font-bold uppercase text-neutral-600 mb-2">{label}</label>
                        <textarea
                          value={(editingConfig[key as keyof SalonConfig] as string[]).join('\n')}
                          onChange={(e) => setEditingConfig({...editingConfig, [key]: e.target.value.split('\n').map(v => v.trim()).filter(Boolean)})}
                          placeholder="Un elemento por línea"
                          className="w-full px-3 py-2 border rounded-xl min-h-24 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-[#082D05] mb-2 uppercase">Color Primario</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={editingConfig.colors.primary}
                        onChange={(e) => setEditingConfig({...editingConfig, colors: {...editingConfig.colors, primary: e.target.value}})}
                        className="w-12 h-12 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={editingConfig.colors.primary}
                        onChange={(e) => setEditingConfig({...editingConfig, colors: {...editingConfig.colors, primary: e.target.value}})}
                        className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#082D05] mb-2 uppercase">Color Accent</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={editingConfig.colors.accent}
                        onChange={(e) => setEditingConfig({...editingConfig, colors: {...editingConfig.colors, accent: e.target.value}})}
                        className="w-12 h-12 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={editingConfig.colors.accent}
                        onChange={(e) => setEditingConfig({...editingConfig, colors: {...editingConfig.colors, accent: e.target.value}})}
                        className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#082D05] mb-2 uppercase">Fondo</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={editingConfig.colors.background}
                        onChange={(e) => setEditingConfig({...editingConfig, colors: {...editingConfig.colors, background: e.target.value}})}
                        className="w-12 h-12 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={editingConfig.colors.background}
                        onChange={(e) => setEditingConfig({...editingConfig, colors: {...editingConfig.colors, background: e.target.value}})}
                        className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-neutral-200">
                  <button
                    onClick={async () => {
                      const saved = await updateConfig(editingConfig);
                      alert(saved ? 'Configuración guardada en la base de datos.' : 'No se pudo guardar la configuración.');
                    }}
                    className="px-6 py-3 bg-[#082D05] text-[#F7F8EF] text-xs font-bold uppercase rounded-xl hover:bg-[#176B00] transition-all flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar Configuración</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
);

export default StaffConfigPanel;
