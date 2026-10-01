import React from 'react';
import {
  Calendar, Users, Palette, Sparkles, BookmarkPlus, Settings, Image, FileText
} from 'lucide-react';

export type AdminTabId =
  | 'config'
  | 'contenidos'
  | 'galeria'
  | 'servicios'
  | 'especialistas'
  | 'agenda'
  | 'designs'
  | 'requests';

interface AdminTabBarProps {
  activeTab: AdminTabId;
  pendingRequestsCount: number;
  onChange: (tab: AdminTabId) => void;
}

const tabs = [
  { id: 'config' as const, label: 'Configuración', icon: Settings },
  { id: 'contenidos' as const, label: 'Contenidos', icon: FileText },
  { id: 'galeria' as const, label: 'Galería', icon: Image },
  { id: 'servicios' as const, label: 'Servicios', icon: Sparkles },
  { id: 'especialistas' as const, label: 'Especialistas', icon: Users },
  { id: 'requests' as const, label: 'Solicitudes', icon: BookmarkPlus },
  { id: 'agenda' as const, label: 'Citas', icon: Calendar },
  { id: 'designs' as const, label: 'Diseños', icon: Palette }
];

const AdminTabBar: React.FC<AdminTabBarProps> = ({ activeTab, pendingRequestsCount, onChange }) => (
  <div className="sticky top-0 z-30 -mx-4 lg:mx-0 mb-6 bg-[#F7F8EF]/95 backdrop-blur-md border-b border-[#8CFF00]/20 px-2 py-2">
    <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
      {tabs.map(tab => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`min-h-11 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap relative snap-start ${
              activeTab === tab.id ? 'bg-[#082D05] text-[#F7F8EF] shadow-sm' : 'text-[#082D05]/70 hover:text-[#082D05]'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.id === 'requests' && pendingRequestsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold leading-none">
                {pendingRequestsCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  </div>
);

export default AdminTabBar;
