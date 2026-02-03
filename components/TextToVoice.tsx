
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

// High-Compatibility WAV Generator (Strict RIFF standard for mobile apps)
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const buffer_out = new ArrayBuffer(length);
  const view = new DataView(buffer_out);
  let pos = 0;

  const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4; };
  const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2; };

  setUint32(0x46464952);                         // "RIFF"
  setUint32(length - 8);                         // File size
  setUint32(0x45564157);                         // "WAVE"
  setUint32(0x20746d66);                         // "fmt " chunk
  setUint32(16);                                 // Length
  setUint16(1);                                  // PCM
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);
  setUint32(0x61746164);                         // "data" chunk
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
  { id: 'Puck', name: 'Female (Formal)', icon: '👔', type: 'female', persona: 'formal' },
  { id: 'Zephyr', name: 'Female (Expressive)', icon: '🗣️', type: 'female', persona: 'expressive' },
  { id: 'Fenrir', name: 'Elderly Male (Dadu)', icon: '👴', type: 'male', persona: 'elderly' },
  { id: 'Puck', name: 'Elderly Female (Dadi)', icon: '👵', type: 'female', persona: 'elderly' },
];

interface TextToVoiceProps {
  minutesUsed: number;
  limitMinutes: number;
  onUsageUpdate: (minutes: number) => void;
  onUpgrade: () => void;
}

const TextToVoice: React.FC<TextToVoiceProps> = ({ minutesUsed, limitMinutes, onUsageUpdate, onUpgrade }) => {
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0]);
  const [accent, setAccent] = useState('dhaka');
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const isLimitReached = minutesUsed >= limitMinutes;

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
      // Build specific persona instruction based on selected voice
      let personaInstruction = `Say this in a natural Dhaka city accent. `;
      if (selectedVoice.persona === 'elderly') {
        personaInstruction += `Speak like an elderly person (Dadu/Dadi) from Dhaka, slowly and with a wise, aged tone. `;
      } else if (selectedVoice.persona === 'formal') {
        personaInstruction += `Speak with a formal, sophisticated tone. `;
      } else if (selectedVoice.persona === 'expressive') {
        personaInstruction += `Speak with high energy and expressive emotion. `;
      }

      const promptText = `${personaInstruction} Text: ${text}`;
      const base64Audio = await generateSpeech(promptText, selectedVoice.id);
      
      const decoded = decode(base64Audio);
      const buffer = await decodeAudioData(decoded, audioContextRef.current, 24000, 1);
      
      setAudioBuffer(buffer);
      setGenProgress(100);

      // Track usage based on audio duration
      const durationInMinutes = buffer.duration / 60;
      onUsageUpdate(durationInMinutes);
      
      setTimeout(() => {
        setIsGenerating(false);
        playAudio(buffer);
      }, 400);
      
    } catch (err) {
      console.error(err);
      alert("Generation failed. Please try again.");
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
    a.download = `VidScribe_${selectedVoice.name.split(' ')[0]}_${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="text-center">
        <h2 className="text-3xl md:text-4xl font-black text-gray-900">AI <span className="text-blue-600">Voice</span> Studio</h2>
        <p className="mt-2 text-gray-500 font-medium italic">Dhaka City Accent • Multi-Generation Voices • Share Ready</p>
        
        <div className={`mt-6 inline-flex items-center space-x-2 px-6 py-2.5 rounded-full text-sm font-bold border shadow-sm animate-in slide-in-from-top-2 duration-300 ${isLimitReached ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
          {isLimitReached ? <AlertCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
          <span className="tracking-tight">
            {isLimitReached ? "20-minute limit reached. Please upgrade." : `Text to Voice Free Usage: ${Math.round(minutesUsed * 10) / 10} / ${limitMinutes} min`}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-[32px] p-6 shadow-xl border border-gray-100 flex flex-col h-full min-h-[450px] relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center space-x-2">
                <MessageSquareText className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-gray-700">Type your script</span>
              </div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full">
                {text.length} Characters
              </div>
            </div>
            
            <textarea
              className="flex-1 w-full p-6 bg-gray-50 rounded-2xl border-none focus:ring-4 focus:ring-blue-500/5 outline-none text-xl text-gray-800 leading-relaxed resize-none transition-all placeholder:text-gray-300 font-medium"
              placeholder="এখানে আপনার টেক্সট লিখুন... যেমন: আসসালামু আলাইকুম দাদু, কেমন আছেন?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isGenerating || isLimitReached}
            />

            {isGenerating && (
              <div className="absolute inset-x-0 bottom-[110px] px-8 py-6 bg-white/95 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300 z-10 text-center border-t border-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    <span className="text-xs font-black text-blue-600 uppercase tracking-widest">AI is speaking...</span>
                  </div>
                  <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{Math.round(genProgress)}%</span>
                </div>
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden border border-gray-50 p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-[length:200%_100%] animate-shimmer transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${genProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <div className="flex space-x-2">
                {audioBuffer && (
                  <>
                    <button 
                      onClick={() => playAudio(audioBuffer)}
                      className="p-4 bg-green-100 text-green-600 rounded-2xl hover:bg-green-200 transition-all active:scale-95 border border-green-200"
                    >
                      <Play className="w-5 h-5 fill-current" />
                    </button>
                    <button 
                      onClick={stopAudio}
                      className="p-4 bg-red-100 text-red-600 rounded-2xl hover:bg-red-200 transition-all active:scale-95 border border-red-200"
                    >
                      <Square className="w-5 h-5 fill-current" />
                    </button>
                    <button 
                      onClick={downloadAudio}
                      className="p-4 bg-blue-100 text-blue-600 rounded-2xl hover:bg-blue-200 transition-all active:scale-95 border border-blue-200"
                      title="Share to WhatsApp/Telegram"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={handleGenerate}
                disabled={!text || isGenerating}
                className={`px-12 py-5 rounded-2xl font-black text-lg flex items-center space-x-3 shadow-2xl transition-all active:scale-95 ${
                  !text || isGenerating || isLimitReached
                  ? "bg-gray-100 text-gray-300 cursor-not-allowed border border-gray-200" 
                  : "bg-blue-600 text-white hover:bg-blue-700 border-b-4 border-blue-800"
                }`}
              >
                {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <>
                    {isLimitReached ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <Sparkles className="w-5 h-5" />
                    )}
                    <span>{isLimitReached ? 'Upgrade Now' : 'Generate Voice'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[32px] shadow-xl border border-gray-100 space-y-6">
            <div className="flex items-center space-x-2">
              <Settings2 className="w-5 h-5 text-gray-400" />
              <h3 className="font-bold text-gray-800">Voice Selection</h3>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {VOICES.map((v, idx) => (
                <button
                  key={`${v.id}-${idx}`}
                  onClick={() => setSelectedVoice(v)}
                  className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all relative ${
                    selectedVoice.name === v.name ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-100 hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <div className="flex items-center space-x-3 text-left">
                    <span className="text-2xl">{v.icon}</span>
                    <div>
                      <p className="text-sm font-black leading-none">{v.name}</p>
                      <p className="text-[10px] opacity-60 font-bold uppercase tracking-tighter mt-1">{v.type} • {v.persona}</p>
                    </div>
                  </div>
                  {selectedVoice.name === v.name && <UserCheck className="w-4 h-4 text-blue-600" />}
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-50 flex items-start space-x-2 text-blue-600">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold uppercase leading-tight">These voices are optimized for WhatsApp/Messenger sharing. Use 'Elderly' for a traditional Dhaka tone.</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-900 to-black p-6 rounded-[32px] shadow-2xl text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <AudioLines className="w-32 h-32" />
            </div>
            <h3 className="text-xl font-black mb-1">Lifetime Pro</h3>
            <p className="text-xs text-gray-400 mb-6 font-medium">All voices unlocked with HD sharing support.</p>
            <div className="px-4 py-2 bg-blue-500 rounded-xl text-center text-[10px] font-black uppercase tracking-widest">Active Subscription</div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default TextToVoice;
