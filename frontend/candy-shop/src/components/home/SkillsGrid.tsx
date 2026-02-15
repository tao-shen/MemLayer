import { Search, ShoppingBag, Check, X, Calendar, Heart, Play } from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { SKILLS_DATA, type Skill } from '../../data/skillsData';
import { SkillModal } from '../common/SkillModal';
import { storageUtils } from '../../utils/storage';
import { cn } from '../../utils/cn';
import { toast } from 'sonner';
import { useLanguage } from '../../contexts/LanguageContext';

interface SkillsGridProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  categoryFilter: string | null;
  setCategoryFilter: (c: string | null) => void;
  cart: Set<string>;
  onToggleCart: (id: string) => void;
  onRunSkill: (skill: Skill) => void;
}

export function SkillsGrid({
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  cart,
  onToggleCart,
  onRunSkill,
}: SkillsGridProps) {
  const { t } = useLanguage();
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  // Use lazy initializer to load liked skills from storage
  const [likedSkills, setLikedSkills] = useState<Set<string>>(() => new Set(storageUtils.getLikes()));
  const searchInputRef = useRef<HTMLInputElement>(null);
  const ITEMS_PER_LOAD = 12;
  const loadMoreRef = useRef<HTMLDivElement>(null);
  // Track the base visible count - resets when filters change
  const baseVisibleCount = 12;
  // Track additional items loaded beyond base
  const [additionalLoaded, setAdditionalLoaded] = useState(0);

  // Calculate total visible count using useMemo
  const actualVisibleCount = useMemo(() => {
    return baseVisibleCount + additionalLoaded;
  }, [additionalLoaded]);

  // Reset additional loaded count when filters change
  const prevFiltersRef = useRef({ searchQuery, categoryFilter });
  useEffect(() => {
    const prev = prevFiltersRef.current;
    if (prev.searchQuery !== searchQuery || prev.categoryFilter !== categoryFilter) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAdditionalLoaded(0);
      prevFiltersRef.current = { searchQuery, categoryFilter };
    }
  }, [searchQuery, categoryFilter]);

  // Cmd+K / Ctrl+K keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
           
          setAdditionalLoaded((prev) => prev + ITEMS_PER_LOAD);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLike = (skillId: string) => {
    const isLiked = likedSkills.has(skillId);
    console.log('[Like] Clicked on skill:', skillId);
    console.log('[Like] Currently liked:', isLiked);

    const skillName = SKILLS_DATA.find(s => s.id === skillId)?.name || skillId;
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
    return SKILLS_DATA
      .filter((skill) => {
        const matchesSearch =
          skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          skill.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter ? skill.category === categoryFilter : true;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0)); // Sort by popularity
  }, [searchQuery, categoryFilter]);

  return (
    <>
      <section className="py-20 bg-background" id="skills-grid">
        <div className="container max-w-7xl mx-auto px-4">
          {/* Section Header & Search */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="text-3xl font-candy font-bold mb-2 text-foreground">
                {categoryFilter ? t('skills.categoryModules', { category: categoryFilter }) : t('skills.freshlyBaked')}
              </h2>
              <div className="flex items-center gap-2 text-muted-foreground font-mono text-sm">
                <span>$ ls ./inventory</span>
                {categoryFilter && (
                  <button
                    onClick={() => setCategoryFilter(null)}
                    className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors flex items-center gap-1"
                  >
                    --filter="{categoryFilter}" <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="w-full md:w-96 relative group">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  id="search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('skills.search')}
                  className={cn(
                    'w-full h-10 pl-10 pr-4 bg-background border border-input rounded-lg text-sm font-mono',
                    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                    'transition-all placeholder:text-muted-foreground',
                    'shadow-sm hover:shadow-md'
                  )}
                />
              </div>
            </div>
          </div>

          {/* Grid - SkillsMP Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSkills.slice(0, actualVisibleCount).map((skill) => (
              <div
                key={skill.id}
                onClick={() => setSelectedSkill(skill)}
                className={cn(
                  'group bg-card rounded-xl border border-border shadow-card',
                  'hover:shadow-lg hover:border-primary/30 hover:-translate-y-1',
                  'transition-all duration-300 flex flex-col h-full overflow-hidden cursor-pointer'
                )}
              >
                {/* Top Bar (Traffic Lights + Filename) */}
                <div
                  className={cn(
                    'h-10 px-4 border-b border-border flex items-center bg-muted/30 relative',
                    'group-hover:bg-muted/50 transition-colors'
                  )}
                >
                  <div className="flex items-center gap-1.5 absolute left-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                  </div>
                  <div className="mx-auto text-xs font-mono text-muted-foreground font-medium">
                    {skill.id}.ts
                  </div>
                </div>

                {/* Code Content */}
                <div className="p-5 flex-1 font-mono text-sm leading-relaxed relative">
                  {/* Line Numbers */}
                  <div className="absolute left-4 top-5 bottom-5 w-6 text-right text-muted-foreground/40 select-none text-xs flex flex-col gap-1">
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                  </div>

                  {/* Syntax Highlighted Text */}
                  <div className="pl-10">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-syntax-keyword font-bold">export</span>
                      <span className="text-syntax-variable font-bold">
                        {skill.name.replace(/\s+/g, '')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-syntax-keyword">from</span>
                      <span className="text-syntax-string text-xs truncate">
                        "{skill.installCommand.split(' ').pop()}"
                      </span>
                    </div>

                    {/* Description as Comment */}
                    <div className="text-muted-foreground italic text-xs leading-5 border-l-2 border-border pl-3 py-1">
                      /** <br />
                      &nbsp;* {skill.description} <br />
                      &nbsp;*/
                    </div>
                  </div>
                </div>

                {/* Footer Status Bar */}
                <div
                  className={cn(
                    'h-10 px-4 border-t border-border bg-muted/20 flex items-center justify-between text-xs font-mono text-muted-foreground',
                    'group-hover:bg-muted/30 transition-colors'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>{t('skills.updatedToday')}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Run Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRunSkill(skill);
                      }}
                      className="p-2 rounded-md hover:text-green-600 hover:bg-green-500/10 transition-all duration-200 cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-green-500/30"
                      title="Run skill"
                      aria-label={`Run ${skill.name}`}
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('[Like] Button clicked for skill:', skill.id);
                        handleLike(skill.id);
                      }}
                      className="p-2 rounded-md hover:text-destructive hover:bg-destructive/10 transition-all duration-200 cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-destructive/30"
                      type="button"
                      aria-label={likedSkills.has(skill.id) ? 'Unlike skill' : 'Like skill'}
                    >
                      <Heart
                        className={cn(
                          'w-3.5 h-3.5 transition-colors pointer-events-none',
                          likedSkills.has(skill.id) ? 'fill-destructive text-destructive' : ''
                        )}
                      />
                    </button>

                    {/* Add Button - Small & Pill shaped */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCart(skill.id);
                      }}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-wide transition-all duration-200 border cursor-pointer min-h-[28px] focus:outline-none focus:ring-2 focus:ring-primary/30',
                        cart.has(skill.id)
                          ? 'bg-green-500/10 border-green-500/20 text-green-600 hover:bg-green-500/20'
                          : 'bg-background border-border text-muted-foreground hover:border-primary/30 hover:text-primary'
                      )}
                      aria-label={cart.has(skill.id) ? t('skills.removeFromBag', { name: skill.name }) : t('skills.addToBag', { name: skill.name })}
                    >
                      {cart.has(skill.id) ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>{t('skills.inBag')}</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3 h-3" />
                          <span>{t('skills.add')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Trigger */}
          {actualVisibleCount < filteredSkills.length && (
            <div
              ref={loadMoreRef}
              className="flex justify-center items-center py-8"
            >
              <div className="flex items-center gap-3 text-muted-foreground font-mono text-sm">
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <span className="ml-2">{t('skills.loadingMore')}</span>
              </div>
            </div>
          )}

          {filteredSkills.length === 0 && (
            <div className="text-center py-20 text-muted-foreground font-mono">
              {t('skills.noResults', { query: searchQuery })}
            </div>
          )}
        </div>
      </section>

      <SkillModal skill={selectedSkill} onClose={() => setSelectedSkill(null)} onRun={onRunSkill} />
    </>
  );
}
