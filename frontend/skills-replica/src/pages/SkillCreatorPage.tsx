import { useState } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { FileUploadZone } from '../components/skill-creator/FileUploadZone';
import { AnalysisProgress } from '../components/skill-creator/AnalysisProgress';
import { SkillPreviewEditor } from '../components/skill-creator/SkillPreviewEditor';
import { useFileUpload } from '../hooks/useFileUpload';
import { useSkillAnalysis } from '../hooks/useSkillAnalysis';
import { apiClient } from '../lib/api-client';
import type { CreationStep, Skill, AnalysisResult } from '../types/skill-creator';

interface SkillCreatorPageProps {
  user: any;
  onComplete: (skill: Skill) => void;
  onCancel: () => void;
}

export function SkillCreatorPage({ user, onComplete, onCancel }: SkillCreatorPageProps) {
  const [step, setStep] = useState<CreationStep>('upload');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [generatedSkill, setGeneratedSkill] = useState<Partial<Skill> | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const { uploadFiles, isUploading } = useFileUpload();
  const { startAnalysis, isAnalyzing, status, result, error } = useSkillAnalysis();

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleStartAnalysis = async () => {
    if (selectedFiles.length === 0) return;

    setStep('analyzing');

    try {
      // Upload files
      const uploadResult = await uploadFiles(selectedFiles);
      
      if (!uploadResult.success) {
        throw new Error('文件上传失败');
      }

      // Start analysis
      await startAnalysis(uploadResult.fileIds);
    } catch (err) {
      console.error('Analysis start error:', err);
    }
  };

  // Watch for analysis completion
  useState(() => {
    if (result && step === 'analyzing') {
      handleAnalysisComplete(result);
    }
  });

  const handleAnalysisComplete = async (analysisResult: AnalysisResult) => {
    setAnalysisResult(analysisResult);

    // Generate skill
    try {
      const skill = await apiClient.generateSkill(analysisResult, {});
      setGeneratedSkill(skill);
      setStep('preview');
    } catch (err) {
      console.error('Skill generation error:', err);
    }
  };

  const handleSaveSkill = async (updatedSkill: Partial<Skill>) => {
    try {
      const saved = await apiClient.saveSkill(updatedSkill);
      setStep('complete');
      setTimeout(() => {
        onComplete(saved);
      }, 2000);
    } catch (err) {
      console.error('Save error:', err);
      throw err;
    }
  };

  const handleCancelEdit = () => {
    setStep('upload');
    setSelectedFiles([]);
    setGeneratedSkill(null);
    setAnalysisResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            返回
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            创建 AI 技能
          </h1>
          <p className="text-gray-600">
            上传你的文件，让 AI 分析并生成专属技能
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-4">
            {[
              { key: 'upload', label: '上传文件' },
              { key: 'analyzing', label: '分析中' },
              { key: 'preview', label: '预览编辑' },
              { key: 'complete', label: '完成' },
            ].map((s, index) => {
              const isActive = s.key === step;
              const isComplete = ['upload', 'analyzing', 'preview', 'complete'].indexOf(step) > index;

              return (
                <div key={s.key} className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all
                        ${isActive ? 'bg-pink-500 text-white scale-110' : ''}
                        ${isComplete ? 'bg-green-500 text-white' : ''}
                        ${!isActive && !isComplete ? 'bg-gray-200 text-gray-500' : ''}
                      `}
                    >
                      {isComplete ? <CheckCircle className="w-5 h-5" /> : index + 1}
                    </div>
                    <span className="text-xs mt-2 text-gray-600">{s.label}</span>
                  </div>
                  {index < 3 && (
                    <div
                      className={`w-16 h-1 rounded ${
                        isComplete ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {step === 'upload' && (
            <div className="space-y-6">
              <FileUploadZone onFilesSelected={handleFilesSelected} />
              
              {selectedFiles.length > 0 && (
                <div className="flex justify-end">
                  <button
                    onClick={handleStartAnalysis}
                    disabled={isUploading}
                    className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? '上传中...' : '开始分析'}
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 'analyzing' && (
            <div className="py-12">
              <AnalysisProgress
                status={status.status}
                progress={status.progress}
                currentFile={status.currentFile}
                message={status.message}
              />
              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </div>
          )}

          {step === 'preview' && generatedSkill && analysisResult && (
            <SkillPreviewEditor
              skill={generatedSkill}
              analysisContext={analysisResult}
              onSave={handleSaveSkill}
              onCancel={handleCancelEdit}
            />
          )}

          {step === 'complete' && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                技能创建成功！
              </h2>
              <p className="text-gray-600">
                正在跳转到技能库...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
