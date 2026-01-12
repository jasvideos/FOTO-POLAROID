
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

      const sensitivity = 0.4 / Math.max(scale, 0.1);
      
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
  }, [isDragging, photo.id, posX, posY, scale, onUpdateAdjustment, isEditable]);

  return (
    <div className="relative group transition-all duration-300">
      <div 
        data-pdf-item
        className="bg-white p-[0.4cm] shadow-xl border border-stone-100 flex flex-col items-center select-none"
        style={{ width: '6.5cm', height: '9.0cm' }}
      >
        {/* Photo area */}
        <div 
          ref={containerRef}
          className={`w-full h-[6.2cm] bg-stone-100 overflow-hidden relative shadow-inner cursor-pointer ${
            isEditable ? 'hover:ring-2 ring-amber-400 ring-inset transition-all' : ''
          } ${isDragging ? 'cursor-grabbing' : showControls ? 'cursor-grab' : 'cursor-pointer'}`}
          onClick={() => isEditable && !isDragging && setShowControls(!showControls)}
          onMouseDown={handleMouseDown}
        >
          <img 
            src={photo.url} 
            alt="User photo" 
            draggable={false}
            className="w-full h-full object-cover pointer-events-none transition-all duration-75"
            style={{ 
              filter: photo.filter,
              transform: `scale(${scale})`,
              objectPosition: `${posX}% ${posY}%`,
              opacity: (showControls && isEditable) ? 0.6 : 1
            }}
          />
          
          {isEditable && showControls && !isDragging && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/60 text-[8px] px-2 py-1 rounded-full text-white pointer-events-none uppercase tracking-wider no-print">
              Arraste para alinhar
            </div>
          )}

          {isEditable && showControls && (
            <div 
              className="absolute inset-0 flex flex-col items-center justify-end p-2 text-white no-print pointer-events-none"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full space-y-2 bg-black/50 backdrop-blur-sm p-2 rounded-lg pointer-events-auto">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase">Ajustes</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowControls(false); }}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-2 py-0.5 rounded text-[8px] font-bold"
                  >
                    OK
                  </button>
                </div>
                
                <div className="flex flex-col">
                  <label className="text-[8px] font-semibold flex justify-between">
                    <span>Zoom</span>
                    <span>{scale.toFixed(1)}x</span>
                  </label>
                  <input 
                    type="range" min="0.1" max="4" step="0.1" value={scale}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onUpdateAdjustment?.(photo.id, { scale: parseFloat(e.target.value) })}
                    className="w-full accent-amber-500 h-1 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="absolute inset-0 pointer-events-none opacity-10 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/p6.png')]"></div>
        </div>

        {/* Caption area */}
        <div className="mt-auto w-full flex flex-col items-center pb-1">
          {isEditable ? (
            <input
              type="text"
              value={photo.caption}
              onChange={(e) => onUpdateCaption?.(photo.id, e.target.value)}
              placeholder="Legenda..."
              className="w-full text-center polaroid-font text-xl bg-transparent border-none outline-none focus:ring-0 text-stone-700 placeholder:text-stone-300"
            />
          ) : (
            <span className="polaroid-font text-xl text-stone-700 h-8 overflow-hidden text-ellipsis whitespace-nowrap w-full text-center flex items-center justify-center">
              {photo.caption}
            </span>
          )}
        </div>
      </div>

      {isEditable && !showControls && (
        <button
          onClick={() => onDelete?.(photo.id)}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg no-print z-10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};
