import { createOpencodeClient } from '@opencode-ai/sdk/client';

export class OpenCodeRunner {
  private client: any;
  private baseUrl: string;

  constructor() {
    const hostname = process.env.OPENCODE_HOST || '127.0.0.1';
    const port = parseInt(process.env.OPENCODE_PORT || '4096');
    this.baseUrl = `http://${hostname}:${port}`;
  }

  private async getClient() {
    if (!this.client) {
      try {
        this.client = createOpencodeClient({
          baseUrl: this.baseUrl,
        });
        console.log(`[OpenCode] Connected to ${this.baseUrl}`);
      } catch (error) {
        console.error('Failed to connect to OpenCode:', error);
        throw new Error('Could not connect to OpenCode execution engine');
      }
    }
    return this.client;
  }

  async run(systemPrompt: string, userInput: string): Promise<string> {
    const client = await this.getClient();

    try {
      const session = await client.session.create({
        body: { title: 'Skill Execution' },
      });

      console.log(`[OpenCode] Session created: ${session.id}`);

      if (systemPrompt) {
        await client.session.chat(session.id, {
          body: { parts: [{ type: 'text', text: systemPrompt }] },
        });
      }

      const response = await client.session.chat(session.id, {
        body: { parts: [{ type: 'text', text: userInput }] },
      });

      const output = response.parts?.[0]?.text || response.text || JSON.stringify(response);
      return output;
    } catch (error: any) {
      console.error('OpenCode execution error:', error);
      throw new Error(`OpenCode execution failed: ${error.message}`);
    }
  }
}
