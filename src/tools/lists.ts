import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiRequest } from '../api';

export function registerListTools(server: McpServer): void {
  server.tool(
    'list_lists',
    'List all lists in a board.',
    {
      board_id: z.string().describe('Board ID'),
    },
    async ({ board_id }) => {
      try {
        const data = await apiRequest('GET', `/api/v1/boards/${encodeURIComponent(board_id)}/lists`);
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
    'create_list',
    'Create a new list in a board.',
    {
      board_id: z.string().describe('Board ID'),
      name: z.string().describe('List name'),
      color: z.string().optional().describe('List color'),
    },
    async ({ board_id, name, color }) => {
      try {
        const data = await apiRequest(
          'POST',
          `/api/v1/boards/${encodeURIComponent(board_id)}/lists`,
          { name, color }
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
    'update_list',
    'Update an existing list.',
    {
      list_id: z.string().describe('List ID'),
      name: z.string().optional().describe('New list name'),
      color: z.string().nullable().optional().describe('New list color (null to clear)'),
    },
    async ({ list_id, name, color }) => {
      try {
        const data = await apiRequest(
          'PATCH',
          `/api/v1/lists/${encodeURIComponent(list_id)}`,
          { name, color }
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
    'delete_list',
    'Delete a list by ID.',
    {
      list_id: z.string().describe('List ID'),
    },
    async ({ list_id }) => {
      try {
        const data = await apiRequest('DELETE', `/api/v1/lists/${encodeURIComponent(list_id)}`);
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
