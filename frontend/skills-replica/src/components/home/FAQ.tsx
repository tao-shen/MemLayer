import { FileIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const FAQS = [
  { q: 'How do I install a skill?', a: 'You can install any skill using our CLI tool: `$ ai install author/skill`. Or use the package manager directly in your agent framework.' },
  { q: 'Is this compatible with LangChain?', a: 'Yes! All skills export standard interfaces compatible with LangChain, AutoGen, and BabyAGI out of the box.' },
  { q: 'How do I publish my own?', a: 'Authenticate with `$ ai login`, then run `$ ai publish` in your project directory. See the docs for manifest requirements.' },
  { q: 'Is there a free tier?', a: 'Public skills are always free to host and install. Private registries are available for enterprise teams.' },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-20 bg-background">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="bg-surface rounded-xl border border-border shadow-window overflow-hidden">
          <div className="h-10 bg-gray-50 border-b border-border flex items-center px-4 gap-2">
            <FileIcon className="w-4 h-4 text-text-muted" />
            <span className="text-sm font-mono text-text-main">FAQ.md</span>
          </div>
          
          <div className="p-8">
            <h2 className="text-3xl font-bold mb-8 font-sans border-b border-border pb-4"># Frequently Asked Questions</h2>
            
            <div className="space-y-4">
              {FAQS.map((faq, i) => (
                <div key={i} className="border border-border rounded-lg overflow-hidden">
                  <button 
                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors font-mono text-sm"
                  >
                    {openIndex === i ? <ChevronDown className="w-4 h-4 text-primary" /> : <ChevronRight className="w-4 h-4 text-text-muted" />}
                    <span className="text-secondary font-bold">## {i + 1}. {faq.q}</span>
                  </button>
                  
                  {openIndex === i && (
                    <div className="px-4 pb-4 pl-11 text-text-muted text-sm leading-relaxed border-t border-border/50 bg-gray-50/30 pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
