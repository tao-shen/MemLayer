import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { Layout } from './components/layout/Layout';
import { Hero } from './components/home/Hero';
import { SkillsGrid } from './components/home/SkillsGrid';
import { Categories } from './components/home/Categories';
import { FAQ } from './components/home/FAQ';
import { AuthModal } from './components/auth/AuthModal';

function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <Layout onOpenAuth={() => setIsAuthOpen(true)} user={user}>
        <Hero />
        <Categories />
        <SkillsGrid />
        <FAQ />
      </Layout>
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}

export default App;
