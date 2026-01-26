import { useState, useEffect } from 'react';
import { Save, X, Edit2, Sparkles, AlertCircle } from 'lucide-react';
import type { Skill, AnalysisResult, SkillCategory } from '../../types/skill-creator';

interface SkillPreviewEditorProps {
  skill: Partial<Skill>;
  analysisContext: AnalysisResult;
  onSave: (updatedSkill: Partial<Skill>) => Promise<void>;
  onCancel: () => void;
}

const CATEGORIES: SkillCategory[] = [
  'Knowledge',
  'Tools',
  'Productivity',
  'Development',
  'Analysis',
  'Custom',
];

const CATEGORY_LABELS: Record<SkillCategory, string> = {
  Knowledge: '知识',
  Tools: '工具',
  Productivity: '生产力',
  Development: '开发',
  Analysis: '分析',
  Custom: '自定义',
};

export function SkillPreviewEditor({
  skill: initialSkill,
  analysisContext,
  onSave,
  onCancel,
}: SkillPreviewEditorProps) {
  const [skill, setSkill] = useState(initialSkill);
  const [originalSkill] = useState(initialSkill);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    validateSkill(skill);
  }, [skill]);

  const validateSkill = (s: Partial<Skill>) => {
    const newErrors: Record<string, string> = {};

    if (!s.name || s.name.trim().length === 0) {
      newErrors.name = '技能名称不能为空';
    } else if (s.name.length > 50) {
      newErrors.name = '技能名称不能超过 50 个字符';
    }

    if (!s.description || s.description.trim().length === 0) {
      newErrors.description = '技能描述不能为空';
    } else if (s.description.length > 500) {
      newErrors.description = '技能描述不能超过 500 个字符';
    }

    if (!s.category) {
      newErrors.category = '请选择一个分类';
    }

    setErrors(newErrors);
  };

  const handleSave = async () => {
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(skill);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSkill(originalSkill);
    setIsEditing(false);
    onCancel();
  };

  const hasChanges = JSON.stringify(skill) !== JSON.stringify(originalSkill);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">技能预览</h2>
            <p className="text-sm text-gray-500">
              {isEditing ? '编辑你的技能配置' : '查看生成的技能'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Edit2 className="w-4 h-4" />
          {isEditing ? '预览模式' : '编辑模式'}
        </button>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Skill Card Preview */}
        <div className="p-6 bg-gradient-to-br from-gray-50 to-white border-b border-gray-200">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Top Bar */}
              <div className="h-10 px-4 border-b border-gray-100 flex items-center bg-white relative">
                <div className="flex items-center gap-1.5 absolute left-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]"></div>
                </div>
                <div className="mx-auto text-xs font-mono text-gray-400 font-medium">
                  {skill.id || 'new-skill'}.ts
                </div>
              </div>

              {/* Content */}
              <div className="p-5 font-mono text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-purple-600 font-bold">export</span>
                  <span className="text-blue-600 font-bold">
                    {skill.name?.replace(/\s+/g, '') || 'NewSkill'}
                  </span>
                </div>
                <div className="text-gray-400 italic text-xs leading-5 border-l-2 border-gray-100 pl-3 py-1 mt-3">
                  /** <br />
                  &nbsp;* {skill.description || '技能描述'} <br />
                  &nbsp;*/
                </div>
              </div>

              {/* Footer */}
              <div className="h-10 px-4 border-t border-gray-100 bg-[#FAFAFA] flex items-center justify-between text-xs font-mono text-gray-500">
                <span>{CATEGORY_LABELS[skill.category as SkillCategory] || '分类'}</span>
                <span className="text-pink-500">{skill.icon || '✨'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              技能名称 *
            </label>
            {isEditing ? (
              <input
                type="text"
                value={skill.name || ''}
                onChange={(e) => setSkill({ ...skill, name: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="例如: 数据分析专家"
              />
            ) : (
              <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                {skill.name || '未设置'}
              </div>
            )}
            {errors.name && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              技能描述 *
            </label>
            {isEditing ? (
              <textarea
                value={skill.description || ''}
                onChange={(e) => setSkill({ ...skill, description: e.target.value })}
                rows={4}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="描述这个技能能做什么..."
              />
            ) : (
              <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900 whitespace-pre-wrap">
                {skill.description || '未设置'}
              </div>
            )}
            {errors.description && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              分类 *
            </label>
            {isEditing ? (
              <select
                value={skill.category || ''}
                onChange={(e) => setSkill({ ...skill, category: e.target.value as SkillCategory })}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">选择分类</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                {skill.category ? CATEGORY_LABELS[skill.category as SkillCategory] : '未设置'}
              </div>
            )}
            {errors.category && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.category}
              </p>
            )}
          </div>

          {/* Analysis Context */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-2">AI 分析结果</h4>
            <div className="space-y-2 text-xs text-blue-800">
              <div>
                <span className="font-medium">工作领域:</span>{' '}
                {analysisContext.workDomain.join(', ')}
              </div>
              <div>
                <span className="font-medium">技术技能:</span>{' '}
                {analysisContext.technicalSkills.join(', ')}
              </div>
              <div>
                <span className="font-medium">置信度:</span>{' '}
                {(analysisContext.confidence * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={handleCancel}
          className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <X className="w-4 h-4 inline mr-2" />
          取消
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving || Object.keys(errors).length > 0 || !hasChanges}
          className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              保存中...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 inline mr-2" />
              保存技能
            </>
          )}
        </button>
      </div>
    </div>
  );
}
