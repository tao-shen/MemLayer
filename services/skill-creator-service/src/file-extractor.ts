import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export interface ExtractedContent {
  fileId: string;
  fileName: string;
  fileType: string;
  content: string;
  error?: string;
}

export class FileExtractor {
  async extractContent(filePath: string, fileName: string, fileId: string): Promise<ExtractedContent> {
    const ext = path.extname(fileName).toLowerCase();
    
    try {
      let content = '';
      
      switch (ext) {
        case '.txt':
        case '.md':
        case '.json':
        case '.js':
        case '.ts':
        case '.py':
        case '.java':
        case '.jsx':
        case '.tsx':
          content = await this.extractTextFile(filePath);
          break;
        
        case '.pdf':
          content = await this.extractPDF(filePath);
          break;
        
        case '.docx':
          content = await this.extractDOCX(filePath);
          break;
        
        default:
          throw new Error(`Unsupported file type: ${ext}`);
      }
      
      return {
        fileId,
        fileName,
        fileType: ext,
        content,
      };
    } catch (error) {
      return {
        fileId,
        fileName,
        fileType: ext,
        content: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async extractTextFile(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);
    return buffer.toString('utf-8');
  }

  private async extractPDF(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }

  private async extractDOCX(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  async extractMultiple(files: Array<{ path: string; name: string; id: string }>): Promise<ExtractedContent[]> {
    const promises = files.map(file => 
      this.extractContent(file.path, file.name, file.id)
    );
    return Promise.all(promises);
  }
}
