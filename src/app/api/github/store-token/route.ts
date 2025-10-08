import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session?.user) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    // Store the token in the users table
    const { error: updateError } = await supabase
      .from("users")
      .update({
        github_access_token: token,
        github_username: username || null,
      })
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
