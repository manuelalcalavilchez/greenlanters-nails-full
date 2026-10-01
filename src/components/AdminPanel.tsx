import React, { useState, useEffect } from 'react';
import { Calendar, Users, Palette, CheckCircle2, Clock, XCircle, Phone, Sparkles, Filter, Plus, Eye, BookmarkPlus, Lock, LogOut, Settings, Image, FileText, Trash2, Edit2, Save, X } from 'lucide-react';
import { Appointment, CustomDesign } from '../types';
import StaffAuthGate from './admin/StaffAuthGate';
import StaffPasswordModal from './admin/StaffPasswordModal';
import { apiService } from '../data/api';
import { businessProfile } from '../config/businessProfile';
import { validateAppointmentStatusChange, buildAppointmentFromBookingRequest } from './admin/bookingWorkflow';
import ContentBlockEditor from './admin/ContentBlockEditor';
import AdminTabBar, { AdminTabId } from './admin/AdminTabBar';
import GalleryPanel from './admin/GalleryPanel';
import ServicesPanel from './admin/ServicesPanel';
import SpecialistsPanel from './admin/SpecialistsPanel';
import RequestsPanel from './admin/RequestsPanel';
import AppointmentsPanel from './admin/AppointmentsPanel';
import DesignsPanel from './admin/DesignsPanel';
import StaffConfigPanel from './admin/StaffConfigPanel';
import { AdminPanelProps, SalonConfig } from './admin/adminTypes';
import { useStaffData } from './admin/useStaffData';


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

  const {
    salonConfig, setSalonConfig, editingConfig, setEditingConfig,
    galleryPhotos, setGalleryPhotos, galleryIds, setGalleryIds,
    services, setServices, specialists, setSpecialists,
    bookingRequests, setBookingRequests, contentBlocks, setContentBlocks,
    isLoadingData, reloadBookingRequests,
    editingService, setEditingService, editingSpecialist, setEditingSpecialist
  } = useStaffData();

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
      role: businessProfile.labels.professional,
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
    const current = appointments.find(a => a.id === id);
    if (!current) return;
    try {
      validateAppointmentStatusChange(current.status, status);
      const result = await apiService.updateAppointment(id, { status });
      if (result?.success) setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo cambiar el estado de la cita.');
    }
  };

  const updateDesignStatus = async (id: string, status: 'Pendiente' | 'Preparado en cabina' | 'Realizado') => {
    setCustomDesigns(prev => prev.map(d => d.id === id ? { ...d, status } : d));
    await apiService.updateDesign(id, { status });
  };

  // SOLICITUDES DE CITA
  const confirmBookingRequest = async (request: any) => {
    if (!request.preferredDate || !request.preferredTime) {
      alert('Para confirmar una cita primero hay que tener fecha y hora solicitadas.');
      return;
    }
    const newAppointment = buildAppointmentFromBookingRequest(request);

    const result = await apiService.createAppointment(newAppointment);
    if (result?.success) {
      setAppointments(prev => [newAppointment, ...prev]);
      await apiService.updateBookingRequest(request.id, 'Confirmada');
      await reloadBookingRequests();
      alert(`Cita creada con localizador ${newAppointment.locator}. Recuerda ajustar servicios, especialista y precio en la pestaña Citas.`);
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

        {activeTab === 'config' && (
          <StaffConfigPanel editingConfig={editingConfig} setEditingConfig={setEditingConfig} setSalonConfig={setSalonConfig} updateConfig={async (config) => {
            const payload = { ...config, primaryColor: config.colors.primary, accentColor: config.colors.accent, backgroundColor: config.colors.background };
            const saved = await apiService.updateConfig(payload);
            if (saved?.success) { setSalonConfig(config); return true; }
            return false;
          }} handleConfigImageUpload={handleConfigImageUpload} />
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

