import React from 'react';
import { Image, Trash2 } from 'lucide-react';
import { apiService } from '../../data/api';

interface GalleryPanelProps {
  galleryPhotos: string[];
  galleryIds: string[];
  handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setGalleryPhotos: React.Dispatch<React.SetStateAction<string[]>>;
  setGalleryIds: React.Dispatch<React.SetStateAction<string[]>>;
}

const GalleryPanel: React.FC<GalleryPanelProps> = ({ galleryPhotos, galleryIds, handlePhotoUpload, setGalleryPhotos, setGalleryIds }) => (

          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-[#8CFF00]/25 p-8">
              <h2 className="font-display text-2xl font-bold text-[#082D05] mb-6">Galería de Fotos</h2>
              
              <div className="mb-8">
                <label className="block">
                  <div className="border-2 border-dashed border-[#8CFF00]/40 rounded-2xl p-8 text-center cursor-pointer hover:bg-[#F7F8EF] transition-all">
                    <Image className="w-8 h-8 mx-auto mb-3 text-[#8CFF00]" />
                    <p className="text-sm font-semibold text-[#082D05] mb-1">Sube fotos de tu salón</p>
                    <p className="text-xs text-neutral-500">JPG, PNG - Máx 10MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {galleryPhotos.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {galleryPhotos.map((photo, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden aspect-square">
                      <img src={photo} alt={`Foto ${idx}`} className="w-full h-full object-cover" />
                      <button
                        onClick={async () => {
                          const id = galleryIds[idx];
                          if (id) {
                            const deleted = await apiService.deletePhoto(id);
                            if (!deleted?.success) return;
                          }
                          setGalleryPhotos(prev => prev.filter((_, i) => i !== idx));
                          setGalleryIds(prev => prev.filter((_, i) => i !== idx));
                        }}
                        className="absolute inset-0 bg-black/0 group-hover:bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-6 h-6 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
);

export default GalleryPanel;
