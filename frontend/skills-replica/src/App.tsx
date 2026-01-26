import { Layout } from './components/layout/Layout';
import { Hero } from './components/home/Hero';
import { SocialProof } from './components/home/SocialProof';
import { SkillsGrid } from './components/home/SkillsGrid';
import { Categories } from './components/home/Categories';
import { FAQ } from './components/home/FAQ';

function App() {
  return (
    <Layout>
      <Hero />
      <SocialProof />
      <SkillsGrid />
      <Categories />
      <FAQ />
    </Layout>
  );
}

export default App;
