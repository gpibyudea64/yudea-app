import { NextResponse } from "next/server";

export async function GET() {
  // Only return non-sensitive info
  return NextResponse.json({
    hasSecret: !!process.env.NEXTAUTH_SECRET,
    secretLength: process.env.NEXTAUTH_SECRET?.length,
    secretFirstChar: process.env.NEXTAUTH_SECRET?.charAt(0),
    hasDbUrl: !!process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    netlify: !!process.env.NETLIFY,
  });
}
