import { useState, useEffect } from 'react';
import { Menu, X, Heart, Github, Twitter, ShoppingBag } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useVersionMode } from '../../../contexts/VersionModeContext';

interface NormalLayoutProps {
  children: React.ReactNode;
  onOpenAuth: () => void;
  onOpenCart?: () => void;
  user: any;
  cartCount: number;
}

export function NormalLayout({
  children,
  onOpenAuth,
  onOpenCart,
  user,
  cartCount,
}: NormalLayoutProps) {
  const { t } = useLanguage();
  const { toggleMode } = useVersionMode();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
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

  const handleCartClick = () => {
    if (onOpenCart) {
      onOpenCart();
    } else {
      onOpenAuth();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-rose-100 dark:border-gray-700 transition-colors duration-300">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-amber-400 flex items-center justify-center shadow-lg">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent">
                Candy Shop
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <a
                href="#features"
                className="text-gray-600 dark:text-gray-300 hover:text-rose-500 dark:hover:text-rose-400 transition-colors duration-200 font-medium"
              >
                {t('nav.features') || 'Features'}
              </a>
              <a
                href="#skills"
                className="text-gray-600 dark:text-gray-300 hover:text-rose-500 dark:hover:text-rose-400 transition-colors duration-200 font-medium"
              >
                {t('nav.skills') || 'Skills'}
              </a>
              <a
                href="#faq"
                className="text-gray-600 dark:text-gray-300 hover:text-rose-500 dark:hover:text-rose-400 transition-colors duration-200 font-medium"
              >
                {t('nav.faq') || 'FAQ'}
              </a>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Mode Switcher */}
              <button
                onClick={toggleMode}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium hover:shadow-lg hover:scale-105 transition-all duration-200"
                title="Switch to Pro Mode"
              >
                <span className="hidden xs:inline">Pro Mode</span>
                <Github className="w-4 h-4" />
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                aria-label="Toggle theme"
              >
                {isDarkMode ? (
                  <span className="text-yellow-400">☀️</span>
                ) : (
                  <span className="text-gray-600">🌙</span>
                )}
              </button>

              {/* Cart Button */}
              <button
                onClick={handleCartClick}
                className="relative p-2 rounded-full bg-rose-100 dark:bg-rose-900/30 hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors duration-200"
              >
                <ShoppingBag className="w-5 h-5 text-rose-500" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-white text-xs flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 animate-in slide-in-from-top duration-200">
            <div className="container mx-auto px-4 py-4 space-y-3">
              <a
                href="#features"
                className="block py-2 text-gray-600 dark:text-gray-300 hover:text-rose-500 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('nav.features') || 'Features'}
              </a>
              <a
                href="#skills"
                className="block py-2 text-gray-600 dark:text-gray-300 hover:text-rose-500 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('nav.skills') || 'Skills'}
              </a>
              <a
                href="#faq"
                className="block py-2 text-gray-600 dark:text-gray-300 hover:text-rose-500 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('nav.faq') || 'FAQ'}
              </a>
              <button
                onClick={() => {
                  toggleMode();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium"
              >
                <Github className="w-4 h-4" />
                Switch to Pro Mode
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="pt-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-rose-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 border-t border-rose-100 dark:border-gray-700 mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-amber-400 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent">
                  Candy Shop
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 max-w-md">
                {t('footer.description') || 'Discover amazing AI skills to enhance your productivity and creativity.'}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Links</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="text-gray-600 dark:text-gray-400 hover:text-rose-500 transition-colors">
                    {t('nav.features') || 'Features'}
                  </a>
                </li>
                <li>
                  <a href="#skills" className="text-gray-600 dark:text-gray-400 hover:text-rose-500 transition-colors">
                    {t('nav.skills') || 'Skills'}
                  </a>
                </li>
                <li>
                  <a href="#faq" className="text-gray-600 dark:text-gray-400 hover:text-rose-500 transition-colors">
                    {t('nav.faq') || 'FAQ'}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Connect</h4>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </a>
                <a
                  href="#"
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8 text-center text-gray-600 dark:text-gray-400 text-sm">
            © 2025 Candy Shop. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
