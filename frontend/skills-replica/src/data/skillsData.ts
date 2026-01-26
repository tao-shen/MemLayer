
export interface Skill {
  id: string;
  name: string;
  description: string;
  category: 'Knowledge' | 'Tools' | 'Productivity' | 'Development';
  icon: string;
  color: string;
  installCommand: string;
  popularity: number;
  config: Record<string, any>;
}

export const SKILLS_DATA: Skill[] = [
  {
    id: 'brave-search',
    name: 'Brave Search',
    description: 'Allow Claude to search the web using Brave\'s privacy-focused search API.',
    category: 'Knowledge',
    icon: '🦁',
    color: 'bg-orange-100 border-orange-200 text-orange-700',
    installCommand: 'npx -y @modelcontextprotocol/server-brave-search',
    popularity: 98,
    config: {
      "brave-search": {
        "command": "npx",
        "args": [
          "-y",
          "@modelcontextprotocol/server-brave-search"
        ],
        "env": {
          "BRAVE_API_KEY": "YOUR_API_KEY_HERE"
        }
      }
    }
  },
  {
    id: 'filesystem',
    name: 'Filesystem',
    description: 'Give Claude access to read and write files on your local machine.',
    category: 'Tools',
    icon: '📂',
    color: 'bg-blue-100 border-blue-200 text-blue-700',
    installCommand: 'npx -y @modelcontextprotocol/server-filesystem',
    popularity: 95,
    config: {
      "filesystem": {
        "command": "npx",
        "args": [
          "-y",
          "@modelcontextprotocol/server-filesystem",
          "/allowed/path/1",
          "/allowed/path/2"
        ]
      }
    }
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Integration with GitHub API to manage repositories, issues, and PRs.',
    category: 'Development',
    icon: '🐙',
    color: 'bg-slate-100 border-slate-200 text-slate-700',
    installCommand: 'npx -y @modelcontextprotocol/server-github',
    popularity: 92,
    config: {
      "github": {
        "command": "npx",
        "args": [
          "-y",
          "@modelcontextprotocol/server-github"
        ],
        "env": {
          "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_TOKEN_HERE"
        }
      }
    }
  },
  {
    id: 'postgres',
    name: 'PostgreSQL',
    description: 'ReadOnly access to your PostgreSQL database for data analysis.',
    category: 'Development',
    icon: '🐘',
    color: 'bg-indigo-100 border-indigo-200 text-indigo-700',
    installCommand: 'npx -y @modelcontextprotocol/server-postgres',
    popularity: 88,
    config: {
      "postgres": {
        "command": "npx",
        "args": [
          "-y",
          "@modelcontextprotocol/server-postgres",
          "postgresql://user:password@localhost:5432/dbname"
        ]
      }
    }
  },
  {
    id: 'google-maps',
    name: 'Google Maps',
    description: 'Location services, places search, and directions.',
    category: 'Knowledge',
    icon: '🗺️',
    color: 'bg-green-100 border-green-200 text-green-700',
    installCommand: 'npx -y @modelcontextprotocol/server-google-maps',
    popularity: 85,
    config: {
      "google-maps": {
        "command": "npx",
        "args": [
          "-y",
          "@modelcontextprotocol/server-google-maps"
        ],
        "env": {
          "GOOGLE_MAPS_API_KEY": "YOUR_API_KEY_HERE"
        }
      }
    }
  },
  {
    id: 'pup-browser',
    name: 'Puppeteer',
    description: 'Browser automation for scraping and interaction.',
    category: 'Tools',
    icon: '🎭',
    color: 'bg-pink-100 border-pink-200 text-pink-700',
    installCommand: 'npx -y @modelcontextprotocol/server-puppeteer',
    popularity: 82,
    config: {
      "puppeteer": {
        "command": "npx",
        "args": [
          "-y",
          "@modelcontextprotocol/server-puppeteer"
        ]
      }
    }
  }
];
