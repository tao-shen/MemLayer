import { Search, Heart, Share2, MoreHorizontal } from 'lucide-react';

const TREATS = [
  {
    id: 1,
    name: 'gummy-bears',
    category: 'gummies',
    lines: 4,
    code: `import { sweetness } from 'flavor';\n\nexport const bear = {\n  flavor: "mixed_fruit",\n  chewiness: "high"\n}`,
    lang: 'typescript',
    price: '$5.99',
    stock: 'In Stock'
  },
  {
    id: 2,
    name: 'dark-chocolate',
    category: 'chocolate',
    lines: 5,
    code: `class Chocolate(Bar):\n    def taste(self):\n        return "bittersweet"\n    cacao = "75%"`,
    lang: 'python',
    price: '$4.99',
    stock: 'Low Stock'
  },
  {
    id: 3,
    name: 'sour-worms',
    category: 'gummies',
    lines: 4,
    code: `const worms = new Array(10).fill().map(() => ({\n  coating: "sour_sugar",\n  length: "10cm"\n}));`,
    lang: 'javascript',
    price: '$3.99',
    stock: 'In Stock'
  },
  {
    id: 4,
    name: 'lollipops',
    category: 'hard-candy',
    lines: 4,
    code: `func Unrap(flavor string) {\n  fmt.Println("Crunch")\n  lifetime := 30 * time.Minute\n}`,
    lang: 'go',
    price: '$2.49',
    stock: 'In Stock'
  },
  {
    id: 5,
    name: 'marshmallows',
    category: 'soft',
    lines: 5,
    code: `SELECT * FROM clouds\nWHERE fluffy = true\nAND texture = 'soft'\nLIMIT 50;`,
    lang: 'sql',
    price: '$6.99',
    stock: 'In Stock'
  },
  {
    id: 6,
    name: 'jelly-beans',
    category: 'gummies',
    lines: 4,
    code: `resource "bean" "magic" {\n  flavor = random_flavor()\n  risk   = "unknown"\n}`,
    lang: 'hcl',
    price: '$8.99',
    stock: 'Critical'
  },
];

export function SkillsGrid() {
  return (
    <section className="py-20 bg-background">
      <div className="container max-w-7xl mx-auto px-4">

        {/* Section Header & Search */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="text-3xl font-candy font-bold mb-2 text-text-main">Sweet Configs</h2>
            <p className="text-text-muted font-mono">
              $ grep -r "sugar" ./inventory
            </p>
          </div>

          <div className="w-full md:w-96 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search inventory..."
                className="w-full h-10 pl-10 pr-4 bg-white border border-pink-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all placeholder:text-pink-300"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-pink-400 border border-pink-200 px-1.5 py-0.5 rounded">
                ⌘K
              </div>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TREATS.map((item) => (
            <div key={item.id} className="group bg-white rounded-xl border border-pink-200 shadow-sm hover:shadow-candy transition-all duration-300 flex flex-col h-full overflow-hidden">
              {/* Card Header (Window Buttons) */}
              <div className="h-9 px-4 border-b border-pink-100 bg-pink-50/50 flex items-center justify-between">
                <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 group-hover:bg-[#ff5f56]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 group-hover:bg-[#ffbd2e]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 group-hover:bg-[#27c93f]"></div>
                </div>
                <div className="text-xs font-mono text-text-muted truncate max-w-[150px]">
                  {item.name}.{item.lang === 'python' ? 'py' : item.lang === 'typescript' ? 'ts' : item.lang === 'javascript' ? 'js' : item.lang === 'go' ? 'go' : item.lang === 'sql' ? 'sql' : 'tf'}
                </div>
                <div className="flex gap-2 text-text-muted/50">
                  <MoreHorizontal className="w-4 h-4" />
                </div>
              </div>

              {/* Card Body (Code) */}
              <div className="p-4 font-mono text-xs leading-5 bg-[#ffffff] group-hover:bg-[#fff5f7] transition-colors flex-1 relative overflow-hidden">
                <div className="absolute top-0 left-0 bottom-0 w-8 bg-pink-50/30 text-right pr-2 py-4 select-none text-pink-300 border-r border-pink-100">
                  {Array.from({ length: item.lines }).map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
                <div className="pl-6 whitespace-pre font-medium text-text-main/80">
                  {/* Simple syntax highlighting mock with Candy colors */}
                  {item.code.split('\n').map((line, i) => (
                    <div key={i} dangerouslySetInnerHTML={{
                      __html: line
                        .replace(/(import|export|const|return|func|def|class|SELECT|FROM|WHERE|resource)/g, '<span class="text-primary font-bold">$1</span>')
                        .replace(/('.*?')/g, '<span class="text-accent">$1</span>')
                        .replace(/(".*?")/g, '<span class="text-accent">$1</span>')
                        .replace(/(\/\/.*)/g, '<span class="text-blue-400">$1</span>')
                    }} />
                  ))}
                 </div>
               </div>
               
              {/* Card Footer */}
              <div className="p-3 border-t border-pink-100 bg-pink-50/30 flex items-center justify-between text-xs text-text-muted">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-pink-100 flex items-center justify-center text-[10px] font-bold text-primary">
                    {item.lang.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="font-bold font-candy text-primary text-sm">{item.price}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 group/like cursor-pointer hover:text-pink-500 transition-colors">
                    <Heart className="w-3.5 h-3.5 group-hover/like:fill-pink-500" />
                    <span>{item.stock}</span>
                  </div>
                  <div className="cursor-pointer hover:text-primary transition-colors">
                    <Share2 className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button className="px-6 py-2 bg-white border border-pink-200 rounded-md text-sm font-mono hover:bg-pink-50 hover:border-text-muted transition-all text-text-muted">
            $ fetch_more --limit 20
          </button>
        </div>
      </div>
    </section>
  );
}
