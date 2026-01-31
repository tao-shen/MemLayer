import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import { Layout } from './components/layout/Layout';
import { Hero } from './components/home/Hero';
import { SkillsGrid } from './components/home/SkillsGrid';
import { Categories } from './components/home/Categories';
import { ExternalResources } from './components/home/ExternalResources';
import { FAQ } from './components/home/FAQ';
import { AuthModal } from './components/auth/AuthModal';
import { AuthCallback } from './components/auth/AuthCallback';
import { CartDrawer } from './components/common/CartDrawer';
import { DocsModal } from './components/common/DocsModal';
import { SkillCreationPage } from './pages/SkillCreationPage';
import { MySkillsLibrary } from './components/skill-creator/MySkillsLibrary';
import { SkillExecutor } from './components/skill-creator/SkillExecutor';
import type { Skill, SkillCategory } from './types/skill-creator';
import { storageUtils } from './utils/storage';
import { SKILLS_DATA } from './data/skillsData';

function HomePage({
  user,
  cart,
  onToggleCart,
  onOpenAuth,
  onOpenCart,
  onOpenDocs,
}: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const handleSearchFocus = () => {
    document.getElementById('search-input')?.focus();
    document.getElementById('skills-grid')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCategoryScroll = () => {
    document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Layout
      onOpenAuth={onOpenAuth}
      onOpenCart={onOpenCart}
      user={user}
      cartCount={cart.size}
      onNavFind={handleSearchFocus}
      onNavCd={handleCategoryScroll}
      onNavMan={onOpenDocs}
    >
      <Hero onOpenDocs={onOpenDocs} />
      <Categories onSelectCategory={(cat) => {
        setCategoryFilter(cat);
        setSearchQuery('');
        document.getElementById('skills-grid')?.scrollIntoView({ behavior: 'smooth' });
      }} />
      <SkillsGrid
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        cart={cart}
        onToggleCart={onToggleCart}
        user={user}
        onOpenAuth={onOpenAuth}
      />
      <ExternalResources />
      <FAQ />
    </Layout>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [cart, setCart] = useState<Set<string>>(new Set());
  const [executingSkill, setExecutingSkill] = useState<Skill | null>(null);

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

  const handlePurchase = () => {
    // Check if user is logged in
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    // Convert store skills to user skills
    const storeSkills = SKILLS_DATA.filter(skill => cart.has(skill.id));

    storeSkills.forEach(storeSkill => {
      // Check if already owned
      const existing = storageUtils.getSkills().find(s => s.name === storeSkill.name && s.origin === 'store');

      if (!existing) {
        storageUtils.saveSkill({
          name: storeSkill.name,
          description: storeSkill.description,
          category: storeSkill.category as SkillCategory,
          icon: storeSkill.icon,
          color: storeSkill.color,
          config: {
            capabilities: [],
            systemPrompt: '',
            parameters: storeSkill.config,
            tools: []
          },
          origin: 'store',
          status: 'active',
          sourceFiles: [],
          installCommand: storeSkill.installCommand
        });
      }
    });

    setCart(new Set());
    setIsCartOpen(false);
    navigate('/skills/library');
  };

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              user={user}
              cart={cart}
              onToggleCart={handleAddToCart}
              onOpenAuth={() => setIsAuthOpen(true)}
              onOpenCart={() => setIsCartOpen(true)}
              onOpenDocs={() => setIsDocsOpen(true)}
            />
          }
        />
        <Route
          path="/skills/create"
          element={
            <Layout
              onOpenAuth={() => setIsAuthOpen(true)}
              onOpenCart={() => setIsCartOpen(true)}
              user={user}
              cartCount={cart.size}
              onNavFind={() => {
                navigate('/');
                setTimeout(() => {
                  document.getElementById('search-input')?.focus();
                  document.getElementById('skills-grid')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              onNavCd={() => {
                navigate('/');
                setTimeout(() => {
                  document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              onNavMan={() => setIsDocsOpen(true)}
            >
              <SkillCreationPage
                onComplete={() => {
                  navigate('/skills/library');
                }}
                onCancel={() => navigate('/')}
              />
            </Layout>
          }
        />
        <Route
          path="/skills/library"
          element={
            <Layout
              onOpenAuth={() => setIsAuthOpen(true)}
              onOpenCart={() => setIsCartOpen(true)}
              user={user}
              cartCount={cart.size}
              onNavFind={() => {
                navigate('/');
                setTimeout(() => {
                  document.getElementById('search-input')?.focus();
                  document.getElementById('skills-grid')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              onNavCd={() => {
                navigate('/');
                setTimeout(() => {
                  document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              onNavMan={() => setIsDocsOpen(true)}
            >
              <MySkillsLibrary
                onCreateNew={() => navigate('/skills/create')}
                onUseSkill={(skill) => setExecutingSkill(skill)}
                onBack={() => navigate('/')}
              />
            </Layout>
          }
        />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/index.html" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartIds={cart}
        onRemove={handleRemoveFromCart}
        onClear={handleClearCart}
        onPurchase={handlePurchase}
      />

      <DocsModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />

      {executingSkill && (
        <SkillExecutor
          skill={executingSkill}
          onClose={() => setExecutingSkill(null)}
        />
      )}
    </>
  );
}

function App() {
  return (
    <BrowserRouter basename="/Tacits">
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
