
import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, CreditCard, Wallet, CheckCircle2, Copy, ExternalLink, ArrowRight, Info, QrCode } from 'lucide-react';
import { Package } from '../types.ts';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackage: Package | null;
  packages: Package[];
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, selectedPackage, packages }) => {
  const [currency, setCurrency] = useState<'BDT' | 'USD'>('BDT');
  const [currentPkg, setCurrentPkg] = useState<Package | null>(selectedPackage);
  const [step, setStep] = useState(1);
  const [accountName, setAccountName] = useState('');
  const [method, setMethod] = useState('');
  const [txnId, setTxnId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Set default method when currency changes or entering step 2
  useEffect(() => {
    if (step === 2) {
      if (currency === 'USD') setMethod('binance');
      else if (!method) setMethod('bkash');
    }
  }, [step, currency]);

  if (!isOpen) return null;

  const activePkg = currentPkg || packages[0];
  const price = currency === 'BDT' ? activePkg.bdt : activePkg.usd;
  const symbol = currency === 'BDT' ? '৳' : '$';

  const handleVerify = () => {
    if (!txnId || !accountName || !method) return;
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setStep(3);
    }, 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const binanceAddress = 'TCamrw7cnD5oLz5hu1ALFTKpsjo25z9NdE';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-blue-600 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5" />
            <span className="font-bold">Secure Checkout</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Account Name</label>
                <input 
                  type="text" 
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Currency</label>
                  <select 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-bold text-blue-600"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as 'BDT' | 'USD')}
                  >
                    <option value="BDT">BDT (Local)</option>
                    <option value="USD">USD (Crypto)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Package</label>
                  <select 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-bold"
                    value={activePkg.id}
                    onChange={(e) => setCurrentPkg(packages.find(p => p.id === e.target.value) || null)}
                  >
                    {packages.map(p => <option key={p.id} value={p.id}>{p.duration}</option>)}
                  </select>
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-2xl flex items-center justify-between border border-blue-100">
                <div>
                  <p className="text-xs font-bold text-blue-400 uppercase">Total Amount</p>
                  <p className="text-3xl font-black text-blue-900">{symbol}{price}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-600">{activePkg.name}</p>
                  <p className="text-xs text-gray-400">Validity: {activePkg.duration}</p>
                </div>
              </div>

              <button 
                onClick={() => setStep(2)}
                disabled={!accountName}
                className={`w-full py-4 rounded-xl font-black text-lg flex items-center justify-center space-x-2 shadow-xl transition-all active:scale-95 ${accountName ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
              >
                <span>Pay Now</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="text-center">
                <p className="text-sm font-bold text-gray-400 uppercase">Payment Method</p>
                <div className="flex items-center justify-center space-x-4 mt-3">
                  {currency === 'BDT' ? (
                    <>
                      <button onClick={() => setMethod('bkash')} className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${method === 'bkash' ? 'border-pink-500 bg-pink-50' : 'border-gray-100 hover:border-gray-200'}`}>
                        <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-1"><CreditCard className="text-pink-600" /></div>
                        <span className="text-[10px] font-black uppercase text-pink-600">bKash</span>
                      </button>
                      <button onClick={() => setMethod('nagad')} className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${method === 'nagad' ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-gray-200'}`}>
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-1"><CreditCard className="text-orange-600" /></div>
                        <span className="text-[10px] font-black uppercase text-orange-600">Nagad</span>
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setMethod('binance')} className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${method === 'binance' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-100 hover:border-gray-200'}`}>
                      <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-1"><Wallet className="text-yellow-600" /></div>
                      <span className="text-[10px] font-black uppercase text-yellow-600">Binance</span>
                    </button>
                  )}
                </div>
              </div>

              {method && (
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4 animate-in fade-in zoom-in duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Payment Details</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase">Active</span>
                  </div>

                  {method === 'binance' && (
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 text-center space-y-5 shadow-sm">
                      <p className="text-lg font-black text-gray-800">Deposit USDT to Binance</p>
                      
                      {/* QR Code Section - Dynamically generated for the address */}
                      <div className="mx-auto w-48 h-48 bg-white p-3 border-2 border-gray-50 rounded-[32px] shadow-inner flex items-center justify-center">
                         <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${binanceAddress}`} 
                          alt="USDT TRC20 QR Code"
                          className="w-full h-full object-contain"
                         />
                      </div>

                      <div className="space-y-4 pt-2 text-left bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400 font-bold uppercase tracking-tighter">Network</span>
                          <span className="font-black text-gray-900 px-2 py-1 bg-blue-50 text-blue-600 rounded">Tron (TRC20)</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-gray-400 font-bold uppercase tracking-tighter text-[10px]">Wallet Address</span>
                          <div className="flex items-center justify-between gap-2">
                             <span className="font-mono font-black text-gray-900 break-all text-xs leading-relaxed">{binanceAddress}</span>
                             <button 
                                onClick={() => copyToClipboard(binanceAddress)}
                                className="p-2 bg-white hover:bg-gray-100 rounded-lg text-gray-400 transition-colors border border-gray-100 shadow-sm shrink-0"
                             >
                                <Copy className="w-3.5 h-3.5" />
                             </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 pt-1 text-center">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Important Safety Info</p>
                        <div className="text-[10px] text-gray-500 font-medium leading-normal bg-orange-50/50 p-3 rounded-xl border border-orange-100 text-left space-y-1">
                          <p>• Don't send NFTs to this address.</p>
                          <p>• Smart contract deposits are not supported (except ETH via standard methods).</p>
                          <p>• Ensure you use the <span className="font-black text-red-500 underline">TRC20</span> network ONLY.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {method !== 'binance' && (
                    <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100">
                      <div className="truncate pr-4">
                        <p className="text-xs text-gray-400 font-bold mb-1 uppercase tracking-tighter">
                          Personal Number
                        </p>
                        <p className="font-black text-gray-800 font-mono text-lg">
                          01972004210
                        </p>
                      </div>
                      <button 
                        onClick={() => copyToClipboard('01972004210')}
                        className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {method !== 'binance' && (
                    <div className="flex items-start space-x-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-[10px] text-blue-700 font-bold leading-tight uppercase">
                        Please send the exact amount as {price} {currency} to the personal number above.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2 pt-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase">Transaction ID / Link</label>
                    <input 
                      type="text" 
                      placeholder="Paste Txn ID here"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm shadow-sm"
                      value={txnId}
                      onChange={(e) => setTxnId(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button onClick={() => setStep(1)} className="px-6 py-4 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">Back</button>
                <button 
                  onClick={handleVerify}
                  disabled={!txnId || isVerifying}
                  className={`flex-1 py-4 rounded-xl font-black flex items-center justify-center space-x-2 shadow-lg transition-all active:scale-95 ${txnId && !isVerifying ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                >
                  {isVerifying ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Verify Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-12 space-y-6 animate-in zoom-in duration-500">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto ring-8 ring-green-50">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-gray-900">Payment Verified!</h2>
                <p className="text-gray-500 mt-2 max-w-xs mx-auto">Your {activePkg.duration} Pro membership has been activated. Thank you for subscribing!</p>
              </div>
              <button 
                onClick={onClose}
                className="px-10 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl hover:shadow-blue-200 active:scale-95"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
