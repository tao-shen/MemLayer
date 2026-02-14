import { useState, useRef } from 'react';
import { FileUp, Upload } from 'lucide-react';

interface FileUploadAreaProps {
  uploadedFiles: { name: string; size: number }[];
  onUpload: (files: File[]) => void;
  onRemoveFile: (idx: number) => void;
}

export function FileUploadArea({ uploadedFiles, onUpload, onRemoveFile }: FileUploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    const fileInput = fileInputRef.current;
    if (fileInput && e.dataTransfer?.items) {
      const files = e.dataTransfer.items as File[];
      for (const item of e.dataTransfer.items) {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            files.push(file);
          }
        }
      }
      onUpload(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files || []) : [];
    if (files.length > 0) {
      onUpload(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size > 10 * 1024 * 1024) { // 10MB limit
      alert(`文件太大: ${(file.size / 1024 / 1024).toFixed(2)} MB，请选择小于10MB的文件`);
      return;
    }
    onUpload(Array.from(e.target.files || []).filter((f) => f.size <= 10 * 1024 * 1024));
  };

  return (
    <div className="space-y-4 p-4 bg-blue-50/10 border border-blue-200 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <FileUp className="w-6 h-6 text-blue-400" />
        <span className="text-sm font-medium text-blue-800">上传文件</span>
      </div>

      {/* File Upload Warning */}
      {uploadedFiles.length > 0 && (
        <div className="mt-2 text-sm text-blue-600">
          已上传 {uploadedFiles.length} 个文件
        </div>
      )}

      {/* File Input */}
      <div className="mt-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.js,.ts,.json,.csv"
          multiple
          onChange={handleFileSelect}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          className="hidden"
        />
      </div>

      {/* Upload Button */}
      <div className="mt-3 flex justify-center">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadedFiles.length === 0}
          className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <Upload className="w-4 h-4" />
          <span className="ml-2">上传文件</span>
        </button>
      </div>

      {/* Remove Files */}
      {uploadedFiles.map((file, idx) => (
        <div
          key={idx}
          onClick={() => onRemoveFile(idx)}
          className="group flex items-center gap-2 px-3 py-2 bg-white/50 hover:bg-blue-100 rounded-lg transition-colors duration-200 cursor-pointer"
        >
          <FileText className="w-4 h-4 text-blue-600" />
          <div className="flex-1 min-w-0">
            <span className="font-medium text-blue-900 truncate max-w-[200px]">{file.name}</span>
            <span className="ml-auto text-xs text-blue-500">
              {(file.size / 1024).toFixed(2)} KB
            </span>
            <button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveFile(idx);
            }}
            className="ml-2 text-blue-400 hover:text-blue-600 transition-colors"
            aria-label="Remove file"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
