import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  onOpenAuth: () => void;
  onOpenCart: () => void;
  user: any;
  cartCount: number;
  onNavFind: () => void;
  onNavCd: () => void;
  onNavMan: () => void;
}

export function Layout({
  children,
  onOpenAuth,
  onOpenCart,
  user,
  cartCount,
  onNavFind,
  onNavCd,
  onNavMan,
}: LayoutProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        onOpenAuth={onOpenAuth}
        onOpenCart={onOpenCart}
        user={user}
        cartCount={cartCount}
        onNavFind={onNavFind}
        onNavCd={onNavCd}
        onNavMan={onNavMan}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />
      <main className="lg:pl-64 min-h-screen">
        <div className="container max-w-7xl mx-auto px-4 sm:px-8 py-8 md:py-12">{children}</div>
      </main>

      {/* Simple Footer Placeholder */}
      <footer className="w-full border-t border-border py-6 mt-12 bg-card/50 relative">
        <div className="container max-w-7xl mx-auto px-4 flex items-center justify-between text-xs text-muted-foreground font-mono">
          <p>$ echo "Made with sugar, spice, and AI"</p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="hover:text-primary transition-colors"
          >
            $ cd top
          </button>
        </div>
      </footer>
    </div>
  );
}
