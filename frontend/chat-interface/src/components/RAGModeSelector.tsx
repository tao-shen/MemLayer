import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import {
  CheckIcon,
  ChevronUpDownIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import type { RAGMode } from '@/types';

interface RAGModeSelectorProps {
  value: RAGMode;
  onChange: (mode: RAGMode) => void;
  disabled?: boolean;
}

const RAG_MODES = [
  {
    value: 'off' as RAGMode,
    label: 'Off',
    description: 'No retrieval augmentation',
    icon: XMarkIcon,
    color: 'text-gray-600 dark:text-gray-400',
  },
  {
    value: 'standard' as RAGMode,
    label: 'Standard RAG',
    description: 'Simple retrieval and generation',
    icon: MagnifyingGlassIcon,
    color: 'text-blue-600 dark:text-blue-400',
  },
  {
    value: 'agentic' as RAGMode,
    label: 'Agentic RAG',
    description: 'Multi-step reasoning with agents',
    icon: SparklesIcon,
    color: 'text-purple-600 dark:text-purple-400',
  },
];

export const RAGModeSelector: React.FC<RAGModeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const selectedMode = RAG_MODES.find((mode) => mode.value === value) || RAG_MODES[0];

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <div className="relative">
        <Listbox.Button
          className={`
            relative w-full cursor-pointer rounded-lg bg-white dark:bg-gray-800 
            py-2 pl-3 pr-10 text-left shadow-sm border border-gray-300 dark:border-gray-600
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 dark:hover:border-gray-500'}
          `}
        >
          <span className="flex items-center gap-2">
            <selectedMode.icon className={`w-5 h-5 ${selectedMode.color}`} />
            <span className="block truncate text-sm font-medium text-gray-900 dark:text-gray-100">
              {selectedMode.label}
            </span>
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </span>
        </Listbox.Button>

        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options
            className="
              absolute z-10 mt-1 max-h-60 w-full min-w-[280px] overflow-auto rounded-lg 
              bg-white dark:bg-gray-800 py-1 text-base shadow-lg 
              ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm
            "
          >
            {RAG_MODES.map((mode) => (
              <Listbox.Option
                key={mode.value}
                className={({ active }) =>
                  `relative cursor-pointer select-none py-3 px-4 ${
                    active
                      ? 'bg-primary-100 dark:bg-primary-900/30'
                      : 'text-gray-900 dark:text-gray-100'
                  }`
                }
                value={mode.value}
              >
                {({ selected }) => (
                  <div className="flex items-start gap-3">
                    <mode.icon
                      className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        selected ? mode.color : 'text-gray-400'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span
                          className={`block truncate text-sm ${
                            selected ? 'font-semibold' : 'font-medium'
                          }`}
                        >
                          {mode.label}
                        </span>
                        {selected && (
                          <CheckIcon
                            className="h-5 w-5 text-primary-600 dark:text-primary-400"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {mode.description}
                      </p>
                    </div>
                  </div>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
};
