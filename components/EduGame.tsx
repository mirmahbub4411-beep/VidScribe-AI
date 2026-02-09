
import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, 
  Gamepad2, 
  Sparkles, 
  Brain, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Timer, 
  RotateCcw,
  Star,
  Coins,
  Loader2,
  GraduationCap,
  BookOpen,
  ClipboardList,
  ChevronRight,
  ChevronLeft,
  FileDown,
  Printer,
  History,
  CheckCircle,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { generateQuizQuestions, getSubjectChapters } from '../services/geminiService.ts';

// Dynamic imports for PDF generation
const loadPdfLib = async () => {
  const { jsPDF } = await import('https://esm.sh/jspdf@^2.5.1');
  const html2canvas = (await import('https://esm.sh/html2canvas@^1.4.1')).default;
  return { jsPDF, html2canvas };
};

const CLASSES = ['৬ষ্ঠ', '৭ম', '৮ম', '৯ম', '১০ম'];
const SUBJECTS = [
  { id: 'science', name: 'বিজ্ঞান (Science)', icon: '🔬', color: 'blue' },
  { id: 'social', name: 'বাংলাদেশ ও বিশ্বপরিচয়', icon: '🌍', color: 'emerald' },
  { id: 'islamic', name: 'ইসলাম শিক্ষা', icon: '🕌', color: 'indigo' },
  { id: 'hindu', name: 'হিন্দু ধর্ম শিক্ষা', icon: '🔱', color: 'amber' },
  { id: 'economics', name: 'অর্থনীতি', icon: '📈', color: 'rose' },
  { id: 'geography', name: 'ভূগোল ও পরিবেশ', icon: '🗺️', color: 'cyan' },
  { id: 'agriculture', name: 'কৃষিশিক্ষা', icon: '🌱', color: 'green' },
];

const EXAM_TIME_LIMIT = 20 * 60; // 20 Minutes

const EduGame: React.FC = () => {
  const [step, setStep] = useState<'class' | 'subject' | 'chapter' | 'loading' | 'study' | 'exam' | 'result' | 'timeout'>('class');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [selectedChapter, setSelectedChapter] = useState('');
  const [chapters, setChapters] = useState<string[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(EXAM_TIME_LIMIT);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (step === 'exam' && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setStep('timeout');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, timeLeft]);

  const selectClass = (cls: string) => {
    setSelectedClass(cls);
    setStep('subject');
  };

  const selectSubject = async (sub: any) => {
    setSelectedSubject(sub);
    setStep('loading');
    const chaps = await getSubjectChapters(sub.name, selectedClass);
    setChapters(chaps);
    setStep('chapter');
  };

  const selectChapter = async (chap: string) => {
    setSelectedChapter(chap);
    setStep('loading');
    const qs = await generateQuizQuestions(`${selectedSubject.name} - ${chap}`, selectedClass, 'study');
    setQuestions(qs);
    setStep('study');
  };

  const startExam = async () => {
    setStep('loading');
    const qs = await generateQuizQuestions(`${selectedSubject.name} - ${selectedChapter}`, selectedClass, 'exam');
    setQuestions(qs.slice(0, 30));
    setUserAnswers(new Array(Math.min(30, qs.length)).fill(null));
    setCurrentIdx(0);
    setScore(0);
    setTimeLeft(EXAM_TIME_LIMIT);
    setStep('exam');
  };

  const handleExamAnswer = (qIdx: number, aIdx: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[qIdx] = aIdx;
    setUserAnswers(newAnswers);
  };

  const finishExam = () => {
    let calculatedScore = 0;
    questions.forEach((q, i) => {
      if (userAnswers[i] === q.correctIndex) calculatedScore += 1;
    });
    setScore(calculatedScore);
    setStep('result');
  };

  const downloadPDF = async (title: string) => {
    setIsDownloading(true);
    try {
      const { jsPDF, html2canvas } = await loadPdfLib();
      const element = contentRef.current;
      if (!element) return;

      // Ensure all hidden content is visible for capture if inside a scroll container
      const originalStyle = element.style.height;
      element.style.height = 'auto';

      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Multi-page slicing logic
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`${title}_${Date.now()}.pdf`);
      element.style.height = originalStyle;
    } catch (err) {
      console.error(err);
      alert("PDF download failed.");
    } finally {
      setIsDownloading(false);
    }
  };

  // --- RENDERS ---

  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-40 animate-in zoom-in duration-500">
        <Loader2 className="w-20 h-20 text-blue-500 animate-spin" />
        <h3 className="text-2xl font-black mt-8 text-gray-900">AI প্রশ্ন লোড করছে...</h3>
        <p className="text-gray-400 font-bold mt-2 uppercase text-xs tracking-widest italic">Preparing Content</p>
      </div>
    );
  }

  if (step === 'class') {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-blue-100 rounded-[24px] mb-6 shadow-xl ring-4 ring-blue-50">
            <GraduationCap className="w-12 h-12 text-blue-600" />
          </div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight">শ্রেণি নির্বাচন করুন</h2>
          <p className="mt-3 text-gray-500 font-bold text-lg">আপনার শ্রেণি সিলেকশন দিয়ে শুরু করুন</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {CLASSES.map(cls => (
            <button 
              key={cls} 
              onClick={() => selectClass(cls)} 
              className="p-10 bg-white rounded-[40px] border-2 border-gray-100 hover:border-blue-500 hover:shadow-2xl transition-all font-black text-3xl text-gray-800 active:scale-95"
            >
              {cls}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'subject') {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        <button onClick={() => setStep('class')} className="flex items-center space-x-2 text-gray-400 font-bold mb-8 hover:text-blue-600 transition-colors">
          <ChevronLeft className="w-5 h-5" /><span>শ্রেণি পরিবর্তন</span>
        </button>
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-gray-900 tracking-tight">বিষয় নির্বাচন করুন ({selectedClass})</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {SUBJECTS.map(sub => (
            <button 
              key={sub.id} 
              onClick={() => selectSubject(sub)} 
              className="p-8 bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all text-left flex items-center space-x-6 group"
            >
              <span className="text-5xl group-hover:scale-110 transition-transform">{sub.icon}</span>
              <span className="font-black text-gray-800 text-lg leading-tight">{sub.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'chapter') {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        <button onClick={() => setStep('subject')} className="flex items-center space-x-2 text-gray-400 font-bold mb-8 hover:text-blue-600">
          <ChevronLeft className="w-5 h-5" /><span>বিষয় পরিবর্তন</span>
        </button>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-gray-900">{selectedSubject.name} - অধ্যায় নির্বাচন</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chapters.map((chap, idx) => (
            <button 
              key={idx} 
              onClick={() => selectChapter(chap)} 
              className="p-6 bg-white rounded-3xl border border-gray-100 hover:bg-blue-50 hover:border-blue-200 text-left font-bold text-gray-700 flex items-center justify-between group shadow-sm transition-all"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-black text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {idx + 1}
                </div>
                <span>{chap}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'study') {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900">কমন এমসিকিউ (Study Mode)</h2>
            <p className="text-gray-500 font-bold mt-1">{selectedSubject.name} • {selectedChapter}</p>
          </div>
          <div className="flex space-x-2">
             <button 
              onClick={() => downloadPDF(`Question_Paper_${selectedChapter}`)} 
              disabled={isDownloading}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold flex items-center space-x-2 hover:bg-blue-700 shadow-lg disabled:opacity-50"
             >
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                <span>Download Question (PDF)</span>
             </button>
             <button onClick={() => setStep('chapter')} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200">Back</button>
          </div>
        </div>

        <div ref={contentRef} className="space-y-6 bg-white p-2 md:p-8 rounded-[40px] shadow-sm">
          <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100 flex flex-col md:flex-row md:items-start space-y-4 md:space-y-0 md:space-x-4 mb-8 no-print">
            <Sparkles className="w-10 h-10 text-blue-600 shrink-0" />
            <div>
              <p className="text-blue-900 font-black text-xl mb-1">প্রস্তুতি গ্রহণ করুন</p>
              <p className="text-blue-800 font-medium">নিচের প্রশ্নগুলো এই অধ্যায়ের জন্য অত্যন্ত গুরুত্বপূর্ণ। এগুলো ভালোভাবে পড়ে তৈরি হয়ে নিন, এরপর ৩০ নাম্বারের পরীক্ষায় অংশগ্রহণ করতে পারবেন।</p>
            </div>
          </div>

          <div className="space-y-6">
            {questions.map((q, idx) => (
              <div key={idx} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-md space-y-6 break-inside-avoid">
                <div className="flex items-start space-x-3">
                   <span className="w-8 h-8 rounded-xl bg-gray-900 text-white flex items-center justify-center font-black shrink-0">{idx + 1}</span>
                   <h3 className="text-xl md:text-2xl font-black text-gray-800 leading-tight">{q.question}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {q.options.map((opt: any, i: number) => (
                    <div key={i} className={`p-4 rounded-xl border-2 font-bold transition-all ${i === q.correctIndex ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-50 text-gray-400 bg-gray-50/30'}`}>
                      <span className="mr-2 opacity-50">{String.fromCharCode(65 + i)}.</span> {opt}
                    </div>
                  ))}
                </div>
                <div className="bg-yellow-50 p-5 rounded-2xl border border-yellow-100 flex items-start space-x-3 no-print">
                   <Brain className="w-5 h-5 text-yellow-600 shrink-0 mt-1" />
                   <div>
                      <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest mb-1">AI ব্যাখ্যা</p>
                      <p className="text-yellow-800 text-sm font-medium">{q.explanation}</p>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-10 sticky bottom-6 z-10 no-print">
          <button 
            onClick={startExam} 
            className="w-full py-8 bg-blue-600 text-white rounded-[40px] font-black text-3xl shadow-2xl hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center space-x-4 border-8 border-blue-50"
          >
            <ClipboardList className="w-10 h-10" />
            <span>এখন পরীক্ষা শুরু করুন (৩০ নাম্বারের)</span>
          </button>
        </div>
      </div>
    );
  }

  if (step === 'exam') {
    const q = questions[currentIdx];
    return (
      <div className="max-w-3xl mx-auto py-10 px-4 animate-in slide-in-from-bottom-8 duration-700">
        <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-[32px] shadow-2xl border border-gray-100">
          <div className="flex items-center space-x-3">
            <Timer className={`w-8 h-8 ${timeLeft < 180 ? 'text-red-500 animate-pulse' : 'text-blue-600'}`} />
            <div className="flex flex-col">
              <span className={`text-3xl font-black leading-none ${timeLeft < 180 ? 'text-red-500' : 'text-gray-900'}`}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Remaining Time</span>
            </div>
          </div>
          <button 
            onClick={finishExam} 
            className="px-10 py-4 bg-red-600 text-white rounded-2xl font-black shadow-xl hover:bg-red-700 transition-all active:scale-95 flex items-center space-x-2"
          >
            <CheckCircle className="w-5 h-5" />
            <span>সাবমিট করুন</span>
          </button>
        </div>

        <div className="bg-white rounded-[48px] shadow-2xl border border-gray-100 overflow-hidden mb-8">
          <div className="bg-gray-50 px-10 py-6 border-b border-gray-100 flex justify-between items-center">
            <div className="flex flex-col">
               <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Question {currentIdx + 1} of {questions.length}</span>
               <span className="text-sm font-bold text-gray-900">{selectedChapter}</span>
            </div>
            <div className="flex space-x-1.5 h-2">
              {questions.map((_, i) => (
                <div key={i} className={`w-1.5 h-full rounded-full transition-all ${userAnswers[i] !== null ? 'bg-blue-500' : 'bg-gray-200'} ${i === currentIdx ? 'w-6 bg-blue-600' : ''}`} />
              ))}
            </div>
          </div>

          <div className="p-12 md:p-16">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-12 text-center">{q.question}</h2>
            <div className="grid grid-cols-1 gap-4">
              {q.options.map((opt: string, i: number) => (
                <button
                  key={i}
                  onClick={() => handleExamAnswer(currentIdx, i)}
                  className={`p-8 rounded-[32px] border-2 text-xl font-bold transition-all text-left flex items-center justify-between group ${userAnswers[currentIdx] === i ? 'border-blue-600 bg-blue-50 text-blue-700 ring-8 ring-blue-50' : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50/50'}`}
                >
                  <div className="flex items-center space-x-4">
                     <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${userAnswers[currentIdx] === i ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                        {String.fromCharCode(65 + i)}
                     </span>
                     <span>{opt}</span>
                  </div>
                  {userAnswers[currentIdx] === i && <CheckCircle2 className="w-8 h-8 shrink-0 text-blue-600" />}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-8 flex justify-between border-t border-gray-100">
            <button 
              disabled={currentIdx === 0} 
              onClick={() => setCurrentIdx(prev => prev - 1)} 
              className="px-8 py-4 font-bold text-gray-400 hover:text-blue-600 disabled:opacity-0 transition-all flex items-center space-x-2"
            >
              <ChevronLeft className="w-6 h-6" />
              <span>Previous</span>
            </button>
            {currentIdx < questions.length - 1 ? (
              <button 
                onClick={() => setCurrentIdx(prev => prev + 1)} 
                className="px-12 py-4 bg-gray-900 text-white rounded-2xl font-black flex items-center space-x-3 shadow-xl hover:bg-black transition-all active:scale-95"
              >
                <span>Next Question</span>
                <ChevronRight className="w-6 h-6" />
              </button>
            ) : (
              <button 
                onClick={finishExam} 
                className="px-12 py-4 bg-green-600 text-white rounded-2xl font-black flex items-center space-x-3 shadow-xl hover:bg-green-700 transition-all active:scale-95"
              >
                <CheckCircle className="w-6 h-6" />
                <span>Finish & Submit</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'timeout') {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center animate-in zoom-in duration-500">
        <div className="w-32 h-32 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-8 ring-8 ring-red-50">
           <AlertTriangle className="w-16 h-16 text-red-600 animate-bounce" />
        </div>
        <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">সময় শেষ!</h2>
        <p className="text-gray-500 font-bold mb-12 text-lg uppercase tracking-widest leading-relaxed">দুঃখিত, নির্ধারিত ২০ মিনিট শেষ হয়ে গেছে। আপনার ফলাফল দেখুন।</p>
        <button 
          onClick={finishExam} 
          className="w-full py-6 bg-gray-900 text-white rounded-[32px] font-black text-2xl shadow-2xl hover:bg-black transition-all flex items-center justify-center space-x-3"
        >
          <span>ফলাফল দেখুন</span>
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    );
  }

  if (step === 'result') {
    const wrongAnswers = questions.map((q, i) => userAnswers[i] !== q.correctIndex ? { q, userAns: userAnswers[i], qIdx: i } : null).filter(x => x !== null);
    
    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div ref={contentRef} className="bg-white rounded-[48px] shadow-2xl border border-gray-100 overflow-hidden mb-12 p-12">
          <div className="text-center mb-12">
            <div className="w-28 h-28 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-8 ring-8 ring-yellow-50 relative">
               <Trophy className="w-14 h-14 text-yellow-600" />
               <Sparkles className="w-8 h-8 text-yellow-500 absolute -top-2 -right-2 animate-pulse" />
            </div>
            <h2 className="text-5xl font-black text-gray-900 tracking-tight">পরীক্ষার ফলাফল</h2>
            <p className="text-gray-400 font-bold uppercase tracking-widest mt-4 flex items-center justify-center space-x-2">
               <span>শ্রেণি {selectedClass}</span>
               <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
               <span>{selectedSubject.name}</span>
               <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
               <span>{selectedChapter}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-blue-50 p-8 rounded-[32px] text-center border border-blue-100">
              <p className="text-5xl font-black text-blue-900">{score}/{questions.length}</p>
              <p className="text-xs font-black text-blue-400 uppercase tracking-widest mt-2">Total Score</p>
            </div>
            <div className="bg-green-50 p-8 rounded-[32px] text-center border border-green-100">
              <p className="text-5xl font-black text-green-600">{score}</p>
              <p className="text-xs font-black text-green-400 uppercase tracking-widest mt-2">Correct Answers</p>
            </div>
            <div className="bg-red-50 p-8 rounded-[32px] text-center border border-red-100">
              <p className="text-5xl font-black text-red-600">{questions.length - score}</p>
              <p className="text-xs font-black text-red-400 uppercase tracking-widest mt-2">Incorrect Answers</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex items-center justify-between">
               <h3 className="text-2xl font-black text-gray-900 flex items-center space-x-3">
                  <History className="w-6 h-6 text-blue-600" />
                  <span>উত্তর পর্যালোচনা</span>
               </h3>
               {wrongAnswers.length > 0 && <span className="px-4 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-black uppercase">{wrongAnswers.length} Mistakes</span>}
            </div>

            {wrongAnswers.length === 0 ? (
              <div className="p-16 bg-green-50 rounded-[40px] text-center border border-green-100 animate-in zoom-in duration-700">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-6 shadow-xl"><CheckCircle className="w-10 h-10 text-green-500" /></div>
                <h4 className="text-3xl font-black text-green-700">চমৎকার!</h4>
                <p className="text-green-600 font-bold mt-2 text-lg">আপনার সব উত্তর সঠিক হয়েছে।</p>
              </div>
            ) : (
              <div className="space-y-8">
                {questions.map((q, idx) => {
                  const isWrong = userAnswers[idx] !== q.correctIndex;
                  return (
                    <div key={idx} className={`p-10 rounded-[40px] border transition-all break-inside-avoid ${isWrong ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                      <div className="flex items-start space-x-5 mb-8">
                         <span className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black shrink-0 ${isWrong ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>{idx + 1}</span>
                         <p className="font-black text-gray-800 text-2xl leading-tight">{q.question}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <p className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isWrong ? 'text-red-400' : 'text-green-400'}`}>আপনার উত্তর</p>
                           <div className={`p-5 rounded-2xl font-bold border-2 flex items-center space-x-3 ${isWrong ? 'bg-red-100 text-red-700 border-red-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                             {isWrong ? <XCircle className="w-6 h-6 shrink-0" /> : <CheckCircle2 className="w-6 h-6 shrink-0" />}
                             <span className="text-lg">{userAnswers[idx] !== -1 && userAnswers[idx] !== null ? q.options[userAnswers[idx]!] : "উত্তর দেননি"}</span>
                           </div>
                        </div>
                        <div className="space-y-2">
                           <p className="text-[10px] font-black text-green-400 uppercase tracking-widest ml-1">সঠিক উত্তর</p>
                           <div className="p-5 bg-white text-green-700 rounded-2xl font-bold border-2 border-green-100 flex items-center space-x-3">
                             <CheckCircle2 className="w-6 h-6 shrink-0" />
                             <span className="text-lg">{q.options[q.correctIndex]}</span>
                           </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-10">
          <button 
            onClick={() => downloadPDF(`Exam_Result_${selectedChapter}`)} 
            disabled={isDownloading}
            className="py-6 bg-gray-900 text-white rounded-[32px] font-black text-xl shadow-2xl hover:bg-black transition-all active:scale-95 flex items-center justify-center space-x-4 disabled:opacity-50"
          >
            {isDownloading ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileDown className="w-6 h-6 text-yellow-400" />}
            <span>ফলাফল ডাউনলোড (PDF)</span>
          </button>
          <button 
            onClick={() => setStep('class')} 
            className="py-6 bg-white border-4 border-gray-100 text-gray-900 rounded-[32px] font-black text-xl hover:bg-gray-50 transition-all active:scale-95 flex items-center justify-center space-x-4 shadow-xl"
          >
            <RotateCcw className="w-6 h-6 text-blue-600" />
            <span>আবার শুরু করুন</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default EduGame;
