import React from 'react';
import { SAMPLE_EXAMS, SampleExam } from '../data/sampleExams';
import { X, Sparkles, BookOpen, CheckCircle, ArrowLeft } from 'lucide-react';

interface SampleExamModalProps {
  onSelect: (sample: SampleExam) => void;
  onClose: () => void;
}

export const SampleExamModal: React.FC<SampleExamModalProps> = ({ onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">בחר מבחן לדוגמה בכתב יד</h3>
              <p className="text-xs text-slate-400">בדיקה מהירה בקליק אחד ללא צורך בהעלאת תמונות חיצוניות</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of sample exams */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5">
          {SAMPLE_EXAMS.map((sample) => (
            <div
              key={sample.id}
              onClick={() => {
                onSelect(sample);
                onClose();
              }}
              className="group p-4 bg-slate-950/60 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/50 rounded-xl cursor-pointer transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-200 group-hover:text-indigo-300 transition text-base">
                    {sample.title}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                    {sample.language}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                    טווח צפוי: {sample.expectedScoreRange}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{sample.description}</p>
                <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span className="line-clamp-1 italic">{sample.examQuestion}</span>
                </div>
              </div>

              <button
                type="button"
                className="px-3.5 py-2 rounded-lg bg-indigo-600/20 group-hover:bg-indigo-600 text-indigo-300 group-hover:text-white text-xs font-semibold flex items-center gap-1.5 transition self-end sm:self-center shrink-0 border border-indigo-500/30"
              >
                <span>טען ובדוק</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>הדוגמאות כוללות דפי מחברת משובצים עם כתב יד, הערות בעברית וקטעי קוד.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};
