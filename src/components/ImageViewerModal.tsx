import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, SunMedium } from 'lucide-react';
import { ExamImage } from '../types/evaluation';

interface ImageViewerModalProps {
  image: ExamImage;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ image, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(image.rotation || 0);
  const [enhancePencil, setEnhancePencil] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-slate-200 mb-3">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm">{image.name}</span>
          <span className="text-xs text-slate-500">גלילה/זום לבחינת כתב היד</span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((prev) => Math.min(3, prev + 0.25))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="הגדל"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.25))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="הקטן"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setRotation((prev) => (prev + 90) % 360)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="סובב"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setEnhancePencil((prev) => !prev)}
            className={`p-1.5 rounded-lg transition ${
              enhancePencil
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="הבלטת כתב יד בעיפרון (הגברת ניגודיות)"
          >
            <SunMedium className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-slate-700" />
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main image canvas */}
      <div className="flex-1 bg-slate-950 rounded-xl overflow-auto flex items-center justify-center p-4 border border-slate-800/80">
        <img
          src={image.dataUrl}
          alt={image.name}
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            filter: enhancePencil ? 'contrast(170%) brightness(90%) grayscale(60%)' : 'none',
            transition: 'transform 0.2s ease',
          }}
          className="max-h-[85vh] max-w-full object-contain cursor-grab active:cursor-grabbing select-none"
        />
      </div>
    </div>
  );
};
