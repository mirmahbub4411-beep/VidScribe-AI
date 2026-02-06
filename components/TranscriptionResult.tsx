
import React, { useState } from 'react';
import { Copy, FileText, Languages, History, BrainCircuit } from 'lucide-react';
import { TranscriptionResult, AppSettings } from '../types.ts';

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
    <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm w-fit">
          <Languages className="text-blue-600 w-4 h-4" />
          <span className="font-bold text-gray-700 text-xs md:text-sm capitalize">Language: {result.detectedLanguage}</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={copyToClipboard}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-xs font-bold"
          >
            <Copy className="w-4 h-4" />
            <span>Copy</span>
          </button>
          <button 
            onClick={downloadTxt}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors text-xs font-bold border border-blue-200"
          >
            <FileText className="w-4 h-4" />
            <span>TXT</span>
          </button>
          <button 
            onClick={downloadSrt}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-xl transition-colors text-xs font-bold border border-green-200"
          >
            <History className="w-4 h-4" />
            <span>SRT</span>
          </button>
        </div>
      </div>

      {result.summary && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 md:p-6 rounded-2xl border border-blue-100 shadow-sm">
          <div className="flex items-center space-x-2 mb-3">
            <BrainCircuit className="text-blue-600 w-4 h-4 md:w-5 md:h-5" />
            <h3 className="font-black text-blue-900 text-sm md:text-base uppercase tracking-wider">AI Summary</h3>
          </div>
          <p className="text-blue-800 text-sm md:text-base leading-relaxed italic">{result.summary}</p>
        </div>
      )}

      <div className="bg-white rounded-[24px] shadow-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <span className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">Transcript Editor</span>
          <div className="flex items-center space-x-1">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
             <span className="text-[10px] font-bold text-gray-400">Ready</span>
          </div>
        </div>
        <textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          className="w-full h-80 md:h-96 p-5 md:p-6 focus:outline-none resize-none font-mono text-xs md:text-sm leading-relaxed text-gray-800 bg-white"
          spellCheck={false}
          placeholder="Transcription will appear here..."
        />
      </div>
    </div>
  );
};

export default TranscriptionResultView;
