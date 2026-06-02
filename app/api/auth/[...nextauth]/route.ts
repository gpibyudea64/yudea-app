import { handlers } from "@/auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  console.log("AUTH GET URL:", req.url);
  return handlers.GET(req);
}

export async function POST(req: Request) {
  console.log("AUTH POST URL:", req.url);
  return handlers.POST(req);
}
