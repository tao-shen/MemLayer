import { Terminal } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8 max-w-7xl mx-auto">
        {/* Logo Area */}
        <div className="flex items-center gap-2 font-mono text-sm md:text-base">
          <Terminal className="h-4 w-4 text-text-muted" />
          <span className="font-bold text-text-main">
            ~/ skillsmp
          </span>
          <div className="flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full bg-success/10 border border-success/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            <span className="text-[10px] font-medium text-success uppercase tracking-wider">Ready</span>
          </div>
        </div>

        {/* Navigation Links - Hidden on mobile, visible on md+ */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-mono text-text-muted">
          <a href="#" className="hover:text-primary transition-colors flex items-center gap-2 group">
            <span className="text-syntax-keyword">$</span>
            <span className="group-hover:translate-x-0.5 transition-transform">ai --search</span>
          </a>
          <a href="#" className="hover:text-primary transition-colors flex items-center gap-2 group">
             <span className="text-syntax-keyword">$</span>
            <span className="group-hover:translate-x-0.5 transition-transform">cd /categories</span>
          </a>
          <a href="#" className="hover:text-primary transition-colors flex items-center gap-2 group">
             <span className="text-syntax-keyword">$</span>
            <span className="group-hover:translate-x-0.5 transition-transform">man docs</span>
          </a>
        </nav>

        {/* Auth / Actions */}
        <div className="flex items-center gap-4">
           {/* Mobile Menu Button could go here */}
           
           <button className="hidden sm:flex items-center gap-2 px-4 py-1.5 text-sm font-mono font-medium text-primary border border-primary/20 rounded hover:bg-primary/5 transition-colors">
              <span className="text-syntax-keyword">$</span> Sign In
           </button>
        </div>
      </div>
    </header>
  );
}
