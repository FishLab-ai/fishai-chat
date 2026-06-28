import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { encrypted: _encrypted } = await request.json();
    // Placeholder — actual decryption requires server-side secret
    return NextResponse.json({ error: 'GitHub 登录暂未配置' }, { status: 501 });
  } catch {
    return NextResponse.json({ error: '解密失败' }, { status: 500 });
  }
}