import OpenAI from 'openai';
import type { ExtractedContent } from './file-extractor';

export interface AnalysisResult {
  workDomain: string[];
  technicalSkills: string[];
  experiencePatterns: string[];
  keyTopics: string[];
  suggestedName: string;
  suggestedDescription: string;
  suggestedCategory: string;
  suggestedCapabilities: string[];
  filesSummary: FileSummary[];
  confidence: number;
  systemPrompt: string;
}

export interface FileSummary {
  fileName: string;
  fileType: string;
  contentType: 'code' | 'document' | 'data' | 'other';
  keyInsights: string[];
  relevance: number;
}

export class ContentAnalyzer {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async analyzeContent(extractedFiles: ExtractedContent[]): Promise<AnalysisResult> {
    // Prepare content for analysis
    const contentSummary = extractedFiles
      .filter(f => !f.error && f.content)
      .map(f => `文件: ${f.fileName}\n类型: ${f.fileType}\n内容:\n${f.content.slice(0, 2000)}...\n`)
      .join('\n---\n');

    const analysisPrompt = `
你是一个专业的技能分析专家。请分析以下用户上传的文件内容，提取关键信息并生成一个 AI skill 配置。

用户文件内容:
${contentSummary}

请以 JSON 格式返回分析结果，包含以下字段:
{
  "workDomain": ["领域1", "领域2"],  // 用户的工作领域
  "technicalSkills": ["技能1", "技能2"],  // 识别出的技术技能
  "experiencePatterns": ["模式1", "模式2"],  // 经验模式
  "keyTopics": ["主题1", "主题2"],  // 关键主题
  "suggestedName": "技能名称",  // 建议的技能名称（中文）
  "suggestedDescription": "技能描述",  // 技能描述（中文，简洁明了）
  "suggestedCategory": "分类",  // Knowledge/Tools/Productivity/Development/Analysis/Custom
  "suggestedCapabilities": ["能力1", "能力2"],  // 建议的能力列表
  "confidence": 0.85,  // 分析置信度 (0-1)
  "systemPrompt": "系统提示词"  // 为这个技能生成的系统提示词
}

注意:
1. 所有文本内容使用中文
2. 技能名称要简洁有力
3. 描述要清晰说明这个技能能做什么
4. 系统提示词要详细，包含用户的专业背景和能力
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的技能分析专家，擅长从用户文件中提取关键信息并生成 AI skill 配置。',
          },
          {
            role: 'user',
            content: analysisPrompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const analysis = JSON.parse(content);

      // Generate file summaries
      const filesSummary: FileSummary[] = extractedFiles.map(f => ({
        fileName: f.fileName,
        fileType: f.fileType,
        contentType: this.detectContentType(f.fileType),
        keyInsights: this.extractKeyInsights(f.content),
        relevance: 0.8,
      }));

      return {
        ...analysis,
        filesSummary,
      };
    } catch (error) {
      console.error('Analysis error:', error);
      
      // Fallback to basic analysis
      return this.basicAnalysis(extractedFiles);
    }
  }

  private detectContentType(fileType: string): 'code' | 'document' | 'data' | 'other' {
    const codeExtensions = ['.js', '.ts', '.py', '.java', '.jsx', '.tsx'];
    const documentExtensions = ['.txt', '.md', '.pdf', '.docx'];
    const dataExtensions = ['.json'];

    if (codeExtensions.includes(fileType)) return 'code';
    if (documentExtensions.includes(fileType)) return 'document';
    if (dataExtensions.includes(fileType)) return 'data';
    return 'other';
  }

  private extractKeyInsights(content: string): string[] {
    // Simple keyword extraction
    const insights: string[] = [];
    const lines = content.split('\n').slice(0, 10);
    
    lines.forEach(line => {
      if (line.trim().length > 20 && line.trim().length < 100) {
        insights.push(line.trim());
      }
    });

    return insights.slice(0, 3);
  }

  private basicAnalysis(extractedFiles: ExtractedContent[]): AnalysisResult {
    // Fallback basic analysis when AI fails
    const fileTypes = extractedFiles.map(f => f.fileType);
    const hasCode = fileTypes.some(t => ['.js', '.ts', '.py', '.java'].includes(t));
    const hasDocuments = fileTypes.some(t => ['.pdf', '.docx', '.md'].includes(t));

    return {
      workDomain: hasCode ? ['软件开发'] : ['文档处理'],
      technicalSkills: hasCode ? ['编程', '代码分析'] : ['文档分析', '信息提取'],
      experiencePatterns: ['文件处理', '内容分析'],
      keyTopics: ['技能创建', '自动化'],
      suggestedName: '自定义技能',
      suggestedDescription: '基于用户上传文件创建的自定义技能',
      suggestedCategory: 'Custom',
      suggestedCapabilities: ['文件分析', '内容理解'],
      filesSummary: extractedFiles.map(f => ({
        fileName: f.fileName,
        fileType: f.fileType,
        contentType: this.detectContentType(f.fileType),
        keyInsights: this.extractKeyInsights(f.content),
        relevance: 0.5,
      })),
      confidence: 0.5,
      systemPrompt: '你是一个通用的 AI 助手，可以帮助用户处理各种任务。',
    };
  }
}
