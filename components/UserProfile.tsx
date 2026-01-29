
import React, { useState } from 'react';
import { User, Mail, Phone, Lock, Eye, EyeOff, Globe, ArrowLeft, ShieldCheck } from 'lucide-react';
import { User as UserType } from '../types.ts';

interface UserProfileProps {
  user: UserType;
  onBack: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onBack }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={onBack}
        className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 mb-8 transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to App</span>
      </button>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-12 text-white relative">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border-4 border-white/30 shadow-2xl">
              <User className="w-12 h-12 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{user.name}</h1>
              <div className="flex items-center space-x-2 mt-1 opacity-80">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-sm font-semibold uppercase tracking-wider">Unlimited Pro Member</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <h2 className="text-xl font-bold text-gray-800 border-b border-gray-100 pb-4">Account Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Email Address</label>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <Mail className="w-4 h-4 text-blue-500" />
                <span className="text-gray-700 font-medium">{user.email}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Phone Number</label>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <Phone className="w-4 h-4 text-green-500" />
                <span className="text-gray-700 font-medium">{user.phone}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Country</label>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <Globe className="w-4 h-4 text-purple-500" />
                <span className="text-gray-700 font-medium">{user.country}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Account Password</label>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center space-x-3">
                  <Lock className="w-4 h-4 text-orange-500" />
                  <span className="text-gray-700 font-medium">
                    {showPassword ? (user.password || '********') : '••••••••'}
                  </span>
                </div>
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 hover:bg-gray-200 rounded-md transition-colors text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
            <button className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg">
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
