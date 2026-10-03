import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  FileCode,
  PenTool,
  Printer,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Award,
  ArrowRight,
  Split,
  Eye,
  ScanText,
  Edit3,
  Play,
  Code2,
  FileText,
  GraduationCap,
  User,
  X,
} from 'lucide-react';
import { EvaluationResult, ExamImage } from '../types/evaluation';
import { CodeViewer } from './CodeViewer';
import { VisualOcrViewer } from './VisualOcrViewer';

interface EvaluationDashboardProps {
  result: EvaluationResult;
  images: ExamImage[];
  onReset: () => void;
  onReEvaluate?: (customCode: string) => Promise<void>;
  studentName?: string;
  onUpdateStudentName?: (name: string) => void;
}

export const EvaluationDashboard: React.FC<EvaluationDashboardProps> = ({
  result,
  images,
  onReset,
  onReEvaluate,
  studentName: initialStudentName,
  onUpdateStudentName,
}) => {
  const [activeTab, setActiveTab] = useState<'structured' | 'visual' | 'ocr' | 'compare' | 'markdown'>('structured');
  const [copiedProtocol, setCopiedProtocol] = useState(false);
  const [copiedOcrCode, setCopiedOcrCode] = useState(false);
  const [copiedHebrewProse, setCopiedHebrewProse] = useState(false);
  const [copiedRawText, setCopiedRawText] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Student name state & inline editing
  const [currentStudentName, setCurrentStudentName] = useState<string>(
    result.studentName || initialStudentName || ''
  );
  const [isEditingStudentName, setIsEditingStudentName] = useState(false);
  const [tempStudentName, setTempStudentName] = useState(
    result.studentName || initialStudentName || ''
  );

  React.useEffect(() => {
    if (result.studentName) {
      setCurrentStudentName(result.studentName);
      setTempStudentName(result.studentName);
    } else if (initialStudentName) {
      setCurrentStudentName(initialStudentName);
      setTempStudentName(initialStudentName);
    }
  }, [result.studentName, initialStudentName]);

  const handleSaveStudentName = () => {
    const trimmed = tempStudentName.trim();
    setCurrentStudentName(trimmed);
    result.studentName = trimmed;
    if (onUpdateStudentName) {
      onUpdateStudentName(trimmed);
    }
    setIsEditingStudentName(false);
  };

  // Full official markdown formatted report with student name
  const activeMarkdown = React.useMemo(() => {
    let md = result.fullFormattedHebrewMarkdown || '';
    if (currentStudentName && !md.includes('שם התלמיד')) {
      md = `**שם התלמיד/ה:** ${currentStudentName}\n\n` + md;
    }
    return md;
  }, [result.fullFormattedHebrewMarkdown, currentStudentName]);

  // Live OCR editing & re-evaluation
  const [isEditingOcr, setIsEditingOcr] = useState(false);
  const [editedCode, setEditedCode] = useState(result.transcription?.code || '');
  const [isReEvaluating, setIsReEvaluating] = useState(false);

  // For unreadable images - let user view partial OCR anyway
  const [showUnreadableOcr, setShowUnreadableOcr] = useState(false);

  React.useEffect(() => {
    if (result.transcription?.code) {
      setEditedCode(result.transcription.code);
    }
  }, [result]);

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(activeMarkdown);
    setCopiedProtocol(true);
    setTimeout(() => setCopiedProtocol(false), 2000);
  };

  const handleCopyOcrCode = () => {
    navigator.clipboard.writeText(isEditingOcr ? editedCode : result.transcription.code);
    setCopiedOcrCode(true);
    setTimeout(() => setCopiedOcrCode(false), 2000);
  };

  const handleCopyHebrewProse = () => {
    navigator.clipboard.writeText(result.transcription.hebrewProse || '');
    setCopiedHebrewProse(true);
    setTimeout(() => setCopiedHebrewProse(false), 2000);
  };

  const handleCopyRawText = () => {
    navigator.clipboard.writeText(result.transcription.rawText || result.transcription.code);
    setCopiedRawText(true);
    setTimeout(() => setCopiedRawText(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleTriggerReEvaluate = async () => {
    if (!onReEvaluate) return;
    setIsReEvaluating(true);
    try {
      await onReEvaluate(editedCode);
      setIsEditingOcr(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsReEvaluating(false);
    }
  };

  // If unreadable image and user hasn't chosen to view OCR anyway
  if (!result.isReadable && !showUnreadableOcr) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-rose-950/40 border border-rose-800/80 rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-rose-200">
            התמונה אינה קריאה מספיק לצורך בדיקה אוטומטית
          </h2>
          <p className="text-base text-rose-300/90 max-w-xl mx-auto leading-relaxed">
            {result.unreadableReason ||
              'לא ניתן היה לפענח את כתב היד או קטעי הקוד בצורה מהימנה עקב חדות נמוכה, חיתוך הדף, או תאורה לא מספקת.'}
          </p>

          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 text-right max-w-md mx-auto text-sm text-slate-300 space-y-2">
            <div className="font-semibold text-slate-100 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>המלצות לצילום חוזר מוצלח:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-xs">
              <li>ודא תאורה ישירה וללא צללים כבדים על דף המחברת.</li>
              <li>בכתיבה בעיפרון בהיר - לחץ על כפתור "הבלטת עיפרון" להגברת ניגודיות.</li>
              <li>השתמש במסגרת ההנחיה במצלמה כדי לכלול את כל קטע הקוד.</li>
            </ul>
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onReset}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium inline-flex items-center gap-2 transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>צלם או העלה מחדש</span>
            </button>

            {/* User can view OCR anyway and fix it */}
            <button
              onClick={() => {
                setShowUnreadableOcr(true);
                setActiveTab('ocr');
              }}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold inline-flex items-center gap-2 transition shadow-lg shadow-indigo-600/30"
            >
              <ScanText className="w-4 h-4" />
              <span>צפה במה שה-OCR פענח בכל זאת / ערוך ידנית</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const score = result.evaluation?.finalScore ?? 0;
  const getScoreColor = (num: number) => {
    if (num >= 85) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (num >= 70) return 'text-blue-400 border-blue-500/40 bg-blue-500/10';
    if (num >= 55) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Printable Official Exam Evaluation Header (Visible only in print) */}
      <div className="hidden print:block mb-6 p-6 bg-white text-slate-900 border-b-2 border-slate-900">
        <div className="flex justify-between items-start">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-black text-slate-950">דוח הערכת מבחן מדעי המחשב</h1>
            <p className="text-xs text-slate-600">מערכת בדיקה אוטומטית לפי מחוון רשמי וקוד בכתב יד</p>
            <div className="pt-2 space-y-1 text-sm text-slate-800">
              <div className="text-base font-bold text-slate-950">
                שם התלמיד/ה: <span className="underline decoration-2">{currentStudentName || '____________________'}</span>
              </div>
              <div>נושא המבחן: <strong>{result.problemTitle || 'הערכת שאלה ופתרון קוד'}</strong></div>
              <div>שפת תכנות: <strong>{result.detectedLanguage}</strong></div>
              <div>תאריך בדיקה: <strong>{new Date().toLocaleDateString('he-IL')}</strong></div>
            </div>
          </div>
          <div className="text-center border-2 border-slate-900 p-4 rounded-2xl min-w-[130px] bg-slate-50">
            <div className="text-xs uppercase font-bold text-slate-700">ציון סופי</div>
            <div className="text-4xl font-black text-slate-950 my-1">{score}</div>
            <div className="text-xs font-bold text-slate-800">{result.evaluation?.gradeCategory}</div>
          </div>
        </div>
      </div>

      {/* Top Action Bar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onReset}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowRight className="w-4 h-4" />
            <span>בדיקת מבחן נוסף</span>
          </button>
          <div className="h-4 w-px bg-slate-700 hidden sm:block" />
          <span className="text-xs text-slate-400 hidden sm:inline">
            שפה זוהתה: <strong className="text-indigo-400 font-mono">{result.detectedLanguage}</strong>
          </span>
          {result.problemTitle && (
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md max-w-xs truncate hidden md:inline">
              נושא: {result.problemTitle}
            </span>
          )}
          <div className="h-4 w-px bg-slate-700 hidden sm:block" />
          <div className="flex items-center gap-1.5 text-xs bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-slate-400">תלמיד/ה:</span>
            <strong className="text-white font-semibold">{currentStudentName || 'לא צוין'}</strong>
          </div>
        </div>

        {/* View Mode Switcher & Export */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('structured')}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                activeTab === 'structured'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              לוח הערכה מובנה
            </button>
            <button
              onClick={() => setActiveTab('visual')}
              className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 ${
                activeTab === 'visual'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-indigo-400 hover:text-white'
              }`}
            >
              <ScanText className="w-3.5 h-3.5" />
              <span>דף מקורי וסימוני OCR</span>
            </button>
            <button
              onClick={() => setActiveTab('ocr')}
              className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 ${
                activeTab === 'ocr'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>עריכת תמלול OCR</span>
            </button>
            <button
              onClick={() => setActiveTab('compare')}
              className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1 ${
                activeTab === 'compare'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Split className="w-3.5 h-3.5" />
              <span>השוואת כתב יד</span>
            </button>
            <button
              onClick={() => setActiveTab('markdown')}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                activeTab === 'markdown'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              דוח טקסט רשמי
            </button>
          </div>

          <button
            onClick={handleCopyMarkdown}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition"
            title="העתק פרוטוקול בדיקה מלא (Markdown)"
          >
            {copiedProtocol ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span className="hidden sm:inline">העתק דוח</span>
          </button>

          <button
            onClick={handlePrint}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition"
            title="הדפס או שמור כ-PDF"
          >
            <Printer className="w-4 h-4" />
            <span>הדפס PDF</span>
          </button>
        </div>
      </div>

      {/* Unreadable banner with edit option if forced */}
      {!result.isReadable && showUnreadableOcr && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-600/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>
              <strong>שימת לב:</strong> הדף סווג כמטושטש או מקוטע, אך מוצג כאן הפענוח החלקי של מנוע ה-OCR. תוכל לערוך את הקוד ולבצע בדיקה.
            </span>
          </div>
          <button
            onClick={() => setActiveTab('ocr')}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-bold shrink-0"
          >
            מעבר לעריכת OCR
          </button>
        </div>
      )}

      {/* TAB: VISUAL OCR OVERLAY ON ORIGINAL DOCUMENT */}
      {activeTab === 'visual' && (
        <div className="space-y-6">
          <VisualOcrViewer
            images={images}
            detectedRegions={result.detectedRegions}
            transcription={result.transcription}
            problemTitle={result.problemTitle}
            detectedLanguage={result.detectedLanguage}
          />
        </div>
      )}

      {/* TAB: DEDICATED OCR INSPECTION */}
      {activeTab === 'ocr' && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <ScanText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>פענוח OCR ותמלול מלא של כתב היד</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                    {result.detectedLanguage}
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  צפייה בקוד שחולץ, עריכת תמלול במקרה של אי-דיוק וחישוב ציון מחדש
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditingOcr(!isEditingOcr)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  isEditingOcr
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                <span>{isEditingOcr ? 'סיום עריכה' : 'עריכת תמלול (Live Edit)'}</span>
              </button>

              <button
                onClick={handleCopyOcrCode}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition"
              >
                {copiedOcrCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>העתק קוד</span>
              </button>
            </div>
          </div>

          {/* Split OCR Grid: Left image, Right OCR Code & Hebrew */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scanned Image Preview */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-indigo-400" />
                  <span>צילום דף המבחן שהועלה</span>
                </span>
                {images.length > 1 && (
                  <div className="flex items-center gap-1">
                    <span>עמוד:</span>
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`w-6 h-6 rounded text-xs font-bold ${
                          selectedImageIndex === idx
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative aspect-[3/4] bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-slate-800 group">
                {images[selectedImageIndex] ? (
                  <img
                    src={images[selectedImageIndex].dataUrl}
                    alt="Handwritten exam scan"
                    className="w-full h-full object-contain"
                    style={{
                      transform: `rotate(${images[selectedImageIndex].rotation || 0}deg)`,
                      filter: `contrast(${images[selectedImageIndex].contrast || 100}%) brightness(${
                        images[selectedImageIndex].brightness || 100
                      }%)`,
                    }}
                  />
                ) : (
                  <span className="text-slate-500 text-xs">אין תמונה זמינה</span>
                )}
              </div>
            </div>

            {/* OCR Code & Hebrew Notes */}
            <div className="space-y-5 flex flex-col">
              {/* Code Box or Editor */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-indigo-400" />
                    <span>
                      {isEditingOcr ? 'עריכת קוד מתומלל (תיקון אותיות OCR)' : 'קוד מתומלל מכתב היד (OCR Code)'}
                    </span>
                  </span>

                  {isEditingOcr && (
                    <button
                      onClick={() => setEditedCode(result.transcription.code)}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>אפס למקור</span>
                    </button>
                  )}
                </div>

                {isEditingOcr ? (
                  <div className="space-y-3 flex-1 flex flex-col">
                    <textarea
                      value={editedCode}
                      onChange={(e) => setEditedCode(e.target.value)}
                      dir="ltr"
                      rows={14}
                      className="w-full p-4 rounded-xl bg-slate-950 border border-amber-500/50 text-emerald-300 font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed resize-y flex-1"
                      placeholder="ערוך את הקוד כאן..."
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span className="text-xs text-slate-400">
                        הקוד עודכן ידנית. תוכל לחשב מחדש את הציון לפי תיקון זה.
                      </span>

                      {onReEvaluate && (
                        <button
                          onClick={handleTriggerReEvaluate}
                          disabled={isReEvaluating}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/30 transition"
                        >
                          {isReEvaluating ? (
                            <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                          ) : (
                            <Play className="w-4 h-4 fill-white" />
                          )}
                          <span>{isReEvaluating ? 'מחשב מחדש...' : 'שמור וחשב ציון מחדש'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <CodeViewer
                      code={result.transcription.code}
                      language={result.detectedLanguage.toLowerCase()}
                      title="תמלול קוד מהדף"
                      badge="OCR מדויק"
                      badgeColor="indigo"
                      maxHeight="max-h-[380px]"
                    />

                    {onReEvaluate && (
                      <div className="pt-1">
                        <button
                          onClick={() => setIsEditingOcr(true)}
                          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700/60 transition"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>גילית טעות פענוח ב-OCR? לחץ כאן לתיקון מהיר של הקוד וחישוב ציון מחדש</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Hebrew Prose Notes */}
              {result.transcription.hebrewProse && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <PenTool className="w-4 h-4 text-indigo-400" />
                      <span>הסברים מילוליים בעברית שחולצו מהדף (Hebrew Prose)</span>
                    </span>
                    <button
                      onClick={handleCopyHebrewProse}
                      className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
                    >
                      {copiedHebrewProse ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>העתק</span>
                    </button>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-sm text-slate-200 leading-relaxed font-sans text-right">
                    {result.transcription.hebrewProse}
                  </div>
                </div>
              )}

              {/* Raw Extracted Text Dump */}
              {result.transcription.rawText && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      <span>טקסט גולמי מלא שחולץ מהדף (Raw OCR Dump)</span>
                    </span>
                    <button
                      onClick={handleCopyRawText}
                      className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
                    >
                      {copiedRawText ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>העתק</span>
                    </button>
                  </div>
                  <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs font-mono text-slate-300 leading-relaxed max-h-[160px] overflow-y-auto whitespace-pre-wrap">
                    {result.transcription.rawText}
                  </pre>
                </div>
              )}

              {/* Handwriting and Legibility Observations */}
              {result.analysis?.handwritingNotes && (
                <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-200/90 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <span className="font-semibold block text-indigo-300">התחשבות בכתב יד ופענוח אותיות:</span>
                    <p className="leading-relaxed">{result.analysis.handwritingNotes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hero Score & Summary Card */}
      {result.evaluation && activeTab !== 'ocr' && activeTab !== 'visual' && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden print-card">
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            {/* Right/Main: Student feedback & criteria */}
            <div className="space-y-4 flex-1 text-center md:text-right">
              <div className="flex items-center gap-2 justify-center md:justify-start flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  הערכת מבחן מדעי המחשב
                </span>
                <span className="text-xs text-slate-400">
                  שפת קוד: <span className="font-mono text-slate-200">{result.detectedLanguage}</span>
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  דרגת ציון: {result.evaluation.gradeCategory}
                </span>

                {/* Prominent Student Name Badge & Editor */}
                <div className="flex items-center gap-2 bg-indigo-950/60 border border-indigo-500/40 px-3 py-1 rounded-full text-xs text-indigo-200 shadow-sm">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="font-semibold text-indigo-300">תלמיד/ה:</span>
                  {isEditingStudentName ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={tempStudentName}
                        onChange={(e) => setTempStudentName(e.target.value)}
                        placeholder="הזן שם תלמיד/ה..."
                        className="bg-slate-950 border border-indigo-400 rounded px-2 py-0.5 text-xs text-white focus:outline-none w-36"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveStudentName();
                          if (e.key === 'Escape') setIsEditingStudentName(false);
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleSaveStudentName}
                        className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                        title="שמור"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingStudentName(false)}
                        className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                        title="בטל"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white">
                        {currentStudentName || (
                          <span
                            onClick={() => {
                              setTempStudentName(currentStudentName);
                              setIsEditingStudentName(true);
                            }}
                            className="text-amber-300 font-medium cursor-pointer underline decoration-dotted hover:text-amber-200"
                          >
                            לחץ להזנת שם בדוח
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setTempStudentName(currentStudentName);
                          setIsEditingStudentName(true);
                        }}
                        className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-indigo-300 transition"
                        title="ערוך שם תלמיד/ה"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {result.problemTitle || 'הערכת שאלה ופתרון קוד בכתב יד'}
              </h1>

              {/* Supportive student message box */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-sm leading-relaxed text-slate-200">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-1 text-xs">
                  <Sparkles className="w-4 h-4" />
                  <span>משוב פדגוגי לתלמיד/ה:</span>
                </div>
                <p className="text-slate-300 font-normal">{result.evaluation.studentSummary}</p>
              </div>

              {/* Rubric Breakdown Progress Bars (50% Logic, 30% Syntax, 20% Style) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {/* Correctness & Logic (50%) */}
                <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex flex-col justify-between">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-400 font-medium">נכונות ולוגיקה (50%)</span>
                    <span className="font-bold text-indigo-400 font-mono">
                      {result.evaluation.logicScore} / 50
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, (result.evaluation.logicScore / 50) * 100)}%` }}
                    />
                  </div>
                  {result.evaluation.logicFeedback && (
                    <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">
                      {result.evaluation.logicFeedback}
                    </p>
                  )}
                </div>

                {/* Syntax & Semantics (30%) */}
                <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex flex-col justify-between">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-400 font-medium">תחביר וסמנטיקה (30%)</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {result.evaluation.syntaxScore} / 30
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, (result.evaluation.syntaxScore / 30) * 100)}%` }}
                    />
                  </div>
                  {result.evaluation.syntaxFeedback && (
                    <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">
                      {result.evaluation.syntaxFeedback}
                    </p>
                  )}
                </div>

                {/* Code Quality & Style (20%) */}
                <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex flex-col justify-between">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-400 font-medium">איכות וסגנון קוד (20%)</span>
                    <span className="font-bold text-amber-400 font-mono">
                      {result.evaluation.styleScore} / 20
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, (result.evaluation.styleScore / 20) * 100)}%` }}
                    />
                  </div>
                  {result.evaluation.styleFeedback && (
                    <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">
                      {result.evaluation.styleFeedback}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Left/Score Badge */}
            <div className="shrink-0 flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-950/80 border border-slate-800 min-w-[180px] shadow-inner text-center">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">
                ציון סופי במבחן
              </span>
              <div
                className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-105 ${getScoreColor(
                  score
                )}`}
              >
                <span className="text-4xl font-black font-mono tracking-tight">{score}</span>
                <span className="text-[11px] font-bold mt-0.5">מתוך 100</span>
              </div>
              <span className="mt-3 text-xs font-bold text-slate-300 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                {result.evaluation.gradeCategory}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Tab */}
      {activeTab === 'compare' && images.length > 0 && (
        <div className="space-y-4 no-print">
          <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Split className="w-4 h-4 text-indigo-400" />
              השוואה זו לצד זו: דף בכתב יד מול תמלול וקוד מתוקן
            </span>
            {images.length > 1 && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>עמוד מוצג:</span>
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImageIndex(i)}
                    className={`w-6 h-6 rounded-md font-bold text-xs ${
                      selectedImageIndex === i
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Original Handwritten Image */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800 mb-3">
                <span className="font-semibold text-slate-200">דף המבחן המקורי בכתב יד</span>
                <span>עמוד {selectedImageIndex + 1}</span>
              </div>
              <div className="relative aspect-[3/4] bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-slate-800">
                <img
                  src={images[selectedImageIndex]?.dataUrl}
                  alt="Exam page"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Right: Transcribed + Corrected */}
            <div className="space-y-4">
              <CodeViewer
                title="פרוטוקול תמלול הקוד מכתב היד"
                badge="תמלול אותנטי"
                badgeColor="indigo"
                code={result.transcription.code}
                language={result.detectedLanguage.toLowerCase()}
                maxHeight="max-h-[300px]"
              />
              <CodeViewer
                title="פתרון מוצע/מתוקן"
                badge="קוד מתוקן ועובד"
                badgeColor="emerald"
                code={result.correctedCode?.code || result.transcription.code}
                language={result.detectedLanguage.toLowerCase()}
                maxHeight="max-h-[300px]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Full Official Markdown Report Tab */}
      {activeTab === 'markdown' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-slate-200 flex items-center gap-2">
              <FileCode className="w-5 h-5 text-indigo-400" />
              פלט רשמי בפורמט Markdown כפי שהוגדר בהנחיות המערכת
            </h3>
            <button
              onClick={handleCopyMarkdown}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
            >
              {copiedProtocol ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>העתק תוכן</span>
            </button>
          </div>
          <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs sm:text-sm text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto">
            {activeMarkdown}
          </pre>
        </div>
      )}

      {/* Main Structured Sections */}
      {activeTab === 'structured' && (
        <div className="space-y-8">
          {/* SECTION 1: פרוטוקול תמלול הקוד (Transcribed Code) */}
          <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4 print-card print-break-inside">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">פרוטוקול תמלול הקוד (Transcribed Code)</h2>
                  <p className="text-xs text-slate-400">
                    פענוח כתב היד של התלמיד/ה, הפרדת הסברים בעברית מקוד נקי
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('visual')}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-xs font-medium flex items-center gap-1 border border-indigo-500/40 transition"
                  title="הצג את הדף המקורי עם הסימונים שזיהה ה-OCR"
                >
                  <ScanText className="w-3.5 h-3.5" />
                  <span>מפת סימונים על הדף</span>
                </button>
                <button
                  onClick={() => setActiveTab('ocr')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-medium flex items-center gap-1 border border-slate-700/60"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>ערוך תמלול</span>
                </button>
                <span className="text-xs bg-slate-800 text-indigo-300 font-mono px-2.5 py-1 rounded-md border border-slate-700">
                  {result.detectedLanguage}
                </span>
              </div>
            </div>

            {/* Hebrew Prose / Explanations written by student */}
            {result.transcription.hebrewProse && (
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 text-right">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-indigo-400" />
                  הסברים מילוליים שנכתבו בעברית ע״י התלמיד/ה:
                </span>
                <p className="text-sm text-slate-200 leading-relaxed font-sans">
                  {result.transcription.hebrewProse}
                </p>
              </div>
            )}

            {/* Code Block */}
            <CodeViewer
              code={result.transcription.code}
              language={result.detectedLanguage.toLowerCase()}
              title="קוד מתומלל מכתב יד"
              badge="נאמן למקור"
              badgeColor="indigo"
            />
          </section>

          {/* SECTION 2: ניתוח והערכה (Detailed Analysis) */}
          {result.analysis && (
            <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6 print-card print-break-inside">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800/80">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">ניתוח והערכה (Detailed Analysis)</h2>
                  <p className="text-xs text-slate-400">
                    פירוט מעמיק של חוזקות הקוד, שגיאות לוגיות ותחביריות, והתחשבות במגבלות כתיבה ביד
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* נקודות לחיוב */}
                <div className="bg-slate-950/60 border border-emerald-500/20 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                    <CheckCircle2 className="w-5 h-5" />
                    <h3>נקודות לחיוב</h3>
                  </div>
                  <ul className="space-y-2.5 text-sm text-slate-200">
                    {result.analysis.strengths && result.analysis.strengths.length > 0 ? (
                      result.analysis.strengths.map((str, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 mt-2 shrink-0" />
                          <span>{str}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-slate-400 text-xs">לא צוינו נקודות ספציפיות.</li>
                    )}
                  </ul>
                </div>

                {/* טעויות וסעיפים לתיקון */}
                <div className="bg-slate-950/60 border border-rose-500/20 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
                    <AlertTriangle className="w-5 h-5" />
                    <h3>טעויות וסעיפים לתיקון</h3>
                  </div>
                  <ul className="space-y-2.5 text-sm text-slate-200">
                    {result.analysis.corrections && result.analysis.corrections.length > 0 ? (
                      result.analysis.corrections.map((corr, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                          <span className="w-2 h-2 rounded-full bg-rose-400 mt-2 shrink-0" />
                          <span>{corr}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-emerald-400 text-xs font-medium">
                        ✓ לא אותרו שגיאות בקוד שנבדק!
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* התחשבות בכתב יד */}
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm">
                  <PenTool className="w-4 h-4" />
                  <span>התחשבות בכתב יד</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {result.analysis.handwritingNotes ||
                    'הכתב היה ברור וקריא. תקלות קלות האופייניות לכתיבה ביד (כגון חוסר דיוק באינדנטציה או פסיק חסר) לא הורידו ניקוד משמעותי.'}
                </p>
              </div>
            </section>
          )}

          {/* SECTION 3: פתרון מוצע/מתוקן (Corrected Code) */}
          {result.correctedCode && (
            <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4 print-card print-break-inside">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800/80">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">פתרון מוצע/מתוקן (Corrected Code)</h2>
                  <p className="text-xs text-slate-400">
                    גרסה עובדת, נקייה ויעילה של הקוד המתקנת את השגיאות שנמצאו
                  </p>
                </div>
              </div>

              {result.correctedCode.explanation && (
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 text-right">
                  <span className="text-xs font-semibold text-slate-400">הסבר על התיקונים שבוצעו:</span>
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {result.correctedCode.explanation}
                  </p>
                </div>
              )}

              <CodeViewer
                code={result.correctedCode.code}
                language={result.detectedLanguage.toLowerCase()}
                title="קוד מתוקן ומושלם"
                badge="פתרון עובד"
                badgeColor="emerald"
              />
            </section>
          )}

          {/* SECTION 4: ציון סופי ומשוב (Final Score & Feedback) */}
          {result.evaluation && (
            <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4 print-card print-break-inside">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800/80">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">ציון סופי ומשוב (Final Score & Feedback)</h2>
                  <p className="text-xs text-slate-400">
                    שקלול קריטריוני הבדיקה, ציון מספרי וסיכום פדגוגי מעצים לתלמיד/ה
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center sm:text-right flex-1">
                  <div className="text-sm font-semibold text-slate-300">
                    הערכה כוללת: <span className="text-white font-bold">{result.evaluation.gradeCategory}</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed font-sans">
                    {result.evaluation.studentSummary}
                  </p>
                </div>

                <div className="text-center shrink-0 p-4 rounded-2xl bg-slate-900 border border-slate-800 min-w-[130px]">
                  <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">
                    ציון משוקלל
                  </span>
                  <span className="text-4xl font-black font-mono text-indigo-400">{score}</span>
                  <span className="text-xs text-slate-400 block mt-0.5">מתוך 100</span>
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
