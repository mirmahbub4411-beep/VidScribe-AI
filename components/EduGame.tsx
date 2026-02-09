
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

  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-40 animate-in zoom-in duration-500">
        <Loader2 className="w-16 md:w-20 h-16 md:h-20 text-blue-500 animate-spin" />
        <h3 className="text-xl md:text-2xl font-black mt-8 text-gray-900 text-center px-4">AI প্রশ্ন লোড করছে...</h3>
        <p className="text-gray-400 font-bold mt-2 uppercase text-[10px] tracking-widest italic">Preparing Content</p>
      </div>
    );
  }

  if (step === 'class') {
    return (
      <div className="max-w-4xl mx-auto py-6 md:py-10 px-4">
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center justify-center p-3 md:p-4 bg-blue-100 rounded-[20px] md:rounded-[24px] mb-4 md:mb-6 shadow-xl ring-4 ring-blue-50">
            <GraduationCap className="w-10 md:w-12 h-10 md:h-12 text-blue-600" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">শ্রেণি নির্বাচন করুন</h2>
          <p className="mt-2 text-gray-500 font-bold text-sm md:text-lg">আপনার শ্রেণি সিলেকশন দিয়ে শুরু করুন</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-6">
          {CLASSES.map(cls => (
            <button 
              key={cls} 
              onClick={() => selectClass(cls)} 
              className="p-6 md:p-10 bg-white rounded-[24px] md:rounded-[40px] border-2 border-gray-100 hover:border-blue-500 hover:shadow-2xl transition-all font-black text-xl md:text-3xl text-gray-800 active:scale-95"
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
      <div className="max-w-4xl mx-auto py-6 md:py-10 px-4">
        <button onClick={() => setStep('class')} className="flex items-center space-x-2 text-gray-400 font-bold mb-6 md:mb-8 hover:text-blue-600 transition-colors text-sm">
          <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" /><span>শ্রেণি পরিবর্তন</span>
        </button>
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight">বিষয় নির্বাচন করুন ({selectedClass})</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
          {SUBJECTS.map(sub => (
            <button 
              key={sub.id} 
              onClick={() => selectSubject(sub)} 
              className="p-5 md:p-8 bg-white rounded-[24px] md:rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all text-left flex items-center space-x-4 md:space-x-6 group"
            >
              <span className="text-3xl md:text-5xl group-hover:scale-110 transition-transform">{sub.icon}</span>
              <span className="font-black text-gray-800 text-sm md:text-lg leading-tight">{sub.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'chapter') {
    return (
      <div className="max-w-4xl mx-auto py-6 md:py-10 px-4">
        <button onClick={() => setStep('subject')} className="flex items-center space-x-2 text-gray-400 font-bold mb-6 md:mb-8 hover:text-blue-600 text-sm">
          <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" /><span>বিষয় পরিবর্তন</span>
        </button>
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 px-4">{selectedSubject.name} - অধ্যায় নির্বাচন</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {chapters.map((chap, idx) => (
            <button 
              key={idx} 
              onClick={() => selectChapter(chap)} 
              className="p-4 md:p-6 bg-white rounded-2xl md:rounded-3xl border border-gray-100 hover:bg-blue-50 hover:border-blue-200 text-left font-bold text-gray-700 flex items-center justify-between group shadow-sm transition-all text-sm md:text-base"
            >
              <div className="flex items-center space-x-3 md:space-x-4">
                <div className="w-8 md:w-10 h-8 md:h-10 rounded-full bg-gray-100 flex items-center justify-center font-black text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-colors text-xs md:text-sm">
                  {idx + 1}
                </div>
                <span className="truncate max-w-[200px] md:max-w-none">{chap}</span>
              </div>
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-300 group-hover:text-blue-500 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'study') {
    return (
      <div className="max-w-4xl mx-auto py-6 md:py-10 px-2 md:px-4 space-y-6 md:space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">কমন এমসিকিউ (Study)</h2>
            <p className="text-gray-500 font-bold mt-1 text-sm">{selectedSubject.name} • {selectedChapter}</p>
          </div>
          <div className="flex space-x-2">
             <button 
              onClick={() => downloadPDF(`Question_Paper_${selectedChapter}`)} 
              disabled={isDownloading}
              className="flex-1 sm:flex-none px-3 md:px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-blue-700 shadow-lg disabled:opacity-50 text-xs md:text-sm"
             >
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                <span className="hidden xs:inline">Download</span>
                <span className="xs:hidden">PDF</span>
             </button>
             <button onClick={() => setStep('chapter')} className="px-4 md:px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 text-xs md:text-sm">Back</button>
          </div>
        </div>

        <div ref={contentRef} className="space-y-4 md:space-y-6 bg-white p-3 md:p-8 rounded-[24px] md:rounded-[40px] shadow-sm">
          <div className="bg-blue-50 p-6 md:p-8 rounded-[20px] md:rounded-3xl border border-blue-100 flex flex-col md:flex-row md:items-start space-y-4 md:space-y-0 md:space-x-4 mb-4 md:mb-8 no-print">
            <Sparkles className="w-8 md:w-10 h-8 md:h-10 text-blue-600 shrink-0" />
            <div>
              <p className="text-blue-900 font-black text-lg md:text-xl mb-1">প্রস্তুতি গ্রহণ করুন</p>
              <p className="text-blue-800 font-medium text-sm md:text-base">নিচের প্রশ্নগুলো এই অধ্যায়ের জন্য অত্যন্ত গুরুত্বপূর্ণ। এগুলো ভালোভাবে পড়ে তৈরি হয়ে নিন।</p>
            </div>
          </div>

          <div className="space-y-4 md:space-y-6">
            {questions.map((q, idx) => (
              <div key={idx} className="bg-white p-5 md:p-8 rounded-[24px] md:rounded-[32px] border border-gray-100 shadow-md space-y-4 md:space-y-6 break-inside-avoid">
                <div className="flex items-start space-x-3">
                   <span className="w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl bg-gray-900 text-white flex items-center justify-center font-black shrink-0 text-xs md:text-base">{idx + 1}</span>
                   <h3 className="text-lg md:text-2xl font-black text-gray-800 leading-tight">{q.question}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  {q.options.map((opt: any, i: number) => (
                    <div key={i} className={`p-3 md:p-4 rounded-xl border-2 font-bold transition-all text-sm md:text-base ${i === q.correctIndex ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-50 text-gray-400 bg-gray-50/30'}`}>
                      <span className="mr-2 opacity-50">{String.fromCharCode(65 + i)}.</span> {opt}
                    </div>
                  ))}
                </div>
                <div className="bg-yellow-50 p-4 md:p-5 rounded-xl md:rounded-2xl border border-yellow-100 flex items-start space-x-3 no-print">
                   <Brain className="w-4 h-4 md:w-5 md:h-5 text-yellow-600 shrink-0 mt-1" />
                   <div>
                      <p className="text-[9px] md:text-[10px] font-black text-yellow-600 uppercase tracking-widest mb-1">AI ব্যাখ্যা</p>
                      <p className="text-yellow-800 text-xs md:text-sm font-medium leading-relaxed">{q.explanation}</p>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-8 md:pt-10 sticky bottom-4 md:bottom-6 z-10 no-print px-2">
          <button 
            onClick={startExam} 
            className="w-full py-5 md:py-8 bg-blue-600 text-white rounded-[24px] md:rounded-[40px] font-black text-lg md:text-3xl shadow-2xl hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center space-x-3 md:space-x-4 border-4 md:border-8 border-blue-50"
          >
            <ClipboardList className="w-6 md:w-10 h-6 md:h-10" />
            <span>এখন পরীক্ষা শুরু করুন (৩০ নাম্বার)</span>
          </button>
        </div>
      </div>
    );
  }

  if (step === 'exam') {
    const q = questions[currentIdx];
    return (
      <div className="max-w-3xl mx-auto py-6 md:py-10 px-2 md:px-4 animate-in slide-in-from-bottom-8 duration-700">
        <div className="flex items-center justify-between mb-6 md:mb-8 bg-white p-4 md:p-6 rounded-[24px] md:rounded-[32px] shadow-2xl border border-gray-100">
          <div className="flex items-center space-x-3">
            <Timer className={`w-6 md:w-8 h-6 md:h-8 ${timeLeft < 180 ? 'text-red-500 animate-pulse' : 'text-blue-600'}`} />
            <div className="flex flex-col">
              <span className={`text-xl md:text-3xl font-black leading-none ${timeLeft < 180 ? 'text-red-500' : 'text-gray-900'}`}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
              <span className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Time Left</span>
            </div>
          </div>
          <button 
            onClick={finishExam} 
            className="px-6 md:px-10 py-3 md:py-4 bg-red-600 text-white rounded-xl md:rounded-2xl font-black shadow-xl hover:bg-red-700 transition-all active:scale-95 flex items-center space-x-2 text-xs md:text-base"
          >
            <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
            <span>সাবমিট</span>
          </button>
        </div>

        <div className="bg-white rounded-[32px] md:rounded-[48px] shadow-2xl border border-gray-100 overflow-hidden mb-6 md:mb-8">
          <div className="bg-gray-50 px-6 md:px-10 py-4 md:py-6 border-b border-gray-100 flex justify-between items-center">
            <div className="flex flex-col">
               <span className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">Question {currentIdx + 1} of {questions.length}</span>
               <span className="text-xs md:text-sm font-bold text-gray-900 truncate max-w-[120px] md:max-w-none">{selectedChapter}</span>
            </div>
            <div className="flex space-x-1 h-1 md:h-2">
              {questions.map((_, i) => (
                <div key={i} className={`w-1 md:w-1.5 h-full rounded-full transition-all ${userAnswers[i] !== null ? 'bg-blue-500' : 'bg-gray-200'} ${i === currentIdx ? 'w-4 md:w-6 bg-blue-600' : ''}`} />
              ))}
            </div>
          </div>

          <div className="p-8 md:p-16">
            <h2 className="text-xl md:text-4xl font-black text-gray-900 leading-tight mb-8 md:mb-12 text-center">{q.question}</h2>
            <div className="grid grid-cols-1 gap-3 md:gap-4">
              {q.options.map((opt: string, i: number) => (
                <button
                  key={i}
                  onClick={() => handleExamAnswer(currentIdx, i)}
                  className={`p-5 md:p-8 rounded-[20px] md:rounded-[32px] border-2 text-base md:text-xl font-bold transition-all text-left flex items-center justify-between group ${userAnswers[currentIdx] === i ? 'border-blue-600 bg-blue-50 text-blue-700 ring-4 md:ring-8 ring-blue-50' : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50/50'}`}
                >
                  <div className="flex items-center space-x-3 md:space-x-4">
                     <span className={`w-8 md:w-10 h-8 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center font-black text-sm md:text-base ${userAnswers[currentIdx] === i ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                        {String.fromCharCode(65 + i)}
                     </span>
                     <span className="leading-tight">{opt}</span>
                  </div>
                  {userAnswers[currentIdx] === i && <CheckCircle2 className="w-5 md:w-8 h-5 md:h-8 shrink-0 text-blue-600 ml-2" />}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-6 md:p-8 flex justify-between border-t border-gray-100">
            <button 
              disabled={currentIdx === 0} 
              onClick={() => setCurrentIdx(prev => prev - 1)} 
              className="px-4 md:px-8 py-3 md:py-4 font-bold text-gray-400 hover:text-blue-600 disabled:opacity-0 transition-all flex items-center space-x-1 md:space-x-2 text-xs md:text-base"
            >
              <ChevronLeft className="w-4 md:w-6 h-4 md:h-6" />
              <span>Previous</span>
            </button>
            {currentIdx < questions.length - 1 ? (
              <button 
                onClick={() => setCurrentIdx(prev => prev + 1)} 
                className="px-6 md:px-12 py-3 md:py-4 bg-gray-900 text-white rounded-xl md:rounded-2xl font-black flex items-center space-x-2 md:space-x-3 shadow-xl hover:bg-black transition-all active:scale-95 text-xs md:text-base"
              >
                <span>Next</span>
                <ChevronRight className="w-4 md:w-6 h-4 md:h-6" />
              </button>
            ) : (
              <button 
                onClick={finishExam} 
                className="px-6 md:px-12 py-3 md:py-4 bg-green-600 text-white rounded-xl md:rounded-2xl font-black flex items-center space-x-2 md:space-x-3 shadow-xl hover:bg-green-700 transition-all active:scale-95 text-xs md:text-base"
              >
                <CheckCircle className="w-4 md:w-6 h-4 md:h-6" />
                <span>Submit</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'timeout') {
    return (
      <div className="max-w-2xl mx-auto py-16 md:py-20 px-4 text-center animate-in zoom-in duration-500">
        <div className="w-24 md:w-32 h-24 md:h-32 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 ring-8 ring-red-50">
           <AlertTriangle className="w-12 md:w-16 h-12 md:h-16 text-red-600 animate-bounce" />
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight">সময় শেষ!</h2>
        <p className="text-gray-500 font-bold mb-10 md:mb-12 text-base md:text-lg uppercase tracking-widest leading-relaxed px-4">দুঃখিত, নির্ধারিত ২০ মিনিট শেষ হয়ে গেছে। ফলাফল দেখুন।</p>
        <button 
          onClick={finishExam} 
          className="w-full py-5 md:py-6 bg-gray-900 text-white rounded-[24px] md:rounded-[32px] font-black text-xl md:text-2xl shadow-2xl hover:bg-black transition-all flex items-center justify-center space-x-3"
        >
          <span>ফলাফল দেখুন</span>
          <ArrowRight className="w-5 md:w-6 h-5 md:h-6" />
        </button>
      </div>
    );
  }

  if (step === 'result') {
    const wrongAnswers = questions.map((q, i) => userAnswers[i] !== q.correctIndex ? { q, userAns: userAnswers[i], qIdx: i } : null).filter(x => x !== null);
    
    return (
      <div className="max-w-4xl mx-auto py-6 md:py-10 px-2 md:px-4">
        <div ref={contentRef} className="bg-white rounded-[32px] md:rounded-[48px] shadow-2xl border border-gray-100 overflow-hidden mb-8 md:mb-12 p-6 md:p-12">
          <div className="text-center mb-8 md:mb-12">
            <div className="w-20 md:w-28 h-20 md:h-28 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 ring-8 ring-yellow-50 relative">
               <Trophy className="w-10 md:w-14 h-10 md:h-14 text-yellow-600" />
               <Sparkles className="w-6 md:w-8 h-6 md:h-8 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight px-2">পরীক্ষার ফলাফল</h2>
            <div className="text-gray-400 font-bold uppercase tracking-widest mt-4 flex flex-wrap items-center justify-center gap-2 text-[10px] md:text-xs">
               <span>শ্রেণি {selectedClass}</span>
               <span className="w-1 h-1 bg-gray-300 rounded-full hidden xs:inline"></span>
               <span>{selectedSubject.name}</span>
               <span className="w-1 h-1 bg-gray-300 rounded-full hidden xs:inline"></span>
               <span className="truncate max-w-[100px] md:max-w-none">{selectedChapter}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
            <div className="bg-blue-50 p-6 md:p-8 rounded-[24px] md:rounded-[32px] text-center border border-blue-100">
              <p className="text-3xl md:text-5xl font-black text-blue-900">{score}/{questions.length}</p>
              <p className="text-[9px] md:text-xs font-black text-blue-400 uppercase tracking-widest mt-2">Total Score</p>
            </div>
            <div className="bg-green-50 p-6 md:p-8 rounded-[24px] md:rounded-[32px] text-center border border-green-100">
              <p className="text-3xl md:text-5xl font-black text-green-600">{score}</p>
              <p className="text-[9px] md:text-xs font-black text-green-400 uppercase tracking-widest mt-2">Correct</p>
            </div>
            <div className="bg-red-50 p-6 md:p-8 rounded-[24px] md:rounded-[32px] text-center border border-red-100">
              <p className="text-3xl md:text-5xl font-black text-red-600">{questions.length - score}</p>
              <p className="text-[9px] md:text-xs font-black text-red-400 uppercase tracking-widest mt-2">Incorrect</p>
            </div>
          </div>

          <div className="space-y-6 md:space-y-8">
            <div className="flex items-center justify-between">
               <h3 className="text-xl md:text-2xl font-black text-gray-900 flex items-center space-x-3">
                  <History className="w-5 md:w-6 h-5 md:h-6 text-blue-600" />
                  <span>উত্তর পর্যালোচনা</span>
               </h3>
               {wrongAnswers.length > 0 && <span className="px-3 md:px-4 py-1 bg-red-100 text-red-700 rounded-full text-[10px] md:text-xs font-black uppercase">{wrongAnswers.length} Mistakes</span>}
            </div>

            {wrongAnswers.length === 0 ? (
              <div className="p-10 md:p-16 bg-green-50 rounded-[32px] md:rounded-[40px] text-center border border-green-100 animate-in zoom-in duration-700">
                <div className="inline-flex items-center justify-center w-16 md:w-20 h-16 md:h-20 bg-white rounded-full mb-4 md:mb-6 shadow-xl"><CheckCircle className="w-8 md:w-10 h-8 md:h-10 text-green-500" /></div>
                <h4 className="text-2xl md:text-3xl font-black text-green-700">চমৎকার!</h4>
                <p className="text-green-600 font-bold mt-2 text-sm md:text-lg">আপনার সব উত্তর সঠিক হয়েছে।</p>
              </div>
            ) : (
              <div className="space-y-6 md:space-y-8">
                {questions.map((q, idx) => {
                  const isWrong = userAnswers[idx] !== q.correctIndex;
                  return (
                    <div key={idx} className={`p-6 md:p-10 rounded-[24px] md:rounded-[40px] border transition-all break-inside-avoid ${isWrong ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                      <div className="flex items-start space-x-3 md:space-x-5 mb-6 md:mb-8">
                         <span className={`w-8 md:w-10 h-8 md:h-10 rounded-lg md:rounded-2xl flex items-center justify-center font-black shrink-0 text-sm md:text-base ${isWrong ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>{idx + 1}</span>
                         <p className="font-black text-gray-800 text-xl md:text-2xl leading-tight">{q.question}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="space-y-1.5 md:space-y-2">
                           <p className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ml-1 ${isWrong ? 'text-red-400' : 'text-green-400'}`}>আপনার উত্তর</p>
                           <div className={`p-4 md:p-5 rounded-xl md:rounded-2xl font-bold border-2 flex items-center space-x-2 md:space-x-3 text-sm md:text-lg ${isWrong ? 'bg-red-100 text-red-700 border-red-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                             {isWrong ? <XCircle className="w-5 h-5 md:w-6 md:h-6 shrink-0" /> : <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 shrink-0" />}
                             <span>{userAnswers[idx] !== -1 && userAnswers[idx] !== null ? q.options[userAnswers[idx]!] : "উত্তর দেননি"}</span>
                           </div>
                        </div>
                        <div className="space-y-1.5 md:space-y-2">
                           <p className="text-[8px] md:text-[10px] font-black text-green-400 uppercase tracking-widest ml-1">সঠিক উত্তর</p>
                           <div className="p-4 md:p-5 bg-white text-green-700 rounded-xl md:rounded-2xl font-bold border-2 border-green-100 flex items-center space-x-2 md:space-x-3 text-sm md:text-lg">
                             <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
                             <span>{q.options[q.correctIndex]}</span>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 pb-10 px-2">
          <button 
            onClick={() => downloadPDF(`Exam_Result_${selectedChapter}`)} 
            disabled={isDownloading}
            className="py-5 md:py-6 bg-gray-900 text-white rounded-[24px] md:rounded-[32px] font-black text-lg md:text-xl shadow-2xl hover:bg-black transition-all active:scale-95 flex items-center justify-center space-x-3 md:space-x-4 disabled:opacity-50"
          >
            {isDownloading ? <Loader2 className="w-5 md:w-6 h-5 md:h-6 animate-spin" /> : <FileDown className="w-5 md:w-6 h-5 md:h-6 text-yellow-400" />}
            <span>ফলাফল ডাউনলোড</span>
          </button>
          <button 
            onClick={() => setStep('class')} 
            className="py-5 md:py-6 bg-white border-4 border-gray-100 text-gray-900 rounded-[24px] md:rounded-[32px] font-black text-lg md:text-xl hover:bg-gray-50 transition-all active:scale-95 flex items-center justify-center space-x-3 md:space-x-4 shadow-xl"
          >
            <RotateCcw className="w-5 md:w-6 h-5 md:h-6 text-blue-600" />
            <span>আবার শুরু করুন</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default EduGame;
