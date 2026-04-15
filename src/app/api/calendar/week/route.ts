import { NextResponse } from "next/server";
import { getWeekEntries } from "@/lib/planner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json(
      { error: "Missing required query params: from, to" },
      { status: 400 },
    );
  }

  try {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid from/to datetime" },
        { status: 400 },
      );
    }

    const entries = await getWeekEntries(fromDate, toDate);
    return NextResponse.json({ entries });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Failed to fetch planner entries",
        detail: err?.message ?? String(err),
      },
      { status: 500 },
    );
  }
}
