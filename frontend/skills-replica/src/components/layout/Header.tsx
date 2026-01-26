import { ShoppingBag, User } from 'lucide-react';

interface HeaderProps {
  onOpenAuth: () => void;
  user: any;
}

export function Header({ onOpenAuth, user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md shadow-sm border-b border-primary/10">
      <div className="container flex h-20 items-center justify-between px-4 sm:px-8 max-w-7xl mx-auto">
        {/* Logo Area */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <div className="text-2xl pt-1">🍬</div>
          </div>
          <span className="font-candy font-bold text-2xl text-primary tracking-wide">
            Candy Shop
          </span>
        </div>

        {/* Navigation - could add later if needed */}
        <nav className="hidden md:flex items-center gap-8 font-body font-bold text-text-muted">
          <a href="#" className="hover:text-primary transition-colors">Gummies</a>
          <a href="#" className="hover:text-primary transition-colors">Chocolate</a>
          <a href="#" className="hover:text-primary transition-colors">Hard Candy</a>
        </nav>

        {/* Auth / Cart */}
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-text-muted hover:text-primary transition-colors">
            <ShoppingBag className="w-6 h-6" />
            <span className="absolute top-0 right-0 w-4 h-4 bg-accent text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-sm">
              3
            </span>
          </button>

          {user ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary/10 text-secondary rounded-full font-candy text-sm hover:bg-secondary/20 cursor-pointer">
              <User className="w-4 h-4" />
              <span>My Profile</span>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="btn-candy bg-primary text-white hover:bg-pink-600"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
