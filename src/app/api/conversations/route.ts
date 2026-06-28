import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: '缺少 userId' }, { status: 400 });
    }

    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { messages: true } } },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('List conversations error:', error);
    return NextResponse.json({ error: '获取对话列表失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, title } = await request.json();

    if (!userId || !title) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const conversation = await prisma.conversation.create({
      data: { userId, title },
    });

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json({ error: '创建对话失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { conversationId, userId } = await request.json();

    if (!conversationId || !userId) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    await prisma.conversation.deleteMany({
      where: { id: conversationId, userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete conversation error:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}