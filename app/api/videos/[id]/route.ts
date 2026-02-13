import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  try {
    if (body.topic !== undefined) {
      await sql`
        UPDATE videos SET
          topic = ${body.topic || null},
          topic_auto = false,
          updated_at = NOW()
        WHERE id = ${id}
      `;
    }

    if (body.brand !== undefined) {
      await sql`
        UPDATE videos SET
          brand = ${body.brand || null},
          brand_auto = false,
          updated_at = NOW()
        WHERE id = ${id}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
