
import React, { useState, useRef, useEffect } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { 
  QrCode, 
  Download, 
  RotateCcw, 
  Copy, 
  User, 
  Briefcase, 
  Building2, 
  IdCard, 
  Globe, 
  Type, 
  Image as ImageIcon, 
  Calendar, 
  Printer, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  ChevronRight,
  Info,
  ChevronDown,
  FileImage,
  FileText,
  CreditCard,
  Zap,
  Loader2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

type QRCategory = 'personal' | 'business' | 'corporate' | 'employee' | 'url' | 'text';

const SmartQRGenerator: React.FC = () => {
  const [category, setCategory] = useState<QRCategory>('url');
  const [formData, setFormData] = useState<any>({});
  const [logo, setLogo] = useState<string | null>(null);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [qrValue, setQrValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const qrRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const categories = [
    { id: 'url', label: 'Website URL', icon: Globe, color: 'blue' },
    { id: 'personal', label: 'Personal Contact', icon: User, color: 'indigo' },
    { id: 'business', label: 'Shop / Business', icon: Briefcase, color: 'emerald' },
    { id: 'corporate', label: 'Corporate Office', icon: Building2, color: 'slate' },
    { id: 'employee', label: 'Employee ID', icon: IdCard, color: 'orange' },
    { id: 'text', label: 'Custom Text', icon: Type, color: 'rose' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowDownloadMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogo(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const generatevCard = (data: any) => {
    return `BEGIN:VCARD
VERSION:3.0
FN:${data.name || ''}
TEL:${data.phone || ''}
EMAIL:${data.email || ''}
ADR:${data.address || ''}
URL:${data.website || ''}
END:VCARD`;
  };

  const validateAndGenerate = () => {
    setError(null);
    const data = { ...formData };
    
    if (Object.keys(data).length === 0 || (category === 'url' && !data.url)) {
      setError('Please fill in the required fields');
      return;
    }

    if (expiryDate) {
      data._expiry = expiryDate;
    }

    let finalValue = '';
    if (category === 'url') {
      finalValue = data.url.startsWith('http') ? data.url : `https://${data.url}`;
    } else if (category === 'personal') {
      finalValue = generatevCard(data);
    } else if (category === 'text') {
      finalValue = data.text || '';
    } else {
      finalValue = JSON.stringify({ category, ...data });
    }

    setQrValue(finalValue);
  };

  const downloadAsset = async (type: 'qr' | 'card', format: 'png' | 'jpg' | 'pdf') => {
    if (!qrValue) return;
    setIsExporting(true);
    setShowDownloadMenu(false);

    try {
      const fileName = `VidScribe_${type}_${Date.now()}`;
      
      let elementToCapture: HTMLElement | null = null;
      if (type === 'qr') {
        elementToCapture = qrRef.current;
      } else {
        elementToCapture = cardRef.current;
      }

      if (!elementToCapture) throw new Error("Target element not found for capture.");

      // Important: Ensure the element is not "display: none" during capture
      // We use the hidden capture area method
      const canvas = await html2canvas(elementToCapture, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: type === 'qr' ? '#ffffff' : null,
      });

      if (format === 'pdf') {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF(type === 'card' ? 'l' : 'p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth - 20, Math.min(pdfHeight, pdf.internal.pageSize.getHeight() - 20));
        pdf.save(`${fileName}.pdf`);
      } else {
        const url = canvas.toDataURL(`image/${format === 'jpg' ? 'jpeg' : 'png'}`, 1.0);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}.${format}`;
        link.click();
      }
    } catch (err) {
      console.error("Export Error:", err);
      alert("Something went wrong during export. Please ensure the form is filled correctly.");
    } finally {
      setIsExporting(false);
    }
  };

  const printQR = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const canvas = qrRef.current?.querySelector('canvas');
      const dataUrl = canvas?.toDataURL('image/png');
      printWindow.document.write(`
        <html>
          <head><title>Print QR Code</title></head>
          <body style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif;">
            <h1 style="margin-bottom:20px;">${categories.find(c => c.id === category)?.label} QR</h1>
            <img src="${dataUrl}" style="width:300px; height:300px;" />
            <p style="margin-top:20px; color:#666;">Generated by VidScribe Smart QR Tool</p>
            <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const reset = () => {
    setFormData({});
    setQrValue('');
    setLogo(null);
    setExpiryDate('');
    setError(null);
  };

  const creationDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      <header className="text-center">
        <div className="inline-flex items-center justify-center p-4 bg-blue-600 rounded-[24px] mb-4 shadow-xl">
          <QrCode className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">Smart QR <span className="text-blue-600">Generator</span></h2>
        <p className="mt-2 text-gray-500 font-medium text-lg">Professional, scannable QR codes for every business need.</p>
      </header>

      {/* HIDDEN CAPTURE AREA (Fixes download issue) */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
        {(category === 'personal' || category === 'business' || category === 'employee') && (
          <div ref={cardRef} style={{ width: '600px', height: '360px' }}>
            <div className="w-full h-full relative overflow-hidden rounded-[32px] bg-gradient-to-br from-gray-900 via-slate-800 to-black text-white p-10 border border-white/10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px] -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-[60px] -ml-24 -mb-24"></div>
              
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                       <Zap className="w-5 h-5 text-blue-500 fill-current" />
                       <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">VidScribe Smart Card</span>
                    </div>
                    <h4 className="text-3xl font-black tracking-tight leading-none uppercase">
                      {formData.name || formData.shopName || formData.empName || 'YOUR NAME'}
                    </h4>
                    <p className="text-[11px] font-bold text-blue-400 mt-2 uppercase tracking-widest">
                      {categories.find(c => c.id === category)?.label} Verified
                    </p>
                  </div>
                  {logo ? (
                    <img src={logo} className="w-16 h-16 object-contain rounded-xl bg-white/5 p-2" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                      <CreditCard className="w-8 h-8 opacity-20" />
                    </div>
                  )}
                </div>

                <div className="flex items-end justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-6">
                       <div>
                          <p className="text-[8px] font-black uppercase opacity-40 mb-1">Issue Date</p>
                          <p className="text-xs font-mono font-bold">{creationDate}</p>
                       </div>
                       <div>
                          <p className="text-[8px] font-black uppercase opacity-40 mb-1">Valid Thru</p>
                          <p className="text-xs font-mono font-bold">{expiryDate ? new Date(expiryDate).toLocaleDateString('en-GB') : 'LIFETIME'}</p>
                       </div>
                    </div>
                    <p className="text-[10px] font-medium opacity-40 italic">Scan to view full details and contact information.</p>
                  </div>
                  
                  {qrValue && (
                    <div className="p-3 bg-white rounded-2xl shadow-2xl">
                      <QRCodeCanvas value={qrValue} size={100} level="H" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT: SETTINGS & FORMS */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[40px] p-6 md:p-10 shadow-2xl border border-gray-100">
            {/* Category Selector */}
            <div className="mb-10">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Select Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setCategory(cat.id as QRCategory); reset(); }}
                    className={`flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all group ${
                      category === cat.id 
                      ? `border-blue-600 bg-blue-50 text-blue-600` 
                      : 'border-gray-50 text-gray-400 hover:border-blue-200'
                    }`}
                  >
                    <cat.icon className={`w-6 h-6 mb-2 group-hover:scale-110 transition-transform`} />
                    <span className="text-[9px] font-black uppercase tracking-tighter text-center leading-tight">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {category === 'url' && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Website Link</label>
                  <input type="text" placeholder="https://yourwebsite.com" className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-blue-500 outline-none text-lg font-bold" value={formData.url || ''} onChange={(e) => handleInputChange('url', e.target.value)} />
                </div>
              )}

              {category === 'personal' && (
                <>
                  <div className="md:col-span-1"><label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Full Name</label><input type="text" placeholder="e.g. John Doe" className="w-full p-3 bg-gray-50 rounded-xl outline-none border border-transparent focus:border-blue-200 transition-all font-bold" value={formData.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} /></div>
                  <div className="md:col-span-1"><label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Phone</label><input type="text" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={formData.phone || ''} onChange={(e) => handleInputChange('phone', e.target.value)} /></div>
                  <div className="md:col-span-1"><label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Email</label><input type="email" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={formData.email || ''} onChange={(e) => handleInputChange('email', e.target.value)} /></div>
                  <div className="md:col-span-1"><label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Website</label><input type="text" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={formData.website || ''} onChange={(e) => handleInputChange('website', e.target.value)} /></div>
                  <div className="md:col-span-2"><label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Address</label><input type="text" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={formData.address || ''} onChange={(e) => handleInputChange('address', e.target.value)} /></div>
                </>
              )}

              {category === 'business' && (
                <>
                  <div className="md:col-span-1"><label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Shop/Brand Name</label><input type="text" className="w-full p-3 bg-gray-50 rounded-xl outline-none font-bold" value={formData.shopName || ''} onChange={(e) => handleInputChange('shopName', e.target.value)} /></div>
                  <div className="md:col-span-1"><label className="block text-[10px] font-black text-gray-400 uppercase mb-1">WhatsApp</label><input type="text" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={formData.whatsapp || ''} onChange={(e) => handleInputChange('whatsapp', e.target.value)} /></div>
                  <div className="md:col-span-2"><label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Google Maps Link</label><input type="text" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={formData.map || ''} onChange={(e) => handleInputChange('map', e.target.value)} /></div>
                  <div className="md:col-span-2"><label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Short Description</label><textarea className="w-full p-3 bg-gray-50 rounded-xl outline-none" rows={2} value={formData.desc || ''} onChange={(e) => handleInputChange('desc', e.target.value)} /></div>
                </>
              )}

              {category === 'employee' && (
                <>
                  <div className="md:col-span-1"><label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Employee Name</label><input type="text" className="w-full p-3 bg-gray-50 rounded-xl outline-none font-bold" value={formData.empName || ''} onChange={(e) => handleInputChange('empName', e.target.value)} /></div>
                  <div className="md:col-span-1"><label className="block text-[10px] font-black text-gray-400 uppercase mb-1">ID Number</label><input type="text" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={formData.idNum || ''} onChange={(e) => handleInputChange('idNum', e.target.value)} /></div>
                  <div className="md:col-span-1"><label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Department</label><input type="text" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={formData.dept || ''} onChange={(e) => handleInputChange('dept', e.target.value)} /></div>
                  <div className="md:col-span-1"><label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Position</label><input type="text" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={formData.pos || ''} onChange={(e) => handleInputChange('pos', e.target.value)} /></div>
                </>
              )}

              {category === 'text' && (
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Message / Content</label>
                  <textarea className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none font-medium" rows={5} placeholder="Type your text content here..." value={formData.text || ''} onChange={(e) => handleInputChange('text', e.target.value)} />
                </div>
              )}

              {/* Shared Options */}
              <div className="md:col-span-1 border-t pt-6 mt-4">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Add Brand Logo</label>
                <button onClick={() => logoInputRef.current?.click()} className="flex items-center space-x-3 p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 w-full hover:bg-blue-100 transition-colors">
                  <ImageIcon className="w-4 h-4" />
                  <span className="text-xs font-black uppercase truncate">{logo ? 'Logo Uploaded' : 'Select Image'}</span>
                </button>
                <input type="file" ref={logoInputRef} hidden accept="image/*" onChange={handleLogoUpload} />
              </div>

              <div className="md:col-span-1 border-t pt-6 mt-4">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Expiry Date (Optional)</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="date" className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl outline-none text-xs font-bold" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-6 flex items-center space-x-2 text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">{error}</span>
              </div>
            )}

            <button onClick={validateAndGenerate} className="w-full mt-8 py-5 bg-blue-600 text-white rounded-[24px] font-black text-xl flex items-center justify-center space-x-3 shadow-2xl hover:bg-blue-700 transition-all active:scale-[0.98]">
              <Sparkles className="w-6 h-6" />
              <span>Generate Smart QR</span>
            </button>
          </div>
        </div>

        {/* RIGHT: PREVIEW & ACTIONS */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 md:p-10 rounded-[40px] shadow-2xl border border-gray-100 flex flex-col items-center sticky top-24">
            <h3 className="font-black text-gray-800 mb-8 uppercase tracking-[0.2em] text-xs">Live Preview</h3>
            
            <div ref={qrRef} className="p-6 bg-white rounded-[32px] border-8 border-gray-50 shadow-inner mb-10 transition-all duration-700 relative">
              {qrValue ? (
                <>
                  <QRCodeCanvas 
                    value={qrValue} 
                    size={200} 
                    level="H" 
                    includeMargin={false}
                    imageSettings={logo ? { src: logo, height: 40, width: 40, excavate: true } : undefined}
                  />
                  {/* Hidden SVG for high-quality path calculation if needed */}
                  <div className="hidden">
                    <QRCodeSVG value={qrValue} size={1000} level="H" imageSettings={logo ? { src: logo, height: 200, width: 200, excavate: true } : undefined} />
                  </div>
                </>
              ) : (
                <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-50 rounded-2xl">
                  <QrCode className="w-20 h-20 text-gray-200" />
                </div>
              )}
            </div>

            {qrValue ? (
              <div className="w-full space-y-3">
                <div className="relative" ref={menuRef}>
                  <button 
                    onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center space-x-3 shadow-lg hover:bg-blue-700 transition-all active:scale-95 group"
                    disabled={isExporting}
                  >
                    {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5 group-hover:bounce" />}
                    <span>{isExporting ? 'Processing...' : 'Download Smart Asset'}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showDownloadMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {showDownloadMenu && (
                    <div className="absolute bottom-full left-0 mb-3 w-full bg-white rounded-[24px] shadow-2xl border border-gray-100 p-2 z-50 animate-in slide-in-from-bottom-4 duration-300">
                      <div className="p-3">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 px-2">Download Formats</p>
                        
                        {/* Smart Card Options (Only for contact/business types) */}
                        {(category === 'personal' || category === 'business' || category === 'employee') && (
                          <div className="mb-4 space-y-1">
                            <div className="flex items-center space-x-2 px-2 py-1 mb-1">
                               <CreditCard className="w-3 h-3 text-indigo-500" />
                               <span className="text-[10px] font-black text-indigo-900 uppercase">Premium Smart Card</span>
                            </div>
                            <button onClick={() => downloadAsset('card', 'png')} className="w-full flex items-center justify-between p-3 hover:bg-indigo-50 rounded-xl transition-all group">
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><FileImage className="w-4 h-4" /></div>
                                <span className="text-xs font-bold text-gray-700">Card as PNG</span>
                              </div>
                              <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                            </button>
                            <button onClick={() => downloadAsset('card', 'pdf')} className="w-full flex items-center justify-between p-3 hover:bg-indigo-50 rounded-xl transition-all group">
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-rose-100 rounded-lg text-rose-600"><FileText className="w-4 h-4" /></div>
                                <span className="text-xs font-bold text-gray-700">Card as PDF</span>
                              </div>
                              <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-rose-500 transition-colors" />
                            </button>
                          </div>
                        )}

                        <div className="h-[1px] bg-gray-50 my-2"></div>

                        {/* Standard QR Options */}
                        <div className="space-y-1">
                           <div className="flex items-center space-x-2 px-2 py-1 mb-1">
                               <QrCode className="w-3 h-3 text-blue-500" />
                               <span className="text-[10px] font-black text-blue-900 uppercase">Basic QR Code</span>
                            </div>
                            <button onClick={() => downloadAsset('qr', 'png')} className="w-full flex items-center justify-between p-3 hover:bg-blue-50 rounded-xl transition-all group">
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><ImageIcon className="w-4 h-4" /></div>
                                <span className="text-xs font-bold text-gray-700">QR Code (PNG)</span>
                              </div>
                              <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-blue-500" />
                            </button>
                            <button onClick={() => downloadAsset('qr', 'jpg')} className="w-full flex items-center justify-between p-3 hover:bg-blue-50 rounded-xl transition-all group">
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><FileImage className="w-4 h-4" /></div>
                                <span className="text-xs font-bold text-gray-700">QR Code (JPG)</span>
                              </div>
                              <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-emerald-500" />
                            </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button onClick={printQR} className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-gray-200 transition-all active:scale-95 text-xs">
                  <Printer className="w-4 h-4" />
                  <span>Quick Print QR</span>
                </button>

                <button onClick={reset} className="w-full py-3 bg-white border-2 border-gray-100 text-gray-400 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-gray-50 transition-all text-sm mt-4">
                  <RotateCcw className="w-4 h-4" />
                  <span>Clear Form</span>
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4 px-4">
                <p className="text-sm text-gray-400 font-bold leading-relaxed">
                  Start typing to generate your smart QR code and premium ID card. Standard phone scanners will read this data instantly.
                </p>
                <div className="flex items-center justify-center space-x-2 text-indigo-500 font-black uppercase text-[9px] tracking-widest">
                  <Info className="w-3 h-3" />
                  <span>Premium Card Generation Enabled</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartQRGenerator;
