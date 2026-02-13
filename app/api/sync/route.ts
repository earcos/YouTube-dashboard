import { NextResponse } from "next/server";
import { runSync } from "@/lib/sync";

export const maxDuration = 300;

export async function POST() {
  try {
    const result = await runSync();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
