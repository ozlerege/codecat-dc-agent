import { getServerSession } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";

export default async function GuildsPage() {
  const session = await getServerSession();

  const userName =
    session?.user?.user_metadata?.custom_claims?.global_name ||
    session?.user?.user_metadata?.name ||
    session?.user?.email ||
    "User";

  return (
    <div className="min-h-screen p-8">
      <header className="flex items-center justify-between max-w-7xl mx-auto mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome, {userName}
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your Discord guilds and development tasks
          </p>
        </div>
        <SignOutButton />
      </header>

      <main className="max-w-7xl mx-auto">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Your Guilds</h2>
          <p className="text-muted-foreground">
            Guild management coming soon...
          </p>
        </div>
      </main>
    </div>
  );
}
