
import React, { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  QrCode, 
  Download, 
  RotateCcw, 
  Copy, 
  Link as LinkIcon, 
  MessageCircle, 
  Type, 
  Mail, 
  Phone, 
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

type QRType = 'url' | 'whatsapp' | 'text' | 'email' | 'phone';

const QRCodeGenerator: React.FC = () => {
  const [inputType, setInputType] = useState<QRType>('url');
  const [inputValue, setInputValue] = useState('');
  const [qrValue, setQrValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const handleTypeChange = (type: QRType) => {
    setInputType(type);
    setInputValue('');
    setQrValue('');
    setError(null);
  };

  const validateAndGenerate = () => {
    setError(null);
    if (!inputValue.trim()) {
      setError('Please enter some data first!');
      return;
    }

    let finalValue = inputValue.trim();

    if (inputType === 'url') {
      const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
      if (!urlPattern.test(finalValue)) {
        setError('Please enter a valid URL');
        return;
      }
      if (!finalValue.startsWith('http')) {
        finalValue = 'https://' + finalValue;
      }
    } else if (inputType === 'whatsapp') {
      const phoneClean = finalValue.replace(/\D/g, '');
      if (phoneClean.length < 10) {
        setError('Please enter a valid phone number');
        return;
      }
      finalValue = `https://wa.me/${phoneClean}`;
    } else if (inputType === 'email') {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(finalValue)) {
        setError('Please enter a valid email address');
        return;
      }
      finalValue = `mailto:${finalValue}`;
    } else if (inputType === 'phone') {
      const phoneClean = finalValue.replace(/\D/g, '');
      if (phoneClean.length < 5) {
        setError('Please enter a valid phone number');
        return;
      }
      finalValue = `tel:${phoneClean}`;
    }

    setQrValue(finalValue);
  };

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `VidScribe_QR_${Date.now()}.png`;
      link.click();
    }
  };

  const copyData = () => {
    if (qrValue) {
      navigator.clipboard.writeText(qrValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const reset = () => {
    setInputValue('');
    setQrValue('');
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="text-center">
        <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
          <QrCode className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-gray-900">QR Code <span className="text-blue-600">Generator</span></h2>
        <p className="mt-2 text-gray-500 font-medium">Create custom QR codes for your business or personal use</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-xl border border-gray-100 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'url', label: 'URL', icon: LinkIcon },
                { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
                { id: 'text', label: 'Text', icon: Type },
                { id: 'email', label: 'Email', icon: Mail },
                { id: 'phone', label: 'Phone', icon: Phone },
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleTypeChange(type.id as QRType)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                    inputType === type.id 
                    ? 'border-blue-600 bg-blue-50 text-blue-600' 
                    : 'border-gray-50 text-gray-400 hover:border-blue-200'
                  }`}
                >
                  <type.icon className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">{type.label}</span>
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                  {inputType === 'url' && 'Website Link'}
                  {inputType === 'whatsapp' && 'WhatsApp Number (e.g. 88017...)'}
                  {inputType === 'text' && 'Custom Text'}
                  {inputType === 'email' && 'Email Address'}
                  {inputType === 'phone' && 'Phone Number'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className={`w-full p-4 pr-12 bg-gray-50 rounded-2xl border-2 focus:bg-white outline-none text-lg transition-all font-medium ${
                      error ? 'border-red-200 focus:border-red-500' : 'border-transparent focus:border-blue-500'
                    }`}
                    placeholder={
                      inputType === 'url' ? 'https://example.com' :
                      inputType === 'whatsapp' ? 'Phone number with country code' :
                      inputType === 'text' ? 'Type anything here...' :
                      inputType === 'email' ? 'someone@example.com' :
                      'Enter phone number'
                    }
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      setError(null);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && validateAndGenerate()}
                  />
                  {inputValue && (
                    <button 
                      onClick={() => setInputValue('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-300 hover:text-gray-500"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {error && (
                  <div className="mt-2 flex items-center space-x-1 text-red-500 animate-in slide-in-from-top-1">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-xs font-bold">{error}</span>
                  </div>
                )}
              </div>

              <button
                onClick={validateAndGenerate}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg flex items-center justify-center space-x-2 shadow-xl hover:bg-blue-700 transition-all active:scale-95"
              >
                <Sparkles className="w-5 h-5" />
                <span>Generate QR Code</span>
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[32px] shadow-xl border border-gray-100 flex flex-col items-center justify-center text-center">
            <h3 className="font-black text-gray-800 mb-6 uppercase tracking-widest text-xs">QR Preview</h3>
            
            <div ref={qrRef} className="p-4 bg-gray-50 rounded-3xl border-4 border-white shadow-inner mb-6 transition-all duration-500">
              {qrValue ? (
                <QRCodeCanvas 
                  value={qrValue} 
                  size={180} 
                  level="H" 
                  includeMargin={true}
                  className="rounded-lg"
                />
              ) : (
                <div className="w-[180px] h-[180px] flex items-center justify-center">
                  <QrCode className="w-16 h-16 text-gray-200" />
                </div>
              )}
            </div>

            {qrValue ? (
              <div className="w-full space-y-3">
                <button
                  onClick={downloadQR}
                  className="w-full py-3 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg hover:bg-green-700 transition-all active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PNG</span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={copyData}
                    className="py-3 bg-gray-100 text-gray-600 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-gray-200 transition-all active:scale-95 text-xs"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={reset}
                    className="py-3 bg-gray-100 text-gray-600 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-gray-200 transition-all active:scale-95 text-xs"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 font-bold leading-relaxed">
                Enter your data and click generate to see your custom QR code here.
              </p>
            )}
          </div>

          <div className="bg-blue-600 p-6 rounded-[32px] text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
              <QrCode className="w-20 h-20" />
            </div>
            <h4 className="font-black text-lg mb-2 flex items-center space-x-2">
              <ExternalLink className="w-4 h-4" />
              <span>Free Forever</span>
            </h4>
            <p className="text-xs text-blue-100 leading-relaxed font-medium">
              Create unlimited static QR codes without any hidden costs or expiration dates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
