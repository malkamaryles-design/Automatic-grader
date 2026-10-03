import React, { useState } from 'react';
import {
  X,
  ScanText,
  Copy,
  Check,
  Code2,
  FileText,
  AlertTriangle,
  Play,
  Edit3,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { OcrResult, ExamImage } from '../types/evaluation';
import { CodeViewer } from './CodeViewer';
import { VisualOcrViewer } from './VisualOcrViewer';

interface OcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  ocrResult: OcrResult | null;
  isLoading: boolean;
  images?: ExamImage[];
  onEvaluateWithCode?: (code: string) => void;
}

export const OcrModal: React.FC<OcrModalProps> = ({
  isOpen,
  onClose,
  ocrResult,
  isLoading,
  images = [],
  onEvaluateWithCode,
}) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'code' | 'hebrew' | 'raw'>('visual');
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState('');

  React.useEffect(() => {
    if (ocrResult?.transcription?.code) {
      setEditedCode(ocrResult.transcription.code);
    }
  }, [ocrResult]);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartEvaluate = () => {
    if (onEvaluateWithCode) {
      onEvaluateWithCode(isEditing ? editedCode : ocrResult?.transcription?.code || '');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ScanText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>פענוח ותמלול כתב יד (OCR)</span>
                {ocrResult?.detectedLanguage && (
                  <span className="text-xs font-mono font-normal bg-indigo-950 text-indigo-300 border border-indigo-800/60 px-2 py-0.5 rounded-md">
                    {ocrResult.detectedLanguage}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                זיהוי מדויק של קוד והערכות בעברית מתוך תמונת המבחן
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-white">מפענח את כתב היד...</h3>
                <p className="text-xs text-slate-400">סורק אותיות, מזהה שפת תכנות ומפריד הערות בעברית מקוד</p>
              </div>
            </div>
          ) : !ocrResult ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              לא נמצאו נתוני OCR להצגה.
            </div>
          ) : !ocrResult.isReadable ? (
            <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-800/80 text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
              <h3 className="text-lg font-bold text-rose-200">התמונה אינה קריאה מספיק</h3>
              <p className="text-sm text-rose-300 max-w-md mx-auto">
                {ocrResult.unreadableReason || 'לא הצלחנו לזהות קוד או כתב יד בצורה ברורה.'}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Badges / Metrics */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">
                    שפת תכנות שזוהתה: <strong className="text-indigo-400 font-mono">{ocrResult.detectedLanguage}</strong>
                  </span>
                  {ocrResult.confidenceScore !== undefined && (
                    <span className="text-slate-400">
                      ביטחון זיהוי: <strong className="text-emerald-400">{ocrResult.confidenceScore}%</strong>
                    </span>
                  )}
                  {ocrResult.problemTitle && (
                    <span className="text-slate-400 hidden sm:inline">
                      נושא: <strong className="text-slate-200">{ocrResult.problemTitle}</strong>
                    </span>
                  )}
                </div>

                {/* Tab switchers */}
                <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 flex-wrap gap-1">
                  {images && images.length > 0 && (
                    <button
                      onClick={() => setActiveTab('visual')}
                      className={`px-3 py-1 rounded-lg transition font-medium flex items-center gap-1.5 ${
                        activeTab === 'visual'
                          ? 'bg-indigo-600 text-white shadow'
                          : 'text-indigo-400 hover:text-white'
                      }`}
                    >
                      <ScanText className="w-3.5 h-3.5" />
                      <span>מפת זיהוי על הדף (ויזואלי)</span>
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('code')}
                    className={`px-3 py-1 rounded-lg transition font-medium flex items-center gap-1.5 ${
                      activeTab === 'code'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>קוד מחולץ</span>
                  </button>
                  {ocrResult.transcription.hebrewProse && (
                    <button
                      onClick={() => setActiveTab('hebrew')}
                      className={`px-3 py-1 rounded-lg transition font-medium flex items-center gap-1.5 ${
                        activeTab === 'hebrew'
                          ? 'bg-indigo-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>הסברים בעברית</span>
                    </button>
                  )}
                  {ocrResult.transcription.rawText && (
                    <button
                      onClick={() => setActiveTab('raw')}
                      className={`px-3 py-1 rounded-lg transition font-medium flex items-center gap-1.5 ${
                        activeTab === 'raw'
                          ? 'bg-indigo-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>טקסט גולמי</span>
                    </button>
                  )}
                </div>
              </div>

              {/* TAB 0: VISUAL OCR OVERLAY ON ORIGINAL DOCUMENT */}
              {activeTab === 'visual' && images && images.length > 0 && (
                <div className="space-y-4">
                  <VisualOcrViewer
                    images={images}
                    detectedRegions={ocrResult.detectedRegions}
                    transcription={ocrResult.transcription}
                    problemTitle={ocrResult.problemTitle}
                    detectedLanguage={ocrResult.detectedLanguage}
                  />
                </div>
              )}

              {/* TAB 1: CODE */}
              {activeTab === 'code' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Code2 className="w-4 h-4 text-indigo-400" />
                      <span>קוד התוכנית שחולץ מהמחברת (אותנטי מכתב יד)</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
                          isEditing
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isEditing ? 'סיום עריכה' : 'ערוך קוד'}</span>
                      </button>

                      <button
                        onClick={() => handleCopy(isEditing ? editedCode : ocrResult.transcription.code)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>העתק</span>
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editedCode}
                        onChange={(e) => setEditedCode(e.target.value)}
                        dir="ltr"
                        rows={12}
                        className="w-full p-4 rounded-xl bg-slate-950 border border-amber-500/40 text-emerald-300 font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed resize-y"
                        placeholder="ערוך את הקוד כאן..."
                      />
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>ערכת את הקוד ידנית. תוכל להעריך ישירות קוד זה.</span>
                        <button
                          onClick={() => setEditedCode(ocrResult.transcription.code)}
                          className="text-slate-400 hover:text-white flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>אפס למקור מכתב יד</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <CodeViewer
                      code={ocrResult.transcription.code}
                      language={ocrResult.detectedLanguage?.toLowerCase() || 'python'}
                      title="תמלול קוד"
                      badge="OCR מדויק"
                      badgeColor="indigo"
                      maxHeight="max-h-[380px]"
                    />
                  )}
                </div>
              )}

              {/* TAB 2: HEBREW PROSE */}
              {activeTab === 'hebrew' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      <span>הסברים, כותרות והערות בעברית שחולצו מהדף</span>
                    </span>
                    <button
                      onClick={() => handleCopy(ocrResult.transcription.hebrewProse || '')}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>העתק</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap text-right font-sans">
                    {ocrResult.transcription.hebrewProse || 'לא אותרו הסברים מילוליים בעברית בדף זה.'}
                  </div>
                </div>
              )}

              {/* TAB 3: RAW TEXT */}
              {activeTab === 'raw' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      <span>כל הטקסט שחולץ מהדף (Raw OCR Dump)</span>
                    </span>
                    <button
                      onClick={() => handleCopy(ocrResult.transcription.rawText || '')}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>העתק</span>
                    </button>
                  </div>

                  <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono leading-relaxed whitespace-pre-wrap max-h-[350px] overflow-y-auto">
                    {ocrResult.transcription.rawText || 'לא חולץ טקסט גולמי נוסף.'}
                  </pre>
                </div>
              )}

              {/* Handwriting Notes Card */}
              {ocrResult.handwritingNotes && (
                <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-200/90 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold block text-indigo-300">תובנות כתב יד וקריאות:</span>
                    <span>{ocrResult.handwritingNotes}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-900/90">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            סגור
          </button>

          {ocrResult && ocrResult.isReadable && onEvaluateWithCode && (
            <button
              onClick={handleStartEvaluate}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition transform hover:scale-[1.02]"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>
                {isEditing ? 'בדוק והערך לפי הקוד שנערך' : 'המשך לבדיקה והערכה מלאה'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
