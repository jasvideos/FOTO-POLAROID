
import React, { useState, useCallback, useRef } from 'react';
import { PolaroidPhoto, PhotoFilter } from './types';
import { PolaroidCard } from './components/PolaroidCard';

const App: React.FC = () => {
  const [photos, setPhotos] = useState<PolaroidPhoto[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>(PhotoFilter.NONE);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsProcessing(true);
    const fileList = Array.from(files);
    let loadedCount = 0;

    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        // Explicitly cast result to string as readAsDataURL always returns a string or null
        const url = e.target?.result as string;
        
        if (url) {
          const newPhoto: PolaroidPhoto = {
            id: Math.random().toString(36).substring(7),
            url: url,
            caption: '',
            filter: activeFilter,
            createdAt: Date.now(),
            scale: 1,
            posX: 50,
            posY: 50
          };
          setPhotos((prev) => [...prev, newPhoto]);
        }
        loadedCount++;
        if (loadedCount === fileList.length) setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const deletePhoto = useCallback((id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const updateCaption = useCallback((id: string, caption: string) => {
    setPhotos((prev) => prev.map((p) => p.id === id ? { ...p, caption } : p));
  }, []);

  const updateAdjustment = useCallback((id: string, adjustment: Partial<Pick<PolaroidPhoto, 'scale' | 'posX' | 'posY'>>) => {
    setPhotos((prev) => prev.map((p) => p.id === id ? { ...p, ...adjustment } : p));
  }, []);

  const applyFilterToAll = (filter: string) => {
    setActiveFilter(filter);
    setPhotos((prev) => prev.map(p => ({ ...p, filter: filter })));
  };

  const printPhotos = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 min-h-screen">
      <header className="no-print mb-12 text-center">
        <h1 className="text-5xl font-extrabold text-stone-800 mb-4 tracking-tight">
          Vintage <span className="text-amber-600">Polaroid</span> Studio
        </h1>
        <p className="text-stone-500 max-w-lg mx-auto mb-8 text-lg">
          Fotos <span className="font-bold underline decoration-amber-500">6x8 cm</span>. 
          Clique na foto para ajustar zoom e posição!
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 p-6 bg-white rounded-3xl shadow-sm border border-stone-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-stone-400">Filtro Global:</span>
            <select 
              className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
              value={activeFilter}
              onChange={(e) => applyFilterToAll(e.target.value)}
            >
              <option value={PhotoFilter.NONE}>Original</option>
              <option value={PhotoFilter.VINTAGE}>Vintage</option>
              <option value={PhotoFilter.B_W}>P&B</option>
              <option value={PhotoFilter.WARM}>Quente</option>
              <option value={PhotoFilter.COOL}>Frio</option>
            </select>
          </div>

          <div className="h-6 w-px bg-stone-200 mx-2 hidden sm:block"></div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md active:scale-95"
          >
            Adicionar Fotos
          </button>

          <button
            onClick={printPhotos}
            disabled={photos.length === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-md ${
              photos.length > 0 ? 'bg-stone-800 text-white hover:bg-stone-900 active:scale-95' : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            Salvar em A4 / Imprimir
          </button>
          
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple accept="image/*" className="hidden" />
        </div>
      </header>

      <div className="no-print">
        {photos.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-stone-200 rounded-3xl bg-stone-50/50">
            <h3 className="text-xl font-bold text-stone-400">Nenhuma foto adicionada</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12 justify-items-center">
            {photos.map((photo) => (
              <PolaroidCard 
                key={photo.id} 
                photo={photo} 
                onDelete={deletePhoto} 
                onUpdateCaption={updateCaption}
                onUpdateAdjustment={updateAdjustment}
              />
            ))}
          </div>
        )}
      </div>

      {/* Container A4 */}
      <div className="hidden print:block">
        <div className="print-a4-page">
           <div className="flex flex-wrap gap-[0.5cm] justify-start content-start">
            {photos.map((photo) => (
              <PolaroidCard key={photo.id} photo={photo} isEditable={false} />
            ))}
           </div>
        </div>
      </div>

      {isProcessing && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-3xl shadow-2xl">
            <p className="font-bold text-stone-700">Revelando fotos...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
