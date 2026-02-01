import { X, Trash2, Download, Copy, Check, Terminal } from 'lucide-react';
import { useState } from 'react';
import { SKILLS_DATA } from '../../data/skillsData';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartIds: Set<string>;
  onRemove: (id: string) => void;
  onClear: () => void;
  onPurchase: () => void;
}

export function CartDrawer({ isOpen, onClose, cartIds, onRemove, onClear, onPurchase }: CartDrawerProps) {
  const [copied, setCopied] = useState(false);

  // Get full skill objects from IDs
  const cartItems = SKILLS_DATA.filter(skill => cartIds.has(skill.id));

  // Merge configurations
  const mergedConfig = {
    mcpServers: cartItems.reduce((acc, skill) => {
      return { ...acc, ...skill.config };
    }, {})
  };

  const configString = JSON.stringify(mergedConfig, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(configString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity z-[100] ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 z-[101] flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🛍️</div>
            <h2 className="text-xl font-candy font-bold text-gray-900">Your Bag</h2>
            <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">
              {cartItems.length} items
            </span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cartItems.length === 0 ? (
            <div className="text-center py-20 opacity-50">
              <div className="text-6xl mb-4">🕸️</div>
              <p className="font-mono text-gray-500">Your bag is empty.</p>
              <button onClick={onClose} className="mt-4 text-primary hover:underline font-bold text-sm">
                Browse Treats
              </button>
            </div>
          ) : (
            <>
              {/* List */}
              <div className="space-y-3">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 border border-gray-100 rounded-xl group hover:border-primary/20 transition-colors">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${item.color}`}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-800 text-sm truncate">{item.name}</h4>
                      <p className="font-mono text-xs text-gray-400 truncate">{item.id}</p>
                    </div>
                    <button 
                      onClick={() => onRemove(item.id)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Config Builder Preview */}
              <div className="bg-gray-900 rounded-xl overflow-hidden mt-8 shadow-lg">
                <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                    <Terminal className="w-3 h-3" />
                    claude_desktop_config.json
                  </div>
                  <button 
                    onClick={handleCopy}
                    className="text-xs text-white/80 hover:text-white flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="p-4 overflow-x-auto">
                  <pre className="text-xs text-green-400 font-mono">
                    {configString}
                  </pre>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="p-6 border-t border-gray-100 bg-gray-50 space-y-3">
            <button 
              onClick={handleCopy}
              className="w-full py-3 bg-primary text-white rounded-xl font-bold font-candy text-lg shadow-lg shadow-primary/20 hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              checkout --merge
            </button>
            <button 
              onClick={onPurchase}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold font-candy text-lg shadow-lg shadow-green-200 hover:from-green-600 hover:to-emerald-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Complete Purchase
            </button>
            <button 
              onClick={onClear}
              className="w-full py-2 text-gray-400 text-xs font-mono hover:text-red-500 transition-colors"
            >
              $ rm -rf ./bag/*
            </button>
          </div>
        )}
      </div>
    </>
  );
}
