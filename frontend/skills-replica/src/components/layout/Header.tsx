import { Terminal, ShoppingBag, User as UserIcon, LogOut } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface HeaderProps {
  onOpenAuth: () => void;
  user: any;
}

export function Header({ onOpenAuth, user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-pink-200 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8 max-w-7xl mx-auto">
        {/* Logo Area */}
        <div className="flex items-center gap-2 font-mono text-sm md:text-base">
          <Terminal className="h-4 w-4 text-pink-400" />
          <span className="font-bold text-text-main font-candy text-lg">
            ~/ candy-shop
          </span>
          <div className="flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full bg-green-100 border border-green-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[10px] font-medium text-green-700 uppercase tracking-wider font-mono">Open</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-mono text-text-muted">
          <a href="#" className="hover:text-primary transition-colors flex items-center gap-2 group">
            <span className="text-secondary">$</span>
            <span className="group-hover:translate-x-0.5 transition-transform">find --sweet</span>
          </a>
          <a href="#" className="hover:text-primary transition-colors flex items-center gap-2 group">
            <span className="text-secondary">$</span>
            <span className="group-hover:translate-x-0.5 transition-transform">cd /chocolates</span>
          </a>
          <a href="#" className="hover:text-primary transition-colors flex items-center gap-2 group">
            <span className="text-secondary">$</span>
            <span className="group-hover:translate-x-0.5 transition-transform">man recipes</span>
          </a>
        </nav>

        {/* Auth / Cart */}
        <div className="flex items-center gap-4 font-mono text-sm">
          <button className="flex items-center gap-2 hover:text-primary transition-colors">
            <ShoppingBag className="w-4 h-4" />
            <span>[3]</span>
          </button>

          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/5 border border-secondary/20 rounded-full hover:bg-secondary/10 transition-colors">
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Avatar"
                    className="w-5 h-5 rounded-full border border-secondary/20"
                  />
                ) : (
                  <UserIcon className="w-4 h-4 text-secondary" />
                )}
                <span className="font-candy text-secondary text-xs">
                  {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Agent'}
                </span>
              </div>
              <button
                onClick={() => supabase.auth.signOut()}
                className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
                className="flex items-center gap-2 px-4 py-1.5 text-primary border border-primary/20 rounded hover:bg-primary/5 transition-colors"
              >
              <span className="text-secondary">$</span> login
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
