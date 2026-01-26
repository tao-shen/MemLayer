import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
  onOpenAuth: () => void;
  user: any;
}

export function Layout({ children, onOpenAuth, user }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col font-mono text-text-main">
      <Header onOpenAuth={onOpenAuth} user={user} />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 md:py-12">
        {children}
      </main>
      
      {/* Simple Footer Placeholder */}
      <footer className="w-full border-t border-border py-6 mt-12 bg-white/50 relative">
        <div className="container max-w-7xl mx-auto px-4 flex items-center justify-between text-xs text-text-muted">
          <p className="font-candy">🍬 Made with sugar, spice, and AI</p>
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="hover:text-primary transition-colors font-candy"
          >
            Back to Top
          </button>
        </div>
      </footer>
    </div>
  );
}
