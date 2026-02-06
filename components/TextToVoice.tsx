
import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, Download, AudioLines, Sparkles, MessageSquareText, Settings2, Info, Loader2, User, UserCheck, AlertCircle, TrendingUp } from 'lucide-react';
import { generateSpeech } from '../services/geminiService.ts';

// Helper for base64 decoding
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper for decoding raw PCM data from API
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// High-Compatibility WAV Generator
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const buffer_out = new ArrayBuffer(length);
  const view = new DataView(buffer_out);
  let pos = 0;

  const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4; };
  const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2; };

  setUint32(0x46464952);
  setUint32(length - 8);
  setUint32(0x45564157);
  setUint32(0x20746d66);
  setUint32(16);
  setUint16(1);
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);
  setUint32(0x61746164);
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numOfChan; channel++) {
      let s = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      view.setInt16(pos, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      pos += 2;
    }
  }
  return new Blob([buffer_out], { type: "audio/wav" });
}

const VOICES = [
  { id: 'Kore', name: 'Male (Professional)', icon: '🎙️', type: 'male', persona: 'professional' },
  { id: 'Puck', name: 'Female (Soft)', icon: '🎧', type: 'female', persona: 'soft' },
  { id: 'Charon', name: 'Young (Lively)', icon: '✨', type: 'child', persona: 'lively' },
  { id: 'Zephyr', name: 'Female (Mature)', icon: '👩', type: 'female', persona: 'mature' },
  { id: 'Fenrir', name: 'Elderly Male (Dadu)', icon: '👴', type: 'male', persona: 'elderly' },
  { id: 'Puck', name: 'Elderly Female (Dadi)', icon: '👵', type: 'female', persona: 'elderly' },
];

interface TextToVoiceProps {
  minutesUsed: number;
  limitMinutes: number;
  onUsageUpdate: (minutes: number) => void;
  onUpgrade: () => void;
  isPro: boolean;
}

const TextToVoice: React.FC<TextToVoiceProps> = ({ minutesUsed, limitMinutes, onUsageUpdate, onUpgrade, isPro }) => {
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0]);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const isLimitReached = !isPro && minutesUsed >= limitMinutes;

  useEffect(() => {
    let interval: number;
    if (isGenerating) {
      setGenProgress(0);
      interval = window.setInterval(() => {
        setGenProgress(p => p < 98 ? p + (Math.random() * 4) : p);
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleGenerate = async () => {
    if (!text) return;
    if (isLimitReached) {
      onUpgrade();
      return;
    }
    
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    setIsGenerating(true);
    stopAudio();

    try {
      let personaInstruction = `Say this in a natural Dhaka city accent. `;
      if (selectedVoice.persona === 'elderly') {
        personaInstruction += `Speak like an elderly person from Dhaka. `;
      }
      const promptText = `${personaInstruction} Text: ${text}`;
      const base64Audio = await generateSpeech(promptText, selectedVoice.id);
      const decoded = decode(base64Audio);
      const buffer = await decodeAudioData(decoded, audioContextRef.current, 24000, 1);
      
      setAudioBuffer(buffer);
      setGenProgress(100);

      // Track usage
      const durationInMinutes = buffer.duration / 60;
      onUsageUpdate(durationInMinutes);
      
      setTimeout(() => {
        setIsGenerating(false);
        playAudio(buffer);
      }, 400);
    } catch (err) {
      console.error(err);
      alert("Generation failed.");
      setIsGenerating(false);
    }
  };

  const playAudio = async (buffer: AudioBuffer) => {
    if (!audioContextRef.current) return;
    await audioContextRef.current.resume();
    stopAudio();
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.start();
    sourceNodeRef.current = source;
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch(e) {}
      sourceNodeRef.current = null;
    }
  };

  const downloadAudio = () => {
    if (!audioBuffer) return;
    const wavBlob = audioBufferToWav(audioBuffer);
    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VidScribe_Voice_${Date.now()}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="text-center">
        <h2 className="text-3xl md:text-4xl font-black text-gray-900">AI <span className="text-blue-600">Voice</span> Studio</h2>
        <p className="mt-2 text-gray-500 font-medium italic">Dhaka City Accent • Multi-Generation Voices</p>
        
        {!isPro && (
          <div className={`mt-6 inline-flex items-center space-x-2 px-6 py-2.5 rounded-full text-sm font-bold border shadow-sm ${isLimitReached ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
            {isLimitReached ? <AlertCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
            <span>{isLimitReached ? "Limit reached. Upgrade for more." : `Free Usage: ${minutesUsed.toFixed(1)} / ${limitMinutes} min`}</span>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-[32px] p-6 shadow-xl border border-gray-100 min-h-[400px] flex flex-col relative overflow-hidden">
            <textarea
              className="flex-1 w-full p-6 bg-gray-50 rounded-2xl border-none focus:ring-4 focus:ring-blue-500/5 outline-none text-xl text-gray-800 leading-relaxed resize-none font-medium"
              placeholder="এখানে আপনার টেক্সট লিখুন..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isGenerating || isLimitReached}
            />
            {isGenerating && (
              <div className="absolute inset-x-0 bottom-[100px] px-8 py-4 bg-white/95 border-t border-gray-50 z-10 text-center">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-blue-600 uppercase">AI Speaking...</span>
                  <span className="text-xs font-black text-blue-600">{Math.round(genProgress)}%</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${genProgress}%` }} />
                </div>
              </div>
            )}
            <div className="mt-6 flex items-center justify-between">
              <div className="flex space-x-2">
                {audioBuffer && (
                  <><button onClick={() => playAudio(audioBuffer)} className="p-3 bg-green-100 text-green-600 rounded-xl hover:bg-green-200"><Play className="w-5 h-5 fill-current" /></button>
                  <button onClick={stopAudio} className="p-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200"><Square className="w-5 h-5 fill-current" /></button>
                  <button onClick={downloadAudio} className="p-3 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200"><Download className="w-5 h-5" /></button></>
                )}
              </div>
              <button onClick={handleGenerate} disabled={!text || isGenerating} className={`px-10 py-4 rounded-xl font-black text-lg flex items-center space-x-2 shadow-xl ${!text || isGenerating || isLimitReached ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
                {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <>{isLimitReached ? <TrendingUp className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}<span>{isLimitReached ? 'Upgrade Now' : 'Speak AI'}</span></>}
              </button>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] shadow-xl border border-gray-100 h-fit">
          <h3 className="font-bold text-gray-800 mb-4">Voice Selection</h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {VOICES.map((v, idx) => (
              <button key={idx} onClick={() => setSelectedVoice(v)} className={`w-full p-3 rounded-xl border flex items-center space-x-3 transition-all ${selectedVoice.name === v.name ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-600'}`}>
                <span className="text-xl">{v.icon}</span>
                <div className="text-left"><p className="text-sm font-bold">{v.name}</p><p className="text-[10px] opacity-60 uppercase">{v.persona}</p></div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextToVoice;
