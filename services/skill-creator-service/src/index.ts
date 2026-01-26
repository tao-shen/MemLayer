import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { FileExtractor } from './file-extractor';
import { ContentAnalyzer } from './content-analyzer';
import { SkillGenerator } from './skill-generator';
import { SkillManagerService } from './skill-manager';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// File upload configuration
const uploadDir = path.join(__dirname, '../uploads');
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Services
const fileExtractor = new FileExtractor();
const contentAnalyzer = new ContentAnalyzer(process.env.OPENAI_API_KEY || '');
const skillGenerator = new SkillGenerator();
const skillManager = new SkillManagerService(process.env.OPENAI_API_KEY || '');

// In-memory job storage (in production, use Redis or database)
const jobs = new Map<string, any>();

// Routes

/**
 * Upload files
 * POST /api/upload
 */
app.post('/api/upload', upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded',
      });
    }

    const fileIds = files.map(f => ({
      id: path.basename(f.filename, path.extname(f.filename)),
      name: f.originalname,
      path: f.path,
      size: f.size,
    }));

    res.json({
      success: true,
      fileIds: fileIds.map(f => f.id),
      files: fileIds,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    });
  }
});

/**
 * Analyze files
 * POST /api/analyze
 */
app.post('/api/analyze', async (req, res) => {
  try {
    const { fileIds } = req.body;
    
    if (!fileIds || !Array.isArray(fileIds)) {
      return res.status(400).json({
        error: 'Invalid fileIds',
      });
    }

    const jobId = uuidv4();
    
    // Start async analysis
    jobs.set(jobId, {
      status: 'processing',
      progress: 0,
      result: null,
      error: null,
    });

    // Process in background
    processAnalysis(jobId, fileIds).catch(error => {
      jobs.set(jobId, {
        status: 'failed',
        progress: 100,
        result: null,
        error: error.message,
      });
    });

    res.json({ jobId });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Analysis failed',
    });
  }
});

/**
 * Get analysis status
 * GET /api/status/:jobId
 */
app.get('/api/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);
  
  if (!job) {
    return res.status(404).json({
      error: 'Job not found',
    });
  }

  res.json(job);
});

/**
 * Generate skill
 * POST /api/generate
 */
app.post('/api/generate', async (req, res) => {
  try {
    const { userId, analysisResult, sourceFileIds, preferences } = req.body;
    
    if (!userId || !analysisResult) {
      return res.status(400).json({
        error: 'Missing required fields',
      });
    }

    const skill = skillGenerator.generateSkill(
      userId,
      analysisResult,
      sourceFileIds || [],
      preferences
    );

    res.json(skill);
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Generation failed',
    });
  }
});

/**
 * Save skill
 * POST /api/skills
 */
app.post('/api/skills', async (req, res) => {
  try {
    const skill = req.body;
    const saved = await skillManager.saveSkill(skill);
    res.json(saved);
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Save failed',
    });
  }
});

/**
 * Get user skills
 * GET /api/skills
 */
app.get('/api/skills', async (req, res) => {
  try {
    const { userId, category, status, searchQuery } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        error: 'userId is required',
      });
    }

    const skills = await skillManager.getUserSkills(userId as string, {
      category: category as string,
      status: status as string,
      searchQuery: searchQuery as string,
    });

    res.json(skills);
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get skills',
    });
  }
});

/**
 * Get skill by ID
 * GET /api/skills/:skillId
 */
app.get('/api/skills/:skillId', async (req, res) => {
  try {
    const { skillId } = req.params;
    const skill = await skillManager.getSkill(skillId);
    
    if (!skill) {
      return res.status(404).json({
        error: 'Skill not found',
      });
    }

    res.json(skill);
  } catch (error) {
    console.error('Get skill error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get skill',
    });
  }
});

/**
 * Update skill
 * PUT /api/skills/:skillId
 */
app.put('/api/skills/:skillId', async (req, res) => {
  try {
    const { skillId } = req.params;
    const updates = req.body;
    
    const updated = await skillManager.updateSkill(skillId, updates);
    res.json(updated);
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Update failed',
    });
  }
});

/**
 * Delete skill
 * DELETE /api/skills/:skillId
 */
app.delete('/api/skills/:skillId', async (req, res) => {
  try {
    const { skillId } = req.params;
    await skillManager.deleteSkill(skillId);
    res.status(204).send();
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Delete failed',
    });
  }
});

/**
 * Execute skill
 * POST /api/skills/:skillId/execute
 */
app.post('/api/skills/:skillId/execute', async (req, res) => {
  try {
    const { skillId } = req.params;
    const { userId, input } = req.body;
    
    if (!userId || !input) {
      return res.status(400).json({
        error: 'userId and input are required',
      });
    }

    const result = await skillManager.executeSkill(skillId, userId, input);
    res.json(result);
  } catch (error) {
    console.error('Execute error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Execution failed',
    });
  }
});

/**
 * Get execution history
 * GET /api/skills/:skillId/history
 */
app.get('/api/skills/:skillId/history', async (req, res) => {
  try {
    const { skillId } = req.params;
    const history = await skillManager.getExecutionHistory(skillId);
    res.json(history);
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get history',
    });
  }
});

// Background processing function
async function processAnalysis(jobId: string, fileIds: string[]) {
  try {
    // Update progress: extracting
    jobs.set(jobId, {
      status: 'extracting',
      progress: 20,
      result: null,
      error: null,
    });

    // Find files in upload directory
    const uploadedFiles = await Promise.all(
      fileIds.map(async (id) => {
        const files = await fs.readdir(uploadDir);
        const matchingFile = files.find(f => f.startsWith(id));
        if (!matchingFile) {
          throw new Error(`File not found: ${id}`);
        }
        return {
          id,
          name: matchingFile.replace(`${id}-`, ''),
          path: path.join(uploadDir, matchingFile),
        };
      })
    );

    // Extract content
    const extractedContent = await fileExtractor.extractMultiple(uploadedFiles);

    // Update progress: analyzing
    jobs.set(jobId, {
      status: 'analyzing',
      progress: 50,
      result: null,
      error: null,
    });

    // Analyze content
    const analysisResult = await contentAnalyzer.analyzeContent(extractedContent);

    // Update progress: complete
    jobs.set(jobId, {
      status: 'complete',
      progress: 100,
      result: analysisResult,
      error: null,
    });
  } catch (error) {
    console.error('Processing error:', error);
    jobs.set(jobId, {
      status: 'failed',
      progress: 100,
      result: null,
      error: error instanceof Error ? error.message : 'Processing failed',
    });
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Skill Creator Service running on port ${PORT}`);
});
