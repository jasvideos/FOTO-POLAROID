
import React, { useState, useRef, useEffect } from 'react';
import { PolaroidPhoto } from '../types';

interface PolaroidCardProps {
  photo: PolaroidPhoto;
  onDelete?: (id: string) => void;
  onUpdateCaption?: (id: string, caption: string) => void;
  onUpdateAdjustment?: (id: string, adjustment: Partial<Pick<PolaroidPhoto, 'scale' | 'posX' | 'posY'>>) => void;
  isEditable?: boolean;
}

export const PolaroidCard: React.FC<PolaroidCardProps> = ({ 
  photo, 
  onDelete, 
  onUpdateCaption,
  onUpdateAdjustment,
  isEditable = true 
}) => {
  const [showControls, setShowControls] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, initialPosX: 0, initialPosY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const scale = photo.scale ?? 1;
  const posX = photo.posX ?? 50;
  const posY = photo.posY ?? 50;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!showControls || !isEditable) return;
    
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialPosX: posX,
      initialPosY: posY
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !isEditable) return;

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      // Sensibilidade baseada no zoom
      const sensitivity = 0.4 / Math.max(scale, 0.1);
      
      // Cálculo independente para X e Y
      let newPosX = dragStartRef.current.initialPosX - (deltaX * sensitivity);
      let newPosY = dragStartRef.current.initialPosY - (deltaY * sensitivity);

      newPosX = Math.max(0, Math.min(100, newPosX));
      newPosY = Math.max(0, Math.min(100, newPosY));

      onUpdateAdjustment?.(photo.id, { posX: newPosX, posY: newPosY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, photo.id, scale, onUpdateAdjustment, isEditable]);

  return (
    <div className="relative group transition-all duration-300">
      <div 
        data-pdf-item
        className="bg-white p-[0.4cm] shadow-[0_8px_25px_rgba(0,0,0,0.2)] border border-stone-300 flex flex-col items-center select-none"
        style={{ width: '6.5cm', height: '9.0cm' }}
      >
        {/* Foto Frame */}
        <div 
          ref={containerRef}
          className={`w-full h-[6.2cm] bg-stone-200 overflow-hidden relative shadow-[0_0_12px_rgba(0,0,0,0.35)] border-2 border-stone-100 cursor-pointer ${
            isEditable ? 'hover:ring-4 ring-amber-400/50 ring-inset transition-all' : ''
          } ${isDragging ? 'cursor-grabbing' : showControls ? 'cursor-grab' : 'cursor-pointer'}`}
          onClick={() => isEditable && !isDragging && setShowControls(!showControls)}
          onMouseDown={handleMouseDown}
        >
          <img 
            src={photo.url} 
            alt="Polaroid Content" 
            draggable={false}
            className="w-full h-full object-cover pointer-events-none"
            style={{ 
              filter: photo.filter,
              transform: `scale(${scale})`,
              objectPosition: `${posX}% ${posY}%`,
              opacity: (showControls && isEditable) ? 0.6 : 1
            }}
          />
          
          {isEditable && showControls && !isDragging && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/80 text-[8px] px-3 py-1 rounded-full text-white pointer-events-none uppercase font-bold tracking-widest no-print shadow-lg whitespace-nowrap">
              Ajuste com os sliders ou arraste
            </div>
          )}

          {isEditable && showControls && (
            <div 
              className="absolute inset-0 flex flex-col items-center justify-end p-2 text-white no-print pointer-events-none"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full space-y-3 bg-stone-900/95 backdrop-blur-md p-3 rounded-xl pointer-events-auto shadow-2xl border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-amber-400 tracking-tighter">Enquadramento Manual</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowControls(false); }}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded-lg text-[10px] font-black shadow-inner transition-colors"
                  >
                    OK
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  {/* Zoom */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold flex justify-between text-stone-300">
                      <span>ZOOM</span>
                      <span className="text-amber-400">{scale.toFixed(1)}x</span>
                    </label>
                    <input 
                      type="range" min="0.5" max="4" step="0.05" value={scale}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => onUpdateAdjustment?.(photo.id, { scale: parseFloat(e.target.value) })}
                      className="w-full accent-amber-500 h-1.5 rounded-lg cursor-pointer appearance-none bg-stone-700"
                    />
                  </div>

                  {/* Eixo Horizontal (X) */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold flex justify-between text-stone-300">
                      <span>ESQUERDA / DIREITA (X)</span>
                      <span className="text-blue-400">{Math.round(posX)}%</span>
                    </label>
                    <input 
                      type="range" min="0" max="100" step="1" value={posX}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => onUpdateAdjustment?.(photo.id, { posX: parseFloat(e.target.value) })}
                      className="w-full accent-blue-500 h-1.5 rounded-lg cursor-pointer appearance-none bg-stone-700"
                    />
                  </div>

                  {/* Eixo Vertical (Y) */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold flex justify-between text-stone-300">
                      <span>CIMA / BAIXO (Y)</span>
                      <span className="text-emerald-400">{Math.round(posY)}%</span>
                    </label>
                    <input 
                      type="range" min="0" max="100" step="1" value={posY}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => onUpdateAdjustment?.(photo.id, { posY: parseFloat(e.target.value) })}
                      className="w-full accent-emerald-500 h-1.5 rounded-lg cursor-pointer appearance-none bg-stone-700"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Legenda (Caveat Font) */}
        <div className="mt-auto w-full flex flex-col items-center pb-2">
          {isEditable ? (
            <input
              type="text"
              value={photo.caption}
              onChange={(e) => onUpdateCaption?.(photo.id, e.target.value)}
              placeholder="Clique para legendar"
              className="w-full text-center polaroid-font text-2xl bg-transparent border-none outline-none focus:ring-0 text-stone-800 font-bold placeholder:text-stone-300"
            />
          ) : (
            <span className="polaroid-font text-2xl text-stone-800 h-10 overflow-hidden text-ellipsis whitespace-nowrap w-full text-center flex items-center justify-center font-bold">
              {photo.caption}
            </span>
          )}
        </div>
      </div>

      {isEditable && !showControls && (
        <button
          onClick={() => onDelete?.(photo.id)}
          className="absolute -top-3 -right-3 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg no-print z-10 border-2 border-white scale-90 hover:scale-100 active:scale-90"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
};
