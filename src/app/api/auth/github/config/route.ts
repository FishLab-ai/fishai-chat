import { NextResponse } from 'next/server';

export async function GET() {
  // GitHub OAuth is optional — return disabled by default
  const clientId = process.env.GITHUB_CLIENT_ID;
  return NextResponse.json({ enabled: !!clientId });
}