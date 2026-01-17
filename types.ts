
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

export interface AppSettings {
  showTimestamps: boolean;
  generateSummary: boolean;
  speakerDetection: boolean;
  removeFillers: boolean;
}

export interface UsageStats {
  totalConversions: number;
  successRate: number;
  totalMinutes: number;
  errors: Array<{ timestamp: string; message: string }>;
}
