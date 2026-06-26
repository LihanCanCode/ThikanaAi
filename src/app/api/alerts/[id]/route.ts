import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete the alert. RLS (if configured) or matching user_id ensures they only delete their own.
    const { error } = await supabase
      .from("saved_searches")
      .delete()
      .match({ id, user_id: user.id });

    if (error) {
      console.error(`[alerts/${id}] DB error:`, error);
      return NextResponse.json({ error: "Failed to delete alert" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[alerts/delete]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
