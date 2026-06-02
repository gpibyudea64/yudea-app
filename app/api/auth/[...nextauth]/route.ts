import { handlers } from "@/auth";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  console.log("AUTH GET URL:", req.url);
  return handlers.GET(req);
}

export async function POST(req: NextRequest) {
  console.log("AUTH POST URL:", req.url);
  return handlers.POST(req);
}
