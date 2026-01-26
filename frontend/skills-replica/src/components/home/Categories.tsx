import { ArrowRight } from 'lucide-react';

const CATEGORIES = [
  { name: 'Gummies', count: 120, color: 'bg-red-50 text-red-500' },
  { name: 'Chocolates', count: 85, color: 'bg-amber-50 text-amber-700' },
  { name: 'Hard Candy', count: 200, color: 'bg-purple-50 text-purple-600' },
  { name: 'Licorice', count: 45, color: 'bg-slate-50 text-slate-700' },
  { name: 'Sugar Free', count: 30, color: 'bg-green-50 text-green-600' },
  { name: 'Bundles', count: 12, color: 'bg-pink-50 text-pink-500' },
];

export function Categories() {
  return (
    <section className="py-20">
      <div className="container max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-candy text-text-main mb-8">Shop by Category</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((cat, i) => (
            <div key={i} className={`p-6 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-transform hover:scale-105 ${cat.color} bg-opacity-50`}>
              <div className="font-candy text-lg font-bold mb-1">{cat.name}</div>
              <div className="text-xs opacity-70 mb-3">{cat.count} items</div>
              <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
