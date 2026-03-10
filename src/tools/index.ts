import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerBoardTools } from './boards.js';
import { registerListTools } from './lists.js';
import { registerCardTools } from './cards.js';

export function registerTools(server: McpServer): void {
  registerBoardTools(server);
  registerListTools(server);
  registerCardTools(server);

  // list_workspaces: legge WORKSPACE_IDS dall'env
  server.tool(
    'list_workspaces',
    'List the configured workspace IDs. Workspace IDs are pre-configured via the WORKSPACE_IDS environment variable.',
    {},
    async () => {
      const ids = (process.env.WORKSPACE_IDS || '').split(',').filter(Boolean);
      const workspaces = ids.map(id => ({ id: id.trim() }));
      return { content: [{ type: 'text' as const, text: JSON.stringify(workspaces, null, 2) }] };
    }
  );
}
