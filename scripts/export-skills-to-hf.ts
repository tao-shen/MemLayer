/**
 * Export all skills data to JSON format for HuggingFace dataset upload.
 *
 * Usage:
 *   npx ts-node scripts/export-skills-to-hf.ts
 *
 * This generates a `skills-dataset.json` file in the repo root that can be
 * pushed to a HuggingFace dataset repository.
 */
import * as fs from 'fs';
import * as path from 'path';

// We can't directly import the TS module from the frontend, so we parse it.
const SKILLS_DATA_PATH = path.resolve(
  __dirname,
  '../frontend/skills-replica/src/data/skillsData.ts'
);

interface SkillRecord {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  installCommand: string;
  popularity: number;
  repo: string;
  skillMdUrl: string;
  source: string;
  collectedAt: string;
}

async function main() {
  const src = fs.readFileSync(SKILLS_DATA_PATH, 'utf-8');

  // Extract skill objects using regex (simple but effective for this structure)
  const skillRegex = /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*description:\s*'([^']*)',\s*category:\s*'([^']+)',\s*icon:\s*'([^']*)',\s*color:\s*'([^']*)',\s*installCommand:\s*'([^']*)',\s*popularity:\s*(\d+),\s*repo:\s*'([^']*)',\s*skillMdUrl:\s*mdUrl\(([^)]+)\)/g;

  const skills: SkillRecord[] = [];
  let match: RegExpExecArray | null;
  const now = new Date().toISOString();

  while ((match = skillRegex.exec(src)) !== null) {
    const [, id, name, description, category, icon, color, installCommand, popularity, repo, mdUrlArgs] = match;

    // Reconstruct skillMdUrl from mdUrl args
    const args = mdUrlArgs.split(',').map((s: string) => s.trim().replace(/'/g, ''));
    let skillMdUrl: string;
    if (args.length >= 3) {
      skillMdUrl = `https://raw.githubusercontent.com/${args[0]}/${args[1]}/main/${args[2]}/SKILL.md`;
    } else if (args.length === 2) {
      skillMdUrl = `https://raw.githubusercontent.com/${args[0]}/${args[1]}/main/SKILL.md`;
    } else {
      skillMdUrl = '';
    }

    skills.push({
      id,
      name,
      description,
      category,
      icon,
      color,
      installCommand,
      popularity: parseInt(popularity, 10),
      repo,
      skillMdUrl,
      source: 'skills.sh',
      collectedAt: now,
    });
  }

  console.log(`Extracted ${skills.length} skills from skillsData.ts`);

  // Write dataset JSON
  const outputPath = path.resolve(__dirname, '../skills-dataset.json');
  fs.writeFileSync(outputPath, JSON.stringify(skills, null, 2), 'utf-8');
  console.log(`Dataset written to ${outputPath}`);

  // Also write a HuggingFace-compatible JSONL format
  const jsonlPath = path.resolve(__dirname, '../skills-dataset.jsonl');
  const jsonlContent = skills.map((s) => JSON.stringify(s)).join('\n');
  fs.writeFileSync(jsonlPath, jsonlContent, 'utf-8');
  console.log(`JSONL dataset written to ${jsonlPath}`);

  // Write a dataset card (README.md for HuggingFace)
  const readmePath = path.resolve(__dirname, '../DATASET_README.md');
  const readme = `---
license: mit
task_categories:
  - text-classification
language:
  - en
  - zh
tags:
  - agent-skills
  - ai-agents
  - skills-directory
  - claude-code
  - openai-codex
size_categories:
  - n<1K
---

# Agent Skills Dataset

A comprehensive collection of ${skills.length} agent skills from the open SKILL.md ecosystem.

## Dataset Description

This dataset contains metadata for AI agent skills compatible with Claude Code, OpenAI Codex CLI, and other tools adopting the SKILL.md standard.

### Categories
${[...new Set(skills.map((s) => s.category))].map((c) => `- **${c}**: ${skills.filter((s) => s.category === c).length} skills`).join('\n')}

### Fields
| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique skill identifier |
| name | string | Display name |
| description | string | Short description |
| category | string | Skill category |
| icon | string | Emoji icon |
| color | string | CSS color classes |
| installCommand | string | npx install command |
| popularity | int | Install count |
| repo | string | GitHub repository |
| skillMdUrl | string | Raw SKILL.md URL |
| source | string | Data source |
| collectedAt | string | ISO timestamp |

### Sources
- [skills.sh](https://skills.sh/) - The Agent Skills Directory
- [skillsmp.com](https://skillsmp.com/) - Agent Skills Marketplace

### Usage
\`\`\`python
from datasets import load_dataset
ds = load_dataset("tao-shen/agent-skills")
\`\`\`

### License
MIT
`;
  fs.writeFileSync(readmePath, readme, 'utf-8');
  console.log(`Dataset README written to ${readmePath}`);
}

main().catch(console.error);
