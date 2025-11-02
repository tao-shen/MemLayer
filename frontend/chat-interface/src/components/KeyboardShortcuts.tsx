import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CommandLineIcon } from '@heroicons/react/24/outline';
import { useKeyboardShortcut } from '@/hooks/useAccessibility';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  // Navigation
  { keys: ['Cmd/Ctrl', 'K'], description: 'Open search', category: 'Navigation' },
  { keys: ['Cmd/Ctrl', 'N'], description: 'New session', category: 'Navigation' },
  { keys: ['Cmd/Ctrl', 'B'], description: 'Toggle sidebar', category: 'Navigation' },
  { keys: ['Cmd/Ctrl', '/'], description: 'Show keyboard shortcuts', category: 'Navigation' },
  
  // Chat
  { keys: ['Enter'], description: 'Send message', category: 'Chat' },
  { keys: ['Shift', 'Enter'], description: 'New line', category: 'Chat' },
  { keys: ['Cmd/Ctrl', 'R'], description: 'Regenerate response', category: 'Chat' },
  
  // Visualization
  { keys: ['Cmd/Ctrl', '1'], description: 'Timeline view', category: 'Visualization' },
  { keys: ['Cmd/Ctrl', '2'], description: 'Graph view', category: 'Visualization' },
  { keys: ['Cmd/Ctrl', '3'], description: 'List view', category: 'Visualization' },
  { keys: ['Cmd/Ctrl', '4'], description: 'Stats view', category: 'Visualization' },
  { keys: ['Cmd/Ctrl', '5'], description: 'Blockchain view', category: 'Visualization' },
  
  // General
  { keys: ['Esc'], description: 'Close dialog/modal', category: 'General' },
  { keys: ['Tab'], description: 'Navigate forward', category: 'General' },
  { keys: ['Shift', 'Tab'], description: 'Navigate backward', category: 'General' },
];

/**
 * Keyboard shortcuts help dialog
 */
export const KeyboardShortcuts: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Cmd/Ctrl + / to toggle shortcuts dialog
  useKeyboardShortcut('/', () => setIsOpen((prev) => !prev), { meta: true });
  useKeyboardShortcut('/', () => setIsOpen((prev) => !prev), { ctrl: true });

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Show keyboard shortcuts"
        title="Keyboard shortcuts (Cmd/Ctrl + /)"
      >
        <CommandLineIcon className="w-5 h-5" />
      </button>

      {/* Dialog */}
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setIsOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl transition-all">
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Keyboard Shortcuts
                    </Dialog.Title>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      aria-label="Close"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
                    {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
                      <div key={category} className="mb-6 last:mb-0">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                          {category}
                        </h3>
                        <div className="space-y-2">
                          {categoryShortcuts.map((shortcut, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between py-2"
                            >
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {shortcut.description}
                              </span>
                              <div className="flex items-center gap-1">
                                {shortcut.keys.map((key, keyIndex) => (
                                  <Fragment key={keyIndex}>
                                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">
                                      {key}
                                    </kbd>
                                    {keyIndex < shortcut.keys.length - 1 && (
                                      <span className="text-gray-500 dark:text-gray-400">
                                        +
                                      </span>
                                    )}
                                  </Fragment>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                      Press <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-gray-200 dark:bg-gray-700 rounded">Esc</kbd> or{' '}
                      <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-gray-200 dark:bg-gray-700 rounded">Cmd/Ctrl</kbd> +{' '}
                      <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-gray-200 dark:bg-gray-700 rounded">/</kbd> to close
                    </p>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};
