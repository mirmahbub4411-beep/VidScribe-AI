
import { GoogleGenAI, Type } from "@google/genai";
import { TranscriptionResult, AppSettings } from "../types";

const API_KEY = process.env.API_KEY || '';

export const transcribeVideo = async (
  base64Data: string,
  mimeType: string,
  settings: AppSettings
): Promise<TranscriptionResult> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const prompt = `
    Analyze the provided audio from this video.
    1. Transcribe the spoken words accurately in their native language (Detect automatically, support English and Bangla).
    2. Format the response as a JSON object with segments containing startTime, endTime, speaker, and text.
    3. ${settings.removeFillers ? "Exclude filler words like 'um', 'uh', 'hmm'." : "Keep the transcription verbatim."}
    4. ${settings.speakerDetection ? "Differentiate between speakers if there are multiple." : "Use 'Speaker 1' for all text."}
    5. ${settings.generateSummary ? "Provide a concise summary of the content in English." : ""}
    6. Maintain proper punctuation and sentence structure.
    7. Break paragraphs every 10-15 seconds.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { data: base64Data, mimeType } }
          ]
        }
      ],
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

    const result = JSON.parse(response.text || '{}');
    return result as TranscriptionResult;
  } catch (error) {
    console.error("Transcription Error:", error);
    throw new Error("Failed to process transcription via AI.");
  }
};
