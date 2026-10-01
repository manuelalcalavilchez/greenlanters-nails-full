import React, { useState, useEffect } from 'react';
import { Calendar, Users, Palette, CheckCircle2, Clock, XCircle, Phone, Sparkles, Filter, Plus, Eye, BookmarkPlus, Lock, LogOut, Settings, Image, FileText, Trash2, Edit2, Save, X } from 'lucide-react';
import { Appointment, CustomDesign } from '../types';
import StaffAuthGate from './admin/StaffAuthGate';
import StaffPasswordModal from './admin/StaffPasswordModal';
import { apiService } from '../data/api';
import { businessProfile } from '../config/businessProfile';
import ContentBlockEditor from './admin/ContentBlockEditor';
import AdminTabBar, { AdminTabId } from './admin/AdminTabBar';
import GalleryPanel from './admin/GalleryPanel';
import ServicesPanel from './admin/ServicesPanel';
import SpecialistsPanel from './admin/SpecialistsPanel';
import RequestsPanel from './admin/RequestsPanel';
import AppointmentsPanel from './admin/AppointmentsPanel';
import DesignsPanel from './admin/DesignsPanel';
import { AdminPanelProps, DEFAULT_CONFIG, DEFAULT_WORKING_HOURS, SalonConfig } from './admin/adminTypes';


export const AdminPanel: React.FC<AdminPanelProps> = ({
  appointments,
  setAppointments,
  customDesigns,
  setCustomDesigns,
  catalogStyles,
  setCatalogStyles,
  onAddToCatalog
}) => {
  const [showSecurity, setShowSecurity] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTabId>('config');
  const [selectedTech, setSelectedTech] = useState<string>('all');
  const [selectedDesignModal, setSelectedDesignModal] = useState<CustomDesign | null>(null);

  // Cabina Staff: la API/SQLite es la fuente de verdad. localStorage queda fuera de la persistencia operativa.
  const [salonConfig, setSalonConfig] = useState<SalonConfig>(DEFAULT_CONFIG);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [galleryIds, setGalleryIds] = useState<string[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [bookingRequests, setBookingRequests] = useState<any[]>([]);
  const [contentBlocks, setContentBlocks] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const reloadBookingRequests = async () => {
    const data = await apiService.getBookingRequests();
    setBookingRequests(Array.isArray(data) ? data : []);
  };

  const reloadStaffData = async () => {
    setIsLoadingData(true);
    try {
      const [config, apiServices, apiSpecialists, gallery, requests, content] = await Promise.all([
        apiService.getConfig(),
        apiService.getServices(),
        apiService.getSpecialists(),
        apiService.getGallery(),
        apiService.getBookingRequests(),
        apiService.getContent()
      ]);

      if (config && config.id) {
        const parseArray = (value: unknown, fallback: any[] = []) => {
          if (Array.isArray(value)) return value;
          if (typeof value === 'string') {
            try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : fallback; } catch { return fallback; }
          }
          return fallback;
        };
        const loaded: SalonConfig = {
          ...DEFAULT_CONFIG,
          ...config,
          calendarPublic: config.calendarPublic !== 0,
          workingHours: parseArray(config.workingHours, DEFAULT_WORKING_HOURS),
          blockedSlots: parseArray(config.blockedSlots),
          vacations: parseArray(config.vacations),
          nailShapes: parseArray(config.nailShapes, DEFAULT_CONFIG.nailShapes),
          nailLengths: parseArray(config.nailLengths, DEFAULT_CONFIG.nailLengths),
          nailStyles: parseArray(config.nailStyles, DEFAULT_CONFIG.nailStyles),
          products: parseArray(config.products),
          colors: {
            primary: config.primaryColor || DEFAULT_CONFIG.colors.primary,
            accent: config.accentColor || DEFAULT_CONFIG.colors.accent,
            background: config.backgroundColor || DEFAULT_CONFIG.colors.background
          }
        };
        setSalonConfig(loaded);
        setEditingConfig(loaded);
      } else {
        setEditingConfig(DEFAULT_CONFIG);
      }

      setServices(Array.isArray(apiServices) ? apiServices : []);
      setSpecialists(Array.isArray(apiSpecialists) ? apiSpecialists : []);
      setGalleryPhotos(Array.isArray(gallery) ? gallery.map((g: any) => g.photoBase64).filter(Boolean) : []);
      setGalleryIds(Array.isArray(gallery) ? gallery.map((g: any) => g.id) : []);
      setBookingRequests(Array.isArray(requests) ? requests : []);
      setContentBlocks(Array.isArray(content) ? content : []);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    const load = () => reloadStaffData();
    window.addEventListener('greenlanters-staff-authenticated', load);
    if (sessionStorage.getItem('greenlanters_staff_token')) load();
    return () => window.removeEventListener('greenlanters-staff-authenticated', load);
  }, []);

  // Edit states
  const [editingService, setEditingService] = useState<any | null>(null);
  const [editingSpecialist, setEditingSpecialist] = useState<any | null>(null);
  const [editingConfig, setEditingConfig] = useState<SalonConfig>(DEFAULT_CONFIG);

  const handleLogout = () => {
    sessionStorage.removeItem('greenlanters_staff_token');
    window.location.reload();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const result = ev.target?.result as string;
      const id = `gallery_${Date.now()}`;
      const saved = await apiService.uploadPhoto({
        id,
        photoBase64: result,
        title: '',
        caption: ''
      });
      if (saved?.success) {
        setGalleryPhotos(prev => [result, ...prev]);
        setGalleryIds(prev => [id, ...prev]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfigImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'coverPhoto') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setEditingConfig(prev => ({ ...prev, [field]: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addService = async () => {
    const newService = {
      id: `s${Date.now()}`,
      name: 'Nuevo Servicio',
      duration: null,
      price: null,
      description: '',
      shortDescription: '',
      longDescription: '',
      category: 'diseno_personalizado',
      featured: false,
      sortOrder: services.length + 1,
      instagramSource: businessProfile.instagram
    };
    const saved = await apiService.createService(newService);
    if (saved?.success) {
      setServices(prev => [newService, ...prev]);
      setEditingService(newService);
    }
  };

  const addSpecialist = async () => {
    const newSpecialist = {
      id: `sp${Date.now()}`,
      name: 'Nueva especialista',
      role: 'Nail Artist',
      photo: '💅',
      description: ''
    };
    const saved = await apiService.createSpecialist(newSpecialist);
    if (saved?.success) {
      setSpecialists(prev => [newSpecialist, ...prev]);
      setEditingSpecialist(newSpecialist);
    }
  };

  const updateAppointmentStatus = async (id: string, status: 'Confirmada' | 'Completada' | 'Cancelada') => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    await apiService.updateAppointment(id, { status });
  };

  const updateDesignStatus = async (id: string, status: 'Pendiente' | 'Preparado en cabina' | 'Realizado') => {
    setCustomDesigns(prev => prev.map(d => d.id === id ? { ...d, status } : d));
    await apiService.updateDesign(id, { status });
  };

  // SOLICITUDES DE CITA
  const generateLocator = () => `LGN-${Math.floor(1000 + Math.random() * 9000)}`;

  const confirmBookingRequest = async (request: any) => {
    if (!request.preferredDate || !request.preferredTime) {
      alert('Para confirmar una cita primero hay que tener fecha y hora solicitadas.');
      return;
    }
    const locator = generateLocator();
    const newAppointment: Appointment = {
      id: `appt_${Date.now()}`,
      locator,
      serviceIds: [],
      addonIds: [],
      specialistId: 'any',
      date: request.preferredDate,
      time: request.preferredTime,
      totalPrice: 0,
      totalDuration: 0,
      clientName: request.clientName,
      clientPhone: request.clientPhone,
      clientEmail: request.clientEmail,
      notes: `Solicitud: ${request.serviceType || ''}. ${request.notes || ''}`.trim(),
      status: 'Confirmada',
      createdAt: new Date().toISOString()
    };

    const result = await apiService.createAppointment(newAppointment);
    if (result?.success) {
      setAppointments(prev => [newAppointment, ...prev]);
      await apiService.updateBookingRequest(request.id, 'Confirmada');
      await reloadBookingRequests();
      alert(`Cita creada con localizador ${locator}. Recuerda ajustar servicios, especialista y precio en la pestaña Citas.`);
    } else {
      alert('No se pudo crear la cita. Comprueba que la API está en marcha.');
    }
  };

  const completeBookingRequest = async (id: string) => {
    await apiService.updateBookingRequest(id, 'Completada');
    await reloadBookingRequests();
  };

  const deleteBookingRequest = async (id: string) => {
    if (!confirm('¿Eliminar esta solicitud?')) return;
    await apiService.deleteBookingRequest(id);
    await reloadBookingRequests();
  };

  const saveContentBlock = async (block: any) => {
    const result = await apiService.updateContent(block.id, block);
    if (result?.success) {
      setContentBlocks(prev => prev.map(item => item.id === block.id ? block : item));
    } else {
      alert('No se pudo guardar el contenido.');
    }
  };

  const pendingRequestsCount = bookingRequests.filter(r => r.status === 'Pendiente').length;

  const filteredAppointments = selectedTech === 'all' 
    ? appointments 
    : appointments.filter(a => a.specialistId === selectedTech);

  const totalBilling = appointments
    .filter(a => a.status !== 'Cancelada')
    .reduce((acc, a) => acc + a.totalPrice, 0);

  const completedCount = appointments.filter(a => a.status === 'Completada').length;

  return (
    <StaffAuthGate>
    <div className="min-h-screen bg-[#F7F8EF] pb-28 lg:pb-12 px-3 sm:px-4 lg:px-12 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 sm:mb-8 gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#8CFF00]">Panel de Control</span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#082D05] mt-1">
              {salonConfig.name}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSecurity(true)}
              className="p-2.5 rounded-xl bg-white border border-neutral-200 text-[#082D05]/60 hover:text-[#082D05] transition-all"
              title="Seguridad"
            >
              <Lock className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-white border border-neutral-200 text-[#082D05]/60 hover:text-rose-600 hover:border-rose-200 transition-all"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        <AdminTabBar activeTab={activeTab} pendingRequestsCount={pendingRequestsCount} onChange={setActiveTab} />

        {/* CONFIGURACIÓN */}
        {activeTab === 'config' && (
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
                      const payload = {
                        ...editingConfig,
                        primaryColor: editingConfig.colors.primary,
                        accentColor: editingConfig.colors.accent,
                        backgroundColor: editingConfig.colors.background
                      };
                      const saved = await apiService.updateConfig(payload);
                      if (saved?.success) {
                        setSalonConfig(editingConfig);
                        alert('Configuración guardada en la base de datos.');
                      } else {
      alert('No se pudo guardar la configuración.');
                      }
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
        )}

        {/* CONTENIDOS */}
        {activeTab === 'contenidos' && (
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#082D05]">Contenido de la web</h2>
              <p className="text-sm text-neutral-600 mt-1">Edita los bloques desde el móvil. Los cambios se guardan en el servidor y no en el navegador.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {contentBlocks.map((block) => (
                <ContentBlockEditor key={block.id} block={block} onSave={saveContentBlock} />
              ))}
            </div>
          </div>
        )}

        {/* GALERÍA */}
        {activeTab === 'galeria' && (
          <GalleryPanel galleryPhotos={galleryPhotos} galleryIds={galleryIds} handlePhotoUpload={handlePhotoUpload} setGalleryPhotos={setGalleryPhotos} setGalleryIds={setGalleryIds} />
        )}

        {/* SERVICIOS */}
        {activeTab === 'servicios' && (
          <ServicesPanel services={services} editingService={editingService} setServices={setServices} setEditingService={setEditingService} addService={addService} />
        )}

        {/* ESPECIALISTAS */}
        {activeTab === 'especialistas' && (
          <SpecialistsPanel specialists={specialists} editingSpecialist={editingSpecialist} setSpecialists={setSpecialists} setEditingSpecialist={setEditingSpecialist} addSpecialist={addSpecialist} />
        )}

        {/* SOLICITUDES DE CITA */}
        {activeTab === 'requests' && (
          <RequestsPanel bookingRequests={bookingRequests} pendingRequestsCount={pendingRequestsCount} confirmBookingRequest={confirmBookingRequest} completeBookingRequest={completeBookingRequest} deleteBookingRequest={deleteBookingRequest} />
        )}

        {/* AGENDA - Lo que ya existía */}
        {activeTab === 'agenda' && (
          <AppointmentsPanel appointments={appointments} filteredAppointments={filteredAppointments} specialists={specialists} services={services} selectedTech={selectedTech} totalBilling={totalBilling} completedCount={completedCount} setSelectedTech={setSelectedTech} updateAppointmentStatus={updateAppointmentStatus} />
        )}

        {/* DISEÑOS */}
        {activeTab === 'designs' && (
          <DesignsPanel customDesigns={customDesigns} selectedDesignModal={selectedDesignModal} updateDesignStatus={updateDesignStatus} setSelectedDesignModal={setSelectedDesignModal} />
        )}

            {/* Modal diseño */}
        {selectedDesignModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 relative border border-[#8CFF00]/40 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-bold text-[#082D05]">Diseño {selectedDesignModal.code}</h3>
                <button 
                  onClick={() => setSelectedDesignModal(null)}
                  className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center font-bold hover:bg-neutral-200"
                >
                  👁️
                </button>
              </div>

              <div className="bg-neutral-900 p-4 rounded-2xl flex items-center justify-center">
                <img src={selectedDesignModal.imageBase64} alt="Ampliación" className="max-h-96 object-contain rounded-xl" />
              </div>

              <div className="space-y-2 text-xs">
                <p><strong>Cliente:</strong> {selectedDesignModal.clientName}</p>
                <p><strong>Teléfono:</strong> {selectedDesignModal.clientPhone}</p>
                <p><strong>Notas:</strong> {selectedDesignModal.notes}</p>
                <p><strong>Forma:</strong> {selectedDesignModal.shape}</p>
              </div>

              <button
                onClick={() => setSelectedDesignModal(null)}
                className="w-full py-3 bg-[#082D05] text-[#F7F8EF] text-xs font-bold uppercase rounded-xl hover:bg-[#176B00]"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
      {showSecurity && <StaffPasswordModal onClose={() => setShowSecurity(false)} />}
    </StaffAuthGate>
  );
};

