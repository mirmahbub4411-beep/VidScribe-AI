
import React from 'react';
import { Zap, Check, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { Package } from '../types.ts';

interface PricingProps {
  onSubscribe: (pkg: Package) => void;
  packages: Package[];
}

const Pricing: React.FC<PricingProps> = ({ onSubscribe, packages }) => {
  return (
    <div className="max-w-6xl mx-auto py-12 px-4 animate-in fade-in duration-700">
      <div className="text-center mb-16">
        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-bold mb-4">
          <Sparkles className="w-4 h-4" />
          <span>PRO FEATURES UNLOCKED</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-gray-900">Upgrade to VidScribe <span className="text-blue-600">Pro</span></h1>
        <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">Unlock unlimited audio transcription, priority AI processing, and multi-language support.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {packages.map((pkg) => (
          <div 
            key={pkg.id}
            className={`relative bg-white rounded-[32px] p-8 border-2 transition-all duration-500 hover:shadow-2xl group ${pkg.popular ? 'border-blue-500 shadow-xl ring-4 ring-blue-50' : 'border-gray-100 hover:border-blue-200'}`}
          >
            {pkg.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black rounded-full shadow-lg flex items-center space-x-1">
                <Star className="w-3 h-3 fill-current" />
                <span>MOST POPULAR</span>
              </div>
            )}

            <div className="text-center mb-8">
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2">{pkg.name}</p>
              <div className="flex items-baseline justify-center space-x-1">
                <span className="text-5xl font-black text-gray-900">৳{pkg.bdt}</span>
                <span className="text-gray-400 font-bold">/ {pkg.duration}</span>
              </div>
              <p className="text-blue-500 font-bold mt-2 text-sm">or ${pkg.usd} USD</p>
            </div>

            <div className="space-y-4 mb-8">
              {[
                "Unlimited Audio to Text",
                "Up to 2GB File Support",
                "Priority AI Processing",
                "Speaker Identification",
                "Concise AI Summaries",
                "24/7 Priority Support"
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center space-x-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-600 font-medium">{feature}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => onSubscribe(pkg)}
              className={`w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-95 flex items-center justify-center space-x-2 ${pkg.popular ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200' : 'bg-gray-900 text-white hover:bg-black'}`}
            >
              <Zap className="w-5 h-5" />
              <span>Subscribe</span>
            </button>
          </div>
        ))}
      </div>

      <div className="mt-20 bg-gray-900 rounded-[40px] p-10 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[120px] opacity-20 -mr-32 -mt-32"></div>
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-black mb-4">Trusted by over 10,000+ creators and businesses globally.</h2>
            <div className="flex items-center space-x-4">
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => <div key={i} className="w-10 h-10 rounded-full bg-gray-700 border-2 border-gray-900"></div>)}
              </div>
              <span className="text-sm font-bold text-gray-400">Join the elite transcription club.</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 bg-white/5 rounded-3xl border border-white/10 text-center">
              <ShieldCheck className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <p className="font-bold text-xl tracking-tight">100% Secure</p>
              <p className="text-[10px] text-gray-500 uppercase font-black">Encrypted Payments</p>
            </div>
            <div className="p-6 bg-white/5 rounded-3xl border border-white/10 text-center">
              <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
              <p className="font-bold text-xl tracking-tight">Instant</p>
              <p className="text-[10px] text-gray-500 uppercase font-black">Fast Verification</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
