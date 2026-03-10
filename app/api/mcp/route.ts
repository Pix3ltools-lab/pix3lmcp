import { NextRequest, NextResponse } from 'next/server';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { toReqRes, toFetchResponse } from 'fetch-to-node';
import { registerTools } from '@/src/tools/index';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const server = new McpServer({ name: 'pix3lmcp', version: '1.0.0' });
    registerTools(server);

    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    const { req, res } = toReqRes(request);
    await server.connect(transport);

    const body = await request.json();
    await transport.handleRequest(req, res, body);

    return toFetchResponse(res);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const server = new McpServer({ name: 'pix3lmcp', version: '1.0.0' });
    registerTools(server);

    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    const { req, res } = toReqRes(request);
    await server.connect(transport);

    await transport.handleRequest(req, res, undefined);

    return toFetchResponse(res);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const server = new McpServer({ name: 'pix3lmcp', version: '1.0.0' });
    registerTools(server);

    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    const { req, res } = toReqRes(request);
    await server.connect(transport);

    await transport.handleRequest(req, res, undefined);

    return toFetchResponse(res);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
