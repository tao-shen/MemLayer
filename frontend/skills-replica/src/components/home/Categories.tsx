import { Folder, ArrowRight } from 'lucide-react';

const CATEGORIES = [
  { name: 'Research', count: 432, exports: ['browser', 'paper-qa', 'summarize'] },
  { name: 'Coding', count: 891, exports: ['git-ops', 'review', 'test-gen'] },
  { name: 'Productivity', count: 1205, exports: ['calendar', 'email', 'notion'] },
  { name: 'Data', count: 567, exports: ['sql', 'csv', 'visualization'] },
  { name: 'Creative', count: 234, exports: ['image-gen', 'video', 'music'] },
  { name: 'Finance', count: 123, exports: ['crypto', 'stripe', 'stocks'] },
];

export function Categories() {
  return (
    <section className="py-20 bg-gray-50 border-t border-border">
      <div className="container max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-8 font-sans flex items-center gap-3">
          <Folder className="w-6 h-6 text-primary" />
          <span>Directories</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES.map((cat, i) => (
            <div key={i} className="group bg-surface p-6 rounded-xl border border-border shadow-sm hover:shadow-window transition-all cursor-pointer">
              <div className="font-mono text-sm">
                <div className="text-text-muted mb-2">// {cat.count} modules available</div>
                <div className="text-primary mb-1">
                  "{cat.name.toLowerCase()}": <span className="text-text-main">{'{'}</span>
                </div>
                <div className="pl-4 text-text-muted">
                  <span className="text-secondary">exports</span>: [
                  {cat.exports.map((e, idx) => (
                     <span key={idx}>
                       <span className="text-syntax-string">'{e}'</span>
                       {idx < cat.exports.length - 1 && ', '}
                     </span>
                  ))}
                  ]
                </div>
                <div className="text-text-main">{'}'}</div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs font-mono text-text-muted group-hover:text-primary transition-colors">
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
