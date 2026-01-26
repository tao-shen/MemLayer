import { ExternalLink, Github, Zap } from 'lucide-react';

const EXTERNAL_LINKS = [
  {
    name: 'Anthropic Skills',
    description: 'Official Agent Skills from Anthropic. The gold standard for extending Claude.',
    url: 'https://github.com/anthropics/skills',
    icon: <Github className="w-5 h-5 text-gray-700" />,
    color: 'border-slate-200 hover:border-slate-400'
  },
  {
    name: 'Obra Superpowers',
    description: 'Core skills library to make Claude Code smarter, focused on TDD and planning.',
    url: 'https://github.com/obra/superpowers',
    icon: <Zap className="w-5 h-5 text-yellow-500" />,
    color: 'border-yellow-200 hover:border-yellow-400'
  },
  {
    name: 'Awesome Claude Skills',
    description: 'Curated list of the best community-driven skills and prompts.',
    url: 'https://github.com/ComposioHQ/awesome-claude-skills',
    icon: <span className="text-xl">🚀</span>,
    color: 'border-purple-200 hover:border-purple-400'
  }
];

export function ExternalResources() {
  return (
    <section className="py-20 bg-gray-50 border-t border-gray-200">
      <div className="container max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-8 font-candy flex items-center gap-3 text-text-main">
          <ExternalLink className="w-6 h-6 text-primary" />
          <span>Community Aisles (External)</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {EXTERNAL_LINKS.map((link, i) => (
            <a 
              key={i} 
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`group bg-white p-6 rounded-xl border shadow-sm transition-all hover:shadow-md flex items-start gap-4 ${link.color}`}
            >
              <div className="mt-1">{link.icon}</div>
              <div>
                <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors flex items-center gap-2">
                  {link.name}
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  {link.description}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
