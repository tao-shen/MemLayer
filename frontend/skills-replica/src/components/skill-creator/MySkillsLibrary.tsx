import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Play, Calendar, Filter } from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import type { Skill, SkillCategory } from '../../types/skill-creator';

interface MySkillsLibraryProps {
  onCreateNew: () => void;
  onUseSkill: (skill: Skill) => void;
}

const CATEGORY_LABELS: Record<SkillCategory, string> = {
  Knowledge: '知识',
  Tools: '工具',
  Productivity: '生产力',
  Development: '开发',
  Analysis: '分析',
  Custom: '自定义',
};

export function MySkillsLibrary({ onCreateNew, onUseSkill }: MySkillsLibraryProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadSkills();
  }, [categoryFilter]);

  const loadSkills = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getUserSkills({
        category: categoryFilter as SkillCategory | undefined,
        searchQuery: searchQuery || undefined,
      });
      setSkills(data);
    } catch (error) {
      console.error('Failed to load skills:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (skillId: string) => {
    try {
      await apiClient.deleteSkill(skillId);
      setSkills(skills.filter(s => s.id !== skillId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete skill:', error);
    }
  };

  const filteredSkills = skills.filter(skill => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      skill.name.toLowerCase().includes(query) ||
      skill.description.toLowerCase().includes(query)
    );
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">我的技能库</h1>
          <p className="text-sm text-gray-500 mt-1">
            管理你创建的所有 AI 技能
          </p>
        </div>
        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all shadow-md"
        >
          <Plus className="w-5 h-5" />
          创建新技能
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索技能..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={categoryFilter || ''}
            onChange={(e) => setCategoryFilter(e.target.value || null)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="">所有分类</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Skills Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredSkills.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            {searchQuery || categoryFilter ? '没有找到匹配的技能' : '还没有创建任何技能'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || categoryFilter
              ? '尝试调整搜索条件'
              : '点击上方按钮创建你的第一个技能'}
          </p>
          {!searchQuery && !categoryFilter && (
            <button
              onClick={onCreateNew}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all"
            >
              <Plus className="w-5 h-5" />
              创建第一个技能
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSkills.map((skill) => (
            <div
              key={skill.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden group"
            >
              {/* Top Bar */}
              <div className="h-10 px-4 border-b border-gray-100 flex items-center bg-white relative">
                <div className="flex items-center gap-1.5 absolute left-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]"></div>
                </div>
                <div className="mx-auto text-xs font-mono text-gray-400 font-medium">
                  {skill.id.slice(0, 8)}.ts
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="text-3xl">{skill.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 truncate">
                      {skill.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {CATEGORY_LABELS[skill.category as SkillCategory]}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                  {skill.description}
                </p>

                <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                  <Calendar className="w-3 h-3" />
                  <span>
                    创建于 {new Date(skill.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUseSkill(skill)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-medium rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all"
                  >
                    <Play className="w-4 h-4" />
                    使用
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(skill.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              确认删除
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              确定要删除这个技能吗？此操作无法撤销。
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
