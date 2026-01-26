import { Search, Heart, Share2, MoreHorizontal } from 'lucide-react';
import { useState, useMemo } from 'react';
import { SKILLS_DATA, type Skill } from '../../data/skillsData';
import { SkillModal } from '../common/SkillModal';

export function SkillsGrid() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  const filteredSkills = useMemo(() => {
    return SKILLS_DATA.filter(skill =>
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <>
      <section className="py-20 bg-background" id="skills-grid">
        <div className="container max-w-7xl mx-auto px-4">

          {/* Section Header & Search */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="text-3xl font-candy font-bold mb-2 text-text-main">Freshly Baked Skills</h2>
              <p className="text-text-muted font-mono">
                $ ls ./inventory | grep "{searchQuery || '*'}"
              </p>
            </div>

            <div className="w-full md:w-96 relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for capabilities..."
                  className="w-full h-10 pl-10 pr-4 bg-white border border-pink-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all placeholder:text-pink-300"
                />
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSkills.map((skill) => (
              <div
                key={skill.id}
                onClick={() => setSelectedSkill(skill)}
                className="group bg-white rounded-xl border border-pink-200 shadow-sm hover:shadow-candy transition-all duration-300 flex flex-col h-full overflow-hidden cursor-pointer"
              >
                {/* Card Header (Window Buttons) */}
                <div className="h-9 px-4 border-b border-pink-100 bg-pink-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300 group-hover:bg-[#ff5f56]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300 group-hover:bg-[#ffbd2e]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300 group-hover:bg-[#27c93f]"></div>
                  </div>
                  <div className="text-xs font-mono text-text-muted truncate max-w-[150px]">
                    {skill.id}.json
                  </div>
                  <div className="flex gap-2 text-text-muted/50">
                    <MoreHorizontal className="w-4 h-4" />
                  </div>
                </div>

                {/* Card Body (Preview) */}
                <div className="p-6 flex-1 bg-white relative overflow-hidden group-hover:bg-[#fff5f7] transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm ${skill.color}`}>
                      {skill.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 font-sans mb-1">{skill.name}</h3>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed font-mono">
                        {skill.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-dashed border-pink-100">
                    <div className="text-xs font-mono text-pink-400">
                      <span className="text-gray-400">category: </span>
                      "{skill.category}"
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-3 border-t border-pink-100 bg-pink-50/30 flex items-center justify-between text-xs text-text-muted">
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 rounded bg-white border border-pink-100 font-bold text-primary text-[10px] uppercase tracking-wide">
                      Free
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 group/like hover:text-pink-500 transition-colors">
                      <Heart className="w-3.5 h-3.5 group-hover/like:fill-pink-500" />
                      <span>{skill.popularity}</span>
                    </div>
                    <div className="hover:text-primary transition-colors">
                      <Share2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredSkills.length === 0 && (
            <div className="text-center py-20 text-gray-400 font-mono">
              No treats found matching "{searchQuery}" :(
            </div>
          )}
        </div>
      </section>

      <SkillModal skill={selectedSkill} onClose={() => setSelectedSkill(null)} />
    </>
  );
}
