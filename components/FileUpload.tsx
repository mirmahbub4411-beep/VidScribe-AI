
import React, { useState, useRef } from 'react';
import { Upload, FileVideo, X, CheckCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
        onFileSelect(droppedFile);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        onFileSelect(selectedFile);
      }
    }
  };

  const validateFile = (file: File) => {
    const validTypes = ['video/mp4', 'video/x-matroska', 'video/quicktime', 'video/x-msvideo'];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a valid video file (MP4, MKV, MOV, or AVI)");
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
      className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 text-center ${
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
        accept="video/mp4,video/x-matroska,video/quicktime,video/x-msvideo"
        className="hidden"
        onChange={handleChange}
      />

      <div className="flex flex-col items-center justify-center space-y-4">
        {file ? (
          <div className="flex items-center space-x-3 text-blue-600 font-medium">
            <FileVideo className="w-8 h-8" />
            <span>{file.name}</span>
            <button 
              onClick={() => setFile(null)}
              className="p-1 hover:bg-red-50 text-red-500 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="p-4 bg-blue-50 rounded-full">
              <Upload className="w-10 h-10 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-800">Drag & Drop Video</p>
              <p className="text-sm text-gray-500 mt-1">MP4, MKV, MOV, AVI up to 500MB</p>
            </div>
            <button
              onClick={() => inputRef.current?.click()}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              Browse Files
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
