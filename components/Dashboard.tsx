
import React from 'react';
import { LayoutDashboard, FileVideo, FileAudio, Clock, ChevronRight, BarChart, History, ArrowLeft, Trash2 } from 'lucide-react';
import { HistoryItem } from '../types.ts';

interface DashboardProps {
  history: HistoryItem[];
  onBack: () => void;
  onSelectItem: (item: HistoryItem) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ history, onBack, onSelectItem }) => {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-xl">
            <LayoutDashboard className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Project Dashboard</h1>
            <p className="text-sm text-gray-500">Analysis and history of your conversions</p>
          </div>
        </div>
        <button 
          onClick={onBack}
          className="flex items-center space-x-2 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors font-bold border border-blue-100 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>New Conversion</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
          <div className="bg-blue-50 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
            <History className="text-blue-600 w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Projects</p>
          <p className="text-3xl font-extrabold text-gray-900">{history.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
          <div className="bg-green-50 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
            <BarChart className="text-green-600 w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Success Rate</p>
          <p className="text-3xl font-extrabold text-gray-900">100%</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
          <div className="bg-purple-50 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
            <Clock className="text-purple-600 w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Time Saved</p>
          <p className="text-3xl font-extrabold text-gray-900">{history.length * 45}m</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="px-8 py-5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-700">Recent Transcriptions</h3>
        </div>

        {history.length === 0 ? (
          <div className="p-12 text-center">
            <FileVideo className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No history items yet. Start by uploading a file!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {history.map((item) => (
              <div 
                key={item.id} 
                className="group p-6 hover:bg-blue-50/30 transition-all flex items-center justify-between cursor-pointer"
                onClick={() => onSelectItem(item)}
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-gray-100 group-hover:bg-blue-100 p-3 rounded-2xl transition-colors">
                    {item.tool === 'video' ? (
                      <FileVideo className="text-gray-400 group-hover:text-blue-600 w-6 h-6" />
                    ) : (
                      <FileAudio className="text-gray-400 group-hover:text-blue-600 w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors truncate max-w-[200px] md:max-w-md">{item.fileName}</h4>
                    <div className="flex items-center space-x-3 text-xs text-gray-400 mt-1">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{item.date}</span>
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 rounded-md uppercase font-bold text-[10px] tracking-tighter">
                        {item.result.detectedLanguage}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md uppercase font-bold text-[10px] tracking-tighter ${item.tool === 'video' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                        {item.tool}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={(e) => { e.stopPropagation(); /* Logic for deletion */ }}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <div className="p-2 rounded-xl bg-gray-50 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
