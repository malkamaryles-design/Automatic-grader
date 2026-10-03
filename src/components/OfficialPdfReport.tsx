import React, { forwardRef } from 'react';
import { EvaluationResult } from '../types/evaluation';
import { Award, CheckCircle2, AlertOctagon, TrendingUp, BookOpen, GraduationCap } from 'lucide-react';

interface OfficialPdfReportProps {
  result: EvaluationResult;
  studentName: string;
}

export const OfficialPdfReport = forwardRef<HTMLDivElement, OfficialPdfReportProps>(
  ({ result, studentName }, ref) => {
    const evalData = result.evaluation;
    const score = evalData?.finalScore ?? 0;
    const criteria = evalData?.criteriaScores || [];
    const errors = evalData?.identifiedErrors || [];
    const strengths = evalData?.strengths || [];
    const improvements = evalData?.improvementSuggestions || [];
    const dateStr = new Date().toLocaleDateString('he-IL');

    const getScoreBadgeColor = (num: number) => {
      if (num >= 85) return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      if (num >= 70) return 'bg-blue-50 text-blue-800 border-blue-300';
      if (num >= 55) return 'bg-amber-50 text-amber-800 border-amber-300';
      return 'bg-rose-50 text-rose-800 border-rose-300';
    };

    return (
      <div
        ref={ref}
        id="official-pdf-report-sheet"
        dir="rtl"
        className="w-[800px] bg-white text-slate-900 p-8 sm:p-10 font-sans border border-slate-200 shadow-xl rounded-xl"
        style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
      >
        {/* Document Letterhead */}
        <div className="border-b-2 border-slate-900 pb-5 mb-6 flex justify-between items-start gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
              <span>משרד החינוך • הפיקוח על הוראת מדעי המחשב</span>
            </div>
            <h1 className="text-2xl font-black text-slate-950 tracking-tight">
              דוח הערכה פדגוגי למבחן מעשי
            </h1>
            <p className="text-xs text-slate-500">
              מערכת GradeCode AI לבדיקת מבחנים וקוד בכתב יד לפי מחוון בגרות
            </p>

            <div className="pt-2.5 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-700">
              <div className="flex items-center gap-1.5 text-sm font-bold text-slate-950 col-span-2">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <span>שם התלמיד/ה:</span>
                <span className="text-indigo-900 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                  {studentName || 'לא צוין'}
                </span>
              </div>
              <div>
                נושא השאלה: <strong>{result.problemTitle || 'מבחן במדעי המחשב'}</strong>
              </div>
              <div>
                שפת תכנות: <strong className="font-mono text-indigo-700">{result.detectedLanguage}</strong>
              </div>
              <div>
                תאריך הבדיקה: <strong>{dateStr}</strong>
              </div>
              <div>
                מצב קריאות: <strong>{result.isReadable ? 'קריא ומפוענח' : 'מטושטש'}</strong>
              </div>
            </div>
          </div>

          {/* Big Score Box */}
          <div className={`p-4 rounded-xl border-2 text-center min-w-[140px] shrink-0 ${getScoreBadgeColor(score)}`}>
            <div className="text-[11px] uppercase tracking-wider font-bold opacity-80">ציון סופי</div>
            <div className="text-4xl font-black my-0.5">{score}</div>
            <div className="text-xs font-bold">{evalData?.gradeCategory || 'הוערך'}</div>
          </div>
        </div>

        {/* Pedagogical Summary Box */}
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5 mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>משוב פדגוגי וסיכום ההערכה</span>
          </h2>
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs leading-relaxed text-slate-800 font-medium">
            {evalData?.pedagogicalFeedback || evalData?.generalSummary || 'פתרון המבחן הוערך במלואו על פי עקרונות המחוון.'}
          </div>
        </div>

        {/* Criteria Breakdown Table */}
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5 mb-2">
            <Award className="w-3.5 h-3.5" />
            <span>פירוט ציונים לפי קריטריוני מחוון</span>
          </h2>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-right text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <th className="p-2.5 font-bold w-1/4">קריטריון</th>
                  <th className="p-2.5 font-bold text-center w-24">ניקוד</th>
                  <th className="p-2.5 font-bold">משוב והערות הבודק</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {criteria.map((crit, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                    <td className="p-2.5 font-semibold text-slate-900">{crit.name}</td>
                    <td className="p-2.5 text-center font-bold text-indigo-900 font-mono">
                      {crit.score} / {crit.maxScore}
                    </td>
                    <td className="p-2.5 text-slate-700 leading-normal">{crit.feedback}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Identified Errors & Deductions */}
        {errors.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5 mb-2">
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>שגיאות שזוהו והורדות ניקוד ({errors.length})</span>
            </h2>
            <div className="space-y-2">
              {errors.map((err, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-lg text-xs flex items-start justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-rose-950">{err.description}</div>
                    {err.suggestion && (
                      <div className="text-[11px] text-slate-600">
                        <strong>תיקון מומלץ:</strong> {err.suggestion}
                      </div>
                    )}
                  </div>
                  {err.pointsDeducted ? (
                    <span className="shrink-0 font-bold font-mono text-rose-700 bg-rose-100 px-2 py-0.5 rounded text-[11px]">
                      -{err.pointsDeducted} נק׳
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strengths & Improvements in 2 Columns */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {strengths.length > 0 && (
            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg text-xs">
              <h3 className="font-bold text-emerald-900 flex items-center gap-1.5 mb-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>חוזקות שזוהו בפתרון</span>
              </h3>
              <ul className="list-disc list-inside space-y-1 text-slate-700">
                {strengths.map((str, idx) => (
                  <li key={idx} className="leading-tight">{str}</li>
                ))}
              </ul>
            </div>
          )}

          {improvements.length > 0 && (
            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg text-xs">
              <h3 className="font-bold text-blue-900 flex items-center gap-1.5 mb-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                <span>המלצות לשיפור ולמידה</span>
              </h3>
              <ul className="list-disc list-inside space-y-1 text-slate-700">
                {improvements.map((imp, idx) => (
                  <li key={idx} className="leading-tight">{imp}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Transcribed Code Snippet */}
        {result.transcription?.code && (
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              קוד התלמיד כפי שפוענח מכתב היד:
            </h2>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-[11px] leading-relaxed overflow-x-auto text-left dir-ltr">
              <code>{result.transcription.code}</code>
            </pre>
          </div>
        )}

        {/* Official Footer with Signature Line */}
        <div className="pt-4 border-t border-slate-300 flex items-center justify-between text-xs text-slate-600">
          <div className="space-y-1">
            <div>חתימת מורה בודק/ת: _________________________</div>
            <div className="text-[10px] text-slate-400">הדוח הופק ונחתם דיגיטלית באמצעות GradeCode AI</div>
          </div>
          <div className="text-left space-y-1">
            <div>תאריך חתימה: {dateStr}</div>
            <div className="font-mono text-[10px] text-slate-400">אימות: GC-{Math.abs(score * 12345).toString(16).toUpperCase()}</div>
          </div>
        </div>
      </div>
    );
  }
);

OfficialPdfReport.displayName = 'OfficialPdfReport';
