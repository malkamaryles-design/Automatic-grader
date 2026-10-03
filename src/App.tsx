import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Camera,
  FileText,
  Sparkles,
  BookOpen,
  Code2,
  CheckCircle2,
  AlertCircle,
  Clock,
  History,
  HelpCircle,
  Cpu,
  Layers,
  Sliders,
  ChevronDown,
  RefreshCw,
  ScanText,
  GraduationCap,
} from 'lucide-react';
import { ExamImage, EvaluationResult, GradedSubmission, OcrResult } from './types/evaluation';
import { ImagePreviewCard } from './components/ImagePreviewCard';
import { CameraCapture } from './components/CameraCapture';
import { SampleExamModal } from './components/SampleExamModal';
import { ImageViewerModal } from './components/ImageViewerModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { EvaluationDashboard } from './components/EvaluationDashboard';
import { OcrModal } from './components/OcrModal';
import { SAMPLE_EXAMS, SampleExam, renderSvgToRaster } from './data/sampleExams';

export default function App() {
  const [images, setImages] = useState<ExamImage[]>([]);
  const [studentName, setStudentName] = useState<string>('');
  const [languageHint, setLanguageHint] = useState<string>('auto');
  const [examQuestion, setExamQuestion] = useState<string>('');
  const [strictness, setStrictness] = useState<'lenient' | 'standard' | 'strict'>('standard');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);

  // Modals state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [previewModalImage, setPreviewModalImage] = useState<ExamImage | null>(null);

  // OCR dedicated inspection modal
  const [isOcrOpen, setIsOcrOpen] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [isOcrLoading, setIsOcrLoading] = useState(false);

  // Evaluation state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);

  // Submissions history
  const [history, setHistory] = useState<GradedSubmission[]>(() => {
    try {
      const stored = localStorage.getItem('gradecode_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Processing steps for animated loading UX
  const loadingSteps = [
    'מפענח ומחלץ כתב יד בטכנולוגיית ראייה ממוחשבת (OCR)...',
    'מפריד בין הסברים מילוליים בעברית לבין קוד התוכנית...',
    'מבצע ניתוח תחביר, טיפוסי נתונים וסמנטיקה של שפת הקוד...',
    'בודק נכונות אלגוריתמית, לוגיקה, סיבוכיות ומקרי קצה (50%)...',
    'מחשב ציון לפי מחוון מפורט ומנסח פתרון מתוקן ומשוב פדגוגי...',
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setLoadingStepIndex(0);
      interval = setInterval(() => {
        setLoadingStepIndex((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 1800);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const saveToHistory = (res: EvaluationResult, firstImgDataUrl?: string) => {
    const submission: GradedSubmission = {
      id: `sub_${Date.now()}`,
      timestamp: Date.now(),
      title: res.problemTitle || 'מבחן במדעי המחשב',
      studentName: res.studentName || studentName,
      detectedLanguage: res.detectedLanguage,
      score: res.evaluation?.finalScore ?? 0,
      gradeCategory: res.evaluation?.gradeCategory || '',
      result: res,
      thumbnailUrl: firstImgDataUrl || '',
    };
    const updated = [submission, ...history.slice(0, 19)];
    setHistory(updated);
    try {
      localStorage.setItem('gradecode_history', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed saving to localStorage', e);
    }
  };

  const handleFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
        let dataUrl = e.target?.result as string;
        let mimeType = file.type || 'image/jpeg';
        if (file.type === 'image/svg+xml' || dataUrl.startsWith('data:image/svg')) {
          try {
            dataUrl = await renderSvgToRaster(dataUrl);
            mimeType = 'image/jpeg';
          } catch (err) {
            console.warn('Could not rasterize SVG, sending as is', err);
          }
        }
        const newImg: ExamImage = {
          id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          name: file.name,
          dataUrl,
          mimeType,
          base64: dataUrl.split('base64,')[1] || '',
          rotation: 0,
          contrast: 100,
        };
        setImages((prev) => [...prev, newImg]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleCameraCapture = (dataUrl: string) => {
    const newImg: ExamImage = {
      id: `img_cam_${Date.now()}`,
      name: `צילום עמוד ${images.length + 1}.jpg`,
      dataUrl,
      mimeType: 'image/jpeg',
      base64: dataUrl.split('base64,')[1] || '',
      rotation: 0,
      contrast: 100,
    };
    setImages((prev) => [...prev, newImg]);
  };

  const handleSelectSample = async (sample: SampleExam) => {
    const rawSvgDataUrl = sample.generateImageDataUrl();
    const rasterDataUrl = await renderSvgToRaster(rawSvgDataUrl);
    const newImg: ExamImage = {
      id: `img_sample_${Date.now()}`,
      name: `${sample.title}.jpg`,
      dataUrl: rasterDataUrl,
      mimeType: 'image/jpeg',
      base64: rasterDataUrl.split('base64,')[1] || '',
      rotation: 0,
      contrast: 100,
    };
    setImages([newImg]);
    setLanguageHint(sample.language);
    setExamQuestion(sample.examQuestion);
    if (sample.studentName) {
      setStudentName(sample.studentName);
    }
  };

  const handleRotateImage = (id: string) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === id ? { ...img, rotation: ((img.rotation || 0) + 90) % 360 } : img
      )
    );
  };

  const handleTogglePencilEnhance = (id: string) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === id ? { ...img, contrast: (img.contrast ?? 100) > 100 ? 100 : 160 } : img
      )
    );
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleEvaluate = async (customTranscribedCode?: string) => {
    if (images.length === 0) return;
    setIsLoading(true);
    setEvalError(null);

    try {
      const payloadImages = images.map((img) => ({
        data: img.dataUrl,
        mimeType: img.mimeType,
      }));

      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: payloadImages,
          languageHint,
          examQuestion,
          strictness,
          customTranscribedCode,
          studentName,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `שגיאת שרת: ${res.statusText}`);
      }

      const data: EvaluationResult = await res.json();
      if (data.studentName && !studentName) {
        setStudentName(data.studentName);
      }
      setEvaluationResult(data);
      if (data.isReadable) {
        saveToHistory(data, images[0]?.dataUrl);
      }
    } catch (err: any) {
      console.error('Evaluation failed:', err);
      setEvalError(err.message || 'אירעה שגיאה בבדיקת המבחן. אנא נסה שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunOcrOnly = async () => {
    if (images.length === 0) return;
    setIsOcrOpen(true);
    setIsOcrLoading(true);
    setOcrResult(null);

    try {
      const payloadImages = images.map((img) => ({
        data: img.dataUrl,
        mimeType: img.mimeType,
      }));

      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: payloadImages,
          languageHint,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `שגיאת שרת: ${res.statusText}`);
      }

      const data: OcrResult = await res.json();
      setOcrResult(data);
    } catch (err: any) {
      console.error('OCR failed:', err);
      setOcrResult({
        isReadable: false,
        unreadableReason: err.message || 'אירעה שגיאה בביצוע פענוח OCR',
        detectedLanguage: languageHint !== 'auto' ? languageHint : 'Auto',
        transcription: { code: '' },
      });
    } finally {
      setIsOcrLoading(false);
    }
  };

  const handleReEvaluate = async (customCode: string) => {
    await handleEvaluate(customCode);
  };

  const handleReset = () => {
    setEvaluationResult(null);
    setEvalError(null);
    setStudentName('');
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('gradecode_history');
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    localStorage.setItem('gradecode_history', JSON.stringify(updated));
  };

  const handleLoadFromHistory = (sub: GradedSubmission) => {
    if (sub.studentName) {
      setStudentName(sub.studentName);
    } else if (sub.result?.studentName) {
      setStudentName(sub.result.studentName);
    }
    setEvaluationResult(sub.result);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-600/30 text-white font-black text-lg">
            G
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                GradeCode <span className="text-indigo-400">IL</span>
              </span>
              <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full hidden sm:inline">
                בודק מבחנים אוטומטי במדעי המחשב
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              פענוח כתב יד בעברית • תמלול קוד • ניתוח לוגי ותחבירי • ציון ומשוב פדגוגי
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsSampleModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-800 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>מבחנים לדוגמה</span>
          </button>

          <button
            onClick={() => setIsHistoryOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-800 transition relative"
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">היסטוריה</span>
            {history.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                {history.length}
              </span>
            )}
          </button>

          {evaluationResult && (
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
            >
              <span>מבחן חדש</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {evaluationResult ? (
          <EvaluationDashboard
            result={evaluationResult}
            images={images}
            onReset={handleReset}
            onReEvaluate={handleReEvaluate}
            studentName={studentName}
            onUpdateStudentName={(name) => {
              setStudentName(name);
              if (evaluationResult) {
                evaluationResult.studentName = name;
              }
            }}
          />
        ) : (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Hero Intro */}
            <div className="text-center space-y-3 pt-2 sm:pt-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
                <Cpu className="w-3.5 h-3.5" />
                <span>מערכת הערכה חכמה לפי מחוון בגרות ואקדמיה</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                בדיקת מבחני קוד בכתב יד בעברית
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                העלה או צלם דפי מבחן של תלמידים. המערכת תתמלל את הקוד, תזהה שגיאות לוגיות ותחביריות,
                תתחשב במגבלות כתב יד, ותספק פתרון מתוקן עם ציון ומשוב מובנה.
              </p>
            </div>

            {/* Upload & Capture Zone */}
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="relative rounded-3xl border-2 border-dashed border-slate-700/80 hover:border-indigo-500/80 bg-slate-900/60 hover:bg-slate-900/80 transition-all p-8 sm:p-12 text-center group cursor-pointer shadow-xl overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />

                <div className="space-y-4 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8" />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-100">
                      גרור לכאן תצלום או סריקה של דף המבחן
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      תומך בתמונות JPG, PNG, WEBP (ניתן להעלות מספר דפים במקביל)
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 border border-slate-700 transition"
                    >
                      <Upload className="w-4 h-4 text-indigo-400" />
                      <span>בחר קבצים מהמחשב</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCameraOpen(true);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition"
                    >
                      <Camera className="w-4 h-4" />
                      <span>צלם מהמצלמה עכשיו</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSampleModalOpen(true);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-indigo-300 text-xs font-semibold flex items-center gap-2 border border-indigo-500/30 transition"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>נסה מבחן לדוגמה ב-1 קליק</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Uploaded Pages Grid */}
              {images.length > 0 && (
                <div className="space-y-3 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      דפי המבחן שהועלו ({images.length})
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        + הוסף עמוד נוסף
                      </button>
                      <span className="text-slate-600">•</span>
                      <button
                        onClick={() => setImages([])}
                        className="text-xs text-rose-400 hover:text-rose-300"
                      >
                        הסר הכל
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {images.map((img, idx) => (
                      <ImagePreviewCard
                        key={img.id}
                        image={img}
                        index={idx}
                        total={images.length}
                        onRemove={handleRemoveImage}
                        onRotate={handleRotateImage}
                        onTogglePencilEnhance={handleTogglePencilEnhance}
                        onViewFull={(selected) => setPreviewModalImage(selected)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Student Name Input Field (Optional - auto extracted from sheet if left blank) */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 text-right space-y-2.5">
              <label className="text-xs sm:text-sm font-bold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-400" />
                  <span>שם התלמיד/ה (יופיע בדוח ההערכה ובקובץ ה-PDF):</span>
                </span>
                {studentName && (
                  <span className="text-[11px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 font-normal">
                    יוצג בדוח
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="הזן את שם התלמיד/ה (לדוגמה: יונתן כהן, או השאר ריק לפענוח אוטומטי מהדף)..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition font-sans"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                אם תשדה יישאר ריק, מערכת ה-OCR תנסה לזהות את שם התלמיד הכתוב בראש דף המבחן, ותוכל לערוך אותו בכל עת ישירות על גבי הדוח.
              </p>
            </div>

            {/* Exam Context & Optional Settings */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
              <button
                type="button"
                onClick={() => setShowAdvancedSettings((prev) => !prev)}
                className="w-full flex items-center justify-between text-right text-sm font-semibold text-slate-200 hover:text-white"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <span>הגדרות שאלה ושפת תכנות (אופציונלי)</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    showAdvancedSettings ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showAdvancedSettings && (
                <div className="pt-2 space-y-4 text-right border-t border-slate-800/80">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Programming Language hint */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 block">
                        שפת תכנות (זיהוי אוטומטי כברירת מחדל):
                      </label>
                      <select
                        value={languageHint}
                        onChange={(e) => setLanguageHint(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                      >
                        <option value="auto">זיהוי שפה אוטומטי (Python / Java / C++ / C# / JS)</option>
                        <option value="Python">Python (פייתון)</option>
                        <option value="Java">Java (ג׳אווה)</option>
                        <option value="C++">C++ (סי פלוס פלוס)</option>
                        <option value="C#">C# (סי שארפ)</option>
                        <option value="JavaScript">JavaScript / TypeScript</option>
                      </select>
                    </div>

                    {/* Strictness Level */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 block">
                        רמת קפדנות בדיקה:
                      </label>
                      <select
                        value={strictness}
                        onChange={(e) => setStrictness(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                      >
                        <option value="standard">סטנדרטית הוגנת (מומלץ לבגרות ומבחנים שוטפים)</option>
                        <option value="lenient">מקלה ומעודדת (התחשבות מירבית באי-דיוקי כתיבה)</option>
                        <option value="strict">קפדנית ברמה אקדמית מחמירה</option>
                      </select>
                    </div>
                  </div>

                  {/* Exam Question / Problem Prompt text */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">
                      נוסח שאלת המבחן / דרישות התרגיל (אופציונלי):
                    </label>
                    <textarea
                      value={examQuestion}
                      onChange={(e) => setExamQuestion(e.target.value)}
                      placeholder="לדוגמה: שאלה 3: כתוב פונקציה רקורסיבית המקבלת עץ בינארי ומחזירה את מספר הצמתים הזוגיים..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500 resize-none font-sans"
                    />
                    <p className="text-[11px] text-slate-500">
                      אם נוסח השאלה מופיע בראש דף המבחן שצולם, המערכת תקרא אותו אוטומטית.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message with Option to Retry and Inspect OCR */}
            {evalError && (
              <div className="p-4 rounded-2xl bg-rose-950/70 border border-rose-800 text-rose-300 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>{evalError}</span>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEvaluate()}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-rose-600/30"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>נסה שוב כעת</span>
                  </button>
                  {images.length > 0 && (
                    <button
                      type="button"
                      onClick={handleRunOcrOnly}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <ScanText className="w-3.5 h-3.5" />
                      <span>בדוק OCR</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Action Trigger Button / Loading Progress */}
            {isLoading ? (
              <div className="p-6 rounded-2xl bg-slate-900 border border-indigo-500/30 shadow-2xl text-center space-y-4">
                <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">מנתח ומעריך את המבחן...</h3>
                  <p className="text-xs sm:text-sm text-indigo-300 transition-all duration-300 font-medium">
                    {loadingSteps[loadingStepIndex]}
                  </p>
                </div>
                <div className="w-full max-w-md mx-auto bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${((loadingStepIndex + 1) / loadingSteps.length) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={images.length === 0}
                  onClick={() => handleEvaluate()}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-indigo-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition transform active:scale-98 inline-flex items-center justify-center gap-2.5"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>
                    {images.length === 0
                      ? 'העלה לפחות דף אחד לתחילת הבדיקה'
                      : `בדוק והערך ${images.length} דפי מבחן בכתב יד`}
                  </span>
                </button>

                {images.length > 0 && (
                  <button
                    type="button"
                    onClick={handleRunOcrOnly}
                    className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white font-semibold text-sm border border-slate-700 hover:border-indigo-500/50 transition flex items-center justify-center gap-2"
                  >
                    <ScanText className="w-4 h-4 text-indigo-400" />
                    <span>צפה בדף המקורי ובסימוני OCR (מפת זיהוי)</span>
                  </button>
                )}
              </div>
            )}

            {/* CS Evaluation Rubric Reference Card */}
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-right space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                מפתח הערכה ומחוון בדיקה רשמי:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="font-bold text-indigo-300">נכונות ולוגיקה (50%)</div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    פתרון הבעיה ביעילות, טיפול במקרי קצה, רקורסיה/לולאות, תנאי עצירה וגבולות.
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="font-bold text-emerald-300">תחביר וסמנטיקה (30%)</div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    תחביר תקין של השפה, התחשבות במגבלות כתיבה ידנית והבחנה מטעויות אמיתיות.
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="font-bold text-amber-300">איכות וסגנון קוד (20%)</div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    קריאות, שמות משתנים משמעותיים, מבנה אינדנטציה והסברים מילוליים.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {isCameraOpen && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setIsCameraOpen(false)}
        />
      )}

      {isSampleModalOpen && (
        <SampleExamModal
          onSelect={handleSelectSample}
          onClose={() => setIsSampleModalOpen(false)}
        />
      )}

      {previewModalImage && (
        <ImageViewerModal
          image={previewModalImage}
          onClose={() => setPreviewModalImage(null)}
        />
      )}

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        submissions={history}
        onSelectSubmission={handleLoadFromHistory}
        onClearHistory={handleClearHistory}
        onDeleteSubmission={handleDeleteHistoryItem}
      />

      <OcrModal
        isOpen={isOcrOpen}
        onClose={() => setIsOcrOpen(false)}
        ocrResult={ocrResult}
        isLoading={isOcrLoading}
        images={images}
        onEvaluateWithCode={(code) => handleEvaluate(code)}
      />
    </div>
  );
}
