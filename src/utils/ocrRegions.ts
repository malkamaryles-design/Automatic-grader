import { DetectedOcrRegion } from '../types/evaluation';

/**
 * Validates, clamps and normalizes bounding box coordinates to [0, 1000].
 */
export function sanitizeBox2d(
  box: number[] | undefined | null
): [number, number, number, number] {
  if (!box || !Array.isArray(box) || box.length < 4) {
    return [0, 0, 100, 100];
  }

  let [ymin, xmin, ymax, xmax] = box.map((v) => {
    const num = Number(v);
    if (isNaN(num)) return 0;
    return Math.max(0, Math.min(1000, num));
  });

  // Ensure ymin < ymax
  if (ymin > ymax) {
    const temp = ymin;
    ymin = ymax;
    ymax = temp;
  }
  // Ensure minimum height
  if (ymax - ymin < 12) {
    ymax = Math.min(1000, ymin + 20);
  }

  // Ensure xmin < xmax
  if (xmin > xmax) {
    const temp = xmin;
    xmin = xmax;
    xmax = temp;
  }
  // Ensure minimum width
  if (xmax - xmin < 20) {
    xmax = Math.min(1000, xmin + 50);
  }

  return [Math.round(ymin), Math.round(xmin), Math.round(ymax), Math.round(xmax)];
}

/**
 * Cleans and prepares detected OCR regions from API response.
 * ONLY uses genuine detected bounding boxes from Gemini vision detection.
 * Never invents fake linear coordinates that sit on top of unrelated printed text!
 */
export function prepareOcrRegions(
  regions: DetectedOcrRegion[] | undefined | null
): DetectedOcrRegion[] {
  if (!regions || !Array.isArray(regions) || regions.length === 0) {
    return [];
  }

  let studentLineCounter = 1;

  return regions.map((reg, index) => {
    const box = sanitizeBox2d(reg.box2d);
    const rawType = String(reg.type || '').toLowerCase();

    let normalizedType: DetectedOcrRegion['type'] = 'handwritten_code';
    if (rawType.includes('printed') || rawType.includes('question') || rawType === 'title') {
      normalizedType = 'printed_question';
    } else if (rawType.includes('note') || rawType.includes('hebrew') || rawType.includes('comment')) {
      normalizedType = 'handwritten_note';
    } else {
      normalizedType = 'handwritten_code';
    }

    const isStudent =
      reg.isStudentSolution ??
      (normalizedType === 'handwritten_code' && !rawType.includes('printed'));

    let lineNum = reg.lineNumber;
    if (isStudent && !lineNum) {
      lineNum = studentLineCounter++;
    }

    return {
      ...reg,
      id: reg.id || `ocr_reg_${index + 1}`,
      box2d: box,
      type: normalizedType,
      lineNumber: lineNum,
      imageIndex: reg.imageIndex ?? 0,
      isStudentSolution: isStudent,
    };
  });
}

/**
 * Returns color classes, badges and labels for each region type.
 */
export function getRegionColorStyles(type: DetectedOcrRegion['type']) {
  switch (type) {
    case 'handwritten_code':
    case 'code':
      return {
        border: 'border-emerald-400',
        bg: 'bg-emerald-500/15',
        activeBg: 'bg-emerald-500/35',
        activeBorder: 'border-emerald-300 ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/30',
        badgeBg: 'bg-emerald-600 text-white',
        text: 'text-emerald-200',
        label: 'פתרון בכתב יד',
        accentColor: '#10b981',
      };
    case 'handwritten_note':
    case 'hebrew_text':
    case 'comment':
      return {
        border: 'border-amber-400/90',
        bg: 'bg-amber-500/15',
        activeBg: 'bg-amber-500/35',
        activeBorder: 'border-amber-300 ring-2 ring-amber-400 shadow-lg shadow-amber-500/30',
        badgeBg: 'bg-amber-600 text-white',
        text: 'text-amber-200',
        label: 'הערות שוליים / טיוטה',
        accentColor: '#f59e0b',
      };
    case 'printed_question':
    case 'title':
    default:
      return {
        border: 'border-slate-500/70 border-dashed',
        bg: 'bg-slate-500/10',
        activeBg: 'bg-slate-500/25',
        activeBorder: 'border-slate-300 ring-2 ring-slate-400 shadow-lg',
        badgeBg: 'bg-slate-700 text-slate-200',
        text: 'text-slate-300',
        label: 'שאלון מודפס',
        accentColor: '#64748b',
      };
  }
}
