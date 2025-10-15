import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/schema";

/**
 * POST /api/github/store-token
 *
 * Manually store GitHub token for testing purposes
 * This is a temporary solution until we implement proper OAuth token storage
 */
export async function POST(request: Request) {
  try {
    const { token, username } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const db = supabase as SupabaseClient<Database>;
    const { data, error } = await db.auth.getSession();

    if (error || !data.session?.user) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    // Store the token in the users table
    const updatePayload = {
      github_access_token: token,
      github_username: username ?? null,
    } satisfies Database["public"]["Tables"]["users"]["Update"];

    const { error: updateError } = await db
      .from("users")
      // TypeScript inference for Supabase client returns `never` for the update payload
      // despite the schema being supplied. Cast to never after validating the shape.
      .update(updatePayload as never)
      .eq("id", data.session.user.id);

    if (updateError) {
      console.error("Error storing GitHub token:", updateError);
      return NextResponse.json(
        { error: "Failed to store token" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in store-token API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
