import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { Layout } from './components/layout/Layout';
import { Hero } from './components/home/Hero';
import { SkillsGrid } from './components/home/SkillsGrid';
import { Categories } from './components/home/Categories';
import { ExternalResources } from './components/home/ExternalResources';
import { FAQ } from './components/home/FAQ';
import { AuthModal } from './components/auth/AuthModal';
import { CartDrawer } from './components/common/CartDrawer';
import { DocsModal } from './components/common/DocsModal';

function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [cart, setCart] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAddToCart = (id: string) => {
    setCart(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleClearCart = () => setCart(new Set());

  // Navigation Handlers
  const handleSearchFocus = () => {
    document.getElementById('search-input')?.focus();
    document.getElementById('skills-grid')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCategoryScroll = () => {
    document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Layout
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        user={user}
        cartCount={cart.size}
        onNavFind={handleSearchFocus}
        onNavCd={handleCategoryScroll}
        onNavMan={() => setIsDocsOpen(true)}
      >
        <Hero onOpenDocs={() => setIsDocsOpen(true)} />
        <Categories onSelectCategory={(cat) => {
          setCategoryFilter(cat);
          setSearchQuery(''); // Reset search when picking category usually
          document.getElementById('skills-grid')?.scrollIntoView({ behavior: 'smooth' });
        }} />
        <SkillsGrid
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          cart={cart}
          onToggleCart={handleAddToCart}
        />
        <ExternalResources />
        <FAQ />
      </Layout>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartIds={cart}
        onRemove={handleRemoveFromCart}
        onClear={handleClearCart}
      />

      <DocsModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />
    </>
  );
}

export default App;
