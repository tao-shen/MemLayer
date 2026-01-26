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
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const jobIdRef = useRef<string | null>(null);

  const startAnalysis = useCallback(async (fileIds: string[]) => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setStatus({
      status: 'uploading',
      progress: 0,
      message: '开始分析...',
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
            setError(statusData.error || '分析失败');
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
      setError(err instanceof Error ? err.message : '分析失败');
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
      message: '准备分析...',
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
    uploading: '正在上传文件...',
    extracting: '正在提取文件内容...',
    analyzing: 'AI 正在分析你的文件...',
    generating: '正在生成技能配置...',
    complete: '分析完成！',
    failed: '分析失败',
    processing: '处理中...',
  };

  return messages[status] || '处理中...';
}
