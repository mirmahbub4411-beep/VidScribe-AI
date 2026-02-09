
import React, { useState, useRef, useEffect } from 'react';
import { 
  BookOpen, 
  Image as ImageIcon, 
  Send, 
  Loader2, 
  Sparkles, 
  AlertCircle, 
  Info, 
  TrendingUp, 
  CheckCircle2,
  GraduationCap,
  Languages,
  X,
  Download,
  FileText,
  FileDown,
  FileType,
  ChevronDown,
  Printer,
  FileCode
} from 'lucide-react';
import { solveEducationQuestion } from '../services/geminiService.ts';

// Dynamic imports for PDF generation
const loadPdfLib = async () => {
  const { jsPDF } = await import('https://esm.sh/jspdf@^2.5.1');
  const html2canvas = (await import('https://esm.sh/html2canvas@^1.4.1')).default;
  return { jsPDF, html2canvas };
};

interface EducationAnswerProps {
  minutesUsed: number;
  limitMinutes: number;
  onUsageUpdate: (minutes: number) => void;
  onUpgrade: () => void;
  isPro: boolean;
}

const EducationAnswer: React.FC<EducationAnswerProps> = ({ minutesUsed, limitMinutes, onUsageUpdate, onUpgrade, isPro }) => {
  const [question, setQuestion] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pdfTemplateRef = useRef<HTMLDivElement>(null);

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSolve = async () => {
    if (!question && !imageFile) return;
    if (isLimitReached) {
      onUpgrade();
      return;
    }

    setIsProcessing(true);
    setStatus('Thinking...');
    setAnswer(null);

    try {
      let imageBase64 = undefined;
      if (imageFile) {
        setStatus('Analyzing image...');
        const reader = new FileReader();
        const promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
        });
        reader.readAsDataURL(imageFile);
        imageBase64 = await promise;
      }

      setStatus('Finding correct answer...');
      const result = await solveEducationQuestion(question, imageBase64, imageFile?.type);
      setAnswer(result);
      onUsageUpdate(0.1); 
    } catch (err) {
      console.error(err);
      alert("Failed to get answer. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAll = () => {
    setQuestion('');
    setImageFile(null);
    setImagePreview(null);
    setAnswer(null);
  };

  const downloadAsFile = async (format: 'txt' | 'doc' | 'pdf-direct' | 'pdf-print') => {
    if (!answer) return;
    setShowDownloadMenu(false);

    const timestamp = new Date().toLocaleDateString();
    const fileName = `EduMaster_Answer_${Date.now()}`;

    if (format === 'txt') {
      const blob = new Blob([`EduMaster AI Answer\nDate: ${timestamp}\n\nQuestion: ${question}\n\nAnswer:\n${answer}`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'doc') {
      const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>EduMaster Answer</title><style>body{font-family: Arial, sans-serif; padding: 40px;} h1{color: #2563eb;} .meta{color: #666; margin-bottom: 20px;} .section{margin-bottom: 30px;}</style></head><body>";
      const content = `<h1>EduMaster AI Solution</h1><div class='meta'>Generated on: ${timestamp}</div><div class='section'><strong>Question:</strong><br/>${question || "Image-based question"}</div><div class='section'><strong>AI Solution:</strong><br/>${answer.replace(/\n/g, '<br/>')}</div>`;
      const footer = "</body></html>";
      const blob = new Blob([header + content + footer], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.doc`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'pdf-print') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>EduMaster AI - Answer Export</title>
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
                .header { border-bottom: 4px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
                .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
                .meta { font-size: 12px; color: #64748b; margin-top: 5px; }
                .question-box { background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 30px; border-left: 6px solid #cbd5e1; }
                .question-title { font-weight: bold; font-size: 14px; text-transform: uppercase; color: #64748b; margin-bottom: 10px; }
                .answer-box { font-size: 16px; white-space: pre-wrap; }
              </style>
            </head>
            <body>
              <div class="header">
                <div class="logo">VidScribe AI: EduMaster Solution</div>
                <div class="meta">Exported on ${timestamp}</div>
              </div>
              <div class="question-box">
                <div class="question-title">Question</div>
                <div>${question || "Image-based question provided by student."}</div>
              </div>
              <div class="answer-box">
                <div class="question-title" style="color: #10b981;">AI Verified Solution</div>
                ${answer}
              </div>
              <script>
                setTimeout(() => { window.print(); window.close(); }, 500);
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } else if (format === 'pdf-direct') {
      setIsDownloading(true);
      try {
        const { jsPDF, html2canvas } = await loadPdfLib();
        const element = pdfTemplateRef.current;
        if (!element) return;

        // Temporarily show the hidden template off-screen for capture
        element.style.display = 'block';
        element.style.position = 'absolute';
        element.style.left = '-9999px';
        element.style.top = '0';
        element.style.width = '800px';

        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        // Hide it again
        element.style.display = 'none';

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${fileName}.pdf`);
      } catch (err) {
        console.error("PDF generation failed:", err);
        alert("Direct download failed. Please use 'Ready to Print' instead.");
      } finally {
        setIsDownloading(false);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700 pb-10">
      <header className="text-center">
        <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
          <GraduationCap className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-gray-900">EduMaster <span className="text-blue-600">AI</span></h2>
        <p className="mt-2 text-gray-500 font-medium">Solve Any Subject • Science, Islamic & General Knowledge</p>
        
        {!isPro && (
          <div className={`mt-6 inline-flex items-center space-x-2 px-6 py-2.5 rounded-full text-sm font-bold border shadow-sm ${isLimitReached ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
            {isLimitReached ? <AlertCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
            <span>{isLimitReached ? "Limit Reached" : `Free Trial: ${minutesUsed.toFixed(1)} / ${limitMinutes} min used`}</span>
          </div>
        )}
      </header>

      <div className="bg-white rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 md:p-8 space-y-6">
          <div className="relative">
            <textarea
              className="w-full p-6 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none text-lg text-gray-800 leading-relaxed resize-none transition-all font-medium"
              placeholder="আপনার প্রশ্নটি এখানে লিখুন অথবা প্রশ্নের ছবি আপলোড করুন..."
              rows={4}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isProcessing || isLimitReached}
            />
            <div className="absolute bottom-4 right-4 flex items-center space-x-2">
              <button 
                onClick={() => imageInputRef.current?.click()}
                className={`p-3 rounded-xl transition-all shadow-md ${imagePreview ? 'bg-blue-600 text-white' : 'bg-white text-gray-400 hover:text-blue-600'}`}
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <input type="file" ref={imageInputRef} hidden accept="image/*" onChange={handleImageSelect} />
            </div>
          </div>

          {imagePreview && (
            <div className="relative w-full max-w-xs mx-auto animate-in zoom-in duration-300">
              <img src={imagePreview} className="rounded-2xl border-4 border-white shadow-xl" />
              <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute -top-3 -right-3 p-2 bg-red-500 text-white rounded-full shadow-lg"><X className="w-4 h-4" /></button>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
              <Languages className="w-4 h-4" />
              <span>Bangla & English Support</span>
            </div>
            <button 
              onClick={handleSolve}
              disabled={(!question && !imageFile) || isProcessing || isLimitReached}
              className={`px-8 py-4 rounded-2xl font-black text-lg flex items-center space-x-3 shadow-xl transition-all active:scale-95 ${(!question && !imageFile) || isProcessing || isLimitReached ? 'bg-gray-100 text-gray-300' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <>{isLimitReached ? <TrendingUp className="w-6 h-6" /> : <Send className="w-5 h-5" />}<span>{isLimitReached ? 'Upgrade Now' : 'Get Answer'}</span></>}
            </button>
          </div>
        </div>

        {answer && (
          <div className="bg-gray-50 border-t border-gray-100 p-8 md:p-10 animate-in slide-in-from-bottom-8 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg text-green-600"><CheckCircle2 className="w-6 h-6" /></div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">AI Solution</h3>
              </div>
              
              <div className="relative" ref={menuRef}>
                <button 
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                  className={`flex items-center space-x-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors ${isDownloading ? 'opacity-50 cursor-wait' : ''}`}
                  disabled={isDownloading}
                >
                  {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>{isDownloading ? 'Generating PDF...' : 'Download Answer'}</span>
                  {!isDownloading && <ChevronDown className={`w-3 h-3 transition-transform ${showDownloadMenu ? 'rotate-180' : ''}`} />}
                </button>

                {showDownloadMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <button onClick={() => downloadAsFile('pdf-direct')} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 text-left group">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"><FileDown className="w-4 h-4" /></div>
                      <div><p className="font-bold text-gray-900 text-xs">Direct Download (PDF)</p><p className="text-[10px] text-gray-400 font-bold uppercase">Print-Style Layout</p></div>
                    </button>
                    <button onClick={() => downloadAsFile('pdf-print')} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 text-left group border-t border-gray-50">
                      <div className="p-2 rounded-lg bg-red-100 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors"><Printer className="w-4 h-4" /></div>
                      <div><p className="font-bold text-gray-900 text-xs">Ready to Print</p><p className="text-[10px] text-gray-400 font-bold uppercase">Full Page Preview</p></div>
                    </button>
                    <button onClick={() => downloadAsFile('doc')} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 text-left group border-t border-gray-50">
                      <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><FileType className="w-4 h-4" /></div>
                      <div><p className="font-bold text-gray-900 text-xs">Word Document</p><p className="text-[10px] text-gray-400 font-bold uppercase">Editable .DOC</p></div>
                    </button>
                    <button onClick={() => downloadAsFile('txt')} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 text-left group border-t border-gray-50">
                      <div className="p-2 rounded-lg bg-gray-100 text-gray-600 group-hover:bg-gray-600 group-hover:text-white transition-colors"><FileText className="w-4 h-4" /></div>
                      <div><p className="font-bold text-gray-900 text-xs">Text File</p><p className="text-[10px] text-gray-400 font-bold uppercase">Plain Text</p></div>
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="prose prose-blue max-w-none">
              <div className="whitespace-pre-wrap text-lg text-gray-700 leading-relaxed font-medium bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                {answer}
              </div>
            </div>
            <button onClick={clearAll} className="mt-8 text-blue-600 font-bold hover:underline flex items-center space-x-2">
              <X className="w-4 h-4" />
              <span>Clear & Ask New Question</span>
            </button>
          </div>
        )}
      </div>

      {/* Hidden PDF Template for Direct Download (Matches Print Layout) */}
      <div 
        ref={pdfTemplateRef} 
        style={{ display: 'none', padding: '40px', backgroundColor: '#ffffff', color: '#1e293b', lineHeight: '1.6', fontFamily: 'Arial, sans-serif' }}
      >
        <div style={{ borderBottom: '4px solid #2563eb', paddingBottom: '20px', marginBottom: '30px' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>VidScribe AI: EduMaster Solution</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '5px' }}>Exported on {new Date().toLocaleDateString()}</div>
        </div>
        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '30px', borderLeft: '6px solid #cbd5e1' }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase', color: '#64748b', marginBottom: '10px' }}>Question</div>
          <div style={{ fontSize: '16px' }}>{question || "Image-based question provided by student."}</div>
        </div>
        <div style={{ fontSize: '16px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase', color: '#10b981', marginBottom: '10px' }}>AI Verified Solution</div>
          <div style={{ whiteSpace: 'pre-wrap' }}>{answer}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'Islamic Study', desc: 'Quran, Hadith & Shariah', icon: '🕌' },
          { title: 'Science & Math', desc: 'Physics, Chem, Bio, Math', icon: '🔬' },
          { title: 'General Knowledge', desc: 'History, Geo & Current Affairs', icon: '🌍' }
        ].map((item, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-lg text-center">
            <div className="text-3xl mb-3">{item.icon}</div>
            <h4 className="font-black text-gray-900 text-sm mb-1">{item.title}</h4>
            <p className="text-xs text-gray-400 font-bold uppercase">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EducationAnswer;
