import React, { useState, useRef } from 'react';
import { X, FileDown, Printer, FileText, Check, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { EvaluationResult } from '../types/evaluation';
import { OfficialPdfReport } from './OfficialPdfReport';
import { generateAndDownloadPdf, downloadPrintableHtml } from '../utils/pdfExport';

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: EvaluationResult;
  studentName: string;
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  isOpen,
  onClose,
  result,
  studentName,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'options'>('options');
  const reportRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPdf(true);
    setErrorMessage(null);
    setStatusMessage('מייצר קובץ PDF באיכות גבוהה עם כל מרכיבי הדוח...');

    try {
      await generateAndDownloadPdf(reportRef.current, studentName, result.problemTitle);
      setStatusMessage('קובץ ה-PDF הופק והורד בהצלחה למחשבך!');
      setTimeout(() => {
        setStatusMessage(null);
      }, 4000);
    } catch (err: any) {
      console.error('PDF export failed:', err);
      setErrorMessage(
        'חלה שגיאה ביצירת ה-PDF הישיר. מומלץ ללחוץ על "הורד קובץ HTML להדפסה" כתחליף מהיר ומושלם.'
      );
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadHtml = () => {
    try {
      downloadPrintableHtml(result, studentName);
      setStatusMessage('קובץ ה-HTML הרשמי הורד בהצלחה! ניתן לפתוח ולהדפיס ב-Ctrl+P.');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('חלה שגיאה בהורדת קובץ ה-HTML.');
    }
  };

  const handleBrowserPrint = () => {
    try {
      window.print();
    } catch (err: any) {
      console.warn('window.print blocked by sandbox', err);
      setErrorMessage(
        'הדפסה ישירה נחסמה על ידי הגנת האבטחה של הדפדפן במסגרת מוטמעת. הורדנו עבורך את קובץ ה-PDF ישירות במקום!'
      );
      handleDownloadPdf();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5 text-right">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">ייצוא והדפסת דוח הערכה רשמי</h2>
              <p className="text-xs text-slate-400">
                הורדת דוח פדגוגי מפורט עבור: <strong className="text-indigo-300">{studentName || 'התלמיד/ה'}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Banners */}
        {statusMessage && (
          <div className="mx-4 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mx-4 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab switcher: Quick Actions vs Document Preview */}
        <div className="px-5 pt-4 flex items-center gap-2 border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('options')}
            className={`pb-2.5 font-bold transition border-b-2 ${
              activeTab === 'options'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            אפשרויות ייצוא והורדה
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`pb-2.5 font-bold transition border-b-2 ${
              activeTab === 'preview'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            תצוגה מקדימה של הדוח הרשמי
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === 'options' ? (
            <div className="space-y-4">
              <div className="text-right">
                <h3 className="text-sm font-bold text-slate-200 mb-1">בחר את פורמט הייצוא הרצוי:</h3>
                <p className="text-xs text-slate-400">
                  כל המסמכים כוללים את שם התלמיד, ציון סופי, טבלת מחוון מפורטת, שגיאות, והסבר פדגוגי.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Option 1: Direct PDF Download */}
                <div className="bg-slate-950/80 border border-indigo-500/40 rounded-2xl p-4 flex flex-col justify-between space-y-3 relative group hover:border-indigo-500 transition shadow-lg shadow-indigo-950/30">
                  <div className="absolute top-3 left-3 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-500/30">
                    מומלץ
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow">
                      <FileDown className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-sm text-white">הורדת קובץ PDF רשמי</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      מייצר קובץ PDF מלא של דוח הבדיקה להדפסה, חלוקה לתלמיד או שליחה להורים.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadPdf}
                    disabled={isGeneratingPdf}
                    className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30"
                  >
                    {isGeneratingPdf ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>מייצר PDF...</span>
                      </>
                    ) : (
                      <>
                        <FileDown className="w-4 h-4" />
                        <span>הורד עכשיו כ-PDF</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Option 2: Standalone HTML with Print styles */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-700 transition">
                  <div className="space-y-2 text-right">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-sm text-white">הורדת דוח HTML מעוצב</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      קובץ עצמאי הנטען בכל דפדפן עם תמיכה מושלמת בהדפסה מקומית ברזולוציה מקסימלית (Ctrl+P).
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadHtml}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-700"
                  >
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>הורד דוח HTML</span>
                  </button>
                </div>

                {/* Option 3: Browser Print Dialog */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-700 transition">
                  <div className="space-y-2 text-right">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                      <Printer className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-sm text-white">הדפסה ישירה במדפסת</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      שולח את הדוח ישירות למדפסת הדפדפן. (אם החלון חסום, יופעל גיבוי PDF אוטומטי).
                    </p>
                  </div>
                  <button
                    onClick={handleBrowserPrint}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-700"
                  >
                    <Printer className="w-4 h-4 text-blue-400" />
                    <span>שלח להדפסה</span>
                  </button>
                </div>
              </div>

              {/* Student Details Summary box */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-right space-y-2">
                <div className="font-bold text-slate-300">פרטי הדוח שיופק:</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-400">
                  <div>שם: <strong className="text-white">{studentName || 'לא הוגדר'}</strong></div>
                  <div>ציון: <strong className="text-emerald-400">{result.evaluation?.finalScore ?? 0}</strong></div>
                  <div>שפה: <strong className="text-indigo-400 font-mono">{result.detectedLanguage}</strong></div>
                  <div>קריטריונים: <strong className="text-white">{result.evaluation?.criteriaScores?.length || 0}</strong></div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Document Preview View */}
          <div className={activeTab === 'preview' ? 'block' : 'hidden'}>
            <div className="flex justify-center bg-slate-800/40 p-4 rounded-xl border border-slate-800 overflow-x-auto">
              <OfficialPdfReport
                ref={reportRef}
                result={result}
                studentName={studentName}
              />
            </div>
          </div>
        </div>

        {/* Hidden render for html2canvas capture if preview tab is not open */}
        {activeTab !== 'preview' && (
          <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', opacity: 0 }}>
            <OfficialPdfReport
              ref={reportRef}
              result={result}
              studentName={studentName}
            />
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/80">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
          >
            סגור
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/30"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>מייצר קובץ...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                <span>הורד קובץ PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
