import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, AlertCircle } from 'lucide-react';
import { 
  validateFiles, 
  formatFileSize, 
  ALL_SUPPORTED_EXTENSIONS,
  type ValidationError 
} from '../../utils/file-validation';

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
}

export function FileUploadZone({ onFilesSelected, maxFiles = 10 }: FileUploadZoneProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const { valid, errors: validationErrors } = validateFiles(acceptedFiles);
    
    setErrors(validationErrors);
    
    if (valid.length > 0) {
      const newFiles = [...selectedFiles, ...valid].slice(0, maxFiles);
      setSelectedFiles(newFiles);
      onFilesSelected(newFiles);
    }
  }, [selectedFiles, maxFiles, onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/json': ['.json'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/javascript': ['.js'],
      'text/typescript': ['.ts'],
      'text/x-python': ['.py'],
      'text/x-java': ['.java'],
      'text/jsx': ['.jsx'],
      'text/tsx': ['.tsx'],
    },
    maxFiles,
  });

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const clearAll = () => {
    setSelectedFiles([]);
    setErrors([]);
    onFilesSelected([]);
  };

  return (
    <div className="w-full space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
          transition-all duration-200
          ${isDragActive 
            ? 'border-primary bg-primary/10' 
            : 'border-gray-300 bg-gray-50 hover:border-primary/50 hover:bg-primary/5'
          }
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-4">
          <div className={`
            w-16 h-16 rounded-full flex items-center justify-center
            ${isDragActive ? 'bg-primary/30' : 'bg-gray-200'}
          `}>
            <Upload className={`w-8 h-8 ${isDragActive ? 'text-primary' : 'text-gray-500'}`} />
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-700 mb-1">
              {isDragActive ? 'Drop files here' : 'Drag files here or click to select'}
            </p>
            <p className="text-sm text-gray-500">
              Supported formats: {ALL_SUPPORTED_EXTENSIONS.join(', ')}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Max {maxFiles} files, 10MB each
            </p>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800 mb-2">Upload Errors</h4>
              <ul className="space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm text-red-700">
                    <span className="font-medium">{error.file}:</span> {error.error}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">
              {selectedFiles.length} file(s) selected
            </h4>
            <button
              onClick={clearAll}
              className="text-xs text-gray-500 hover:text-red-600 transition-colors"
            >
              Clear all
            </button>
          </div>
          
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors"
              >
                <File className="w-5 h-5 text-gray-400 flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                
                <button
                  onClick={() => removeFile(index)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                >
                  <X className="w-4 h-4 text-red-600" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
