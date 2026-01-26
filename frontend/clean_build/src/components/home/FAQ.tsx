import { FileIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const FAQS = [
  { q: 'Is this sugar-free?', a: 'We have a dedicated module for sugar-free options. Run `$ npm install @candy/sugar-free` to verify.' },
  { q: 'Do you ship internationally?', a: 'Yes! We deploy happiness globally. Check our shipping manifest for restricted regions.' },
  { q: 'Can I return open wrappers?', a: 'Negative. Once executed, consumption is irreversible. Please review our `REFUND_POLICY.md`.' },
  { q: 'Bulk API access?', a: 'For wholesale orders, please authenticate as an enterprise partner using our Wholesale API.' },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-20 bg-background">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl border border-pink-200 shadow-candy overflow-hidden">
          <div className="h-10 bg-pink-50 border-b border-pink-200 flex items-center px-4 gap-2">
            <FileIcon className="w-4 h-4 text-pink-400" />
            <span className="text-sm font-mono text-text-main">FAQ.md</span>
          </div>
          
          <div className="p-8">
            <h2 className="text-3xl font-candy font-bold mb-8 text-primary border-b border-pink-100 pb-4"># Frequently Asked Questions</h2>
            
            <div className="space-y-4">
              {FAQS.map((faq, i) => (
                <div key={i} className="border border-pink-100 rounded-lg overflow-hidden">
                  <button 
                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-pink-50 transition-colors font-mono text-sm"
                  >
                    {openIndex === i ? <ChevronDown className="w-4 h-4 text-primary" /> : <ChevronRight className="w-4 h-4 text-text-muted" />}
                    <span className="text-secondary font-bold">## {i + 1}. {faq.q}</span>
                  </button>
                  
                  {openIndex === i && (
                    <div className="px-4 pb-4 pl-11 text-text-muted text-sm leading-relaxed border-t border-pink-100 bg-pink-50/30 pt-4 font-body">
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
