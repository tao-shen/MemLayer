import { Terminal } from 'lucide-react';

export function SocialProof() {
  const logs = [
    { time: '10:42:01', user: 'anthropic', cmd: 'claude code --import skillsmp' },
    { time: '10:42:05', user: 'langchain', cmd: 'pip install langchain-skills' },
    { time: '10:42:12', user: 'autogen', cmd: 'agent.load_skills(manifest)' },
    { time: '10:42:18', user: 'openai', cmd: 'import { plugin } from "@skillsmp/gpt"' },
  ];

  return (
    <section className="py-12 border-y border-border bg-gray-50/50">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
          <div className="md:w-1/4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground-secondary mb-2">Trusted By Agents</h3>
            <p className="text-xs text-foreground-secondary">
              Used by leading autonomous systems and frameworks.
            </p>
          </div>
          
          <div className="flex-1 w-full overflow-hidden">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
               {logs.map((log, i) => (
                 <div key={i} className="bg-surface border border-border rounded p-3 shadow-sm font-mono text-xs truncate">
                    <div className="flex items-center gap-2 text-foreground-secondary mb-1 opacity-60">
                      <Terminal className="w-3 h-3" />
                      <span>{log.time}</span>
                    </div>
                    <div className="text-primary truncate">
                      <span className="text-secondary">{log.user}</span> $ {log.cmd}
                    </div>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
