
import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileVideo, FileAudio, X } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  acceptType: 'video' | 'audio';
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isProcessing, acceptType }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Clear file when switching tools
  useEffect(() => {
    setFile(null);
  }, [acceptType]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile && validateFile(droppedFile)) {
        setFile(droppedFile);
        onFileSelect(droppedFile);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile && validateFile(selectedFile)) {
        setFile(selectedFile);
        onFileSelect(selectedFile);
      }
    }
  };

  const validateFile = (file: File) => {
    const videoTypes = ['video/mp4', 'video/x-matroska', 'video/quicktime', 'video/x-msvideo'];
    const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/aac', 'audio/m4p', 'audio/m4a'];
    
    const validTypes = acceptType === 'video' ? videoTypes : audioTypes;
    
    // Fallback validation for mobile where mime type might be different
    const isVideoExtension = ['mp4', 'mkv', 'mov', 'avi'].some(ext => file.name.toLowerCase().endsWith(ext));
    const isAudioExtension = ['mp3', 'wav', 'm4a', 'aac', 'ogg'].some(ext => file.name.toLowerCase().endsWith(ext));

    const isValid = acceptType === 'video' ? (validTypes.includes(file.type) || isVideoExtension) : (validTypes.includes(file.type) || isAudioExtension);

    if (!isValid) {
      alert(`Please upload a valid ${acceptType} file`);
      return false;
    }
    if (file.size > 500 * 1024 * 1024) {
      alert("File size exceeds 500MB limit");
      return false;
    }
    return true;
  };

  return (
    <div 
      className={`relative border-2 border-dashed rounded-2xl p-6 md:p-10 transition-all duration-300 text-center ${
        dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white"
      } ${isProcessing ? "opacity-50 pointer-events-none" : "hover:border-blue-400"}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={acceptType === 'video' ? "video/*" : "audio/*"}
        className="hidden"
        onChange={handleChange}
      />

      <div className="flex flex-col items-center justify-center space-y-3 md:space-y-4">
        {file ? (
          <div className="flex items-center space-x-3 text-blue-600 font-medium animate-in fade-in zoom-in duration-300 bg-blue-50 px-4 py-3 rounded-xl border border-blue-100">
            {acceptType === 'video' ? <FileVideo className="w-6 h-6 md:w-8 md:h-8" /> : <FileAudio className="w-6 h-6 md:w-8 md:h-8" />}
            <span className="truncate max-w-[150px] md:max-w-[250px] text-xs md:text-sm font-bold">{file.name}</span>
            <button 
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="p-1.5 hover:bg-red-50 text-red-500 rounded-full transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="p-3 md:p-4 bg-blue-50 rounded-full">
              {acceptType === 'video' ? <FileVideo className="w-8 h-8 md:w-10 md:h-10 text-blue-600" /> : <FileAudio className="w-8 h-8 md:w-10 md:h-10 text-blue-600" />}
            </div>
            <div>
              <p className="text-lg md:text-xl font-bold text-gray-800">Select {acceptType === 'video' ? 'Video' : 'Audio'}</p>
              <p className="text-[10px] md:text-xs text-gray-400 mt-1 uppercase font-bold tracking-widest">
                {acceptType === 'video' ? 'MP4, MKV, MOV' : 'MP3, WAV, M4A'} • 500MB MAX
              </p>
            </div>
            <button
              onClick={() => inputRef.current?.click()}
              className="mt-2 md:mt-4 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg font-black text-sm active:scale-95"
            >
              Choose File
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
