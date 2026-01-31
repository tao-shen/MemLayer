import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { X, Mail } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSocialLogin = async (provider: 'google' | 'github' | 'wechat' | 'notion') => {
    setLoading(true);
    setError(null);
    try {
      // WeChat often requires 'wechat_work' or specific configuration in Supabase. 
      // Using 'wechat' generic if enabled, otherwise might need custom flow.
      // For Google/GitHub it is standard.
      // Build redirect URL preserving the basename
      const basePath = window.location.pathname.replace(/\/[^/]*$/, '') || '/Tacits';
      const redirectUrl = `${window.location.origin}${basePath}/auth/callback`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          // Redirect to auth callback route
          redirectTo: redirectUrl,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in duration-200 border border-gray-100">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center mb-4 text-2xl">
            🍬
          </div>
          <h2 className="text-2xl font-bold text-gray-900 font-sans">
            Welcome Back
          </h2>
          <p className="text-gray-500 text-sm mt-2 font-mono">
            Sign in to access your sweet inventory.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg font-medium text-center">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {/* Google */}
          <button
            onClick={() => handleSocialLogin('google')}
            disabled={loading}
            className="w-full h-12 flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500 font-mono text-xs">OR EMAIL</span>
          </div>
        </div>

        {/* Traditional Login Button Placeholder - Keeps existing logic available if needed, or just link */}
        <button
          className="w-full h-10 flex items-center justify-center gap-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium"
        >
          <Mail className="w-4 h-4" />
          Sign in with Email code
        </button>

        <p className="mt-8 text-center text-xs text-gray-400">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
