
import React, { useState, useCallback } from 'react';
import { 
  Settings as SettingsIcon, 
  Check, 
  Zap, 
  BarChart3, 
  Layout, 
  Type as TypeIcon,
  Mic2,
  EarOff,
  Clock,
  MessageSquare
} from 'lucide-react';
import FileUpload from './components/FileUpload';
import TranscriptionResultView from './components/TranscriptionResult';
import { AppSettings, ProcessingStatus, TranscriptionResult } from './types';
import { transcribeVideo } from './services/geminiService';

const App: React.FC = () => {
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [settings, setSettings] = useState<AppSettings>({
    showTimestamps: true,
    generateSummary: true,
    speakerDetection: true,
    removeFillers: true
  });

  const toggleSetting = (key: keyof AppSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setResult(null);
    setStatus('idle');
  };

  const startProcessing = async () => {
    if (!selectedFile) return;

    setStatus('uploading');
    setProgress(20);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        setStatus('extracting');
        setProgress(40);
        
        // Simulating the multi-step process for UI feel
        setTimeout(async () => {
          setStatus('transcribing');
          setProgress(70);

          try {
            const transcriptionResult = await transcribeVideo(
              base64Data,
              selectedFile.type,
              settings
            );
            
            setStatus('finalizing');
            setProgress(90);
            
            setTimeout(() => {
              setResult(transcriptionResult);
              setStatus('success');
              setProgress(100);
            }, 800);
          } catch (err) {
            console.error(err);
            setStatus('error');
          }
        }, 1200);
      };
      reader.readAsDataURL(selectedFile);
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Zap className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            VidScribe AI
          </span>
        </div>
        <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-600">
          <a href="#" className="hover:text-blue-600">Pricing</a>
          <a href="#" className="hover:text-blue-600">API Documentation</a>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            Sign In
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Convert Video to Text <span className="text-blue-600">Instantly</span>
          </h1>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            High-accuracy AI transcription for your video content. Supporting English and Bangla with automatic speaker labeling and summarization.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Area */}
          <div className="lg:col-span-2 space-y-6">
            <FileUpload onFileSelect={handleFileSelect} isProcessing={status !== 'idle' && status !== 'success' && status !== 'error'} />
            
            {(status !== 'idle' && !result) && (
              <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
                    {status === 'uploading' && "Loading Video Data..."}
                    {status === 'extracting' && "Extracting Audio..."}
                    {status === 'transcribing' && "Running AI Transcription..."}
                    {status === 'finalizing' && "Polishing Output..."}
                  </span>
                  <span className="text-sm font-bold text-gray-500">{progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {[
                    { key: 'uploading', label: 'Upload' },
                    { key: 'extracting', label: 'Extract' },
                    { key: 'transcribing', label: 'AI Process' },
                    { key: 'finalizing', label: 'Ready' }
                  ].map((step, idx) => (
                    <div key={step.key} className="flex flex-col items-center space-y-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                        idx < ['uploading', 'extracting', 'transcribing', 'finalizing'].indexOf(status)
                        ? "bg-green-100 text-green-600"
                        : idx === ['uploading', 'extracting', 'transcribing', 'finalizing'].indexOf(status)
                        ? "bg-blue-600 text-white animate-pulse"
                        : "bg-gray-100 text-gray-400"
                      }`}>
                        {idx < ['uploading', 'extracting', 'transcribing', 'finalizing'].indexOf(status) ? <Check className="w-3 h-3" /> : idx + 1}
                      </div>
                      <span className="text-[10px] text-gray-500 font-medium">{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result && (
              <TranscriptionResultView result={result} settings={settings} />
            )}

            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center space-x-3">
                <div className="p-1 bg-red-100 rounded-full">
                  <EarOff className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold">Transcription Failed</p>
                  <p className="text-sm opacity-80">There was an issue processing your video. Please try a different file or check your internet connection.</p>
                </div>
                <button 
                  onClick={() => setStatus('idle')}
                  className="ml-auto text-xs underline font-bold"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>

          {/* Settings Sidebar */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
              <div className="flex items-center space-x-2 mb-6">
                <SettingsIcon className="w-5 h-5 text-gray-400" />
                <h3 className="font-bold text-gray-800">Transcription Settings</h3>
              </div>

              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Timestamps</p>
                      <p className="text-[10px] text-gray-400">Include start/end times</p>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                    checked={settings.showTimestamps}
                    onChange={() => toggleSetting('showTimestamps')}
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Speaker Detection</p>
                      <p className="text-[10px] text-gray-400">ID different speakers</p>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                    checked={settings.speakerDetection}
                    onChange={() => toggleSetting('speakerDetection')}
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                  <div className="flex items-center space-x-3">
                    <Mic2 className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Remove Fillers</p>
                      <p className="text-[10px] text-gray-400">Filter um, uh, ah</p>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                    checked={settings.removeFillers}
                    onChange={() => toggleSetting('removeFillers')}
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                  <div className="flex items-center space-x-3">
                    <Zap className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Auto Summary</p>
                      <p className="text-[10px] text-gray-400">AI-generated overview</p>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                    checked={settings.generateSummary}
                    onChange={() => toggleSetting('generateSummary')}
                  />
                </label>
              </div>

              <button
                disabled={!selectedFile || (status !== 'idle' && status !== 'success' && status !== 'error')}
                onClick={startProcessing}
                className={`w-full mt-8 py-4 px-6 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg transition-all active:scale-[0.98] ${
                  !selectedFile || (status !== 'idle' && status !== 'success' && status !== 'error')
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-200"
                }`}
              >
                <Zap className="w-5 h-5" />
                <span>{status === 'success' ? 'Transcribe Again' : 'Start Transcription'}</span>
              </button>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl shadow-xl text-white">
              <div className="flex items-center space-x-2 mb-4">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold">Account Stats</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Free Minutes Left</span>
                  <span className="font-mono text-blue-400">14 / 15m</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-blue-500 w-[93%] h-full"></div>
                </div>
                <button className="w-full mt-2 py-2 text-xs font-bold border border-blue-500 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-colors">
                  Upgrade to Pro
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 py-8 px-4 mt-20">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-sm text-gray-400">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-gray-600">VidScribe AI © 2024</span>
          </div>
          <div className="flex space-x-8">
            <a href="#" className="hover:text-blue-600">Privacy Policy</a>
            <a href="#" className="hover:text-blue-600">Terms of Service</a>
            <a href="#" className="hover:text-blue-600">Contact Support</a>
          </div>
          <div className="text-[10px] text-gray-300">
            Powered by Gemini 2.5 Flash
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
