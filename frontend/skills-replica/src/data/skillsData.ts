
export interface Skill {
  id: string;
  name: string;
  description: string;
  category: 'Knowledge' | 'Tools' | 'Productivity' | 'Development' | 'Analysis';
  icon: string;
  color: string;
  installCommand: string;
  popularity: number;
  config: Record<string, any>;
}

export const SKILLS_DATA: Skill[] = [
  {
    id: 'financial-analyst',
    name: 'Financial Analyst',
    description: 'Expert at analyzing financial data, reading 10-K reports, and generating investment memos.',
    category: 'Analysis',
    icon: '📊',
    color: 'bg-green-100 border-green-200 text-green-700',
    installCommand: 'clone https://github.com/anthropics/skills/financial-analyst',
    popularity: 99,
    config: {
      "financial-analyst": {
        "source": "github.com/anthropics/skills",
        "path": "financial-analyst",
        "capabilities": ["web-search", "pdf-analysis"]
      }
    }
  },
  {
    id: 'superpowers-planner',
    name: 'Superpowers Planner',
    description: 'Enhances Claude Code with TDD, YAGNI, and structured planning capabilities.',
    category: 'Development',
    icon: '⚡',
    color: 'bg-yellow-100 border-yellow-200 text-yellow-700',
    installCommand: '/plugin install superpowers@superpowers-marketplace',
    popularity: 95,
    config: {
      "superpowers": {
        "plugin": "obra/superpowers",
        "settings": {
          "mode": "planner",
          "tdd": true
        }
      }
    }
  },
  {
    id: 'research-agent',
    name: 'Deep Research',
    description: 'Automated researcher that can browse the web, synthesize information, and write reports.',
    category: 'Knowledge',
    icon: '🦁',
    color: 'bg-blue-100 border-blue-200 text-blue-700',
    installCommand: 'clone https://github.com/anthropics/skills/research-agent',
    popularity: 92,
    config: {
      "research-agent": {
        "source": "github.com/anthropics/skills",
        "capabilities": ["browser-tool", "filesystem"]
      }
    }
  },
  {
    id: 'web-scraper',
    name: 'Universal Scraper',
    description: 'Extract clean markdown from any URL using Composio skills.',
    category: 'Tools',
    icon: '�️',
    color: 'bg-purple-100 border-purple-200 text-purple-700',
    installCommand: 'composio add web-scraper',
    popularity: 88,
    config: {
      "composio": {
        "integrations": ["web-scraper"],
        "api_key": "YOUR_KEY"
      }
    }
  },
  {
    id: 'customer-support',
    name: 'Support Agent',
    description: 'Handle customer tickets, draft empathetic responses, and categorize issues.',
    category: 'Productivity',
    icon: '🎧',
    color: 'bg-pink-100 border-pink-200 text-pink-700',
    installCommand: 'clone https://github.com/anthropics/skills/customer-support',
    popularity: 85,
    config: {
      "support-agent": {
        "source": "github.com/anthropics/skills/customer-support"
      }
    }
  },
  {
    id: 'data-scientist',
    name: 'Data Scientist',
    description: 'Analyze CSV files, generate Python visualizations, and run statistical tests.',
    category: 'Analysis',
    icon: '📈',
    color: 'bg-indigo-100 border-indigo-200 text-indigo-700',
    installCommand: 'clone https://github.com/VoltAgent/awesome-claude-skills/data-sci',
    popularity: 82,
    config: {
      "data-sci": {
        "tools": ["python-execution", "file-upload"]
      }
    }
  }
];
