import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/user?id=xxx — get user info
export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: '缺少 id' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const { password: _, ...safeUser } = user;
    return NextResponse.json(safeUser);
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: '获取用户信息失败' }, { status: 500 });
  }
}

// PATCH /api/user — update user (name, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const { id, name } = await request.json();

    if (!id) {
      return NextResponse.json({ error: '缺少 id' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { name },
    });

    const { password: _, ...safeUser } = user;
    return NextResponse.json(safeUser);
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: '修改失败' }, { status: 500 });
  }
}

// DELETE /api/user — delete user account
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: '缺少 id' }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: '注销失败' }, { status: 500 });
  }
}