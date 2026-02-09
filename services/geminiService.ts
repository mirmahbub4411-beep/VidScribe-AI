
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { TranscriptionResult, AppSettings } from "../types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Transcribes video or audio content using Gemini AI.
 */
export const transcribeVideo = async (
  base64Data: string,
  mimeType: string,
  settings: AppSettings
): Promise<TranscriptionResult> => {
  const prompt = `
    Analyze the provided audio.
    1. Transcribe accurately in native language (Detect automatically, English/Bangla).
    2. Format as JSON with segments (startTime, endTime, speaker, text).
    3. ${settings.removeFillers ? "Exclude fillers." : "Verbatim."}
    4. ${settings.speakerDetection ? "Differentiate speakers." : "Use 'Speaker 1'."}
    5. ${settings.generateSummary ? "Provide AI summary." : ""}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }, { inlineData: { data: base64Data, mimeType } }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            segments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  startTime: { type: Type.STRING },
                  endTime: { type: Type.STRING },
                  speaker: { type: Type.STRING },
                  text: { type: Type.STRING }
                },
                required: ["startTime", "endTime", "speaker", "text"]
              }
            },
            summary: { type: Type.STRING },
            detectedLanguage: { type: Type.STRING }
          },
          required: ["segments", "summary", "detectedLanguage"]
        }
      }
    });

    return JSON.parse(response.text || '{}') as TranscriptionResult;
  } catch (error) {
    console.error("Transcription Error:", error);
    throw new Error("Failed to process transcription.");
  }
};

/**
 * Education Answer: Solves questions from text or images.
 */
export const solveEducationQuestion = async (
  questionText: string,
  imageBase64?: string,
  imageMimeType?: string
): Promise<string> => {
  const prompt = `
    You are an expert Educational Assistant. Your task is to provide accurate answers to students.
    1. If there's an image, analyze it for questions (MCQ or CQ).
    2. Identify the correct answer clearly. For MCQs, state which option (A, B, C, or D) is correct and why.
    3. Answer in the same language as the question (Bangla or English).
    4. Provide explanations for Scientific, Islamic, or General Knowledge topics.
    5. If the question is Islamic, provide references if possible.
    6. Keep the tone helpful and academic.
    Question/Context: ${questionText}
  `;

  const parts: any[] = [{ text: prompt }];
  if (imageBase64 && imageMimeType) {
    parts.push({ inlineData: { data: imageBase64, mimeType: imageMimeType } });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts }]
    });
    return response.text || "Sorry, I couldn't find an answer.";
  } catch (error) {
    console.error("Edu Error:", error);
    throw new Error("Failed to get answer.");
  }
};

/**
 * Generates quiz questions based on class, subject, and mode.
 * For 'study' mode, it fetches a larger set of questions.
 */
export const generateQuizQuestions = async (topic: string, classLevel?: string, mode: 'study' | 'exam' = 'study'): Promise<any[]> => {
  // If study, we try to get a larger set (e.g., 50-60). For performance, 40 is a safe limit for one batch.
  const count = mode === 'study' ? 40 : 30; 
  const prompt = `
    Generate ${count} very important and common multiple-choice questions (MCQs) for Class ${classLevel || 'General'} on the topic/subject: ${topic}.
    These should be common questions that frequently appear in exams.
    Return the response as a JSON array of objects.
    Each object must have:
    - question: The question text (in Bangla).
    - options: An array of 4 options (in Bangla).
    - correctIndex: The index of the correct option (0-3).
    - explanation: A short explanation (in Bangla).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctIndex: { type: Type.NUMBER },
              explanation: { type: Type.STRING }
            },
            required: ["question", "options", "correctIndex", "explanation"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Quiz Gen Error:", error);
    return [];
  }
};

/**
 * Generates a list of chapters for a given subject and class.
 */
export const getSubjectChapters = async (subject: string, classLevel: string): Promise<string[]> => {
  const prompt = `List exactly 10 chapter names for Class ${classLevel} ${subject} in Bangla as a JSON string array.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch { return []; }
};

/**
 * Generates audio speech from text.
 */
export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        // Fix typo: responseModalities instead of responseModalities
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};

/**
 * Enhanced Audio: Transcribes and then re-synthesizes for clean output.
 */
export const enhanceAudio = async (
  base64Audio: string,
  mimeType: string,
  voiceId: string
): Promise<string> => {
  const transcribeResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [{ text: "Transcribe this audio accurately. Text only." }, { inlineData: { data: base64Audio, mimeType } }] }]
  });
  const cleanText = transcribeResponse.text || "";
  if (!cleanText) throw new Error("Could not understand audio");
  return await generateSpeech(cleanText, voiceId);
};

/**
 * Analyzes audio content to generate a descriptive motion prompt for video generation.
 */
export const analyzeAudioForVideoPrompt = async (
  audioBase64: string,
  mimeType: string
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            { text: "Analyze the mood, rhythm, and atmosphere of this audio. Generate a descriptive one-sentence motion prompt for an AI video generator like Veo. Output only the prompt text without any preamble." },
            { inlineData: { data: audioBase64, mimeType } }
          ]
        }
      ]
    });
    return response.text?.trim() || "cinematic motion with smooth camera movement and high quality resolution";
  } catch (error) {
    console.error("Audio Analysis Error:", error);
    return "cinematic motion with atmospheric lighting";
  }
};

/**
 * Starts a video generation operation using the Veo model.
 */
export const startVideoGeneration = async (
  prompt: string,
  imageBase64: string,
  imageMimeType: string,
  aspectRatio: '16:9' | '9:16'
) => {
  const veoAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return await veoAi.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt,
    image: {
      imageBytes: imageBase64,
      mimeType: imageMimeType,
    },
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio
    }
  });
};

/**
 * Polls the current status of a video generation operation.
 */
export const pollVideoOperation = async (operation: any) => {
  const veoAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return await veoAi.operations.getVideosOperation({ operation });
};
