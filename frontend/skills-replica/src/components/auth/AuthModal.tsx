import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { X, Mail, Lock, Loader } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-candy p-8 animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-text-muted hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-candy text-primary mb-2">
            {isLogin ? 'Welcome Back!' : 'Join the Club!'}
          </h2>
          <p className="text-text-muted font-body">
            {isLogin ? 'Ready for more sweets?' : 'Get exclusive deals and treats.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-500 text-sm rounded-xl font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-muted uppercase ml-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-5 h-5 text-primary/50" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-12 pl-12 pr-4 bg-background border border-transparent rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body text-text-main placeholder:text-text-muted/30"
                placeholder="candy@lover.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-text-muted uppercase ml-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-primary/50" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-12 pl-12 pr-4 bg-background border border-transparent rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body text-text-main placeholder:text-text-muted/30"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-4 bg-primary text-white font-candy text-lg rounded-2xl hover:bg-pink-600 active:scale-95 transition-all shadow-lg shadow-pink-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader className="w-5 h-5 animate-spin" />}
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm font-bold text-text-muted">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline decoration-2 underline-offset-2"
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </div>
      </div>
    </div>
  );
}
