import { Folder, ArrowRight } from 'lucide-react';

const CATEGORIES = [
  { name: 'Gummies', count: 120, exports: ['bears', 'worms', 'rings'] },
  { name: 'Chocolate', count: 85, exports: ['dark', 'milk', 'truffles'] },
  { name: 'Hard_Candy', count: 200, exports: ['lollipops', 'mints', 'rocks'] },
  { name: 'Soft', count: 45, exports: ['marshmallow', 'cotton', 'taffy'] },
  { name: 'Sugar_Free', count: 30, exports: ['gum', 'drops', 'stevia'] },
  { name: 'Bundles', count: 12, exports: ['party', 'gift', 'holiday'] },
];

export function Categories() {
  return (
    <section className="py-20 bg-pink-50 border-t border-pink-200">
      <div className="container max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-8 font-candy flex items-center gap-3 text-text-main">
          <Folder className="w-6 h-6 text-primary" />
          <span>Aisle Directories</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES.map((cat, i) => (
            <div key={i} className="group bg-white p-6 rounded-xl border border-pink-200 shadow-sm hover:shadow-candy transition-all cursor-pointer">
              <div className="font-mono text-sm">
                <div className="text-pink-300 mb-2">// {cat.count} items</div>
                <div className="text-primary mb-1">
                  "{cat.name.toLowerCase()}": <span className="text-text-main">{'{'}</span>
                </div>
                <div className="pl-4 text-text-muted">
                  <span className="text-secondary">contains</span>: [
                  {cat.exports.map((e, idx) => (
                    <span key={idx}>
                      <span className="text-accent">'{e}'</span>
                      {idx < cat.exports.length - 1 && ', '}
                    </span>
                  ))}
                  ]
                </div>
                <div className="text-text-main">{'}'}</div>
              </div>

              <div className="mt-4 pt-4 border-t border-pink-100 flex items-center justify-between text-xs font-mono text-text-muted group-hover:text-primary transition-colors">
                <span>$ cd ./{cat.name.toLowerCase()} && ls</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
