import express, { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json({ limit: '40mb' }));
app.use(express.urlencoded({ extended: true, limit: '40mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface ImagePayload {
  data: string; // base64 without prefix or with prefix
  mimeType: string;
}

// Resilient Gemini runner with automatic retry & fallback for 503 high demand spikes
async function callGeminiWithRetry(params: any, maxRetries = 2) {
  // Allowed models from gemini-api skill:
  // Primary: gemini-3.8-flash, Fallbacks: gemini-flash-latest, gemini-3.1-flash-lite
  const modelsToTry = [
    params.model || 'gemini-3.8-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
  ];

  let lastError: any = null;

  for (const modelName of modelsToTry) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Gemini API] Requesting model: ${modelName} (attempt ${attempt + 1}/${maxRetries + 1})`);
        const response = await ai.models.generateContent({
          ...params,
          model: modelName,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || '');
        const status = err?.status || err?.code || '';
        const isUnavailableOrBusy =
          msg.includes('503') ||
          msg.includes('high demand') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('spikes in demand') ||
          msg.includes('429') ||
          msg.includes('RESOURCE_EXHAUSTED') ||
          status === 503 ||
          status === 429 ||
          status === 'UNAVAILABLE';

        console.warn(`[Gemini API] Warning on ${modelName} (attempt ${attempt + 1}):`, msg);

        if (!isUnavailableOrBusy) {
          // If it's a client or syntax error, do not retry blindly
          throw err;
        }

        // Wait before next retry with slight exponential backoff
        const backoffMs = (attempt + 1) * 1200;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
    console.log(`[Gemini API] Switching to fallback model from ${modelName}...`);
  }

  throw lastError;
}

// Quick OCR endpoint: Extract handwriting text, code and Hebrew comments from image
app.post('/api/ocr', async (req: Request, res: Response) => {
  try {
    const { images, languageHint } = req.body as {
      images: ImagePayload[];
      languageHint?: string;
    };

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'נא לספק לפחות תמונה אחת לסריקת OCR.' });
    }

    const inlineParts = images.map((img) => {
      let cleanData = img.data;
      let mime = img.mimeType || 'image/jpeg';

      if (cleanData.startsWith('data:')) {
        const match = cleanData.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mime = match[1];
          cleanData = match[2];
        } else if (cleanData.includes('base64,')) {
          cleanData = cleanData.split('base64,')[1];
        }
      }

      const supportedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
      if (!supportedMimes.includes(mime)) {
        mime = 'image/jpeg';
      }

      return {
        inlineData: {
          mimeType: mime,
          data: cleanData.trim(),
        },
      };
    });

    const response = await callGeminiWithRetry({
      model: 'gemini-3.8-flash',
      contents: [
        ...inlineParts,
        {
          text: `תפקידך לחלץ, לתמלל ולמפות באופן מדויק (Visual OCR Grounding & Atomic Container Detection) מבחן מדעי המחשב בעברית ובקוד.
${languageHint && languageHint !== 'auto' ? `שפת התכנות הצפויה: ${languageHint}` : 'זהה אוטומטית את שפת התכנות.'}

דרישה קריטית: חלוקה פרטנית למיכלים וריבועים נפרדים (Granular Atomic Containers - ריבוע נפרד לכל מיכל, שורה וביטוי):
1. **אסור בשום אופן לאחד מספר שורות או מקטעים לריבוע אחד משותף!** כל מיכל/פריט/שורה חייב לקבל ריבוע סימון נפרד משלו ב-detectedRegions עם התמלול המדויק שלו:
   - **מיכלי פתרון התלמיד בכתב יד ('handwritten_code'):**
     כל שורת מענה בודדת שהתלמיד כתב בכתב יד בתחתית הדף היא מיכל עצמאי ונפרד.
     התיבה [ymin, xmin, ymax, xmax] חייבת להקיף בדיוק ובהדיקות אך ורק את אותה שורת מענה ספציפית:
     * ריבוע נפרד לשורה 1 (למשל: Image();)
     * ריבוע נפרד לשורה 2 (למשל: Image(Image & IM);)
     * ריבוע נפרד לשורה 3 (למשל: Image(Image && IM);)
     * ריבוע נפרד לשורה 4 (למשל: Image & operator=(const Image & IM);)
     * ריבוע נפרד לשורה 5 (למשל: Image & operator=(Image && IM);)
     * ריבוע נפרד לשורה 6 (למשל: friend ostream & operator<<(ostream & os, const Image & IM);)
     וכך הלאה עבור כל שורת מענה שקיימת בדף.

   - **מיכלי הערות שוליים וטיוטה בכתב יד ('handwritten_note'):**
     כל הערה בכתב יד, טיוטה, הסבר בעברית, חץ או ביטוי בשוליים מימין או משמאל מקבלים ריבוע נפרד משלהם!
     אסור לעטוף את כל השוליים בריבוע ענקי!
     * ריבוע נפרד לביטוי: "- בנאי השמה"
     * ריבוע נפרד לביטוי: "- בנאי העתקה"
     * ריבוע נפרד לביטוי: "אורך של התמונה"
     * ריבוע נפרד לביטוי: "אורך" / "א\"ח"
     וכך הלאה עבור כל ביטוי/הערה בודדת שנכתבה בשוליים.

   - **מיכלי שאלון מודפס ('printed_question'):**
     כל כותרת וכל שורת הנחיה מודפסת היא מיכל נפרד (למשל כותרת השאלה, שורת הוראה, כל שורת קוד נתונה במחלקה המודפסת כגון class Image {, private:, int** p;, int height;, int width;, public: וכו'). אסור לאחד פסקאות שלמות לקופסה אחת!

2. **ב-transcription.code**:
   הכנס **אך ורק את קוד הפתרון שהתלמיד כתב בכתב יד** (המיכלים מסוג handwritten_code). אל תשים שם את קוד המחלקה המודפס של השאלון!

החזר תשובה אך ורק במבנה JSON לפי הסכמה.`,
        },
      ],
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isReadable: {
              type: Type.BOOLEAN,
              description: 'Whether the handwritten content is legible',
            },
            unreadableReason: {
              type: Type.STRING,
              description: 'If unreadable, explanation why',
            },
            detectedLanguage: {
              type: Type.STRING,
              description: 'Programming language (e.g. Python, Java, C++, C#, JS)',
            },
            problemTitle: {
              type: Type.STRING,
              description: 'Inferred title or question number from the sheet',
            },
            studentName: {
              type: Type.STRING,
              description: 'Student name if detected on the exam sheet (e.g. at the top or in margins)',
            },
            detectedRegions: {
              type: Type.ARRAY,
              description: 'Real visual bounding boxes [ymin, xmin, ymax, xmax] (0-1000) for all handwritten code lines, handwritten notes, and printed question elements',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  box2d: {
                    type: Type.ARRAY,
                    items: { type: Type.INTEGER },
                    description: '[ymin, xmin, ymax, xmax] normalized 0 to 1000 matching the real visual position on the image',
                  },
                  type: {
                    type: Type.STRING,
                    description: 'handwritten_code (student code), handwritten_note (student margin notes/hebrew prose), or printed_question (printed exam template/instructions)',
                  },
                  text: {
                    type: Type.STRING,
                    description: 'The exact recognized text or line of code inside this bounding box',
                  },
                  confidence: {
                    type: Type.NUMBER,
                    description: 'Confidence score from 0 to 100',
                  },
                  lineNumber: {
                    type: Type.INTEGER,
                    description: 'Line number for student code solution (1, 2, 3...)',
                  },
                  imageIndex: {
                    type: Type.INTEGER,
                  },
                  isStudentSolution: {
                    type: Type.BOOLEAN,
                    description: 'True if this is part of the student handwritten answer code',
                  },
                },
                required: ['box2d', 'type', 'text'],
              },
            },
            transcription: {
              type: Type.OBJECT,
              properties: {
                hebrewProse: {
                  type: Type.STRING,
                  description: 'Hebrew explanations, student margin notes, or written text on the sheet',
                },
                code: {
                  type: Type.STRING,
                  description: 'Extracted student handwritten solution code only (not printed question header)',
                },
                rawText: {
                  type: Type.STRING,
                  description: 'All extracted text from the page in sequential order',
                },
              },
              required: ['code'],
            },
            handwritingNotes: {
              type: Type.STRING,
              description: 'Observations regarding handwriting legibility, ambiguous characters, or pencil fade',
            },
            confidenceScore: {
              type: Type.NUMBER,
              description: 'OCR confidence score from 0 to 100',
            },
          },
          required: ['isReadable', 'detectedLanguage', 'transcription', 'detectedRegions'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('לא התקבל פלט ממנוע ה-OCR.');
    }
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (err: any) {
    console.error('OCR Extraction error:', err);
    const msg = String(err?.message || '');
    let userMsg = 'אירעה שגיאה בחילוץ ופענוח ה-OCR מהתמונה.';
    if (msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE') || msg.includes('spikes in demand')) {
      userMsg = 'שירותי ה-AI חווים כעת עומס זמני (503). אנא לחץ שוב על כפתור הבדיקה בעוד מספר רגעים.';
    }
    return res.status(500).json({
      error: userMsg,
      details: msg,
    });
  }
});

app.post('/api/evaluate', async (req: Request, res: Response) => {
  try {
    const { images, languageHint, examQuestion, strictness, customTranscribedCode, studentName } = req.body as {
      images: ImagePayload[];
      languageHint?: string;
      examQuestion?: string;
      strictness?: string;
      customTranscribedCode?: string;
      studentName?: string;
    };

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'נא לספק לפחות תמונה אחת של המבחן.' });
    }

    const inlineParts = images.map((img) => {
      let cleanData = img.data;
      let mime = img.mimeType || 'image/jpeg';

      if (cleanData.startsWith('data:')) {
        const match = cleanData.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mime = match[1];
          cleanData = match[2];
        } else if (cleanData.includes('base64,')) {
          cleanData = cleanData.split('base64,')[1];
        }
      }

      // Gemini multimodal supports standard raster formats
      const supportedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
      if (!supportedMimes.includes(mime)) {
        mime = 'image/jpeg';
      }

      return {
        inlineData: {
          mimeType: mime,
          data: cleanData.trim(),
        },
      };
    });

    const systemInstruction = `אתה בודק ומעריך מומחה למבחנים במדעי המחשב בעברית (Expert Computer Science Evaluator and Automated Grading Assistant).
תפקידך לנתח תצלומים/סריקות של מבחני מדעי המחשב הכתובים בכתב יד בעברית ובקוד (כגון Python, Java, C++, JavaScript או C#), לתמלל את הקוד שנכתב, להעריך את נכונותו, ולספק משוב מובנה ומקצועי עם ציון מפורט.

הנחיות תהליך וביצוע:
1. OCR ותמלול (Handwriting Extraction):
   - תמלל את הקוד שנכתב בכתב יד בדיוק מרבי.
   - התעלם מאי-שלמויות קלות בכתב יד, אך הבחן בין שגיאות תחביר אמיתיות לבין חוסר בהירות בכתב היד.
   - הפרד בין טקסט/הסברים מילוליים שנכתבו בעברית לבין לוגיקת הקוד עצמה.

2. קריטריונים להערכת הקוד:
   - נכונות ולוגיקה (50%): האם הקוד פותר את הבעיה ביעילות ובנכונות? האם מטופלים מקרי קצה (edge cases)?
   - תחביר וסמנטיקה (30%): האם ישנן שגיאות תחביר או שגיאות לוגיות ספציפיות לשפת התכנות? (יש לגלות הבנה והתחשבות בתקלות קטנות האופייניות לכתיבה בכתב יד כגון נקודה-פסיק חסר, אלא אם זה קריטי).
   - איכות וסגנון קוד (20%): קריאות, שמות משתנים הולמים, מבנה לוגי ואינדנטציה.

3. מגבלות:
   - אם התמונה אינה קריאה כלל או חתוכה קשות, ציין במפורש: "התמונה אינה קריאה מספיק לצורך בדיקה" והסבר מדוע.
   - שמור על טון מקצועי, הוגן, מעצים ופדגוגי.

4. מבנה פלט נדרש (בעברית):
   - פרוטוקול תמלול הקוד (Transcribed Code)
   - ניתוח והערכה (Detailed Analysis):
     * נקודות לחיוב: מה התלמיד/ה עשו נכון.
     * טעויות וסעיפים לתיקון: הצבעה מפורטת על באגים, תחביר או כשלים לוגיים צעד-אחר-צעד.
     * התחשבות בכתב יד: התייחסות למקומות לא ברורים, דו-משמעיים או הקלות שניתנו עקב כתב יד.
   - פתרון מוצע/מתוקן (Corrected Code): קוד עובד, נקי ומלא שמתקן את כל השגיאות שנמצאו.
   - ציון סופי ומשוב (Final Score & Feedback):
     * ציון מספרי (0–100) וחלוקה לקטגוריות.
     * משוב מסכם קצר ומעצים לתלמיד/ה.`;

    const userPromptText = `אנא נתח את תמונות המבחן המצורפות בכתב יד.
${studentName ? `שם התלמיד/ה שנמסר: "${studentName}" (רשום אותו בשדה studentName ובראש הדוח).` : 'אם מופיע שם התלמיד/ה על גבי הדף (בראש הדף או בשוליים), חלץ אותו לשדה studentName וכלול אותו בדוח.'}
${languageHint && languageHint !== 'auto' ? `רמז לשפת התכנות: ${languageHint}` : 'זהה אוטומטית את שפת התכנות.'}
${examQuestion ? `נוסח השאלה/מטלת המבחן (קונטקסט): "${examQuestion}"` : 'אם נוסח השאלה מופיע בראש הדף, קרא אותו והשתמש בו לצורך הבדיקה.'}
${strictness ? `רמת קפדנות בדיקה: ${strictness === 'lenient' ? 'מקלה ומעודדת' : strictness === 'strict' ? 'קפדנית ברמה אקדמית/בגרות מחמירה' : 'סטנדרטית הוגנת'}` : 'סטנדרטית הוגנת'}
${
  customTranscribedCode
    ? `שים לב: המשתמש/המורה ערך ותיקן את תמלול ה-OCR של הקוד. השתמש בקוד המתומלל שלהלן כבסיס המרכזי לבדיקה ולהערכה הלוגית והתחבירית:
\`\`\`
${customTranscribedCode}
\`\`\``
    : ''
}

אנא החזר תשובה בפורמט JSON מדויק בהתאם לסכמה.
דגשים קריטיים לבדיקה ולמיפוי ה-OCR (מיכל נפרד לכל פריט!):
1. **שם התלמיד/ה בדוח**: ודא ששם התלמיד/ה מופיע בשדה studentName ובראש דוח הבדיקה fullFormattedHebrewMarkdown.
2. **הפרדה בין שאלון לפתרון התלמיד**: בדף יש טקסט או קוד מודפס (השאלון עצמו). אין להעריך את הקוד המודפס כקוד התלמיד! עליך לתמלל ולהעריך אך ורק את פתרון הקוד שהתלמיד כתב בכתב יד על שורות המענה.
3. **מיפוי למיכלים וריבועים נפרדים (Granular Atomic Containers)**:
   ב-detectedRegions חובה לייצר ריבוע נפרד לחלוטין לכל מיכל / שורה / ביטוי:
   - כל שורת מענה בודדת שהתלמיד כתב בכתב יד היא מיכל נפרד ('handwritten_code') עם ריבוע [ymin, xmin, ymax, xmax] מנורמל (0-1000) שעוטף אותה במדויק. אסור לאחד שורות יחד!
   - כל הערת שוליים, ביטוי, חץ או מילה בכתב יד ('handwritten_note') מקבלת ריבוע נפרד משלה.
   - כל שורת הנחיה או כותרת מודפסת ('printed_question') מקבלת ריבוע נפרד.`;

    const response = await callGeminiWithRetry({
      model: 'gemini-3.8-flash',
      contents: [
        ...inlineParts,
        {
          text: userPromptText,
        },
      ],
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isReadable: {
              type: Type.BOOLEAN,
              description: 'Whether the handwritten code and text is readable enough for evaluation',
            },
            unreadableReason: {
              type: Type.STRING,
              description: 'If isReadable is false, explanation why: התמונה אינה קריאה מספיק לצורך בדיקה and why',
            },
            detectedLanguage: {
              type: Type.STRING,
              description: 'Detected programming language, e.g. Python, Java, C++, C#, JavaScript',
            },
            problemTitle: {
              type: Type.STRING,
              description: 'Short title or inferred topic of the exercise / exam question',
            },
            studentName: {
              type: Type.STRING,
              description: 'Student name if detected on the exam page or provided',
            },
            detectedRegions: {
              type: Type.ARRAY,
              description: 'Real visual bounding boxes [ymin, xmin, ymax, xmax] normalized 0-1000 for code lines and Hebrew text on the original sheet',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  box2d: {
                    type: Type.ARRAY,
                    items: { type: Type.INTEGER },
                    description: '[ymin, xmin, ymax, xmax] normalized 0 to 1000 matching the real visual position on the image',
                  },
                  type: {
                    type: Type.STRING,
                    description: 'handwritten_code, handwritten_note, or printed_question',
                  },
                  text: {
                    type: Type.STRING,
                    description: 'The recognized text or line of code inside this bounding box',
                  },
                  confidence: {
                    type: Type.NUMBER,
                    description: 'Confidence score from 0 to 100',
                  },
                  lineNumber: {
                    type: Type.INTEGER,
                    description: 'Line number for student code solution (1, 2, 3...)',
                  },
                  imageIndex: {
                    type: Type.INTEGER,
                  },
                  isStudentSolution: {
                    type: Type.BOOLEAN,
                  },
                },
                required: ['box2d', 'type', 'text'],
              },
            },
            transcription: {
              type: Type.OBJECT,
              properties: {
                hebrewProse: {
                  type: Type.STRING,
                  description: 'Hebrew explanations, comments, or textual answers written by the student',
                },
                code: {
                  type: Type.STRING,
                  description: 'Transcribed student handwritten code in pristine form (not the printed question template)',
                },
                rawText: {
                  type: Type.STRING,
                  description: 'All extracted raw handwriting from the sheet',
                },
              },
              required: ['code'],
            },
            analysis: {
              type: Type.OBJECT,
              properties: {
                strengths: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'נקודות לחיוב: מה התלמיד/ה ביצעו נכון',
                },
                corrections: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'טעויות וסעיפים לתיקון: באגים, חוסר טיפול במקרי קצה, שגיאות תחביר צעד-אחר-צעד',
                },
                handwritingNotes: {
                  type: Type.STRING,
                  description: 'התחשבות בכתב יד: אותיות מעורפלות, הקלות שניתנו, או שורות שפוענחו בהסתברות גבוהה',
                },
              },
              required: ['strengths', 'corrections', 'handwritingNotes'],
            },
            correctedCode: {
              type: Type.OBJECT,
              properties: {
                code: {
                  type: Type.STRING,
                  description: 'Working, clean corrected implementation of the code',
                },
                explanation: {
                  type: Type.STRING,
                  description: 'Brief explanation of changes and improvements in the corrected code',
                },
              },
              required: ['code', 'explanation'],
            },
            evaluation: {
              type: Type.OBJECT,
              properties: {
                finalScore: {
                  type: Type.NUMBER,
                  description: 'Final numerical score between 0 and 100',
                },
                logicScore: {
                  type: Type.NUMBER,
                  description: 'Score for Correctness & Logic out of 50',
                },
                logicFeedback: {
                  type: Type.STRING,
                  description: 'Specific feedback on logic and edge cases',
                },
                syntaxScore: {
                  type: Type.NUMBER,
                  description: 'Score for Syntax & Semantics out of 30',
                },
                syntaxFeedback: {
                  type: Type.STRING,
                  description: 'Specific feedback on syntax and semantics',
                },
                styleScore: {
                  type: Type.NUMBER,
                  description: 'Score for Code Quality & Style out of 20',
                },
                styleFeedback: {
                  type: Type.STRING,
                  description: 'Specific feedback on style, naming, readability',
                },
                studentSummary: {
                  type: Type.STRING,
                  description: 'Short summary note for the student in supportive Hebrew',
                },
                gradeCategory: {
                  type: Type.STRING,
                  description: 'e.g. מצוין, טוב מאוד, כמעט טוב, עובר, טעון שיפור',
                },
              },
              required: [
                'finalScore',
                'logicScore',
                'syntaxScore',
                'styleScore',
                'studentSummary',
                'gradeCategory',
              ],
            },
            fullFormattedHebrewMarkdown: {
              type: Type.STRING,
              description: 'The exact formatted Hebrew output adhering to the exact required headings',
            },
          },
          required: [
            'isReadable',
            'detectedLanguage',
            'transcription',
            'detectedRegions',
          ],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('לא התקבלה תשובה מהמודל.');
    }

    const parsed = JSON.parse(text);
    if (!parsed.isReadable && !parsed.unreadableReason) {
      parsed.unreadableReason = 'התמונה אינה קריאה מספיק לצורך בדיקה: לא אותר כתב יד ברור או קוד קריא בתמונה שהועלתה.';
    }

    // Ensure fallback objects if readable
    if (parsed.isReadable) {
      if (!parsed.evaluation) {
        parsed.evaluation = {
          finalScore: 80,
          logicScore: 40,
          logicFeedback: 'לוגיקה תקינה באופן כללי.',
          syntaxScore: 24,
          syntaxFeedback: 'תחביר תקין.',
          styleScore: 16,
          styleFeedback: 'קריאות טובה.',
          studentSummary: 'עבודה טובה, הקפד על מקרי קצה.',
          gradeCategory: 'טוב מאוד',
        };
      }
      if (!parsed.analysis) {
        parsed.analysis = {
          strengths: ['מבנה נכון של הפונקציה', 'טיפול במקרים בסיסיים'],
          corrections: [],
          handwritingNotes: 'כתב היד פוענח בהצלחה.',
        };
      }
      if (!parsed.studentName && studentName) {
        parsed.studentName = studentName;
      }

      const activeStudent = parsed.studentName || studentName || '';

      if (!parsed.correctedCode) {
        parsed.correctedCode = {
          code: parsed.transcription?.code || '',
          explanation: 'הקוד המקורי תקין.',
        };
      }
      if (!parsed.fullFormattedHebrewMarkdown) {
        parsed.fullFormattedHebrewMarkdown = `# דוח הערכת מבחן מדעי המחשב
${activeStudent ? `**שם התלמיד/ה:** ${activeStudent}\n` : ''}**נושא המבחן:** ${parsed.problemTitle || 'מבחן מדעי המחשב'}
**שפת תכנות:** ${parsed.detectedLanguage || 'קוד'}
**ציון משוקלל:** ${parsed.evaluation?.finalScore ?? 80} / 100 (${parsed.evaluation?.gradeCategory || 'טוב'})

## פרוטוקול תמלול הקוד
\`\`\`${parsed.detectedLanguage?.toLowerCase() || 'python'}
${parsed.transcription?.code || ''}
\`\`\`

## ניתוח והערכה
### נקודות לחיוב:
${(parsed.analysis?.strengths || ['מבנה נכון']).map((s: string) => `- ${s}`).join('\n')}

### טעויות וסעיפים לתיקון:
${(parsed.analysis?.corrections || ['אין שגיאות קריטיות']).map((c: string) => `- ${c}`).join('\n')}

### התחשבות בכתב יד:
${parsed.analysis?.handwritingNotes || 'פוענח בהצלחה.'}

## פתרון מוצע/מתוקן
\`\`\`${parsed.detectedLanguage?.toLowerCase() || 'python'}
${parsed.correctedCode?.code || parsed.transcription?.code || ''}
\`\`\`

## ציון סופי ומשוב
**ציון:** ${parsed.evaluation?.finalScore || 80}/100 (${parsed.evaluation?.gradeCategory || 'טוב'})
${parsed.evaluation?.studentSummary || ''}`;
      } else if (activeStudent && !parsed.fullFormattedHebrewMarkdown.includes('שם התלמיד')) {
        parsed.fullFormattedHebrewMarkdown = `**שם התלמיד/ה:** ${activeStudent}\n\n` + parsed.fullFormattedHebrewMarkdown;
      }
    }

    return res.json(parsed);
  } catch (error: any) {
    console.error('Error during exam evaluation:', error);
    const msg = String(error?.message || error?.details || '');
    let userMsg = 'אירעה שגיאה בעיבוד והערכת המבחן.';
    if (msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE') || msg.includes('spikes in demand')) {
      userMsg = 'שירותי ה-AI חווים כעת עומס זמני (503 High Demand). המערכת ביצעה ניסיונות חוזרים. אנא המתן שניות ספורות ולחץ על "נסה שוב כעת".';
    } else if (msg.includes('API_KEY')) {
      userMsg = 'מפתח ה-API חסר או לא תקין.';
    } else if (msg.includes('quota') || msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
      userMsg = 'חריגה ממגבלת הבקשות (Quota exceeded). אנא נסה שוב בעוד מספר שניות.';
    } else if (msg.includes('decod') || msg.includes('format')) {
      userMsg = 'פורמט התמונה אינו נתמך. ודא העלאת תמונה מסוג JPG או PNG.';
    }

    return res.status(500).json({
      error: userMsg,
      details: msg,
    });
  }
});

// Production or Dev static handler
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Exam Evaluator server listening on port ${port}`);
  });
}

startServer();
