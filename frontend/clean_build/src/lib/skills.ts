/**
 * Simple parser for Claude SKILL.md files.
 * Extracts the description and prompt instructions.
 */

export interface Skill {
  name: string;
  description: string;
  instructions: string;
}

export function parseSkill(markdown: string): Skill {
  // Simple frontmatter parser (assuming --- delimiters)
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = markdown.match(frontmatterRegex);

  let name = 'Unknown Skill';
  let description = '';
  let instructions = markdown;

  if (match) {
    const frontmatter = match[1];
    instructions = markdown.slice(match[0].length).trim();

    // Very naive YAML line parser
    const nameMatch = frontmatter.match(/^name:\s*(.*)$/m);
    if (nameMatch) name = nameMatch[1].trim();

    const descMatch = frontmatter.match(/^description:\s*(.*)$/m);
    if (descMatch) description = descMatch[1].trim();
  }

  return {
    name,
    description,
    instructions
  };
}

export async function fetchSkill(url: string): Promise<Skill> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch skill from ${url}`);
  }
  const text = await response.text();
  return parseSkill(text);
}
