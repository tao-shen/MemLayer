import { Candy, Sparkles } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative pt-12 pb-20 overflow-hidden">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div className="space-y-6 text-center lg:text-left z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-chocolate font-candy text-sm">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>Freshly made sweets delivered daily!</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-candy text-text-main leading-tight">
            Sweetest Treats <br />
            <span className="text-secondary">For You</span>
          </h1>

          <p className="text-xl text-text-muted font-body leading-relaxed max-w-lg mx-auto lg:mx-0">
            Dive into a world of sugar and spice. Handcrafted candies, chocolates, and treats that make life a little sweeter.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button className="btn-candy bg-primary text-white text-lg py-4 px-8 shadow-lg shadow-primary/30">
              Shop Now
            </button>
            <button className="btn-candy bg-white text-text-main border-2 border-primary/20 hover:bg-primary/5">
              View Bundles
            </button>
          </div>
        </div>

        {/* Right Visuals */}
        <div className="relative flex justify-center lg:justify-end">
          {/* Abstract shapes/blobs */}
          <div className="absolute top-10 right-10 w-72 h-72 bg-secondary/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"></div>

          <div className="relative bg-white p-6 rounded-3xl shadow-candy border-4 border-white rotate-3 hover:rotate-0 transition-transform duration-500">
            <div className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl p-8 flex items-center justify-center min-w-[300px] min-h-[300px]">
              <Candy className="w-32 h-32 text-primary animate-bounce duration-[3000ms]" />
            </div>
            <div className="mt-4 text-center">
              <div className="font-candy text-2xl text-text-main">Mega Lollipop</div>
              <div className="font-body text-text-muted">$4.99</div>
            </div>
          </div>

          {/* Floating elements */}
          <div className="absolute -left-4 top-1/4 bg-white p-3 rounded-2xl shadow-lg -rotate-12 animate-bounce">
            <span className="text-3xl">🍩</span>
          </div>
          <div className="absolute right-10 bottom-10 bg-white p-3 rounded-2xl shadow-lg rotate-12 animate-pulse">
            <span className="text-3xl">🍪</span>
          </div>
        </div>
      </div>
    </section>
  );
}
