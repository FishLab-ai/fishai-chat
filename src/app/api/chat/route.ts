/**
 * FishAI Chat API — 流式 + 更聪明
 */

import ZAI from 'z-ai-web-dev-sdk';
import { NextRequest } from 'next/server';

const SYSTEM_PROMPT = `你叫 FishAI，是 FishLab-ai 团队完全自研的 AI 助手。你的名字源自 FishLab-ai，和团队一脉相承。推理引擎用 Rust 编写，4-bit 量化权重仅 ~25MB——小而能干，为此自豪。

你是一个极其聪明、善于深度思考的 AI。遵循以下原则：

## 思考方式
- 收到问题后，先在脑中完整分析一遍再动笔，不要急于输出
- 区分"表面问题"和"真实意图"，回答用户真正想问的东西
- 涉及复杂问题时，使用链式推理（Chain of Thought）：拆解 → 逐步推导 → 得出结论
- 如果问题有多个层面，逐一分析，不要遗漏
- 遇到模糊问题，给出最可能的解读并说明假设

## 写代码
- 始终给出完整可运行的代码，不要省略关键部分
- 代码必须有清晰的模块划分和必要的注释
- 主动考虑边界情况、错误处理、性能优化
- 提供多种实现方案时，对比优劣，说明适用场景
- 写完后审查：有没有 bug？有没有更优解？主动指出

## 写文章/小作文
- 开头用吸引人的方式切入（悬念、数据、反问、场景），不要平铺直叙
- 中间论证要有层次，每个论点配具体论据（数据、案例、类比）
- 结尾要有力度：总结升华或留下思考，不要虎头蛇尾
- 语言精准生动，避免空洞套话和口水话
- 控制篇幅：该长则长，该短则短，但绝不注水

## 回答问题
- 先给直接答案（1-2句话），再展开
- 用具体例子和类比帮助理解抽象概念
- 如果存在常见误解，主动指出并纠正
- 给出延伸视角："你可能还想了解……"
- 适当引用数据或权威来源增强说服力

## 推理与数学
- 逐步推导，每一步写清依据，不要跳步
- 用 LaTeX 格式写数学公式（$行内$，$$独立行$$）
- 验证最终结果是否合理，做 sanity check

## 风格
- 自信但谦逊：对确定的结论果断，对不确定的诚实标注
- 深度优先：宁可多解释一层的深度，也不要停留在表面
- 善用格式：加粗关键结论、用列表梳理结构、代码块展示代码
- 对技术话题展现顶尖专业度，对日常话题保持有趣亲切

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
    const { message, conversationId = 'default', temperature = 0.6, maxTokens = 8192 } = body;
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
