import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { EvaluationResult } from '../types/evaluation';

/**
 * Renders an HTML element into a multi-page A4 PDF and triggers direct browser download.
 * Works seamlessly in sandboxed iframes without requiring window.print() or window.open().
 */
export async function generateAndDownloadPdf(
  element: HTMLElement,
  studentName: string,
  examTitle: string = 'מבחן_במדעי_המחשב'
): Promise<void> {
  // Ensure the element is visible for capture
  const originalDisplay = element.style.display;
  const originalPosition = element.style.position;
  const originalLeft = element.style.left;

  try {
    element.style.display = 'block';
    element.style.position = 'relative';

    const canvas = await html2canvas(element, {
      scale: 2, // 2x for sharp crisp text and borders
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 850,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.96);

    // Standard A4 dimensions in mm
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = 210; // mm
    const pageHeight = 297; // mm
    const margin = 10; // mm
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    let heightLeft = contentHeight;
    let position = margin;

    // First page
    pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight);
    heightLeft -= pageHeight - margin * 2;

    // Subsequent pages if content exceeds 1 page
    while (heightLeft > 0) {
      position = -(contentHeight - heightLeft) + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight);
      heightLeft -= pageHeight - margin * 2;
    }

    const cleanStudentName = (studentName || 'תלמיד').replace(/[/\\?%*:|"<>]/g, '_').trim();
    const cleanTitle = (examTitle || 'מבחן').replace(/[/\\?%*:|"<>]/g, '_').trim();
    const filename = `דוח_בדיקה_${cleanStudentName}_${cleanTitle}.pdf`;

    pdf.save(filename);
  } finally {
    element.style.display = originalDisplay;
    element.style.position = originalPosition;
    element.style.left = originalLeft;
  }
}

/**
 * Generates a standalone, fully styled HTML file that can be saved and opened anywhere
 * with native browser printing (Ctrl+P) in full high resolution.
 */
export function downloadPrintableHtml(result: EvaluationResult, studentName: string): void {
  const evalData = result.evaluation;
  const score = evalData?.finalScore ?? 0;
  const criteria = evalData?.criteriaScores || [];
  const errors = evalData?.identifiedErrors || [];
  const strengths = evalData?.strengths || [];
  const improvements = evalData?.improvementSuggestions || [];
  const dateStr = new Date().toLocaleDateString('he-IL');

  const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>דוח הערכת מבחן - ${studentName || 'תלמיד/ה'}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body {
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 20px;
      line-height: 1.5;
    }
    .header-box {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .title-area h1 { margin: 0 0 4px 0; font-size: 22px; color: #0f172a; }
    .title-area p { margin: 0; font-size: 13px; color: #475569; }
    .student-badge {
      margin-top: 10px;
      font-size: 15px;
      font-weight: bold;
      color: #1e3a8a;
    }
    .score-card {
      border: 2px solid #0f172a;
      border-radius: 12px;
      padding: 12px 20px;
      text-align: center;
      background: #f8fafc;
      min-width: 120px;
    }
    .score-num { font-size: 36px; font-weight: 900; color: #0f172a; margin: 2px 0; }
    .score-cat { font-size: 13px; font-weight: bold; color: #334155; }
    .section-title {
      font-size: 16px;
      font-weight: bold;
      color: #0f172a;
      border-right: 4px solid #4f46e5;
      padding-right: 8px;
      margin: 20px 0 10px 0;
    }
    .summary-box {
      background: #f1f5f9;
      padding: 14px;
      border-radius: 8px;
      font-size: 14px;
      margin-bottom: 16px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 20px 0;
      font-size: 13px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 8px 12px;
      text-align: right;
    }
    th { background: #e2e8f0; font-weight: bold; }
    tr:nth-child(even) { background: #f8fafc; }
    .code-box {
      background: #0f172a;
      color: #f8fafc;
      padding: 14px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      direction: ltr;
      white-space: pre-wrap;
      margin: 10px 0 20px 0;
    }
    .error-item {
      background: #fef2f2;
      border: 1px solid #fecaca;
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 8px;
      font-size: 13px;
    }
    .signature-area {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px dashed #94a3b8;
      display: flex;
      justify-content: space-between;
      font-size: 13px;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header-box">
    <div class="title-area">
      <h1>מדינת ישראל • משרד החינוך</h1>
      <p>דוח הערכה פדגוגי למבחן מדעי המחשב | מערכת GradeCode AI</p>
      <div class="student-badge">שם התלמיד/ה: ${studentName || 'לא צוין'}</div>
      <p style="margin-top: 4px; font-size: 13px;">
        נושא: <strong>${result.problemTitle || 'פתרון מבחן תכנות'}</strong> |
        שפה: <strong>${result.detectedLanguage}</strong> |
        תאריך: <strong>${dateStr}</strong>
      </p>
    </div>
    <div class="score-card">
      <div style="font-size: 11px; font-weight: bold; color: #64748b;">ציון משוקלל</div>
      <div class="score-num">${score}</div>
      <div class="score-cat">${evalData?.gradeCategory || 'הערכה הושלמה'}</div>
    </div>
  </div>

  <div class="section-title">משוב פדגוגי וסיכום כללי</div>
  <div class="summary-box">${evalData?.pedagogicalFeedback || evalData?.generalSummary || 'נבדק לפי מחוון הבגרות הרשמי.'}</div>

  <div class="section-title">פירוט ציונים לפי קריטריוני מחוון</div>
  <table>
    <thead>
      <tr>
        <th style="width: 25%;">קריטריון</th>
        <th style="width: 15%; text-align: center;">ניקוד שהוענק</th>
        <th>הערות הבודק והנמקה</th>
      </tr>
    </thead>
    <tbody>
      ${criteria
        .map(
          (c) => `<tr>
            <td><strong>${c.name}</strong></td>
            <td style="text-align: center; font-weight: bold;">${c.score} / ${c.maxScore}</td>
            <td>${c.feedback}</td>
          </tr>`
        )
        .join('')}
    </tbody>
  </table>

  ${
    errors.length > 0
      ? `<div class="section-title">שגיאות ואי-דיוקים שזוהו</div>
         ${errors
           .map(
             (err) => `<div class="error-item">
               <strong>${err.description}</strong>
               ${err.pointsDeducted ? `<span style="color: #dc2626; font-weight: bold; float: left;">-${err.pointsDeducted} נקודות</span>` : ''}
               ${err.suggestion ? `<div style="font-size: 12px; color: #475569; margin-top: 4px;">המלצה לתיקון: ${err.suggestion}</div>` : ''}
             </div>`
           )
           .join('')}`
      : ''
  }

  ${
    strengths.length > 0
      ? `<div class="section-title">נקודות חוזק בפתרון</div>
         <ul>${strengths.map((s) => `<li>${s}</li>`).join('')}</ul>`
      : ''
  }

  ${
    improvements.length > 0
      ? `<div class="section-title">נקודות לשיפור ולהמשך למידה</div>
         <ul>${improvements.map((imp) => `<li>${imp}</li>`).join('')}</ul>`
      : ''
  }

  ${
    result.transcription?.code
      ? `<div class="section-title">קוד התלמיד כפי שפוענח מכתב היד</div>
         <div class="code-box">${result.transcription.code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`
      : ''
  }

  <div class="signature-area">
    <div>חתימת מורה בודק: ______________________</div>
    <div>תאריך אישור: ${dateStr}</div>
    <div>אישור מערכת: רשמי וחתום דיגיטלית</div>
  </div>

  <script>
    window.addEventListener('load', function() {
      // Auto trigger print if opened in dedicated window
      if (window.location.search.includes('print=true')) {
        setTimeout(function() { window.print(); }, 300);
      }
    });
  </script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanName = (studentName || 'תלמיד').replace(/[/\\?%*:|"<>]/g, '_').trim();
  a.download = `דוח_הערכת_מבחן_${cleanName}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
