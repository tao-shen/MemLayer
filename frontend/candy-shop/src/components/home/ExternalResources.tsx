import { ExternalLink, Github, Zap, Rocket } from 'lucide-react';

const EXTERNAL_LINKS = [
  {
    name: 'Anthropic Skills',
    description: 'Official Agent Skills from Anthropic. The gold standard for extending Claude.',
    url: 'https://github.com/anthropics/skills',
    icon: <Github className="w-5 h-5 text-foreground-secondary" />,
    color: 'border-border hover:border-primary',
  },
  {
    name: 'Obra Superpowers',
    description: 'Core skills library to make Claude Code smarter, focused on TDD and planning.',
    url: 'https://github.com/obra/superpowers',
    icon: <Zap className="w-5 h-5 text-warning" />,
    color: 'border-border hover:border-warning',
  },
  {
    name: 'Awesome Claude Skills',
    description: 'Curated list of the best community-driven skills and prompts.',
    url: 'https://github.com/ComposioHQ/awesome-claude-skills',
    icon: <Rocket className="w-5 h-5 text-primary" />,
    color: 'border-border hover:border-primary',
  },
];

export function ExternalResources() {
  return (
    <section className="py-20 bg-secondary/30 border-t border-border">
      <div className="container max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-8 font-candy flex items-center gap-3 text-foreground">
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
              className={`group bg-card p-6 rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md flex items-start gap-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 ${link.color}`}
              aria-label={`${link.name} - opens in new tab`}
            >
              <div className="mt-1 shrink-0">{link.icon}</div>
              <div>
                <h3 className="font-bold text-foreground group-hover:text-primary transition-colors duration-200 flex items-center gap-2">
                  {link.name}
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </h3>
                <p className="text-sm text-foreground-secondary mt-2 leading-relaxed">{link.description}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
