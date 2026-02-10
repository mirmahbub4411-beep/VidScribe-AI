
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Settings as SettingsIcon, 
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
  MessageSquareText,
  Menu,
  X,
  Clapperboard,
  Waves,
  GraduationCap,
  Gamepad2,
  ArrowRight,
  Lightbulb,
  Cpu,
  MonitorPlay,
  FileJson,
  Languages,
  MousePointerClick,
  Rocket
} from 'lucide-react';
import FileUpload from './components/FileUpload.tsx';
import TranscriptionResultView from './components/TranscriptionResult.tsx';
import AuthModals from './components/AuthModals.tsx';
import UserProfile from './components/UserProfile.tsx';
import Dashboard from './components/Dashboard.tsx';
import Pricing from './components/Pricing.tsx';
import PaymentModal from './components/PaymentModal.tsx';
import TextToVoice from './components/TextToVoice.tsx';
import VoiceEnhancer from './components/VoiceEnhancer.tsx';
import EducationAnswer from './components/EducationAnswer.tsx';
import EduGame from './components/EduGame.tsx';
import { AppSettings, ProcessingStatus, TranscriptionResult, User, HistoryItem, ActiveTool, AppView, Package } from './types.ts';
import { transcribeVideo } from './services/geminiService.ts';

const GLOBAL_FREE_LIMIT = 1.0; // 1 Minute limit for everything

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Usage tracking state
  const [usage, setUsage] = useState({
    video: 0,
    audio: 0,
    tts: 0,
    enhancer: 0,
    education: 0,
    game: 0
  });

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

  useEffect(() => {
    setIsMobileMenuOpen(false);
    window.scrollTo(0, 0);
  }, [view, activeTool]);

  const toggleSetting = (key: keyof AppSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setResult(null);
    setStatus('idle');
  };

  const currentUsage = useMemo(() => {
    if (activeTool === 'video') return usage.video;
    if (activeTool === 'audio') return usage.audio;
    if (activeTool === 'tts') return usage.tts;
    if (activeTool === 'enhancer') return usage.enhancer;
    if (activeTool === 'education') return usage.education;
    if (activeTool === 'game') return usage.game;
    return 0;
  }, [activeTool, usage]);

  const isLimitReached = useMemo(() => {
    if (currentUser) return false;
    return currentUsage >= GLOBAL_FREE_LIMIT;
  }, [currentUser, currentUsage]);

  const startProcessing = async () => {
    if (!selectedFile) return;
    if (isLimitReached) {
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
            const transcriptionResult = await transcribeVideo(base64Data, selectedFile.type, settings);
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

              setUsage(prev => ({
                ...prev,
                [activeTool]: Math.min(prev[activeTool as keyof typeof prev] + 0.5, GLOBAL_FREE_LIMIT)
              }));
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

  const handleLogout = () => {
    setCurrentUser(null);
    if (view === 'dashboard' || view === 'profile') {
      setView('transcribe');
      setActiveTool('video');
    }
    setIsMobileMenuOpen(false);
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

  const handleUsageUpdate = (minutes: number) => {
    if (currentUser) return;
    setUsage(prev => ({ ...prev, [activeTool]: Math.min(prev[activeTool as keyof typeof prev] + minutes, GLOBAL_FREE_LIMIT) }));
  };

  const renderContent = () => {
    if (view === 'profile' && currentUser) {
      return <UserProfile user={currentUser} onBack={() => setView('transcribe')} />;
    }

    if (view === 'dashboard') {
      if (!currentUser) {
        return (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
             <div className="p-6 bg-blue-50 rounded-full text-blue-600 mb-2"><LogIn className="w-12 h-12" /></div>
             <h2 className="text-2xl font-black text-gray-900">Sign in to view Dashboard</h2>
             <p className="text-gray-500 max-w-xs">You need to be logged in to access history and stats.</p>
             <button onClick={() => setActiveModal('signin')} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg">Sign In Now</button>
          </div>
        );
      }
      return <Dashboard history={history} onBack={() => setView('transcribe')} onSelectItem={handleSelectHistoryItem} />;
    }

    if (view === 'pricing') {
      return <Pricing onSubscribe={handleSubscribe} packages={PACKAGES} />;
    }

    if (view === 'game' || activeTool === 'game') {
      return <EduGame onBackToTools={() => { setView('transcribe'); setActiveTool('video'); }} />;
    }

    if (activeTool === 'tts') {
      return (
        <TextToVoice 
          minutesUsed={usage.tts} 
          limitMinutes={GLOBAL_FREE_LIMIT} 
          onUsageUpdate={(m) => handleUsageUpdate(m)}
          onUpgrade={() => setView('pricing')}
          isPro={!!currentUser}
        />
      );
    }

    if (activeTool === 'enhancer') {
      return (
        <VoiceEnhancer 
          minutesUsed={usage.enhancer}
          limitMinutes={GLOBAL_FREE_LIMIT}
          onUsageUpdate={(m) => handleUsageUpdate(m)}
          onUpgrade={() => setView('pricing')}
          isPro={!!currentUser}
        />
      );
    }

    if (activeTool === 'education') {
      return (
        <EducationAnswer 
          minutesUsed={usage.education}
          limitMinutes={GLOBAL_FREE_LIMIT} 
          onUsageUpdate={(m) => handleUsageUpdate(m)}
          onUpgrade={() => setView('pricing')}
          isPro={!!currentUser}
        />
      );
    }

    return (
      <>
        <header className="text-center mb-8 md:mb-12 animate-in fade-in duration-700 px-4">
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Convert {activeTool === 'video' ? 'Video' : 'Audio'} to Text <span className="text-blue-600">Instantly</span>
          </h1>
          <p className="mt-3 text-base md:text-lg text-gray-500 max-w-2xl mx-auto font-medium">
            High-accuracy AI transcription for your {activeTool} files. 
            <span className="block mt-1 text-sm font-bold text-red-500 uppercase tracking-widest">
              Free Trial: {GLOBAL_FREE_LIMIT} Minute Only
            </span>
          </p>
          
          {!currentUser && (
            <div className={`mt-6 inline-flex items-center space-x-2 px-6 py-2.5 rounded-full text-sm font-bold border shadow-sm animate-in slide-in-from-top-2 duration-300 ${isLimitReached ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
              {isLimitReached ? <AlertCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
              <span>{isLimitReached ? "Limit reached. Please upgrade to Pro." : `Usage: ${Math.round(currentUsage * 10) / 10} / ${GLOBAL_FREE_LIMIT}m used`}</span>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 px-2 md:px-0">
          
          {/* 1. FILE UPLOAD (Order 1) */}
          <div className="lg:col-span-2 space-y-4 order-1">
            <FileUpload 
              onFileSelect={handleFileSelect} 
              isProcessing={status !== 'idle' && status !== 'success' && status !== 'error'} 
              acceptType={activeTool === 'audio' ? 'audio' : 'video'}
            />
            
            {(status !== 'idle' && !result) && (
              <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs md:text-sm font-semibold text-blue-600 uppercase tracking-wider">
                    {status === 'uploading' && "Loading..."}
                    {status === 'extracting' && "Analyzing..."}
                    {status === 'transcribing' && "AI Processing..."}
                    {status === 'finalizing' && "Polishing..."}
                  </span>
                  <span className="text-sm font-bold text-gray-500">{progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-600 h-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* 2. SETTINGS CARD (Order 2 on mobile, Order 2 on desktop column 3) */}
          <div className="lg:col-span-1 order-2 lg:order-2">
            <div className="bg-white p-5 md:p-6 rounded-2xl shadow-xl border border-gray-100">
              <div className="flex items-center space-x-2 mb-6 text-gray-400">
                <SettingsIcon className="w-5 h-5" />
                <h3 className="font-bold text-gray-800">Settings</h3>
              </div>
              <div className="space-y-3">
                {[
                  { key: 'showTimestamps', label: 'Timestamps', icon: Clock },
                  { key: 'speakerDetection', label: 'Speakers', icon: MessageSquare },
                  { key: 'removeFillers', label: 'Clean Audio', icon: Mic2 },
                  { key: 'generateSummary', label: 'AI Summary', icon: Sparkles }
                ].map((item) => (
                  <label key={item.key} className="flex items-center justify-between cursor-pointer p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100">
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-4 h-4 text-gray-400" />
                      <p className="text-sm font-semibold text-gray-700">{item.label}</p>
                    </div>
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-gray-300 text-blue-600" 
                      checked={settings[item.key as keyof AppSettings]}
                      onChange={() => toggleSetting(item.key as keyof AppSettings)}
                    />
                  </label>
                ))}
              </div>
              <button
                disabled={!selectedFile || (status !== 'idle' && status !== 'success' && status !== 'error')}
                onClick={startProcessing}
                className={`w-full mt-6 py-4 px-6 rounded-xl font-black flex items-center justify-center space-x-2 shadow-lg transition-all active:scale-95 ${
                  !selectedFile || (status !== 'idle' && status !== 'success' && status !== 'error')
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                <Zap className="w-5 h-5" />
                <span>{status === 'success' ? 'New Transcription' : 'Start Processing'}</span>
              </button>
            </div>
          </div>

          {/* 3. PLAN STATUS CARD (Order 3 on mobile, Order 4 on desktop column 3) */}
          <div className="lg:col-span-1 order-3 lg:order-4">
            <div className="bg-[#1a202c] p-5 md:p-6 rounded-[24px] shadow-2xl text-white border border-gray-800">
              <div className="flex items-center space-x-2 mb-6">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg md:text-xl font-bold">Plan Status</h3>
              </div>
              <div className="space-y-6">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Current Plan</span>
                  <span className={`font-bold uppercase tracking-widest ${currentUser ? 'text-green-400' : 'text-blue-400'}`}>
                    {currentUser ? 'Pro Lifetime' : 'Free Trial'}
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${currentUser ? 'w-full bg-green-500' : (isLimitReached ? 'w-full bg-red-500' : 'bg-blue-500')}`}
                    style={{ width: currentUser ? '100%' : `${(currentUsage / GLOBAL_FREE_LIMIT) * 100}%` }}
                  />
                </div>
                <div 
                  onClick={() => isLimitReached && setView('pricing')}
                  className={`flex items-center justify-center space-x-2 w-full mt-4 py-3 text-xs font-bold border rounded-2xl transition-all ${
                  currentUser 
                  ? "border-green-500/30 text-green-400 bg-green-500/5" 
                  : (isLimitReached ? "border-red-500/50 text-red-400 bg-red-500/10 cursor-pointer hover:bg-red-500/20" : "border-blue-500/30 text-blue-400 bg-blue-500/5")
                }`}>
                  {currentUser ? <><ShieldCheck className="w-4 h-4" /><span>Pro Active</span></> : <>{isLimitReached ? <><TrendingUp className="w-4 h-4" /><span>Upgrade Now</span></> : <><Clock className="w-4 h-4" /><span>{Math.max(0, GLOBAL_FREE_LIMIT - currentUsage).toFixed(1)}m trial left</span></>}</>}
                </div>
              </div>
            </div>
          </div>

          {/* 4. MAIN CONTENT (Order 4 on mobile, Order 3 on desktop column 1-2) */}
          <div className="lg:col-span-2 space-y-8 order-4 lg:order-3">
            {/* Fills the empty space when no results are shown */}
            {status === 'idle' && !result && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                
                {/* How it Works Section */}
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                  <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center space-x-3">
                    <Rocket className="w-6 h-6 text-blue-600" />
                    <span>দ্রুত ট্রান্সক্রাইব করার নিয়ম</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                      { step: '০১', icon: MousePointerClick, title: 'ফাইল সিলেক্ট', desc: 'আপনার ভিডিও বা অডিও ফাইলটি আপলোড করুন (সর্বোচ্চ ৫০০ এমবি)।', color: 'blue' },
                      { step: '০২', icon: Cpu, title: 'AI প্রসেসিং', desc: 'আমাদের শক্তিশালী AI মুহূর্তেই আপনার কথাগুলো টেক্সটে রূপান্তর করবে।', color: 'indigo' },
                      { step: '০৩', icon: FileJson, title: 'ডাউনলোড', desc: 'ট্রান্সক্রিপশন শেষ হলে TXT বা SRT ফরম্যাটে ডাউনলোড করে নিন।', color: 'emerald' }
                    ].map((item, idx) => (
                      <div key={idx} className="relative group">
                        <div className={`w-14 h-14 bg-${item.color}-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                          <item.icon className={`w-7 h-7 text-${item.color}-600`} />
                        </div>
                        <span className="absolute top-0 right-0 text-3xl font-black text-gray-50 opacity-50">{item.step}</span>
                        <h4 className="font-black text-gray-800 text-lg mb-2">{item.title}</h4>
                        <p className="text-sm text-gray-500 leading-relaxed font-medium">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Features Highlights Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-gray-900 to-slate-800 p-8 rounded-[40px] text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-[80px] opacity-20 -mr-10 -mt-10"></div>
                    <div className="relative z-10">
                      <div className="p-3 bg-white/10 rounded-xl w-fit mb-6"><Languages className="w-6 h-6 text-blue-400" /></div>
                      <h4 className="text-xl font-black mb-3">নির্ভুল বাংলা ও ইংরেজি</h4>
                      <p className="text-sm text-gray-400 leading-relaxed font-medium">বাংলা ও ইংরেজি উভয় ভাষাতেই আমাদের AI অত্যন্ত নির্ভুলভাবে কাজ করে। প্রফেশনাল ব্যবহারের জন্য এটি সেরা সমাধান।</p>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-8 rounded-[40px] border border-blue-100 shadow-sm group hover:shadow-md transition-shadow">
                    <div className="p-3 bg-white rounded-xl w-fit mb-6 shadow-sm"><SettingsIcon className="w-6 h-6 text-blue-600 group-hover:rotate-45 transition-transform duration-500" /></div>
                    <h4 className="text-xl font-black text-blue-900 mb-3">অ্যাডভান্সড সেটিংস</h4>
                    <p className="text-sm text-blue-700/70 leading-relaxed font-medium">স্পিকার ডিটেকশন, টাইমস্ট্যাম্প এবং নয়েজ রিমুভাল এর মতো সব প্রিমিয়াম ফিচার আপনি পাবেন একদম ফ্রি ট্রায়ালে।</p>
                  </div>
                </div>

                {/* Format Support Banner */}
                <div className="flex flex-wrap items-center justify-center gap-6 opacity-40 grayscale hover:grayscale-0 transition-all duration-700 px-4">
                  <div className="flex items-center space-x-2"><MonitorPlay className="w-5 h-5" /><span className="text-sm font-bold uppercase tracking-widest">MP4 SUPPORT</span></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <div className="flex items-center space-x-2"><AudioLines className="w-5 h-5" /><span className="text-sm font-bold uppercase tracking-widest">WAV SUPPORT</span></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <div className="flex items-center space-x-2"><Clapperboard className="w-5 h-5" /><span className="text-sm font-bold uppercase tracking-widest">MKV SUPPORT</span></div>
                </div>

              </div>
            )}

            {result && <TranscriptionResultView result={result} settings={settings} />}

            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center space-x-3">
                <EarOff className="w-5 h-5" />
                <p className="font-bold">Transcription Failed. Please try again.</p>
              </div>
            )}
          </div>

          {/* 5. FEATURE BLOG (Order 5 on mobile, Order 5 on desktop column 3) */}
          <div className="lg:col-span-1 space-y-6 order-5 lg:order-5">
            {/* FEATURE INSIGHTS / BLOG CONTENT SECTION */}
            <div className="space-y-6 animate-in fade-in duration-1000 delay-300">
               <div className="flex items-center space-x-2 px-2">
                  <Lightbulb className="w-4 h-4 text-blue-500" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Our Magic Tools</span>
               </div>

               {/* EduMaster Blog Card */}
               <div className="group bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden relative">
                  <div className="absolute -top-4 -right-4 w-20 h-20 bg-indigo-50 rounded-full group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform shadow-inner">
                      <GraduationCap className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h4 className="text-lg font-black text-gray-900 mb-2">EduMaster AI Solution</h4>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium mb-5">আপনার যেকোনো জটিল পড়াশোনার সমস্যার সমাধান দিবে আমাদের AI। বিজ্ঞান, ধর্ম কিংবা সাধারণ জ্ঞান—যেকোনো প্রশ্ন লিখে বা ছবি তুলে পাঠালেই পাবেন নির্ভুল ব্যাখ্যাসহ উত্তর।</p>
                    <button 
                      onClick={() => { setActiveTool('education'); setView('education'); }}
                      className="flex items-center space-x-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:translate-x-1 transition-transform"
                    >
                      <span>Explore EduMaster</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
               </div>

               {/* Video to Text Blog Card */}
               <div className="group bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden relative">
                  <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 group-hover:-rotate-12 transition-transform shadow-inner">
                      <FileVideo className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-black text-gray-900 mb-2">Transcribe Any Content</h4>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium mb-5">মিটিং নোট, লেকচার বা ইউটিউব ভিডিও—সবকিছু মুহূর্তেই টেক্সটে রূপান্তর করুন। স্পিকার ডিটেকশন ও অটোমেটিক সামারি ফিচার আপনার কাজকে করে তুলবে সহজ ও দ্রুততম।</p>
                    <button 
                      onClick={() => { setActiveTool('video'); setView('transcribe'); }}
                      className="flex items-center space-x-2 text-blue-600 font-black text-[10px] uppercase tracking-widest hover:translate-x-1 transition-transform"
                    >
                      <span>Start Transcribing</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
               </div>

               {/* Voice Studio Blog Card */}
               <div className="group bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden relative">
                  <div className="absolute -top-4 -right-4 w-20 h-20 bg-emerald-50 rounded-full group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner">
                      <MessageSquareText className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h4 className="text-lg font-black text-gray-900 mb-2">Natural AI Voice Studio</h4>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium mb-5">আমাদের টেক্সট-টু-ভয়েস টুলের মাধ্যমে যেকোনো লেখাকে দিন প্রাণবন্ত কণ্ঠস্বর। বিশেষ করে ঢাকা সিটির ন্যাচারাল অ্যাকসেন্টে ভয়েস ওভার তৈরি করুন সোশ্যাল মিডিয়া বা প্রেজেন্টেশনের জন্য।</p>
                    <button 
                      onClick={() => { setActiveTool('tts'); setView('tts'); }}
                      className="flex items-center space-x-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest hover:translate-x-1 transition-transform"
                    >
                      <span>Create Voiceover</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
               </div>

               {/* Enhancer Blog Card */}
               <div className="group bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden relative">
                  <div className="absolute -top-4 -right-4 w-20 h-20 bg-purple-50 rounded-full group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-6 transition-transform shadow-inner">
                      <Waves className="w-6 h-6 text-purple-600" />
                    </div>
                    <h4 className="text-lg font-black text-gray-900 mb-2">Voice Quality Enhancer</h4>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium mb-5">সাধারণ ফোনে রেকর্ড করা নয়েজযুক্ত শব্দকে করুন একদম স্টুডিও কোয়ালিটি। আমাদের AI অটোমেটিকালি ব্যাকগ্রাউন্ড নয়েজ রিমুভ করে ভয়েস টোনকে করে তুলবে প্রফেশনাল ও স্পষ্ট।</p>
                    <button 
                      onClick={() => { setActiveTool('enhancer'); setView('enhancer'); }}
                      className="flex items-center space-x-2 text-purple-600 font-black text-[10px] uppercase tracking-widest hover:translate-x-1 transition-transform"
                    >
                      <span>Fix My Audio</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20 md:pb-0">
      <nav className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between sticky top-0 z-[100] shadow-sm">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => { setView('transcribe'); setActiveTool('video'); setResult(null); setSelectedFile(null); setStatus('idle'); }}>
          <div className="bg-blue-600 p-1.5 md:p-2 rounded-lg shadow-md"><Zap className="text-white w-4 h-4 md:w-5 md:h-5" /></div>
          <span className="text-lg md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">VidScribe AI</span>
        </div>
        
        <div className="flex items-center space-x-2 md:space-x-8">
          <div className="hidden lg:flex items-center space-x-6 text-sm font-medium text-gray-600">
            {currentUser && (
              <button onClick={() => setView('dashboard')} className={`flex items-center space-x-1 font-bold ${view === 'dashboard' ? 'text-blue-600' : 'hover:text-blue-600'}`}>
                <LayoutDashboard className="w-4 h-4" /><span>Dashboard</span>
              </button>
            )}
            
            <button 
              onClick={() => { setActiveTool('game'); setView('game'); }} 
              className={`flex items-center space-x-1.5 font-black transition-colors ${view === 'game' ? 'text-yellow-600' : 'text-gray-600 hover:text-yellow-600'}`}
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Edu Game Play</span>
            </button>

            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setIsOtherAppsOpen(!isOtherAppsOpen)} className={`flex items-center space-x-1 font-bold hover:text-blue-600 ${isOtherAppsOpen ? 'text-blue-600' : ''}`}>
                <span>All Tools</span><ChevronDown className={`w-4 h-4 transition-transform ${isOtherAppsOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOtherAppsOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-[60]">
                  <button onClick={() => { setActiveTool('education'); setView('education'); setIsOtherAppsOpen(false); }} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 text-left">
                    <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600"><GraduationCap className="w-4 h-4" /></div>
                    <div><p className="font-bold text-gray-900 text-xs uppercase tracking-tighter">EduMaster AI</p></div>
                  </button>
                  <button onClick={() => { setActiveTool('video'); setView('transcribe'); setIsOtherAppsOpen(false); }} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 text-left">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600"><FileVideo className="w-4 h-4" /></div>
                    <div><p className="font-bold text-gray-900 text-xs">Video to Text</p></div>
                  </button>
                  <button onClick={() => { setActiveTool('audio'); setView('transcribe'); setIsOtherAppsOpen(false); }} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 text-left">
                    <div className="p-2 rounded-lg bg-purple-100 text-purple-600"><AudioLines className="w-4 h-4" /></div>
                    <div><p className="font-bold text-gray-900 text-xs">Audio to Text</p></div>
                  </button>
                  <button onClick={() => { setActiveTool('tts'); setView('tts'); setIsOtherAppsOpen(false); }} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 text-left">
                    <div className="p-2 rounded-lg bg-green-100 text-green-600"><MessageSquareText className="w-4 h-4" /></div>
                    <div><p className="font-bold text-gray-900 text-xs">Text to Voice</p></div>
                  </button>
                  <button onClick={() => { setActiveTool('enhancer'); setView('enhancer'); setIsOtherAppsOpen(false); }} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 text-left">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600"><Waves className="w-4 h-4" /></div>
                    <div><p className="font-bold text-gray-900 text-xs">Voice Enhancer</p></div>
                  </button>
                </div>
              )}
            </div>
            <button onClick={() => setView('pricing')} className={`flex items-center space-x-1 font-bold ${view === 'pricing' ? 'text-blue-600' : 'hover:text-blue-600'}`}>
              <CreditCard className="w-4 h-4" /><span>Pricing</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            {currentUser ? (
              <div className="flex items-center space-x-2">
                <button onClick={() => setView('profile')} className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white shadow-sm"><UserIcon className="w-5 h-5 text-blue-600" /></button>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2 text-gray-600"><Menu className="w-6 h-6" /></button>
              </div>
            ) : (
              <>
                <button onClick={() => setActiveModal('signin')} className="hidden sm:flex items-center space-x-1 px-3 py-2 text-sm font-semibold text-gray-700">Sign In</button>
                <button onClick={() => setActiveModal('signup')} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs md:text-sm font-bold">Sign Up</button>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2 text-gray-600"><Menu className="w-6 h-6" /></button>
              </>
            )}
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[90] lg:hidden animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-gray-900/40" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="absolute right-0 top-0 h-full w-4/5 max-w-sm bg-white p-6 flex flex-col">
            <div className="flex justify-between items-center mb-10 border-b pb-4"><span className="font-bold text-gray-400 uppercase text-xs">Menu</span><button onClick={() => setIsMobileMenuOpen(false)}><X className="w-5 h-5" /></button></div>
            <div className="space-y-4 overflow-y-auto flex-1 text-sm">
              <button onClick={() => { setActiveTool('game'); setView('game'); }} className="w-full flex items-center space-x-3 p-4 rounded-xl font-black bg-yellow-50 text-yellow-700 shadow-sm border border-yellow-100"><Gamepad2 className="w-5 h-5" /><span>Edu Game Play</span></button>
              <button onClick={() => { setActiveTool('education'); setView('education'); }} className="w-full flex items-center space-x-3 p-4 rounded-xl font-bold hover:bg-gray-50"><GraduationCap className="w-5 h-5" /><span>EduMaster AI</span></button>
              <button onClick={() => { setActiveTool('video'); setView('transcribe'); }} className="w-full flex items-center space-x-3 p-4 rounded-xl font-bold hover:bg-gray-50"><FileVideo className="w-5 h-5" /><span>Video to Text</span></button>
              <button onClick={() => { setActiveTool('audio'); setView('transcribe'); }} className="w-full flex items-center space-x-3 p-4 rounded-xl font-bold hover:bg-gray-50"><AudioLines className="w-5 h-5" /><span>Audio to Text</span></button>
              <button onClick={() => { setActiveTool('tts'); setView('tts'); }} className="w-full flex items-center space-x-3 p-4 rounded-xl font-bold hover:bg-gray-50"><MessageSquareText className="w-5 h-5" /><span>Text to Voice</span></button>
              <button onClick={() => { setActiveTool('enhancer'); setView('enhancer'); }} className="w-full flex items-center space-x-3 p-4 rounded-xl font-bold hover:bg-gray-50"><Waves className="w-5 h-5" /><span>Voice Enhancer</span></button>
              {currentUser && <button onClick={() => setView('dashboard')} className="w-full flex items-center space-x-3 p-4 rounded-xl font-bold hover:bg-gray-50"><LayoutDashboard className="w-5 h-5" /><span>Dashboard</span></button>}
              <button onClick={() => setView('pricing')} className="w-full flex items-center space-x-3 p-4 rounded-xl font-bold hover:bg-gray-50"><CreditCard className="w-5 h-5" /><span>Pricing</span></button>
            </div>
            {currentUser ? <button onClick={handleLogout} className="mt-auto p-4 bg-red-50 text-red-600 rounded-xl font-bold flex items-center justify-center space-x-2"><LogOut className="w-5 h-5" /><span>Sign Out</span></button> : <button onClick={() => setActiveModal('signin')} className="mt-auto p-4 bg-blue-50 text-blue-600 rounded-xl font-bold flex items-center justify-center space-x-2"><LogIn className="w-5 h-5" /><span>Sign In</span></button>}
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 lg:hidden flex justify-around items-center py-2 px-2 z-[80] shadow-lg">
        <button onClick={() => { setActiveTool('game'); setView('game'); }} className={`flex flex-col items-center p-2 rounded-xl ${view === 'game' ? 'text-yellow-600' : 'text-gray-400'}`}><Gamepad2 className="w-6 h-6" /><span className="text-[10px] font-black mt-1 uppercase">Game</span></button>
        <button onClick={() => { setActiveTool('video'); setView('transcribe'); }} className={`flex flex-col items-center p-2 rounded-xl ${activeTool === 'video' && view === 'transcribe' ? 'text-blue-600' : 'text-gray-400'}`}><FileVideo className="w-6 h-6" /><span className="text-[10px] font-bold mt-1">Video</span></button>
        <button onClick={() => { setActiveTool('audio'); setView('transcribe'); }} className={`flex flex-col items-center p-2 rounded-xl ${activeTool === 'audio' && view === 'transcribe' ? 'text-blue-600' : 'text-gray-400'}`}><AudioLines className="w-6 h-6" /><span className="text-[10px] font-bold mt-1">Audio</span></button>
        <button onClick={() => { setActiveTool('education'); setView('education'); }} className={`flex flex-col items-center p-2 rounded-xl ${view === 'education' ? 'text-blue-600' : 'text-gray-400'}`}><GraduationCap className="w-6 h-6" /><span className="text-[10px] font-bold mt-1 uppercase">Edu</span></button>
        {currentUser && <button onClick={() => setView('dashboard')} className={`flex flex-col items-center p-2 rounded-xl ${view === 'dashboard' ? 'text-blue-600' : 'text-gray-400'}`}><LayoutDashboard className="w-6 h-6" /><span className="text-[10px] font-bold mt-1">Stats</span></button>}
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 md:py-8">
        {renderContent()}
      </main>

      <footer className="bg-white border-t border-gray-100 py-8 px-4 mt-12">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <div className="flex items-center space-x-2 font-semibold text-gray-600"><Zap className="w-4 h-4 text-blue-600" /><span>VidScribe AI © 2024</span></div>
          <div className="flex gap-6 mt-4 md:mt-0">
            <button onClick={() => setView('pricing')}>Pricing</button>
            <a href="#">Privacy</a><a href="#">Terms</a>
          </div>
        </div>
      </footer>

      <AuthModals type={activeModal} onClose={() => setActiveModal(null)} onSuccess={handleAuthSuccess} />
      <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} selectedPackage={selectedPkg} packages={PACKAGES} />
    </div>
  );
};

export default App;
