import { Search, Heart, Share2, MoreHorizontal } from 'lucide-react';

const SKILLS = [
  {
    id: 1,
    name: 'web-search',
    author: 'google-official',
    lines: 4,
    code: `import { search } from 'web';\n\nexport const run = async (q) => {\n  return await search(q);\n}`,
    lang: 'typescript',
    installs: '2.4m',
    date: '2d ago'
  },
  {
    id: 2,
    name: 'csv-analysis',
    author: 'data-science',
    lines: 5,
    code: `import pandas as pd\n\ndef analyze(file_path):\n    df = pd.read_csv(file_path)\n    return df.describe()`,
    lang: 'python',
    installs: '890k',
    date: '5h ago'
  },
  {
    id: 3,
    name: 'send-email',
    author: 'communication',
    lines: 4,
    code: `func Send(to string, body string) {\n  client.Mail(to, body)\n  fmt.Println("Sent")\n}`,
    lang: 'go',
    installs: '560k',
    date: '1w ago'
  },
  {
    id: 4,
    name: 'image-gen',
    author: 'creative-labs',
    lines: 4,
    code: `const generate = (prompt) => {\n  return stable_diffusion.run(\n    { prompt, steps: 50 }\n  );\n}`,
    lang: 'javascript',
    installs: '1.2m',
    date: '3d ago'
  },
  {
    id: 5,
    name: 'sql-query',
    author: 'db-admin',
    lines: 5,
    code: `SELECT * FROM users\nWHERE active = true\nAND last_login > NOW()\nLIMIT 100;`,
    lang: 'sql',
    installs: '320k',
    date: '1d ago'
  },
  {
    id: 6,
    name: 'slack-notify',
    author: 'dev-ops',
    lines: 4,
    code: `resource "slack_msg" "alert" {\n  channel = "#alerts"\n  text    = "Deploy failed"\n}`,
    lang: 'hcl',
    installs: '150k',
    date: '4h ago'
  },
];

export function SkillsGrid() {
  return (
    <section className="py-20 bg-background">
      <div className="container max-w-7xl mx-auto px-4">
        
        {/* Section Header & Search */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="text-3xl font-bold mb-2 font-sans">Discover Skills</h2>
            <p className="text-text-muted font-mono">
              $ find . -name "agent-skills" -type f
            </p>
          </div>
          
          <div className="w-full md:w-96 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input 
                type="text" 
                placeholder="Search for capabilities..." 
                className="w-full h-10 pl-10 pr-4 bg-surface border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-text-muted border border-border px-1.5 py-0.5 rounded">
                ⌘K
              </div>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SKILLS.map((skill) => (
            <div key={skill.id} className="group bg-surface rounded-xl border border-border shadow-sm hover:shadow-window transition-all duration-300 flex flex-col h-full overflow-hidden">
               {/* Card Header (Window Buttons) */}
               <div className="h-9 px-4 border-b border-border bg-gray-50/50 flex items-center justify-between">
                 <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300 group-hover:bg-[#ff5f56]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300 group-hover:bg-[#ffbd2e]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300 group-hover:bg-[#27c93f]"></div>
                 </div>
                 <div className="text-xs font-mono text-text-muted truncate max-w-[150px]">
                   {skill.name}.{skill.name === 'slack-notify' ? 'tf' : skill.lang === 'python' ? 'py' : skill.lang === 'typescript' ? 'ts' : skill.lang === 'javascript' ? 'js' : skill.lang === 'go' ? 'go' : 'sql'}
                 </div>
                 <div className="flex gap-2 text-text-muted/50">
                    <MoreHorizontal className="w-4 h-4" />
                 </div>
               </div>
               
               {/* Card Body (Code) */}
               <div className="p-4 font-mono text-xs leading-5 bg-[#ffffff] group-hover:bg-[#fafafa] transition-colors flex-1 relative overflow-hidden">
                 <div className="absolute top-0 left-0 bottom-0 w-8 bg-gray-50 text-right pr-2 py-4 select-none text-text-muted/30 border-r border-border/50">
                   {Array.from({length: skill.lines}).map((_, i) => (
                     <div key={i}>{i+1}</div>
                   ))}
                 </div>
                 <div className="pl-6 whitespace-pre font-medium text-text-main/80">
                    {/* Simple syntax highlighting mock */}
                    {skill.code.split('\n').map((line, i) => (
                      <div key={i} dangerouslySetInnerHTML={{ 
                        __html: line
                          .replace(/(import|export|const|return|func|def|SELECT|FROM|WHERE|resource)/g, '<span class="text-syntax-keyword">$1</span>')
                          .replace(/('.*?')/g, '<span class="text-syntax-string">$1</span>')
                          .replace(/(".*?")/g, '<span class="text-syntax-string">$1</span>')
                          .replace(/(\/\/.*)/g, '<span class="text-syntax-comment">$1</span>')
                      }} />
                    ))}
                 </div>
               </div>
               
               {/* Card Footer */}
               <div className="p-3 border-t border-border bg-gray-50/30 flex items-center justify-between text-xs text-text-muted">
                 <div className="flex items-center gap-2">
                   <div className="w-5 h-5 rounded bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                     {skill.lang.slice(0,2).toUpperCase()}
                   </div>
                   <span className="font-medium hover:text-primary cursor-pointer transition-colors">@{skill.author}</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="flex items-center gap-1 group/like cursor-pointer hover:text-pink-500 transition-colors">
                     <Heart className="w-3.5 h-3.5 group-hover/like:fill-pink-500" />
                     <span>{skill.installs}</span>
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
          <button className="px-6 py-2 bg-white border border-border rounded-md text-sm font-mono hover:bg-gray-50 hover:border-text-muted transition-all">
            $ load_more --limit 20
          </button>
        </div>
      </div>
    </section>
  );
}
