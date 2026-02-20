import { NextResponse } from "next/server";
import { ingestMessage } from "@/lib/ingest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { text?: string };
    if (!body?.text || typeof body.text !== "string") {
      return NextResponse.json({ error: "Missing body.text" }, { status: 400 });
    }

    const result = await ingestMessage(body.text);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Ingest failed", detail: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}
