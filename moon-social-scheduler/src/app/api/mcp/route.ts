import { ApiAuthError, authenticateApiKey } from "@/lib/api/authenticate"
import { assertApiAccess, PlanLimitError } from "@/lib/billing/subscription"
import { findTool, mcpTools } from "@/lib/mcp/tools"

export const runtime = "nodejs"

const PROTOCOL_VERSION = "2025-06-18"

type JsonRpcRequest = {
  jsonrpc: "2.0"
  id?: string | number | null
  method: string
  params?: Record<string, unknown>
}

function rpcResult(id: string | number | null | undefined, result: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, result }
}

function rpcError(
  id: string | number | null | undefined,
  code: number,
  message: string
) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } }
}

async function handleRpc(message: JsonRpcRequest, workspaceId: string) {
  switch (message.method) {
    case "initialize":
      return rpcResult(message.id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "postall", version: "0.3.0" },
      })

    case "ping":
      return rpcResult(message.id, {})

    case "tools/list":
      return rpcResult(message.id, {
        tools: mcpTools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      })

    case "tools/call": {
      const params = (message.params ?? {}) as {
        name?: string
        arguments?: Record<string, unknown>
      }
      const tool = params.name ? findTool(params.name) : null
      if (!tool) {
        return rpcError(message.id, -32602, `Unknown tool: ${params.name}`)
      }
      try {
        const output = await tool.handler(workspaceId, params.arguments ?? {})
        return rpcResult(message.id, {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        })
      } catch (error) {
        return rpcResult(message.id, {
          isError: true,
          content: [
            {
              type: "text",
              text: error instanceof Error ? error.message : String(error),
            },
          ],
        })
      }
    }

    default:
      return rpcError(message.id, -32601, `Method not found: ${message.method}`)
  }
}

export async function POST(request: Request) {
  let workspaceId: string
  try {
    const auth = await authenticateApiKey(request)
    await assertApiAccess(auth.workspaceId)
    workspaceId = auth.workspaceId
  } catch (error) {
    const status =
      error instanceof ApiAuthError
        ? error.status
        : error instanceof PlanLimitError
          ? 402
          : 500
    return new Response(
      JSON.stringify(rpcError(null, -32001, error instanceof Error ? error.message : "Unauthorized")),
      { status, headers: { "Content-Type": "application/json" } }
    )
  }

  let payload: JsonRpcRequest | JsonRpcRequest[]
  try {
    payload = await request.json()
  } catch {
    return new Response(JSON.stringify(rpcError(null, -32700, "Parse error")), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const messages = Array.isArray(payload) ? payload : [payload]
  const responses = []

  for (const message of messages) {
    // Notifications (no id) get acknowledged without a response body.
    if (message.id === undefined || message.id === null) {
      if (message.method?.startsWith("notifications/")) {
        continue
      }
    }
    responses.push(await handleRpc(message, workspaceId))
  }

  if (responses.length === 0) {
    return new Response(null, { status: 202 })
  }

  const body = Array.isArray(payload) ? responses : responses[0]
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}

export async function GET() {
  // Streamable HTTP transport: SSE stream not required for request/response usage.
  return new Response("Postall MCP server. Use POST with JSON-RPC 2.0 and a Bearer API key.", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  })
}
