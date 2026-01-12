
import React, { useState, useCallback, useRef } from 'react';
import { PolaroidPhoto, PhotoFilter } from './types';
import { PolaroidCard } from './components/PolaroidCard';
// @ts-ignore
import { jsPDF } from 'https://esm.sh/jspdf@2.5.1';
// @ts-ignore
import html2canvas from 'https://esm.sh/html2canvas@1.4.1';

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

    fileList.forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
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

  const generatePDF = async () => {
    if (photos.length === 0) return;
    setIsProcessing(true);

    try {
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'cm',
        format: 'a4'
      });

      const items = document.querySelectorAll('[data-pdf-item]');
      const pageWidth = 21;
      
      const itemWidth = 6.5; 
      const itemHeight = 9.0;
      const gapX = 0.2; // Reduzido para caber 3 colunas
      const gapY = 0.4;

      const cols = 3; // Alterado para 3 colunas
      const startX = (pageWidth - (cols * itemWidth + (cols - 1) * gapX)) / 2;
      const startY = 1.0;

      let currentX = startX;
      let currentY = startY;
      let countOnPage = 0;

      for (let i = 0; i < items.length; i++) {
        // Agora 9 fotos por página (3x3)
        if (countOnPage > 0 && countOnPage % 9 === 0) {
          pdf.addPage();
          currentX = startX;
          currentY = startY;
          countOnPage = 0;
        }

        const canvas = await html2canvas(items[i] as HTMLElement, {
          scale: 3, // Aumentado para melhor nitidez
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        pdf.addImage(imgData, 'JPEG', currentX, currentY, itemWidth, itemHeight);
        
        countOnPage++;
        
        if (countOnPage % cols === 0) {
          currentX = startX;
          currentY += itemHeight + gapY;
        } else {
          currentX += itemWidth + gapX;
        }
      }

      pdf.save(`Anix-Polaroid-9-Fotos-${Date.now()}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Houve um erro ao gerar o PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 min-h-screen">
      <header className="no-print mb-12 text-center">
        <h1 className="text-5xl font-extrabold text-stone-800 mb-2 tracking-tight">
          Anix <span className="text-amber-600">Copiadora</span>
        </h1>
        <h2 className="text-2xl font-semibold text-stone-500 mb-4">
          Polaroid Studio Premium
        </h2>
        <p className="text-stone-500 max-w-lg mx-auto mb-8 text-lg">
          Layout de <span className="font-bold underline decoration-amber-500">9 fotos por folha</span>. 
          Tamanho: 6.5 x 9.0 cm.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 p-6 bg-white rounded-3xl shadow-sm border border-stone-200">
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
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95"
          >
            Adicionar Fotos
          </button>

          <button
            onClick={generatePDF}
            disabled={photos.length === 0 || isProcessing}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-lg ${
              photos.length > 0 && !isProcessing ? 'bg-stone-800 text-white hover:bg-stone-900 active:scale-95' : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Gerar PDF (9 por página)
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-16 justify-items-center">
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

      {isProcessing && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white p-10 rounded-3xl shadow-2xl flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-bold text-stone-700 text-center text-lg">
              Organizando 9 fotos por página...<br/>
              <span className="text-amber-600 font-medium font-serif italic">Anix Copiadora</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
