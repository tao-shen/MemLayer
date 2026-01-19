import { Routes, Route } from 'react-router-dom';
import { Header, Footer } from './components';
import { 
  HomePage, 
  CategoryPage, 
  CategoriesPage, 
  SearchPage, 
  AgentDetailPage 
} from './pages';

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/categories/:slug" element={<CategoryPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/agent/:id" element={<AgentDetailPage />} />
          
          {/* Placeholder routes */}
          <Route path="/favorites" element={<PlaceholderPage title="My Favorites" />} />
          <Route path="/cart" element={<PlaceholderPage title="Shopping Cart" />} />
          <Route path="/dashboard" element={<PlaceholderPage title="Dashboard" />} />
          <Route path="/signup" element={<PlaceholderPage title="Sign Up" />} />
          <Route path="/become-seller" element={<PlaceholderPage title="Become a Seller" />} />
          <Route path="/seller/:username" element={<PlaceholderPage title="Seller Profile" />} />
          
          {/* Footer links */}
          <Route path="/about" element={<PlaceholderPage title="About Us" />} />
          <Route path="/terms" element={<PlaceholderPage title="Terms of Service" />} />
          <Route path="/privacy" element={<PlaceholderPage title="Privacy Policy" />} />
          <Route path="/help" element={<PlaceholderPage title="Help Center" />} />
          <Route path="/docs" element={<PlaceholderPage title="Developer Docs" />} />
          <Route path="/api" element={<PlaceholderPage title="API" />} />
          <Route path="/partners" element={<PlaceholderPage title="Partners" />} />
          <Route path="/contact" element={<PlaceholderPage title="Contact Us" />} />
          <Route path="/trust" element={<PlaceholderPage title="Trust & Safety" />} />
          <Route path="/accessibility" element={<PlaceholderPage title="Accessibility" />} />
          
          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
        <p className="text-gray-500">This page is under construction...</p>
      </div>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="text-8xl mb-4">🔍</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h1>
        <p className="text-gray-500 mb-6">Sorry, the page you're looking for doesn't exist.</p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}

export default App;
