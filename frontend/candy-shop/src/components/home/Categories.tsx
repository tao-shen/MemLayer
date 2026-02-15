import { Folder, ArrowRight } from 'lucide-react';
import { useMemo } from 'react';
import { SKILLS_DATA, SKILL_CATEGORIES } from '../../data/skillsData';
import { useLanguage } from '../../contexts/LanguageContext';

export function Categories({ onSelectCategory }: { onSelectCategory: (cat: string) => void }) {
  const { t } = useLanguage();

  // Dynamically calculate category counts from actual skill data
  const categories = useMemo(() => {
    return SKILL_CATEGORIES.map(cat => {
      const skills = SKILLS_DATA.filter(s => s.category === cat.name);
      const topExports = skills.slice(0, 3).map(s => s.id.split('-').pop() || s.id);
      return {
        name: cat.name,
        count: skills.length,
        exports: topExports,
        icon: cat.icon,
      };
    }).filter(cat => cat.count > 0); // Only show categories with skills
  }, []);

  return (
    <section className="py-20 bg-primary/10 border-t border-primary/20" id="categories-section">
      <div className="container max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-8 font-candy flex items-center gap-3 text-foreground">
          <Folder className="w-6 h-6 text-primary" />
          <span>{t('categories.title')}</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => onSelectCategory(cat.name)}
              className="group bg-card p-6 rounded-xl border border-primary/20 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-primary/30"
              aria-label={`Browse ${cat.name} category — ${cat.count} skills`}
            >
              <div className="font-mono text-sm">
                <div className="text-primary/70 mb-2">// {cat.count} skills</div>
                <div className="text-primary mb-1">
                  "{cat.name.toLowerCase()}": <span className="text-foreground">{'{'}</span>
                </div>
                <div className="pl-4 text-foreground-secondary">
                  <span className="text-foreground-secondary">exports</span>: [
                  {cat.exports.map((e, idx) => (
                    <span key={idx}>
                      <span className="text-accent">'{e}'</span>
                      {idx < cat.exports.length - 1 && ', '}
                    </span>
                  ))}
                  ]
                </div>
                <div className="text-foreground">{'}'}</div>
              </div>

              <div className="mt-4 pt-4 border-t border-primary/10 flex items-center justify-between text-xs font-mono text-foreground-secondary group-hover:text-primary transition-colors duration-200">
                <span>$ cd ./{cat.name.toLowerCase()} && ls</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
