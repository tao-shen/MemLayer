import { Search, FileText, Code2, TrendingUp, Sparkles, Candy } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface HeroProps {
  onOpenDocs: () => void;
}

export function Hero({ onOpenDocs }: HeroProps) {
  const { t, language } = useLanguage();
  const [displayText, setDisplayText] = useState('');
  const fullText = t('hero.tagline');

  useEffect(() => {
    let index = 0;
    const typingSpeed = 80; // ms per character

    // Reset display text when language changes
    setDisplayText('');

    const timer = setInterval(() => {
      if (index <= fullText.length) {
        setDisplayText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, typingSpeed);

    return () => clearInterval(timer);
  }, [fullText, language]); // Re-run typing effect when language changes
  return (
    <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-32">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        {/* Left Content */}
        <div className="flex flex-col items-start space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-medium">
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary"></span>
            v2.0.0
          </div>

          <div className="relative">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-candy font-bold tracking-tight text-foreground leading-[1.1]">
              {displayText}
              <span className="inline-block w-3 h-10 ml-1 -mb-1 bg-primary animate-pulse"></span>
            </h1>
            <p className="mt-4 text-xl text-foreground-secondary font-mono">
              <span className="text-primary">{'>'} npm install intelligence</span>
            </p>
          </div>

          <p className="text-lg text-foreground-secondary max-w-lg leading-relaxed font-body">
            {t('hero.subtitle')}
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() =>
                document.getElementById('skills-grid')?.scrollIntoView({ behavior: 'smooth' })
              }
              className="h-12 px-6 bg-primary text-primary-foreground rounded-md font-mono font-medium hover:bg-primary-hover transition-all duration-200 flex items-center gap-2 shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 hover:shadow-xl hover:shadow-primary/10"
            >
              <Search className="w-4 h-4" />
              {t('hero.browseSkills')}
            </button>
            <button
              onClick={onOpenDocs}
              className="h-12 px-6 bg-background border border-border text-foreground rounded-md font-mono font-medium hover:bg-secondary transition-all duration-200 flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-border"
            >
              <FileText className="w-4 h-4 text-foreground-secondary" />
              {t('hero.docs')}
            </button>
          </div>

          <div className="flex items-center gap-8 pt-4">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-background bg-secondary flex items-center justify-center"
                  aria-hidden="true"
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
              ))}
            </div>
            <div className="text-sm font-mono text-foreground-secondary">
              <span className="text-foreground font-bold">5,000+</span> happy users
            </div>
          </div>
        </div>

        {/* Right Visuals */}
        <div className="relative lg:ml-auto w-full max-w-lg">
          {/* Main Visual Window */}
          <div className="relative bg-card rounded-xl border border-border shadow-xl overflow-hidden">
            {/* Window Header */}
            <div className="h-10 bg-secondary/50 border-b border-border flex items-center px-4 justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
              </div>
              <div className="text-xs font-mono text-foreground-secondary">skills.tsx</div>
              <div className="w-12"></div>
            </div>

            {/* Window Content */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-sm text-foreground-secondary font-mono mb-1">
                    {t('hero.activeSkills')}
                  </div>
                  <div className="text-2xl font-bold font-candy text-primary">127 {t('hero.ready')}</div>
                </div>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
              </div>

              {/* Mock Chart */}
              <div className="h-32 flex items-end gap-2 justify-between px-2">
                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95].map((h, i) => (
                  <div key={i} className="w-full bg-secondary rounded-t-sm relative group">
                    <div
                      className="absolute bottom-0 w-full bg-primary rounded-t-sm transition-all duration-500 group-hover:bg-primary/80"
                      style={{ height: `${h}%` }}
                    ></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating Code Card */}
          <div className="absolute -bottom-6 -left-6 bg-[#1e1e2e] text-[#cdd6f4] p-4 rounded-lg shadow-xl border border-white/10 font-mono text-sm max-w-[240px] hidden sm:block transform hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-center gap-2 text-xs text-white/40 mb-2">
              <Code2 className="w-3 h-3" />
              <span>skill.ts</span>
            </div>
            <div>
              <span className="text-[#cba6f7]">const</span>{' '}
              <span className="text-[#a6e3a1]">ai</span> ={' '}
              <span className="text-[#89b4fa]">await</span>{' '}
              <span className="text-[#f9e2af]">useSkill</span>();
            </div>
            <div className="text-[#6c7086] text-xs mt-1 flex items-center gap-1">
              {t('hero.comment')} <Candy className="w-3 h-3 inline text-[#f38ba8]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
