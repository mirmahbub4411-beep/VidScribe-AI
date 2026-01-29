
import React, { useState } from 'react';
import { X, Mail, Lock, User, Globe, Phone, ShieldCheck, LogIn, UserPlus } from 'lucide-react';
import { User as UserType } from '../types.ts';

interface AuthModalsProps {
  type: 'signin' | 'signup' | null;
  onClose: () => void;
  onSuccess: (user: UserType) => void;
}

const countries = [
  { name: 'Bangladesh', code: '+880' },
  { name: 'United States', code: '+1' },
  { name: 'United Kingdom', code: '+44' },
  { name: 'India', code: '+91' },
  { name: 'Canada', code: '+1' },
  { name: 'Germany', code: '+49' },
];

const AuthModals: React.FC<AuthModalsProps> = ({ type, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    country: 'Bangladesh',
    phoneCode: '+880',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  if (!type) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    onSuccess({
      name: formData.name || 'Demo User',
      email: formData.email,
      country: formData.country,
      phone: `${formData.phoneCode}${formData.phone}`,
      password: formData.password
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {type === 'signin' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {type === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      required
                      type="text" 
                      placeholder="John Doe"
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Country</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select 
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm appearance-none"
                        value={formData.country}
                        onChange={e => {
                          const c = countries.find(x => x.name === e.target.value);
                          setFormData({...formData, country: e.target.value, phoneCode: c?.code || '+880'});
                        }}
                      >
                        {countries.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number</label>
                    <div className="flex space-x-2">
                      <span className="flex items-center justify-center px-2 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 min-w-[50px]">
                        {formData.phoneCode}
                      </span>
                      <input 
                        required
                        type="tel" 
                        placeholder="12345678"
                        className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address / Phone</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  required
                  type="text" 
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  required
                  type="password" 
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            {type === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    required
                    type="password" 
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                  />
                </div>
              </div>
            )}

            <button 
              type="submit"
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg active:scale-[0.98] flex items-center justify-center space-x-2"
            >
              {type === 'signin' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              <span>{type === 'signin' ? 'Sign In Now' : 'Create My Account'}</span>
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              {type === 'signin' ? "Don't have an account?" : "Already have an account?"}{' '}
              <button 
                onClick={() => {}} // In real app, toggle type
                className="text-blue-600 font-bold hover:underline"
              >
                {type === 'signin' ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModals;
