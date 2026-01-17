
import React, { useState } from 'react';
import { Copy, Download, FileText, Languages, History, BrainCircuit } from 'lucide-react';
import { TranscriptionResult, AppSettings } from '../types';

interface TranscriptionResultViewProps {
  result: TranscriptionResult;
  settings: AppSettings;
}

const TranscriptionResultView: React.FC<TranscriptionResultViewProps> = ({ result, settings }) => {
  const [editedText, setEditedText] = useState(
    result.segments.map(s => `${settings.showTimestamps ? `[${s.startTime}] ` : ""}${s.speaker}: ${s.text}`).join('\n\n')
  );

  const copyToClipboard = () => {
    navigator.clipboard.writeText(editedText);
    alert("Copied to clipboard!");
  };

  const downloadTxt = () => {
    const blob = new Blob([editedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription_${new Date().getTime()}.txt`;
    a.click();
  };

  const downloadSrt = () => {
    const srtContent = result.segments.map((s, i) => {
      const start = s.startTime.includes(':') ? s.startTime : `00:00:${s.startTime},000`;
      const end = s.endTime.includes(':') ? s.endTime : `00:00:${s.endTime},000`;
      return `${i + 1}\n${start} --> ${end}\n${s.speaker}: ${s.text}\n`;
    }).join('\n');

    const blob = new Blob([srtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subtitles_${new Date().getTime()}.srt`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Languages className="text-blue-600 w-5 h-5" />
          <span className="font-semibold text-gray-700 capitalize">Detected: {result.detectedLanguage}</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={copyToClipboard}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
          >
            <Copy className="w-4 h-4" />
            <span>Copy</span>
          </button>
          <button 
            onClick={downloadTxt}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-sm font-medium border border-blue-200"
          >
            <FileText className="w-4 h-4" />
            <span>.TXT</span>
          </button>
          <button 
            onClick={downloadSrt}
            className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors text-sm font-medium border border-green-200"
          >
            <History className="w-4 h-4" />
            <span>.SRT</span>
          </button>
        </div>
      </div>

      {result.summary && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
          <div className="flex items-center space-x-2 mb-3">
            <BrainCircuit className="text-blue-600 w-5 h-5" />
            <h3 className="font-bold text-blue-900">AI Summary</h3>
          </div>
          <p className="text-blue-800 leading-relaxed italic">{result.summary}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Transcript</span>
        </div>
        <textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          className="w-full h-96 p-6 focus:outline-none resize-none font-mono text-sm leading-relaxed text-gray-800"
          spellCheck={false}
        />
      </div>
    </div>
  );
};

export default TranscriptionResultView;
