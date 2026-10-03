// Realistic handwritten exam samples rendered to SVG and converted to data-urls for immediate testing

export interface SampleExam {
  id: string;
  title: string;
  subtitle: string;
  language: string;
  description: string;
  expectedScoreRange: string;
  examQuestion: string;
  studentName?: string;
  generateImageDataUrl: () => string;
}

// Function to generate realistic handwritten notebook page SVG
function generateNotebookPageSvg(options: {
  title: string;
  studentName: string;
  date: string;
  questionText: string;
  hebrewLines: string[];
  codeLines: string[];
  conclusionHebrew: string[];
  inkColor?: string;
}): string {
  const width = 800;
  const height = 1050;
  const ink = options.inkColor || '#1e3a8a'; // classic blue ink

  // Generate lined paper lines
  let linesSvg = '';
  for (let y = 140; y < height - 60; y += 28) {
    linesSvg += `<line x1="40" y1="${y}" x2="${width - 40}" y2="${y}" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="none" />`;
  }

  // Margin line (red notebook margin on the right for RTL Hebrew notebook)
  const marginLine = `<line x1="${width - 100}" y1="60" x2="${width - 100}" y2="${height - 40}" stroke="#fca5a5" stroke-width="1.5" />`;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <!-- Paper Background with subtle texture/shading -->
      <rect width="${width}" height="${height}" fill="#fdfbf7" />
      <rect x="20" y="20" width="${width - 40}" height="${height - 40}" fill="#ffffff" filter="drop-shadow(0px 4px 12px rgba(0,0,0,0.08))" rx="8" />

      <!-- Ruled lines -->
      ${linesSvg}
      ${marginLine}

      <!-- Hole punches on left -->
      <circle cx="28" cy="200" r="10" fill="#f1f5f9" stroke="#cbd5e1" />
      <circle cx="28" cy="525" r="10" fill="#f1f5f9" stroke="#cbd5e1" />
      <circle cx="28" cy="850" r="10" fill="#f1f5f9" stroke="#cbd5e1" />

      <!-- Header details in Hebrew (handwritten font or styled script) -->
      <g fill="${ink}" style="font-family: 'Comic Sans MS', 'Segoe Print', 'Chalkboard', cursive, sans-serif; font-size: 15px;">
        <text x="${width - 120}" y="95" text-anchor="start" font-weight="bold">${options.title}</text>
        <text x="${width - 120}" y="120" text-anchor="start">שם: ${options.studentName} | תאריך: ${options.date}</text>
        <line x1="50" y1="130" x2="${width - 50}" y2="130" stroke="${ink}" stroke-width="1.2" opacity="0.4" />
      </g>

      <!-- Question Text (Hebrew) -->
      <g fill="#334155" style="font-family: 'Assistant', Arial, sans-serif; font-size: 14px;">
        <rect x="50" y="145" width="${width - 160}" height="42" fill="#f8fafc" rx="4" stroke="#e2e8f0" />
        <text x="${width - 120}" y="170" text-anchor="start" font-weight="600" fill="#1e293b">${options.questionText}</text>
      </g>

      <!-- Student's Hebrew explanation/prose -->
      <g fill="${ink}" style="font-family: 'Comic Sans MS', 'Segoe Print', 'Chalkboard', cursive, sans-serif; font-size: 16px;">
        ${options.hebrewLines
          .map((line, idx) => `<text x="${width - 120}" y="${220 + idx * 28}" text-anchor="start">${line}</text>`)
          .join('')}
      </g>

      <!-- Student's Handwritten Code Block (LTR block, with slight handwritten tilts) -->
      <g fill="#0f172a" style="font-family: 'Courier New', monospace; font-size: 15px; font-weight: 600;">
        <rect x="60" y="${230 + options.hebrewLines.length * 28}" width="600" height="${options.codeLines.length * 28 + 24}" fill="#f8fafc" opacity="0.6" rx="6" stroke="#94a3b8" stroke-dasharray="3 3" />
        ${options.codeLines
          .map((line, idx) => {
            const y = 255 + options.hebrewLines.length * 28 + idx * 28;
            return `<text x="75" y="${y}" text-anchor="start">${line.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>`;
          })
          .join('')}
      </g>

      <!-- Conclusion / complexity notes in Hebrew -->
      <g fill="${ink}" style="font-family: 'Comic Sans MS', 'Segoe Print', cursive, sans-serif; font-size: 15px;">
        ${options.conclusionHebrew
          .map((line, idx) => {
            const startY = 280 + options.hebrewLines.length * 28 + options.codeLines.length * 28 + idx * 28;
            return `<text x="${width - 120}" y="${startY}" text-anchor="start">${line}</text>`;
          })
          .join('')}
      </g>
    </svg>
  `;
}

function generateNotebookCanvasJpeg(options: {
  title: string;
  studentName: string;
  date: string;
  questionText: string;
  hebrewLines: string[];
  codeLines: string[];
  conclusionHebrew: string[];
  inkColor?: string;
}): string {
  if (typeof document === 'undefined') {
    const svg = generateNotebookPageSvg(options);
    return svgToDataUrl(svg);
  }

  const width = 800;
  const height = 1050;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    const svg = generateNotebookPageSvg(options);
    return svgToDataUrl(svg);
  }

  // Paper background
  ctx.fillStyle = '#fdfbf7';
  ctx.fillRect(0, 0, width, height);

  // Sheet card
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(20, 20, width - 40, height - 40);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  // Ruled notebook lines
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  for (let y = 140; y < height - 60; y += 28) {
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(width - 40, y);
    ctx.stroke();
  }

  // Margin line on the right (red notebook margin for RTL Hebrew notebook)
  ctx.strokeStyle = '#fca5a5';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(700, 60);
  ctx.lineTo(700, height - 40);
  ctx.stroke();

  // Punch holes on left
  ctx.fillStyle = '#f1f5f9';
  ctx.strokeStyle = '#cbd5e1';
  [200, 525, 850].forEach((cy) => {
    ctx.beginPath();
    ctx.arc(28, cy, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  const ink = options.inkColor || '#1e3a8a';
  ctx.fillStyle = ink;

  // Header RTL
  ctx.font = 'bold 15px "Segoe Print", "Comic Sans MS", cursive, sans-serif';
  ctx.textAlign = 'right';
  ctx.direction = 'rtl';
  ctx.fillText(options.title, 680, 95);
  ctx.font = '13px "Segoe Print", "Comic Sans MS", cursive, sans-serif';
  ctx.fillText(`שם: ${options.studentName} | תאריך: ${options.date}`, 680, 120);

  // Question box
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(50, 142, 640, 44);
  ctx.strokeStyle = '#e2e8f0';
  ctx.strokeRect(50, 142, 640, 44);

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 13px "Assistant", Arial, sans-serif';
  ctx.fillText(options.questionText, 680, 168);

  // Hebrew explanation lines
  ctx.fillStyle = ink;
  ctx.font = '15px "Segoe Print", "Comic Sans MS", cursive, sans-serif';
  options.hebrewLines.forEach((line, idx) => {
    ctx.fillText(line, 680, 220 + idx * 28);
  });

  // Code block (LTR)
  const codeStartY = 230 + options.hebrewLines.length * 28;
  const codeHeight = options.codeLines.length * 28 + 24;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(60, codeStartY, 620, codeHeight);
  ctx.strokeStyle = '#94a3b8';
  ctx.strokeRect(60, codeStartY, 620, codeHeight);

  ctx.fillStyle = '#0f172a';
  ctx.font = '600 15px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.direction = 'ltr';
  options.codeLines.forEach((line, idx) => {
    ctx.fillText(line, 75, codeStartY + 25 + idx * 28);
  });

  // Hebrew conclusion lines
  ctx.fillStyle = ink;
  ctx.font = '14px "Segoe Print", "Comic Sans MS", cursive, sans-serif';
  ctx.textAlign = 'right';
  ctx.direction = 'rtl';
  options.conclusionHebrew.forEach((line, idx) => {
    const y = codeStartY + codeHeight + 35 + idx * 28;
    ctx.fillText(line, 680, y);
  });

  return canvas.toDataURL('image/jpeg', 0.92);
}

function svgToDataUrl(svgString: string): string {
  const encoded = typeof window !== 'undefined'
    ? btoa(unescape(encodeURIComponent(svgString)))
    : Buffer.from(svgString).toString('base64');
  return `data:image/svg+xml;base64,${encoded}`;
}

export async function renderSvgToRaster(svgDataUrl: string, width = 800, height = 1050): Promise<string> {
  if (svgDataUrl.startsWith('data:image/jpeg') || svgDataUrl.startsWith('data:image/png')) {
    return svgDataUrl;
  }
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      return resolve(svgDataUrl);
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(svgDataUrl);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      } catch {
        resolve(svgDataUrl);
      }
    };
    img.onerror = () => {
      resolve(svgDataUrl);
    };
    img.src = svgDataUrl;
  });
}


export const SAMPLE_EXAMS: SampleExam[] = [
  {
    id: 'python-tree',
    title: 'מבחן מתכונת בפייתון - עץ בינארי ורקורסיה',
    subtitle: 'עץ בינארי | רקורסיה ומקרי קצה',
    language: 'Python',
    description: 'פתרון תלמיד בכתב יד לשאלה רקורסיבית בפייתון. כולל הסבר בעברית, קוד רקורסיבי ובאג קל בטיפול בצמתים.',
    expectedScoreRange: '75-88',
    examQuestion: 'כתוב פונקציה בשם count_even_nodes(root) המקבלת שורש של עץ בינארי ומחזירה את מספר הצמתים בעלי ערך זוגי בעץ.',
    studentName: 'יונתן כהן (יב׳ 3)',
    generateImageDataUrl: () => {
      return generateNotebookCanvasJpeg({
        title: 'מתכונת מדעי המחשב - שאלון בגרות 899381',
        studentName: 'יונתן כהן (יב׳ 3)',
        date: '12/03/2026',
        questionText: 'שאלה 3: כתוב פונקציה רקורסיבית count_even_nodes(root) הסופרת צמתים זוגיים בעץ בינארי.',
        hebrewLines: [
          'פתרון שאלה 3:',
          'הרעיון הוא לבדוק רקורסיבית כל צומת בעץ.',
          'אם העץ ריק נחזיר 0. אחרת נבדוק אם הערך הנוכחי זוגי',
          'ונוסיף אותו לספירה של תת העץ השמאלי והימני.',
        ],
        codeLines: [
          'def count_even_nodes(root):',
          '    if root is None:',
          '        return 0',
          '    ',
          '    current = 0',
          '    if root.val % 2 == 0:',
          '        current = 1',
          '    ',
          '    left_count = count_even_nodes(root.left)',
          '    right_count = count_even_nodes(root.right)',
          '    ',
          '    return current + left_count + right_count',
        ],
        conclusionHebrew: [
          'סיבוכיות זמן ריצה: O(N) כאשר N הוא מספר הצמתים בעץ,',
          'כי אנחנו מבקרים בכל צומת פעם אחת בלבד.',
          'סיבוכיות מקום: O(H) עומק מחסנית הרקורסיה.',
        ],
        inkColor: '#1e3a8a',
      });
    },
  },
  {
    id: 'java-linkedlist-bug',
    title: 'מבחן מבני נתונים בג׳אווה - מחיקת איבר ברשימה',
    subtitle: 'Java LinkedList | שגיאת מצביעים במקרה קצה',
    language: 'Java',
    description: 'מימוש פונקציה בג׳אווה למחיקת איבר משרשרת חוליות. כולל באג בהתמודדות עם מחיקה של איבר ראשון (head).',
    expectedScoreRange: '68-78',
    examQuestion: 'ממש פעולה public static Node removeAll(Node head, int val) המוחקת את כל המופעים של ערך val מרשימה מקושרת ומחזירה את ראש הרשימה המעודכן.',
    studentName: 'שירה אלמוג (ת.ז. 31849201)',
    generateImageDataUrl: () => {
      return generateNotebookCanvasJpeg({
        title: 'מבני נתונים מתקדמים - מבחן אמצע סמסטר',
        studentName: 'שירה אלמוג (ת.ז. 31849201)',
        date: '04/04/2026',
        questionText: 'שאלה 2: ממש פעולה בג׳אווה המוחקת את כל החוליות שערכן val ומחזירה את ה-head המעודכן.',
        hebrewLines: [
          'פתרון שלי:',
          'קודם כל נרוץ על הרשימה עם מצביע curr.',
          'אם האיבר הבא שווה לערך המבוקש, נקשר את הבא של הבא.',
          'הערה: נראה לי שצריך לבדוק גם את האיבר הראשון בנפרד.',
        ],
        codeLines: [
          'public static Node removeAll(Node head, int val) {',
          '    if (head == null) return null;',
          '    ',
          '    Node curr = head;',
          '    while (curr != null && curr.next != null) {',
          '        if (curr.next.value == val) {',
          '            curr.next = curr.next.next;',
          '        } else {',
          '            curr = curr.next;',
          '        }',
          '    }',
          '    // מה קורה אם האיבר הראשון עצמו שווה ל-val?',
          '    if (head.value == val) {',
          '        head = head.next;',
          '    }',
          '    return head;',
          '}',
        ],
        conclusionHebrew: [
          'הסבר: הרצנו לולאה אחת ולכן הסיבוכיות היא O(N).',
          'אם הרשימה מתחילה בכמה איברים רצופים של val, יש כאן באג קל.',
        ],
        inkColor: '#047857',
      });
    },
  },
  {
    id: 'cpp-array-pointers',
    title: 'מדעי המחשב ב-C++ - היפוך מערך עם שני מצביעים',
    subtitle: 'C++ | מצביעים והחלפה In-Place',
    language: 'C++',
    description: 'קוד ב-C++ להפיכת מערך תוך שימוש במצביעים left ו-right. קוד נקי עם סגנון כתיבה מצוין.',
    expectedScoreRange: '92-100',
    examQuestion: 'כתוב פונקציה ב-C++ המקבלת מערך בגודל n והופכת את סדר איבריו במקום (in-place) בסיבוכיות זמן O(n) ומקום O(1).',
    studentName: 'איתי ברקוביץ',
    generateImageDataUrl: () => {
      return generateNotebookCanvasJpeg({
        title: 'מבוא למדעי המחשב ב-C++ - מבחן סופי',
        studentName: 'איתי ברקוביץ',
        date: '20/06/2026',
        questionText: 'שאלה 1: כתוב פונקציה reverseArray(int arr[], int n) שהופכת את המערך במקום.',
        hebrewLines: [
          'תשובה:',
          'נשתמש בטכניקת שני מצביעים (Two Pointers) משני קצוות המערך.',
          'בכל איטרציה נחליף בין האיברים ונתקדם למרכז עד שהם נפגשים.',
        ],
        codeLines: [
          'void reverseArray(int arr[], int n) {',
          '    if (arr == nullptr || n <= 1) {',
          '        return; // מקרה קצה - מערך ריק או בעל איבר בודד',
          '    }',
          '    int left = 0;',
          '    int right = n - 1;',
          '    while (left < right) {',
          '        int temp = arr[left];',
          '        arr[left] = arr[right];',
          '        arr[right] = temp;',
          '        left++;',
          '        right--;',
          '    }',
          '}',
        ],
        conclusionHebrew: [
          'סיבוכיות זמן: מבצע בדיוק n/2 החלפות, כלומר O(n).',
          'סיבוכיות מקום: O(1) נוסף בלבד ללא הקצאת מערך נוסף.',
          'הקוד מוגן מפני null ומערכים ריקים.',
        ],
        inkColor: '#1e293b',
      });
    },
  },
  {
    id: 'unclear-handwriting-sample',
    title: 'דוגמת כתב יד חלקי / מקוטע לבדיקת התראת קריאות',
    subtitle: 'מבחן מטושטש או מקוטע | בדיקת מנגנון סירוב והתראה',
    language: 'Python',
    description: 'סימולציה של דף מבחן חתוך עם כתמים ושורות מטושטשות לבדיקת מנגנון ההתרעה "התמונה אינה קריאה מספיק".',
    expectedScoreRange: 'התראה',
    examQuestion: 'מבחן מקוטע עם כתמי דיו לבחינת דיוק זיהוי קריאות.',
    generateImageDataUrl: () => {
      if (typeof document !== 'undefined') {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(0, 0, 800, 600);
          ctx.fillStyle = '#334155';
          ctx.fillRect(40, 40, 720, 520);
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('[דף צילום חשוך ומטושטש עם כתמי מים / קוד בלתי קריא]', 400, 300);
          return canvas.toDataURL('image/jpeg', 0.85);
        }
      }
      const width = 800;
      const height = 600;
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
          <rect width="${width}" height="${height}" fill="#334155" />
          <rect x="50" y="50" width="700" height="500" fill="#f1f5f9" rx="8" filter="blur(3px)" />
          <path d="M 100 150 Q 200 80 400 200 T 700 150" fill="none" stroke="#94a3b8" stroke-width="4" opacity="0.3"/>
          <ellipse cx="400" cy="300" rx="250" ry="160" fill="#1e293b" opacity="0.85" />
          <text x="400" y="310" text-anchor="middle" fill="#ffffff" font-size="22" font-family="sans-serif">
            [דף צילום חשוך ומטושטש עם כתמי מים / קוד בלתי קריא]
          </text>
        </svg>
      `;
      return svgToDataUrl(svg);
    },
  },
];
