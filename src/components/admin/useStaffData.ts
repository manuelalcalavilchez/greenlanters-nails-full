import React, { useEffect, useState } from 'react';
import { apiService } from '../../data/api';
import { DEFAULT_CONFIG, DEFAULT_WORKING_HOURS, SalonConfig } from './adminTypes';

export const useStaffData = () => {
  const [salonConfig, setSalonConfig] = useState<SalonConfig>(DEFAULT_CONFIG);
  const [editingConfig, setEditingConfig] = useState<SalonConfig>(DEFAULT_CONFIG);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [galleryIds, setGalleryIds] = useState<string[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [bookingRequests, setBookingRequests] = useState<any[]>([]);
  const [contentBlocks, setContentBlocks] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [editingSpecialist, setEditingSpecialist] = useState<any | null>(null);

  const parseArray = (value: unknown, fallback: any[] = []) => {
    if (Array.isArray(value)) return value;
    if (typeof value !== 'string') return fallback;
    try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : fallback; }
    catch { return fallback; }
  };

  const reloadBookingRequests = async () => {
    const data = await apiService.getBookingRequests();
    setBookingRequests(Array.isArray(data) ? data : []);
  };

  const reloadStaffData = async () => {
    setIsLoadingData(true);
    try {
      const [config, apiServices, apiSpecialists, gallery, requests, content] = await Promise.all([
        apiService.getConfig(), apiService.getServices(), apiService.getSpecialists(),
        apiService.getGallery(), apiService.getBookingRequests(), apiService.getContent()
      ]);
      if (config?.id) {
        const loaded: SalonConfig = {
          ...DEFAULT_CONFIG, ...config, calendarPublic: config.calendarPublic !== 0,
          workingHours: parseArray(config.workingHours, DEFAULT_WORKING_HOURS),
          blockedSlots: parseArray(config.blockedSlots), vacations: parseArray(config.vacations),
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
        setSalonConfig(loaded); setEditingConfig(loaded);
      } else setEditingConfig(DEFAULT_CONFIG);
      setServices(Array.isArray(apiServices) ? apiServices : []);
      setSpecialists(Array.isArray(apiSpecialists) ? apiSpecialists : []);
      setGalleryPhotos(Array.isArray(gallery) ? gallery.map((g: any) => g.photoBase64).filter(Boolean) : []);
      setGalleryIds(Array.isArray(gallery) ? gallery.map((g: any) => g.id) : []);
      setBookingRequests(Array.isArray(requests) ? requests : []);
      setContentBlocks(Array.isArray(content) ? content : []);
    } finally { setIsLoadingData(false); }
  };

  useEffect(() => {
    const load = () => reloadStaffData();
    window.addEventListener('greenlanters-staff-authenticated', load);
    if (sessionStorage.getItem('greenlanters_staff_token')) load();
    return () => window.removeEventListener('greenlanters-staff-authenticated', load);
  }, []);

  return {
    salonConfig, setSalonConfig, editingConfig, setEditingConfig,
    galleryPhotos, setGalleryPhotos, galleryIds, setGalleryIds,
    services, setServices, specialists, setSpecialists,
    bookingRequests, setBookingRequests, contentBlocks, setContentBlocks,
    isLoadingData, reloadBookingRequests, reloadStaffData,
    editingService, setEditingService, editingSpecialist, setEditingSpecialist
  };
};
