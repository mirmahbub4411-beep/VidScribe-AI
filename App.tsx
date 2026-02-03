
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Settings as SettingsIcon, 
  Check, 
  Zap, 
  BarChart3, 
  Mic2, 
  EarOff, 
  Clock, 
  MessageSquare, 
  ShieldCheck,
  UserPlus,
  LogIn,
  LogOut,
  User as UserIcon,
  LayoutDashboard,
  Sparkles,
  ChevronDown,
  AudioLines,
  FileVideo,
  Info,
  AlertCircle,
  TrendingUp,
  CreditCard,
  MessageSquareText
} from 'lucide-react';
import FileUpload from './components/FileUpload.tsx';
import TranscriptionResultView from './components/TranscriptionResult.tsx';
import AuthModals from './components/AuthModals.tsx';
import UserProfile from './components/UserProfile.tsx';
import Dashboard from './components/Dashboard.tsx';
import Pricing from './components/Pricing.tsx';
import PaymentModal from './components/PaymentModal.tsx';
import TextToVoice from './components/TextToVoice.tsx';
import { AppSettings, ProcessingStatus, TranscriptionResult, User, HistoryItem, ActiveTool, AppView, Package } from './types.ts';
import { transcribeVideo } from './services/geminiService.ts';

const AUDIO_LIMIT_MINUTES = 15;

const PACKAGES: Package[] = [
  { id: '15d', name: 'Starter Pro', duration: '15 Days', bdt: 250, usd: 2 },
  { id: '30d', name: 'Standard Pro', duration: '30 Days', bdt: 399, usd: 3.27, popular: true },
  { id: '6m', name: 'Elite Pro', duration: '6 Month', bdt: 2000, usd: 16 },
  { id: '1y', name: 'Ultimate Pro', duration: '1 Year', bdt: 3999, usd: 32 }
];

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('transcribe');
  const [activeTool, setActiveTool] = useState<ActiveTool>('video');
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeModal, setActiveModal] = useState<'signin' | 'signup' | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isOtherAppsOpen, setIsOtherAppsOpen] = useState(false);
  const [audioMinutesUsed, setAudioMinutesUsed] = useState(0);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [settings, setSettings] = useState<AppSettings>({
    showTimestamps: true,
    generateSummary: true,
    speakerDetection: true,
    removeFillers: true
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOtherAppsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSetting = (key: keyof AppSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setResult(null);
    setStatus('idle');
  };

  const isAudioLimitReached = useMemo(() => {
    return activeTool === 'audio' && audioMinutesUsed >= AUDIO_LIMIT_MINUTES;
  }, [activeTool, audioMinutesUsed]);

  const startProcessing = async () => {
    if (!selectedFile) return;

    if (isAudioLimitReached) {
      setView('pricing');
      return;
    }

    setStatus('uploading');
    setProgress(20);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        setStatus('extracting');
        setProgress(40);
        
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

              const newHistoryItem: HistoryItem = {
                id: Math.random().toString(36).substr(2, 9),
                fileName: selectedFile.name,
                date: new Date().toLocaleString(),
                tool: activeTool,
                result: transcriptionResult
              };
              setHistory(prev => [newHistoryItem, ...prev]);

              if (activeTool === 'audio') {
                const estimatedMinutes = Math.floor(Math.random() * 3) + 1;
                setAudioMinutesUsed(prev => Math.min(prev + estimatedMinutes, AUDIO_LIMIT_MINUTES));
              }
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

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveModal(null);
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setResult(item.result);
    setActiveTool(item.tool);
    setSelectedFile(null);
    setView('transcribe');
    setStatus('success');
  };

  const handleSubscribe = (pkg: Package) => {
    setSelectedPkg(pkg);
    setIsPaymentModalOpen(true);
  };

  const renderContent = () => {
    if (view === 'profile' && currentUser) {
      return <UserProfile user={currentUser} onBack={() => setView('transcribe')} />;
    }

    if (view === 'dashboard') {
      return <Dashboard history={history} onBack={() => setView('transcribe')} onSelectItem={handleSelectHistoryItem} />;
    }

    if (view === 'pricing') {
      return <Pricing onSubscribe={handleSubscribe} packages={PACKAGES} />;
    }

    if (activeTool === 'tts') {
      return <TextToVoice />;
    }

    return (
      <>
        <header className="text-center mb-12 animate-in fade-in duration-700">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Convert {activeTool === 'video' ? 'Video' : 'Audio'} to Text <span className="text-blue-600">Instantly</span>
          </h1>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto font-medium">
            High-accuracy AI transcription for your {activeTool} files. 
            {activeTool === 'video' ? (
              <> Now <span className="text-green-600 font-bold">100% Free</span> for everyone with unlimited usage.</>
            ) : (
              <> Free <span className="text-blue-600 font-bold">{AUDIO_LIMIT_MINUTES}-minute</span> total limit for audio conversions.</>
            )}
          </p>
          
          {activeTool === 'audio' && (
            <div className={`mt-6 inline-flex items-center space-x-2 px-6 py-2.5 rounded-full text-sm font-bold border shadow-sm animate-in slide-in-from-top-2 duration-300 ${isAudioLimitReached ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
              {isAudioLimitReached ? <AlertCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
              <span>{isAudioLimitReached ? "Limit reached. Please upgrade your plan." : `Usage: ${audioMinutesUsed} / ${AUDIO_LIMIT_MINUTES} minutes used`}</span>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <FileUpload 
              onFileSelect={handleFileSelect} 
              isProcessing={status !== 'idle' && status !== 'success' && status !== 'error'} 
              acceptType={activeTool as 'video' | 'audio'}
            />
            
            {(status !== 'idle' && !result) && (
              <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
                    {status === 'uploading' && "Loading File Data..."}
                    {status === 'extracting' && "Analyzing Audio stream..."}
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
              </div>
            )}

            {result && (
              <TranscriptionResultView result={result} settings={settings} />
            )}

            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center space-x-3">
                <EarOff className="w-5 h-5 text-red-500" />
                <p className="font-bold">Transcription Failed. Please try again.</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
              <div className="flex items-center space-x-2 mb-6">
                <SettingsIcon className="w-5 h-5 text-gray-400" />
                <h3 className="font-bold text-gray-800">Transcription Settings</h3>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'showTimestamps', label: 'Timestamps', icon: Clock },
                  { key: 'speakerDetection', label: 'Speaker Detection', icon: MessageSquare },
                  { key: 'removeFillers', label: 'Remove Fillers', icon: Mic2 },
                  { key: 'generateSummary', label: 'Auto Summary', icon: Sparkles }
                ].map((item) => (
                  <label key={item.key} className="flex items-center justify-between cursor-pointer p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-4 h-4 text-gray-400" />
                      <p className="text-sm font-semibold text-gray-700">{item.label}</p>
                    </div>
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                      checked={settings[item.key as keyof AppSettings]}
                      onChange={() => toggleSetting(item.key as keyof AppSettings)}
                    />
                  </label>
                ))}
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
                <span>{status === 'success' ? 'Transcribe New' : 'Start Transcription'}</span>
              </button>
            </div>

            <div className="bg-[#1a202c] p-6 rounded-[24px] shadow-2xl text-white border border-gray-800 transition-all duration-500">
              <div className="flex items-center space-x-2 mb-6">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <h3 className="text-xl font-bold tracking-tight">Account Stats</h3>
              </div>
              
              <div className="space-y-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 italic text-base">Current Plan</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${activeTool === 'video' ? 'bg-green-500' : (isAudioLimitReached ? 'bg-red-500' : 'bg-blue-500')}`}></div>
                    <span className={`font-bold text-lg ${activeTool === 'video' ? 'text-blue-400' : (isAudioLimitReached ? 'text-red-400' : 'text-blue-400')}`}>
                      {activeTool === 'video' ? 'Unlimited Pro' : (isAudioLimitReached ? 'Limit Exceeded' : 'Free Plan')}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(59,130,246,0.5)] ${activeTool === 'video' ? 'w-full bg-gradient-to-r from-blue-500 to-indigo-500' : (isAudioLimitReached ? 'w-full bg-red-500' : 'bg-blue-500')}`}
                    style={{ width: activeTool === 'video' ? '100%' : `${(audioMinutesUsed / AUDIO_LIMIT_MINUTES) * 100}%` }}
                  ></div>
                </div>

                {activeTool === 'audio' && (
                  <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest -mt-4">
                    <span>{audioMinutesUsed}m used</span>
                    <span>{AUDIO_LIMIT_MINUTES}m limit</span>
                  </div>
                )}

                <div 
                  onClick={() => isAudioLimitReached && setView('pricing')}
                  className={`flex items-center justify-center space-x-2 w-full mt-4 py-3 text-sm font-bold border rounded-2xl transition-all ${
                  activeTool === 'video' 
                  ? "border-green-500/30 text-green-400 bg-green-500/5" 
                  : (isAudioLimitReached ? "border-red-500/50 text-red-400 bg-red-500/10 cursor-pointer hover:bg-red-500/20" : "border-blue-500/30 text-blue-400 bg-blue-500/5")
                }`}>
                  {activeTool === 'video' ? (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Pro Activated • Lifetime Access</span>
                    </>
                  ) : (
                    <>
                      {isAudioLimitReached ? (
                        <>
                          <TrendingUp className="w-4 h-4" />
                          <span>Upgrade Now to Continue</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4" />
                          <span>{AUDIO_LIMIT_MINUTES - audioMinutesUsed} Minutes Remaining</span>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div 
          className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => { setView('transcribe'); setActiveTool('video'); setResult(null); setSelectedFile(null); setStatus('idle'); }}
        >
          <div className="bg-blue-600 p-2 rounded-lg shadow-md">
            <Zap className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            VidScribe AI
          </span>
        </div>
        
        <div className="flex items-center space-x-4 md:space-x-8">
          <div className="hidden lg:flex items-center space-x-6 text-sm font-medium text-gray-600">
            {currentUser && (
              <button 
                onClick={() => setView('dashboard')}
                className={`flex items-center space-x-1 font-bold transition-colors ${view === 'dashboard' ? 'text-blue-600' : 'hover:text-blue-600'}`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
            )}

            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsOtherAppsOpen(!isOtherAppsOpen)}
                className={`flex items-center space-x-1 font-bold transition-colors hover:text-blue-600 ${isOtherAppsOpen ? 'text-blue-600' : ''}`}
              >
                <span>Other Apps</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOtherAppsOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isOtherAppsOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-[60]">
                  <button 
                    onClick={() => { setActiveTool('video'); setView('transcribe'); setIsOtherAppsOpen(false); setResult(null); setSelectedFile(null); setStatus('idle'); }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 text-left transition-colors group ${activeTool === 'video' ? 'bg-blue-50' : ''}`}
                  >
                    <div className={`p-2 rounded-lg transition-colors ${activeTool === 'video' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
                      <FileVideo className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Video to Text</p>
                      <p className="text-[10px] text-gray-400 tracking-tight">Switch to Video Transcriber</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => { setActiveTool('audio'); setView('transcribe'); setIsOtherAppsOpen(false); setResult(null); setSelectedFile(null); setStatus('idle'); }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 text-left transition-colors group ${activeTool === 'audio' ? 'bg-blue-50' : ''}`}
                  >
                    <div className={`p-2 rounded-lg transition-colors ${activeTool === 'audio' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
                      <AudioLines className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Audio to Text</p>
                      <p className="text-[10px] text-gray-400 tracking-tight">Transcribe MP3, WAV, M4A</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => { setActiveTool('tts'); setView('tts'); setIsOtherAppsOpen(false); }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 text-left transition-colors group ${activeTool === 'tts' ? 'bg-blue-50' : ''}`}
                  >
                    <div className={`p-2 rounded-lg transition-colors ${activeTool === 'tts' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
                      <MessageSquareText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Text to Voice</p>
                      <p className="text-[10px] text-gray-400 tracking-tight">Dhaka City Accent Voice</p>
                    </div>
                  </button>

                  <div className="px-4 py-2 mt-1 border-t border-gray-50">
                    <div className={`px-2 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-center ${isAudioLimitReached ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                      {isAudioLimitReached ? 'Limit Reached' : `${AUDIO_LIMIT_MINUTES} Min Free Limit`}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => setView('pricing')}
              className={`flex items-center space-x-1 font-bold transition-colors ${view === 'pricing' ? 'text-blue-600' : 'hover:text-blue-600'}`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Features</span>
            </button>
          </div>
          
          <div className="h-6 w-px bg-gray-200 hidden md:block"></div>
          
          <div className="flex items-center space-x-2 md:space-x-3">
            {currentUser ? (
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-bold text-gray-900">{currentUser.name}</span>
                  <span className="text-[10px] text-green-600 font-bold uppercase tracking-tighter">Pro Member</span>
                </div>
                <button 
                  onClick={() => setView('profile')}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border-2 shadow-sm ring-1 ring-blue-100 overflow-hidden ${view === 'profile' ? 'border-blue-500 bg-blue-50 text-blue-600 ring-blue-500' : 'bg-blue-100 text-blue-600 border-white hover:border-blue-300'}`}
                  title="View Profile"
                >
                  <UserIcon className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => { setCurrentUser(null); setView('transcribe'); setActiveTool('video'); }}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Log Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <button 
                  onClick={() => setActiveModal('signin')}
                  className="flex items-center space-x-1 px-3 py-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
                <button 
                  onClick={() => setActiveModal('signup')}
                  className="flex items-center space-x-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all shadow-md active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="font-semibold text-sm">Sign Up</span>
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {currentUser && view === 'transcribe' && (
          <div className="mb-8 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-full text-green-600 shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-green-900">Welcome back, {currentUser.name.split(' ')[0]}!</p>
                <p className="text-xs text-green-700">Unlimited Pro features are active for your account.</p>
              </div>
            </div>
            <button 
              onClick={() => setView('profile')}
              className="text-xs font-bold text-green-600 hover:underline px-3 py-1 bg-white/50 rounded-lg border border-green-100"
            >
              View Profile
            </button>
          </div>
        )}

        {renderContent()}
      </main>

      <footer className="bg-white border-t border-gray-100 py-8 px-4 mt-20">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-sm text-gray-400">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-gray-600">VidScribe AI © 2024</span>
          </div>
          <div className="flex space-x-8">
            <button onClick={() => setView('pricing')} className="hover:text-blue-600 transition-colors">Pricing</button>
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
          </div>
          <div className="text-[10px] text-gray-300">
            Powered by Gemini 3 Flash • Secure Payments
          </div>
        </div>
      </footer>

      <AuthModals 
        type={activeModal} 
        onClose={() => setActiveModal(null)} 
        onSuccess={handleAuthSuccess} 
      />

      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        selectedPackage={selectedPkg}
        packages={PACKAGES}
      />
    </div>
  );
};

export default App;
