
export interface TranscriptionSegment {
  startTime: string;
  endTime: string;
  speaker: string;
  text: string;
}

export interface TranscriptionResult {
  segments: TranscriptionSegment[];
  summary: string;
  detectedLanguage: string;
}

export type ProcessingStatus = 'idle' | 'uploading' | 'extracting' | 'transcribing' | 'finalizing' | 'success' | 'error';
export type ActiveTool = 'video' | 'audio';
export type AppView = 'transcribe' | 'dashboard' | 'profile' | 'pricing';

export interface AppSettings {
  showTimestamps: boolean;
  generateSummary: boolean;
  speakerDetection: boolean;
  removeFillers: boolean;
}

export interface User {
  name: string;
  email: string;
  country: string;
  phone: string;
  password?: string;
}

export interface HistoryItem {
  id: string;
  fileName: string;
  date: string;
  tool: ActiveTool;
  result: TranscriptionResult;
}

export interface Package {
  id: string;
  name: string;
  duration: string;
  bdt: number;
  usd: number;
  popular?: boolean;
}
