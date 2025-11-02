import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  position?: 'left' | 'right' | 'bottom';
}

/**
 * Mobile drawer component with slide-in animation
 */
export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'left',
}) => {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const getTransformClasses = () => {
    switch (position) {
      case 'left':
        return {
          enter: '-translate-x-full',
          enterTo: 'translate-x-0',
          leave: 'translate-x-0',
          leaveTo: '-translate-x-full',
        };
      case 'right':
        return {
          enter: 'translate-x-full',
          enterTo: 'translate-x-0',
          leave: 'translate-x-0',
          leaveTo: 'translate-x-full',
        };
      case 'bottom':
        return {
          enter: 'translate-y-full',
          enterTo: 'translate-y-0',
          leave: 'translate-y-0',
          leaveTo: 'translate-y-full',
        };
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'left':
        return 'left-0 top-0 bottom-0 w-80 max-w-[85vw]';
      case 'right':
        return 'right-0 top-0 bottom-0 w-80 max-w-[85vw]';
      case 'bottom':
        return 'left-0 right-0 bottom-0 max-h-[85vh] rounded-t-2xl';
    }
  };

  const transforms = getTransformClasses();

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
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

        {/* Drawer */}
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-300"
              enterFrom={transforms.enter}
              enterTo={transforms.enterTo}
              leave="transform transition ease-in-out duration-300"
              leaveFrom={transforms.leave}
              leaveTo={transforms.leaveTo}
            >
              <Dialog.Panel
                className={`fixed ${getPositionClasses()} bg-white dark:bg-gray-900 shadow-xl flex flex-col`}
              >
                {/* Header */}
                {title && (
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {title}
                    </Dialog.Title>
                    <button
                      onClick={onClose}
                      className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      aria-label="Close drawer"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto">{children}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

/**
 * Hook to manage drawer state
 */
export function useMobileDrawer(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((prev) => !prev);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
