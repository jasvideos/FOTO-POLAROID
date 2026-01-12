
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

  const generatePDF = async (landscape: boolean = false) => {
    if (photos.length === 0) return;
    setIsProcessing(true);

    try {
      const orientation = landscape ? 'l' : 'p';
      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'cm',
        format: 'a4'
      });

      const items = document.querySelectorAll('[data-pdf-item]');
      const pageWidth = landscape ? 29.7 : 21;
      const pageHeight = landscape ? 21 : 29.7;
      
      let x = 1;
      let y = 1;
      const margin = 0.5;
      const itemWidth = 7; // Largura do card Polaroid definido no component
      const itemHeight = 10; // Altura do card Polaroid definido no component

      for (let i = 0; i < items.length; i++) {
        const canvas = await html2canvas(items[i] as HTMLElement, {
          scale: 3, // Alta qualidade
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        // Verifica se cabe na linha atual
        if (x + itemWidth > pageWidth - 1) {
          x = 1;
          y += itemHeight + margin;
        }

        // Verifica se precisa de nova página
        if (y + itemHeight > pageHeight - 1) {
          pdf.addPage();
          x = 1;
          y = 1;
        }

        pdf.addImage(imgData, 'JPEG', x, y, itemWidth, itemHeight);
        x += itemWidth + margin;
      }

      pdf.save(`Anix-Polaroid-${Date.now()}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Houve um erro ao gerar o PDF. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 min-h-screen">
      <header className="no-print mb-12 text-center">
        <h1 className="text-5xl font-extrabold text-stone-800 mb-2 tracking-tight">
          Anix <span className="text-amber-600">Copiadora</span>
        </h1>
        <h2 className="text-2xl font-semibold text-stone-500 mb-4">
          Polaroid Studio
        </h2>
        <p className="text-stone-500 max-w-lg mx-auto mb-8 text-lg">
          Fotos <span className="font-bold underline decoration-amber-500">7x10 cm</span>. 
          As fotos serão organizadas automaticamente no PDF.
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

          <div className="flex gap-2">
            <button
              onClick={() => generatePDF(false)}
              disabled={photos.length === 0 || isProcessing}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all shadow-md ${
                photos.length > 0 && !isProcessing ? 'bg-stone-800 text-white hover:bg-stone-900 active:scale-95' : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PDF Vertical
            </button>

            <button
              onClick={() => generatePDF(true)}
              disabled={photos.length === 0 || isProcessing}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all shadow-md ${
                photos.length > 0 && !isProcessing ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 active:scale-95' : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PDF Horizontal
            </button>
          </div>
          
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

      {isProcessing && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white p-10 rounded-3xl shadow-2xl flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-bold text-stone-700 text-center">
              Gerando seu arquivo PDF...<br/>
              <span className="text-amber-600 font-medium">Anix Copiadora</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
