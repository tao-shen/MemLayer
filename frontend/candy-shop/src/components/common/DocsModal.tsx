import { X, BookOpen, Candy } from 'lucide-react';
import { useEffect, useCallback } from 'react';

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DocsModal({ isOpen, onClose }: DocsModalProps) {
  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Documentation"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-3xl bg-card rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh] border border-border">
        {/* Header */}
        <div className="h-12 bg-secondary/50 border-b border-border flex items-center justify-between px-4 sticky top-0">
          <div className="flex items-center gap-2 text-foreground-secondary font-mono text-sm">
            <BookOpen className="w-4 h-4" />
            <span>Menu.md</span>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-secondary p-2.5 rounded transition-colors duration-200 cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary/30"
            aria-label="Close documentation"
          >
            <X className="w-5 h-5 text-foreground-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto prose prose-zinc dark:prose-invert max-w-none">
          <h1 className="font-candy text-4xl mb-4 text-primary">The Menu (Documentation)</h1>
          <p className="lead font-body text-foreground-secondary">
            Welcome to the Candy Shop! Here you can find the sweetest skills for your Claude AI.
          </p>

          <h3 className="flex items-center gap-2">
            <Candy className="w-5 h-5 text-primary" />
            What is this?
          </h3>
          <p>
            This is a curated collection of <strong>Model Context Protocol (MCP)</strong> servers.
            Think of them as "skills" or "tools" that give Claude new capabilities, like searching
            the web, reading files, or accessing databases.
          </p>

          <h3>How to Install</h3>
          <div className="bg-secondary/50 p-4 rounded-xl border border-border not-prose my-6">
            <ol className="list-decimal list-inside space-y-2 font-mono text-sm text-foreground-secondary">
              <li>Browse the shop and add treats to your bag.</li>
              <li>Open your bag (top right).</li>
              <li>
                Click <strong>Checkout</strong> to copy the merged configuration.
              </li>
              <li>
                Paste it into your <code className="bg-secondary px-1 py-0.5 rounded text-xs">claude_desktop_config.json</code> file.
              </li>
            </ol>
          </div>

          <h3>Config Location</h3>
          <p>You can find your config file at:</p>
          <ul className="font-mono text-xs bg-zinc-900 text-zinc-300 p-4 rounded-lg list-none">
            <li className="mb-2">
              <span className="text-primary">macOS:</span> ~/Library/Application\
              Support/Claude/claude_desktop_config.json
            </li>
            <li>
              <span className="text-info">Windows:</span>{' '}
              %APPDATA%\Claude\claude_desktop_config.json
            </li>
          </ul>

          <div className="mt-8 pt-8 border-t border-border text-center">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-bold shadow-lg hover:bg-primary-hover transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              Got it, let's shop!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
