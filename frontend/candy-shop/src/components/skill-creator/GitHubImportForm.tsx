import { useState } from 'react';
import { ArrowLeft, Github, Loader2 } from 'lucide-react';
import type { Skill } from '../../types/skill-creator';

interface GitHubImportFormProps {
  onImport: (skill: Partial<Skill>) => void;
  onCancel: () => void;
}

interface SkillMarkdown {
  name: string;
  description: string;
  category: string;
  icon: string;
  systemPrompt: string;
  capabilities: string[];
}

export function GitHubImportForm({ onImport, onCancel }: GitHubImportFormProps) {
  const [githubUrl, setGithubUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<SkillMarkdown | null>(null);

  const parseSkillMarkdown = (content: string): SkillMarkdown => {
    const lines = content.split('\n');
    const result: SkillMarkdown = {
      name: '',
      description: '',
      category: 'Custom',
      icon: '✨',
      systemPrompt: '',
      capabilities: [],
    };

    let currentSection = '';
    let currentContent = '';

    for (const line of lines) {
      if (line.startsWith('# ')) {
        result.name = line.replace('# ', '').trim();
      } else if (line.startsWith('## ')) {
        if (currentSection === 'description') {
          result.description = currentContent.trim();
        } else if (currentSection === 'systemPrompt') {
          result.systemPrompt = currentContent.trim();
        } else if (currentSection === 'capabilities') {
          result.capabilities = currentContent
            .split('\n')
            .filter((l) => l.trim().startsWith('-'))
            .map((l) => l.replace('-', '').trim())
            .filter((l) => l.length > 0);
        }

        currentSection = line.replace('## ', '').toLowerCase().trim();
        currentContent = '';
      } else if (line.includes('category:')) {
        result.category = line.split(':')[1].trim();
      } else if (line.includes('icon:')) {
        result.icon = line.split(':')[1].trim();
      } else {
        currentContent += line + '\n';
      }
    }

    // Handle last section
    if (currentSection === 'systemPrompt') {
      result.systemPrompt = currentContent.trim();
    } else if (currentSection === 'capabilities') {
      result.capabilities = currentContent
        .split('\n')
        .filter((l) => l.trim().startsWith('-'))
        .map((l) => l.replace('-', '').trim())
        .filter((l) => l.length > 0);
    }

    return result;
  };

  const handleImport = async () => {
    setError(null);
    setIsLoading(true);

    try {
      // Parse GitHub URL
      const urlPattern = /github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+))?/;
      const match = githubUrl.match(urlPattern);

      if (!match) {
        throw new Error(
          'Invalid GitHub URL. Please use format: https://github.com/owner/repo or https://github.com/owner/repo/tree/branch'
        );
      }

      const [, owner, repo, branch = 'main'] = match;

      // Fetch skill.md from GitHub
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/skill.md`;

      const response = await fetch(rawUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch skill.md. Make sure the file exists at ${rawUrl}`);
      }

      const content = await response.text();
      const skillData = parseSkillMarkdown(content);

      if (!skillData.name) {
        throw new Error('Invalid skill.md format. Please ensure it has a title (# Skill Name)');
      }

      setPreview(skillData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import skill');
      setPreview(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (!preview) return;

    const skill: Partial<Skill> = {
      id: `skill-${Date.now()}`,
      name: preview.name,
      description: preview.description,
      category: preview.category as any,
      icon: preview.icon,
      color: 'bg-primary/10 border-primary/20 text-primary',
      config: {
        capabilities: preview.capabilities,
        systemPrompt: preview.systemPrompt,
        parameters: {},
      },
      sourceFiles: [githubUrl],
      analysisContext: {
        workDomain: [],
        technicalSkills: [],
        experiencePatterns: [],
        keyTopics: [],
        suggestedName: preview.name,
        suggestedDescription: preview.description,
        suggestedCategory: preview.category as any,
        suggestedCapabilities: preview.capabilities,
        filesSummary: [],
        confidence: 100,
        systemPrompt: preview.systemPrompt,
      },
      installCommand: `skill install ${preview.name.toLowerCase().replace(/\s+/g, '-')}`,
      popularity: 0,
      status: 'draft',
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    onImport(skill);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Import Skill from GitHub</h1>
        <p className="text-gray-600">
          Import a skill from a GitHub repository containing a skill.md file
        </p>
      </div>

      {/* Import Form */}
      {!preview && (
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GitHub Repository URL
            </label>
            <input
              type="text"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/owner/repo or https://github.com/owner/repo/tree/branch"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-gray-500 mt-2">
              The repository must contain a skill.md file in the root or specified branch
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Example */}
          <div className="p-4 bg-secondary/30 border border-border rounded-lg">
            <p className="text-sm font-medium text-foreground mb-2">Example skill.md format:</p>
            <pre className="text-xs text-foreground-secondary overflow-x-auto">
              {`# Code Reviewer
category: Development
icon: 👀

## Description
Reviews code for quality and best practices

## System Prompt
You are an expert code reviewer...

## Capabilities
- Code analysis
- Performance review
- Security audit`}
            </pre>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!githubUrl.trim() || isLoading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-primary-active text-white font-medium rounded-lg hover:from-primary-hover hover:to-primary-active transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Github className="w-4 h-4" />
                  Import Skill
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">{preview.icon}</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{preview.name}</h2>
              <p className="text-sm text-gray-500 mt-1">{preview.category}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
            <p className="text-gray-600">{preview.description}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">System Prompt</h3>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
              {preview.systemPrompt}
            </p>
          </div>

          {preview.capabilities.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Capabilities</h3>
              <div className="flex flex-wrap gap-2">
                {preview.capabilities.map((cap, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary/20 text-primary-active text-sm rounded-full"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setPreview(null);
                setError(null);
              }}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleConfirmImport}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-primary-active text-white font-medium rounded-lg hover:from-primary-hover hover:to-primary-active transition-all"
            >
              Confirm Import
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
