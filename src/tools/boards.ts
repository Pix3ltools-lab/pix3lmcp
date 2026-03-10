import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiRequest } from '../api.js';

export function registerBoardTools(server: McpServer): void {
  server.tool(
    'list_boards',
    'List all boards, optionally filtered by workspace ID.',
    {
      workspace_id: z.string().optional().describe('Filter by workspace ID'),
    },
    async ({ workspace_id }) => {
      try {
        const query = workspace_id ? `?workspace_id=${encodeURIComponent(workspace_id)}` : '';
        const data = await apiRequest('GET', `/api/v1/boards${query}`);
        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'get_board',
    'Get a board by ID, including its lists and cards.',
    {
      board_id: z.string().describe('Board ID'),
    },
    async ({ board_id }) => {
      try {
        const data = await apiRequest('GET', `/api/v1/boards/${encodeURIComponent(board_id)}`);
        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'create_board',
    'Create a new board in a workspace.',
    {
      workspace_id: z.string().describe('Workspace ID'),
      name: z.string().describe('Board name'),
      description: z.string().optional().describe('Board description'),
      is_public: z.boolean().optional().describe('Whether the board is public'),
    },
    async ({ workspace_id, name, description, is_public }) => {
      try {
        const data = await apiRequest('POST', '/api/v1/boards', {
          workspace_id,
          name,
          description,
          is_public,
        });
        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'update_board',
    'Update an existing board.',
    {
      board_id: z.string().describe('Board ID'),
      name: z.string().optional().describe('New board name'),
      description: z.string().nullable().optional().describe('New board description (null to clear)'),
      is_public: z.boolean().optional().describe('Whether the board is public'),
    },
    async ({ board_id, name, description, is_public }) => {
      try {
        const data = await apiRequest(
          'PATCH',
          `/api/v1/boards/${encodeURIComponent(board_id)}`,
          { name, description, is_public }
        );
        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'delete_board',
    'Delete a board by ID.',
    {
      board_id: z.string().describe('Board ID'),
    },
    async ({ board_id }) => {
      try {
        const data = await apiRequest('DELETE', `/api/v1/boards/${encodeURIComponent(board_id)}`);
        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );
}
