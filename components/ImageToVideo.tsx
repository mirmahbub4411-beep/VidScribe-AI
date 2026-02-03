
import React, { useState, useRef, useEffect } from 'react';
import { 
  FileVideo, 
  Image as ImageIcon, 
  Music, 
  Sparkles, 
  Loader2, 
  Download, 
  Play, 
  AlertCircle, 
  CheckCircle2, 
  Settings2,
  Monitor,
  Smartphone,
  Info,
  Zap,
  CreditCard,
  AlertTriangle
} from 'lucide-react';
import { analyzeAudioForVideoPrompt, startVideoGeneration, pollVideoOperation } from '../services/geminiService.ts';

const ImageToVideo: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [needsApiKey, setNeedsApiKey] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setNeedsApiKey(!hasKey);
    }
  };

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setNeedsApiKey(false);
      setErrorMessage(null);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      setErrorMessage(null);
    }
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setErrorMessage(null);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const handleGenerate = async () => {
    if (!imageFile || !audioFile) return;
    
    setIsGenerating(true);
    setVideoUrl(null);
    setErrorMessage(null);
    
    try {
      setStatus('Analyzing audio mood...');
      const audioBase64 = await fileToBase64(audioFile);
      const motionPrompt = await analyzeAudioForVideoPrompt(audioBase64, audioFile.type);
      
      setStatus('Starting video generation...');
      const imageBase64 = await fileToBase64(imageFile);
      let operation = await startVideoGeneration(motionPrompt, imageBase64, imageFile.type, aspectRatio);
      
      setStatus('AI is creating your video (1-3 mins)...');
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await pollVideoOperation(operation);
        const messages = [
          'Rendering cinematic frames...',
          'Simulating fluid motion...',
          'Matching visuals to audio rhythm...',
          'Polishing textures...',
          'Almost ready...'
        ];
        setStatus(messages[Math.floor(Math.random() * messages.length)]);
      }

      if (operation.response?.generatedVideos?.[0]?.video?.uri) {
        const downloadLink = operation.response.generatedVideos[0].video.uri;
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await response.blob();
        setVideoUrl(URL.createObjectURL(blob));
        setStatus('Generation complete!');
      } else {
        throw new Error('No video URI returned');
      }
    } catch (err: any) {
      console.error("Video Generation Error:", err);
      const msg = err.message?.toLowerCase() || "";
      
      if (msg.includes('permission denied') || msg.includes('403') || msg.includes('requested entity was not found')) {
        setErrorMessage("Permission Denied: Video generation requires a Paid API Key from a Google Cloud project with billing enabled.");
        setNeedsApiKey(true);
      } else {
        setErrorMessage("Failed to generate video. Please try again or check your internet connection.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="text-center">
        <h2 className="text-3xl md:text-4xl font-black text-gray-900">AI <span className="text-indigo-600">Cinematic</span> Studio</h2>
        <p className="mt-2 text-gray-500 font-medium italic">Image + Audio → High-Motion Video</p>
      </header>

      {(needsApiKey || errorMessage) && (
        <div className={`p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500 border-2 ${errorMessage?.includes('Permission') ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-2xl ${errorMessage?.includes('Permission') ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className={`font-black ${errorMessage?.includes('Permission') ? 'text-red-800' : 'text-amber-800'}`}>
                {errorMessage || "API Key Required for Veo 3.1"}
              </p>
              <p className="text-sm font-medium text-gray-600">পেইড গুগল ক্লাউড প্রজেক্টের API Key ছাড়া ভিডিও জেনারেশন সম্ভব নয়।</p>
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-xs font-bold underline hover:opacity-80">Check Billing Documentation</a>
            </div>
          </div>
          <button 
            onClick={handleOpenKeySelector}
            className="px-6 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition-all shadow-lg active:scale-95 flex items-center space-x-2 whitespace-nowrap"
          >
            <CreditCard className="w-4 h-4" />
            <span>Select Paid API Key</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[32px] p-8 shadow-xl border border-gray-100 min-h-[500px] flex flex-col relative overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
              <div 
                onClick={() => imageInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl overflow-hidden cursor-pointer transition-all ${imagePreview ? 'border-indigo-500' : 'border-gray-200 hover:border-indigo-300 bg-gray-50'}`}
              >
                <input type="file" ref={imageInputRef} hidden accept="image/*" onChange={handleImageSelect} />
                {imagePreview ? (
                  <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <ImageIcon className="w-10 h-10 text-gray-400 mb-3" />
                    <p className="text-sm font-bold text-gray-600">Upload Starting Image</p>
                    <p className="text-[10px] text-gray-400 uppercase mt-1">Character or Background</p>
                  </div>
                )}
              </div>

              <div 
                onClick={() => audioInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl overflow-hidden cursor-pointer transition-all ${audioFile ? 'border-green-500 bg-green-50/30' : 'border-gray-200 hover:border-green-300 bg-gray-50'}`}
              >
                <input type="file" ref={audioInputRef} hidden accept="audio/*" onChange={handleAudioSelect} />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <div className={`p-4 rounded-full mb-3 ${audioFile ? 'bg-green-100 text-green-600' : 'bg-white text-gray-400 shadow-sm'}`}>
                    <Music className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-bold text-gray-700 truncate max-w-[150px]">{audioFile ? audioFile.name : 'Upload Mood Audio'}</p>
                  <p className="text-[10px] text-gray-400 uppercase mt-1">Music or Voiceover</p>
                </div>
              </div>
            </div>

            {isGenerating && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-20 flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-500">
                <div className="relative mb-8">
                  <div className="w-24 h-24 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                  <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-indigo-600 animate-pulse" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">{status}</h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto italic">পেইড মডেল হওয়ায় ভিডিও জেনারেট হতে ১-৩ মিনিট সময় নিতে পারে।</p>
                <div className="w-64 bg-gray-100 h-1.5 rounded-full mt-8 overflow-hidden">
                  <div className="h-full bg-indigo-600 animate-progress-loading"></div>
                </div>
              </div>
            )}

            {videoUrl && (
              <div className="absolute inset-0 bg-black z-30 animate-in zoom-in duration-500">
                <video src={videoUrl} controls autoPlay loop className="w-full h-full object-contain" />
                <div className="absolute top-4 right-4 flex space-x-2">
                  <button onClick={() => setVideoUrl(null)} className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-lg text-xs font-bold transition-all">New Video</button>
                  <a href={videoUrl} download="VidScribe_AI_Video.mp4" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-lg flex items-center space-x-2">
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between">
              <div className="flex items-center space-x-3 text-indigo-600">
                <Info className="w-5 h-5" />
                <p className="text-xs font-bold uppercase">Veo 3.1 analyzes your audio to match the video motion.</p>
              </div>

              <button
                onClick={handleGenerate}
                disabled={!imageFile || !audioFile || isGenerating || needsApiKey}
                className={`px-12 py-5 rounded-2xl font-black text-lg flex items-center space-x-3 shadow-2xl transition-all active:scale-95 ${
                  !imageFile || !audioFile || isGenerating || needsApiKey
                  ? "bg-gray-100 text-gray-300 cursor-not-allowed border border-gray-200" 
                  : "bg-indigo-600 text-white hover:bg-indigo-700 border-b-4 border-indigo-800"
                }`}
              >
                {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <>
                    <FileVideo className="w-5 h-5" />
                    <span>Convert to Video</span>
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
              <h3 className="font-bold text-gray-800">Video Quality</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-3">Aspect Ratio</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setAspectRatio('16:9')}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center space-y-2 transition-all ${aspectRatio === '16:9' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-50 hover:border-gray-200 text-gray-400'}`}
                  >
                    <Monitor className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase">16:9 HD</span>
                  </button>
                  <button 
                    onClick={() => setAspectRatio('9:16')}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center space-y-2 transition-all ${aspectRatio === '9:16' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-50 hover:border-gray-200 text-gray-400'}`}
                  >
                    <Smartphone className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase">9:16 Reels</span>
                  </button>
                </div>
              </div>

              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <div className="flex items-center space-x-2 text-indigo-700 mb-1">
                  <Zap className="w-4 h-4" />
                  <span className="text-xs font-black uppercase">Cinematic Veo</span>
                </div>
                <p className="text-[10px] text-indigo-600 font-medium leading-tight">High-fidelity 720p motion simulation. Perfect for cinematic storytelling.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes progress-loading {
          0% { width: 0%; }
          50% { width: 60%; }
          100% { width: 95%; }
        }
        .animate-progress-loading {
          animation: progress-loading 180s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ImageToVideo;
