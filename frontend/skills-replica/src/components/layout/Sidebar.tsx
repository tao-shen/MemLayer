import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
}: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const NavButton = ({ item }: { item: (typeof navItems)[0] }) => (
    <button
      onClick={() => handleNavAction(item.action)}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
        'text-sm font-mono transition-all duration-200',
        'hover:bg-accent hover:text-accent-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        collapsed ? 'justify-center' : 'justify-start'
      )}
      title={collapsed ? item.label : undefined}
    >
      <item.icon
        className={cn(
          'w-5 h-5 flex-shrink-0',
          location.pathname === '/' &&
            item.action === 'find' &&
            item.action === 'find' &&
            item.action === 'find'
            ? 'text-primary'
            : 'text-muted-foreground'
        )}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </button>
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
            <span className="font-bold text-lg font-candy">~/Candy-Shop</span>
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
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
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
        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
            'text-sm font-mono transition-all duration-200',
            'hover:bg-accent hover:text-accent-foreground',
            collapsed ? 'justify-center' : 'justify-start'
          )}
          title={collapsed ? (isDarkMode ? 'Light mode' : 'Dark mode') : undefined}
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-muted-foreground" />
          ) : (
            <Moon className="w-5 h-5 text-muted-foreground" />
          )}
          {!collapsed && <span>{isDarkMode ? 'Light mode' : 'Dark mode'}</span>}
        </button>

        {/* Cart */}
        <button
          onClick={onOpenCart}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
            'text-sm font-mono transition-all duration-200',
            'hover:bg-accent hover:text-accent-foreground',
            collapsed ? 'justify-center' : 'justify-start'
          )}
          title={collapsed ? 'Cart' : undefined}
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 text-muted-foreground" />
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
            {/* Avatar with multiple fallback sources */}
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
                      // Fallback to default icon on error
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
                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
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
              'bg-primary text-primary-foreground hover:bg-primary/90',
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
            'hidden lg:flex w-full items-center gap-3 px-3 py-2 rounded-lg',
            'text-sm font-mono transition-all duration-200',
            'hover:bg-accent hover:text-accent-foreground',
            collapsed ? 'justify-center' : 'justify-start'
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              <span className="text-muted-foreground">Collapse</span>
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
          'bg-background border border-border shadow-card',
          'hover:bg-accent transition-colors'
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
          'transform transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-accent transition-colors"
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
