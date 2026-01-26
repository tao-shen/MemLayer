import { ShoppingCart, Heart, Star } from 'lucide-react';

const PRODUCTS = [
  { id: 1, name: 'Gummy Bears', price: '$5.99', category: 'Gummies', color: 'bg-red-100', icon: '🐻' },
  { id: 2, name: 'Rainbow Lollipops', price: '$2.49', category: 'Hard Candy', color: 'bg-yellow-100', icon: '🍭' },
  { id: 3, name: 'Dark Chocolate Bar', price: '$4.99', category: 'Chocolate', color: 'bg-amber-100', icon: '🍫' },
  { id: 4, name: 'Sour Worms', price: '$3.99', category: 'Gummies', color: 'bg-green-100', icon: '🐛' },
  { id: 5, name: 'Marshmallows', price: '$6.99', category: 'Soft', color: 'bg-pink-100', icon: '☁️' },
  { id: 6, name: 'Jelly Beans', price: '$8.99', category: 'Hard Candy', color: 'bg-purple-100', icon: '🍬' },
];

export function SkillsGrid() {
  return (
    <section className="py-20 bg-white rounded-3xl my-12 shadow-sm">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-candy text-text-main mb-4">Sweet Selection</h2>
          <p className="font-body text-text-muted">Hand-picked favorites just for you</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {PRODUCTS.map((product) => (
            <div key={product.id} className="group relative bg-background rounded-3xl p-4 transition-all hover:-translate-y-2 hover:shadow-candy">
              <div className={`h-48 rounded-2xl ${product.color} flex items-center justify-center text-6xl shadow-inner mb-4`}>
                {product.icon}
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">{product.category}</div>
                    <h3 className="font-candy text-xl text-text-main">{product.name}</h3>
                  </div>
                  <div className="flex gap-1 text-accent">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-xs font-bold text-text-muted/50">4.9</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="font-candy text-2xl text-primary">{product.price}</div>
                  <button className="p-2 bg-primary text-white rounded-xl hover:bg-pink-600 transition-colors shadow-lg shadow-pink-200">
                    <ShoppingCart className="w-5 h-5" />
                  </button>
                 </div>
               </div>
               
              <button className="absolute top-6 right-6 p-2 bg-white/50 backdrop-blur rounded-full text-text-muted hover:bg-white hover:text-red-500 transition-colors">
                <Heart className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
