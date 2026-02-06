
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { TranscriptionResult, AppSettings } from "../types.ts";

/**
 * Transcribes video or audio content using Gemini AI.
 */
export const transcribeVideo = async (
  base64Data: string,
  mimeType: string,
  settings: AppSettings
): Promise<TranscriptionResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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

/**
 * Generates audio speech from text using Gemini TTS model.
 */
export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned from API");
    
    return base64Audio;
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // 1. Transcribe the noisy audio
  const transcribeResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        parts: [
          { text: "Transcribe this audio accurately. Output ONLY the plain text transcription." },
          { inlineData: { data: base64Audio, mimeType } }
        ]
      }
    ]
  });

  const cleanText = transcribeResponse.text || "";
  if (!cleanText) throw new Error("Could not understand audio");

  // 2. Use TTS to output perfectly clean audio with selected voice
  return await generateSpeech(cleanText, voiceId);
};

/**
 * Analyzes audio content to generate a creative visual motion prompt for video generation.
 */
export const analyzeAudioForVideoPrompt = async (
  base64Audio: string,
  mimeType: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            { text: "Analyze the mood, rhythm, and atmosphere of this audio. Describe a cinematic visual scene with specific motion that would complement this sound perfectly for a video generation prompt. Provide ONLY the descriptive prompt text." },
            { inlineData: { data: base64Audio, mimeType } }
          ]
        }
      ]
    });

    return response.text || "A cinematic scene with artistic motion matching the audio mood.";
  } catch (error) {
    console.error("Audio Analysis Error:", error);
    return "A cinematic abstract scene with fluid motion matching the sound.";
  }
};

/**
 * Starts a video generation task using the Veo model with an image and motion prompt.
 */
export const startVideoGeneration = async (
  prompt: string,
  imageBase64: string,
  imageMimeType: string,
  aspectRatio: '16:9' | '9:16'
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  return await ai.models.generateVideos({
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
 * Checks the status of a video generation operation.
 */
export const pollVideoOperation = async (operation: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return await ai.operations.getVideosOperation({ operation });
};
