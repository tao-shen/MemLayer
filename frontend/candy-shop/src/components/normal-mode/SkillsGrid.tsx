import { Search, Heart, ShoppingBag, Check, Play, Star } from 'lucide-react';
import { useState, useMemo } from 'react';
import { SKILLS_DATA, type Skill } from '../../data/skillsData';
import { SkillModal } from '../common/SkillModal';
import { storageUtils } from '../../utils/storage';
import { toast } from 'sonner';
import { useLanguage } from '../../contexts/LanguageContext';

interface NormalSkillsGridProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  categoryFilter: string | null;
  setCategoryFilter: (c: string | null) => void;
  cart: Set<string>;
  onToggleCart: (id: string) => void;
  onRunSkill: (skill: Skill) => void;
}

export function NormalSkillsGrid({
  searchQuery,
  setSearchQuery,
  categoryFilter,
  cart,
  onToggleCart,
  onRunSkill,
}: NormalSkillsGridProps) {
  const { t } = useLanguage();
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [likedSkills, setLikedSkills] = useState<Set<string>>(() => new Set(storageUtils.getLikes()));

  const handleLike = (skillId: string) => {
    const isLiked = likedSkills.has(skillId);
    const skillName = SKILLS_DATA.find((s) => s.id === skillId)?.name || skillId;

    if (isLiked) {
      storageUtils.removeLike(skillId);
      setLikedSkills((prev) => {
        const next = new Set(prev);
        next.delete(skillId);
        return next;
      });
    } else {
      storageUtils.saveLike(skillId);
      setLikedSkills((prev) => {
        const next = new Set(prev);
        next.add(skillId);
        return next;
      });
      toast.success(`Liked ${skillName}`);
    }
  };

  const filteredSkills = useMemo(() => {
    return SKILLS_DATA.filter((skill) => {
      const matchesSearch =
        skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter ? skill.category === categoryFilter : true;
      return matchesSearch && matchesCategory;
    }).sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }, [searchQuery, categoryFilter]);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Productivity': 'from-blue-400 to-blue-600',
      'Creative': 'from-purple-400 to-purple-600',
      'Developer': 'from-green-400 to-green-600',
      'Communication': 'from-rose-400 to-rose-600',
      'Analytics': 'from-amber-400 to-amber-600',
    };
    return colors[category] || 'from-gray-400 to-gray-600';
  };

  const getCategoryBg = (category: string) => {
    const colors: Record<string, string> = {
      'Productivity': 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      'Creative': 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      'Developer': 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      'Communication': 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
      'Analytics': 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    };
    return colors[category] || 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400';
  };

  return (
    <>
      <section id="skills" className="py-20 bg-white/50 dark:bg-gray-800/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search Header */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('skills.search') || 'Search skills...'}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent shadow-lg text-gray-900 dark:text-white placeholder-gray-400 transition-all duration-300"
              />
            </div>
          </div>

          {/* Skills Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSkills.map((skill) => (
              <div
                key={skill.id}
                className="group relative bg-white dark:bg-gray-900 rounded-3xl shadow-lg hover:shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:-translate-y-2 transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedSkill(skill)}
              >
                {/* Gradient Header */}
                <div className={`h-24 bg-gradient-to-br ${getCategoryColor(skill.category)} relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/10" />
                  {/* Pattern Overlay */}
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                    }}
                  />
                  {/* Icon */}
                  <div className="absolute bottom-4 left-4 w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <skill.icon className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Category Badge */}
                  <div className="inline-flex px-3 py-1 rounded-full text-xs font-medium mb-3">
                    <span className={`px-3 py-1 rounded-full ${getCategoryBg(skill.category)}`}>
                      {skill.category}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors duration-300">
                    {skill.name}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
                    {skill.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-500 dark:text-gray-500">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-medium">{skill.popularity || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ShoppingBag className="w-4 h-4" />
                      <span>{(skill as any).installCount || '1k+'}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRunSkill(skill);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-medium text-sm hover:shadow-lg hover:scale-105 transition-all duration-300"
                    >
                      <Play className="w-4 h-4" />
                      Try Now
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(skill.id);
                      }}
                      className={`p-2.5 rounded-xl transition-all duration-300 ${
                        likedSkills.has(skill.id)
                          ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-500'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-rose-100 dark:hover:bg-rose-900/30 hover:text-rose-500'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${likedSkills.has(skill.id) ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCart(skill.id);
                      }}
                      className={`p-2.5 rounded-xl transition-all duration-300 ${
                        cart.has(skill.id)
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-500'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-500'
                      }`}
                    >
                      {cart.has(skill.id) ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <ShoppingBag className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredSkills.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {t('skills.noResults') || 'No skills found'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Skill Modal */}
      <SkillModal skill={selectedSkill} onClose={() => setSelectedSkill(null)} onRun={onRunSkill} />
    </>
  );
}
