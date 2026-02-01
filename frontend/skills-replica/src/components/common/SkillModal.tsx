import { X, Copy, Check, Terminal } from 'lucide-react';
import { useState } from 'react';
import type { Skill } from '../../data/skillsData';

interface SkillModalProps {
  skill: Skill | null;
  onClose: () => void;
}

export function SkillModal({ skill, onClose }: SkillModalProps) {
  const [copied, setCopied] = useState(false);

  if (!skill) return null;

  const configString = JSON.stringify(skill.config, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(configString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>
      
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className={`h-32 ${skill.color.replace('text-', 'bg-').replace('100', '50')} relative flex items-center justify-center`}>
           <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="text-6xl animate-bounce duration-[2000ms]">
            {skill.icon}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
             <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{skill.category}</div>
             <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
               Ready to Serve
             </div>
          </div>
          
          <h2 className="text-3xl font-candy font-bold text-gray-900 mb-2">{skill.name}</h2>
          <p className="text-gray-600 text-lg mb-8 font-body leading-relaxed">{skill.description}</p>

          {/* Install Command */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              Quick Install
            </h3>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto flex items-center justify-between group">
               <code>{skill.installCommand}</code>
               <button 
                 onClick={() => {
                    navigator.clipboard.writeText(skill.installCommand);
                 }}
                 className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-white/10 rounded"
               >
                 <Copy className="w-4 h-4" />
               </button>
            </div>
          </div>

          {/* Config JSON */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-900">Claude Desktop Config</h3>
              <button 
                onClick={handleCopy}
                className="flex items-center gap-2 text-sm text-primary font-medium hover:text-primary transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Config'}
              </button>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 font-mono text-sm text-gray-700 overflow-auto max-h-64 shadow-inner">
              <pre>{configString}</pre>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
           <button 
             onClick={onClose}
             className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20"
           >
             Done
           </button>
        </div>
      </div>
    </div>
  );
}
