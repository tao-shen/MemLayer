import { Search, ShoppingBag, Check, X, Calendar, Heart } from 'lucide-react';
import { useState, useMemo } from 'react';
import { SKILLS_DATA, type Skill } from '../../data/skillsData';
import { SkillModal } from '../common/SkillModal';

interface SkillsGridProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  categoryFilter: string | null;
  setCategoryFilter: (c: string | null) => void;
  cart: Set<string>;
  onToggleCart: (id: string) => void;
}

export function SkillsGrid({
  searchQuery,
  setSearchQuery,
  categoryFilter, 
  setCategoryFilter,
  cart,
  onToggleCart
}: SkillsGridProps) {
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  const filteredSkills = useMemo(() => {
    return SKILLS_DATA.filter(skill => {
      const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        skill.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter ? skill.category === categoryFilter : true;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, categoryFilter]);

  return (
    <>
      <section className="py-20 bg-[#F9FAFB]" id="skills-grid">
        <div className="container max-w-7xl mx-auto px-4">

          {/* Section Header & Search */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="text-3xl font-candy font-bold mb-2 text-text-main">
                {categoryFilter ? `${categoryFilter} Modules` : 'Freshly Baked Skills'}
              </h2>
              <div className="flex items-center gap-2 text-text-muted font-mono text-sm">
                <span>$ ls ./inventory</span>
                {categoryFilter && (
                  <button 
                    onClick={() => setCategoryFilter(null)}
                    className="px-2 py-0.5 bg-pink-100 text-pink-600 rounded hover:bg-pink-200 transition-colors flex items-center gap-1"
                  >
                    --filter="{categoryFilter}" <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="w-full md:w-96 relative group">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input 
                  id="search-input"
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search skills..."
                  className="w-full h-10 pl-10 pr-4 bg-white border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all placeholder:text-gray-400 shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Grid - SkillsMP Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSkills.map((skill) => (
              <div
                key={skill.id} 
                onClick={() => setSelectedSkill(skill)}
                className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:border-pink-300 hover:shadow-md transition-all duration-300 flex flex-col h-full overflow-hidden cursor-pointer relative"
              >
                {/* Top Bar (Traffic Lights + Filename) */}
                <div className="h-10 px-4 border-b border-gray-100 flex items-center bg-white relative">
                  <div className="flex items-center gap-1.5 absolute left-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]"></div>
                  </div>
                  <div className="mx-auto text-xs font-mono text-gray-400 font-medium">
                    {skill.id}.ts
                  </div>
                </div>

                {/* Code Content */}
                <div className="p-5 flex-1 font-mono text-sm leading-relaxed relative">
                  {/* Line Numbers */}
                  <div className="absolute left-4 top-5 bottom-5 w-6 text-right text-gray-200 select-none text-xs flex flex-col gap-1">
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                  </div>

                  {/* Syntax Highlighted Text */}
                  <div className="pl-10">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-purple-600 font-bold">export</span>
                      <span className="text-blue-600 font-bold">{skill.name.replace(/\s+/g, '')}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-purple-600">from</span>
                      <span className="text-green-600 text-xs truncate">"{skill.installCommand.split(' ').pop()}"</span>
                    </div>

                    {/* Description as Comment */}
                    <div className="text-gray-400 italic text-xs leading-5 border-l-2 border-gray-100 pl-3 py-1">
                        /** <br />
                      &nbsp;* {skill.description} <br />
                      &nbsp;*/
                    </div>
                  </div>
                </div>

                {/* Footer Status Bar */}
                <div className="h-10 px-4 border-t border-gray-100 bg-[#FAFAFA] flex items-center justify-between text-xs font-mono text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>Updated today</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Favorite logic placeholder
                      }}
                      className="hover:text-pink-500 transition-colors"
                    >
                      <Heart className={`w-3.5 h-3.5 ${skill.popularity > 90 ? 'fill-pink-500 text-pink-500' : ''}`} />
                    </button>

                    {/* Add Button - Small & Pill shaped */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCart(skill.id);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wide transition-all border ${cart.has(skill.id)
                          ? 'bg-green-50 border-green-200 text-green-600'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-pink-300 hover:text-pink-500'
                        }`}
                    >
                      {cart.has(skill.id) ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>In Bag</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3 h-3" />
                          <span>Add</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredSkills.length === 0 && (
            <div className="text-center py-20 text-gray-400 font-mono">
              No skills found matching "{searchQuery}" :(
            </div>
          )}
        </div>
      </section>

      <SkillModal skill={selectedSkill} onClose={() => setSelectedSkill(null)} />
    </>
  );
}
