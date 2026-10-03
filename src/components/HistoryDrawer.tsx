import React from 'react';
import { X, Clock, Trash2, Award, ChevronLeft } from 'lucide-react';
import { GradedSubmission } from '../types/evaluation';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  submissions: GradedSubmission[];
  onSelectSubmission: (submission: GradedSubmission) => void;
  onClearHistory: () => void;
  onDeleteSubmission: (id: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  submissions,
  onSelectSubmission,
  onClearHistory,
  onDeleteSubmission,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-start">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-slate-100">היסטוריית מבחנים שנבדקו</h3>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
              {submissions.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {submissions.length === 0 ? (
            <div className="text-center py-16 text-slate-500 space-y-3">
              <Award className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm font-medium">אין עדיין מבחנים שמורים</p>
              <p className="text-xs max-w-xs mx-auto">
                בדיקות שתבצע יישמרו כאן אוטומטית לעיון חוזר
              </p>
            </div>
          ) : (
            submissions.map((sub) => (
              <div
                key={sub.id}
                onClick={() => {
                  onSelectSubmission(sub);
                  onClose();
                }}
                className="group p-3.5 bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 rounded-xl cursor-pointer transition flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  {sub.thumbnailUrl ? (
                    <img
                      src={sub.thumbnailUrl}
                      alt="Thumbnail"
                      className="w-12 h-14 object-cover rounded-lg bg-slate-900 border border-slate-800 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-14 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400 font-mono text-xs font-bold">
                      {sub.detectedLanguage.slice(0, 3)}
                    </div>
                  )}

                  <div className="space-y-1 min-w-0">
                    <h4 className="font-semibold text-sm text-slate-200 group-hover:text-indigo-300 truncate">
                      {sub.title || 'מבחן במדעי המחשב'}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-mono text-indigo-400">{sub.detectedLanguage}</span>
                      <span>•</span>
                      <span>{new Date(sub.timestamp).toLocaleDateString('he-IL')}</span>
                    </div>
                    {(sub.studentName || sub.result?.studentName) && (
                      <div className="text-[11px] text-indigo-300 font-semibold truncate">
                        תלמיד/ה: {sub.studentName || sub.result?.studentName}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-lg font-black font-mono text-white block">
                      {sub.score}
                    </span>
                    <span className="text-[10px] text-slate-400 block">{sub.gradeCategory}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSubmission(sub.id);
                    }}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition opacity-0 group-hover:opacity-100"
                    title="מחק מההיסטוריה"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {submissions.length > 0 && (
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={onClearHistory}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>נקה את כל ההיסטוריה</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition"
            >
              סגור
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
