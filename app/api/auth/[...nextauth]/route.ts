import { handlers } from "@/auth";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: any) {
  console.log("AUTH GET URL:", req.url);
  return handlers.GET(req, ctx);
}

export async function POST(req: Request, ctx: any) {
  console.log("AUTH POST URL:", req.url);
  return handlers.POST(req, ctx);
}
