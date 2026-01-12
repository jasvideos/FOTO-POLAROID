
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

  const createPDFBlob = async (): Promise<Blob> => {
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'cm',
      format: 'a4'
    });

    const items = document.querySelectorAll('[data-pdf-item]');
    const pageWidth = 21;
    const itemWidth = 6.5; 
    const itemHeight = 9.0;
    const gapX = 0.2; 
    const gapY = 0.4;
    const cols = 3; 
    const startX = (pageWidth - (cols * itemWidth + (cols - 1) * gapX)) / 2;
    const startY = 1.0;

    let currentX = startX;
    let currentY = startY;
    let countOnPage = 0;

    for (let i = 0; i < items.length; i++) {
      if (countOnPage > 0 && countOnPage % 9 === 0) {
        pdf.addPage();
        currentX = startX;
        currentY = startY;
        countOnPage = 0;
      }

      const canvas = await html2canvas(items[i] as HTMLElement, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      pdf.addImage(imgData, 'JPEG', currentX, currentY, itemWidth, itemHeight);
      
      countOnPage++;
      if (countOnPage % cols === 0) {
        currentX = startX;
        currentY += itemHeight + gapY;
      } else {
        currentX += itemWidth + gapX;
      }
    }
    return pdf.output('blob');
  };

  const handleShareWhatsApp = async () => {
    if (photos.length === 0) return;
    setIsProcessing(true);

    try {
      const pdfBlob = await createPDFBlob();
      const fileName = `Polaroid-Anix-${Date.now()}.pdf`;
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      // Verifica se o navegador suporta compartilhamento de arquivos (Mobile/Safari/Chrome Moderno)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Minhas Polaroids - Anix Copiadora',
          text: 'Confira as fotos Polaroid que acabei de criar!',
        });
      } else {
        // Fallback para Desktop: Baixa o arquivo e abre o WhatsApp com instrução
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        
        const message = encodeURIComponent("Olá! Acabei de gerar meu PDF de Polaroids na Anix Copiadora e estou enviando agora! 📸");
        window.open(`https://wa.me/?text=${message}`, '_blank');
      }
    } catch (error) {
      console.error("Erro ao compartilhar:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const generatePDF = async () => {
    if (photos.length === 0) return;
    setIsProcessing(true);

    try {
      const pdfBlob = await createPDFBlob();
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Anix-Polaroid-9-Fotos-${Date.now()}.pdf`;
      link.click();
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
            Salvar PDF
          </button>

          <button
            onClick={handleShareWhatsApp}
            disabled={photos.length === 0 || isProcessing}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-lg ${
              photos.length > 0 && !isProcessing ? 'bg-[#25D366] hover:bg-[#128C7E] text-white active:scale-95' : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            Enviar via WhatsApp
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
              Gerando PDF para compartilhar...<br/>
              <span className="text-amber-600 font-medium font-serif italic">Anix Copiadora</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
