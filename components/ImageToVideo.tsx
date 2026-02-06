
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
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { analyzeAudioForVideoPrompt, startVideoGeneration, pollVideoOperation } from '../services/geminiService.ts';

interface ImageToVideoProps {
  minutesUsed: number;
  limitMinutes: number;
  onUsageUpdate: (minutes: number) => void;
  onUpgrade: () => void;
  isPro: boolean;
}

const ImageToVideo: React.FC<ImageToVideoProps> = ({ minutesUsed, limitMinutes, onUsageUpdate, onUpgrade, isPro }) => {
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

  const isLimitReached = !isPro && minutesUsed >= limitMinutes;

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
    if (isLimitReached) {
      onUpgrade();
      return;
    }
    
    setIsGenerating(true);
    setVideoUrl(null);
    setErrorMessage(null);
    
    try {
      setStatus('Analyzing mood...');
      const audioBase64 = await fileToBase64(audioFile);
      const motionPrompt = await analyzeAudioForVideoPrompt(audioBase64, audioFile.type);
      
      setStatus('Starting Veo 3.1...');
      const imageBase64 = await fileToBase64(imageFile);
      let operation = await startVideoGeneration(motionPrompt, imageBase64, imageFile.type, aspectRatio);
      
      setStatus('Rendering cinematic video...');
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await pollVideoOperation(operation);
      }

      if (operation.response?.generatedVideos?.[0]?.video?.uri) {
        const downloadLink = operation.response.generatedVideos[0].video.uri;
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await response.blob();
        setVideoUrl(URL.createObjectURL(blob));
        setStatus('Ready!');
        
        // Image-to-video typically generates 3-5 seconds, let's count it as 0.2 mins
        onUsageUpdate(0.2);
      } else {
        throw new Error('No video URI');
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('403')) setNeedsApiKey(true);
      setErrorMessage("Failed to generate video.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="text-center">
        <h2 className="text-3xl md:text-4xl font-black text-gray-900">AI <span className="text-indigo-600">Cinematic</span> Studio</h2>
        <p className="mt-2 text-gray-500 font-medium italic">High-Motion Video Generation</p>
        
        {!isPro && (
          <div className={`mt-6 inline-flex items-center space-x-2 px-6 py-2.5 rounded-full text-sm font-bold border shadow-sm ${isLimitReached ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
            {isLimitReached ? <AlertCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
            <span>{isLimitReached ? "Trial Limit Reached" : `Free Usage: ${minutesUsed.toFixed(1)} / ${limitMinutes} min`}</span>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[32px] p-8 shadow-xl border border-gray-100 min-h-[400px] flex flex-col relative overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              <div onClick={() => imageInputRef.current?.click()} className={`relative border-2 border-dashed rounded-xl cursor-pointer overflow-hidden ${imagePreview ? 'border-indigo-500' : 'border-gray-200 bg-gray-50'}`}>
                <input type="file" ref={imageInputRef} hidden accept="image/*" onChange={handleImageSelect} />
                {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" /> : <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center"><ImageIcon className="w-8 h-8 text-gray-300 mb-2" /><p className="text-xs font-bold text-gray-500">Add Image</p></div>}
              </div>
              <div onClick={() => audioInputRef.current?.click()} className={`relative border-2 border-dashed rounded-xl cursor-pointer ${audioFile ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                <input type="file" ref={audioInputRef} hidden accept="audio/*" onChange={handleAudioSelect} />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center"><Music className={`w-8 h-8 mb-2 ${audioFile ? 'text-green-500' : 'text-gray-300'}`} /><p className="text-xs font-bold text-gray-700 truncate w-full px-2">{audioFile ? audioFile.name : 'Add Audio'}</p></div>
              </div>
            </div>

            {isGenerating && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-20 flex flex-col items-center justify-center p-10 text-center animate-in fade-in duration-500">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                <h3 className="text-xl font-black text-gray-900">{status}</h3>
                <p className="text-gray-500 text-sm mt-2">Veo is creating your cinematic masterpiece...</p>
              </div>
            )}

            {videoUrl && (
              <div className="absolute inset-0 bg-black z-30">
                <video src={videoUrl} controls autoPlay loop className="w-full h-full object-contain" />
                <div className="absolute top-4 right-4 flex space-x-2"><button onClick={() => setVideoUrl(null)} className="px-3 py-1.5 bg-white/20 text-white rounded-lg text-xs font-bold">New</button></div>
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <button onClick={handleGenerate} disabled={!imageFile || !audioFile || isGenerating || needsApiKey || isLimitReached} className={`px-10 py-4 rounded-xl font-black text-lg flex items-center space-x-2 shadow-xl transition-all ${!imageFile || !audioFile || isGenerating || needsApiKey || isLimitReached ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{isLimitReached ? <TrendingUp className="w-5 h-5" /> : <FileVideo className="w-5 h-5" />}<span>{isLimitReached ? 'Upgrade Plan' : 'Generate Video'}</span></>}
              </button>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] shadow-xl border border-gray-100 space-y-6">
           <h3 className="font-bold text-gray-800">Format</h3>
           <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setAspectRatio('16:9')} className={`p-3 rounded-xl border flex flex-col items-center ${aspectRatio === '16:9' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-50 text-gray-400'}`}><Monitor className="w-5 h-5 mb-1" /><span className="text-[10px] font-bold">16:9</span></button>
              <button onClick={() => setAspectRatio('9:16')} className={`p-3 rounded-xl border flex flex-col items-center ${aspectRatio === '9:16' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-50 text-gray-400'}`}><Smartphone className="w-5 h-5 mb-1" /><span className="text-[10px] font-bold">9:16</span></button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ImageToVideo;
