export interface ExamImage {
  id: string;
  name: string;
  dataUrl: string; // full data URL for preview and send
  mimeType: string;
  base64: string;
  rotation?: number; // 0, 90, 180, 270
  brightness?: number; // 100 default
  contrast?: number; // 100 default
}

export interface DetectedOcrRegion {
  id: string;
  box2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] in normalized scale 0-1000
  type:
    | 'code'
    | 'hebrew_text'
    | 'title'
    | 'comment'
    | 'handwritten_code'
    | 'handwritten_note'
    | 'printed_question';
  text: string;
  confidence?: number;
  lineNumber?: number;
  imageIndex?: number;
  isStudentSolution?: boolean;
}

export interface EvaluationResult {
  isReadable: boolean;
  unreadableReason?: string;
  detectedLanguage: string;
  problemTitle?: string;
  studentName?: string;
  detectedRegions?: DetectedOcrRegion[];
  transcription: {
    hebrewProse?: string;
    code: string;
    rawText?: string;
  };
  analysis: {
    strengths: string[];
    corrections: string[];
    handwritingNotes: string;
  };
  correctedCode: {
    code: string;
    explanation: string;
  };
  evaluation: {
    finalScore: number;
    logicScore: number;
    logicFeedback?: string;
    syntaxScore: number;
    syntaxFeedback?: string;
    styleScore: number;
    styleFeedback?: string;
    studentSummary: string;
    gradeCategory: string;
  };
  fullFormattedHebrewMarkdown: string;
  evaluatedAt?: string;
}

export interface OcrResult {
  isReadable: boolean;
  unreadableReason?: string;
  detectedLanguage: string;
  problemTitle?: string;
  studentName?: string;
  detectedRegions?: DetectedOcrRegion[];
  transcription: {
    hebrewProse?: string;
    code: string;
    rawText?: string;
  };
  handwritingNotes?: string;
  confidenceScore?: number;
}

export interface GradedSubmission {
  id: string;
  timestamp: number;
  title: string;
  studentName?: string;
  detectedLanguage: string;
  score: number;
  gradeCategory: string;
  result: EvaluationResult;
  thumbnailUrl: string;
}
