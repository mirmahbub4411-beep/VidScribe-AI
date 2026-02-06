
import React, { useState, useRef, useEffect } from 'react';
import { 
  Waves, 
  Mic, 
  Trash2, 
  Sparkles, 
  Download, 
  Play, 
  Square, 
  Loader2, 
  AlertCircle, 
  Info, 
  TrendingUp,
  Settings2,
  CheckCircle2,
  Volume2,
  ChevronDown,
  FileAudio,
  FileVideo
} from 'lucide-react';
import { enhanceAudio } from '../services/geminiService.ts';

// Voice Tones mapping to Gemini TTS voices
const TONES = [
  { id: 'Kore', name: 'Professional Male', desc: 'Clear & Trustworthy', icon: '👔' },
  { id: 'Zephyr', name: 'Soft Female', desc: 'Calm & Friendly', icon: '🌸' },
  { id: 'Fenrir', name: 'Deep Voice', desc: 'Authoritative & Strong', icon: '🦁' },
  { id: 'Puck', name: 'Youthful', desc: 'Energetic & Bright', icon: '⚡' },
];

interface VoiceEnhancerProps {
  minutesUsed: number;
  limitMinutes: number;
  onUsageUpdate: (minutes: number) => void;
  onUpgrade: () => void;
  isPro: boolean;
}

const VoiceEnhancer: React.FC<VoiceEnhancerProps> = ({ minutesUsed, limitMinutes, onUsageUpdate, onUpgrade, isPro }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [selectedTone, setSelectedTone] = useState(TONES[0]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isLimitReached = !isPro && minutesUsed >= limitMinutes;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowDownloadMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        alert("File too large. Max 20MB.");
        return;
      }
      setSelectedFile(file);
      setAudioUrl(null);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
    });
  };

  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numOfChan = buffer.numberOfChannels,
      length = buffer.length * numOfChan * 2 + 44,
      buffer_out = new ArrayBuffer(length),
      view = new DataView(buffer_out);
    let pos = 0;

    const setUint32 = (d: number) => { view.setUint32(pos, d, true); pos += 4; };
    const setUint16 = (d: number) => { view.setUint16(pos, d, true); pos += 2; };

    setUint32(0x46464952); setUint32(length - 8); setUint32(0x45564157);
    setUint32(0x20746d66); setUint32(16); setUint16(1); setUint16(numOfChan);
    setUint32(buffer.sampleRate); setUint32(buffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2); setUint16(16); setUint32(0x61746164); setUint32(length - pos - 4);

    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numOfChan; channel++) {
        let s = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(pos, s < 0 ? s * 0x8000 : s * 0x7FFF, true); pos += 2;
      }
    }
    return new Blob([buffer_out], { type: "audio/wav" });
  };

  async function audioBufferToMp4(buffer: AudioBuffer): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = 1280; canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0f172a'; // Slate 900
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#10b981'; // Emerald 500
      ctx.font = 'bold 50px Arial'; ctx.textAlign = 'center';
      ctx.fillText('Enhanced Voice - VidScribe AI', canvas.width / 2, canvas.height / 2);
    }
    const stream = canvas.captureStream(1);
    const audioCtx = new AudioContext();
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    const dest = audioCtx.createMediaStreamDestination();
    source.connect(dest);
    stream.addTrack(dest.stream.getAudioTracks()[0]);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks: BlobPart[] = [];
    return new Promise((resolve) => {
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/mp4' }));
      recorder.start(); source.start();
      setTimeout(() => { source.stop(); recorder.stop(); }, buffer.duration * 1000 + 100);
    });
  }

  const processEnhancement = async () => {
    if (!selectedFile) return;
    if (isLimitReached) {
      onUpgrade();
      return;
    }

    setIsProcessing(true);
    setStatus('Analyzing noise levels...');
    
    try {
      const base64 = await fileToBase64(selectedFile);
      setStatus('Removing background noise...');
      
      const enhancedBase64 = await enhanceAudio(base64, selectedFile.type, selectedTone.id);
      
      setStatus('Applying voice tone...');
      
      if (!audioContextRef.current) audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      const binaryString = atob(enhancedBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      
      const dataInt16 = new Int16Array(bytes.buffer);
      const buffer = audioContextRef.current.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
      
      setAudioBuffer(buffer);
      setStatus('Ready!');
      onUsageUpdate(0.2);
    } catch (err) {
      console.error(err);
      alert("Failed to process audio.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async (format: 'mp3' | 'mp4') => {
    if (!audioBuffer) return;
    setShowDownloadMenu(false);
    setIsExporting(true);

    try {
      let blob: Blob;
      let filename: string;
      if (format === 'mp3') {
        blob = audioBufferToWav(audioBuffer);
        filename = `Enhanced_Voice_${Date.now()}.mp3`;
      } else {
        blob = await audioBufferToMp4(audioBuffer);
        filename = `Enhanced_Voice_${Date.now()}.mp4`;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Export failed.");
    } finally {
      setIsExporting(false);
    }
  };

  const playAudio = () => {
    if (!audioBuffer || !audioContextRef.current) return;
    stopAudio();
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    source.start();
    sourceNodeRef.current = source;
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch(e) {}
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="text-center">
        <h2 className="text-3xl md:text-4xl font-black text-gray-900">AI <span className="text-blue-600">Voice Enhancer</span></h2>
        <p className="mt-2 text-gray-500 font-medium italic">Remove Noise & Transform Tone Instantly</p>
        
        {!isPro && (
          <div className={`mt-6 inline-flex items-center space-x-2 px-6 py-2.5 rounded-full text-sm font-bold border shadow-sm ${isLimitReached ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
            {isLimitReached ? <AlertCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
            <span>{isLimitReached ? "Limit Reached" : `Free Trial: ${minutesUsed.toFixed(1)} / ${limitMinutes} min used`}</span>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div 
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`p-10 border-4 border-dashed rounded-[40px] text-center cursor-pointer transition-all ${
              selectedFile ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'
            } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <input type="file" ref={fileInputRef} hidden accept="audio/*" onChange={handleFileSelect} />
            <div className="flex flex-col items-center">
              {selectedFile ? (
                <>
                  <Volume2 className="w-16 h-16 text-blue-600 mb-4" />
                  <p className="font-black text-blue-900 text-lg truncate max-w-xs font-mono">{selectedFile.name}</p>
                  <p className="text-xs text-blue-400 font-black uppercase mt-1 tracking-widest">Ready to Enhance</p>
                </>
              ) : (
                <>
                  <div className="p-5 bg-blue-100 rounded-full mb-4"><Mic className="w-10 h-10 text-blue-600" /></div>
                  <p className="text-xl font-black text-gray-800">Upload Your Audio</p>
                  <p className="text-sm text-gray-400 mt-2 font-medium">MP3, WAV, M4A up to 20MB</p>
                </>
              )}
            </div>
          </div>

          {isProcessing && (
            <div className="bg-white p-8 rounded-[32px] shadow-xl border border-gray-100 text-center space-y-4">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
              <p className="text-xl font-black text-gray-900">{status}</p>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 animate-pulse w-2/3 mx-auto"></div>
              </div>
            </div>
          )}

          {audioBuffer && !isProcessing && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 rounded-[40px] text-white shadow-xl flex items-center justify-between animate-in zoom-in duration-500">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-white/20 rounded-2xl"><CheckCircle2 className="w-8 h-8" /></div>
                <div>
                  <h3 className="text-xl font-black">Voice Enhanced!</h3>
                  <p className="text-sm opacity-80 font-medium">Noise removed & Tone applied.</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button onClick={playAudio} className="p-4 bg-white text-green-600 rounded-2xl hover:scale-110 transition-transform shadow-lg"><Play className="w-6 h-6 fill-current" /></button>
                
                <div className="relative" ref={menuRef}>
                  <button 
                    onClick={() => setShowDownloadMenu(!showDownloadMenu)} 
                    className={`p-4 bg-white/20 text-white rounded-2xl hover:bg-white/30 transition-all shadow-lg flex items-center space-x-1 ${isExporting ? 'animate-pulse' : ''}`}
                    disabled={isExporting}
                  >
                    {isExporting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
                    <ChevronDown className={`w-4 h-4 transition-transform ${showDownloadMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {showDownloadMenu && (
                    <div className="absolute bottom-full right-0 mb-4 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 animate-in slide-in-from-bottom-2 duration-200 z-30">
                      <button onClick={() => handleDownload('mp3')} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-emerald-50 text-left group">
                        <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors"><FileAudio className="w-4 h-4" /></div>
                        <div className="flex-1"><p className="font-bold text-gray-900 text-xs">Audio (MP3)</p><p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Crystal Clear</p></div>
                      </button>
                      <button onClick={() => handleDownload('mp4')} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-emerald-50 text-left group border-t border-gray-50">
                        <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors"><FileVideo className="w-4 h-4" /></div>
                        <div className="flex-1"><p className="font-bold text-gray-900 text-xs">Video (MP4)</p><p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">HD Studio Edit</p></div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[32px] shadow-xl border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center space-x-2">
              <Settings2 className="w-4 h-4 text-blue-600" />
              <span>Target Tone</span>
            </h3>
            <div className="space-y-3">
              {TONES.map((tone) => (
                <button
                  key={tone.id}
                  onClick={() => setSelectedTone(tone)}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                    selectedTone.id === tone.id ? 'border-blue-600 bg-blue-50' : 'border-gray-50 hover:border-blue-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{tone.icon}</span>
                    <div>
                      <p className={`font-black text-sm ${selectedTone.id === tone.id ? 'text-blue-700' : 'text-gray-700'}`}>{tone.name}</p>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">{tone.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={processEnhancement}
            disabled={!selectedFile || isProcessing || isLimitReached}
            className={`w-full py-5 rounded-[24px] font-black text-lg flex items-center justify-center space-x-2 shadow-xl transition-all active:scale-95 ${
              !selectedFile || isProcessing || isLimitReached
              ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isLimitReached ? <TrendingUp className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
            <span>{isLimitReached ? 'Upgrade Now' : 'Enhance Voice'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceEnhancer;
