import { FileText, Code2, TrendingUp } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-32">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        {/* Left Content */}
        <div className="flex flex-col items-start space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/20 text-primary text-xs font-mono font-medium">
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary"></span>
            v1.0.0 Public Beta
          </div>
          
          <div className="relative">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-sans font-bold tracking-tight text-text-main leading-[1.1]">
              Agent Skills <br />
              Marketplace
              <span className="inline-block w-3 h-10 ml-2 -mb-1 bg-primary animate-pulse"></span>
            </h1>
            <p className="mt-4 text-xl text-text-muted font-mono">
              <span className="text-syntax-comment">{'>'} for the open SKILL.md ecosystem</span>
            </p>
          </div>

          <p className="text-lg text-text-muted max-w-lg leading-relaxed">
            Discover, share, and deploy standardized agent capabilities. 
            The package manager for the AI agent era.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button className="h-12 px-6 bg-primary text-white rounded-md font-mono font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-lg shadow-primary/20">
              <SearchIcon className="w-4 h-4" />
              Browse Skills
            </button>
            <button className="h-12 px-6 bg-white border border-border text-text-main rounded-md font-mono font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
              <FileText className="w-4 h-4 text-text-muted" />
              Read Docs
            </button>
          </div>

          <div className="flex items-center gap-8 pt-4">
             <div className="flex -space-x-2">
               {[1,2,3,4].map(i => (
                 <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-slate-200" />
               ))}
             </div>
             <div className="text-sm font-mono text-text-muted">
               <span className="text-text-main font-bold">1,200+</span> contributors
             </div>
          </div>
        </div>

        {/* Right Visuals */}
        <div className="relative lg:ml-auto w-full max-w-lg">
          {/* Main Visual Window */}
          <div className="relative bg-surface rounded-xl border border-border shadow-window overflow-hidden">
             {/* Window Header */}
             <div className="h-10 bg-gray-50 border-b border-border flex items-center px-4 justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]"></div>
                </div>
                <div className="text-xs font-mono text-text-muted">trend-analytics.tsx</div>
                <div className="w-12"></div>
             </div>
             
             {/* Window Content */}
             <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-sm text-text-muted font-mono mb-1">Total Installs</div>
                    <div className="text-2xl font-bold font-sans">2,845,912</div>
                  </div>
                  <div className="p-2 bg-success/10 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-success" />
                  </div>
                </div>
                
                {/* Mock Chart */}
                <div className="h-32 flex items-end gap-2 justify-between px-2">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95].map((h, i) => (
                    <div key={i} className="w-full bg-primary/10 rounded-t-sm relative group">
                       <div 
                         className="absolute bottom-0 w-full bg-primary rounded-t-sm transition-all duration-500 group-hover:bg-secondary"
                         style={{ height: `${h}%` }}
                       ></div>
                    </div>
                  ))}
                </div>
             </div>
          </div>

          {/* Floating Code Card */}
          <div className="absolute -bottom-6 -left-6 bg-[#282a36] text-[#f8f8f2] p-4 rounded-lg shadow-xl border border-white/10 font-mono text-sm max-w-[240px] hidden sm:block transform hover:-translate-y-1 transition-transform">
             <div className="flex items-center gap-2 text-xs text-white/40 mb-2">
               <Code2 className="w-3 h-3" />
               <span>stats.ts</span>
             </div>
             <div>
               <span className="text-[#ff79c6]">const</span> <span className="text-[#50fa7b]">skills</span> = <span className="text-[#bd93f9]">96,751</span>;
             </div>
             <div className="text-[#6272a4] text-xs mt-1">
               // growing daily
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
     <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
     </svg>
  );
}
