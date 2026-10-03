import React, { useState } from 'react';
import { RotateCw, Trash2, Eye, SunMedium, ZoomIn } from 'lucide-react';
import { ExamImage } from '../types/evaluation';

interface ImagePreviewCardProps {
  image: ExamImage;
  index: number;
  total: number;
  onRemove: (id: string) => void;
  onRotate: (id: string) => void;
  onTogglePencilEnhance: (id: string) => void;
  onViewFull: (image: ExamImage) => void;
}

export const ImagePreviewCard: React.FC<ImagePreviewCardProps> = ({
  image,
  index,
  total,
  onRemove,
  onRotate,
  onTogglePencilEnhance,
  onViewFull,
}) => {
  const isEnhanced = (image.contrast ?? 100) > 100;
  const rotation = image.rotation || 0;

  return (
    <div className="group relative bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-md hover:border-indigo-500/50 transition flex flex-col">
      {/* Top bar info */}
      <div className="px-3 py-2 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
        <span className="font-medium flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[11px]">
            {index + 1}
          </span>
          עמוד {index + 1} מתוך {total}
        </span>
        <span className="text-slate-500 truncate max-w-[120px]">{image.name}</span>
      </div>

      {/* Image Thumbnail viewport */}
      <div
        onClick={() => onViewFull(image)}
        className="relative aspect-[3/4] bg-slate-950 flex items-center justify-center overflow-hidden cursor-pointer"
      >
        <img
          src={image.dataUrl}
          alt={image.name}
          style={{
            transform: `rotate(${rotation}deg)`,
            filter: isEnhanced
              ? 'contrast(160%) brightness(95%) grayscale(60%)'
              : 'none',
          }}
          className="w-full h-full object-contain transition-all duration-300"
        />

        {/* Hover zoom overlay */}
        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <span className="bg-slate-900/90 text-white text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 backdrop-blur-sm border border-slate-700">
            <ZoomIn className="w-3.5 h-3.5 text-indigo-400" />
            הגדל תצוגה
          </span>
        </div>

        {/* Pencil mode indicator badge */}
        {isEnhanced && (
          <div className="absolute bottom-2 right-2 bg-amber-500/90 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded shadow">
            הבלטת עיפרון פעילה
          </div>
        )}
      </div>

      {/* Bottom Action buttons */}
      <div className="p-2 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between gap-1">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRotate(image.id);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition"
            title="סובב ב-90 מעלות"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePencilEnhance(image.id);
            }}
            className={`p-1.5 rounded-lg transition ${
              isEnhanced
                ? 'text-amber-400 bg-amber-500/20'
                : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800'
            }`}
            title="הבלטת כתב יד בעיפרון בהיר (הגברת ניגודיות)"
          >
            <SunMedium className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewFull(image);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title="צפה בגודל מלא"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(image.id);
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
          title="הסר עמוד זה"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
