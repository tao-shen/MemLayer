# Skill Creation Guide

## Overview

The Skill Creator feature now supports three methods for creating skills:

1. **Upload Files** - Upload local files and let AI analyze them
2. **Manual Creation** - Manually enter all skill details
3. **Import from GitHub** - Import a skill from a GitHub repository

## Features

### 1. Upload Files Method

Upload your local files (code, documents, etc.) and the system will:
- Analyze the content
- Extract key information
- Generate a skill configuration
- Allow you to preview and edit before saving

**Supported file types:**
- Text files (.txt, .md, .json)
- Documents (.pdf, .docx)
- Code files (.js, .ts, .py, .java, etc.)

**File size limit:** 10MB per file

### 2. Manual Creation Method

Create a skill by manually entering:
- **Skill Name** - The name of your skill
- **Description** - What the skill does
- **Category** - Knowledge, Tools, Productivity, Development, Analysis, or Custom
- **Icon** - Visual representation (emoji)
- **System Prompt** - How the skill should behave
- **Capabilities** - List of things the skill can do

### 3. GitHub Import Method

Import a skill from a GitHub repository:

**Requirements:**
- Repository must contain a `skill.md` file in the root directory
- File must follow the skill.md format (see below)

**URL formats supported:**
- `https://github.com/owner/repo`
- `https://github.com/owner/repo/tree/branch`

### skill.md Format

```markdown
# Skill Name
category: Development
icon: 👀

## Description
Brief description of what the skill does

## System Prompt
Detailed instructions on how the skill should behave and respond to inputs

## Capabilities
- Capability 1
- Capability 2
- Capability 3
```

**Example:**

```markdown
# Code Reviewer
category: Development
icon: 👀

## Description
Reviews code for quality, performance, and security issues

## System Prompt
You are an expert code reviewer with 10+ years of experience. 
Review the provided code and give constructive feedback on:
- Code quality and readability
- Performance optimizations
- Security vulnerabilities
- Best practices

## Capabilities
- Code analysis
- Performance review
- Security audit
- Best practices suggestion
```

## Workflow

### Creating a Skill

1. Navigate to "Create New Skill" from the Skills Library
2. Choose your creation method:
   - **Upload Files**: Select files and start analysis
   - **Manual Creation**: Fill in the form with skill details
   - **Import from GitHub**: Paste the repository URL
3. Review the generated/imported skill in the preview
4. Edit any details if needed
5. Click "Create Skill" to save

### Managing Skills

Once created, you can:
- **View** all your skills in the Skills Library
- **Use** a skill by clicking the "Use" button
- **Delete** a skill (with confirmation)
- **Search** skills by name or description
- **Filter** skills by category

### Using a Skill

1. Go to "My Skills Library"
2. Find the skill you want to use
3. Click the "Use" button
4. Enter your input/question
5. Press Cmd/Ctrl + Enter or click "Execute Skill"
6. View the results

## Data Storage

All skills are stored locally in your browser using localStorage:
- Skills are persisted across sessions
- Execution history is maintained per skill
- No data is sent to external servers

## Tips

- **For Upload Method**: Include diverse files to get better analysis
- **For Manual Creation**: Be specific in the system prompt for better results
- **For GitHub Import**: Ensure your skill.md follows the format exactly
- **Capabilities**: List specific, actionable capabilities for clarity
- **Icons**: Use emojis that represent your skill's purpose

## Troubleshooting

### GitHub Import Not Working

- Verify the repository URL is correct
- Check that `skill.md` exists in the root directory
- Ensure the file follows the correct format
- Try specifying the branch explicitly: `https://github.com/owner/repo/tree/main`

### Skill Not Saving

- Check browser console for errors
- Ensure localStorage is enabled
- Try clearing browser cache and reloading
- Verify all required fields are filled

### File Upload Issues

- Check file size (max 10MB)
- Verify file format is supported
- Try uploading fewer files at once
- Check browser console for specific error messages

## API Reference

### Storage Utilities

The skill storage system provides these functions:

```typescript
// Get all skills
storageUtils.getSkills(): Skill[]

// Save a new skill
storageUtils.saveSkill(skill: Partial<Skill>): void

// Delete a skill
storageUtils.deleteSkill(skillId: string): void

// Update a skill
storageUtils.updateSkill(skillId: string, updates: Partial<Skill>): void

// Get a specific skill
storageUtils.getSkillById(skillId: string): Skill | undefined

// Save execution history
storageUtils.saveExecutionHistory(skillId: string, input: string, output: string, duration: number): void

// Get execution history
storageUtils.getExecutionHistory(skillId: string): ExecutionHistory[]
```

## Future Enhancements

Planned features:
- Skill versioning and history
- Skill sharing and collaboration
- Advanced skill templates
- Skill marketplace
- Custom parameter support
- Skill testing and validation
