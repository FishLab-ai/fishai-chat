import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

const ENGINE_URL = process.env.ENGINE_URL || 'http://localhost:8900';

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId, userId, deepThinking, webSearch } = await request.json();

    if (!message || !userId) {
      return new Response(JSON.stringify({ error: '缺少必要参数' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get or create conversation
    let convId = conversationId;
    if (!convId) {
      const conv = await prisma.conversation.create({
        data: { userId, title: message.slice(0, 50) },
      });
      convId = conv.id;
    }

    // Save user message
    await prisma.message.create({
      data: {
        role: 'user',
        content: message,
        conversationId: convId,
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: convId },
      data: { updatedAt: new Date() },
    });

    // Try to get a response from the engine or use fallback
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: object) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          // Web search (placeholder - would integrate with search API)
          if (webSearch) {
            send({ type: 'search', content: '搜索功能开发中...' });
          }

          // Deep thinking placeholder
          if (deepThinking) {
            send({ type: 'thinking', content: '正在思考中...' });
          }

          // Try to call the local engine
          let responseText = '';
          try {
            const engineRes = await fetch(`${ENGINE_URL}/api/model/generate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: message, max_tokens: 512 }),
              signal: AbortSignal.timeout(15000),
            });

            if (engineRes.ok) {
              const data = await engineRes.json();
              responseText = data.text || data.message || '模型已加载但未生成内容。';
            } else {
              responseText = 'FishAI 引擎暂时不可用，请稍后再试。';
            }
          } catch {
            responseText = 'FishAI 引擎未连接。请确保 fishai-engine 正在运行。';
          }

          // Stream the response content
          if (deepThinking) {
            // Send empty thinking close
            send({ type: 'thinking', content: '' });
          }

          // Simulate streaming by sending content in chunks
          const words = responseText.split('');
          for (let i = 0; i < words.length; i += 3) {
            send({ type: 'content', content: words.slice(i, i + 3).join('') });
            await new Promise((r) => setTimeout(r, 10));
          }

          // Save assistant message to DB
          await prisma.message.create({
            data: {
              role: 'assistant',
              content: responseText,
              conversationId: convId,
              searchResults: webSearch ? '搜索功能开发中' : null,
            },
          });

          send({ type: 'done', conversationId: convId });
        } catch (error) {
          console.error('Chat stream error:', error);
          send({ type: 'error', error: '生成回复时出错' });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ error: '请求失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}