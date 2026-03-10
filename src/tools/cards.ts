import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiRequest } from '../api';

// MCP transport may serialize arrays/numbers as JSON strings — parse them back
const jsonArray = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((val) => {
    if (typeof val === 'string') { try { return JSON.parse(val); } catch { return val; } }
    return val;
  }, schema);

const jsonNumber = z.preprocess((val) => {
  if (typeof val === 'string') { const n = Number(val); return isNaN(n) ? val : n; }
  return val;
}, z.number());

export function registerCardTools(server: McpServer): void {
  server.tool(
    'list_cards',
    'List all cards in a board.',
    {
      board_id: z.string().describe('Board ID'),
    },
    async ({ board_id }) => {
      try {
        const data = await apiRequest('GET', `/api/v1/boards/${encodeURIComponent(board_id)}/cards`);
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
    'get_card',
    'Get a card by ID.',
    {
      card_id: z.string().describe('Card ID'),
    },
    async ({ card_id }) => {
      try {
        const data = await apiRequest('GET', `/api/v1/cards/${encodeURIComponent(card_id)}`);
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
    'create_card',
    'Create a new card in a list.',
    {
      list_id: z.string().describe('List ID'),
      title: z.string().describe('Card title'),
      description: z.string().optional().describe('Card description'),
      type: z.string().optional().describe('Card type'),
      priority: z.string().optional().describe('Card priority'),
      severity: z.string().optional().describe('Card severity'),
      effort: z.string().optional().describe('Card effort estimate'),
      tags: jsonArray(z.array(z.string())).optional().describe('Card tags'),
      due_date: z.string().optional().describe('Due date (ISO 8601)'),
      responsible: z.string().optional().describe('Responsible person'),
      prompt: z.string().optional().describe('AI prompt associated with the card'),
      ai_tool: z.string().optional().describe('AI tool used'),
      job_number: z.string().optional().describe('Job number (e.g. C-20-0001)'),
      rating: jsonNumber.int().min(1).max(5).optional().describe('Rating (1-5)'),
      links: jsonArray(z.array(z.object({ label: z.string(), url: z.string() }))).optional().describe('Links associated with the card'),
      checklist: jsonArray(z.array(z.object({ id: z.string(), text: z.string(), checked: z.boolean() }))).optional().describe('Checklist items'),
    },
    async ({ list_id, title, description, type, priority, severity, effort, tags, due_date, responsible, prompt, ai_tool, job_number, rating, links, checklist }) => {
      try {
        const data = await apiRequest('POST', '/api/v1/cards', {
          list_id,
          title,
          description,
          type,
          priority,
          severity,
          effort,
          tags,
          due_date,
          responsible,
          prompt,
          ai_tool,
          job_number,
          rating,
          links,
          checklist,
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
    'update_card',
    'Update an existing card.',
    {
      card_id: z.string().describe('Card ID'),
      title: z.string().optional().describe('New card title'),
      description: z.string().optional().describe('New card description'),
      type: z.string().optional().describe('Card type'),
      priority: z.string().optional().describe('Card priority'),
      severity: z.string().optional().describe('Card severity'),
      effort: z.string().optional().describe('Card effort estimate'),
      tags: jsonArray(z.array(z.string())).optional().describe('Card tags'),
      due_date: z.string().optional().describe('Due date (ISO 8601)'),
      responsible: z.string().optional().describe('Responsible person'),
      prompt: z.string().optional().describe('AI prompt associated with the card'),
      ai_tool: z.string().optional().describe('AI tool used'),
      job_number: z.string().optional().describe('Job number (e.g. C-20-0001)'),
      rating: jsonNumber.int().min(1).max(5).optional().describe('Rating (1-5)'),
      links: jsonArray(z.array(z.object({ label: z.string(), url: z.string() }))).optional().describe('Links associated with the card'),
      checklist: jsonArray(z.array(z.object({ id: z.string(), text: z.string(), checked: z.boolean() }))).optional().describe('Checklist items'),
    },
    async ({ card_id, title, description, type, priority, severity, effort, tags, due_date, responsible, prompt, ai_tool, job_number, rating, links, checklist }) => {
      try {
        const data = await apiRequest(
          'PATCH',
          `/api/v1/cards/${encodeURIComponent(card_id)}`,
          { title, description, type, priority, severity, effort, tags, due_date, responsible, prompt, ai_tool, job_number, rating, links, checklist }
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
    'move_card',
    'Move a card to a different list and/or position.',
    {
      card_id: z.string().describe('Card ID'),
      list_id: z.string().describe('Target list ID'),
      position: z.number().int().min(0).describe('Position in the target list (0-based)'),
    },
    async ({ card_id, list_id, position }) => {
      try {
        const data = await apiRequest(
          'PATCH',
          `/api/v1/cards/${encodeURIComponent(card_id)}/move`,
          { list_id, position }
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
    'archive_card',
    'Archive a card.',
    {
      card_id: z.string().describe('Card ID'),
    },
    async ({ card_id }) => {
      try {
        const data = await apiRequest(
          'POST',
          `/api/v1/cards/${encodeURIComponent(card_id)}/archive?action=archive`
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
    'delete_card',
    'Delete a card by ID.',
    {
      card_id: z.string().describe('Card ID'),
    },
    async ({ card_id }) => {
      try {
        const data = await apiRequest('DELETE', `/api/v1/cards/${encodeURIComponent(card_id)}`);
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
