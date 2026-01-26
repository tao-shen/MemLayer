import { useState, useCallback, useEffect, useRef } from 'react';
import { apiClient } from '../lib/api-client';
import type { AnalysisResult, AnalysisStatus } from '../types/skill-creator';

export function useSkillAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [status, setStatus] = useState<AnalysisStatus>({
    status: 'uploading',
    progress: 0,
    message: '准备分析...',
  });
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const jobIdRef = useRef<string | null>(null);

  const startAnalysis = useCallback(async (fileIds: string[]) => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setStatus({
      status: 'uploading',
      progress: 0,
      message: 'Starting analysis...',
    });

    try {
      // Start analysis job
      const { jobId } = await apiClient.analyzeFiles(fileIds);
      jobIdRef.current = jobId;

      // Start polling for status
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const statusData = await apiClient.getAnalysisStatus(jobId);

          setStatus({
            status: statusData.status as any,
            progress: statusData.progress,
            message: getStatusMessage(statusData.status),
          });

          if (statusData.status === 'complete' && statusData.result) {
            setResult(statusData.result);
            setIsAnalyzing(false);
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
            }
          } else if (statusData.status === 'failed') {
            setError(statusData.error || 'Analysis failed');
            setIsAnalyzing(false);
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
            }
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 1000); // Poll every second

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setIsAnalyzing(false);
    }
  }, []);

  const reset = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    setIsAnalyzing(false);
    setStatus({
      status: 'uploading',
      progress: 0,
      message: 'Preparing analysis...',
    });
    setResult(null);
    setError(null);
    jobIdRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  return {
    startAnalysis,
    isAnalyzing,
    status,
    result,
    error,
    reset,
  };
}

function getStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    uploading: 'Uploading files...',
    extracting: 'Extracting file contents...',
    analyzing: 'AI is analyzing your files...',
    generating: 'Generating skill configuration...',
    complete: 'Analysis complete!',
    failed: 'Analysis failed',
    processing: 'Processing...',
  };

  return messages[status] || 'Processing...';
}
