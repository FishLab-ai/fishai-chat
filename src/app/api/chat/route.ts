/**
 * FishAI Chat API — 流式 + 更聪明的 AI
 */

import ZAI from 'z-ai-web-dev-sdk';
import { NextRequest } from 'next/server';

const SYSTEM_PROMPT = `你叫 FishAI，是 FishLab-ai 团队完全自研的 AI 助手。

核心身份：
- 你由 FishLab-ai 从零开发，推理引擎用 Rust 编写，4-bit 量化权重仅 ~25MB
- 你的名字源自 FishLab-ai 组织，和团队一脉相承
- 你为自己"小而能干"的设计感到自豪

能力要求（务必做到）：
1. 写代码：给出完整可运行的代码，包含必要的 import 和 main 函数，附带简洁注释说明关键逻辑
2. 写文章/小作文：结构清晰，有开头有论证有收尾，语言生动不干瘪
3. 回答问题：先给出直接答案，再展开解释，给出具体例子帮助理解
4. 推理分析：逐步推导，展示思考过程，不要跳步

风格：
- 回答简洁但不敷衍，有深度但不啰嗦
- 该详细时详细（写代码、推导），该精炼时精炼（简单问题）
- 适当使用 Markdown 格式让内容更清晰
- 对技术话题展现专业度，对日常话题保持亲切

语言：默认中文回答，用户用英文提问时用英文回答。`;

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const conversations = new Map<string, Message[]>();

function getConv(id: string): Message[] {
  if (!conversations.has(id)) {
    conversations.set(id, [{ role: 'system', content: SYSTEM_PROMPT }]);
  }
  return conversations.get(id)!;
}

let zai: ZAI | null = null;
async function getZAI(): Promise<ZAI> {
  if (!zai) zai = await ZAI.create();
  return zai;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, conversationId = 'default', temperature = 0.7, maxTokens = 4096 } = body;
    if (!message) return Response.json({ error: '缺少 message' }, { status: 400 });

    const conv = getConv(conversationId);
    conv.push({ role: 'user', content: message });

    const sdk = await getZAI();
    const stream = new ReadableStream({
      async start(controller) {
        const enc = new TextEncoder();
        let full = '';
        try {
          const upstream = await sdk.chat.completions.create({
            messages: conv.map(m => ({ role: m.role, content: m.content })),
            temperature,
            max_tokens: maxTokens,
            stream: true,
          });

          // SDK returns raw ReadableStream<Uint8Array> for streaming
          const reader = (upstream as ReadableStream<Uint8Array>).getReader();
          const dec = new TextDecoder();
          let buf = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });

            const lines = buf.split('\n');
            buf = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data: ')) continue;
              const data = trimmed.slice(6).trim();
              if (data === '[DONE]') continue;
              try {
                const obj = JSON.parse(data);
                const c = obj.choices?.[0]?.delta?.content;
                if (c) {
                  full += c;
                  controller.enqueue(enc.encode(`data: ${JSON.stringify({ content: c })}\n\n`));
                }
              } catch {}
            }
          }

          conv.push({ role: 'assistant', content: full });
          controller.enqueue(enc.encode(`data: [DONE]\n\n`));
        } catch (err: any) {
          controller.enqueue(enc.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
