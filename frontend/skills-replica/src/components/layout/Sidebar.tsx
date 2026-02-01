import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Grid3X3,
  BookOpen,
  Plus,
  Library,
  ShoppingBag,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Moon,
  Sun,
  Palette,
  Check,
  ChevronDown,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { cn } from '../../utils/cn';

interface SidebarProps {
  onOpenAuth: () => void;
  onOpenCart: () => void;
  user: any;
  cartCount: number;
  onNavFind: () => void;
  onNavCd: () => void;
  onNavMan: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  currentTheme: string;
  onChangeTheme: (theme: string) => void;
}

const navItems = [
  { id: 'find', label: 'find --sweet', icon: Search, action: 'find' },
  { id: 'cd', label: 'cd /chocolates', icon: Grid3X3, action: 'cd' },
  { id: 'man', label: 'man recipes', icon: BookOpen, action: 'man' },
];

const userNavItems = [
  { id: 'create', label: 'create skills', icon: Plus, action: 'create' },
  { id: 'library', label: 'my skills', icon: Library, action: 'library' },
];

// 主题配置
const themes = [
  {
    id: 'indigo',
    name: 'Indigo',
    color: '#5E6AD2',
    light: '#818CF8',
    description: 'Professional & Modern',
  },
  {
    id: 'blue',
    name: 'Ocean',
    color: '#3B82F6',
    light: '#60A5FA',
    description: 'Calm & Trustworthy',
  },
  {
    id: 'emerald',
    name: 'Emerald',
    color: '#10B981',
    light: '#34D399',
    description: 'Fresh & Natural',
  },
  {
    id: 'amber',
    name: 'Sunset',
    color: '#F59E0B',
    light: '#FBBF24',
    description: 'Warm & Energetic',
  },
  { id: 'rose', name: 'Rose', color: '#F43F5E', light: '#FB7185', description: 'Bold & Vibrant' },
  {
    id: 'violet',
    name: 'Purple',
    color: '#8B5CF6',
    light: '#A78BFA',
    description: 'Creative & Elegant',
  },
];

export function Sidebar({
  onOpenAuth,
  onOpenCart,
  user,
  cartCount,
  onNavFind,
  onNavCd,
  onNavMan,
  isDarkMode,
  onToggleTheme,
  currentTheme,
  onChangeTheme,
}: SidebarProps) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const themeSelectorRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭主题选择器
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (themeSelectorRef.current && !themeSelectorRef.current.contains(event.target as Node)) {
        setShowThemeSelector(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavAction = (action: string) => {
    switch (action) {
      case 'find':
        onNavFind();
        break;
      case 'cd':
        onNavCd();
        break;
      case 'man':
        onNavMan();
        break;
      case 'create':
        navigate('/skills/create');
        break;
      case 'library':
        navigate('/skills/library');
        break;
    }
    setMobileOpen(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleThemeChange = (themeId: string) => {
    onChangeTheme(themeId);
    setShowThemeSelector(false);
  };

  const NavButton = ({ item }: { item: (typeof navItems)[0] }) => (
    <button
      onClick={() => handleNavAction(item.action)}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
        'text-sm font-mono transition-all duration-200',
        'hover:bg-secondary hover:text-foreground',
        collapsed ? 'justify-center' : 'justify-start'
      )}
      title={collapsed ? item.label : undefined}
    >
      <item.icon className={cn('w-5 h-5 flex-shrink-0 text-foreground-secondary')} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </button>
  );

  const ThemeSelector = () => (
    <div ref={themeSelectorRef} className="relative">
      <button
        onClick={() => setShowThemeSelector(!showThemeSelector)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
          'text-sm font-mono transition-all duration-200',
          'hover:bg-secondary',
          collapsed ? 'justify-center' : 'justify-between'
        )}
        title={collapsed ? 'Theme' : undefined}
      >
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <Palette className="w-5 h-5 text-foreground-secondary" />
          {!collapsed && <span>Theme</span>}
        </div>
        {!collapsed && (
          <ChevronDown
            className={cn(
              'w-4 h-4 text-foreground-secondary transition-transform',
              showThemeSelector && 'rotate-180'
            )}
          />
        )}
      </button>

      {/* 主题选择下拉菜单 */}
      {showThemeSelector && (
        <div
          className={cn(
            'absolute bottom-full mb-2 left-0 right-0',
            'bg-card border border-border rounded-lg shadow-lg',
            'py-2 z-50 animate-fade-in',
            collapsed ? 'w-48' : 'w-full'
          )}
          style={collapsed ? { left: '50%', transform: 'translateX(-50%)' } : {}}
        >
          <div className="px-3 py-1.5 text-xs font-mono text-foreground-secondary uppercase tracking-wider">
            Choose Theme
          </div>
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2',
                'hover:bg-secondary transition-colors',
                currentTheme === theme.id && 'bg-secondary/50'
              )}
            >
              <div
                className="w-5 h-5 rounded-full border-2 border-border flex items-center justify-center"
                style={{ backgroundColor: isDarkMode ? theme.light : theme.color }}
              >
                {currentTheme === theme.id && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-foreground">{theme.name}</div>
                {!collapsed && (
                  <div className="text-xs text-foreground-secondary">{theme.description}</div>
                )}
              </div>
              {currentTheme === theme.id && <Check className="w-4 h-4 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-5 border-b border-border',
          collapsed ? 'justify-center' : 'justify-between'
        )}
      >
        {!collapsed && (
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <span className="text-2xl leading-none">🍬</span>
            <span className="font-bold text-lg font-candy">~/Skills</span>
          </button>
        )}
        {collapsed && <span className="text-2xl leading-none">🍬</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavButton key={item.id} item={item} />
        ))}

        {user && (
          <>
            <div className={cn('pt-4 pb-2', collapsed ? 'px-2' : 'px-3')}>
              {!collapsed && (
                <span className="text-xs font-mono text-foreground-secondary uppercase tracking-wider">
                  Library
                </span>
              )}
            </div>
            {userNavItems.map((item) => (
              <NavButton key={item.id} item={item} />
            ))}
          </>
        )}
      </nav>

      {/* Bottom Section */}
      <div
        className={cn(
          'border-t border-border px-3 py-4 space-y-2',
          collapsed ? 'items-center' : ''
        )}
      >
        {/* Theme Selector */}
        <ThemeSelector />

        {/* Light/Dark Mode Toggle */}
        <button
          onClick={onToggleTheme}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
            'text-sm font-mono transition-all duration-200',
            'hover:bg-secondary',
            collapsed ? 'justify-center' : 'justify-start'
          )}
          title={collapsed ? (isDarkMode ? 'Light' : 'Dark') : undefined}
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-foreground-secondary" />
          ) : (
            <Moon className="w-5 h-5 text-foreground-secondary" />
          )}
          {!collapsed && <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {/* Cart */}
        <button
          onClick={onOpenCart}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
            'text-sm font-mono transition-all duration-200',
            'hover:bg-secondary',
            collapsed ? 'justify-center' : 'justify-start'
          )}
          title={collapsed ? 'Cart' : undefined}
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 text-foreground-secondary" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
          {!collapsed && <span>Cart</span>}
        </button>

        {/* User Section */}
        {user ? (
          <div
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg',
              'bg-secondary/50 border border-border',
              collapsed ? 'justify-center' : ''
            )}
          >
            {/* Avatar */}
            {(() => {
              const avatarUrl =
                user.user_metadata?.avatar_url ||
                user.user_metadata?.picture ||
                user.picture ||
                user.identities?.[0]?.identity_data?.avatar_url;

              if (avatarUrl) {
                return (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full border border-border"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                );
              }
              return (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
              );
            })()}
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.user_metadata?.full_name ||
                    user.user_metadata?.name ||
                    user.email?.split('@')[0] ||
                    'Agent'}
                </p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={handleSignOut}
                className="p-1.5 text-foreground-secondary hover:text-error hover:bg-error/10 rounded-full transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
              'text-sm font-mono transition-all duration-200',
              'bg-primary text-primary-foreground hover:bg-primary-hover',
              collapsed ? 'justify-center' : 'justify-start'
            )}
            title={collapsed ? 'Login' : undefined}
          >
            <User className="w-5 h-5" />
            {!collapsed && <span>Login</span>}
          </button>
        )}

        {/* Collapse Toggle - Desktop */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'hidden lg:flex w-full items-center gap-3 px-3 py-2.5 rounded-lg',
            'text-sm font-mono transition-all duration-200',
            'hover:bg-secondary',
            collapsed ? 'justify-center' : 'justify-start'
          )}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 text-foreground-secondary" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5 text-foreground-secondary" />
              <span className="text-foreground-secondary">Collapse</span>
            </>
          )}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className={cn(
          'lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg',
          'bg-background border border-border shadow-md',
          'hover:bg-secondary transition-colors'
        )}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-background border-r border-border',
          'transform transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-secondary transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="pt-12">
          <SidebarContent />
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col fixed inset-y-0 left-0 z-30',
          'bg-card border-r border-border transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
