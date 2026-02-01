import { X, BookOpen } from 'lucide-react';

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DocsModal({ isOpen, onClose }: DocsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-window overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="h-12 bg-gray-100 border-b border-gray-200 flex items-center justify-between px-4 sticky top-0">
          <div className="flex items-center gap-2 text-gray-500 font-mono text-sm">
            <BookOpen className="w-4 h-4" />
            <span>Menu.md</span>
          </div>
          <button onClick={onClose} className="hover:bg-gray-200 p-1 rounded transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto prose prose-zinc max-w-none">
          <h1 className="font-candy text-4xl mb-4 text-primary">The Menu (Documentation)</h1>
          <p className="lead font-body text-gray-600">
            Welcome to the Candy Shop! Here you can find the sweetest skills for your Claude AI.
          </p>

          <h3>🍬 What is this?</h3>
          <p>
            This is a curated collection of <strong>Model Context Protocol (MCP)</strong> servers.
            Think of them as "skills" or "tools" that give Claude new capabilities, like searching
            the web, reading files, or accessing databases.
          </p>

          <h3>📦 How to Install</h3>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 not-prose my-6">
            <ol className="list-decimal list-inside space-y-2 font-mono text-sm text-gray-700">
              <li>Broswse the shop and add treats to your bag.</li>
              <li>Open your bag (top right).</li>
              <li>
                Click <strong>Checkout</strong> to copy the merged configuration.
              </li>
              <li>
                Paste it into your <code>claude_desktop_config.json</code> file.
              </li>
            </ol>
          </div>

          <h3>📂 Config Location</h3>
          <p>You can find your config file at:</p>
          <ul className="font-mono text-xs bg-gray-900 text-gray-300 p-4 rounded-lg list-none">
            <li className="mb-2">
              <span className="text-primary">macOS:</span> ~/Library/Application\
              Support/Claude/claude_desktop_config.json
            </li>
            <li>
              <span className="text-info">Windows:</span>{' '}
              %APPDATA%\Claude\claude_desktop_config.json
            </li>
          </ul>

          <div className="mt-8 pt-8 border-t border-gray-100 text-center">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-primary text-white rounded-full font-bold shadow-lg hover:bg-primary-hover transition-colors"
            >
              Got it, let's shop!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
