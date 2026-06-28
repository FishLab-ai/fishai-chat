import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/memory?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: '缺少 userId' }, { status: 400 });
    }

    const memories = await prisma.memory.findMany({
      where: { userId },
      orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
    });

    return NextResponse.json(memories);
  } catch (error) {
    console.error('Get memories error:', error);
    return NextResponse.json({ error: '获取记忆失败' }, { status: 500 });
  }
}

// POST /api/memory
export async function POST(request: NextRequest) {
  try {
    const { userId, type, content, category, pinned } = await request.json();

    if (!userId || !content) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const memory = await prisma.memory.create({
      data: {
        userId,
        type: type || 'manual',
        content,
        category: category || 'general',
        pinned: pinned || false,
      },
    });

    return NextResponse.json(memory);
  } catch (error) {
    console.error('Create memory error:', error);
    return NextResponse.json({ error: '创建记忆失败' }, { status: 500 });
  }
}

// PATCH /api/memory
export async function PATCH(request: NextRequest) {
  try {
    const { id, content, category, pinned } = await request.json();

    if (!id) {
      return NextResponse.json({ error: '缺少 id' }, { status: 400 });
    }

    const memory = await prisma.memory.update({
      where: { id },
      data: {
        ...(content !== undefined && { content }),
        ...(category !== undefined && { category }),
        ...(pinned !== undefined && { pinned }),
      },
    });

    return NextResponse.json(memory);
  } catch (error) {
    console.error('Update memory error:', error);
    return NextResponse.json({ error: '修改记忆失败' }, { status: 500 });
  }
}

// DELETE /api/memory?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: '缺少 id' }, { status: 400 });
    }

    await prisma.memory.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete memory error:', error);
    return NextResponse.json({ error: '删除记忆失败' }, { status: 500 });
  }
}