// File validation utilities

export const SUPPORTED_FILE_TYPES = {
  text: ['.txt', '.md', '.json'],
  document: ['.pdf', '.docx'],
  code: ['.js', '.ts', '.py', '.java', '.tsx', '.jsx'],
};

export const ALL_SUPPORTED_EXTENSIONS = [
  ...SUPPORTED_FILE_TYPES.text,
  ...SUPPORTED_FILE_TYPES.document,
  ...SUPPORTED_FILE_TYPES.code,
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
export const MAX_FILES = 10;

export interface ValidationError {
  file: string;
  error: string;
}

export function validateFileType(file: File): boolean {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  return ALL_SUPPORTED_EXTENSIONS.includes(extension);
}

export function validateFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

export function validateFiles(files: File[]): {
  valid: File[];
  errors: ValidationError[];
} {
  const valid: File[] = [];
  const errors: ValidationError[] = [];

  if (files.length > MAX_FILES) {
    errors.push({
      file: 'general',
      error: `Maximum ${MAX_FILES} files can be uploaded`,
    });
    return { valid, errors };
  }

  files.forEach((file) => {
    if (!validateFileType(file)) {
      errors.push({
        file: file.name,
        error: `Unsupported file type. Supported formats: ${ALL_SUPPORTED_EXTENSIONS.join(', ')}`,
      });
    } else if (!validateFileSize(file)) {
      errors.push({
        file: file.name,
        error: `File size exceeds limit (maximum ${MAX_FILE_SIZE / 1024 / 1024}MB)`,
      });
    } else {
      valid.push(file);
    }
  });

  return { valid, errors };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export function getFileExtension(filename: string): string {
  return '.' + filename.split('.').pop()?.toLowerCase() || '';
}

export function getFileCategory(filename: string): 'text' | 'document' | 'code' | 'other' {
  const ext = getFileExtension(filename);
  
  if (SUPPORTED_FILE_TYPES.text.includes(ext)) return 'text';
  if (SUPPORTED_FILE_TYPES.document.includes(ext)) return 'document';
  if (SUPPORTED_FILE_TYPES.code.includes(ext)) return 'code';
  
  return 'other';
}
