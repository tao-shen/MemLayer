import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { FileUploadZone } from '../components/skill-creator/FileUploadZone';
import { AnalysisProgress } from '../components/skill-creator/AnalysisProgress';
import { SkillPreviewEditor } from '../components/skill-creator/SkillPreviewEditor';
import { useSkillAnalysis } from '../hooks/useSkillAnalysis';
import { storageUtils } from '../utils/storage';
import type { CreationStep, Skill, AnalysisResult } from '../types/skill-creator';

interface SkillCreatorPageProps {
  onComplete: () => void;
  onCancel: () => void;
  onSkillCreated?: (skill: Partial<Skill>) => void;
}

export function SkillCreatorPage({ onComplete, onCancel }: SkillCreatorPageProps) {
  const [step, setStep] = useState<CreationStep>('upload');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [generatedSkill, setGeneratedSkill] = useState<Partial<Skill> | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { startAnalysis, status, result, error } = useSkillAnalysis();

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
    setFeedback(null);
  };

  const handleStartAnalysis = async () => {
    if (selectedFiles.length === 0) return;

    setStep('analyzing');
    setFeedback(null);
    setIsUploading(true);

    try {
      // For GitHub Pages, simulate file upload
      setFeedback({ type: 'success', message: 'Files prepared for analysis...' });
      
      // Create mock file IDs
      const mockFileIds = selectedFiles.map((_, i) => `file-${i}-${Date.now()}`);
      
      // Start analysis
      await startAnalysis(mockFileIds);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Analysis failed';
      setFeedback({ type: 'error', message: errorMsg });
      console.error('Analysis start error:', err);
      setIsUploading(false);
    }
  };

  // Watch for analysis completion
  useEffect(() => {
    if (result && step === 'analyzing') {
      handleAnalysisComplete(result);
    }
  }, [result, step]);

  const handleAnalysisComplete = async (analysisResult: AnalysisResult) => {
    setAnalysisResult(analysisResult);

    // Generate skill locally
    try {
      const skill: Partial<Skill> = {
        id: `skill-${Date.now()}`,
        name: analysisResult.suggestedName,
        description: analysisResult.suggestedDescription,
        category: analysisResult.suggestedCategory,
        icon: '✨',
        color: 'bg-indigo-100 border-indigo-200 text-indigo-700',
        config: {
          capabilities: analysisResult.suggestedCapabilities,
          systemPrompt: analysisResult.systemPrompt,
          parameters: {},
        },
        sourceFiles: selectedFiles.map(f => f.name),
        analysisContext: analysisResult,
        installCommand: `skill install ${analysisResult.suggestedName.toLowerCase().replace(/\s+/g, '-')}`,
        popularity: 0,
        status: 'draft',
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setGeneratedSkill(skill);
      setStep('preview');
      setFeedback({ type: 'success', message: 'Skill generated successfully!' });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Skill generation failed';
      setFeedback({ type: 'error', message: errorMsg });
      console.error('Skill generation error:', err);
    }
  };

  const handleSaveSkill = async (updatedSkill: Partial<Skill>) => {
    try {
      storageUtils.saveSkill(updatedSkill);
      
      setStep('complete');
      setFeedback({ type: 'success', message: 'Skill saved successfully!' });
      setIsUploading(false);
      
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Save failed';
      setFeedback({ type: 'error', message: errorMsg });
      console.error('Save error:', err);
      setIsUploading(false);
      throw err;
    }
  };

  const handleCancelEdit = () => {
    setStep('upload');
    setSelectedFiles([]);
    setGeneratedSkill(null);
    setAnalysisResult(null);
    setFeedback(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create AI Skill
        </h1>
        <p className="text-gray-600">
          Upload your files and let AI analyze and generate a custom skill
        </p>
      </div>

      {/* Feedback Messages */}
      {feedback && (
        <div className={`p-4 rounded-lg ${feedback.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className={`text-sm ${feedback.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {feedback.message}
          </p>
        </div>
      )}

      {/* Progress Steps */}
      <div className="mb-12">
        <div className="flex items-center justify-center gap-4">
          {[
            { key: 'upload', label: 'Upload Files' },
            { key: 'analyzing', label: 'Analyzing' },
            { key: 'preview', label: 'Preview & Edit' },
            { key: 'complete', label: 'Complete' },
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
                  {isUploading ? 'Uploading...' : 'Start Analysis'}
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
              Skill Created Successfully!
            </h2>
            <p className="text-gray-600">
              Redirecting to skills library...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
