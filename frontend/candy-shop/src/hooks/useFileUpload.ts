import { useState, useCallback } from 'react';
import { apiClient } from '../lib/api-client';
import type { UploadResult } from '../types/skill-creator';

interface UploadProgress {
  [fileName: string]: number;
}

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({});
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const uploadFiles = useCallback(async (files: File[]) => {
    setIsUploading(true);
    setError(null);
    setUploadResult(null);

    // Initialize progress for all files
    const initialProgress: UploadProgress = {};
    files.forEach(file => {
      initialProgress[file.name] = 0;
    });
    setProgress(initialProgress);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(key => {
            if (updated[key] < 90) {
              updated[key] = Math.min(90, updated[key] + 10);
            }
          });
          return updated;
        });
      }, 200);

      const result = await apiClient.uploadFiles(files);

      clearInterval(progressInterval);

      // Set all to 100%
      const completeProgress: UploadProgress = {};
      files.forEach(file => {
        completeProgress[file.name] = 100;
      });
      setProgress(completeProgress);

      setUploadResult(result);
      setIsUploading(false);

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
      setIsUploading(false);
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress({});
    setError(null);
    setUploadResult(null);
  }, []);

  return {
    uploadFiles,
    isUploading,
    progress,
    error,
    uploadResult,
    reset,
  };
}
