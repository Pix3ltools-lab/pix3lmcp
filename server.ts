import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { registerTools } from './src/tools/index.js';

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT || '3010', 10);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/mcp', async (req, res) => {
  try {
    const server = new McpServer({ name: 'pix3lmcp', version: '1.0.0' });
    registerTools(server);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ error: String(error) });
    }
  }
});

app.listen(PORT, () => {
  console.log(`pix3lmcp server running on port ${PORT}`);
});
